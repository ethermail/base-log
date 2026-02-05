import { ConnectWallet } from "../src/components/ConnectWallet";
import { NoteViewer } from "../src/components/NoteViewer";

export default function Page() {
  return (
    <main className="p-6 space-y-4">
      <ConnectWallet />
      <h1 className="text-xl font-semibold">Base Note DApp</h1>
      <NoteViewer />
    </main>
  );
}
