import Link from "next/link";
import { PolicyLayout, SellerBlock, policyMetadata, type PolicySection } from "@/components/layout/PolicyLayout/PolicyLayout";
import { POLICY_FACTS as F } from "@/lib/policy-facts";

export const generateMetadata = policyMetadata(
  "terms",
  `The terms ${F.company} trades on as ${F.brand}: who can order, product information, prices, payment, delivery of activation keys, the right to cancel, refunds and complaints.`,
);

const sections: PolicySection[] = [
  {
    id: "about",
    title: "About these terms",
    body: (
      <>
        <p>
          These terms apply to every order placed on {F.domain}. {F.brand} is a trading name of {F.company}. When these terms say
          “we”, “us” or “our”, they mean {F.company}. “You” means the person placing the order.
        </p>
        <SellerBlock />
        <p>
          {F.company} is the seller of every product on {F.domain}. Product information and keys are obtained from distribution partners, but your
          contract is with {F.company}.
        </p>
        <p>
          These terms work together with our <Link href="/policies/shipping">Delivery policy</Link>,{" "}
          <Link href="/policies/returns">Refund policy</Link>, <Link href="/policies/warranty">Key guarantee</Link>,{" "}
          <Link href="/policies/payment">Payment policy</Link>, <Link href="/policies/privacy">Privacy policy</Link> and{" "}
          <Link href="/policies/cookies">Cookie policy</Link>. Nothing in them reduces the rights you have by law as a consumer.
        </p>
      </>
    ),
  },
  {
    id: "definitions",
    title: "Words we use",
    body: (
      <ul>
        <li><strong>Product:</strong> a game or DLC key, subscription code, gift card or top-up code, or software licence key sold on {F.domain}.</li>
        <li><strong>Key:</strong> the activation key, code or serial number issued to you for a product.</li>
        <li><strong>Platform:</strong> the service where a key is redeemed, such as Steam, the EA app, Xbox or PlayStation.</li>
        <li><strong>Publisher:</strong> the company responsible for the game, service, card or software behind a key.</li>
      </ul>
    ),
  },
  {
    id: "who-can-order",
    title: "Who can order",
    body: (
      <>
        <p>
          You must be at least {F.minAge} years old to create an account or place an order. We ask for your date of birth when you register
          and do not take orders from anyone under {F.minAge}.
        </p>
        <p>
          We supply consumers buying products for their own use. You may not buy products to resell them. The details you give us (name,
          email, phone, date of birth and billing address) must be accurate and your own, and the card you pay with must be yours or used with
          its holder’s permission.
        </p>
      </>
    ),
  },
  {
    id: "where-we-sell",
    title: "Where we deliver",
    body: (
      <>
        <p>We serve customers in the {F.marketCountries}. Checkout only accepts billing addresses in these countries.</p>
        <p>
          We do not deliver to or accept orders or accounts from {F.restrictedCountries}, or from {F.restrictedTerritories}. These
          countries and territories are excluded from registration and checkout. We do not list keys whose activation region is limited to
          any of them. If we find that an order is connected to one of them, for example through the billing address or payment card, we
          cancel it and refund the full amount paid.
        </p>
        <p>
          You must not use a VPN, proxy, false address or someone else’s card to hide where you are or to get around a restriction. We
          do not offer keys that need a VPN to activate.
        </p>
      </>
    ),
  },
  {
    id: "products",
    title: "Product information",
    body: (
      <>
        <p>
          Before you order, check the product page: the platform the key is redeemed on, the activation region, the supported languages,
          the edition, the duration of a subscription or the value and currency of a gift card, the account you need, and for PC games
          and DLC the system requirements.
        </p>
        <p>
          A purchase gives you a key only, with no disc, box or printed card. Cover art and screenshots come from the publisher and show
          the product, not the key. Descriptions, release dates and requirements are supplied by publishers and distributors; we take care to
          keep them accurate. If we find a material error in a price, description, region or platform, we correct it and, where needed, cancel
          the affected order and refund it.
        </p>
        <p>
          We do not offer pre-orders. Every product listed can be delivered straight after payment.
        </p>
      </>
    ),
  },
  {
    id: "platforms",
    title: "Platforms and publishers",
    body: (
      <>
        <p>
          Redeeming a key needs an account with the platform and acceptance of the platform’s and publisher’s own terms and licence.
          A game or software key gives you a licence to use the content under those terms; it does not transfer ownership of the content.
        </p>
        <p>
          A subscription code gives access for the duration and region shown. We do not renew it or charge you again; any renewal is set up by you
          with the platform. Gift card and top-up codes add the value shown to an account set to the region shown, and the balance is held and
          governed by the platform that issues it.
        </p>
        <p>
          {F.brand} is not affiliated with or endorsed by the platforms and publishers whose products it offers. We are not responsible for
          platform outages, a platform’s decision about your account for reasons unrelated to the key, or changes a publisher makes to a
          game or service after you redeem it. This does not limit our duty to deliver a key that matches its description.
        </p>
      </>
    ),
  },
  {
    id: "orders",
    title: "How an order becomes a contract",
    body: (
      <>
        <ol>
          <li>You sign in to your {F.brand} account and add products to your cart.</li>
          <li>At checkout you enter your contact details and billing address.</li>
          <li>We re-check the price and availability of each product. If a price has gone up, we show you the new total before you can pay.</li>
          <li>You tick the box to agree to these terms and our Refund policy and, separately, the box asking us to start delivery straight away, and select Pay.</li>
          <li>You are taken to our payment provider’s hosted page to pay by card.</li>
          <li>Once the payment provider confirms the payment to us, we email you an order confirmation with your invoice. The contract between you and {F.company} is formed when we send that email.</li>
        </ol>
        <p>
          To protect customers and cards, an order can contain up to {F.maxItemsPerOrder} keys and up to {F.maxOrderValue} in value, and some
          products have a lower limit per order, shown on the product page. Gift cards and top-ups are limited to {F.cardLimitPerItem} per product
          per order and {F.cardLimit24h} keys or {F.cardValue24h} per customer in 24 hours.
        </p>
        <p>
          We may decline an order before the contract is formed, or cancel it afterwards with a full refund, if a product is no longer
          available, if the price or description shown was clearly wrong, if a purchase limit applies, if we cannot complete a security
          check, if the order is linked to a restricted country or territory, or if the payment appears fraudulent. We tell you by email
          if this happens.
        </p>
      </>
    ),
  },
  {
    id: "prices",
    title: "Prices, currencies and tax",
    body: (
      <>
        <p>
          Prices are shown in {F.currencies}. Our prices are set in {F.baseCurrency}; prices in other currencies are converted at our current
          exchange rate. You pay in the currency selected when you place the order, and the total shown before you pay is the amount charged.
          Your card issuer may add its own foreign exchange fee if your card is in a different currency.
        </p>
        {F.vatRegistered ? (
          <p>Prices include VAT at the rate that applies to your order.</p>
        ) : (
          <p>
            {F.company} is not registered for VAT. We do not charge VAT, no VAT is added at checkout and no VAT is shown on your order
            confirmation or invoice.
          </p>
        )}
        <p>There is no delivery charge and no service fee. The total shown at checkout is the full amount you pay.</p>
      </>
    ),
  },
  {
    id: "payment",
    title: "Payment",
    body: (
      <>
        <p>
          We accept {F.cardMethods} cards. Card details are entered on the hosted payment page of {F.paymentProvider}, which is PCI DSS
          compliant. We never see or store your full card number. Your bank may ask you to confirm the payment with 3-D Secure, for example in
          your banking app.
        </p>
        <p>
          We only request your keys after the payment provider has confirmed the payment to us. If the payment is declined or cancelled, no
          order is placed and no key is issued. More detail is in our <Link href="/policies/payment">Payment policy</Link>.
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
          Keys are delivered {F.deliveryWhere}, {F.deliveryUsual}. {F.deliveryEmailNote} Delivery of a key is complete when it is available
          on your order page.
        </p>
        <p>
          We do not guarantee a fixed delivery time: a bank check, a security review or a delay at our distribution partner can make it take
          longer. If we cannot deliver a key within {F.deliveryDeadlineHours} hours of payment confirmation, we refund it. Full detail is in our{" "}
          <Link href="/policies/shipping">Delivery policy</Link>.
        </p>
      </>
    ),
  },
  {
    id: "cancel",
    title: "Your right to cancel",
    body: (
      <>
        <p>
          Under the Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013 in the UK, and the Consumer Rights
          Directive in the EU, you normally have {F.withdrawalDays} days to cancel a contract for digital content. That right ends once
          delivery has begun with your express request and your acknowledgement that you lose the right.
        </p>
        <p>
          At checkout there is a separate box, which is not ticked in advance and is separate from accepting these terms: “{F.waiverText}
          ” You cannot place an order without ticking it. We record the time you ticked it and the wording you agreed to, and we repeat it
          in your order confirmation email and on your invoice. Delivery begins when a key is issued to your account, which normally happens
          straight after your payment is confirmed.
        </p>
        <p>
          You can cancel without charge before {F.cancelBefore}. Email {F.email} or use the <Link href="/contact">contact form</Link> with your
          order number. Losing the right to cancel does not affect your rights when a key is not delivered, does not work or is not as described.
        </p>
      </>
    ),
  },
  {
    id: "your-key",
    title: "Looking after your key",
    body: (
      <p>
        Keep your key private until you redeem it and redeem it only on the platform and in the region stated. Anyone who sees a key can use it.
        We are not responsible for a key redeemed by someone else because you shared it, or because your email or {F.brand} account was
        accessed with your sign-in details, unless that happened through a security failure on our side.
      </p>
    ),
  },
  {
    id: "refunds",
    title: "Refunds and keys that do not work",
    body: (
      <>
        <p>
          If a key is not delivered, is invalid, was redeemed before it reached you, is revoked for a reason you did not cause, or does not
          match its product page, contact us within {F.guaranteeClaimDays} days of delivery. We replace it or refund the price you paid for it,
          within {F.refundDays} days to {F.refundMethod}. The procedure is in our <Link href="/policies/warranty">Key guarantee</Link>.
        </p>
        <p>
          We do not refund a key that works as described because you changed your mind or chose the wrong platform, region or edition when
          the product page stated them correctly. Full detail is in our <Link href="/policies/returns">Refund policy</Link>.
        </p>
      </>
    ),
  },
  {
    id: "chargebacks",
    title: "Chargebacks",
    body: (
      <>
        <p>If something is wrong with an order, please contact us first. Most problems are solved faster by us than through a card dispute.</p>
        <p>
          If you open a chargeback, we will respond to your card issuer with the order details, the delivery record, the record of when the
          key was revealed in your account, your recorded request for immediate delivery and our correspondence with you. If the chargeback is
          decided in your favour, we do not also refund you directly for the same amount. We may pause further orders on the account while a
          dispute is open. This does not limit any right you have under card scheme rules or consumer law.
        </p>
      </>
    ),
  },
  {
    id: "account",
    title: "Your account",
    body: (
      <>
        <p>
          You are responsible for keeping your password secure and for activity on your account. Tell us straight away if you think someone
          else has used it.
        </p>
        <p>
          We may suspend or close an account that breaks our <Link href="/policies/acceptable-use">Acceptable use policy</Link>, gives false
          details or is linked to a restricted country or territory. Suspension does not remove your rights for earlier valid orders. You can
          ask us to close your account at any time; keys you bought stay valid on the platforms where you redeemed them.
        </p>
      </>
    ),
  },
  {
    id: "liability",
    title: "Our responsibility to you",
    body: (
      <>
        <p>
          If we break these terms, we are responsible for loss or damage you suffer that is a foreseeable result of that breach. We are not
          responsible for loss that was not foreseeable when the contract was formed.
        </p>
        <p>
          We do not exclude or limit our liability for death or personal injury caused by our negligence, for fraud, for failing to supply
          digital content that matches its description, or for anything else that cannot be limited by law.
        </p>
        <p>We supply products for private use. We are not liable to you for loss of profit, loss of business or business interruption.</p>
      </>
    ),
  },
  {
    id: "outside-control",
    title: "Events outside our control",
    body: (
      <p>
        If an event outside our control, such as a platform outage or an interruption at our distribution partner or payment provider, delays
        your order, we tell you as soon as we can and do what we reasonably can to reduce the delay. If a key cannot be delivered within{" "}
        {F.deliveryDeadlineHours} hours, we refund it.
      </p>
    ),
  },
  {
    id: "ip",
    title: "Trademarks and content",
    body: (
      <p>
        Game titles, platform names, logos, cover art and screenshots belong to their owners and are shown to identify the products we offer.
        Their use does not mean the owner sponsors or endorses {F.brand}. The rest of the site’s text, design and software belongs to{" "}
        {F.company}.
      </p>
    ),
  },
  {
    id: "data",
    title: "Your personal data",
    body: (
      <p>
        We use your personal data as set out in our <Link href="/policies/privacy">Privacy policy</Link>.
      </p>
    ),
  },
  {
    id: "complaints",
    title: "Complaints",
    body: (
      <p>
        If you are unhappy with anything about an order, email {F.email}. We acknowledge complaints {F.complaintsAck} and reply in full within{" "}
        {F.complaintsDays} days. The process and where you can take a complaint next are in our <Link href="/policies/complaints">Complaints policy</Link>.
      </p>
    ),
  },
  {
    id: "law",
    title: "Governing law",
    body: (
      <>
        <p>These terms are governed by {F.governingLaw}, and disputes may be brought before {F.courts}.</p>
        <p>
          If you live in the United Kingdom or in an EU member state, you keep the protection of the mandatory consumer laws of the country
          where you live, and you can bring proceedings in the courts of that country.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: (
      <p>
        We may update these terms. The version published when you place an order applies to that order. The date at the top of this page shows
        when the terms last changed.
      </p>
    ),
  },
];

export default async function TermsPage() {
  return <PolicyLayout slug="terms" sections={sections} />;
}
