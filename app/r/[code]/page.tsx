import { Suspense } from "react";
import { notFound } from "next/navigation";
import { isRoomCode, normalizeRoomCode } from "@/lib/codes";
import { RoomClient } from "./room-client";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: raw } = await params;
  const code = normalizeRoomCode(raw);
  if (!isRoomCode(code)) notFound();

  return (
    <Suspense fallback={<RoomFallback code={code} />}>
      <RoomClient code={code} />
    </Suspense>
  );
}

function RoomFallback({ code }: { code: string }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-sm uppercase tracking-[0.2em] text-ember-300">kiln {code}</p>
      <h1 className="mt-3 font-display text-3xl text-clay-200">Warming the ring…</h1>
    </main>
  );
}
