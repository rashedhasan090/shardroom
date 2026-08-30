"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { streamDemoTokens } from "./demo";
import {
  LIVE_MODEL_ID,
  LIVE_MODEL_LABEL,
  loadLiveEngine,
  streamLiveTokens,
  type ModelProgress,
} from "./llm";
import { KilnMesh } from "./mesh";
import { pickShardName } from "./names";
import { probeCapabilities } from "./probe";
import type { DeviceInfo, ThinkMode, TranscriptEntry, Wire } from "./types";

export type KilnState = {
  self: DeviceInfo | null;
  devices: DeviceInfo[];
  generatorId: string | null;
  status: string;
  mode: ThinkMode | null;
  modelLabel: string | null;
  loadingModel: boolean;
  modelProgress: ModelProgress | null;
  transcript: TranscriptEntry[];
  laps: number;
  thinking: boolean;
};

const emptyState: KilnState = {
  self: null,
  devices: [],
  generatorId: null,
  status: "Warming the kiln…",
  mode: null,
  modelLabel: null,
  loadingModel: false,
  modelProgress: null,
  transcript: [],
  laps: 0,
  thinking: false,
};

export function useKiln(code: string, forceDemo: boolean) {
  const [state, setState] = useState<KilnState>(emptyState);
  const meshRef = useRef<KilnMesh | null>(null);
  const engineRef = useRef<Awaited<ReturnType<typeof loadLiveEngine>> | null>(null);
  const engineReadyRef = useRef(false);
  const loadAttemptedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const seqRef = useRef(0);
  const seenSeqRef = useRef(new Map<string, number>());
  const seenPromptRef = useRef(new Set<string>());
  const selfIdRef = useRef<string | null>(null);
  const generatorRef = useRef<string | null>(null);
  const loadFinishedRef = useRef(false);
  const pendingPromptRef = useRef<{ promptId: string; text: string } | null>(null);
  const forceDemoRef = useRef(forceDemo);
  forceDemoRef.current = forceDemo;

  const patch = useCallback((partial: Partial<KilnState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const applyToken = useCallback((promptId: string, piece: string, seq?: number) => {
    if (typeof seq === "number") {
      const prev = seenSeqRef.current.get(promptId) ?? 0;
      if (seq <= prev) return;
      seenSeqRef.current.set(promptId, seq);
    }
    setState((prev) => {
      const next = prev.transcript.map((entry) => {
        if (entry.kind === "answer" && entry.id === promptId) {
          return { ...entry, text: entry.text + piece };
        }
        return entry;
      });
      return { ...prev, transcript: next, laps: prev.laps + 1 };
    });
  }, []);

  const runGeneration = useCallback(
    async (promptId: string, text: string) => {
      abortRef.current?.abort();
      const abort = new AbortController();
      abortRef.current = abort;
      seqRef.current = 0;
      seenSeqRef.current.set(promptId, 0);

      if (!loadFinishedRef.current) {
        pendingPromptRef.current = { promptId, text };
        patch({ status: "Waiting for the kiln-bearer to finish seating the model…" });
        return;
      }

      const live = !forceDemoRef.current && engineReadyRef.current && engineRef.current;
      const mode: ThinkMode = live ? "live" : "demo";
      const model = live ? LIVE_MODEL_LABEL : null;

      meshRef.current?.broadcast({ v: 1, t: "begin", promptId, mode, model });
      setState((prev) => {
        const hasAnswer = prev.transcript.some(
          (entry) => entry.kind === "answer" && entry.id === promptId,
        );
        return {
          ...prev,
          mode,
          modelLabel: model,
          thinking: true,
          transcript: hasAnswer
            ? prev.transcript
            : [
                ...prev.transcript,
                { kind: "answer", id: promptId, mode, model, text: "", done: false },
              ],
        };
      });

      const onToken = (piece: string) => {
        if (abort.signal.aborted) return;
        seqRef.current += 1;
        applyToken(promptId, piece, seqRef.current);
        meshRef.current?.broadcast({
          v: 1,
          t: "token",
          promptId,
          piece,
          seq: seqRef.current,
        });
      };

      try {
        if (live && engineRef.current) {
          await streamLiveTokens(engineRef.current, text, onToken, abort.signal);
        } else {
          await streamDemoTokens(onToken, abort.signal);
        }
      } catch (err) {
        if (!abort.signal.aborted) {
          onToken(" The kiln-bearer stumbled; the ring continues in demo speech.");
        }
        void err;
      }

      if (!abort.signal.aborted) {
        meshRef.current?.broadcast({ v: 1, t: "done", promptId });
        setState((prev) => ({
          ...prev,
          thinking: false,
          transcript: prev.transcript.map((entry) =>
            entry.kind === "answer" && entry.id === promptId ? { ...entry, done: true } : entry,
          ),
        }));
      }
    },
    [applyToken, patch],
  );

  const runGenerationRef = useRef(runGeneration);
  runGenerationRef.current = runGeneration;

  const handleWire = useCallback(
    (msg: Wire) => {
      switch (msg.t) {
        case "hello":
        case "roster":
          return;
        case "prompt": {
          if (seenPromptRef.current.has(msg.promptId)) return;
          seenPromptRef.current.add(msg.promptId);
          setState((prev) => ({
            ...prev,
            transcript: [
              ...prev.transcript,
              { kind: "prompt", id: msg.promptId, from: msg.from, text: msg.text },
            ],
          }));
          if (selfIdRef.current && selfIdRef.current === generatorRef.current) {
            void runGenerationRef.current(msg.promptId, msg.text);
          }
          return;
        }
        case "begin":
          setState((prev) => {
            const hasAnswer = prev.transcript.some(
              (entry) => entry.kind === "answer" && entry.id === msg.promptId,
            );
            return {
              ...prev,
              mode: msg.mode,
              modelLabel: msg.model,
              thinking: true,
              transcript: hasAnswer
                ? prev.transcript
                : [
                    ...prev.transcript,
                    {
                      kind: "answer",
                      id: msg.promptId,
                      mode: msg.mode,
                      model: msg.model,
                      text: "",
                      done: false,
                    },
                  ],
            };
          });
          return;
        case "token":
          applyToken(msg.promptId, msg.piece, msg.seq);
          return;
        case "done":
          setState((prev) => ({
            ...prev,
            thinking: false,
            transcript: prev.transcript.map((entry) =>
              entry.kind === "answer" && entry.id === msg.promptId
                ? { ...entry, done: true }
                : entry,
            ),
          }));
          return;
        case "abort":
          abortRef.current?.abort();
          patch({ thinking: false });
          return;
        default: {
          const _exhaustive: never = msg;
          void _exhaustive;
        }
      }
    },
    [applyToken, patch],
  );

  const handleWireRef = useRef(handleWire);
  handleWireRef.current = handleWire;

  useEffect(() => {
    let cancelled = false;
    const start = async () => {
      const probe = await probeCapabilities();
      if (cancelled) return;
      const seed = {
        name: pickShardName(),
        ramGb: probe.ramGb,
        cores: probe.cores,
        webgpu: probe.webgpu,
        weight: probe.weight,
      };
      const mesh = new KilnMesh(code, seed, {
        onSelf: (device) => {
          selfIdRef.current = device.peerId;
          patch({ self: device, status: "This shard is seated." });
        },
        onRoster: (devices, generatorId) => {
          generatorRef.current = generatorId;
          patch({
            devices,
            generatorId,
            status: `${devices.length} shard${devices.length === 1 ? "" : "s"} in the ring.`,
          });
        },
        onWire: (msg) => handleWireRef.current(msg),
        onStatus: (text) => patch({ status: text }),
      });
      meshRef.current = mesh;
    };
    void start();
    return () => {
      cancelled = true;
      abortRef.current?.abort();
      meshRef.current?.destroy();
      meshRef.current = null;
    };
  }, [code, patch]);

  useEffect(() => {
    const selfId = state.self?.peerId;
    const generatorId = state.generatorId;
    if (!selfId || !generatorId || selfId !== generatorId) return;
    if (forceDemo) {
      engineReadyRef.current = false;
      loadFinishedRef.current = true;
      loadAttemptedRef.current = true;
      patch({
        mode: "demo",
        loadingModel: false,
        modelLabel: null,
        status: "Demo ring — forced. Not a model.",
      });
      const pending = pendingPromptRef.current;
      pendingPromptRef.current = null;
      if (pending) void runGenerationRef.current(pending.promptId, pending.text);
      return;
    }
    if (loadAttemptedRef.current) return;
    loadAttemptedRef.current = true;
    let cancelled = false;
    const load = async () => {
      patch({ loadingModel: true, status: `Seating ${LIVE_MODEL_LABEL} on this shard…` });
      try {
        const engine = await loadLiveEngine((progress) => {
          if (!cancelled) patch({ modelProgress: progress });
        });
        if (cancelled) return;
        engineRef.current = engine;
        engineReadyRef.current = true;
        loadFinishedRef.current = true;
        patch({
          loadingModel: false,
          mode: "live",
          modelLabel: LIVE_MODEL_LABEL,
          status: `${LIVE_MODEL_LABEL} is seated. Prompts will be live.`,
        });
      } catch {
        engineReadyRef.current = false;
        loadFinishedRef.current = true;
        patch({
          loadingModel: false,
          mode: "demo",
          modelLabel: null,
          status: "WebGPU or model load failed. This kiln will speak in a labeled demo ring.",
        });
      }
      const pending = pendingPromptRef.current;
      pendingPromptRef.current = null;
      if (pending) void runGenerationRef.current(pending.promptId, pending.text);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [forceDemo, patch, state.generatorId, state.self?.peerId]);

  const sendPrompt = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !meshRef.current) return;
    const promptId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const from = selfIdRef.current ?? "unknown";
    seenPromptRef.current.add(promptId);
    const msg: Wire = { v: 1, t: "prompt", promptId, text: trimmed, from };
    meshRef.current.broadcast(msg);
    setState((prev) => ({
      ...prev,
      transcript: [
        ...prev.transcript,
        { kind: "prompt", id: promptId, from, text: trimmed },
      ],
    }));
    if (selfIdRef.current && selfIdRef.current === generatorRef.current) {
      void runGenerationRef.current(promptId, trimmed);
    }
  }, []);

  return { ...state, sendPrompt, modelId: LIVE_MODEL_ID };
}
