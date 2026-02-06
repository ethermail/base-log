"use client";

import { getBaseNoteAddress } from "../lib/addresses";
import { addressUrl } from "../lib/explorer";

type Props = {
  chainId: number;
};

export function ContractLinks({ chainId }: Props) {
  let addr: `0x${string}` | null = null;
  let err: string | null = null;

  try {
    addr = getBaseNoteAddress(chainId);
  } catch (e: any) {
    err = e?.message ?? "Contract address not configured";
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied!");
    } catch {
      // fallback: still useful on some browsers
      prompt("Copy this:", text);
    }
  }

  if (err) {
    return (
      <div className="rounded-lg border p-3 text-sm">
        <div className="font-medium">Contract</div>
        <div className="text-red-600">{err}</div>
      </div>
    );
  }

  const url = addressUrl(chainId, addr!);

  return (
    <div className="rounded-lg border p-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-medium">BaseNote Contract</div>
          <div className="font-mono break-all">{addr}</div>
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          <button
            onClick={() => copy(addr!)}
            className="px-3 py-2 border rounded"
            type="button"
          >
            Copy Address
          </button>

          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 border rounded text-center"
          >
            Open in BaseScan
          </a>
        </div>
      </div>
    </div>
  );
}
