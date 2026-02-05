import { Contract, BrowserProvider } from "ethers";
import { BASE_NOTE_ABI } from "./abi";

export const BASE_NOTE_ADDRESS = process.env.NEXT_PUBLIC_BASE_NOTE_ADDRESS ?? "";

export async function getProvider() {
  if (!window.ethereum) throw new Error("No wallet");
  return new BrowserProvider(window.ethereum);
}

export async function getReadContract() {
  if (!BASE_NOTE_ADDRESS) throw new Error("Missing NEXT_PUBLIC_BASE_NOTE_ADDRESS");
  const provider = await getProvider();
  return new Contract(BASE_NOTE_ADDRESS, BASE_NOTE_ABI, provider);
}

export async function getWriteContract() {
  if (!BASE_NOTE_ADDRESS) throw new Error("Missing NEXT_PUBLIC_BASE_NOTE_ADDRESS");
  const provider = await getProvider();
  const signer = await provider.getSigner();
  return new Contract(BASE_NOTE_ADDRESS, BASE_NOTE_ABI, signer);
}
