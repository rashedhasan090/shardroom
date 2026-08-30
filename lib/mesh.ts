import Peer, { DataConnection } from "peerjs";
import { hostPeerId } from "./codes";
import { electGenerator, isWire, type DeviceInfo, type Wire } from "./types";

export type MeshHandlers = {
  onSelf: (device: DeviceInfo) => void;
  onRoster: (devices: DeviceInfo[], generatorId: string | null) => void;
  onWire: (msg: Wire, fromPeerId: string) => void;
  onStatus: (text: string) => void;
};

export class KilnMesh {
  private peer: Peer | null = null;
  private readonly conns = new Map<string, DataConnection>();
  private readonly devices = new Map<string, DeviceInfo>();
  private generatorId: string | null = null;
  private destroyed = false;
  private self: DeviceInfo;
  private host = false;

  constructor(
    private readonly code: string,
    seed: Omit<DeviceInfo, "peerId" | "isHost">,
    private readonly handlers: MeshHandlers,
  ) {
    this.self = {
      ...seed,
      peerId: "",
      isHost: false,
    };
    void this.boot();
  }

  get peerId(): string {
    return this.self.peerId;
  }

  get isHost(): boolean {
    return this.host;
  }

  broadcast(msg: Wire): void {
    const payload = JSON.stringify(msg);
    for (const conn of this.conns.values()) {
      if (conn.open) conn.send(payload);
    }
  }

  destroy(): void {
    this.destroyed = true;
    for (const conn of this.conns.values()) {
      conn.close();
    }
    this.conns.clear();
    this.peer?.destroy();
    this.peer = null;
  }

  private async boot(): Promise<void> {
    this.handlers.onStatus("Claiming the kiln mark…");
    try {
      const claimed = await this.tryHost();
      if (this.destroyed) return;
      if (!claimed) {
        await this.joinAsShard();
      }
    } catch {
      if (!this.destroyed) this.enterSolo("PeerJS signaling did not answer.");
    }
  }

  private enterSolo(reason: string): void {
    const id = `solo${this.code}${Math.random().toString(36).slice(2, 6)}`;
    this.host = true;
    this.self = { ...this.self, peerId: id, isHost: true };
    this.devices.clear();
    this.devices.set(id, this.self);
    this.generatorId = id;
    this.handlers.onSelf(this.self);
    this.publishRoster();
    this.handlers.onStatus(`${reason} Sitting as a lone shard until the lobby is reachable.`);
  }

  private tryHost(): Promise<boolean> {
    return new Promise((resolve) => {
      const id = hostPeerId(this.code);
      let peer: Peer;
      try {
        peer = new Peer(id);
      } catch {
        resolve(false);
        return;
      }
      let settled = false;

      const succeed = () => {
        if (settled || this.destroyed) return;
        settled = true;
        this.peer = peer;
        this.host = true;
        this.self = { ...this.self, peerId: id, isHost: true };
        this.devices.set(id, this.self);
        this.generatorId = electGenerator([...this.devices.values()]);
        this.bindPeer(peer);
        this.handlers.onSelf(this.self);
        this.emitRoster();
        this.handlers.onStatus("You hold the kiln mark. Waiting for shards.");
        resolve(true);
      };

      const fail = () => {
        if (settled) return;
        settled = true;
        peer.destroy();
        resolve(false);
      };

      peer.on("open", succeed);
      peer.on("error", (err: { type?: string }) => {
        if (err.type === "unavailable-id") {
          fail();
          return;
        }
        if (!settled) {
          this.handlers.onStatus("Signaling hiccup. Retrying as a seated shard…");
          fail();
        }
      });

      window.setTimeout(() => {
        if (!settled) fail();
      }, 4000);
    });
  }

  private joinAsShard(): Promise<void> {
    return new Promise((resolve) => {
      let peer: Peer;
      try {
        peer = new Peer();
      } catch {
        this.enterSolo("Could not construct a PeerJS client.");
        resolve();
        return;
      }
      this.peer = peer;
      let settled = false;

      const succeed = (id: string) => {
        if (settled || this.destroyed) return;
        settled = true;
        this.host = false;
        this.self = { ...this.self, peerId: id, isHost: false };
        this.devices.set(id, this.self);
        this.handlers.onSelf(this.self);
        this.publishRoster();
        this.bindPeer(peer);
        this.handlers.onStatus("Seating this shard in the ring…");
        this.connectTo(hostPeerId(this.code), true);
        resolve();
      };

      peer.on("open", succeed);
      peer.on("error", () => {
        if (settled) return;
        settled = true;
        peer.destroy();
        this.enterSolo("Could not reach the PeerJS lobby.");
        resolve();
      });

      window.setTimeout(() => {
        if (settled) return;
        settled = true;
        peer.destroy();
        this.enterSolo("The PeerJS lobby timed out.");
        resolve();
      }, 5000);
    });
  }

  private bindPeer(peer: Peer): void {
    peer.on("connection", (conn) => {
      this.attachConn(conn, false);
    });
    peer.on("disconnected", () => {
      if (this.destroyed) return;
      this.handlers.onStatus("Dropped from signaling. Reconnecting…");
      peer.reconnect();
    });
  }

  private connectTo(peerId: string, handshake: boolean): void {
    if (!this.peer || peerId === this.self.peerId || this.conns.has(peerId)) return;
    const conn = this.peer.connect(peerId, { reliable: true });
    this.attachConn(conn, handshake);
  }

  private attachConn(conn: DataConnection, requestHello: boolean): void {
    this.conns.set(conn.peer, conn);

    const onOpen = () => {
      conn.send(JSON.stringify({ v: 1, t: "hello", device: this.self } satisfies Wire));
      if (this.host) {
        this.emitRoster();
      }
    };

    if (conn.open) onOpen();
    else conn.on("open", onOpen);

    conn.on("data", (raw) => {
      this.onData(raw, conn.peer);
    });

    conn.on("close", () => {
      this.conns.delete(conn.peer);
      this.devices.delete(conn.peer);
      if (this.host) this.emitRoster();
      else this.publishRoster();
    });

    conn.on("error", () => {
      this.conns.delete(conn.peer);
    });

    if (requestHello) {
      window.setTimeout(() => {
        if (!conn.open) {
          this.handlers.onStatus("The kiln mark is quiet. Is another tab holding it?");
        }
      }, 6000);
    }
  }

  private onData(raw: unknown, fromPeerId: string): void {
    const parsed = parsePayload(raw);
    if (!parsed || !isWire(parsed)) return;

    switch (parsed.t) {
      case "hello":
        this.devices.set(parsed.device.peerId, parsed.device);
        if (this.host) {
          this.meshConnectMissing();
          this.emitRoster();
        }
        this.handlers.onWire(parsed, fromPeerId);
        break;
      case "roster":
        for (const device of parsed.devices) {
          this.devices.set(device.peerId, device);
        }
        this.generatorId = parsed.generatorId;
        this.meshConnectMissing();
        this.publishRoster();
        this.handlers.onWire(parsed, fromPeerId);
        break;
      case "prompt":
      case "begin":
      case "token":
      case "done":
      case "abort":
        this.handlers.onWire(parsed, fromPeerId);
        break;
      default: {
        const _exhaustive: never = parsed;
        void _exhaustive;
        break;
      }
    }
  }

  private meshConnectMissing(): void {
    for (const id of this.devices.keys()) {
      this.connectTo(id, false);
    }
  }

  private emitRoster(): void {
    const devices = [...this.devices.values()];
    this.generatorId = electGenerator(devices);
    const msg: Wire = {
      v: 1,
      t: "roster",
      devices,
      generatorId: this.generatorId ?? "",
    };
    this.broadcast(msg);
    this.publishRoster();
  }

  private publishRoster(): void {
    const devices = [...this.devices.values()];
    if (!devices.some((d) => d.peerId === this.self.peerId)) {
      devices.push(this.self);
    }
    this.generatorId = electGenerator(devices) ?? this.generatorId;
    this.handlers.onRoster(devices, this.generatorId);
  }
}

function parsePayload(raw: unknown): unknown {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return raw;
}
