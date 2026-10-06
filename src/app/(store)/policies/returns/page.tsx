import Link from "next/link";
import { PolicyLayout, policyMetadata, type PolicySection } from "@/components/layout/PolicyLayout/PolicyLayout";
import { POLICY_FACTS as F } from "@/lib/policy-facts";

export const generateMetadata = policyMetadata(
  "returns",
  `When ${F.brand} refunds game keys, subscription codes and gift cards: undelivered keys, keys that do not activate and cancellations before a key is issued. Refunds within ${F.refundDays} days to ${F.refundMethod}.`,
);

const sections: PolicySection[] = [
  {
    id: "summary",
    title: "In short",
    body: (
      <ul>
        <li>If we cannot deliver a key within {F.deliveryDeadlineHours} hours of payment confirmation, we refund the price you paid for it.</li>
        <li>If a key does not activate and you tell us within {F.guaranteeClaimDays} days of delivery, we replace it or refund it.</li>
        <li>You can cancel free of charge before {F.cancelBefore}.</li>
        <li>Once a key has been issued to your account, the {F.withdrawalDays}-day right to cancel no longer applies, because you asked us at checkout to start delivery straight away.</li>
        <li>Refunds are made within {F.refundDays} days to {F.refundMethod}, in the currency you paid in.</li>
      </ul>
    ),
  },
  {
    id: "withdrawal",
    title: "Right to cancel and immediate delivery",
    body: (
      <>
        <p>
          The Consumer Contracts Regulations 2013 (UK) and the Consumer Rights Directive (EU) give consumers {F.withdrawalDays} days to
          cancel a contract for digital content not supplied on a physical medium, unless delivery has begun with their express request and
          their acknowledgement that the right is lost.
        </p>
        <p>
          Keys are issued straight after payment. At checkout you tick a separate box, which is not ticked in advance: &ldquo;
          {F.waiverText}&rdquo; It is separate from accepting our terms and the order cannot be placed without it. We store the time and the
          wording with your order and repeat it in your confirmation email and on your invoice.
        </p>
        <p>
          Delivery begins when a key is issued to your account. Until then you can cancel without charge: email {F.email} or use the{" "}
          <Link href="/contact">contact form</Link> with your order number. Because keys are usually issued within minutes, a cancellation
          sent after that point is handled under the rules below.
        </p>
        <p>Giving up the right to cancel does not affect your rights when a key is not delivered, does not work or is not as described.</p>
      </>
    ),
  },
  {
    id: "when-we-refund",
    title: "When we refund",
    body: (
      <>
        <ul>
          <li>The key could not be issued within {F.deliveryDeadlineHours} hours of payment confirmation.</li>
          <li>The key is invalid, or was already redeemed before it was delivered to you, and no replacement is available.</li>
          <li>The key is for a different product, platform, region or edition than the product page stated.</li>
          <li>The publisher revoked the key for a reason that existed when we delivered it and that you did not cause.</li>
          <li>You cancelled before {F.cancelBefore}.</li>
        </ul>
        <p>
          For keys that do not activate we first try to replace them; see the <Link href="/policies/warranty">Key guarantee</Link> for the
          procedure and what we ask you to send.
        </p>
      </>
    ),
  },
  {
    id: "not-refundable",
    title: "When we do not refund",
    body: (
      <>
        <p>Once a key has been issued and it works as described, we do not refund it because:</p>
        <ul>
          <li>you changed your mind or found a lower price elsewhere;</li>
          <li>you bought the wrong platform, region or edition when the product page stated them correctly;</li>
          <li>your device does not meet the system requirements shown on the product page;</li>
          <li>you redeemed the key, or shared it with someone who did.</li>
        </ul>
        <p>Changes publishers make to a game or service after you redeem it are covered by the publisher&rsquo;s own terms.</p>
      </>
    ),
  },
  {
    id: "how-refunds",
    title: "How refunds are paid",
    body: (
      <>
        <p>
          We refund within {F.refundDays} days of the day we confirm the refund to you. The money goes to {F.refundMethod}, in the currency you
          paid in. Where an order had several products, we refund only the products affected. We do not charge a fee for refunds. Your bank may
          take a few further working days to show it on your statement.
        </p>
        <p>
          Each product on your <Link href="/account/orders">order page</Link> shows its status, including &ldquo;Refund pending&rdquo; and
          &ldquo;Refunded&rdquo;. We also email you when a refund is issued.
        </p>
      </>
    ),
  },
  {
    id: "chargebacks",
    title: "Before you contact your bank",
    body: (
      <p>
        Please contact us first so that we can look into the problem. A chargeback for an order whose keys were delivered and work as described
        may lead us to send the payment provider the order, delivery and key-reveal records we hold, as described in our{" "}
        <Link href="/policies/privacy">Privacy policy</Link>.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Asking about a refund",
    body: (
      <p>
        Email {F.email} or use the <Link href="/contact">contact form</Link> with your order number. We reply {F.replyTime}. If you are not
        satisfied with our answer, see our <Link href="/policies/complaints">Complaints policy</Link>.
      </p>
    ),
  },
];

export default async function ReturnsPage() {
  return <PolicyLayout slug="returns" sections={sections} />;
}
