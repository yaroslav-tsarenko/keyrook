import Link from "next/link";
import { PolicyLayout, policyMetadata, type PolicySection } from "@/components/layout/PolicyLayout/PolicyLayout";
import { POLICY_FACTS as F } from "@/lib/policy-facts";

export const generateMetadata = policyMetadata(
  "payment",
  `${F.brand} accepts ${F.cardMethods} cards on a PCI DSS compliant hosted payment page. Prices in ${F.currencies}. We never see your full card number.`,
);

const sections: PolicySection[] = [
  {
    id: "methods",
    title: "How you can pay",
    body: (
      <>
        <p>We accept {F.cardMethods} credit and debit cards. We do not accept other payment methods.</p>
        <p>
          You pay on the hosted payment page of {F.paymentProviderNamed ? `${F.paymentProviderNamed}, a PCI DSS compliant payment provider` : "our PCI DSS compliant payment provider"}. When you select Pay at checkout,
          you are taken to that page to enter your card details, and brought back to {F.brand} once the payment is complete.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "Card security",
    body: (
      <>
        <p>
          <strong>We do not store or process full payment card data.</strong>{" "}
          Your card number, expiry date and security code are entered on
          the payment provider’s page and never pass through our website. We receive only the result of the payment and a transaction
          reference.
        </p>
        <p>
          Payments use 3-D Secure and Strong Customer Authentication. Your bank may ask you to confirm the payment, for example in your banking
          app or with a one-time code. If you do not complete that step, the payment is not taken.
        </p>
      </>
    ),
  },
  {
    id: "currencies",
    title: "Currencies",
    body: (
      <>
        <p>
          You can view prices and pay in {F.currencies}. Our prices are set in {F.baseCurrency}; the other currencies are converted at our
          current exchange rate. The total at checkout, in the currency you selected, is the amount we charge.
        </p>
        <p>If your card is in a different currency, your card issuer may convert the amount and add its own fee. We do not control that fee.</p>
      </>
    ),
  },
  {
    id: "tax",
    title: "Tax",
    body: F.vatRegistered ? (
      <p>Prices include VAT at the rate that applies to your order. Your invoice shows the VAT amount.</p>
    ) : (
      <p>
        {F.company} is not registered for VAT. We do not charge VAT, and no VAT is shown at checkout or on your order confirmation or
        invoice.
      </p>
    ),
  },
  {
    id: "when-charged",
    title: "When your card is charged",
    body: (
      <>
        <p>
          Your card is charged when you complete payment on the provider’s page. We confirm your order, send a confirmation email and
          request your keys only after the provider confirms the payment to us. If the payment is declined or cancelled, nothing is charged and
          no key is issued.
        </p>
        <p>
          If a payment fails, check the card details and that your bank has approved the payment, then try again. If it still fails, contact
          your bank or email us at {F.email}.
        </p>
      </>
    ),
  },
  {
    id: "refunds",
    title: "Refunds",
    body: (
      <p>
        Refunds go back to the card used for the order, in the same currency, within {F.refundDays} days as described in our{" "}
        <Link href="/policies/returns">Refund policy</Link>. We cannot refund to a different card or account.
      </p>
    ),
  },
  {
    id: "statement",
    title: "On your statement",
    body: (
      <p>
        The charge appears under the name of {F.company} or {F.brand}, depending on your bank. If you do not recognise a charge, email{" "}
        {F.email} before contacting your bank and we will find the order.
      </p>
    ),
  },
  {
    id: "disputes",
    title: "Disputes",
    body: (
      <p>
        If something is wrong with an order, please contact us first; we can usually solve it faster than a card dispute. How we handle
        chargebacks is set out in our <Link href="/policies/terms#chargebacks">Terms and conditions</Link>.
      </p>
    ),
  },
];

export default async function PaymentPage() {
  return <PolicyLayout slug="payment" sections={sections} />;
}
