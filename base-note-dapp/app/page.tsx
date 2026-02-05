import { ConnectWallet } from "@/src/components/ConnectWallet";

export default function Page() {
  return (
    <main className="p-6 space-y-4">
      <ConnectWallet />
      <h1 className="text-xl font-semibold">Base Note DApp</h1>
    </main>
  );
}

