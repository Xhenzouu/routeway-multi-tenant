export type TenantId = "tenant_a" | "tenant_b" | "tenant_c";

export type StepStatus = "pending" | "running" | "success" | "failed" | "skipped" | "warning";

export type StepName =
  | "Lookup Tenant Config"
  | "Fetch Payment Details"
  | "Post to Tenant Slack"
  | "Write Audit Row"
  | "Respond to Stripe 200";

export interface Tenant {
  id: TenantId;
  label: string;
  companyName: string;
  stripeApiKey: string;
  slackWebhookUrl: string;
  slackChannel: string;
  active: boolean;
}

export interface StepResult {
  step: StepName;
  status: StepStatus;
  durationMs: number;
  error?: string;
}

export type PostStatus = "success" | "failed";

export interface AuditRow {
  stripe_event_id: string;
  payment_intent_id: string;
  amount_cents: number;
  currency: "usd";
  stripe_fetch_status: PostStatus;
  slack_post_status: PostStatus;
  slack_error: string | null;
  processed_at: string;
}

export type AuditLogs = Record<TenantId, AuditRow[]>;
