"use client";

import { useMemo, useState } from "react";
import { getWriteContract } from "../lib/contract";

const MAX_NOTE_BYTES = 280;

function byteLength(str: string) {
  return new TextEncoder().encode(str).length;
}

export function NoteEditor({ onSaved }: { onSaved?: () => void }) {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<"idle" | "signing" | "mining" | "done">("idle");
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");

  const used = useMemo(() => byteLength(value), [value]);
  const remaining = MAX_NOTE_BYTES - used;
  const overLimit = remaining < 0;

  async function submit() {
    setError("");
    setTxHash("");

    if (overLimit) {
      setError(`Note exceeds ${MAX_NOTE_BYTES} bytes`);
      return;
    }

    try {
      setStatus("signing");
      const c = await getWriteContract();
      const tx = await c.setNote(value);

      setTxHash(tx.hash as string);
      setStatus("mining");

      await tx.wait();
      setStatus("done");
      onSaved?.();
    } catch (e: any) {
      setStatus("idle");
      setError(e?.message ?? String(e));
    }
  }

  return (
    <section className="rounded-lg border p-4 space-y-3">
      <h2 className="text-sm font-medium">Write note</h2>

      <textarea
        className={`w-full rounded-md border p-2 ${
          overLimit ? "border-red-500" : ""
        }`}
        rows={4}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type your note..."
      />

      <div className="flex items-center justify-between text-xs">
        <span className={overLimit ? "text-red-600" : "text-zinc-600"}>
          {used} / {MAX_NOTE_BYTES} bytes
        </span>
        <span className={overLimit ? "text-red-600" : "text-zinc-600"}>
          {remaining} remaining
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={submit}
          disabled={status === "signing" || status === "mining" || overLimit}
          className="px-4 py-2 rounded-lg border hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/10"
        >
          {status === "idle" && "Save on-chain"}
          {status === "signing" && "Confirm in wallet..."}
          {status === "mining" && "Mining..."}
          {status === "done" && "Saved ✅"}
        </button>

        {txHash ? (
          <span className="text-xs text-zinc-600 break-all">tx: {txHash}</span>
        ) : null}
      </div>

      {error ? <p className="text-sm text-red-600 break-words">{error}</p> : null}
    </section>
  );
}
