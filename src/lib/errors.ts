import { ApiRequestError } from "./api/client";

const MESSAGES: Partial<Record<string, string>> = {
  INVALID_CREDENTIALS: "That email and password don't match. Try again, or reset your password.",
  OTP_INVALID: "That code isn't right. Check the latest email and try again.",
  OTP_EXPIRED: "That code has expired or was already used. Request a new one.",
  OTP_TOO_MANY_ATTEMPTS: "Too many wrong attempts. Request a new code.",
  RATE_LIMITED: "Too many requests. Please wait a moment and try again.",
  GOOGLE_TOKEN_INVALID: "Google sign-in failed. Please try again.",
  ACCOUNT_SUSPENDED: "This account is suspended. Contact support.",
  ROLE_ALREADY_SET: "Your account type is already set.",
  CONSENT_REQUIRED: "Please accept the latest policies to continue.",
  CREATOR_UNDERAGE: "Creators must be 18 or older.",
  CATEGORY_LIMIT_EXCEEDED: "Choose at most 3 niches.",
  VERIFICATION_ALREADY_PENDING: "Your verification is already under review.",
  FILE_TYPE_NOT_ALLOWED: "That file type isn't allowed here.",
  FILE_TOO_LARGE: "That file is too large (images up to 5 MB).",
  FILE_NOT_UPLOADED: "The upload didn't finish. Please upload the file again.",
  BRAND_NOT_VERIFIED: "BrandDeal is still verifying your brand. Publishing and invites unlock once you're verified.",
};

const REASONS: Partial<Record<string, string>> = {
  PLATFORM_ALREADY_ADDED: "You've already added an account on this platform.",
  HANDLE_TAKEN: "This handle is already registered by another creator.",
};

/** User-facing message for an error thrown by the API client (or an upload). */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    const details = error.body?.details as Record<string, unknown> | undefined;
    if (error.code === "OTP_INVALID" && typeof details?.attemptsRemaining === "number") {
      return `That code isn't right. ${details.attemptsRemaining} attempts left.`;
    }
    if (error.code === "RATE_LIMITED" && typeof details?.retryAfterSeconds === "number") {
      const minutes = Math.ceil(details.retryAfterSeconds / 60);
      return details.retryAfterSeconds < 60
        ? `Too many attempts. Try again in ${details.retryAfterSeconds} seconds.`
        : `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
    }
    if (error.code === "PROFILE_INCOMPLETE" && Array.isArray(details?.missing)) {
      return `Complete your profile first: ${(details.missing as string[]).join(", ")}.`;
    }
    const reason = typeof details?.reason === "string" ? REASONS[details.reason] : undefined;
    if (reason) return reason;
    const fields = details?.fields as Record<string, string> | undefined;
    if (fields && Object.keys(fields).length > 0) {
      return Object.entries(fields)
        .map(([field, message]) => `${field}: ${message}`)
        .join(" · ");
    }
    return (error.code && MESSAGES[error.code]) || error.body?.message || "Something went wrong.";
  }
  if (error instanceof Error && error.message) return error.message;
  return "Couldn't reach BrandDeal. Check your connection and try again.";
}
