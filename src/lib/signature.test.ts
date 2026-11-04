import { describe, expect, it, vi } from "vitest";
import { createHmac, webcrypto } from "node:crypto";
import { computeSignature, signRequest, verifyRequest } from "./signature";
import { createMockRequest, mockProcessRun, tenants } from "./payments/mockData";

const now = 1_800_000_000;
vi.stubGlobal("crypto", webcrypto);
const body = JSON.stringify({ data: { object: { metadata: { tenant_id: "tenant_a" }, amount: 5000 } } });

describe("Webhook signature rules", () => {
  it("computes real HMAC-SHA256 over timestamp dot raw body", async () => {
    expect(await computeSignature("whsec_mock_a", now, body)).toBe(createHmac("sha256", "whsec_mock_a").update(`${now}.${body}`).digest("hex"));
  });
  it.each(["tenant_a", "tenant_b"] as const)("passes verification for active %s", async (id) => {
    const request = await createMockRequest(id, 4);
    const verification = await verifyRequest(request, tenants, id);
    expect(verification.verified).toBe(true);
    expect(mockProcessRun(id, verification)[1]?.status).toBe("success");
  });
  it("rejects changed raw bytes without changing the original signature", async () => {
    const request = await signRequest(body, "whsec_mock_a", now);
    const changed = { ...request, rawBody: `${body} ` };
    const result = await verifyRequest(changed, tenants, "tenant_a", now);
    expect(changed.headers["Stripe-Signature"]).toBe(request.headers["Stripe-Signature"]);
    expect(result.signatureMatches).toBe("failed");
    expect(result.timestampValid).toBe("passed");
    expect(mockProcessRun("tenant_a", result).map((step) => step.status)).toEqual(["success", "failed", "skipped", "skipped", "skipped", "failed"]);
    expect(mockProcessRun("tenant_a", result)[5]?.step).toBe("Respond to Stripe 400");
    expect(request.rawBody).toBe(body);
  });
  it("correctly signed ten-minute replay fails only timestamp", async () => {
    const request = await signRequest(body, "whsec_mock_a", now - 600);
    const result = await verifyRequest(request, tenants, "tenant_a", now);
    expect(result).toMatchObject({ tenantResolved: "passed", secretLoaded: "passed", timestampValid: "failed", signatureMatches: "passed", verified: false });
  });
  it("accepts five-minute boundary and rejects older timestamps", async () => {
    for (const age of [300, 301]) {
      const request = await signRequest(body, "whsec_mock_a", now - age);
      expect((await verifyRequest(request, tenants, "tenant_a", now)).verified).toBe(age === 300);
    }
  });
  it("inactive tenant resolves but loads no secret and skips verification and audit", async () => {
    const request = await createMockRequest("tenant_c", 5);
    const result = await verifyRequest(request, tenants, "tenant_c");
    expect(result).toMatchObject({ tenantResolved: "passed", secretLoaded: "skipped", timestampValid: "skipped", signatureMatches: "skipped", inactive: true });
    expect(mockProcessRun("tenant_c", result).map((step) => step.status)).toEqual(["warning", "skipped", "skipped", "skipped", "skipped", "success"]);
  });
  it("does not load another tenant's secret when metadata is changed", async () => {
    const request = await signRequest(body.replace("tenant_a", "tenant_b"), "whsec_mock_a", now);
    expect((await verifyRequest(request, tenants, "tenant_a", now)).secretLoaded).toBe("skipped");
  });
});