import "dotenv/config";
import { sihClient } from "../src/lib/sih/client";
import { flattenCatalog } from "../src/lib/sih/types";
import { env } from "../src/lib/env";

async function main() {
  console.log(`[sih:smoke] base=${env.SIH_API_BASE} appId=${env.SIH_APP_ID}`);
  const project = await sihClient.getProject();
  console.log(`[sih:smoke] project ok. balance=${project.balance} webhook=${project.webhook ?? "(none)"}`);
  const items = flattenCatalog((await sihClient.getItems()).items);
  console.log(`[sih:smoke] get-items ok. offers=${items.length}`);
  if (items.length === 0) throw new Error("get-items returned an empty catalogue");
  const sample = items[0].marketHashName;
  const min = await sihClient.getMinItem(sample);
  console.log(`[sih:smoke] get-min-item ok. item="${sample}" found=${min.found} price=${min.price} count=${min.count}`);
  console.log("[sih:smoke] PASS — read-only checks only, nothing was bought.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[sih:smoke] FAIL:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
