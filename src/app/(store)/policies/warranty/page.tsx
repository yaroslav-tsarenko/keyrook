import Link from "next/link";
import { PolicyLayout, policyMetadata, type PolicySection } from "@/components/layout/PolicyLayout/PolicyLayout";
import { POLICY_FACTS as F } from "@/lib/policy-facts";

export const generateMetadata = policyMetadata(
  "warranty",
  `${F.brand} key guarantee: if a key does not activate, contact us within ${F.guaranteeClaimDays} days of delivery and we replace it or refund the price you paid for it.`,
);

const sections: PolicySection[] = [
  {
    id: "guarantee",
    title: "What the guarantee covers",
    body: (
      <>
        <p>{F.guarantee}</p>
        <p>It covers a key that:</p>
        <ul>
          <li>is reported as invalid by the platform when you enter it;</li>
          <li>was already redeemed before it was delivered to you;</li>
          <li>is for a different product, platform, region or edition than the product page stated;</li>
          <li>is revoked by the publisher for a reason that existed when we delivered it and that you did not cause.</li>
        </ul>
        <p>It also covers a key we fail to deliver within {F.deliveryDeadlineHours} hours of payment confirmation, which we refund without you needing to ask.</p>
      </>
    ),
  },
  {
    id: "claim",
    title: "How to make a claim",
    body: (
      <ol>
        {F.guaranteeSteps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    ),
  },
  {
    id: "evidence",
    title: "What to send us",
    body: (
      <>
        <ul>
          <li>your order number and the product concerned;</li>
          <li>a screenshot of the error message the platform shows when you enter the key;</li>
          <li>the platform and the country your account is set to.</li>
        </ul>
        <p>
          Please do not post the full key anywhere public. Send it to us only if we ask for it, by replying to our email or through the{" "}
          <Link href="/contact">contact form</Link>.
        </p>
      </>
    ),
  },
  {
    id: "outcome",
    title: "Replacement or refund",
    body: (
      <p>
        If the claim is covered, we send a replacement key for the same product to your order page. If no replacement is available, or you
        prefer a refund, we refund the price you paid for that key within {F.refundDays} days to {F.refundMethod}.
      </p>
    ),
  },
  {
    id: "what-it-is-not",
    title: "What the guarantee does not cover",
    body: (
      <>
        <ul>
          {F.guaranteeExclusions.map((item) => (
            <li key={item}>{item};</li>
          ))}
          <li>keys you shared with someone else, or that were taken from your email or account because its sign-in details were exposed.</li>
        </ul>
        <p>
          Your statutory rights as a consumer in the UK and EU are not affected. Digital content must be as described and fit for purpose, and
          this guarantee adds to those rights.
        </p>
      </>
    ),
  },
];

export default async function WarrantyPage() {
  return <PolicyLayout slug="warranty" sections={sections} />;
}
