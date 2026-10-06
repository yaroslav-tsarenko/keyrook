import Link from "next/link";
import { PolicyLayout, policyMetadata, type PolicySection } from "@/components/layout/PolicyLayout/PolicyLayout";
import { POLICY_FACTS as F } from "@/lib/policy-facts";

export const generateMetadata = policyMetadata(
  "returns",
  `When ${F.brand} refunds ${F.game} items: undelivered items, Steam trade reversals and cancellations before delivery begins. Refunds within ${F.refundDays} days to ${F.refundMethod}.`,
);

const sections: PolicySection[] = [
  {
    id: "summary",
    title: "In short",
    body: (
      <ul>
        <li>If we cannot deliver an item within {F.deliveryDeadlineHours} hours of payment confirmation, we refund the price you paid for it.</li>
        <li>If Steam reverses the trade while the item is under trade protection, we refund the item.</li>
        <li>You can cancel free of charge before {F.cancelBefore}.</li>
        <li>Once delivery has begun, the {F.withdrawalDays}-day right to cancel no longer applies, because you asked us at checkout to start delivery straight away.</li>
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
          cancel a contract for digital content, unless delivery has begun with their express consent and acknowledgement that the
          right is lost.
        </p>
        <p>
          Our items are delivered straight after payment. At checkout you tick a separate box, which is not ticked in advance: &ldquo;
          {F.waiverText}&rdquo; Without it the order cannot be placed. We store the time and the wording with your order and repeat it in your
          confirmation email.
        </p>
        <p>
          Delivery begins when we send the Steam trade offer for an item. Until then you can cancel without charge: email {F.email} or use
          the <Link href="/contact">contact form</Link> with your order number.
        </p>
      </>
    ),
  },
  {
    id: "when-we-refund",
    title: "When we refund",
    body: (
      <>
        <ul>
          <li>The item could not be sourced or the trade offer could not be sent within {F.deliveryDeadlineHours} hours of payment confirmation.</li>
          <li>The trade offer failed or expired before you could accept it, for a reason on our side.</li>
          <li>Steam reversed the trade while the item was under trade protection and the item left your inventory.</li>
          <li>The item delivered is not the item named in your order (a different market name, exterior or quality).</li>
          <li>You cancelled before {F.cancelBefore}.</li>
        </ul>
        <p>
          If an offer cannot be completed because of the receiving Steam account, for example an invalid trade URL, a private inventory, a
          trade ban or cooldown, or a Steam Guard restriction, we refund the item and tell you what to change before buying again.
        </p>
      </>
    ),
  },
  {
    id: "not-refundable",
    title: "When we do not refund",
    body: (
      <>
        <p>
          Once an item is in your Steam inventory and the trade is not reversed by Steam, we do not take it back or refund it because you
          changed your mind, found a lower price elsewhere, or wanted a different float or pattern within the stated range.
        </p>
        <p>
          Changes Valve makes to {F.game} or to Steam, such as changes to how an item looks or to trading rules, are outside our control and
          are not grounds for a refund.
        </p>
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
          paid in. Where an order had several items, we refund only the items affected. We do not charge a fee for refunds. Your bank may take
          a few further working days to show it on your statement.
        </p>
        <p>
          Each item on your <Link href="/account/orders">order page</Link> shows its status, including &ldquo;Refund pending&rdquo; and
          &ldquo;Refunded&rdquo;. We also email you when a refund is issued.
        </p>
      </>
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
