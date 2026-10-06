import Link from "next/link";
import { PolicyLayout, policyMetadata, type PolicySection } from "@/components/layout/PolicyLayout/PolicyLayout";
import { POLICY_FACTS as F } from "@/lib/policy-facts";

export const generateMetadata = policyMetadata(
  "acceptable-use",
  `Rules for using ${F.domain} and a ${F.brand} account, and what happens if they are broken.`,
);

const sections: PolicySection[] = [
  {
    id: "scope",
    title: "Who this applies to",
    body: (
      <p>
        This policy applies to everyone who visits {F.domain} or creates an account. It forms part of our{" "}
        <Link href="/policies/terms">Terms and conditions</Link>.
      </p>
    ),
  },
  {
    id: "accounts",
    title: "Accounts",
    body: (
      <ul>
        <li>You must be {F.minAge} or over to hold an account.</li>
        <li>One account per person, registered in your own name with accurate details.</li>
        <li>Keep your password private. Do not share your account or use someone else&rsquo;s.</li>
        <li>
          Accounts may not be opened from, or used to order for delivery to, {F.restrictedCountries} or {F.restrictedTerritories}. Do not
          use a VPN, proxy or false address to get around this.
        </li>
      </ul>
    ),
  },
  {
    id: "not-allowed",
    title: "What is not allowed",
    body: (
      <ul>
        <li>Using stolen or unauthorised payment cards, or placing orders you do not intend to pay for.</li>
        <li>Buying keys in order to resell them, or getting around the purchase limits ({F.maxItemsPerOrder} keys per order, and lower limits for gift cards and top-ups) with several accounts.</li>
        <li>Reporting a working key as faulty, or opening a chargeback for keys you received and redeemed, to get them without paying.</li>
        <li>Sharing or publishing keys bought here, or using {F.brand} to redeem keys outside the region they are sold for.</li>
        <li>Automated access that puts load on the site, such as scraping, bulk account creation or repeated checkout attempts.</li>
        <li>Trying to access other customers&rsquo; data, our admin area or systems you are not authorised to use, or testing for security weaknesses without our written permission.</li>
        <li>Uploading or sending malware, spam or anything unlawful.</li>
      </ul>
    ),
  },
  {
    id: "breach",
    title: "If these rules are broken",
    body: (
      <>
        <p>
          We may cancel an order and refund it, or suspend or close the account. Where the law requires it, for example in a
          case of card fraud, we report the matter to the relevant authority.
        </p>
        <p>If you think we have made a mistake, email {F.email} and we will review the decision.</p>
      </>
    ),
  },
];

export default async function AcceptableUsePage() {
  return <PolicyLayout slug="acceptable-use" sections={sections} />;
}
