export const LIVE_MODEL_ID = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";
export const LIVE_MODEL_LABEL = "Qwen2.5-0.5B-Instruct";

export type ModelProgress = {
  text: string;
  progress: number;
};

type ChatEngine = {
  chat: {
    completions: {
      create: (opts: {
        messages: { role: "user" | "assistant" | "system"; content: string }[];
        stream: true;
        max_tokens: number;
        temperature: number;
      }) => Promise<AsyncIterable<{ choices: { delta?: { content?: string } }[] }>>;
    };
  };
  unload?: () => Promise<void>;
};

export async function loadLiveEngine(
  onProgress: (progress: ModelProgress) => void,
): Promise<ChatEngine> {
  // Dynamic import: WebLLM cannot run in a Server Component bundle.
  const webllm = await import("@mlc-ai/web-llm");
  const engine = await webllm.CreateMLCEngine(LIVE_MODEL_ID, {
    initProgressCallback: (report) => {
      onProgress({
        text: report.text,
        progress: report.progress,
      });
    },
  });
  return engine as ChatEngine;
}

export async function streamLiveTokens(
  engine: ChatEngine,
  prompt: string,
  onToken: (piece: string) => void,
  signal: AbortSignal,
): Promise<void> {
  const stream = await engine.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "You are a concise kiln-side companion. Answer in a few short sentences. No preamble.",
      },
      { role: "user", content: prompt },
    ],
    stream: true,
    max_tokens: 128,
    temperature: 0.7,
  });

  for await (const chunk of stream) {
    if (signal.aborted) return;
    const piece = chunk.choices[0]?.delta?.content;
    if (piece) onToken(piece);
  }
}
