import { Contract, BrowserProvider } from "ethers";

export const BASE_NOTE_ADDRESS = "0xYOUR_CONTRACT_ADDRESS";

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

  return new Contract(BASE_NOTE_ADDRESS, BASE_NOTE_ABI, signer);
}
