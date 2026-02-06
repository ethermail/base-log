"use client";

import { ConnectWallet } from "../src/components/ConnectWallet";
import { NetworkBadge } from "../src/components/NetworkBadge";
import { NoteViewer } from "../src/components/NoteViewer";
import { NoteEditor } from "../src/components/NoteEditor";
import { ErrorBoundary } from "../src/components/ErrorBoundary";
import { getExpectedChainId } from "../src/lib/config";

export default function Page() {
  const expectedChainId = getExpectedChainId();

  return (
    <main className="p-6 space-y-4">
      <ConnectWallet />

      <ErrorBoundary>
        <NetworkBadge expectedChainId={expectedChainId} />
      </ErrorBoundary>

      <h1 className="text-xl font-semibold">Base Note DApp</h1>

      <ErrorBoundary>
        <NoteViewer />
      </ErrorBoundary>

      <ErrorBoundary>
        <NoteEditor />
      </ErrorBoundary>
    </main>
  );
}
