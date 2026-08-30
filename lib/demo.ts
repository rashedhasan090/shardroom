/** Spoken only when a real model cannot load. Never mixed with live tokens. */
const DEMO_SCRIPT = [
  "Demo ring — this is not a model.",
  " Chrome had no WebGPU, or Qwen2.5-0.5B would not seat in this kiln.",
  " The mesh still works: every shard recites the same words as they lap the ring.",
  " Strike a prompt on a machine with WebGPU to hear the small on-device model instead.",
].join("");

export async function streamDemoTokens(
  onToken: (piece: string) => void,
  signal: AbortSignal,
): Promise<void> {
  const words = DEMO_SCRIPT.split(/(\s+)/);
  for (const word of words) {
    if (signal.aborted) return;
    onToken(word);
    await pause(40 + Math.floor(Math.random() * 70), signal);
  }
}

function pause(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(resolve, ms);
    const onAbort = () => {
      window.clearTimeout(timer);
      resolve();
    };
    if (signal.aborted) {
      onAbort();
      return;
    }
    signal.addEventListener("abort", onAbort, { once: true });
  });
}
