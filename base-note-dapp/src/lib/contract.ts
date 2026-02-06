import { BrowserProvider, Contract } from "ethers";
import abi from "./BaseNote.abi.json";
import { getExpectedChainId } from "./config";
import { getBaseNoteAddress } from "./addresses";

type EthLike = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

function getEthereum(): EthLike {
  if (typeof window === "undefined") {
    throw new Error("window is undefined");
  }
  const eth = (window as any).ethereum as EthLike | undefined;
  if (!eth) throw new Error("No injected wallet found");
  return eth;
}

async function getChainId(eth: EthLike): Promise<number> {
  const v = await eth.request({ method: "eth_chainId" });
  if (typeof v === "string" && v.startsWith("0x")) return parseInt(v, 16);
  if (typeof v === "number") return v;
  throw new Error("Unable to read chainId");
}

export async function getReadContract() {
  const eth = getEthereum();
  const provider = new BrowserProvider(eth as any);
  const chainId = await getChainId(eth);
  const address = getBaseNoteAddress(chainId);
  return new Contract(address, abi, provider);
}

export async function getWriteContract() {
  const eth = getEthereum();
  const provider = new BrowserProvider(eth as any);
  const signer = await provider.getSigner();
  const chainId = await getChainId(eth);

  const expected = getExpectedChainId();
  if (chainId !== expected) {
    throw new Error(`Wrong network: expected ${expected}, got ${chainId}`);
  }

  const address = getBaseNoteAddress(chainId);
  return new Contract(address, abi, signer);
}
