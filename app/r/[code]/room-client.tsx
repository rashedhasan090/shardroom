"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DeviceRail } from "@/components/device-rail";
import { KilnMark } from "@/components/kiln-mark";
import { MeshRing } from "@/components/mesh-ring";
import { PromptWell } from "@/components/prompt-well";
import { SiteFooter } from "@/components/site-footer";
import { Transcript } from "@/components/transcript";
import { useKiln } from "@/lib/use-kiln";

export function RoomClient({ code }: { code: string }) {
  const search = useSearchParams();
  const forceDemo = search.get("demo") === "1";
  const kiln = useKiln(code, forceDemo);
  const [copied, setCopied] = useState(false);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return `/r/${code}`;
    return `${window.location.origin}/r/${code}`;
  }, [code]);

  const nameFor = (peerId: string) => {
    const found = kiln.devices.find((d) => d.peerId === peerId);
    if (found) return found.name;
    if (peerId === kiln.self?.peerId) return kiln.self.name;
    return "a shard";
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const modeBanner =
    kiln.mode === "live"
      ? `Live · ${kiln.modelLabel ?? "on-device"}`
      : kiln.mode === "demo"
        ? "Demo ring · not a model"
        : kiln.loadingModel
          ? "Seating the small model…"
          : kiln.status;

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-8 pt-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 text-clay-200">
          <KilnMark className="h-8 w-8" />
          <span className="font-display text-lg">Shardroom</span>
        </Link>
        <p
          className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.14em] ${
            kiln.mode === "demo"
              ? "bg-ember-600/30 text-ember-300"
              : kiln.mode === "live"
                ? "bg-moss-600/40 text-clay-200"
                : "bg-ink-800 text-clay-400"
          }`}
        >
          {modeBanner}
        </p>
      </header>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-ember-300">kiln mark</p>
          <div className="mt-2 flex gap-2" aria-label={`Room code ${code}`}>
            {[...code].map((letter, i) => (
              <span key={`${letter}-${i}`} className="clay-tile text-2xl text-ember-300">
                {letter}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <code className="max-w-[16rem] truncate rounded-lg bg-ink-900 px-2 py-1 text-xs text-clay-400 sm:max-w-none">
            {shareUrl}
          </code>
          <button
            type="button"
            onClick={copy}
            className="rounded-lg border border-ink-700 px-3 py-1 text-sm text-clay-200 hover:border-ember-400"
          >
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      </div>

      {kiln.loadingModel && kiln.modelProgress ? (
        <div className="mt-4 rounded-xl border border-ink-700 bg-ink-900 px-4 py-3">
          <p className="text-xs text-clay-400">{kiln.modelProgress.text}</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-700">
            <div
              className="h-full bg-ember-400 transition-all"
              style={{ width: `${Math.round(kiln.modelProgress.progress * 100)}%` }}
            />
          </div>
        </div>
      ) : null}

      <p className="mt-4 text-sm text-clay-400">{kiln.status}</p>

      <section className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="rounded-3xl border border-ink-700 bg-ink-900/40 p-4 sm:p-6">
          <MeshRing
            devices={kiln.devices}
            generatorId={kiln.generatorId}
            selfId={kiln.self?.peerId ?? null}
            laps={kiln.laps}
          />
        </div>
        <aside className="rounded-3xl border border-ink-700 bg-ink-900/40 p-4 sm:p-5">
          <h2 className="font-display text-xl text-clay-200">Seated shards</h2>
          <p className="mb-4 mt-1 text-xs text-clay-400">
            Shard weight comes from RAM, cores, and WebGPU. The highest weight is the kiln-bearer.
          </p>
          <DeviceRail
            devices={kiln.devices}
            generatorId={kiln.generatorId}
            selfId={kiln.self?.peerId ?? null}
          />
        </aside>
      </section>

      <section className="mt-6 rounded-3xl border border-ink-700 bg-ink-900/50 p-4 sm:p-6">
        <h2 className="font-display text-xl text-clay-200">Shared recitation</h2>
        <div className="mt-4 max-h-[40vh] overflow-y-auto pr-1">
          <Transcript entries={kiln.transcript} nameFor={nameFor} />
        </div>
        <div className="mt-4">
          <PromptWell
            disabled={
              !kiln.self ||
              (kiln.self.peerId === kiln.generatorId &&
                (kiln.loadingModel || kiln.mode === null))
            }
            thinking={kiln.thinking}
            onSend={kiln.sendPrompt}
          />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
