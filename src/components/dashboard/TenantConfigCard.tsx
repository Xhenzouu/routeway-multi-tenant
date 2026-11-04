import type { Tenant } from "@/lib/payments/types";
import { maskSecret } from "@/lib/payments/mockData";
import { cn } from "@/lib/utils";

export function TenantConfigCard({ tenant }: { tenant: Tenant }) {
  const rows = [
    ["Stripe API Key", maskSecret(tenant.stripeApiKey)],
    ["Slack Webhook URL", `https://hooks.slack.com/••••${tenant.slackWebhookUrl.slice(-4)}`],
    ["Slack Channel", tenant.slackChannel],
  ];
  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl">{tenant.companyName}</h2>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{tenant.id}</p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
            tenant.active ? "border-success/40 text-success" : "border-skipped/40 text-skipped",
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", tenant.active ? "bg-success" : "bg-skipped")} />
          {tenant.active ? "Active" : "Inactive"}
        </span>
      </div>
      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        {rows.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">{k}</dt>
            <dd className="mt-1 truncate font-mono text-sm" title={v}>{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
