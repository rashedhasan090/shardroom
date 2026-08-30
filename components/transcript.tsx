import type { TranscriptEntry } from "@/lib/types";

export function Transcript({
  entries,
  nameFor,
}: {
  entries: TranscriptEntry[];
  nameFor: (peerId: string) => string;
}) {
  if (entries.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-clay-400">
        The ring is quiet. Send a thought and every seated shard will recite the same words as
        they appear.
      </p>
    );
  }

  return (
    <ol className="space-y-4">
      {entries.map((entry) => {
        if (entry.kind === "prompt") {
          return (
            <li key={`p-${entry.id}`} className="rounded-xl bg-ink-800/80 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-clay-400">
                {nameFor(entry.from)} asked
              </p>
              <p className="mt-1 text-clay-200">{entry.text}</p>
            </li>
          );
        }
        return (
          <li key={`a-${entry.id}`} className="px-1">
            <p className="text-xs uppercase tracking-[0.14em] text-ember-300">
              {entry.mode === "live"
                ? `${entry.model ?? "on-device model"} · live`
                : "Demo ring · not a model"}
            </p>
            <p className="mt-1 whitespace-pre-wrap font-display text-lg leading-snug text-clay-200">
              {entry.text}
              {!entry.done ? <span className="ml-0.5 inline-block animate-pulse">▍</span> : null}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
