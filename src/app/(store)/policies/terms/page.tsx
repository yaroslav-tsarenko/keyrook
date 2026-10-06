import Link from "next/link";
import { PolicyLayout, SellerBlock, policyMetadata, type PolicySection } from "@/components/layout/PolicyLayout/PolicyLayout";
import { POLICY_FACTS as F } from "@/lib/policy-facts";

export const generateMetadata = policyMetadata(
  "terms",
  `The terms ${F.company} trades on as ${F.brand}: who can order, prices, payment, delivery of ${F.game} items by ${F.deliveryMethod}, the right to cancel, refunds and complaints.`,
);

const sections: PolicySection[] = [
  {
    id: "about",
    title: "About these terms",
    body: (
      <>
        <p>
          These terms apply to every order placed on {F.domain}. {F.brand} is a trading name of {F.company}. When these terms say
          &ldquo;we&rdquo;, &ldquo;us&rdquo; or &ldquo;our&rdquo;, they mean {F.company}. &ldquo;You&rdquo; means the person placing the order.
        </p>
        <SellerBlock />
        <p>
          These terms work together with our <Link href="/policies/shipping">Delivery via Steam policy</Link>,{" "}
          <Link href="/policies/returns">Refund policy</Link>, <Link href="/policies/payment">Payment policy</Link>,{" "}
          <Link href="/policies/warranty">Item guarantee</Link>, <Link href="/policies/privacy">Privacy policy</Link> and{" "}
          <Link href="/policies/cookies">Cookie policy</Link>. Nothing in them reduces the rights you have by law as a consumer.
        </p>
      </>
    ),
  },
  {
    id: "who-can-order",
    title: "Who can order",
    body: (
      <>
        <p>
          You must be at least {F.minAge} years old to create an account or place an order. We ask for your date of birth when you
          register with an email, or before your first order if you sign in through Steam, and we do not take orders from anyone
          under {F.minAge}.
        </p>
        <p>
          We sell to consumers buying items for their own Steam account. {F.brand} is a store: we sell items we source, and you cannot sell,
          list or exchange items with other users here. If you buy items for resale or commercial use, the consumer rights described in
          these terms do not apply to that purchase.
        </p>
        <p>
          You need a Steam account in good standing to receive items. The details you give us (name, email, billing address, Steam account
          and trade URL) must be accurate and your own.
        </p>
      </>
    ),
  },
  {
    id: "where-we-sell",
    title: "Where we sell and deliver",
    body: (
      <>
        <p>We sell to customers in the {F.marketCountries}. Checkout only accepts billing addresses in these countries.</p>
        <p>
          We do not sell to, deliver to or accept orders or accounts from {F.restrictedCountries}, or from{" "}
          {F.restrictedTerritories}. These countries and territories are excluded from registration and checkout. If we find that
          an order is connected to one of them, for example through the billing address, payment card or Steam account, we
          cancel it and refund the full amount paid.
        </p>
      </>
    ),
  },
  {
    id: "products",
    title: "Items",
    body: (
      <>
        <p>
          We sell cosmetic items for {F.game}: weapon finishes (skins), knives and gloves. Items are digital. They are delivered to your
          Steam account, they change only how weapons look in the game and they have no effect on gameplay.
        </p>
        <p>
          Each listing is one item with a stated market name, rarity, exterior and quality (normal, StatTrak&trade; or Souvenir). Where an
          exterior applies, we show the float range that exterior allows for that finish. The exact float value, pattern and any phase
          not stated on the listing are those of the item delivered and are shown in Steam after delivery. Images are the standard Steam
          images for the item.
        </p>
        <p>
          Items exist inside Steam, a service run by Valve Corporation. {F.brand} is not affiliated with or endorsed by Valve. Steam&rsquo;s
          own terms, including the Steam Subscriber Agreement, apply to your Steam account and to items in it. Valve can change how items
          work, how they can be traded or whether they remain available in the game.
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
          <li>You sign in, link your Steam account and save your Steam trade URL.</li>
          <li>You add items to your bag and go to checkout, where you enter your contact details and billing address.</li>
          <li>We check the current price of each item. If a price has gone up, we show you the new total before you can pay.</li>
          <li>You tick the box to agree to these terms and, separately, the box asking us to start delivery straight away, and select Pay.</li>
          <li>You are taken to our payment provider&rsquo;s hosted page to pay by card.</li>
          <li>Once the payment provider confirms the payment to us, we email you an order confirmation. The contract between you and {F.company} is formed when we send that email.</li>
        </ol>
        <p>
          Each listing is a single item, so you can buy each item once per order, and up to {F.maxItemsPerOrder} items in one order. We may
          decline an order before the contract is formed, or cancel it afterwards with a full refund, if an item is no longer available,
          if the price or description shown was clearly wrong, if your Steam account cannot receive trade offers, if the order is linked
          to a restricted country or territory, or if the payment appears fraudulent. We tell you by email if this happens.
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
          Prices are shown in {F.currencies}. Our prices are set in {F.baseCurrency}; prices in other currencies are converted at
          our current exchange rate. You pay in the currency selected when you place the order, and the total shown before you pay is the
          amount charged. Your card issuer may add its own foreign exchange fee if your card is in a different currency.
        </p>
        {F.vatRegistered ? (
          <p>Prices include VAT at the rate that applies to your order.</p>
        ) : (
          <p>
            {F.company} is not registered for VAT. We do not charge VAT, no VAT is added at checkout and no VAT is shown on your
            order confirmation or invoice.
          </p>
        )}
        <p>There is no delivery charge. The total shown at checkout is the full amount you pay.</p>
      </>
    ),
  },
  {
    id: "payment",
    title: "Payment",
    body: (
      <>
        <p>
          We accept {F.cardMethods} cards. Card details are entered on the hosted payment page of {F.paymentProvider}, which is PCI
          DSS compliant. We never see or store your full card number. Your bank may ask you to confirm the payment with 3-D Secure,
          for example in your banking app.
        </p>
        <p>
          Your card is charged when you complete payment. We only request delivery of your items after the payment provider has confirmed the
          payment to us. If the payment is declined, no order is placed. More detail is in our{" "}
          <Link href="/policies/payment">Payment policy</Link>.
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
          We deliver each item as a {F.deliveryMethod} to the Steam account you linked, using the trade URL saved in your account. We send
          the offer {F.deliveryUsual}. Delivery is complete when you accept the offer and the item is in your Steam inventory.
        </p>
        <p>
          You must accept the offer before it expires. {F.offerExpiryNote} Check that the offer gives you the item you bought and asks for
          nothing from your inventory.
        </p>
        <p>
          Steam may place received items under trade protection for up to {F.tradeProtectionDays} days, during which they cannot be
          traded or sold, and accounts without the Steam Guard Mobile Authenticator can face a trade hold of up to {F.tradeHoldMaxDays}{" "}
          days. These are Steam rules that we cannot change. Full detail is in our <Link href="/policies/shipping">Delivery via Steam policy</Link>.
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
          Directive in the EU, you normally have {F.withdrawalDays} days to cancel a contract for digital content. That right ends
          once delivery of the digital content has begun with your express consent and your acknowledgement that you lose the right.
        </p>
        <p>
          At checkout there is a separate box, which is not ticked in advance: &ldquo;{F.waiverText}&rdquo; You cannot place an order without
          ticking it. We record the time you ticked it and the wording you agreed to, and we repeat it in your order confirmation email.
          Delivery begins when we send the trade offer for your item, which happens straight after your payment is confirmed.
        </p>
        <p>
          You can cancel an order without charge before {F.cancelBefore}. Email {F.email} or use the <Link href="/contact">contact form</Link>{" "}
          with your order number. If the offer has not been sent yet, we cancel the order and refund you in full.
        </p>
      </>
    ),
  },
  {
    id: "refunds",
    title: "Refunds",
    body: (
      <>
        <p>
          We refund the price you paid for an item if we cannot deliver it within {F.deliveryDeadlineHours} hours of payment confirmation,
          if the trade offer fails or expires for a reason on our side, if Steam reverses the trade while the item is under trade protection,
          or if you cancel before {F.cancelBefore}. We refund within {F.refundDays} days to {F.refundMethod}, in the currency you paid in.
        </p>
        <p>
          If a trade offer cannot be completed because of your Steam account, for example an invalid trade URL, a private inventory, a trade
          ban or a Steam Guard restriction, we tell you and refund the item. We do not refund items once they are in your Steam inventory,
          except as described in our <Link href="/policies/warranty">Item guarantee</Link>. Full detail is in our{" "}
          <Link href="/policies/returns">Refund policy</Link>.
        </p>
      </>
    ),
  },
  {
    id: "chargebacks",
    title: "Chargebacks",
    body: (
      <>
        <p>
          If something is wrong with an order, please contact us first. Most problems are solved faster by us than through a card
          dispute.
        </p>
        <p>
          If you open a chargeback with your card issuer, we will respond to the issuer with the order details, the Steam trade offer record,
          your recorded request for immediate delivery and our correspondence with you. If the chargeback is decided in your favour, we do
          not also refund you directly for the same amount. If a chargeback is raised for items that were delivered, we may suspend the
          account while the dispute is open.
          This does not limit any right you have under card scheme rules or consumer law.
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
          You are responsible for keeping your password and your Steam account secure and for activity on your account. Tell us straight
          away if you think someone else has used it. We never ask for your Steam password or Steam Guard codes.
        </p>
        <p>
          We may suspend or close an account that breaks our <Link href="/policies/acceptable-use">Acceptable use policy</Link>, gives
          false details or is linked to a restricted country or territory. You can ask us to close your account at any time.
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
          We do not exclude or limit our liability for death or personal injury caused by our negligence, for fraud, or for breach of your
          legal rights in relation to the goods.
        </p>
        <p>
          We supply items for private use. We are not liable to you for loss of profit, loss of business or business interruption, or for
          changes Valve makes to {F.game} or to Steam.
        </p>
      </>
    ),
  },
  {
    id: "outside-control",
    title: "Events outside our control",
    body: (
      <p>
        If an event outside our control, such as a Steam outage, a change Valve makes to trading, or an interruption at our delivery partner,
        delays your order, we tell you as soon as we can and do what we reasonably can to reduce the delay. If an item cannot be delivered
        within {F.deliveryDeadlineHours} hours, we refund it.
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
        If you are unhappy with anything about an order, email {F.email}. We acknowledge complaints {F.complaintsAck} and reply in full
        within {F.complaintsDays} days. The process and where you can take a complaint next are in our{" "}
        <Link href="/policies/complaints">Complaints policy</Link>.
      </p>
    ),
  },
  {
    id: "law",
    title: "Governing law",
    body: (
      <>
        <p>
          These terms are governed by {F.governingLaw}, and disputes may be brought before {F.courts}.
        </p>
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
        We may update these terms. The version published when you place an order applies to that order. The date at the top of this page
        shows when the terms last changed.
      </p>
    ),
  },
];

export default async function TermsPage() {
  return <PolicyLayout slug="terms" sections={sections} />;
}
