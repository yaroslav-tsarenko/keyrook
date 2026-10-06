import Link from "next/link";
import { PolicyLayout, policyMetadata, type PolicySection } from "@/components/layout/PolicyLayout/PolicyLayout";
import { POLICY_FACTS as F } from "@/lib/policy-facts";

export const generateMetadata = policyMetadata(
  "warranty",
  `${F.brand} item guarantee: if we cannot deliver an item you paid for, or Steam reverses the trade during trade protection, we refund the price you paid for it.`,
);

const sections: PolicySection[] = [
  {
    id: "guarantee",
    title: "What the guarantee covers",
    body: (
      <>
        <p>{F.guarantee}</p>
        <ul>
          <li>The item is not delivered within {F.deliveryDeadlineHours} hours of payment confirmation.</li>
          <li>The trade offer we send fails or expires for a reason on our side.</li>
          <li>Steam reverses the trade while the item is under trade protection (up to {F.tradeProtectionDays} days after delivery) and the item leaves your inventory.</li>
          <li>The item delivered does not match the market name, exterior or quality stated on the listing.</li>
        </ul>
        <p>
          We may offer to send the same item again instead of a refund. You choose: if you prefer the refund, we refund within {F.refundDays}{" "}
          days to {F.refundMethod}.
        </p>
      </>
    ),
  },
  {
    id: "what-it-is-not",
    title: "What the guarantee does not cover",
    body: (
      <>
        <ul>
          <li>Items that cannot be delivered because of the receiving Steam account (invalid trade URL, private inventory, trade ban or cooldown, Steam Guard restrictions). These items are refunded, not re-sent.</li>
          <li>The exact float value, pattern or appearance of an item within the float range and description shown on the listing.</li>
          <li>Changes Valve makes to {F.game} or to Steam after delivery.</li>
          <li>Items you trade, sell or lose access to after delivery, for example through a compromised Steam account.</li>
        </ul>
        <p>
          Your statutory rights as a consumer in the UK and EU are not affected. Digital content must be as described and of satisfactory
          quality, and this guarantee adds to those rights.
        </p>
      </>
    ),
  },
  {
    id: "claim",
    title: "How to make a claim",
    body: (
      <ol>
        <li>Email {F.email} or use the <Link href="/contact">contact form</Link>, with your order number and the item concerned.</li>
        <li>For a reversed trade, tell us the date the item left your inventory. A screenshot of your Steam inventory history helps.</li>
        <li>We check the trade record and reply {F.replyTime}.</li>
        <li>If the claim is covered, we refund the item within {F.refundDays} days, or re-send it if you prefer.</li>
      </ol>
    ),
  },
  {
    id: "automatic",
    title: "Claims we handle without being asked",
    body: (
      <p>
        Most failed deliveries and reversed trades are reported to us by our delivery partner. When that happens, the item shows
        &ldquo;Refund pending&rdquo; on your <Link href="/account/orders">order page</Link> and we refund it without you needing to write to us.
      </p>
    ),
  },
];

export default async function WarrantyPage() {
  return <PolicyLayout slug="warranty" sections={sections} />;
}
