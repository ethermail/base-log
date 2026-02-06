export type EthLike = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

export function getEthereum(): EthLike {
  if (typeof window === "undefined") throw new Error("window is undefined");
  const eth = (window as any).ethereum as EthLike | undefined;
  if (!eth) throw new Error("No injected wallet found");
  return eth;
}

export async function requestAccounts(eth: EthLike): Promise<string[]> {
  const res = await eth.request({ method: "eth_requestAccounts" });
  return Array.isArray(res) ? (res as string[]) : [];
}

export async function getChainId(eth: EthLike): Promise<number> {
  const v = await eth.request({ method: "eth_chainId" });
  if (typeof v === "string" && v.startsWith("0x")) return parseInt(v, 16);
  if (typeof v === "number") return v;
  throw new Error("Unable to read chainId");
}

/**
 * Try switch chain. If the chain is not added, throws with code 4902 in most wallets.
 */
export async function switchToChain(eth: EthLike, chainId: number) {
  const hex = "0x" + chainId.toString(16);
  await eth.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: hex }],
  });
}

/**
 * Add Base Sepolia network (84532) to wallet.
 * RPC + explorer are public endpoints; you can replace with your own if desired.
 */
export async function addBaseSepolia(eth: EthLike) {
  await eth.request({
    method: "wallet_addEthereumChain",
    params: [
      {
        chainId: "0x14a34", // 84532
        chainName: "Base Sepolia",
        nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
        rpcUrls: ["https://sepolia.base.org"],
        blockExplorerUrls: ["https://sepolia.basescan.org"],
      },
    ],
  });
}

/**
 * Ensure wallet is on expected chain:
 * - try switch
 * - if not added, add then switch
 */
export async function ensureChain(eth: EthLike, expectedChainId: number) {
  try {
    await switchToChain(eth, expectedChainId);
  } catch (e: any) {
    // 4902 = Unrecognized chain (common in MetaMask)
    if (e?.code === 4902) {
      if (expectedChainId === 84532) {
        await addBaseSepolia(eth);
        await switchToChain(eth, expectedChainId);
        return;
      }
    }
    throw e;
  }
}
