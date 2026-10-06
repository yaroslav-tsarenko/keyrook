import Link from "next/link";
import { PolicyLayout, SellerBlock, policyMetadata, policyTable, type PolicySection } from "@/components/layout/PolicyLayout/PolicyLayout";
import { STORE_POLICY } from "@/config/store-policy";
import { POLICY_FACTS as F } from "@/lib/policy-facts";

export const generateMetadata = policyMetadata(
  "privacy",
  `How ${F.company} (${F.brand}) collects and uses personal data under UK GDPR and EU GDPR, who processes it, how long it is kept and your rights.`,
);

const purposes: { purpose: string; data: string; basis: string }[] = [
  { purpose: "Taking your order and delivering your keys", data: "Name, email, phone (optional), billing address, products ordered, the keys issued to you (stored encrypted)", basis: "Contract" },
  { purpose: "Showing your keys only to you", data: "When each key was revealed in your account and how many times", basis: "Contract and legitimate interests" },
  { purpose: "Running your account", data: "Name, email, phone, date of birth, address, password (stored as a hash), order history, saved items", basis: "Contract" },
  { purpose: "Recording your request for immediate delivery", data: "The time you ticked the checkbox and the wording you agreed to", basis: "Legal obligation" },
  { purpose: `Checking you are ${F.minAge} or over`, data: "Date of birth", basis: "Contract and legitimate interests" },
  { purpose: "Answering messages and complaints", data: "Name, email, order number, the content of your message, the IP address it was sent from", basis: "Contract and legitimate interests" },
  { purpose: "Refunds, chargebacks and fraud prevention", data: "Order details, payment result and transaction reference, IP address", basis: "Legal obligation and legitimate interests" },
  { purpose: "Not taking orders from restricted countries and territories", data: "Billing country and address", basis: "Legal obligation" },
  { purpose: "Accounting and tax records", data: "Order and refund records", basis: "Legal obligation" },
  { purpose: "Newsletter, only if you sign up", data: "Email address", basis: "Consent" },
  { purpose: "Keeping the website secure and working", data: "IP address, browser and device type, pages requested, error logs", basis: "Legitimate interests" },
];

const sections: PolicySection[] = [
  {
    id: "controller",
    title: "Who is responsible for your data",
    body: (
      <>
        <p>
          {F.company}, trading as {F.brand}, is the controller of the personal data described in this policy. This policy applies to
          customers in the United Kingdom under the UK GDPR and the Data Protection Act 2018, and to customers in the European Union
          under the EU General Data Protection Regulation.
        </p>
        <SellerBlock />
        <p>For any question about your data or to use your rights, email {F.email}.</p>
      </>
    ),
  },
  {
    id: "collect",
    title: "What we collect",
    body: (
      <>
        <ul>
          <li><strong>Account details:</strong> first and last name, email, phone number, date of birth, street, city, postcode and country, and your password, which we store only as a one-way hash.</li>
          <li><strong>Order details:</strong> the products you buy, billing address, contact details, your request for immediate delivery, the delivery status of each key, and the payment result and transaction reference sent to us by our payment provider.</li>
          <li><strong>Keys:</strong> the activation keys issued to you. We store them encrypted and decrypt a key only when you select Reveal key in your account. We record when a key was first revealed.</li>
          <li><strong>Messages:</strong> what you send through the contact form or by email, including any order number, and for the contact form the IP address it was sent from.</li>
          <li><strong>Saved items:</strong> products you save to your account.</li>
          <li><strong>Newsletter:</strong> your email address, if you sign up.</li>
          <li><strong>Technical data:</strong> IP address, browser and device type, and the pages requested, recorded in server logs. Browser storage is described in our <Link href="/policies/cookies">Cookie policy</Link>.</li>
        </ul>
      </>
    ),
  },
  {
    id: "card-data",
    title: "Card payments",
    body: (
      <>
        <p>
          <strong>
            We do not store or process full payment card data. All card payments are processed by our PCI DSS compliant payment provider
            {F.paymentProviderNamed ? `, ${F.paymentProviderNamed}` : ""}.
          </strong>
        </p>
        <p>
          You enter your card details on the provider&rsquo;s hosted payment page, not on our website. Payments are protected by 3-D Secure
          and Strong Customer Authentication (SCA), so your bank may ask you to confirm a payment, for example in your banking app. We
          receive only the result of the payment and a transaction reference.
        </p>
      </>
    ),
  },
  {
    id: "use",
    title: "Why we use it and our lawful basis",
    body: (
      <div className="overflow-x-auto">
        <table className={policyTable}>
          <thead>
            <tr>
              <th scope="col">Purpose</th>
              <th scope="col">Data</th>
              <th scope="col">Lawful basis</th>
            </tr>
          </thead>
          <tbody>
            {purposes.map((row) => (
              <tr key={row.purpose}>
                <td className="font-medium text-ink">{row.purpose}</td>
                <td className="text-ink-muted">{row.data}</td>
                <td>{row.basis}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  },
  {
    id: "sharing",
    title: "Who we share it with",
    body: (
      <>
        <p>
          We share personal data only with service providers that process it on our behalf and under our instructions, and only the data
          each one needs:
        </p>
        <ul>
          {STORE_POLICY.processors.map((p) => (
            <li key={p.role}>
              <strong>{p.name ? `${p.role} (${p.name})` : p.role}:</strong> {p.purpose.charAt(0).toLowerCase() + p.purpose.slice(1)}.
            </li>
          ))}
        </ul>
        <p>
          We may also disclose data where the law requires it, for example to tax authorities or the police, or to a card issuer when a
          payment is disputed. We do not sell personal data and do not share it with advertisers.
        </p>
      </>
    ),
  },
  {
    id: "transfers",
    title: "International transfers",
    body: (
      <p>
        Our key distribution partner receives the product and quantity of each order and our own order reference. It does not receive your
        name, email, address or card details. Where a service provider
        processes data outside the UK or the European Economic Area, we use an adequacy decision or standard contractual clauses (with the UK
        International Data Transfer Addendum for UK data).
      </p>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <ul>
        <li>Order, payment and refund records: {F.retention.orderRecordsYears} years after the order, for accounting and tax law.</li>
        <li>Your account: until you ask us to close it, or after {F.retention.inactiveAccountYears} years without a sign-in or order. Order records are then kept as above.</li>
        <li>Messages and complaints: {F.retention.supportMessagesMonths} months after the conversation ends.</li>
        <li>Newsletter: until you unsubscribe.</li>
      </ul>
    ),
  },
  {
    id: "rights",
    title: "Your rights",
    body: (
      <>
        <p>You have the right to:</p>
        <ul>
          <li>get a copy of the personal data we hold about you;</li>
          <li>have inaccurate data corrected;</li>
          <li>have data deleted where we no longer need it or have no lawful basis to keep it;</li>
          <li>restrict or object to our use of it, including where we rely on legitimate interests;</li>
          <li>receive data you gave us in a portable format;</li>
          <li>withdraw consent at any time, for example by unsubscribing from the newsletter or changing your cookie settings.</li>
        </ul>
        <p>
          Email {F.email} to use any of these rights. We reply within one month. We may ask you to confirm your identity before we act on a
          request.
        </p>
        <p>
          You can complain to a supervisory authority: in the United Kingdom, the Information Commissioner&rsquo;s Office (ico.org.uk); in
          the European Union, the data protection authority of the country where you live or work. We would appreciate the chance to deal
          with your concern first.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "Security",
    body: (
      <p>
        The website is served only over HTTPS. Passwords are stored as one-way hashes. Access to customer data is limited to the people who
        need it to fulfil orders and answer messages. Keys are encrypted at rest and shown only to the signed-in account that bought them; our
        staff do not see them in the admin area. Card details never reach our systems.
      </p>
    ),
  },
  {
    id: "automated",
    title: "Automated decisions",
    body: (
      <p>
        We do not make decisions with legal or similarly significant effects about you by automated means alone. Your card issuer and our
        payment provider run their own automated fraud checks and may decline a payment. If that happens, contact us and we will look at the
        order.
      </p>
    ),
  },
  {
    id: "age",
    title: "Age",
    body: (
      <p>
        Our store is for adults. We do not knowingly collect data from anyone under {F.minAge}. If you believe a person under {F.minAge} has
        created an account, email {F.email} and we will delete it.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: <p>We update this policy when the way we use personal data changes. The date at the top of the page shows the latest version.</p>,
  },
];

export default async function PrivacyPage() {
  return <PolicyLayout slug="privacy" sections={sections} />;
}
