"use client";

import { useEffect, useRef, useState } from "react";
import { getReadContract } from "../lib/contract";
import { txUrl } from "../lib/explorer";

type NoteState = {
  note: string;
  length: number;
  hasNote: boolean;
  lastBlock?: number;
  lastTx?: string;
  pendingTx?: string;
  error?: string;
};

export function NoteViewer() {
  const [state, setState] = useState<NoteState>({
    note: "",
    length: 0,
    hasNote: false,
  });

  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function load() {
    try {
      const c = await getReadContract();
      const note = (await c.note()) as string;
      const length = Number(await c.noteLength());
      const hasNote = (await c.hasNote()) as boolean;

      setState((s) => ({ ...s, note, length, hasNote, error: undefined }));
    } catch (e: any) {
      setState((s) => ({
        ...s,
        error: e?.message ?? String(e),
      }));
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      prompt("Copy this:", text);
    }
  }

  useEffect(() => {
    let cleanup: (() => void) | null = null;

    (async () => {
      await load();

      // 1) Subscribe on-chain event for real-time updates
      try {
        const c = await getReadContract();

        const onUpdated = (...args: any[]) => {
          const noteFromEvent = args?.[1] as string | undefined;
          const event = args[args.length - 1];
          const blockNumber = event?.log?.blockNumber;
          const txHash = event?.log?.transactionHash;

          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            // Refresh on-chain source of truth after short debounce
            load();
            setState((s) => ({
              ...s,
              lastBlock: blockNumber,
              lastTx: txHash,
              // If the chain update matches (or simply arrived), clear pending
              pendingTx: s.pendingTx === txHash ? undefined : s.pendingTx,
            }));
          }, 300);

          // Fast-path optimistic clear if event came from our pending tx
          setState((s) => ({
            ...s,
            note: noteFromEvent ?? s.note,
            pendingTx: s.pendingTx === txHash ? undefined : s.pendingTx,
            lastBlock: blockNumber,
            lastTx: txHash,
          }));
        };

        c.on("NoteUpdated", onUpdated);

        cleanup = () => {
          if (timerRef.current) clearTimeout(timerRef.current);
          c.off("NoteUpdated", onUpdated);
        };
      } catch {
        // ignore
      }
    })();

    return () => cleanup?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) Listen optimistic updates from NoteEditor
  useEffect(() => {
    const onOptimistic = (ev: Event) => {
      const e = ev as CustomEvent<{ note: string; txHash?: string }>;
      const note = e.detail?.note ?? "";
      const txHash = e.detail?.txHash;

      setState((s) => ({
        ...s,
        note,
        length: note.length, // visual only; on-chain length may differ for non-ascii, but OK for optimistic UX
        hasNote: note.length > 0,
        pendingTx: txHash ?? s.pendingTx ?? "pending",
      }));
    };

    window.addEventListener("base_note_optimistic", onOptimistic as any);
    return () => window.removeEventListener("base_note_optimistic", onOptimistic as any);
  }, []);

  return (
    <section className="rounded-lg border p-4 space-y-2">
      <h2 className="text-sm font-medium">On-chain note (live)</h2>

      {state.error ? (
        <p className="text-sm text-red-600 break-words">{state.error}</p>
      ) : (
        <>
          <div className="text-sm text-zinc-600">
            hasNote: <span className="font-mono">{String(state.hasNote)}</span> • length:{" "}
            <span className="font-mono">{state.length}</span>
          </div>

          {state.pendingTx ? (
            <div className="text-xs text-amber-700 dark:text-amber-300">
              Pending update…
              {state.pendingTx.startsWith("0x") ? (
                <span className="ml-2 font-mono break-all">{state.pendingTx}</span>
              ) : null}
            </div>
          ) : null}

          <div className="whitespace-pre-wrap rounded-md bg-zinc-50 dark:bg-zinc-900 p-3">
            {state.note || "(empty)"}
          </div>

          {state.lastBlock && state.lastTx ? (
            <div className="text-xs text-zinc-600 space-y-1">
              <div>Last update block: {state.lastBlock}</div>

              <div className="flex items-center gap-2 text-xs break-all">
                <span>Tx:</span>
                <span className="font-mono">{state.lastTx}</span>

                <button
                  type="button"
                  onClick={() => copy(state.lastTx!)}
                  className="px-2 py-1 rounded border hover:bg-black/5 dark:hover:bg-white/10"
                  title="Copy transaction hash"
                >
                  Copy
                </button>

                  {copied ? <span className="text-xs text-green-600">Copied ✓</span> : null}

                  <a
                    href={txUrl(84532, state.lastTx!)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-1 rounded border hover:bg-black/5 dark:hover:bg-white/10"
                  title="Open transaction in explorer"
                >
                  Explorer
                </a>
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
