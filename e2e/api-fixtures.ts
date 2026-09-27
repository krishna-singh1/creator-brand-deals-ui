import { type APIRequestContext, expect, request } from "@playwright/test";

import { latestOtp, PNG, TEST_PASSWORD } from "./helpers";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";
export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@branddeal.local";

/**
 * API-level setup for e2e tests (real API, real cookies). Use it for preconditions that other specs already cover
 * through the UI, so each spec can focus on its own flow.
 */
export async function apiSession(email: string, password = TEST_PASSWORD): Promise<APIRequestContext> {
  const api = await request.newContext({ baseURL: `${API_URL}/`, extraHTTPHeaders: { "X-Requested-With": "fetch" } });
  const requestedAt = new Date();
  const login = await api.post("auth/login", { data: { email, password } });
  if (login.status() === 202) {
    const reset = await api.post("auth/password/reset", {
      data: { email, otp: await latestOtp(email, requestedAt), newPassword: password },
    });
    expect(reset.ok(), await reset.text()).toBe(true);
  } else {
    expect(login.ok(), await login.text()).toBe(true);
  }
  return api;
}

async function acceptPendingConsents(api: APIRequestContext) {
  const me = await (await api.get("auth/me")).json();
  const pending = me.onboarding.pendingConsents ?? [];
  if (pending.length > 0) {
    const res = await api.post("me/consents", { data: { consents: pending } });
    expect(res.ok(), await res.text()).toBe(true);
  }
}

/**
 * A verified creator (Pune, Food niche, English, Instagram with 18K followers at 4.11% engagement), approved by the
 * bootstrap admin through the real verification endpoints. Returns the creator's email; sign in with TEST_PASSWORD.
 */
export async function createVerifiedCreator(displayName: string): Promise<string> {
  const email = `e2e-vc-${Date.now()}-${Math.floor(Math.random() * 1e4)}@example.com`;
  const creator = await apiSession(email);
  expect((await creator.post("me/role", { data: { role: "CREATOR" } })).ok()).toBe(true);
  await acceptPendingConsents(creator);

  const profile = await creator.put("creator/profile", {
    data: {
      displayName,
      fullName: `${displayName} Test`,
      dateOfBirth: "1997-06-15",
      cityId: "01920000-0000-7000-8001-000000000007",
      languages: ["en"],
      categoryIds: ["01920000-0000-7000-8000-000000000003"],
      phone: "+919876500002",
      contactEmail: email,
    },
  });
  expect(profile.ok(), await profile.text()).toBe(true);
  const account = await creator.post("creator/social-accounts", {
    data: { platform: "INSTAGRAM", handle: `vc${Date.now().toString(36)}`, followers: 18000, avgLikes: 700, avgComments: 40 },
  });
  expect(account.ok(), await account.text()).toBe(true);

  const presign = await (
    await creator.post("files/presign", {
      data: { purpose: "VERIFICATION_PROOF", contentType: PNG.mimeType, sizeBytes: PNG.buffer.length, fileName: PNG.name },
    })
  ).json();
  const upload = await creator.fetch(presign.uploadUrl, { method: "PUT", headers: presign.headers, data: PNG.buffer });
  expect(upload.ok()).toBe(true);
  const submitted = await creator.post("creator/verification", { data: { proofFileIds: [presign.fileId] } });
  expect(submitted.ok(), await submitted.text()).toBe(true);
  const verificationId = (await submitted.json()).id;

  const admin = await apiSession(ADMIN_EMAIL);
  await acceptPendingConsents(admin);
  const checklist = {
    handleMatches: true,
    followersWithinTolerance: true,
    insightsMatchHandle: true,
    engagementLooksReal: true,
    audienceMostlyIndia: true,
    contentSafe: true,
  };
  const approved = await admin.post(`admin/verifications/${verificationId}/approve`, { data: { checklist } });
  expect(approved.ok(), await approved.text()).toBe(true);

  await Promise.all([creator.dispose(), admin.dispose()]);
  return email;
}
