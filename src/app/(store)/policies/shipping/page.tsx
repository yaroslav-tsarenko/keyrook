import Link from "next/link";
import { PolicyLayout, policyMetadata, type PolicySection } from "@/components/layout/PolicyLayout/PolicyLayout";
import { POLICY_FACTS as F } from "@/lib/policy-facts";

export const generateMetadata = policyMetadata(
  "shipping",
  `How ${F.brand} delivers ${F.game} items: a ${F.deliveryMethod} to your Steam account, ${F.deliveryUsual}. Steam trade protection, trade holds and what you need.`,
);

const sections: PolicySection[] = [
  {
    id: "how",
    title: "How items are delivered",
    body: (
      <>
        <p>
          There is no parcel and no delivery charge. Each item you buy is sent as a {F.deliveryMethod} to the Steam account linked to your{" "}
          {F.brand} account, using the trade URL you saved. The offer comes from a delivery account that holds the item; it is not sent
          from a person you are trading with.
        </p>
        <p>
          We request each trade offer straight after your payment is confirmed by our payment provider. Offers are sent {F.deliveryUsual}.
          Orders with several items are delivered item by item, so you may receive more than one offer.
        </p>
      </>
    ),
  },
  {
    id: "requirements",
    title: "What you need before you buy",
    body: (
      <>
        <ul>
          {F.buyerRequirements.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>
          You save your trade URL under <Link href="/account/steam">Steam account</Link>. You find it in Steam under Inventory, Trade
          Offers, &ldquo;Who can send me Trade Offers?&rdquo;. We check that the trade URL belongs to the Steam account you linked.
        </p>
      </>
    ),
  },
  {
    id: "accepting",
    title: "Accepting the trade offer",
    body: (
      <>
        <p>
          Open the Steam app or steamcommunity.com and go to Inventory, then Trade Offers. Before you accept, check that the offer gives you
          the item named in your order and asks for nothing from your inventory. Confirm it in the Steam Guard Mobile Authenticator if Steam
          asks you to.
        </p>
        <p>
          {F.offerExpiryNote} Your order page shows the status of each item: payment confirmed, processing, trade offer sent, delivered,
          or refunded.
        </p>
        <p>
          We never ask for your Steam password, Steam Guard codes or API key, and we never ask you to send items to us.
        </p>
      </>
    ),
  },
  {
    id: "protection",
    title: "Steam trade protection and trade holds",
    body: (
      <>
        <p>
          Steam may place items you receive in a trade under trade protection for up to {F.tradeProtectionDays} days. During that time the
          item is in your inventory and can be used in the game, but it cannot be traded or sold on the Steam Community Market.
        </p>
        <p>
          If your account has not had the Steam Guard Mobile Authenticator turned on for at least 7 days, Steam can hold the trade itself
          for up to {F.tradeHoldMaxDays} days before the item arrives. These rules are set by Steam and we cannot shorten them.
        </p>
        <p>
          If Steam reverses a trade during the protection period, so that the item leaves your inventory, we refund the price you paid for
          that item. See our <Link href="/policies/warranty">Item guarantee</Link>.
        </p>
      </>
    ),
  },
  {
    id: "failed",
    title: "If delivery does not happen",
    body: (
      <>
        <p>
          If we cannot deliver an item within {F.deliveryDeadlineHours} hours of payment confirmation, we refund the price you paid for it
          within {F.refundDays} days to {F.refundMethod}. We email you when this happens.
        </p>
        <p>
          Some problems are on the Steam account side: an invalid or outdated trade URL, a private inventory, a trade ban or cooldown, or a
          Steam Guard restriction. We tell you what went wrong on your order page. You can fix the account settings and buy again once the
          refund is made.
        </p>
      </>
    ),
  },
  {
    id: "where",
    title: "Where we sell",
    body: (
      <p>
        We sell to customers in the {F.marketCountries}. We do not sell to {F.restrictedCountries}, or to {F.restrictedTerritories}.
      </p>
    ),
  },
  {
    id: "ownership",
    title: "When the item becomes yours",
    body: (
      <p>
        An item is delivered when you accept the trade offer and it appears in your Steam inventory. It is held in your Steam account under
        Steam&rsquo;s terms of service. Questions about an order: email {F.email}.
      </p>
    ),
  },
];

export default async function ShippingPage() {
  return <PolicyLayout slug="shipping" sections={sections} />;
}
