import Link from "next/link";
import { PolicyLayout, SellerBlock, policyMetadata, type PolicySection } from "@/components/layout/PolicyLayout/PolicyLayout";
import { POLICY_FACTS as F } from "@/lib/policy-facts";
import { RESTRICTED_COUNTRIES } from "@/config/restricted-countries";

export const generateMetadata = policyMetadata(
  "terms",
  `The terms and conditions for buying game keys, DLC, subscriptions and gift cards from ${F.brand}, operated by ${F.company}.`,
);

const sections: PolicySection[] = [
  {
    id: "about",
    title: `About ${F.brand}`,
    body: (
      <>
        <p>
          These Terms and Conditions govern your access to and use of {F.domain}, your {F.brand} Account and related Services, and
          purchases made through the website. Please read them before placing an Order. By creating an Account or placing an Order, you
          agree to these Terms. If you do not agree, you must not use the Services or place an Order.
        </p>
        <p>
          {F.brand} is operated by {F.company}, company number {F.companyNumber}, with its registered office at {F.registeredOffice},{" "}
          {F.companyCountry}. Contact: {F.email}. In these Terms, “{F.brand}”, “we”, “us” and “our” mean {F.company}. Your contract for an
          Order is with {F.company}.
        </p>
        <SellerBlock />
        <p>
          {F.brand} provides an online service through which eligible users can browse, order, pay for and receive game keys, DLC,
          subscription codes, gift cards and other digital Products for third-party platforms.
        </p>
      </>
    ),
  },
  {
    id: "definitions",
    title: "Definitions",
    body: (
      <ul>
        <li><strong>Account</strong> means your {F.brand} user account.</li>
        <li><strong>Product</strong> means a digital activation key, code or voucher sold on {F.domain}, such as a game key, DLC, subscription or gift card.</li>
        <li><strong>Order</strong> means a request to purchase one or more Products through {F.brand}.</li>
        <li><strong>Platform</strong> means the third-party service on which a Product is redeemed, such as Steam, Epic Games, Xbox, PlayStation, Nintendo or a publisher’s own launcher.</li>
        <li><strong>Services</strong> means the website, Accounts, ordering and payment functions, key delivery, support and related features.</li>
        <li><strong>User</strong>, “you” and “your” mean the individual using the Services.</li>
      </ul>
    ),
  },
  {
    id: "who-can-order",
    title: "Eligibility and geographic restrictions",
    body: (
      <>
        <p>
          You must be at least {F.minAge}, have legal capacity to contract, and be permitted to use the Services under applicable law. You
          must be authorised to use the payment method connected with an Order.
        </p>
        <p>The Services are unavailable to persons located in:</p>
        <ul>
          {[...RESTRICTED_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
            <li key={c.code}>{c.name}</li>
          ))}
        </ul>
        <p>{F.restrictedTerritoriesStatement}</p>
        <p>
          You must not be subject to sanctions or other legal restrictions prohibiting us from serving you. Additional restrictions may apply
          where required by law, sanctions, payment availability or binding service-provider requirements. An unlisted country does not
          guarantee that every payment method, Product or Order is supported there. You must not conceal or misrepresent your location or
          identity to evade restrictions, including through a VPN, proxy or false address.
        </p>
      </>
    ),
  },
  {
    id: "services",
    title: "Nature of the Services",
    body: (
      <>
        <p>
          {F.brand} is a purchase-only service. Users cannot list Products for sale, accept payments from other users, maintain a
          withdrawable cash balance or request payouts.
        </p>
        <p>
          Products are sourced through technical integrations with authorised distribution partners and publishers. Commercial sourcing
          arrangements are confidential except where disclosure is legally required or reasonably necessary to resolve an Order.
          Third-party involvement does not remove our obligations to you under the contract or applicable law.
        </p>
      </>
    ),
  },
  {
    id: "account",
    title: "Your Account",
    body: (
      <>
        <p>
          Keys are delivered to your Account, so you must keep your login details secure, provide an accurate email address and not share
          access to your Account or impersonate another person. Notify us promptly at {F.email} of suspected unauthorised access.
        </p>
        <p>
          We never ask for your password, or for the password or authentication code of any Platform account. We may rely on authenticated
          Account instructions where reasonable, but this does not make you automatically liable for all unauthorised activity or remove
          rights relating to unauthorised payments.
        </p>
      </>
    ),
  },
  {
    id: "platforms",
    title: "Independence from Platforms and publishers",
    body: (
      <p>
        {F.brand} and {F.company} are independent of the Platforms and publishers whose Products we sell. The Services are not endorsed,
        sponsored or operated by them. Platform and game names, logos and content belong to their respective owners. Platforms are
        third-party services: their functionality, account decisions, regional rules and redemption procedures are outside our direct
        control.
      </p>
    ),
  },
  {
    id: "products",
    title: "Products and their attributes",
    body: (
      <>
        <p>
          Products are digital activation codes, not physical goods, legal tender, electronic money, securities or bank deposits. Buying a
          Product gives you a licence to redeem it on the stated Platform; it does not transfer intellectual property in the underlying game
          or service. Your use of the redeemed content remains subject to the Platform’s and publisher’s terms.
        </p>
        <p>
          Review the description before ordering, including the Platform, region or activation restrictions, edition, language and system
          requirements. Where the product page states specific attributes, they take priority over a generic illustrative image. We do not
          guarantee continued support of a game or service by its publisher.
        </p>
      </>
    ),
  },
  {
    id: "prices",
    title: "Prices, currencies and VAT",
    body: (
      <>
        <p>
          Prices are available in {F.currencies}. Checkout identifies the Order currency and the amount to be charged before you confirm
          payment, and payment is submitted in that currency. Displayed prices include applicable VAT. Any mandatory charge collected by{" "}
          {F.brand} is disclosed in the total before you place the Order. VAT details appear on transaction documentation where legally
          required.
        </p>
        <p>
          Prices may change with availability, demand, inventory updates or exchange rates. Changes do not affect an Order already accepted.
          A listing is not a binding offer; an obvious error may be corrected before acceptance. If an accepted Order contains an obvious
          material pricing error, we will notify you and seek agreement to the corrected price or cancel and refund it where lawful. We will
          not charge more without your agreement.
        </p>
        <p>
          Your card issuer may charge independent conversion or international transaction fees. These are outside our control and are not
          collected as part of our displayed price.
        </p>
      </>
    ),
  },
  {
    id: "orders",
    title: "Orders and acceptance",
    body: (
      <>
        <p>
          Select a Product, review its attributes and total price, provide a supported payment method, accept the applicable terms and submit
          your Order. An Order is your offer to purchase. An automated receipt is not acceptance unless it expressly confirms acceptance.
          Acceptance occurs when we issue an Order acceptance confirmation or begin fulfilling the Order following successful checks.
        </p>
        <p>
          Checks may cover availability, price, payment authorisation, location, fraud and legal restrictions. We may reject an Order before
          acceptance if it cannot lawfully or safely be fulfilled. If an accepted Product becomes unavailable or delivery fails, our{" "}
          <Link href="/policies/returns">Refund and Cancellation Policy</Link> governs the resolution. If we receive payment for an Order that
          is rejected or cancelled and no agreed replacement is supplied, we will refund the appropriate amount.
        </p>
      </>
    ),
  },
  {
    id: "payment",
    title: "Payments",
    body: (
      <>
        <p>
          We accept supported {F.cardMethods} cards, subject to eligibility and availability. Independent providers process payments and
          collect card information directly under their own applicable privacy terms. You confirm that you are authorised to use the payment
          method, that billing information is accurate and that the payment is lawful. Do not submit duplicate, fraudulent or unauthorised
          payments.
        </p>
        <p>
          Your issuer or a processing provider may delay or refuse authorisation. We do not guarantee that every card, country or payment
          attempt will be supported. See our <Link href="/policies/payment">Payment policy</Link>.
        </p>
      </>
    ),
  },
  {
    id: "delivery",
    title: "Delivery",
    body: (
      <>
        <p>
          Delivery is electronic: each key is issued to your Account, {F.deliveryWhere}, {F.deliveryUsual}. {F.deliveryEmailNote} Delivery
          occurs when the correct key is made available in your Account. Separate Products in one Order may be issued at different times.
        </p>
        <p>
          Estimates are not guarantees unless expressly stated. Platform outages, publisher restrictions, security checks, unavailable
          inventory and technical failures may delay delivery. If a key cannot be issued within {F.deliveryDeadlineHours} hours of payment
          confirmation, we refund it. See our <Link href="/policies/shipping">Delivery and Activation Policy</Link>.
        </p>
      </>
    ),
  },
  {
    id: "fraud",
    title: "Protecting your key and preventing fraud",
    body: (
      <p>
        Keys are revealed only in your Account. Redeem them only on the official Platform named on the product page. Keep a revealed key
        private: anyone who sees it can redeem it. We will never ask you to pay off-site, send us a key back or reveal a password to receive
        a Product. We are not responsible for keys you disclose to others or for independent phishing, except where responsibility arises
        under applicable law or from our own failure to exercise reasonable care.
      </p>
    ),
  },
  {
    id: "cancel",
    title: "Cancellation and refunds",
    body: (
      <>
        <p>
          Our <Link href="/policies/returns">Refund and Cancellation Policy</Link> and <Link href="/policies/warranty">Key guarantee</Link>{" "}
          form part of these Terms. Mandatory consumer rights remain unaffected.
        </p>
        <p>
          Where statutory digital-content cancellation rules apply, you may have a {F.withdrawalDays}-day cancellation period from contract
          conclusion. Loss of that right on immediate supply requires your express consent, your acknowledgement and our contract
          confirmation. Internal reservation or preparation alone does not remove it.
        </p>
        <p>
          A completed correct delivery does not ordinarily create a change-of-mind refund entitlement where the cancellation right has
          validly ended. Non-delivery, keys that do not activate, material misdescription and other legal remedies remain covered.
        </p>
      </>
    ),
  },
  {
    id: "chargebacks",
    title: "Payment disputes",
    body: (
      <p>
        Contact us promptly about an unauthorised, duplicate or incorrect payment or an unfulfilled Order. We may request proportionate
        evidence and temporarily restrict affected activity during an investigation. Do not knowingly submit false or abusive chargeback
        claims. Nothing requires you to waive or delay a lawful card dispute, miss an issuer deadline or obtain our permission to contact
        your issuer. We may provide relevant order, delivery and key-reveal records to the payment dispute process.
      </p>
    ),
  },
  {
    id: "prohibited",
    title: "Prohibited conduct",
    body: (
      <>
        <p>You must not:</p>
        <ul>
          <li>use the Services while under {F.minAge} or evade geographic restrictions;</li>
          <li>provide false identity or billing information;</li>
          <li>use stolen credentials, unauthorised payment methods or unlawful funds;</li>
          <li>engage in fraud, money laundering, sanctions evasion or illegal activity;</li>
          <li>resell keys commercially or manipulate prices, inventory, Orders or security systems;</li>
          <li>use unauthorised bots, scraping or automated purchase tools;</li>
          <li>introduce malware or access systems or Accounts without authority;</li>
          <li>exploit obvious errors or submit dishonest refund or chargeback claims;</li>
          <li>impersonate the company, support personnel, partners or publishers;</li>
          <li>use the Services to facilitate unlawful gambling;</li>
          <li>infringe third-party rights; or</li>
          <li>assist another person in such conduct.</li>
        </ul>
        <p>
          See also our <Link href="/policies/acceptable-use">Acceptable use policy</Link>.
        </p>
      </>
    ),
  },
  {
    id: "verification",
    title: "Verification and security checks",
    body: (
      <p>
        We may conduct proportionate checks of identity, age, country, payment authority or transaction purpose where necessary to prevent
        fraud or comply with law. We will not request identity documents without a legitimate, proportionate reason. If required checks
        cannot be completed, an Order may be delayed, rejected or cancelled. Our <Link href="/policies/privacy">Privacy policy</Link> explains
        how information collected is handled.
      </p>
    ),
  },
  {
    id: "suspension",
    title: "Account suspension and termination",
    body: (
      <>
        <p>
          We may restrict access for a material breach, suspected compromise, fraud, legal or payment risk, restricted location, or a binding
          legal requirement. Measures will be proportionate. Where appropriate, we will explain the general reason and give you an
          opportunity to respond.
        </p>
        <p>
          Suspension does not extinguish accrued rights or entitle us to confiscate a legally due refund. Accepted unfulfilled Orders must be
          completed or otherwise resolved under these policies and applicable law.
        </p>
      </>
    ),
  },
  {
    id: "availability",
    title: "Availability and service changes",
    body: (
      <p>
        Access may be interrupted by maintenance, updates, emergencies or third-party failures. We do not promise uninterrupted or
        error-free service. Features may change for legitimate technical, commercial, legal or security reasons. If a change prevents
        performance of an accepted Order, we will arrange an appropriate resolution, including a refund where required.
      </p>
    ),
  },
  {
    id: "ip",
    title: "Intellectual property",
    body: (
      <p>
        Our website, branding, software, original text and interface are owned by or licensed to {F.company}. Use them only for their
        intended lawful purpose. Without permission, you must not commercially reproduce our original content, imitate our branding, remove
        proprietary notices, or reverse engineer software except where applicable law permits. Third-party game content remains its owner’s
        property.
      </p>
    ),
  },
  {
    id: "third-party",
    title: "Third-party services",
    body: (
      <p>
        Platforms, payment, hosting, security and distribution services may operate under their own terms. Their independent actions are
        outside our direct control. However, we remain responsible for obligations owed to you that cannot be excluded by referring to another
        provider.
      </p>
    ),
  },
  {
    id: "consumer-rights",
    title: "Consumer rights and service standards",
    body: (
      <p>
        We provide our Services with reasonable care and skill. Supplied Products must correspond to their agreed description and meet
        applicable mandatory standards. We do not guarantee continued publisher support or uninterrupted Platform access. Nothing excludes
        liability for fraud, fraudulent misrepresentation, death or personal injury caused by negligence, or any liability or consumer right
        that cannot lawfully be excluded.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Liability",
    body: (
      <>
        <p>We are responsible for foreseeable loss caused by our breach or failure to use reasonable care and skill, subject to applicable law.</p>
        <p>
          We are not responsible to the extent loss is caused by incorrect instructions you supplied, a key you disclosed to someone else, or
          an independent event we could not reasonably prevent. Such exclusions do not apply where our own breach contributed to the loss or
          law requires otherwise. Where you use the Services as a consumer, we do not undertake responsibility for business losses or lost
          commercial profits.
        </p>
      </>
    ),
  },
  {
    id: "data",
    title: "Privacy",
    body: (
      <p>
        Our <Link href="/policies/privacy">Privacy policy</Link> describes personal-data processing and our{" "}
        <Link href="/policies/cookies">Cookie policy</Link> describes cookies and similar technologies. Acknowledging a policy is not consent
        to optional marketing or non-essential tracking; any required consent is obtained separately.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to these Terms",
    body: (
      <p>
        We may update the Terms for changes in the Services, law, security risks or third-party functionality. The revision date will be
        updated and additional notice provided where required. The version applicable when an Order was accepted normally continues to govern
        it. Changes do not retrospectively reduce accrued rights.
      </p>
    ),
  },
  {
    id: "general",
    title: "Transfer, severability and waiver",
    body: (
      <>
        <p>
          You may not transfer contractual obligations without our agreement. We may transfer the contract as part of a lawful business
          transfer provided your mandatory rights are preserved.
        </p>
        <p>
          If a provision is unlawful or unenforceable, the remaining provisions remain effective where possible. Delay in enforcing a right
          does not by itself waive that right.
        </p>
      </>
    ),
  },
  {
    id: "law",
    title: "Governing law and courts",
    body: (
      <p>
        These Terms and related non-contractual obligations are governed by the laws of England and Wales. Consumers retain mandatory
        protections applicable in their country of residence. The courts of England and Wales have jurisdiction, subject to any mandatory
        right to bring proceedings in the courts of your residence.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact and associated policies",
    body: (
      <>
        <p>
          Questions or complaints: {F.email} or {F.company}, {F.registeredOffice}, {F.companyCountry}, company number {F.companyNumber}.
          Include the Order number and relevant details, without passwords or full card information.
        </p>
        <p>
          Read these Terms with our <Link href="/policies/privacy">Privacy policy</Link>, <Link href="/policies/cookies">Cookie policy</Link>,{" "}
          <Link href="/policies/returns">Refund and Cancellation Policy</Link>, <Link href="/policies/shipping">Delivery and Activation Policy</Link>{" "}
          and <Link href="/policies/complaints">Complaints and Dispute Resolution Policy</Link>.
        </p>
      </>
    ),
  },
];

export default async function TermsPage() {
  return <PolicyLayout slug="terms" sections={sections} />;
}
