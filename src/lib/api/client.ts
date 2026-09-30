import createClient from "openapi-fetch";

import type { components, paths } from "./schema";

export type { components };

/**
 * Typed client for the ExposureStreet API (contract synced from the API repo, ADR 0009).
 * The API is a separate deployment: the browser calls it directly with cookies (ADR 0008), or through this app's
 * same-origin proxy when NEXT_PUBLIC_API_URL is the relative path "/api/v1" (see API_ORIGIN in next.config.ts).
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export type ApiError = components["schemas"]["ErrorResponse"]["error"];
export type Me = components["schemas"]["Me"];

const CSRF_HEADER = { "X-Requested-With": "fetch" } as const;
const NO_REFRESH_PATHS = ["/auth/refresh", "/auth/logout", "/auth/otp/", "/auth/google", "/auth/login", "/auth/password/"];

let refreshInFlight: Promise<boolean> | null = null;

/** One refresh at a time; concurrent 401s wait for the same attempt (reuse would revoke the session). */
function refreshSession(): Promise<boolean> {
  refreshInFlight ??= fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: CSRF_HEADER,
  })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

async function fetchWithRefresh(request: Request): Promise<Response> {
  const retry = request.clone();
  const response = await fetch(request);
  const path = new URL(request.url).pathname;
  if (response.status !== 401 || NO_REFRESH_PATHS.some((p) => path.includes(p))) {
    return response;
  }
  return (await refreshSession()) ? fetch(retry) : response;
}

/**
 * The contract declares the CSRF header on every mutating operation. The client sends it on every request, so it is
 * removed from call-site types (other header params, e.g. Idempotency-Key, stay).
 */
type WithoutCsrfHeader<T> = T extends { parameters: { header: infer H } }
  ? Omit<T, "parameters"> & { parameters: Omit<T["parameters"], "header"> & { header?: Omit<H, "X-Requested-With"> } }
  : T;
type ClientPaths = { [P in keyof paths]: { [M in keyof paths[P]]: WithoutCsrfHeader<paths[P][M]> } };

export const api = createClient<ClientPaths>({
  baseUrl: API_URL,
  credentials: "include",
  headers: CSRF_HEADER,
  fetch: fetchWithRefresh,
});

/** Throws the contract's error body so callers (React Query) get a typed error. */
export async function unwrap<T>(
  promise: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
  const { data, error, response } = await promise;
  if (error !== undefined || !response.ok) {
    const body = error as { error?: ApiError } | undefined;
    throw new ApiRequestError(response.status, body?.error);
  }
  return data as T;
}

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly body?: ApiError,
  ) {
    super(body?.message ?? `Request failed with ${status}`);
  }

  get code() {
    return this.body?.code;
  }
}
