import Link from "next/link";
import { PolicyLayout, policyMetadata, type PolicySection } from "@/components/layout/PolicyLayout/PolicyLayout";
import { POLICY_FACTS as F } from "@/lib/policy-facts";

export const generateMetadata = policyMetadata(
  "complaints",
  `How to complain to ${F.brand}: we acknowledge ${F.complaintsAck} and reply in full within ${F.complaintsDays} days.`,
);

const sections: PolicySection[] = [
  {
    id: "how",
    title: "How to complain",
    body: (
      <>
        <p>
          Email {F.email} or use the <Link href="/contact">contact form</Link>. Please include:
        </p>
        <ul>
          <li>your name and the email address used for the order;</li>
          <li>the order number, if the complaint is about an order;</li>
          <li>what went wrong, and a screenshot of the error if a key does not activate;</li>
          <li>what you would like us to do.</li>
        </ul>
        <p>Our support hours are {F.supportHours}.</p>
      </>
    ),
  },
  {
    id: "timeline",
    title: "What happens next",
    body: (
      <ol>
        <li>We acknowledge your complaint {F.complaintsAck}, with the name of the person handling it.</li>
        <li>We look into it, which may include checking the key with our distribution partner.</li>
        <li>
          We send you our full reply within {F.complaintsDays} days, explaining what we found and what we will do. If we need longer, for
          example while a publisher checks a key, we tell you why and when you will hear from us.
        </li>
      </ol>
    ),
  },
  {
    id: "escalate",
    title: "If you are not satisfied",
    body: (
      <>
        <p>
          Reply to our response and ask for the complaint to be reviewed. A different member of the team will look at it again and reply
          within {F.complaintsDays} days.
        </p>
        <p>
          If we still cannot agree, you can contact the consumer advice service where you live: Citizens Advice in England, Wales and
          Scotland, Consumerline in Northern Ireland, or the European Consumer Centre in your EU country. You can also bring a claim in the
          courts, as described in the governing law section of our <Link href="/policies/terms#law">Terms and conditions</Link>.
        </p>
        <p>Complaints about how we use personal data can also go to a data protection authority, as described in our <Link href="/policies/privacy#rights">Privacy policy</Link>.</p>
      </>
    ),
  },
  {
    id: "records",
    title: "Records",
    body: (
      <p>
        We keep a record of each complaint and our reply for {F.retention.supportMessagesMonths} months, so that we can follow up and improve
        how we work.
      </p>
    ),
  },
];

export default async function ComplaintsPage() {
  return <PolicyLayout slug="complaints" sections={sections} />;
}
