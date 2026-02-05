"use client";

import { useEffect, useState } from "react";
import { getReadContract } from "../lib/contract";

type NoteState = {
  note: string;
  length: number;
  hasNote: boolean;
  error?: string;
};

export function NoteViewer({ refreshKey = 0 }: { refreshKey?: number }) {
  const [state, setState] = useState<NoteState>({
    note: "",
    length: 0,
    hasNote: false,
  });

  useEffect(() => {
    (async () => {
      try {
        const c = await getReadContract();
        const note = (await c.note()) as string;
        const length = Number(await c.noteLength());
        const hasNote = (await c.hasNote()) as boolean;

        setState({ note, length, hasNote });
      } catch (e: any) {
        setState({ note: "", length: 0, hasNote: false, error: e?.message ?? String(e) });
      }
    })();
  }, [refreshKey]);

  return (
    <section className="rounded-lg border p-4 space-y-2">
      <h2 className="text-sm font-medium">On-chain note</h2>

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
