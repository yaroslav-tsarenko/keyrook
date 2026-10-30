import Link from "next/link";
import { PolicyLayout, SellerBlock, policyMetadata, type PolicySection } from "@/components/layout/PolicyLayout/PolicyLayout";
import { POLICY_FACTS as F } from "@/lib/policy-facts";

export const generateMetadata = policyMetadata(
  "privacy",
  `How ${F.company} (${F.brand}) collects, uses, shares and retains personal information, and your rights under data protection law.`,
);

const sections: PolicySection[] = [
  {
    id: "controller",
    title: "Controller and contact",
    body: (
      <>
        <p>
          This Policy explains how {F.company} collects, uses, shares and retains personal information in connection with {F.brand}, and the
          rights available to you under applicable data protection law.
        </p>
        <p>
          {F.brand} is operated by {F.company}, company number {F.companyNumber}, registered office {F.registeredOffice}, {F.companyCountry}.
          Website: {F.domain}. Email: {F.email}. We are the controller of the processing described here unless an independent controller is
          identified. “{F.brand}”, “we”, “us” and “our” refer to {F.company}.
        </p>
        <SellerBlock />
      </>
    ),
  },
  {
    id: "scope",
    title: "Scope",
    body: (
      <p>
        This Policy applies to website visits, Accounts, browsing and Orders, payments, key delivery, support, complaints and
        communications. It does not govern independent processing by Platforms (such as Steam, Epic Games, Xbox, PlayStation or Nintendo),
        publishers or other third-party websites; their privacy information applies to their own services, including when you redeem a key.
      </p>
    ),
  },
  {
    id: "collect",
    title: "Information we collect",
    body: (
      <>
        <h3>Account and contact information</h3>
        <p>
          Account identifier, email, name if provided, country, date of birth or confirmation of age eligibility, language and
          communication preferences, registration details and access records. Passwords are stored only as a hash.
        </p>
        <h3>Orders and keys</h3>
        <p>
          Order numbers, Products ordered, amount, currency, VAT information where relevant, timestamps, payment and authentication status,
          transaction references, billing information, refunds, cancellations, disputes and chargebacks. The keys issued to you are stored
          encrypted, together with when each key was revealed in your Account. We also record your request for immediate delivery and the
          wording you agreed to.
        </p>
        <h3>Technical and usage information</h3>
        <p>
          IP address, approximate location, browser and operating system, device or session identifiers, access times, pages and features
          used, referral information, errors and security logs. Cookies and similar technologies are described in our{" "}
          <Link href="/policies/cookies">Cookie policy</Link>.
        </p>
        <h3>Communications</h3>
        <p>
          Support and complaint records may include your contact details, Order reference, message, attachments, screenshots (for example
          of a Platform activation error) and our responses. Provide only information relevant to your request.
        </p>
        <h3>Fraud and verification information</h3>
        <p>
          Where justified, we may process login and payment attempts, device or Account relationships, risk indicators, location
          inconsistencies, sanctions-screening results, disputed-payment records and information needed to confirm identity, age or payment
          authority. Any request for identity evidence must have a legitimate, proportionate purpose; not every user undergoes document
          verification.
        </p>
        <h3>Marketing information</h3>
        <p>
          If you sign up for marketing, your email, consent or preference records, communications sent and unsubscribe records.
        </p>
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
            We do not store or process full payment card data. Card payments are processed by an independent PCI DSS compliant payment
            provider{F.paymentProviderNamed ? `, ${F.paymentProviderNamed}` : ""}.
          </strong>
        </p>
        <p>
          You enter your card details on the provider’s hosted payment page, not on our website. Your bank may ask you to confirm a payment
          with 3-D Secure. We receive only the result of the payment, a transaction reference and, where supplied, limited masked card
          details. Do not send card details to our support team.
        </p>
      </>
    ),
  },
  {
    id: "sources",
    title: "Sources",
    body: (
      <p>
        Information comes from you, payment and fraud-prevention providers, our distribution partners (for example the status of a key
        request), your browser or device, and lawful public sources used for relevant security or compliance checks.
      </p>
    ),
  },
  {
    id: "use",
    title: "Purposes and lawful bases",
    body: (
      <>
        <h3>Accounts, Orders and delivery</h3>
        <p>
          To authenticate Accounts, process payments, issue and display keys, confirm delivery, replace keys that do not activate, provide
          support and handle cancellations or refunds. The principal basis is taking steps at your request before a contract or performing
          our contract with you.
        </p>
        <h3>Security and fraud prevention</h3>
        <p>
          To secure Accounts, detect unauthorised payments, enforce location restrictions and respond to disputes. We rely on legitimate
          interests in protecting Users, payments and our systems, or a legal obligation where one applies.
        </p>
        <h3>Legal and business records</h3>
        <p>
          For tax and accounting requirements, lawful authority requests, sanctions obligations and legal proceedings, based on the relevant
          legal obligation or legitimate interests in establishing, exercising or defending legal rights.
        </p>
        <h3>Improvement and diagnostics</h3>
        <p>
          To identify faults, monitor performance and improve the Services, based on legitimate interests. Where consent is required for
          associated device access or tracking, we obtain it first.
        </p>
        <h3>Service communications</h3>
        <p>
          Order confirmations, delivery updates, payment messages, security notices and complaint responses are based on contract, legal
          obligations or legitimate interests. They are separate from optional advertising.
        </p>
        <h3>Marketing</h3>
        <p>
          Where used and permitted by law, promotional communications rely on consent or an applicable existing-customer permission. You may
          unsubscribe using the link in each message or by emailing {F.email}. Essential service messages may continue.
        </p>
        <p>
          You can object to processing based on legitimate interests and withdraw consent at any time without affecting earlier lawful
          processing. Acknowledging this Policy is not blanket consent.
        </p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "Recipients",
    body: (
      <>
        <ul>
          <li>
            <strong>Payment providers</strong> receive what is needed for authorisation, authentication, fraud prevention, refunds and
            disputes. They may act as independent controllers and provide their own privacy information within the payment process.
          </li>
          <li>
            <strong>Distribution partners</strong> may receive the Order reference and Product requested so that a key can be supplied or a
            faulty key investigated. Unrelated billing details, support communications or Account data are not routinely shared.
          </li>
          <li>
            <strong>Technical providers</strong> support hosting, infrastructure, security, email and customer service. Access is limited to
            what their role requires and subject to appropriate safeguards.
          </li>
          <li>
            <strong>Advisers and authorities</strong>: lawyers, accountants, auditors, insurers or banks, and courts, regulators or competent
            authorities where lawful and necessary.
          </li>
          <li>
            <strong>Corporate transactions</strong>: subject to safeguards in a genuine business sale, restructuring or financing.
          </li>
        </ul>
        <p>
          We do not sell personal information. If advertising or analytics technologies are deployed, they will be disclosed in our cookie
          information together with the choices you have.
        </p>
      </>
    ),
  },
  {
    id: "transfers",
    title: "International transfers",
    body: (
      <p>
        Some providers or systems may process information outside the UK. Where a restricted transfer occurs, we use the required lawful
        mechanism, such as an adequacy decision, approved contractual clauses with the UK addendum, or a UK international data transfer
        agreement. Where EU GDPR applies, the corresponding EU requirements are also addressed. Contact us for information about the
        safeguards that apply to your information.
      </p>
    ),
  },
  {
    id: "retention",
    title: "Retention",
    body: (
      <>
        <p>
          We retain personal information only as long as needed for its purpose and for legal, accounting, security or claims requirements.
        </p>
        <ul>
          <li>Order, key and financial records: {F.retention.orderRecordsYears} years, for tax, accounting, consumer and claims purposes.</li>
          <li>Support and complaint messages: {F.retention.supportMessagesMonths} months.</li>
          <li>Accounts: until you ask us to close yours, or after {F.retention.inactiveAccountYears} years without a sign-in or order.</li>
          <li>Security records: proportionately to the risk and investigation needs.</li>
          <li>Marketing consent and suppression records: as long as needed to respect your choices.</li>
        </ul>
        <p>When no longer required, information is deleted or anonymised, including within normal backup cycles.</p>
      </>
    ),
  },
  {
    id: "security",
    title: "Security",
    body: (
      <p>
        We use appropriate technical and organisational measures designed to protect information against unauthorised access, loss,
        alteration or disclosure. No online system is absolutely secure. Protect your email account and your {F.brand} password, and notify us
        of suspected compromise. Do not provide passwords or authentication codes to support personnel.
      </p>
    ),
  },
  {
    id: "automated",
    title: "Automated tools and decisions",
    body: (
      <p>
        We or our providers may use automated risk signals to identify unusual payments, location inconsistencies or possible fraud. These may
        trigger verification, review, delay or rejection of a transaction. If a decision about you is made solely by automated processing and
        has legal or similarly significant effects, you may request information about it, human intervention and an opportunity to express
        your view and challenge it by emailing {F.email}.
      </p>
    ),
  },
  {
    id: "rights",
    title: "Your rights",
    body: (
      <>
        <p>
          Subject to applicable law, you may request access, correction, erasure, restriction or portability of your personal information;
          object to processing based on legitimate interests; withdraw consent; and challenge qualifying automated decisions.{" "}
          <strong>You may object to use of your information for direct marketing at any time.</strong>
        </p>
        <p>
          Rights may be limited where continued processing is legally required or needed for legal claims. Closing an Account does not
          necessarily require immediate deletion of all transaction records.
        </p>
        <p>
          Email {F.email} with enough information to identify the relevant records. We may request proportionate verification and normally
          respond within one month, explaining any lawful extension within that period. Requests are normally free.
        </p>
        <p>
          You may also complain to the Information Commissioner’s Office, Wycliffe House, Water Lane, Wilmslow, Cheshire, SK9 5AF, United
          Kingdom (<a href="https://ico.org.uk/" rel="noopener noreferrer" target="_blank">ico.org.uk</a>), or to the competent authority in
          your country.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        {F.brand} is for persons aged {F.minAge} or over. If we learn that a minor has used the Services, we may restrict or close the Account
        and remove information that has no continuing lawful purpose. Limited records may be retained for fraud prevention, refunds or legal
        obligations. Parents or guardians may contact {F.email}.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Third-party services and updates",
    body: (
      <>
        <p>
          Links to independent websites, including Platforms where you redeem keys, do not place their processing under our control. Our use
          of another provider does not remove our own data protection obligations.
        </p>
        <p>
          We may revise this Policy for changes in processing, providers, law or the Services. The date above will be updated, material
          changes will be communicated where required, and new consent obtained where legally necessary.
        </p>
      </>
    ),
  },
];

export default async function PrivacyPage() {
  return <PolicyLayout slug="privacy" sections={sections} />;
}
