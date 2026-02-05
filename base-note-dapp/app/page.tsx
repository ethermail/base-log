"use client";

import { useState } from "react";
import { ConnectWallet } from "../src/components/ConnectWallet";
import { NoteViewer } from "../src/components/NoteViewer";
import { NoteEditor } from "../src/components/NoteEditor";

export default function Page() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <main className="p-6 space-y-4">
      <ConnectWallet />
      <h1 className="text-xl font-semibold">Base Note DApp</h1>
      <NoteViewer refreshKey={refreshKey} />
      <NoteEditor onSaved={() => setRefreshKey((k) => k + 1)} />
    </main>
  );
}
