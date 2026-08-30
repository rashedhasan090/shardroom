"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { KilnMark } from "@/components/kiln-mark";
import { SiteFooter } from "@/components/site-footer";
import { isRoomCode, mintRoomCode, normalizeRoomCode } from "@/lib/codes";

export default function HomePage() {
  const router = useRouter();
  const [join, setJoin] = useState("");
  const [error, setError] = useState<string | null>(null);

  const kindle = () => {
    const code = mintRoomCode();
    router.push(`/r/${code}`);
  };

  const onJoin = (event: FormEvent) => {
    event.preventDefault();
    const code = normalizeRoomCode(join);
    if (!isRoomCode(code)) {
      setError("Use four letters — A through Z.");
      return;
    }
    router.push(`/r/${code}`);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 pb-8 pt-8 sm:pt-14">
      <header className="flex items-center gap-3">
        <KilnMark className="h-10 w-10" />
        <p className="font-display text-xl tracking-wide text-clay-200">Shardroom</p>
      </header>

      <section className="mt-12 grid items-center gap-10 lg:mt-16 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-ember-300">browser mesh inference</p>
          <h1 className="mt-3 font-display text-4xl leading-[1.1] text-clay-200 sm:text-6xl">
            A kiln for leftover compute.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-clay-400 sm:text-lg">
            Open a four-letter kiln. Seat the phones and laptops already in the room. The
            heaviest shard writes; every screen recites the same sentence as it is born.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={kindle}
              className="rounded-2xl bg-ember-500 px-6 py-3.5 text-base font-medium text-ink-950 shadow-kiln transition hover:bg-ember-400"
            >
              Kindle a kiln
            </button>
            <p className="text-sm text-clay-400">No account. Nothing to install.</p>
          </div>
        </div>

        <form
          onSubmit={onJoin}
          className="rounded-3xl border border-ink-700 bg-ink-900/70 p-6 shadow-kiln"
        >
          <h2 className="font-display text-2xl text-clay-200">Already have a mark?</h2>
          <p className="mt-2 text-sm text-clay-400">Type the four letters. You will be weighed and seated.</p>
          <label htmlFor="join-code" className="sr-only">
            Four-letter kiln mark
          </label>
          <input
            id="join-code"
            value={join}
            onChange={(e) => {
              setJoin(normalizeRoomCode(e.target.value));
              setError(null);
            }}
            maxLength={4}
            spellCheck={false}
            autoCapitalize="characters"
            placeholder="KILN"
            className="mt-5 w-full rounded-2xl border border-ink-700 bg-ink-950 px-4 py-4 text-center font-display text-3xl tracking-[0.4em] text-ember-300 placeholder:text-ink-600 focus:border-ember-400 focus:outline-none"
          />
          {error ? <p className="mt-3 text-sm text-ember-400">{error}</p> : null}
          <button
            type="submit"
            className="mt-4 w-full rounded-2xl border border-ember-400/40 px-4 py-3 text-clay-200 transition hover:border-ember-400 hover:bg-ink-800"
          >
            Seat this shard
          </button>
        </form>
      </section>

      <section className="mt-16 grid gap-4 md:grid-cols-3">
        <Step
          n="01"
          title="Strike a kiln"
          body="Mint a four-letter mark and a link. The first device to hold the mark becomes the lobby."
        />
        <Step
          n="02"
          title="Seat a shard"
          body="Other devices enter the mark. Each is weighed by RAM, cores, and whether WebGPU is awake."
        />
        <Step
          n="03"
          title="Recite together"
          body="The kiln-bearer runs a small on-device model. Tokens lap the ring so every screen stays in lockstep."
        />
      </section>

      <section className="mt-12 rounded-3xl border border-ink-700 bg-ink-900/50 p-6 sm:p-8">
        <h2 className="font-display text-2xl text-clay-200">What this demo actually does</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-clay-400 sm:text-base">
          The kiln-bearer loads <strong className="font-medium text-clay-200">Qwen2.5-0.5B-Instruct</strong>{" "}
          in the browser with WebLLM. That is a small local model, not a 3.8B+ network split across
          phones. If WebGPU or the download fails, the ring switches to a clearly labeled demo
          recitation so the mesh can still be seen. Prompts are not posted to a backend we control.
        </p>
      </section>

      <SiteFooter />
    </main>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <article className="rounded-2xl border border-ink-700 bg-ink-900/40 p-5">
      <p className="text-xs tracking-[0.2em] text-ember-300">{n}</p>
      <h3 className="mt-2 font-display text-xl text-clay-200">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-clay-400">{body}</p>
    </article>
  );
}
