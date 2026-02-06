export const ADDRESSES: Record<number, { BaseNote: `0x${string}` }> = {
  // Base Sepolia
  84532: {
    BaseNote: "0x0000000000000000000000000000000000000000",
  },
  // Base Mainnet
  8453: {
    BaseNote: "0x0000000000000000000000000000000000000000",
  },
};

export function getBaseNoteAddress(chainId: number): `0x${string}` {
  const entry = ADDRESSES[chainId];
  if (!entry?.BaseNote) {
    throw new Error(`BaseNote address not configured for chainId ${chainId}`);
  }
  return entry.BaseNote;
}
