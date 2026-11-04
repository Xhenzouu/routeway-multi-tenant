import { useState } from "react";
import type { AuditRow } from "@/lib/payments/types";
import { formatAmount } from "@/lib/payments/mockData";
import { cn } from "@/lib/utils";

function Status({ v }: { v: string }) {
  return (
    <span className={cn("text-xs font-medium", v === "success" ? "text-success" : "text-danger")}>{v}</span>
  );
}

export function AuditTable({ rows }: { rows: AuditRow[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const cols = ["stripe_event_id", "payment_intent_id", "amount", "stripe_fetch_status", "slack_post_status", "slack_error", "processed_at"];
  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="border-b border-border p-6 pb-4">
        <h2 className="font-serif text-xl">Audit Log</h2>
        <p className="text-sm text-muted-foreground">Runs scoped to the selected tenant only.</p>
      </div>
      {rows.length === 0 ? (
        <p className="p-10 text-center text-sm text-muted-foreground">No runs for this tenant.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {cols.map((c) => (
                  <th key={c} className="whitespace-nowrap px-4 py-3 font-mono text-xs font-medium text-muted-foreground">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...rows].reverse().map((r) => (
                <tr key={r.stripe_event_id} className="border-b border-border last:border-0 align-top">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{r.stripe_event_id}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{r.payment_intent_id}</td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums">{formatAmount(r.amount_cents, r.currency)}</td>
                  <td className="px-4 py-3"><Status v={r.stripe_fetch_status} /></td>
                  <td className="px-4 py-3"><Status v={r.slack_post_status} /></td>
                  <td className="max-w-[260px] px-4 py-3 text-xs">
                    {r.slack_error ? (
                      <button
                        onClick={() => setOpen(open === r.stripe_event_id ? null : r.stripe_event_id)}
                        title={r.slack_error}
                        className={cn("block w-full text-left text-danger", open === r.stripe_event_id ? "whitespace-normal break-words" : "truncate")}
                      >
                        {r.slack_error}
                      </button>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs tabular-nums text-muted-foreground">
                    {new Date(r.processed_at).toISOString().replace("T", " ").slice(0, 19)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
