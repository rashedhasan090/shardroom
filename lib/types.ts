export type ThinkMode = "live" | "demo";

export type DeviceInfo = {
  peerId: string;
  name: string;
  ramGb: number;
  cores: number;
  webgpu: boolean;
  weight: number;
  isHost: boolean;
};

export type TranscriptEntry =
  | { kind: "prompt"; id: string; from: string; text: string }
  | {
      kind: "answer";
      id: string;
      mode: ThinkMode;
      model: string | null;
      text: string;
      done: boolean;
    };

export type Wire =
  | { v: 1; t: "hello"; device: DeviceInfo }
  | { v: 1; t: "roster"; devices: DeviceInfo[]; generatorId: string }
  | { v: 1; t: "prompt"; promptId: string; text: string; from: string }
  | {
      v: 1;
      t: "begin";
      promptId: string;
      mode: ThinkMode;
      model: string | null;
    }
  | { v: 1; t: "token"; promptId: string; piece: string; seq: number }
  | { v: 1; t: "done"; promptId: string }
  | { v: 1; t: "abort"; promptId: string };

export function isWire(value: unknown): value is Wire {
  if (!value || typeof value !== "object") return false;
  const rec = value as { v?: unknown; t?: unknown };
  return rec.v === 1 && typeof rec.t === "string";
}

export function electGenerator(devices: DeviceInfo[]): string | null {
  if (devices.length === 0) return null;
  const ranked = [...devices].sort((a, b) => {
    if (b.weight !== a.weight) return b.weight - a.weight;
    return a.peerId.localeCompare(b.peerId);
  });
  return ranked[0]?.peerId ?? null;
}

export function assertNever(value: never): never {
  throw new Error(`Unhandled variant: ${String(value)}`);
}
