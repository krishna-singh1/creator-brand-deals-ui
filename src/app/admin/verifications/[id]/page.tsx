import { Review } from "./review";

export default async function VerificationReviewPage(props: PageProps<"/admin/verifications/[id]">) {
  const { id } = await props.params;
  return <Review id={id} />;
}
