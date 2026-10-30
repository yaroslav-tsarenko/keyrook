import Link from "next/link";
import { PolicyLayout, policyMetadata, type PolicySection } from "@/components/layout/PolicyLayout/PolicyLayout";
import { POLICY_FACTS as F } from "@/lib/policy-facts";

export const generateMetadata = policyMetadata(
  "returns",
  `Cancellation, refunds and other remedies for game keys, subscriptions and gift cards bought from ${F.brand}. Refunds go to the original payment method in ${F.currencies}.`,
);

const sections: PolicySection[] = [
  {
    id: "operator",
    title: "Operator and scope",
    body: (
      <>
        <p>
          This Policy explains cancellation, refunds and other remedies for purchases through {F.brand}. It forms part of our{" "}
          <Link href="/policies/terms">Terms and conditions</Link>. {F.company}, company number {F.companyNumber}, {F.registeredOffice},{" "}
          {F.companyCountry}, operates {F.domain}. Contact: {F.email}.
        </p>
        <p>It covers digital Products (game keys, DLC, subscription codes and gift cards) issued to your Account. No physical delivery is involved.</p>
      </>
    ),
  },
  {
    id: "statutory",
    title: "Statutory rights",
    body: (
      <p>
        Mandatory consumer rights remain unaffected. Non-delivery, a key that does not activate, an incorrect Product, material misdescription
        or another failure to meet applicable standards may entitle you to redelivery, replacement, price reduction, refund or another legal
        remedy. Where UK statutory cancellation rules for digital content apply, the cancellation period is normally {F.withdrawalDays} days
        from contract conclusion, unless that right has lawfully ended through immediate supply as described below.
      </p>
    ),
  },
  {
    id: "withdrawal",
    title: "Immediate digital supply",
    body: (
      <>
        <p>
          Keys are issued straight after payment. At checkout we ask for your express consent to start supply during the cancellation period
          and your acknowledgement that you lose the right to cancel once supply begins, through a separate box that is not ticked in
          advance: “{F.waiverText}” We confirm this on a durable medium, in your confirmation email.
        </p>
        <p>
          Supply begins when a key is issued to your Account. Without these steps we do not treat your cancellation right as waived. Accepting
          general terms, internal reservation, security review or administrative preparation does not by itself remove that right. Your rights
          concerning keys that are not delivered, do not work or are not as described remain intact.
        </p>
      </>
    ),
  },
  {
    id: "before-delivery",
    title: "Cancelling before delivery",
    body: (
      <p>
        Contact {F.email} or use the <Link href="/contact">contact form</Link> promptly with your Order number and a clear statement of
        cancellation. You can cancel free of charge before {F.cancelBefore}. If a statutory cancellation right remains available, we honour a
        valid cancellation regardless of internal reservation steps. We will not remove mandatory rights merely because a distribution partner
        has been contacted or a key reserved.
      </p>
    ),
  },
  {
    id: "change-of-mind",
    title: "Completed delivery and change of mind",
    body: (
      <>
        <p>
          Delivery occurs when the correct key is made available in your Account. Subject to statutory rights, a completed correct delivery
          does not entitle you to a refund merely because:
        </p>
        <ul>
          <li>you changed your mind or found a lower price elsewhere;</li>
          <li>you selected the wrong Platform, region or edition when the product page stated them correctly;</li>
          <li>your device does not meet the system requirements shown on the product page;</li>
          <li>you redeemed the key, or shared it with someone who did.</li>
        </ul>
      </>
    ),
  },
  {
    id: "when-we-refund",
    title: "When we refund or replace",
    body: (
      <>
        <ul>
          <li>The key could not be issued within {F.deliveryDeadlineHours} hours of payment confirmation, or delivery repeatedly fails.</li>
          <li>The key is invalid, or was already redeemed before it was delivered to you, and no replacement is available.</li>
          <li>The key is for a different Product, Platform, region or edition than the product page stated.</li>
          <li>The publisher revoked the key for a reason that existed when we delivered it and that you did not cause.</li>
          <li>You validly cancelled.</li>
        </ul>
        <p>
          If a key does not activate, tell us within {F.guaranteeClaimDays} days of delivery. We first try to replace it; see the{" "}
          <Link href="/policies/warranty">Key guarantee</Link> for the procedure and what to send. You do not have to accept a materially
          different substitute. If we cannot deliver within a reasonable additional period, we refund; we will not retain the price because of
          a supplier failure.
        </p>
      </>
    ),
  },
  {
    id: "charges",
    title: "Duplicate, incorrect or unauthorised charges",
    body: (
      <>
        <p>
          Contact us about duplicate debits, a charge inconsistent with the confirmed total or currency, or a payment for a rejected Order. A
          temporary authorisation is not always a completed debit; we will check its status. Where we confirm an excess or duplicate amount
          collected, we return it. We never increase an agreed charge without your authorisation.
        </p>
        <p>
          If a card was used without authority, notify your card issuer and us promptly. We may secure the affected Account and examine
          payment, access and delivery records. You do not need our permission to report a payment to your issuer.
        </p>
        <p>
          We may request proportionate evidence to investigate suspected fraud, account takeover or abusive refund claims. Checks are not used
          to defeat a legal refund deadline or withhold an amount that must lawfully be returned.
        </p>
      </>
    ),
  },
  {
    id: "how-refunds",
    title: "Refund method, currency and timing",
    body: (
      <>
        <p>
          Refunds go to {F.refundMethod}, in the original Order currency ({F.currencies}). We do not normally refund to another person’s card.
          If the original route is unavailable, we agree another lawful method. We do not impose store credit where law requires money to be
          returned.
        </p>
        <p>
          Prices include applicable VAT; a full refund includes the VAT within the price and a partial refund the corresponding VAT adjustment.
          If your card uses another currency, your issuer may apply a different exchange rate or its own fees, which we do not control.
        </p>
        <p>
          We process approved refunds without undue delay and within {F.refundDays} days, including within {F.refundDays} days of being
          informed of a valid statutory cancellation. Your bank may take a few further working days to show it. Each Product on your{" "}
          <Link href="/account/orders">order page</Link> shows its refund status, and we email you when a refund is issued.
        </p>
        <p>
          A partial refund may resolve an undelivered Product in a multi-item Order, an excess charge or an agreed price reduction. We explain
          the calculation, including VAT.
        </p>
      </>
    ),
  },
  {
    id: "chargebacks",
    title: "Before you contact your bank",
    body: (
      <p>
        Please contact us first so that we can look into the problem; this does not prevent a lawful issuer dispute or court claim. For an
        Order whose keys were delivered and work as described, we may send the payment provider the order, delivery and key-reveal records we
        hold, as described in our <Link href="/policies/privacy">Privacy policy</Link>.
      </p>
    ),
  },
  {
    id: "contact",
    title: "How to apply and cancellation form",
    body: (
      <>
        <p>
          Email {F.email} with the Order number, Account email, reason, the remedy you want and any evidence (for example a screenshot of the
          activation error). Do not send passwords or full card details. A clear cancellation statement is sufficient where a legal
          cancellation right applies. If you are not satisfied with our answer, see our{" "}
          <Link href="/policies/complaints">Complaints policy</Link>.
        </p>
        <p>Where a statutory cancellation right applies, you may use the following form, but you do not have to:</p>
        <blockquote>
          <p>
            To: {F.company}, {F.registeredOffice}, {F.companyCountry}; {F.email}.
            <br />I give notice that I cancel my contract for the following digital Product(s):
            <br />Order number and date:
            <br />Consumer name and address:
            <br />Account email:
            <br />Date:
            <br />Signature (only if submitted on paper):
          </p>
        </blockquote>
      </>
    ),
  },
];

export default async function ReturnsPage() {
  return <PolicyLayout slug="returns" sections={sections} />;
}
