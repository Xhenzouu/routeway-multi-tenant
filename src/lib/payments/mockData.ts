import type { AuditLogs, StepName, StepResult, Tenant, TenantId, WebhookVerification } from "./types";
import { signRequest } from "../signature";

export const STEPS = [
  "Lookup Tenant Config",
  "Verify Signature",
  "Fetch Payment Details",
  "Post to Tenant Slack",
  "Write Audit Row",
  "Respond to Stripe 200",
] as const satisfies readonly StepName[];

export const SLACK_ERROR =
  'Unexpected Slack response: "---title: Slack developer docs description: Build apps, workflows and integrations on the Slack platform. This endpoint returned HTML documentation instead of the expected \\"ok\\" body."';

export const tenants: Tenant[] = [
  {
    id: "tenant_a",
    label: "Tenant A (Acme Corp)",
    companyName: "Acme Corp",
    stripeApiKey: "sk_test_51Hx9acmeKey0000a1b2",
    slackWebhookUrl: "https://hooks.slack.com/services/T000/B000/acme9f3c",
    slackChannel: "#acme-payments",
    active: true,
    signingSecret: "whsec_mock_a",
  },
  {
    id: "tenant_b",
    label: "Tenant B (Beta SaaS)",
    companyName: "Beta SaaS",
    stripeApiKey: "sk_test_51Hx9betaKey0000c3d4",
    slackWebhookUrl: "https://hooks.slack.com/services/T111/B111/beta7e21",
    slackChannel: "#beta-billing",
    active: true,
    signingSecret: "whsec_mock_b",
  },
  {
    id: "tenant_c",
    label: "Tenant C (Inactive)",
    companyName: "Gamma Labs",
    stripeApiKey: "sk_test_51Hx9gammaKey000e5f6",
    slackWebhookUrl: "https://hooks.slack.com/services/T222/B222/gamma44b",
    slackChannel: "#gamma-payments",
    active: false,
    signingSecret: "whsec_mock_c",
  },
];

export const auditLogs: AuditLogs = {
  tenant_a: [
    {
      stripe_event_id: "evt_mock_000",
      payment_intent_id: "pi_mock_000",
      amount_cents: 5000,
      currency: "usd",
      stripe_fetch_status: "success",
      slack_post_status: "success",
      slack_error: null,
      processed_at: "2026-11-01T09:12:44Z",
    },
    {
      stripe_event_id: "evt_mock_001",
      payment_intent_id: "pi_mock_001",
      amount_cents: 5000,
      currency: "usd",
      stripe_fetch_status: "success",
      slack_post_status: "success",
      slack_error: null,
      processed_at: "2026-11-02T14:03:10Z",
    },
  ],
  tenant_b: [
    {
      stripe_event_id: "evt_mock_002",
      payment_intent_id: "pi_mock_002",
      amount_cents: 5000,
      currency: "usd",
      stripe_fetch_status: "success",
      slack_post_status: "success",
      slack_error: null,
      processed_at: "2026-11-01T11:40:02Z",
    },
    {
      stripe_event_id: "evt_mock_003",
      payment_intent_id: "pi_mock_003",
      amount_cents: 5000,
      currency: "usd",
      stripe_fetch_status: "success",
      slack_post_status: "failed",
      slack_error: SLACK_ERROR,
      processed_at: "2026-11-03T08:21:57Z",
    },
  ],
  tenant_c: [],
};

export function cloneInitialLogs(): AuditLogs {
  return structuredClone(auditLogs);
}

export function mockProcessRun(tenantId: TenantId, verification?: WebhookVerification): StepResult[] {
  const d = () => 300 + Math.round(Math.random() * 400);
  if (tenantId === "tenant_c") {
    return [
      { step: STEPS[0], status: "warning", durationMs: d(), error: "Tenant Not Found (inactive)" },
      { step: STEPS[1], status: "skipped", durationMs: 0 },
      { step: STEPS[2], status: "skipped", durationMs: 0 },
      { step: STEPS[3], status: "skipped", durationMs: 0 },
      { step: STEPS[4], status: "skipped", durationMs: 0 },
      { step: STEPS[5], status: "success", durationMs: d() },
    ];
  }
  if (verification && !verification.verified) {
    return STEPS.map((step, i) => ({
      step: i === 5 ? "Respond to Stripe 400" : step,
      status: i === 0 ? "success" : i === 1 || i === 5 ? "failed" : "skipped",
      durationMs: i >= 2 && i <= 4 ? 0 : d(),
      ...(i === 1 ? { error: "Invalid signature" } : {}),
    }));
  }
  return STEPS.map((step, i) =>
    tenantId === "tenant_b" && i === 3
      ? { step, status: "failed" as const, durationMs: d(), error: SLACK_ERROR }
      : { step, status: "success" as const, durationMs: d() },
  );
}

export async function createMockRequest(tenantId: TenantId, runId: number) {
  const tenant = tenants.find((entry) => entry.id === tenantId);
  if (!tenant) throw new Error("Unknown mock tenant");
  const id = String(runId).padStart(3, "0");
  const rawBody = JSON.stringify({
    id: `evt_mock_${id}`,
    object: "event",
    type: "payment_intent.succeeded",
    data: { object: { id: `pi_mock_${id}`, amount: 5000, currency: "usd", metadata: { tenant_id: tenantId } } },
  }, null, 2);
  // Inactive requests have no signature because no signing secret is loaded.
  if (!tenant.active) return { rawBody, headers: { "Content-Type": "application/json", "Stripe-Signature": `t=${Math.floor(Date.now() / 1000)},v1=` } };
  return signRequest(rawBody, tenant.signingSecret);
}

export function maskSecret(value: string, visible = 4): string {
  const prefix = value.startsWith("sk_test_") ? "sk_test_" : value.slice(0, 24);
  return `${prefix}••••${value.slice(-visible)}`;
}

export function formatAmount(cents: number, currency: string): string {
  return `$${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
}
