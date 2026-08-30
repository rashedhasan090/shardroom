import type { DeviceInfo } from "@/lib/types";

export function DeviceRail({
  devices,
  generatorId,
  selfId,
}: {
  devices: DeviceInfo[];
  generatorId: string | null;
  selfId: string | null;
}) {
  if (devices.length === 0) {
    return (
      <p className="text-sm text-clay-400">
        No other shards yet. Share the four-letter mark.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {devices.map((device) => {
        const bearer = device.peerId === generatorId;
        const mine = device.peerId === selfId;
        return (
          <li
            key={device.peerId}
            className={`rounded-xl border px-3 py-2 ${
              bearer
                ? "border-ember-400/60 bg-ember-500/10 generator-pulse"
                : "border-ink-700 bg-ink-900/80"
            }`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-medium text-clay-200">
                {device.name}
                {mine ? " (you)" : ""}
              </p>
              <p className="text-xs tabular-nums text-ember-300">weight {device.weight}</p>
            </div>
            <p className="mt-1 text-xs text-clay-400">
              {device.ramGb} GB · {device.cores} cores · GPU {device.webgpu ? "yes" : "no"}
              {device.isHost ? " · mark holder" : ""}
              {bearer ? " · kiln-bearer" : ""}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
