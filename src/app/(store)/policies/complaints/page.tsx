import Link from "next/link";
import { PolicyLayout, policyMetadata, type PolicySection } from "@/components/layout/PolicyLayout/PolicyLayout";
import { POLICY_FACTS as F } from "@/lib/policy-facts";

export const generateMetadata = policyMetadata(
  "complaints",
  `How to complain to ${F.brand} and how ${F.company} reviews complaints. The process is free.`,
);

const sections: PolicySection[] = [
  {
    id: "operator",
    title: "Operator and scope",
    body: (
      <>
        <p>
          This Policy explains how to complain about {F.brand} and how {F.company} reviews complaints. The process is free. {F.brand} is
          operated by {F.company}, company number {F.companyNumber}, registered office {F.registeredOffice}, {F.companyCountry}. Website:{" "}
          {F.domain}. Contact: {F.email}.
        </p>
        <p>
          You may complain about an Account, Order, payment, refund, cancellation, Product description, key delivery or activation, a
          restriction, suspected fraud, customer support, privacy or another aspect of the Services. Our{" "}
          <Link href="/policies/returns">Refund and Cancellation Policy</Link>, <Link href="/policies/shipping">Delivery and Activation Policy</Link>{" "}
          or <Link href="/policies/privacy">Privacy policy</Link> also applies to the underlying issue.
        </p>
      </>
    ),
  },
  {
    id: "how",
    title: "How to complain",
    body: (
      <>
        <p>
          You may first ask for help at {F.email}. If you are dissatisfied or want a formal investigation, say that your message is a
          complaint. Email {F.email}, use the <Link href="/contact">contact form</Link> or write to {F.company}, {F.registeredOffice},{" "}
          {F.companyCountry}. You do not need to contact our distribution partner or the publisher first. Include, where relevant:
        </p>
        <ul>
          <li>your name and Account email;</li>
          <li>Order number and relevant date;</li>
          <li>a description of the problem and steps already taken;</li>
          <li>payment references or a screenshot of the activation error;</li>
          <li>the outcome you want.</li>
        </ul>
        <p>
          Do not provide passwords, authentication codes or complete card details. Missing information may require follow-up but does not
          invalidate a complaint. Our support hours are {F.supportHours}.
        </p>
      </>
    ),
  },
  {
    id: "urgent",
    title: "Urgent security issues",
    body: (
      <p>
        Report unauthorised payments, compromised Accounts and phishing promptly. Contact your card issuer for a compromised card and the
        Platform’s official support for a compromised Platform account.
      </p>
    ),
  },
  {
    id: "timeline",
    title: "Acknowledgement, investigation and response",
    body: (
      <>
        <p>
          We acknowledge formal complaints {F.complaintsAck}, with a reference and the next steps. An acknowledgement does not mean the
          requested remedy has been approved.
        </p>
        <p>
          We review the relevant Account, Order, payment, refund, key and communication records. We may ask our distribution partner or
          payment provider for evidence, sharing only what is reasonably necessary. Commercial confidentiality does not excuse a failure to
          investigate. We may ask you for proportionate information, such as references or a screenshot; you must not fabricate or conceal
          evidence. If evidence is unavailable, we consider what the remaining records establish.
        </p>
        <p>
          We send a reasoned response within {F.complaintsDays} days, explaining our findings, decision, any remedy and how to seek review. If
          we need longer, for example while a publisher checks a key, we tell you why and when you will hear from us. Any statutory deadline
          takes priority.
        </p>
      </>
    ),
  },
  {
    id: "outcomes",
    title: "Outcomes",
    body: (
      <>
        <p>
          Outcomes may include clarification, correction, redelivery, a replacement key, cancellation, refund, payment correction, review of an
          Account restriction, extra security measures, or an explanation that no error was established. Refunds follow our Refund and
          Cancellation Policy, normally to the original method in the original currency ({F.currencies}), including the VAT within the
          refunded price.
        </p>
        <p>
          For payment complaints, give the Order, amount, currency, date and transaction reference. You do not need to complete our process
          before a lawful issuer dispute and must not miss an issuer deadline while waiting for us. False or abusive claims are prohibited; we
          may submit order and delivery evidence to the parties reviewing a dispute.
        </p>
        <p>
          For Account restrictions, we review access records, risk indicators, payment disputes, location eligibility and your explanation. We
          explain the general basis where appropriate, but may withhold detail that would compromise security.
        </p>
      </>
    ),
  },
  {
    id: "escalate",
    title: "Internal review and external options",
    body: (
      <>
        <p>
          Reply to our decision or email {F.email} explaining why it should change, what evidence was overlooked and the remedy sought. Where
          reasonably possible, someone not solely responsible for the first outcome reviews it. Review is not a prerequisite to exercising
          statutory rights.
        </p>
        <p>
          Depending on the issue, you may contact your card issuer, a consumer-protection authority (Citizens Advice in England, Wales and
          Scotland, Consumerline in Northern Ireland, or the European Consumer Centre in your EU country), a competent regulator, an
          alternative dispute resolution body or a court, as described in the governing law section of our{" "}
          <Link href="/policies/terms#law">Terms and conditions</Link>. If legally required, we will identify a relevant dispute resolution
          body and say whether we use it; we do not claim membership of any scheme.
        </p>
        <p>
          Data protection complaints can go to the Information Commissioner’s Office, Wycliffe House, Water Lane, Wilmslow, Cheshire, SK9 5AF,
          United Kingdom (<a href="https://ico.org.uk/" rel="noopener noreferrer" target="_blank">ico.org.uk</a>), or another competent
          authority, as described in our <Link href="/policies/privacy#rights">Privacy policy</Link>.
        </p>
      </>
    ),
  },
  {
    id: "records",
    title: "Fair treatment and records",
    body: (
      <>
        <p>
          A good-faith complaint does not by itself justify suspension or loss of rights. We may act proportionately against threats,
          harassment, fraud or fabricated evidence, while preserving access to legally required remedies.
        </p>
        <p>
          We keep complaint records for {F.retention.supportMessagesMonths} months, for follow-up, service quality, fraud prevention and legal
          claims, under our Privacy policy. We may update this procedure; the date above shows the current version, and updates do not remove
          accrued rights.
        </p>
      </>
    ),
  },
];

export default async function ComplaintsPage() {
  return <PolicyLayout slug="complaints" sections={sections} />;
}
