"use client";

import { FormEvent, useState } from "react";

export function PromptWell({
  disabled,
  thinking,
  onSend,
}: {
  disabled: boolean;
  thinking: boolean;
  onSend: (text: string) => void;
}) {
  const [value, setValue] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue("");
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
      <label className="sr-only" htmlFor="kiln-prompt">
        Prompt the kiln
      </label>
      <textarea
        id="kiln-prompt"
        rows={2}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ask the kiln-bearer…"
        className="min-h-[3rem] flex-1 resize-y rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-clay-200 placeholder:text-clay-400/50 focus:border-ember-400 focus:outline-none"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!value.trim() || disabled) return;
            onSend(value);
            setValue("");
          }
        }}
      />
      <button
        type="submit"
        disabled={disabled || thinking || !value.trim()}
        className="rounded-xl bg-ember-500 px-4 py-3 font-medium text-ink-950 transition hover:bg-ember-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {thinking ? "Reciting…" : "Send around the ring"}
      </button>
    </form>
  );
}
