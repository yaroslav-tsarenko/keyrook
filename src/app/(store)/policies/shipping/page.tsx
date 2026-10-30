import Link from "next/link";
import { PolicyLayout, policyMetadata, type PolicySection } from "@/components/layout/PolicyLayout/PolicyLayout";
import { POLICY_FACTS as F } from "@/lib/policy-facts";

export const generateMetadata = policyMetadata(
  "shipping",
  `How ${F.brand} delivers game keys, subscriptions and gift cards to your account, ${F.deliveryUsual}, and how to activate them.`,
);

const sections: PolicySection[] = [
  {
    id: "operator",
    title: "Operator and scope",
    body: (
      <>
        <p>
          This Policy explains electronic delivery and activation of Products purchased through {F.brand}. It forms part of our{" "}
          <Link href="/policies/terms">Terms and conditions</Link> and works with our <Link href="/policies/returns">Refund and Cancellation Policy</Link>.
        </p>
        <p>
          {F.brand} is operated by {F.company}, company number {F.companyNumber}, registered office {F.registeredOffice}, {F.companyCountry}.
          Website: {F.domain}. Email: {F.email}.
        </p>
      </>
    ),
  },
  {
    id: "how",
    title: "How keys are delivered",
    body: (
      <>
        <p>
          No physical shipment is provided. Each key is issued to your Account, {F.deliveryWhere}. {F.deliveryEmailNote} Payment confirmation
          and delivery are separate events.
        </p>
        <p>
          Keys are sourced from authorised distribution partners and publishers. Commercial supplier arrangements are confidential except where
          disclosure is required by law or necessary to resolve an Order. We remain responsible for contractual obligations owed to you.
        </p>
      </>
    ),
  },
  {
    id: "process",
    title: "Typical process",
    body: (
      <>
        <ol>
          <li>You submit an Order and authorise payment.</li>
          <li>We check availability, payment and eligibility.</li>
          <li>The key is requested from our distribution partner.</li>
          <li>The key is issued to your Account and we email you.</li>
          <li>You reveal the key and activate it on the Platform named on the product page.</li>
        </ol>
        <p>Some steps are automated. Reserving or requesting a key is not completed delivery and does not by itself remove statutory cancellation rights.</p>
      </>
    ),
  },
  {
    id: "timing",
    title: "Timing",
    body: (
      <p>
        Keys arrive {F.deliveryUsual}. This is an estimate, not a guarantee: availability, payment checks, Platform or partner interruptions
        and technical problems may affect timing. If a key cannot be issued within {F.deliveryDeadlineHours} hours of payment confirmation, we
        refund it, as described in our <Link href="/policies/returns#when-we-refund">Refund and Cancellation Policy</Link>.
      </p>
    ),
  },
  {
    id: "before",
    title: "Check before you buy",
    body: (
      <>
        <p>
          Review the Platform, region or activation restrictions, edition, language and system requirements on the product page. Make sure you
          have, or can create, an account on that Platform. Products for a specific region may not activate elsewhere.
        </p>
        <p>We will never ask for your password, a Platform password or an authentication code to deliver a Product.</p>
      </>
    ),
  },
  {
    id: "redeem",
    title: "Activating your key",
    body: (
      <>
        <p>
          Redeem the key only on the official Platform or publisher service named on the product page; activation instructions are on your
          order page. Compare the key’s Product, Platform, region and edition with your Order before redeeming.
        </p>
        <p>
          Keep a revealed key private: anyone who sees it can redeem it. Avoid suspicious links, unknown extensions and anyone who asks for a
          key, payment or password in exchange for help.
        </p>
      </>
    ),
  },
  {
    id: "multiple",
    title: "Multiple-item Orders",
    body: (
      <p>
        Products in one Order may be issued at different times. Receipt of one does not confirm receipt of the others. Full delivery requires
        all confirmed Products to be issued, or the remaining part to be cancelled, refunded or otherwise agreed.
      </p>
    ),
  },
  {
    id: "not-working",
    title: "Problems, unavailable keys and revocations",
    body: (
      <>
        <p>
          If a key does not activate, is for the wrong Product, Platform, region or edition, or was already used, do not try workarounds;
          email us with the Order number and a screenshot of the error. Our <Link href="/policies/warranty">Key guarantee</Link> explains
          replacement and refund.
        </p>
        <p>
          Inventory may lag or a partner may fail to supply a key. We may offer a replacement, but you need not accept materially different
          attributes; otherwise the affected Product is cancelled and refunded. If a publisher later revokes a key for a reason that existed at
          delivery and that you did not cause, tell us and we will arrange a replacement or refund.
        </p>
        <p>Temporary failures may require another attempt. We will not treat a failed issue as proof of completed delivery.</p>
      </>
    ),
  },
  {
    id: "where",
    title: "Where we deliver",
    body: (
      <p>
        We do not accept Orders from persons located in {F.restrictedCountries} or the other countries listed in our{" "}
        <Link href="/policies/terms#who-can-order">Terms and conditions</Link>. {F.restrictedTerritoriesStatement}
      </p>
    ),
  },
  {
    id: "contact",
    title: "Reporting issues",
    body: (
      <>
        <p>
          Email {F.email} or use the <Link href="/contact">contact form</Link> if no key arrives, a key seems wrong, activation fails, a key is
          revoked, or the displayed status is inaccurate. Provide the Order number, the Platform, the approximate time and screenshots if
          available. Never send passwords, security codes or full card data.
        </p>
        <p>
          To investigate, we may review Order, payment and key records and logs, and exchange the minimum necessary details with our
          distribution partner, as described in our <Link href="/policies/privacy">Privacy policy</Link>.
        </p>
      </>
    ),
  },
];

export default async function ShippingPage() {
  return <PolicyLayout slug="shipping" sections={sections} />;
}
