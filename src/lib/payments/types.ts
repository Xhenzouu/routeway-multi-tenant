export type TenantId = "tenant_a" | "tenant_b" | "tenant_c";

export type StepStatus = "pending" | "running" | "success" | "failed" | "skipped" | "warning";

export type StepName =
  | "Lookup Tenant Config"
  | "Verify Signature"
  | "Fetch Payment Details"
  | "Post to Tenant Slack"
  | "Write Audit Row"
  | "Respond to Stripe 200"
  | "Respond to Stripe 400";

export interface Tenant {
  id: TenantId;
  label: string;
  companyName: string;
  stripeApiKey: string;
  slackWebhookUrl: string;
  slackChannel: string;
  active: boolean;
  signingSecret: string;
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

export interface WebhookRequest {
  headers: { "Content-Type": string; "Stripe-Signature": string };
  rawBody: string;
}

export type VerificationStatus = "passed" | "failed" | "skipped";

export interface WebhookVerification {
  tenantResolved: VerificationStatus;
  secretLoaded: VerificationStatus;
  timestampValid: VerificationStatus;
  signatureMatches: VerificationStatus;
  verified: boolean;
  inactive: boolean;
}

export interface WebhookRun {
  id: number;
  request: WebhookRequest;
  steps: StepResult[];
}
