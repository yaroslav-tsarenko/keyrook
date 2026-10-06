import { config } from "dotenv";
import { sendWelcomeEmail } from "../src/lib/email";

config();

async function main() {
  const to = process.argv[2];
  const name = process.argv[3] || null;
  if (!to) {
    console.error("usage: tsx scripts/send-test-email.ts <recipient> [name]");
    process.exit(1);
  }

  console.log(`Sending test welcome email to ${to}...`);
  console.log(`SMTP host: ${process.env.SMTP_HOST || "MISSING"}`);
  console.log(`From:      ${process.env.SMTP_FROM || process.env.SMTP_USER || "MISSING"}`);

  const ok = await sendWelcomeEmail(to, name);

  if (ok) {
    console.log(`Sent to ${to}`);
    process.exit(0);
  } else {
    console.error(`Failed to send to ${to}; check the SMTP settings above`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
