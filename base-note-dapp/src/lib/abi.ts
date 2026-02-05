export const BASE_NOTE_ABI = [
  "function note() view returns (string)",
  "function noteLength() view returns (uint256)",
  "function hasNote() view returns (bool)",
  "function setNote(string newNote)",
  "event NoteUpdated(address indexed by, string note)",
] as const;
