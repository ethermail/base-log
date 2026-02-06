"use client";

import { useEffect, useRef, useState } from "react";
import { getReadContract } from "../lib/contract";
import { txUrl } from "../lib/explorer";

const COPY_TOAST_MS = 1500;
const EVENT_DEBOUNCE_MS = 300;
const OPTIMISTIC_EVENT = "base_note_optimistic";

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
  const noteRef = useRef<HTMLDivElement | null>(null);

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
      setTimeout(() => setCopied(false), COPY_TOAST_MS);
    } catch {
      prompt("Copy this:", text);
    }
  }

  // Init + chain + contract events
  useEffect(() => {
    let cleanup: (() => void) | null = null;

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

      try {
        const c = await getReadContract();

        const onUpdated = (...args: any[]) => {
          const noteFromEvent = args?.[1] as string | undefined;
          const event = args[args.length - 1];
          const blockNumber = event?.log?.blockNumber;
          const txHash = event?.log?.transactionHash;

          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            load();
            setState((s) => ({
              ...s,
              lastBlock: blockNumber,
              lastTx: txHash,
              pendingTx: s.pendingTx === txHash ? undefined : s.pendingTx,
            }));

            requestAnimationFrame(() => {
              noteRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            });
          }, EVENT_DEBOUNCE_MS);

          setState((s) => ({
            ...s,
            note: noteFromEvent ?? s.note,
            lastBlock: blockNumber,
            lastTx: txHash,
            pendingTx: s.pendingTx === txHash ? undefined : s.pendingTx,
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

  // Optimistic updates
  useEffect(() => {
    const onOptimistic = (ev: Event) => {
      const e = ev as CustomEvent<{ note: string; txHash?: string }>;
      const note = e.detail?.note ?? "";
      const txHash = e.detail?.txHash;

      setState((s) => ({
        ...s,
        note,
        length: note.length,
        hasNote: note.length > 0,
        pendingTx: txHash ?? s.pendingTx ?? "pending",
      }));

      requestAnimationFrame(() => {
        noteRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });
    };

    window.addEventListener(OPTIMISTIC_EVENT, onOptimistic as any);
    return () =>
      window.removeEventListener(OPTIMISTIC_EVENT, onOptimistic as any);
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
                  >
                    View
                  </a>
                </div>
              ) : null}
            </div>
          ) : null}

          <div
            ref={noteRef}
            className="whitespace-pre-wrap rounded-md bg-zinc-50 dark:bg-zinc-900 p-3"
          >
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
                      onClick={(e) => disabled && e.preventDefault()}
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
