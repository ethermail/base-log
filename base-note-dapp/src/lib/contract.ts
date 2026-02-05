import { Contract, BrowserProvider } from "ethers";

export const BASE_NOTE_ADDRESS =
  process.env.NEXT_PUBLIC_BASE_NOTE_ADDRESS ?? "";

export const BASE_NOTE_ABI = [
  "function note() view returns (string)",
  "function setNote(string newNote)",
  "function noteLength() view returns (uint256)",
  "function hasNote() view returns (bool)",
  "event NoteUpdated(address indexed by, string note)",
];

export async function getBaseNoteContract() {
  if (!window.ethereum) throw new Error("No wallet");

  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  if (!BASE_NOTE_ADDRESS)
    throw new Error("Missing NEXT_PUBLIC_BASE_NOTE_ADDRESS");
  return new Contract(BASE_NOTE_ADDRESS, BASE_NOTE_ABI, signer);
}
