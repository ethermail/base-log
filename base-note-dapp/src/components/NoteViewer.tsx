"use client";

import { useEffect, useRef, useState } from "react";
import { getReadContract } from "../lib/contract";

type NoteState = {
  note: string;
  length: number;
  hasNote: boolean;
  error?: string;
};

export function NoteViewer() {
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
      setState({ note, length, hasNote });
    } catch (e: any) {
      setState({ note: "", length: 0, hasNote: false, error: e?.message ?? String(e) });
    }
  }

  useEffect(() => {
    let cleanup: (() => void) | null = null;

    (async () => {
      await load();

      try {
        const c = await getReadContract();

        const onUpdated = () => {
          // debounce: collapse bursts of events into one refresh
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            load();
          }, 300);
        };

        // ethers v6 supports .on(eventName, listener)
        c.on("NoteUpdated", onUpdated);

        cleanup = () => {
          if (timerRef.current) clearTimeout(timerRef.current);
          c.off("NoteUpdated", onUpdated);
        };
      } catch {
        // if address missing or no wallet, load() already sets error
      }
    })();

    return () => {
      cleanup?.();
    };
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
        </>
      )}
    </section>
  );
}
