import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { renderInvoicePdf, type InvoiceSource } from "../src/lib/invoice";

const sample: InvoiceSource = {
  orderNumber: "cmsample0000000000brm4k2q7",
  customerName: "Zofia Łukasiewicz",
  customerEmail: "zofia@example.com",
  currency: "EUR",
  exchangeRate: 1.17,
  discountPercent: 0,
  shippingCost: 0,
  paymentMethod: "card",
  createdAt: new Date("2026-10-04T09:12:00Z"),
  paidAt: new Date("2026-10-04T09:15:00Z"),
  steamId: "76561198000000000",
  shippingAddress: { firstName: "Zofia", lastName: "Łukasiewicz", address1: "ul. Długa 14/3", city: "Kraków", postalCode: "31-147", country: "PL" },
  billingAddress: { firstName: "Zofia", lastName: "Łukasiewicz", address1: "ul. Długa 14/3", city: "Kraków", postalCode: "31-147", country: "PL" },
  items: [
    { productName: "StatTrak™ AK-47 | Redline (Field-Tested)", variantName: "Field-Tested · Float 0.15–0.38 · StatTrak™", quantity: 1, price: 64.95 },
    { productName: "★ Karambit | Doppler (Factory New)", variantName: "Factory New · Float 0.00–0.07", quantity: 1, price: 812.4 },
    { productName: "Glock-18 | Water Elemental (Minimal Wear)", variantName: "Minimal Wear · Float 0.07–0.15", quantity: 1, price: 7.84 },
  ],
};

async function main() {
  const out = resolve(process.argv[2] || "invoice-sample.pdf");
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, await renderInvoicePdf(sample));
  console.log(`Wrote ${out}`);
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
