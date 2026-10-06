import "dotenv/config";
import { sihClient } from "../src/lib/sih/client";
import { env } from "../src/lib/env";

async function main() {
  const arg = process.argv[2];
  if (arg === "clear") {
    const project = await sihClient.setWebhook();
    console.log("[sih:webhook] cleared. project.webhook =", project.webhook ?? "(empty)");
    return;
  }
  const url = arg || `${env.APP_URL}/api/webhooks/sih?secret=${encodeURIComponent(env.SIH_WEBHOOK_SECRET)}`;
  if (!/^https:\/\//.test(url)) throw new Error(`Refusing to set a non-https webhook URL: ${url}`);
  const project = await sihClient.setWebhook(url);
  console.log(`[sih:webhook] set to:\n  ${url}`);
  console.log("[sih:webhook] project.webhook now =", project.webhook ?? "(empty)");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[sih:webhook] failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
