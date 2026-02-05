"use client";

import { useEffect, useMemo, useState } from "react";

type EthLike = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: any[]) => void) => void;
  removeListener?: (event: string, handler: (...args: any[]) => void) => void;
};

function shortAddr(addr: string) {
  return addr.length > 10 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;
}

const LS_KEY = "base_note_account";

export function ConnectWallet() {
  const ethereum = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return (window as any).ethereum as EthLike | undefined;
  }, []);

  const [hasWallet, setHasWallet] = useState(false);
  const [account, setAccount] = useState("");

  function setAccountAndPersist(next: string) {
    setAccount(next);
    try {
      if (next) localStorage.setItem(LS_KEY, next);
      else localStorage.removeItem(LS_KEY);
      window.dispatchEvent(new Event("base_note_account_changed"));
    } catch {}
  }

  async function refreshAccounts() {
    if (!ethereum) return;
    const accs = (await ethereum.request({ method: "eth_accounts" })) as string[];
    setAccountAndPersist(accs?.[0] ?? "");
  }

  async function connect() {
    if (!ethereum) return;
    const accs = (await ethereum.request({ method: "eth_requestAccounts" })) as string[];
    setAccountAndPersist(accs?.[0] ?? "");
  }

  useEffect(() => {
    setHasWallet(Boolean(ethereum));

    // restore from localStorage (fast UI), then refresh from wallet
    try {
      const cached = localStorage.getItem(LS_KEY) ?? "";
      if (cached) setAccount(cached);
    } catch {}
    refreshAccounts();

    if (!ethereum?.on || !ethereum?.removeListener) return;

    const onAccountsChanged = (accs: string[]) => setAccountAndPersist(accs?.[0] ?? "");
    ethereum.on("accountsChanged", onAccountsChanged);
    return () => ethereum.removeListener?.("accountsChanged", onAccountsChanged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!hasWallet) {
    return (
      <div className="rounded-lg border p-4">
        <p className="text-sm text-zinc-600">
          No wallet detected. Install MetaMask (or another injected wallet) to continue.
        </p>
      </div>
    );
  }

  if (!account) {
    return (
      <button
        onClick={connect}
        className="px-4 py-2 rounded-lg border hover:bg-black/5 dark:hover:bg-white/10"
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border px-4 py-2">
      <span className="text-sm text-zinc-600">Connected:</span>
      <span className="font-mono text-sm">{shortAddr(account)}</span>
      <button
        onClick={() => setAccountAndPersist("")}
        className="ml-auto text-sm px-3 py-1 rounded-md border hover:bg-black/5 dark:hover:bg-white/10"
        title="Local disconnect (wallet stays connected in MetaMask)"
      >
        Disconnect
      </button>
    </div>
  );
}
