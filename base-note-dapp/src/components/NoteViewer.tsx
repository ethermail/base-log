"use client";


import { txUrl } from "../lib/explorer";
import { useEffect, useRef, useState } from "react";
import { getReadContract } from "../lib/contract";

type NoteState = {
  note: string;
  length: number;
  hasNote: boolean;
  lastBlock?: number;
  lastTx?: string;
  error?: string;
};

function explorerBase(chainId: number) {
  if (chainId === 8453) return "https://basescan.org";
  if (chainId === 84532) return "https://sepolia.basescan.org";
  return "";
}

export function NoteViewer() {
  
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied!");
    } catch {
      prompt("Copy this:", text);
    }
  }

const [state, setState] = useState<NoteState>({
    note: "",
    length: 0,
    hasNote: false,
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function load() {
    try {
      const c = await getReadContract();
      const note = (await c.note()) as string;
      const length = Number(await c.noteLength());
      const hasNote = (await c.hasNote()) as boolean;

      setState((s) => ({ ...s, note, length, hasNote }));
    } catch (e: any) {
      setState({
        note: "",
        length: 0,
        hasNote: false,
        error: e?.message ?? String(e),
      });
    }
  }

  useEffect(() => {
    let cleanup: (() => void) | null = null;

    (async () => {
      await load();

      try {
        const c = await getReadContract();
        const provider = c.runner?.provider;
        const network = await provider?.getNetwork();
        const chainId = Number(network?.chainId ?? 0);

        const onUpdated = (...args: any[]) => {
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
            }));
          }, 300);
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

          <div className="whitespace-pre-wrap rounded-md bg-zinc-50 dark:bg-zinc-900 p-3">
            {state.note || "(empty)"}
          </div>

          {state.lastBlock && state.lastTx ? (
            <div className="text-xs text-zinc-600 space-y-1">
              <div>Last update block: {state.lastBlock}</div>
              <div className="break-all">
                Tx:&nbsp;
                <a
                  href={`${explorerBase(84532)}/tx/${state.lastTx}`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  {state.lastTx}
                </a>
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
