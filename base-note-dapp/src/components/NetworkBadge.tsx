"use client";

import { useEffect, useMemo, useState } from "react";
import { getBaseNoteAddress } from "../lib/addresses";

type EthLike = {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
  on?: (event: string, handler: (...args: any[]) => void) => void;
  removeListener?: (event: string, handler: (...args: any[]) => void) => void;
};

const BASE_MAINNET = 8453;
const BASE_SEPOLIA = 84532;

function parseChainId(hexOrNum: unknown): number | null {
  if (typeof hexOrNum === "number") return hexOrNum;
  if (typeof hexOrNum === "string") {
    if (hexOrNum.startsWith("0x")) return parseInt(hexOrNum, 16);
    const n = Number(hexOrNum);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function chainName(chainId: number) {
  if (chainId === BASE_MAINNET) return "Base Mainnet";
  if (chainId === BASE_SEPOLIA) return "Base Sepolia";
  return `Chain ${chainId}`;
}

function explorerBase(chainId: number) {
  if (chainId === BASE_MAINNET) return "https://basescan.org";
  if (chainId === BASE_SEPOLIA) return "https://sepolia.basescan.org";
  return "";
}

export function NetworkBadge({ expectedChainId }: { expectedChainId?: number }) {
  const ethereum = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return (window as any).ethereum as EthLike | undefined;
  }, []);

  const [chainId, setChainId] = useState<number | null>(null);
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  async function refresh() {
    setError("");
    if (!ethereum) {
      setChainId(null);
      return;
    }
    try {
      const v = await ethereum.request({ method: "eth_chainId" });
      setChainId(parseChainId(v));
    } catch (e: any) {
      setError(e?.message ?? String(e));
      setChainId(null);
    }
  }

  useEffect(() => {
    refresh();
    if (!ethereum?.on || !ethereum?.removeListener) return;

    const onChainChanged = () => refresh();
    ethereum.on("chainChanged", onChainChanged);

    return () => ethereum.removeListener?.("chainChanged", onChainChanged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="rounded-lg border p-3 text-sm text-red-600 break-words">
        {error}
      </div>
    );
  }

  if (!ethereum) {
    return (
      <div className="rounded-lg border p-3 text-sm text-zinc-600">
        Network: wallet not detected
      </div>
    );
  }

  if (chainId == null) {
    return (
      <div className="rounded-lg border p-3 text-sm text-zinc-600">
        Network: unknown
      </div>
    );
  }

  const ok = expectedChainId ? chainId === expectedChainId : true;

  let address: string | null = null;
  try {
    address = getBaseNoteAddress(chainId);
  } catch {
    address = null;
  }

  const explorer = explorerBase(chainId);
  const addressUrl = explorer && address ? `${explorer}/address/${address}` : "";

  async function copyAddress() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  }

  return (
    <div
      className={`rounded-lg border p-3 text-sm ${
        ok ? "text-zinc-700 dark:text-zinc-200" : "text-amber-700 dark:text-amber-300"
      }`}
    >
      <div>
        Network: <span className="font-medium">{chainName(chainId)}</span>{" "}
        <span className="text-xs opacity-70">(chainId: {chainId})</span>
      </div>

      {address ? (
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span className="font-mono truncate">{address}</span>
          <button
            onClick={copyAddress}
            className="px-2 py-1 rounded border hover:bg-black/5 dark:hover:bg-white/10"
            title="Copy contract address"
          >
            {copied ? "Copied" : "Copy"}
          </button>
          {addressUrl ? (
            <a
              href={addressUrl}
              target="_blank"
              rel="noreferrer"
              className="px-2 py-1 rounded border hover:bg-black/5 dark:hover:bg-white/10"
              title="Open in block explorer"
            >
              Explorer
            </a>
          ) : null}
        </div>
      ) : (
        <div className="mt-2 text-xs opacity-70">
          Contract address not configured for this network.
        </div>
      )}

      {!ok ? (
        <div className="mt-2 text-xs opacity-90">
          Wrong network. Please switch to chainId {expectedChainId}.
        </div>
      ) : null}
    </div>
  );
}
