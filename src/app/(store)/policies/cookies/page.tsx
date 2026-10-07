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
    title: "What this policy covers",
    body: (
      <>
        <p>
          Cookies are small text files a website stores in your browser. Local storage and session storage are similar browser features
          that keep data on your device only. This policy lists every cookie and storage key {F.brand} uses on {F.domain}.
        </p>
        <p>
          The list is the same one shown under “Show cookies” in Cookie settings. Your saved items are kept in your account on
          our server, not in your browser.
        </p>
      </>
    ),
  },
  {
    id: "necessary",
    title: "Necessary cookies and storage",
    body: (
      <>
        <p>{necessary?.purpose} These are always on, because the store cannot work without them. They are not used for advertising.</p>
        <CookieTable rows={COOKIE_TABLE.necessary} />
      </>
    ),
  },
  {
    id: "optional",
    title: "Analytics and marketing",
    body: (
      <>
        <p>
          {F.brand} does not currently set any analytics or marketing cookies. Both categories are in Cookie settings and are off until you
          switch them on. If we add an analytics or marketing tool, we will list each of its cookies in this policy first, and it will only
          load after you allow that category.
        </p>
        {COOKIE_TABLE.analytics.length ? <CookieTable rows={COOKIE_TABLE.analytics} /> : null}
        {COOKIE_TABLE.marketing.length ? <CookieTable rows={COOKIE_TABLE.marketing} /> : null}
      </>
    ),
  },
  {
    id: "choice",
    title: "Changing or withdrawing your consent",
    body: (
      <>
        <p>
          On your first visit, the cookie banner offers Accept all, Reject all and Customise. You can change your choice at any time from
          the <strong>Cookie settings</strong> link at the bottom of every page, or with the button below. Withdrawing consent is as easy
          as giving it and takes effect straight away.
        </p>
        <p>
          Your choice is stored in local storage under <code className="font-mono text-ui-xs">{consentKey}</code> for 12 months. After that
          we ask again.
        </p>
        <div className="mt-6">
          <CookieSettingsButton />
        </div>
        <p>
          You can also delete cookies and site data in your browser settings. If you delete the necessary ones, your bag empties and you
          are signed out.
        </p>
      </>
    ),
  },
  {
    id: "third-party",
    title: "The payment page",
    body: (
      <p>
        When you pay, you are taken to our payment provider’s hosted page. That page is run by the provider on its own domain and may
        set its own cookies for security and fraud prevention, under the provider’s own cookie policy. See our{" "}
        <Link href="/policies/payment">Payment policy</Link>.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        We update this list whenever we add or remove a cookie or storage key. Questions go to {F.email}. How we handle personal data is set
        out in our <Link href="/policies/privacy">Privacy policy</Link>.
      </p>
    ),
  },
];

export default async function CookiesPage() {
  return <PolicyLayout slug="cookies" sections={sections} />;
}
