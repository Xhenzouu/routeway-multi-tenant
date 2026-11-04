import type { AuditLogs, StepName, StepResult, Tenant, TenantId } from "./types";

export const STEPS = [
  "Lookup Tenant Config",
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
  },
  {
    id: "tenant_b",
    label: "Tenant B (Beta SaaS)",
    companyName: "Beta SaaS",
    stripeApiKey: "sk_test_51Hx9betaKey0000c3d4",
    slackWebhookUrl: "https://hooks.slack.com/services/T111/B111/beta7e21",
    slackChannel: "#beta-billing",
    active: true,
  },
  {
    id: "tenant_c",
    label: "Tenant C (Inactive)",
    companyName: "Gamma Labs",
    stripeApiKey: "sk_test_51Hx9gammaKey000e5f6",
    slackWebhookUrl: "https://hooks.slack.com/services/T222/B222/gamma44b",
    slackChannel: "#gamma-payments",
    active: false,
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

export function mockProcessRun(tenantId: TenantId): StepResult[] {
  const d = () => 300 + Math.round(Math.random() * 400);
  if (tenantId === "tenant_c") {
    return [
      { step: STEPS[0], status: "warning", durationMs: d(), error: "Tenant Not Found (inactive)" },
      { step: STEPS[1], status: "skipped", durationMs: 0 },
      { step: STEPS[2], status: "skipped", durationMs: 0 },
      { step: STEPS[3], status: "skipped", durationMs: 0 },
      { step: STEPS[4], status: "success", durationMs: d() },
    ];
  }
  return STEPS.map((step, i) =>
    tenantId === "tenant_b" && i === 2
      ? { step, status: "failed" as const, durationMs: d(), error: SLACK_ERROR }
      : { step, status: "success" as const, durationMs: d() },
  );
}

export function maskSecret(value: string, visible = 4): string {
  const prefix = value.startsWith("sk_test_") ? "sk_test_" : value.slice(0, 24);
  return `${prefix}••••${value.slice(-visible)}`;
}

export function formatAmount(cents: number, currency: string): string {
  return `$${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
}
