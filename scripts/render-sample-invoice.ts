import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { renderInvoicePdf, type InvoiceSource } from "../src/lib/invoice";

const sample: InvoiceSource = {
  orderNumber: "cmsample0000000000brm4k2q7",
  customerName: "Zofia Łukasiewicz",
  customerEmail: "zofia@example.com",
  currency: "EUR",
  exchangeRate: 1,
  discountPercent: 0,
  shippingCost: 0,
  paymentMethod: "card",
  createdAt: new Date("2026-10-04T09:12:00Z"),
  paidAt: new Date("2026-10-04T09:15:00Z"),
  shippingAddress: { firstName: "Zofia", lastName: "Łukasiewicz", address1: "ul. Długa 14/3", city: "Kraków", postalCode: "31-147", country: "PL" },
  billingAddress: { firstName: "Zofia", lastName: "Łukasiewicz", address1: "ul. Długa 14/3", city: "Kraków", postalCode: "31-147", country: "PL" },
  items: [
    { productName: "Baldur's Gate 3 (Steam)", variantName: "Steam · Global", quantity: 1, price: 38.9 },
    { productName: "Xbox Game Pass Ultimate 3 Months (Europe)", variantName: "Xbox · Europe · 3 months", quantity: 1, price: 31.4 },
    { productName: "PlayStation Network Card €20 (Europe)", variantName: "PlayStation · Europe", quantity: 2, price: 19.6 },
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
