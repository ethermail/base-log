export function getExplorerBase(chainId: number): string {
  // Base Sepolia
  if (chainId === 84532) return "https://sepolia.basescan.org";
  // Base Mainnet
  if (chainId === 8453) return "https://basescan.org";
  // fallback (still show something sensible)
  return "https://sepolia.basescan.org";
}

export function addressUrl(chainId: number, address: string): string {
  return `${getExplorerBase(chainId)}/address/${address}`;
}

export function txUrl(chainId: number, hash: string): string {
  return `${getExplorerBase(chainId)}/tx/${hash}`;
}
