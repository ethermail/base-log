"use client";

import { ConnectWallet } from "../src/components/ConnectWallet";
import { NetworkBadge } from "../src/components/NetworkBadge";
import { NoteViewer } from "../src/components/NoteViewer";
import { NoteEditor } from "../src/components/NoteEditor";

export default function Page() {
  return (
    <main className="p-6 space-y-4">
      <ConnectWallet />
      <NetworkBadge expectedChainId={84532} />
      <h1 className="text-xl font-semibold">Base Note DApp</h1>
      <NoteViewer />
      <NoteEditor />
    </main>
  );
}
