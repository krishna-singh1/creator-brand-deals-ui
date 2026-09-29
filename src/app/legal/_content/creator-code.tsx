import { COMPANY, POLICY_VERSIONS } from "@/lib/legal";

import { type LegalDoc, List, P, Strong } from "./types";

export const creatorCode: LegalDoc = {
  title: "Creator Code",
  summary: `How creators on ${COMPANY.brand} disclose paid and gifted collaborations, based on the ASCI Guidelines for Influencer Advertising in Digital Media and the Government of India's endorsement guidelines. Your audience should always know when a post is an ad.`,
  version: POLICY_VERSIONS.ASCI_CODE,
  sections: [
    {
      id: "when",
      heading: "1. When you must disclose",
      body: (
        <>
          <P>
            Disclose every post, reel, story or video made under a {COMPANY.brand} deal. That includes <Strong>barter deals</Strong>{" "}
            (free products are a &ldquo;material connection&rdquo; too) and content you post before or after the paid deliverables if it
            features the brand.
          </P>
          <P>When you tick the disclosure box on a submission, you confirm the post follows this code.</P>
        </>
      ),
    },
    {
      id: "how",
      heading: "2. How to disclose",
      body: (
        <List
          items={[
            <>Use a clear label: <Strong>#ad</Strong>, <Strong>#collab</Strong>, <Strong>#sponsored</Strong>, <Strong>#partner</Strong> or <Strong>#freegift</Strong> (for gifted products), or Instagram&apos;s &ldquo;Paid partnership&rdquo; label together with one of these.</>,
            "Put it upfront: in the first line of the caption or at the start, not hidden after a “more” cut or among many hashtags.",
            "Reels, videos and stories: show the label on screen, big enough to read and long enough to notice (for a short reel, for most of it). Say it out loud too when the content is mostly spoken or audio.",
            "Live streams: mention it at the start and again during the stream.",
            "Use the language of your post (a Hindi video gets a Hindi or bilingual disclosure).",
            "Don't use vague words that hide the relationship, such as #thanks, #sp, #spon or just the brand's name.",
          ]}
        />
      ),
    },
    {
      id: "honest",
      heading: "3. Honest content",
      body: (
        <List
          items={[
            "Use the product before you recommend it, and share your genuine opinion. Don't say you use something you don't.",
            "Don't make claims the brand can't back up (for example medical, weight-loss, “guaranteed” or “best in India” claims). If a brief asks for claims like these, ask the brand for proof or raise it with us.",
            "Health, nutrition, fitness and finance content needs extra care. Creators giving advice in these areas are expected to hold the relevant qualification and say so, as the ASCI guidelines require.",
            "Keep filters and edits from misrepresenting what a beauty or personal-care product does.",
            "Follow the law for restricted products (for example, don't promote alcohol, tobacco, betting or prescription drugs).",
          ]}
        />
      ),
    },
    {
      id: "numbers",
      heading: "4. Honest numbers",
      body: (
        <List
          items={[
            "Enter your real follower count, likes, comments and views, and keep them current.",
            "Never buy followers, likes, comments or views, use engagement pods to fake reach, or edit Insights screenshots.",
            "If we find inflated or fake numbers, we remove verification and may suspend the account.",
          ]}
        />
      ),
    },
    {
      id: "deals",
      heading: "5. Working with brands",
      body: (
        <List
          items={[
            "Deliver what you agreed, on time. If you can't, tell the brand early in the deal messages; cancel only with a real reason.",
            "Keep the brand's unpublished information (launch dates, products, prices) confidential until it's public.",
            "Keep live posts up for at least 30 days unless the brief says otherwise.",
            "Be respectful in messages. Don't ask for payment outside what was agreed in the deal.",
          ]}
        />
      ),
    },
    {
      id: "breaches",
      heading: "6. If this code is broken",
      body: (
        <P>
          We may ask you to fix a post, pause your account, remove verification or suspend you, depending on how serious the problem is
          and whether it repeats. ASCI can also act on complaints about undisclosed advertising, independently of us.
        </P>
      ),
    },
  ],
};
