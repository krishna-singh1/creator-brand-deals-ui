import { formatCount, formatDateTime } from "@/lib/format";
import type { InstagramSnapshot } from "@/lib/verification";

const CHECK_LABELS: Record<InstagramSnapshot["checks"][number]["key"], string> = {
  MIN_FOLLOWERS: "Followers",
  ENOUGH_POSTS: "Recent posts",
  ENGAGEMENT_IN_RANGE: "Engagement",
  FOLLOW_RATIO: "Following",
  DECLARED_FOLLOWERS_MATCH: "Matches what you entered",
};

/** What Instagram reported at Connect Instagram, with each automatic check (creator result page and admin review). */
export function InstagramChecks({ snapshot }: { snapshot: InstagramSnapshot }) {
  return (
    <div className="flex flex-col gap-4 text-sm">
      <p className="text-zinc-600">
        @{snapshot.username} · {formatCount(snapshot.followers)} followers · {snapshot.avgLikes} likes and{" "}
        {snapshot.avgComments} comments per post ({snapshot.postsSampled} posts) · {snapshot.engagementRate}% engagement
        <span className="block text-xs text-zinc-500">Read from Instagram {formatDateTime(snapshot.checkedAt)}</span>
      </p>
      <ul className="flex flex-col gap-2">
        {snapshot.checks.map((c) => (
          <li key={c.key} className="flex items-start gap-2">
            <span aria-hidden className={c.passed ? "text-emerald-700" : "text-red-700"}>
              {c.passed ? "✓" : "✕"}
            </span>
            <span>
              <span className="font-medium text-ink">{CHECK_LABELS[c.key]}:</span>{" "}
              <span className={c.passed ? "text-zinc-600" : "text-red-700"}>{c.detail}</span>
              <span className="sr-only">{c.passed ? " (passed)" : " (needs review)"}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
