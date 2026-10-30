import Link from "next/link";
import { PolicyLayout, policyMetadata, policyTable, type PolicySection } from "@/components/layout/PolicyLayout/PolicyLayout";
import { CookieSettingsButton } from "@/components/layout/PolicyLayout/CookieSettingsButton";
import { COOKIE_CATEGORIES, COOKIE_TABLE, type CookieRecord } from "@/config/cookies";
import { POLICY_FACTS as F } from "@/lib/policy-facts";

export const generateMetadata = policyMetadata(
  "cookies",
  `Every cookie, local storage and session storage key ${F.brand} uses, what each one does, how long it lasts and how to change your choice.`,
);

function CookieTable({ rows }: { rows: CookieRecord[] }) {
  return (
    <>
      <table className={`${policyTable} hidden md:table`}>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Type</th>
            <th scope="col">Provider</th>
            <th scope="col">Purpose</th>
            <th scope="col">Expiry</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <td className="font-mono text-ui-xs text-ink [overflow-wrap:anywhere]">{row.name}</td>
              <td className="whitespace-nowrap text-ink-muted">{row.kind}</td>
              <td className="text-ink-muted">{row.provider}</td>
              <td>{row.purpose}</td>
              <td className="text-ink-muted">{row.expiry}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div role="list" className="mt-5 border-t border-line md:hidden">
        {rows.map((row) => (
          <div role="listitem" key={row.name} className="border-b border-line py-4">
            <div className="font-mono text-ui-xs text-ink [overflow-wrap:anywhere]">{row.name}</div>
            <div className="mt-1 text-ui-sm">{row.purpose}</div>
            <div className="meta mt-2 text-ink-muted">
              {row.kind} · {row.provider} · {row.expiry}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

const necessary = COOKIE_CATEGORIES.find((c) => c.id === "necessary");
const consentKey = COOKIE_TABLE.necessary.find((r) => r.name.endsWith("-consent"))?.name;

const sections: PolicySection[] = [
  {
    id: "what",
    title: "Operator and what cookies are",
    body: (
      <>
        <p>
          This Policy explains cookies and similar technologies used on {F.domain}. Read it with our{" "}
          <Link href="/policies/privacy">Privacy policy</Link>. {F.brand} is operated by {F.company}, company number {F.companyNumber},
          registered office {F.registeredOffice}, {F.companyCountry}. Contact: {F.email}.
        </p>
        <p>
          Cookies are small files stored in your browser. Session cookies expire when the browser session ends; persistent cookies remain until
          they expire or you delete them. Local storage and session storage are similar browser features that keep data on your device. In
          this Policy, “cookies” includes these technologies.
        </p>
      </>
    ),
  },
  {
    id: "purposes",
    title: "Purposes",
    body: (
      <p>
        Technologies used by {F.brand} may support secure sessions, your cart and checkout, fraud prevention, your saved consent choice and your
        selected currency ({F.currencies}). The inventory below lists what the website actually sets; describing a category does not mean every
        technology in it is present.
      </p>
    ),
  },
  {
    id: "necessary",
    title: "Strictly necessary cookies and storage",
    body: (
      <>
        <p>
          {necessary?.purpose} They are necessary to provide a service you request or essential security, so they do not require consent and
          are always on. They are not used for advertising. Blocking them in your browser may stop sign-in or checkout from working.
        </p>
        <CookieTable rows={COOKIE_TABLE.necessary} />
      </>
    ),
  },
  {
    id: "optional",
    title: "Analytics, diagnostics and advertising",
    body: (
      <>
        <p>
          {F.brand} does not currently set any analytics or advertising cookies. Both categories are in Cookie settings and are off until you
          switch them on. If we add such a tool, we will list each of its cookies here first, and it will only load after you allow that
          category. Browsing, scrolling or inactivity is not consent, and core purchasing functions never depend on accepting optional cookies.
        </p>
        {COOKIE_TABLE.analytics.length ? <CookieTable rows={COOKIE_TABLE.analytics} /> : null}
        {COOKIE_TABLE.marketing.length ? <CookieTable rows={COOKIE_TABLE.marketing} /> : null}
      </>
    ),
  },
  {
    id: "choice",
    title: "Choices and changing your consent",
    body: (
      <>
        <p>
          On your first visit, the cookie banner offers Accept all, Reject all and Customise. You can change or withdraw your choice at any time
          from the <strong>Cookie settings</strong> link at the bottom of every page, or with the button below. Withdrawing consent is as easy
          as giving it, takes effect straight away and does not affect earlier lawful processing.
        </p>
        <p>
          Your choice is stored in local storage under <code className="font-mono text-ui-xs">{consentKey}</code> for 12 months. After that
          we ask again.
        </p>
        <div className="mt-6">
          <CookieSettingsButton />
        </div>
      </>
    ),
  },
  {
    id: "third-party",
    title: "Payment and security technologies",
    body: (
      <p>
        When you pay, you are taken to our payment provider’s hosted page on its own domain. It may set cookies needed to authenticate the
        payment and prevent fraud, under the provider’s own privacy information. Optional tracking does not become exempt from consent merely
        because it appears during checkout. See our <Link href="/policies/payment">Payment policy</Link>.
      </p>
    ),
  },
  {
    id: "browser",
    title: "Browser controls",
    body: (
      <p>
        Most browsers let you inspect, delete or block cookies, restrict third-party storage or clear data on closing. Deleting necessary
        cookies signs you out, empties your cart and resets your currency and consent choices. Browser controls work separately from Cookie
        settings.
      </p>
    ),
  },
  {
    id: "changes",
    title: "International processing, updates and contact",
    body: (
      <>
        <p>
          Some providers may process information outside the UK; the safeguards we use are described in our Privacy policy. We update this
          Policy and the inventory whenever technologies, providers or legal requirements change, and ask for new consent where a new purpose
          requires it.
        </p>
        <p>Questions go to {F.email}.</p>
      </>
    ),
  },
];

export default async function CookiesPage() {
  return <PolicyLayout slug="cookies" sections={sections} />;
}
