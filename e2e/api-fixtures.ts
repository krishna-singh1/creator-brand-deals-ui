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

/** Admin session saved once per run by global-setup.ts (no parallel admin sign-ins). */
export const ADMIN_STATE = "e2e/.auth/admin.json";

async function adminSession(): Promise<APIRequestContext> {
  return request.newContext({
    baseURL: `${API_URL}/`,
    extraHTTPHeaders: { "X-Requested-With": "fetch" },
    storageState: ADMIN_STATE,
  });
}

/** Signs in with an email code (never tries or changes a password); retries on the resend cooldown. */
export async function signInWithCode(api: APIRequestContext, email: string) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const requestedAt = new Date();
    const request = await api.post("auth/otp/request", { data: { email } });
    if (request.ok()) {
      const verify = await api.post("auth/otp/verify", { data: { email, otp: await latestOtp(email, requestedAt) } });
      if (verify.ok()) return;
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error(`Could not sign in ${email} with an email code`);
}

export async function acceptPendingConsents(api: APIRequestContext) {
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
    data: { platform: "INSTAGRAM", handle: `vc${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`, followers: 18000, avgLikes: 700, avgComments: 40 },
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

  const admin = await adminSession();
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

/**
 * A cash deal ready for content: a brand with a complete profile publishes a 1-reel campaign, a verified creator
 * applies quoting ₹5,000 and the brand approves. Sign in to both with TEST_PASSWORD.
 */
/** A brand with a complete profile and one published cash campaign (IG Reel, 10K–50K followers). */
export async function createBrandWithCampaign(title: string) {
  const brandEmail = `e2e-db-${Date.now()}-${Math.floor(Math.random() * 1e4)}@example.com`;
  const brand = await apiSession(brandEmail);
  expect((await brand.post("me/role", { data: { role: "BRAND" } })).ok()).toBe(true);
  await acceptPendingConsents(brand);
  const profile = await brand.put("brand/profile", {
    data: {
      brandName: "Saffron & Co",
      categoryId: "01920000-0000-7000-8000-000000000003",
      contactName: "Nisha Rao",
      contactPhone: "+919812300009",
      contactEmail: brandEmail,
    },
  });
  expect(profile.ok(), await profile.text()).toBe(true);
  const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
  const campaign = await (
    await brand.post("campaigns", {
      data: {
        title,
        description: "Film our saffron milk kit at your evening routine; warm, honest, unhurried.",
        platform: "INSTAGRAM",
        categoryIds: ["01920000-0000-7000-8000-000000000003"],
        compensationType: "CASH",
        budgetMinPaise: 400000,
        budgetMaxPaise: 800000,
        deliverables: [{ deliverableType: "IG_REEL", quantity: 1 }],
        criteria: { followersMin: 10000, followersMax: 50000 },
        creatorsNeeded: 3,
        hashtags: ["#SaffronEvenings"],
        applyBy: inDays(7),
        contentWindowStart: inDays(8),
        contentWindowEnd: inDays(20),
      },
    })
  ).json();
  expect((await brand.post(`campaigns/${campaign.id}/publish`)).ok()).toBe(true);
  await brand.dispose();
  return { brandEmail, campaignId: campaign.id as string };
}

export async function createApprovedDeal(title: string) {
  const { brandEmail, campaignId } = await createBrandWithCampaign(title);
  const brand = await apiSession(brandEmail);
  const campaign = { id: campaignId };
  const creatorEmail = await createVerifiedCreator("Kavya Creates");
  const creator = await apiSession(creatorEmail);
  const application = await creator.post(`campaigns/${campaign.id}/applications`, {
    data: {
      pitch: "Evening rituals are my whole feed; my audience asks about my milk recipes every week. One cosy reel.",
      quote: [{ deliverableType: "IG_REEL", quantity: 1, unitPricePaise: 500000 }],
      availabilityConfirmed: true,
    },
  });
  expect(application.ok(), await application.text()).toBe(true);
  const approved = await brand.post(`applications/${(await application.json()).id}/approve`, { data: {} });
  expect(approved.ok(), await approved.text()).toBe(true);
  const dealId: string = (await approved.json()).dealId;
  await Promise.all([brand.dispose(), creator.dispose()]);
  return { brandEmail, creatorEmail, dealId };
}
