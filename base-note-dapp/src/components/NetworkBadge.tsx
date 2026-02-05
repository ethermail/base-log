"use client";

import { useEffect, useMemo, useState } from "react";

type EthLike = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: any[]) => void) => void;
  removeListener?: (event: string, handler: (...args: any[]) => void) => void;
};

const BASE_MAINNET = 8453;
const BASE_SEPOLIA = 84532;

function parseChainId(hexOrNum: unknown): number | null {
  if (typeof hexOrNum === "number") return hexOrNum;
  if (typeof hexOrNum === "string") {
    // MetaMask returns hex string like "0x14a34" or "0x2105"
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

export function NetworkBadge({
  expectedChainId,
}: {
  expectedChainId?: number;
}) {
  const ethereum = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return (window as any).ethereum as EthLike | undefined;
  }, []);

  const [chainId, setChainId] = useState<number | null>(null);
  const [error, setError] = useState<string>("");

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

  return (
    <div
      className={`rounded-lg border p-3 text-sm ${
        ok ? "text-zinc-700 dark:text-zinc-200" : "text-amber-700 dark:text-amber-300"
      }`}
      title={expectedChainId ? `Expected chainId: ${expectedChainId}` : ""}
    >
      Network: <span className="font-medium">{chainName(chainId)}</span>{" "}
      <span className="text-xs opacity-70">(chainId: {chainId})</span>
      {!ok ? (
        <div className="mt-1 text-xs opacity-90">
          Wrong network. Please switch to chainId {expectedChainId}.
        </div>
      ) : null}
    </div>
  );
}
