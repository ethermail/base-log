export const ADDRESSES: Record<number, { BaseNote: `0x${string}` }> = {
  // Base Sepolia (testnet)
  84532: {
    BaseNote: "0x160B9E34EBdADB9f4Ecb38ceDd510FCd60dCbDDc",
  },
  // Base Mainnet
  8453: {
    BaseNote: "0x0000000000000000000000000000000000000000",
  },
};

export function getBaseNoteAddress(chainId: number): `0x${string}` {
  const entry = ADDRESSES[chainId];
  if (
    !entry?.BaseNote ||
    entry.BaseNote === "0x0000000000000000000000000000000000000000"
  ) {
    throw new Error(`BaseNote address not configured for chainId ${chainId}`);
  }
  return entry.BaseNote;
}
