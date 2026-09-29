import { request } from "@playwright/test";

import { acceptPendingConsents, ADMIN_EMAIL, ADMIN_STATE, signInWithCode } from "./api-fixtures";
import { TEST_PASSWORD } from "./helpers";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

/** Signs the bootstrap admin in once per run and saves the session for specs and fixtures to reuse. */
export default async function globalSetup() {
  const api = await request.newContext({ baseURL: `${API_URL}/`, extraHTTPHeaders: { "X-Requested-With": "fetch" } });
  await signInWithCode(api, ADMIN_EMAIL);
  // On a fresh database the admin has no password yet, and the web app would stop at "Create your password".
  const me = await (await api.get("auth/me")).json();
  if (me.onboarding.passwordRequired) {
    const saved = await api.put("me/password", { data: { newPassword: TEST_PASSWORD } });
    if (!saved.ok()) throw new Error(`Could not set the admin password: ${await saved.text()}`);
  }
  await acceptPendingConsents(api);
  await api.storageState({ path: ADMIN_STATE });
  await api.dispose();
}
