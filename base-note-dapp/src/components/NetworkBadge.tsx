"use client";

import { useEffect, useMemo, useState } from "react";

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

function toHexChainId(chainId: number) {
  return "0x" + chainId.toString(16);
}

export function NetworkBadge({ expectedChainId }: { expectedChainId?: number }) {
  const ethereum = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return (window as any).ethereum as EthLike | undefined;
  }, []);

  const [chainId, setChainId] = useState<number | null>(null);
  const [error, setError] = useState<string>("");
  const [switching, setSwitching] = useState<boolean>(false);

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

  async function switchToExpected() {
    if (!ethereum || !expectedChainId) return;
    setError("");
    setSwitching(true);

    const hex = toHexChainId(expectedChainId);

    try {
      // Try switch first
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hex }],
      });
      await refresh();
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      const code = e?.code;

      // 4902: unknown chain -> try addEthereumChain
      if (code === 4902 || msg.toLowerCase().includes("unrecognized chain")) {
        try {
          // Only provide add params for Base Sepolia/Mainnet (common case)
          if (expectedChainId === BASE_SEPOLIA) {
            await ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: toHexChainId(BASE_SEPOLIA),
                  chainName: "Base Sepolia",
                  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                  rpcUrls: ["https://sepolia.base.org"],
                  blockExplorerUrls: ["https://sepolia.basescan.org"],
                },
              ],
            });
          } else if (expectedChainId === BASE_MAINNET) {
            await ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: toHexChainId(BASE_MAINNET),
                  chainName: "Base",
                  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                  rpcUrls: ["https://mainnet.base.org"],
                  blockExplorerUrls: ["https://basescan.org"],
                },
              ],
            });
          } else {
            throw new Error("Unknown chain: please add it in your wallet manually.");
          }

          // After adding, try switch again
          await ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: hex }],
          });
          await refresh();
        } catch (e2: any) {
          setError(e2?.message ?? String(e2));
        }
      } else {
        setError(msg);
      }
    } finally {
      setSwitching(false);
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
      <div className="rounded-lg border p-3 text-sm text-red-600 break-words">{error}</div>
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
      <div className="rounded-lg border p-3 text-sm text-zinc-600">Network: unknown</div>
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
      <div>
        Network: <span className="font-medium">{chainName(chainId)}</span>{" "}
        <span className="text-xs opacity-70">(chainId: {chainId})</span>
      </div>

      {!ok ? (
        <div className="mt-2 flex items-center gap-2">
          <div className="text-xs opacity-90">
            Wrong network. Please switch to chainId {expectedChainId}.
          </div>
          <button
            onClick={switchToExpected}
            disabled={switching}
            className="ml-auto text-xs px-3 py-1 rounded-md border hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/10"
            title="Switch network in your wallet"
          >
            {switching ? "Switching..." : "Switch Network"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
