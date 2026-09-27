import { request } from "@playwright/test";

import { acceptPendingConsents, ADMIN_EMAIL, ADMIN_STATE, signInWithCode } from "./api-fixtures";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

/** Signs the bootstrap admin in once per run and saves the session for specs and fixtures to reuse. */
export default async function globalSetup() {
  const api = await request.newContext({ baseURL: `${API_URL}/`, extraHTTPHeaders: { "X-Requested-With": "fetch" } });
  await signInWithCode(api, ADMIN_EMAIL);
  await acceptPendingConsents(api);
  await api.storageState({ path: ADMIN_STATE });
  await api.dispose();
}
