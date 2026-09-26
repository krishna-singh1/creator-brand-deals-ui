import { ApiRequestError } from "./api/client";

const MESSAGES: Partial<Record<string, string>> = {
  OTP_INVALID: "That code isn't right. Check the latest email and try again.",
  OTP_EXPIRED: "That code has expired or was already used. Request a new one.",
  OTP_TOO_MANY_ATTEMPTS: "Too many wrong attempts. Request a new code.",
  RATE_LIMITED: "Too many requests. Please wait a moment and try again.",
  GOOGLE_TOKEN_INVALID: "Google sign-in failed. Please try again.",
  ACCOUNT_SUSPENDED: "This account is suspended. Contact support.",
  ROLE_ALREADY_SET: "Your account type is already set.",
  VALIDATION_FAILED: "Please check the highlighted fields.",
};

/** User-facing message for an error thrown by the API client. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.code === "OTP_INVALID") {
      const remaining = error.body?.details?.attemptsRemaining;
      if (typeof remaining === "number") return `That code isn't right. ${remaining} attempts left.`;
    }
    return (error.code && MESSAGES[error.code]) || error.body?.message || "Something went wrong.";
  }
  return "Couldn't reach BrandDeal. Check your connection and try again.";
}
