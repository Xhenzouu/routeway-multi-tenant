import type { Tenant, TenantId, WebhookRequest, WebhookVerification } from "./payments/types";

export async function computeSignature(secret: string, timestamp: number, rawBody: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}.${rawBody}`));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function signRequest(rawBody: string, secret: string, timestamp = Math.floor(Date.now() / 1000)): Promise<WebhookRequest> {
  return {
    rawBody,
    headers: {
      "Content-Type": "application/json",
      "Stripe-Signature": `t=${timestamp},v1=${await computeSignature(secret, timestamp, rawBody)}`,
    },
  };
}

export async function verifyRequest(request: WebhookRequest, tenants: Tenant[], expectedTenant: TenantId, now = Math.floor(Date.now() / 1000)): Promise<WebhookVerification> {
  let tenantId: unknown;
  try {
    tenantId = JSON.parse(request.rawBody)?.data?.object?.metadata?.tenant_id;
  } catch { /* Invalid JSON cannot resolve a tenant. */ }
  const tenant = tenants.find((entry) => entry.id === tenantId && entry.id === expectedTenant);
  const selectedTenant = tenants.find((entry) => entry.id === expectedTenant);
  const result: WebhookVerification = {
    tenantResolved: tenant ? "passed" : "failed",
    secretLoaded: "skipped",
    timestampValid: "skipped",
    signatureMatches: "skipped",
    verified: false,
    inactive: Boolean(selectedTenant && !selectedTenant.active),
  };
  if (!selectedTenant?.active) return result;
  result.secretLoaded = "passed";
  const parts = request.headers["Stripe-Signature"].split(",");
  const timestampText = parts.find((part) => part.startsWith("t="))?.slice(2);
  const timestamp = timestampText && /^\d+$/.test(timestampText) ? Number(timestampText) : NaN;
  const original = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  result.timestampValid = Number.isFinite(timestamp) && Math.abs(now - timestamp) <= 300 ? "passed" : "failed";
  const computed = Number.isFinite(timestamp) ? await computeSignature(selectedTenant.signingSecret, timestamp, request.rawBody) : null;
  result.signatureMatches = computed && original.includes(computed) ? "passed" : "failed";
  result.verified = result.tenantResolved === "passed" && result.timestampValid === "passed" && result.signatureMatches === "passed";
  return result;
}