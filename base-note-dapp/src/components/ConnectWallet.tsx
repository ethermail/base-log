"use client";

export function ConnectWallet() {
  async function connect() {
    if (!window.ethereum) return alert("No wallet");
    await window.ethereum.request({ method: "eth_requestAccounts" });
  }

  return (
    <button onClick={connect} className="px-4 py-2 border rounded">
      Connect Wallet
    </button>
  );
}