"use client";

import { useEffect, useRef, useState } from "react";
import { getReadContract } from "../lib/contract";
import { txUrl } from "../lib/explorer";

type NoteState = {
  note: string;
  length: number;
  hasNote: boolean;
  loading: boolean;
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
    loading: true,
  });

  const [copied, setCopied] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function load() {
    setState((s) => ({ ...s, loading: true, error: undefined }));
    try {
      const c = await getReadContract();
      const note = (await c.note()) as string;
      const length = Number(await c.noteLength());
      const hasNote = (await c.hasNote()) as boolean;

      setState((s) => ({
        ...s,
        note,
        length,
        hasNote,
        loading: false,
        error: undefined,
      }));
    } catch (e: any) {
      setState((s) => ({
        ...s,
        loading: false,
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

    // Read chainId for explorer links
    const eth = (window as any).ethereum;
    async function readChain() {
      if (!eth?.request) return setChainId(null);
      try {
        const v = await eth.request({ method: "eth_chainId" });
        const id =
          typeof v === "string" && v.startsWith("0x")
            ? parseInt(v, 16)
            : Number(v);
        setChainId(Number.isFinite(id) ? id : null);
      } catch {
        setChainId(null);
      }
    }
    readChain();
    eth?.on?.("chainChanged", readChain);

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
          eth?.removeListener?.("chainChanged", readChain);
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
    return () =>
      window.removeEventListener("base_note_optimistic", onOptimistic as any);
  }, []);

  return (
    <section className="rounded-lg border p-4 space-y-2">
      <h2 className="text-sm font-medium">On-chain note (live)</h2>

      {state.loading ? (
        <div className="text-sm text-zinc-500">Loading note from chain…</div>
      ) : state.error ? (
        <p className="text-sm text-red-600 break-words">{state.error}</p>
      ) : (
        <>
          <div className="text-sm text-zinc-600">
            hasNote: <span className="font-mono">{String(state.hasNote)}</span>{" "}
            • length: <span className="font-mono">{state.length}</span>
          </div>

          {state.pendingTx ? (
            <div className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
              <div>Pending update…</div>

              {state.pendingTx.startsWith("0x") ? (
                <div className="flex items-center gap-2 break-all">
                  <span className="font-mono">{state.pendingTx}</span>
                  <a
                    href={txUrl(chainId ?? 84532, state.pendingTx)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-0.5 rounded border text-xs hover:bg-black/5 dark:hover:bg-white/10"
                    title="View pending transaction in explorer"
                  >
                    View
                  </a>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="whitespace-pre-wrap rounded-md bg-zinc-50 dark:bg-zinc-900 p-3">
            {state.hasNote ? state.note : "(no note yet)"}
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

                {copied ? (
                  <span className="text-xs text-green-600">Copied ✓</span>
                ) : null}

                {(() => {
                  const tx =
                    state.pendingTx && state.pendingTx.startsWith("0x")
                      ? state.pendingTx
                      : state.lastTx;

                  const disabled = !tx;

                  return (
                    <a
                      href={disabled ? undefined : txUrl(chainId ?? 84532, tx!)}
                      target="_blank"
                      rel="noreferrer"
                      className={`px-2 py-1 rounded border ${
                        disabled
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-black/5 dark:hover:bg-white/10"
                      }`}
                      title={
                        disabled
                          ? "No transaction hash available"
                          : "Open transaction in explorer"
                      }
                      onClick={(e) => {
                        if (disabled) e.preventDefault();
                      }}
                    >
                      Explorer
                    </a>
                  );
                })()}
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
