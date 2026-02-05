export const DEFAULT_CHAIN_ID = 84532; // Base Sepolia

export function getExpectedChainId(): number {
  const raw = process.env.NEXT_PUBLIC_CHAIN_ID;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : DEFAULT_CHAIN_ID;
}
