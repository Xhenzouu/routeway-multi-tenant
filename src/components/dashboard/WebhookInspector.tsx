import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { createMockPayload, createMockRequest, tenants } from "@/lib/payments/mockData";
import { signRequest, verifyRequest } from "@/lib/signature";
import type { Tenant, WebhookRequest, WebhookRun, WebhookVerification, VerificationStatus } from "@/lib/payments/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: Tenant;
  runs: WebhookRun[];
  dark: boolean;
  running: boolean;
  onResend: (request: WebhookRequest) => void;
}

function CheckRow({ label, status }: { label: string; status: VerificationStatus | "pending" }) {
  return <li className="flex items-start justify-between gap-3 py-2">
    <span>{label}</span>
    <span className={cn("shrink-0 rounded border px-2 py-0.5 text-xs capitalize", status === "passed" ? "border-success/40 bg-success/10 text-success" : status === "failed" ? "border-danger/40 bg-danger/10 text-danger" : "border-skipped/40 bg-skipped/10 text-skipped")}>{status}</span>
  </li>;
}

function RequestDetails({ run, tenant, running, onResend }: { run?: WebhookRun; tenant: Tenant; running: boolean; onResend: Props["onResend"] }) {
  const [request, setRequest] = useState<WebhookRequest>(() => run ? structuredClone(run.request) : {
    rawBody: createMockPayload(tenant.id),
    headers: { "Content-Type": "application/json", "Stripe-Signature": "" },
  });
  const [initializing, setInitializing] = useState(!run);
  const [tamper, setTamper] = useState(false);
  const [verification, setVerification] = useState<WebhookVerification | null>(null);
  const [replaying, setReplaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (run) return;
    let current = true;
    createMockRequest(tenant.id).then((value) => {
      if (current) { setRequest(value); setInitializing(false); }
    }).catch(() => {
      if (current) setError("Could not prepare the mock request. Please reopen the inspector to try again.");
    });
    return () => { current = false; };
  }, [run, tenant.id]);

  useEffect(() => {
    if (initializing) return;
    let current = true;
    setVerification(null);
    const check = () => {
      verifyRequest(request, tenants, tenant.id).then((value) => {
        if (current) { setVerification(value); setError(null); }
      }).catch(() => { if (current) setError("Signature check unavailable. Please try again."); });
    };
    check();
    const timer = window.setInterval(check, 1000);
    return () => { current = false; clearInterval(timer); };
  }, [request, tenant.id, initializing]);

  const replay = async () => {
    if (!tenant.active || replaying) return;
    setReplaying(true);
    try {
      setRequest(await signRequest(request.rawBody, tenant.signingSecret, Math.floor(Date.now() / 1000) - 600));
    } catch { setError("Could not sign the replay. Please try again."); }
    finally { setReplaying(false); }
  };

  return <div className="space-y-6 text-sm">
    <section className="space-y-3">
      <h3 className="font-serif text-xl">Request</h3>
      <p className="font-medium">POST /stripe-tenant</p>
      <table className="w-full table-fixed text-xs"><tbody>
        {Object.entries(request.headers).map(([name, value]) => <tr key={name} className="border-b border-border align-top"><th className="w-32 py-2 pr-3 text-left font-medium">{name}</th><td className="break-all py-2">{value}</td></tr>)}
      </tbody></table>
      {tamper ? <textarea aria-label="Webhook JSON body" spellCheck={false} className="block min-h-72 w-full resize-y rounded border border-border bg-background p-3 font-mono text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-ring" value={request.rawBody} onChange={(event) => setRequest((value) => ({ ...value, rawBody: event.target.value }))} /> : <pre className="overflow-x-auto rounded border border-border bg-background p-3 font-mono text-xs leading-relaxed">{request.rawBody}</pre>}
    </section>
    <section>
      <h3 className="font-serif text-xl">Verification</h3>
      <>
        <ul className="mt-2 divide-y divide-border">
          <CheckRow label="Tenant resolved from metadata.tenant_id" status={verification?.tenantResolved ?? "pending"} />
          <CheckRow label={`Signing secret loaded for tenant${verification?.secretLoaded === "passed" ? " (whsec_••••)" : ""}`} status={verification?.secretLoaded ?? "pending"} />
          <CheckRow label="Timestamp within 5 minute tolerance" status={verification?.timestampValid ?? "pending"} />
          <CheckRow label="HMAC-SHA256 signature matches" status={verification?.signatureMatches ?? "pending"} />
        </ul>
        {verification ? <p role="status" className={cn("mt-3 font-medium", verification.inactive ? "text-warning" : verification.verified ? "text-success" : "text-danger")}>{verification.inactive ? "Not verified: tenant inactive, no signing secret loaded" : verification.verified ? "Verified" : "Rejected: 400 Invalid signature"}</p> : <p role="status" className="mt-3 text-muted-foreground">Checking signature…</p>}
      </>
      <p className="mt-2 text-xs text-muted-foreground">Simulation with mock secrets</p>
      {error && <p role="alert" className="mt-2 text-danger">{error}</p>}
    </section>
    <section className="space-y-4 border-t border-border pt-5">
      <h3 className="font-serif text-xl">Tamper controls</h3>
      <div title={!tenant.active ? "No signing secret: tenant inactive" : undefined} className="flex items-center justify-between gap-3">
        <label htmlFor="tamper-payload">Tamper with payload</label>
        <Switch id="tamper-payload" checked={tamper} disabled={!tenant.active || replaying || initializing} onCheckedChange={setTamper} />
      </div>
      <div title={!tenant.active ? "No signing secret: tenant inactive" : undefined}>
        <Button variant="outline" className="w-full bg-transparent shadow-none" disabled={!tenant.active || replaying || initializing} onClick={replay}>Replay with old timestamp</Button>
      </div>
      <Button className="w-full shadow-none" disabled={running || replaying || !verification} onClick={() => onResend(structuredClone(request))}>{running ? "Processing…" : "Resend this request"}</Button>
    </section>
  </div>;
}

export function WebhookInspector({ open, onOpenChange, tenant, runs, dark, running, onResend }: Props) {
  const run = runs.at(-1);
  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal><div className={dark ? "dark" : ""}>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-overlay/50" />
      <Dialog.Content aria-describedby={undefined} className="fixed inset-y-0 right-0 z-50 w-[480px] max-w-full overflow-y-auto border-l border-border bg-card p-6 text-foreground shadow-none data-[state=open]:animate-in data-[state=open]:slide-in-from-right motion-reduce:animate-none">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Dialog.Title className="font-serif text-2xl">Webhook Inspector</Dialog.Title>
          <Dialog.Close asChild><Button variant="ghost" size="icon" aria-label="Close Webhook Inspector"><X /></Button></Dialog.Close>
        </div>
        <div className="mb-5 flex items-center justify-between gap-3 border-b border-border pb-4 text-sm">
          <span>{tenant.companyName}</span>
        </div>
        <RequestDetails key={`${tenant.id}-${run?.id ?? "default"}`} run={run} tenant={tenant} running={running} onResend={onResend} />
      </Dialog.Content>
    </div></Dialog.Portal>
  </Dialog.Root>;
}