"use client";

import { useEffect, useMemo, useState } from "react";
import { getWriteContract } from "../lib/contract";
import { getExpectedChainId } from "../lib/config";

const MAX_NOTE_BYTES = 280;
const LS_KEY = "base_note_account";

type EthLike = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: any[]) => void) => void;
  removeListener?: (event: string, handler: (...args: any[]) => void) => void;
};

function byteLength(str: string) {
  return new TextEncoder().encode(str).length;
}

function parseChainId(hexOrNum: unknown): number | null {
  if (typeof hexOrNum === "number") return hexOrNum;
  if (typeof hexOrNum === "string") {
    if (hexOrNum.startsWith("0x")) return parseInt(hexOrNum, 16);
    const n = Number(hexOrNum);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function NoteEditor({ onSaved }: { onSaved?: () => void }) {
  const expectedChainId = getExpectedChainId();

  const [value, setValue] = useState("");
  const [status, setStatus] = useState<"idle" | "signing" | "mining" | "done">("idle");
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState<number | null>(null);

  const used = useMemo(() => byteLength(value), [value]);
  const remaining = MAX_NOTE_BYTES - used;
  const overLimit = remaining < 0;

  const ethereum = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return (window as any).ethereum as EthLike | undefined;
  }, []);

  useEffect(() => {
    function readAccount() {
      try {
        setAccount(localStorage.getItem(LS_KEY) ?? "");
      } catch {
        setAccount("");
      }
    }

    async function readChain() {
      if (!ethereum) {
        setChainId(null);
        return;
      }
      try {
        const v = await ethereum.request({ method: "eth_chainId" });
        setChainId(parseChainId(v));
      } catch {
        setChainId(null);
      }
    }

    readAccount();
    readChain();

    window.addEventListener("base_note_account_changed", readAccount);

    if (ethereum?.on && ethereum?.removeListener) {
      const onChainChanged = () => readChain();
      ethereum.on("chainChanged", onChainChanged);
      return () => {
        window.removeEventListener("base_note_account_changed", readAccount);
        ethereum.removeListener?.("chainChanged", onChainChanged);
      };
    }

    return () => window.removeEventListener("base_note_account_changed", readAccount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wrongNetwork = chainId !== null && chainId !== expectedChainId;

  async function submit() {
    setError("");
    setTxHash("");

    if (!account) {
      setError("Connect wallet first");
      return;
    }
    if (wrongNetwork) {
      setError(`Wrong network. Switch to chainId ${expectedChainId}`);
      return;
    }
    if (overLimit) {
      setError(`Note exceeds ${MAX_NOTE_BYTES} bytes`);
      return;
    }

    try {
      setStatus("signing");
      const c = await getWriteContract();
      const tx = await c.setNote(value);


      // Optimistic UI: update viewer immediately
      window.dispatchEvent(new CustomEvent("base_note_optimistic", { detail: { note: value, txHash: tx.hash } }));
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

  const disabled =
    status === "signing" || status === "mining" || overLimit || !account || wrongNetwork;

  return (
    <section className="rounded-lg border p-4 space-y-3">
      <h2 className="text-sm font-medium">Write note</h2>

      <textarea
        className={`w-full rounded-md border p-2 ${overLimit ? "border-red-500" : ""}`}
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

      {wrongNetwork ? (
        <div className="text-xs text-amber-700 dark:text-amber-300">
          Wrong network. Please switch to chainId {expectedChainId}.
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          onClick={submit}
          disabled={disabled}
          className="px-4 py-2 rounded-lg border hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/10"
          title={
            !account
              ? "Connect wallet first"
              : wrongNetwork
              ? `Switch to chainId ${expectedChainId}`
              : overLimit
              ? "Note too long"
              : ""
          }
        >
          {status === "idle" && "Save on-chain"}
          {status === "signing" && "Confirm in wallet..."}
          {status === "mining" && "Mining..."}
          {status === "done" && "Saved ✅"}
        </button>

        {!account ? (
          <span className="text-xs text-zinc-600">Connect wallet to enable writing</span>
        ) : null}

        {txHash ? <span className="text-xs text-zinc-600 break-all">tx: {txHash}</span> : null}
      </div>

      {error ? <p className="text-sm text-red-600 break-words">{error}</p> : null}
    </section>
  );
}
