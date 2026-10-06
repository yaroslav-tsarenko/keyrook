import nodemailer, { type Transporter } from "nodemailer";
import { COMPANY } from "@/lib/company";
import { BRAND, SITE_URL } from "@/lib/brand";
import { STORE_POLICY } from "@/config/store-policy";
import { computeTotals, rateConverter } from "@/lib/pricing";
import { addressLines, displayOrderNumber, type StoredAddress } from "@/lib/orders";
import { PAYMENT_METHOD_LABEL } from "@/lib/payments/types";
import { PASSWORD_RESET_TTL_MINUTES } from "@/lib/validators/auth";
import { invoiceAttachment, type InvoiceFile } from "@/lib/invoice";

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) return null;

  if (!transporter) {
    const port = Number(process.env.SMTP_PORT ?? 587);
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === "true" || port === 465,
      auth: { user, pass },
    });
  }
  return transporter;
}

function getFrom(): string {
  return (
    process.env.SMTP_FROM ||
    (process.env.SMTP_USER ? `${BRAND.name} <${process.env.SMTP_USER}>` : `${BRAND.name} <noreply@${BRAND.domain}>`)
  );
}

function getReplyTo(): string | undefined {
  return process.env.SMTP_REPLY_TO || undefined;
}

const C = {
  canvas: "#f1f3f2",
  panel: "#fafbfa",
  stage: "#ffffff",
  ink: "#2a1a15",
  muted: "#5b4c47",
  subtle: "#72625d",
  paint: "#3b2620",
  onPaint: "#f1f3f2",
  onPaintMuted: "#c8bbb3",
  brass: "#c9a04e",
  brassTint: "#f2ead8",
  line: "#d2d3cf",
  success: "#2f6b45",
  danger: "#a3262b",
} as const;

const SERIF = "Gloock, Georgia, 'Times New Roman', serif";
const SANS = "Commissioner, 'Segoe UI', Helvetica, Arial, sans-serif";
const MONO = "ui-monospace, Menlo, Consolas, 'Courier New', monospace";

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: InvoiceFile[];
}

async function send({ to, subject, html, replyTo, attachments }: SendArgs): Promise<boolean> {
  const t = getTransporter();
  if (!t) {
    console.log(`[Email] Skipped (SMTP not configured) → ${subject} to ${to}`);
    return false;
  }
  try {
    await t.sendMail({ from: getFrom(), to, subject, html, replyTo: replyTo ?? getReplyTo(), attachments });
    return true;
  } catch (err) {
    console.error(`[Email] Exception → ${subject} to ${to}:`, err);
    return false;
  }
}

function escape(input: string): string {
  return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function emailWrapper(content: string, options: { preheader?: string } = {}): string {
  const preheader = options.preheader
    ? `<div style="display:none;font-size:1px;color:${C.canvas};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escape(options.preheader)}</div>`
    : "";
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${BRAND.name}</title>
</head>
<body style="margin:0;padding:0;background:${C.canvas};color:${C.ink};font-family:${SANS};">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.canvas};">
  <tr>
    <td align="center" style="padding:24px 12px 40px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
        <tr>
          <td style="background:${C.paint};padding:20px 28px;">
            <a href="${SITE_URL}" style="font-family:${SERIF};font-size:26px;line-height:1;color:${C.onPaint};text-decoration:none;letter-spacing:-0.01em;">${BRAND.name}</a>
          </td>
        </tr>
        <tr>
          <td style="height:2px;line-height:2px;font-size:0;background:${C.paint};">&nbsp;</td>
        </tr>
        <tr>
          <td style="background:${C.panel};padding:32px 28px;border-left:1px solid ${C.line};border-right:1px solid ${C.line};">
            ${content}
          </td>
        </tr>
        <tr>
          <td style="height:2px;line-height:2px;font-size:0;background:${C.paint};">&nbsp;</td>
        </tr>
        <tr>
          <td style="height:3px;line-height:3px;font-size:0;">&nbsp;</td>
        </tr>
        <tr>
          <td style="height:1px;line-height:1px;font-size:0;background:${C.line};">&nbsp;</td>
        </tr>
        <tr>
          <td style="padding:20px 4px 0;font-size:12px;line-height:1.6;color:${C.muted};">
            <p style="margin:0 0 4px;color:${C.ink};font-weight:600;">${escape(COMPANY.name)}</p>
            <p style="margin:0 0 4px;">${BRAND.name} is a trading name of ${escape(COMPANY.name)}. Company number ${escape(COMPANY.companyNumber)}.</p>
            <p style="margin:0 0 4px;">${escape(COMPANY.registeredOffice)}, ${escape(COMPANY.country)} &middot; <a href="mailto:${COMPANY.email}" style="color:${C.ink};">${COMPANY.email}</a>${COMPANY.phone ? ` &middot; ${escape(COMPANY.phone)}` : ""}</p>
            <p style="margin:12px 0 0;">
              <a href="${SITE_URL}/policies/terms" style="color:${C.muted};text-decoration:underline;margin-right:12px;">Terms</a>
              <a href="${SITE_URL}/policies/returns" style="color:${C.muted};text-decoration:underline;margin-right:12px;">Returns</a>
              <a href="${SITE_URL}/policies/privacy" style="color:${C.muted};text-decoration:underline;margin-right:12px;">Privacy</a>
              <a href="${SITE_URL}/contact" style="color:${C.muted};text-decoration:underline;">Contact</a>
            </p>
            <p style="margin:12px 0 0;color:${C.subtle};">&copy; ${year} ${BRAND.name}. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-family:${SERIF};font-weight:400;font-size:28px;line-height:1.15;color:${C.ink};">${text}</h1>`;
}

function paragraph(html: string, extra = ""): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${C.muted};${extra}">${html}</p>`;
}

function label(text: string): string {
  return `<p style="margin:0 0 6px;font-size:11px;line-height:1;letter-spacing:0.12em;text-transform:uppercase;font-weight:600;color:${C.subtle};">${text}</p>`;
}

function plate(text: string): string {
  return `<span style="display:inline-block;background:${C.brass};color:${C.ink};font-size:12px;font-weight:600;letter-spacing:0.08em;padding:6px 10px;font-family:${MONO};">${escape(text)}</span>`;
}

function button(href: string, text: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px;">
  <tr>
    <td style="background:${C.paint};">
      <a href="${href}" style="display:inline-block;padding:14px 28px;font-family:${SANS};font-size:15px;font-weight:600;color:${C.onPaint};text-decoration:none;">${text}</a>
    </td>
  </tr>
</table>`;
}

interface Amount {
  toNumber?: () => number;
}

type Num = number | string | Amount | null | undefined;

interface OrderItem {
  productName: string;
  productSku: string;
  variantName?: string | null;
  quantity: number;
  price: Num;
  total: Num;
}

interface OrderEmailData {
  orderId: string;
  orderNumber?: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: Num;
  taxAmount: Num;
  shippingCost: Num;
  discountAmount?: Num;
  discountPercent?: Num;
  total: Num;
  currency?: string | null;
  exchangeRate?: Num;
  shippingMethod: string;
  shippingAddress?: StoredAddress;
  billingAddress?: StoredAddress | null;
  paymentMethod?: string | null;
  trackingNumber?: string | null;
  createdAt?: Date | string;
  paidAt?: Date | string | null;
  waiverText?: string | null;
  waiverAcceptedAt?: Date | string | null;
}

function toNum(v: Num): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  if (typeof v.toNumber === "function") return v.toNumber();
  return Number(v);
}

function currencyOf(data: OrderEmailData): string {
  return data.currency || STORE_POLICY.currency;
}

function money(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(amount);
}

function formatDate(d: Date | string | undefined): string {
  const date = d ? new Date(d) : new Date();
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function orderRef(data: OrderEmailData): string {
  return displayOrderNumber(data.orderNumber || data.orderId);
}

function chargeTotals(data: OrderEmailData) {
  return computeTotals(
    data.items.map((item) => ({ price: toNum(item.price), quantity: item.quantity })),
    {
      convert: rateConverter(toNum(data.exchangeRate) || 1),
      discountPercent: toNum(data.discountPercent),
      shippingBase: toNum(data.shippingCost),
    },
  );
}

async function invoiceFiles(data: OrderEmailData): Promise<InvoiceFile[]> {
  try {
    return [await invoiceAttachment({ ...data, orderNumber: data.orderNumber || data.orderId })];
  } catch (error) {
    console.error(`[Email] Invoice PDF for order ${orderRef(data)} failed`, error);
    return [];
  }
}

function addressHtml(address?: StoredAddress | null): string {
  const lines = addressLines(address);
  return lines.length ? lines.map(escape).join("<br>") : "&mdash;";
}

function sellerBlock(): string {
  return `${label("Sold by")}
<p style="margin:0;font-size:14px;line-height:1.6;color:${C.ink};">
  <strong>${escape(COMPANY.name)}</strong>, trading as ${BRAND.name}<br>
  ${escape(COMPANY.registeredOffice)}, ${escape(COMPANY.country)}<br>
  Company number ${escape(COMPANY.companyNumber)}${STORE_POLICY.vatRegistered ? `<br>VAT number ${escape(COMPANY.vatNumber)}` : ""}<br>
  Merchant of Record: ${escape(COMPANY.name)}
</p>`;
}

function orderFacts(data: OrderEmailData): string {
  const currency = currencyOf(data);
  const cell = `padding:10px 0;border-bottom:1px solid ${C.line};font-size:14px;line-height:1.5;vertical-align:top;`;
  const rows: [string, string][] = [
    ["Order number", `<span style="font-family:${MONO};color:${C.ink};">${orderRef(data)}</span>`],
    ["Order date", formatDate(data.createdAt)],
    ["Currency", currency],
    ["Payment method", escape(data.paymentMethod === "card" || !data.paymentMethod ? PAYMENT_METHOD_LABEL : data.paymentMethod)],
  ];
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${C.line};margin:0 0 24px;">
${rows.map(([k, v]) => `<tr><td style="${cell}color:${C.muted};width:42%;">${k}</td><td style="${cell}color:${C.ink};">${v}</td></tr>`).join("")}
</table>`;
}

function itemsTable(data: OrderEmailData): string {
  const currency = currencyOf(data);
  const totals = chargeTotals(data);
  const th = `padding:0 0 8px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:600;color:${C.subtle};border-bottom:2px solid ${C.paint};`;
  const td = `padding:12px 0;border-bottom:1px solid ${C.line};font-size:14px;line-height:1.5;vertical-align:top;`;
  const rows = data.items
    .map((item, index) => {
      const line = totals.lines[index];
      return `<tr>
  <td style="${td}color:${C.ink};padding-right:12px;">${escape(item.productName)}${item.variantName ? `<br><span style="font-size:12px;color:${C.muted};">${escape(item.variantName)}</span>` : ""}<br><span style="font-size:12px;color:${C.subtle};">SKU ${escape(item.productSku)}</span></td>
  <td style="${td}color:${C.muted};text-align:center;white-space:nowrap;">${item.quantity}</td>
  <td style="${td}color:${C.muted};text-align:right;white-space:nowrap;padding-left:12px;">${money(line.unit, currency)}</td>
  <td style="${td}color:${C.ink};text-align:right;white-space:nowrap;padding-left:12px;">${money(line.total, currency)}</td>
</tr>`;
    })
    .join("");
  const sumRow = (name: string, value: string, strong = false) =>
    `<tr><td colspan="3" style="padding:6px 12px 6px 0;text-align:right;font-size:${strong ? 16 : 14}px;color:${strong ? C.ink : C.muted};${strong ? "font-weight:600;" : ""}">${name}</td><td style="padding:6px 0;text-align:right;white-space:nowrap;font-size:${strong ? 18 : 14}px;color:${C.ink};${strong ? `font-family:${SERIF};` : ""}">${value}</td></tr>`;
  const summary = [
    sumRow("Subtotal", money(totals.subtotal, currency)),
    totals.discount > 0 ? sumRow(`Discount (${totals.discountPercent}%)`, `&minus;${money(totals.discount, currency)}`) : "",
    sumRow("Delivery", totals.shipping === 0 ? "Free" : money(totals.shipping, currency)),
    totals.vatRegistered && !totals.vatIncluded ? sumRow(`VAT (${totals.vatRatePercent}%)`, money(totals.vat, currency)) : "",
    sumRow(`Total (${currency})`, money(totals.total, currency), true),
    totals.vatRegistered && totals.vatIncluded ? sumRow(`Includes VAT at ${totals.vatRatePercent}%`, money(totals.vat, currency)) : "",
  ].join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
<thead><tr>
  <th align="left" style="${th}">Item</th>
  <th align="center" style="${th}">Qty</th>
  <th align="right" style="${th}">Price</th>
  <th align="right" style="${th}">Amount</th>
</tr></thead>
<tbody>${rows}${summary}</tbody>
</table>`;
}

function addressesBlock(data: OrderEmailData): string {
  const billing = data.billingAddress ?? data.shippingAddress;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
<tr>
  <td width="50%" style="vertical-align:top;padding-right:12px;">${label("Billing address")}<p style="margin:0;font-size:14px;line-height:1.6;color:${C.ink};">${addressHtml(billing)}</p></td>
  <td width="50%" style="vertical-align:top;padding-left:12px;">${label("Delivery")}<p style="margin:0;font-size:14px;line-height:1.6;color:${C.ink};">${escape(STORE_POLICY.delivery.method)}<br>${escape(data.customerEmail)}</p></td>
</tr>
</table>`;
}

function deliveryNote(): string {
  const d = STORE_POLICY.delivery;
  return paragraph(
    `Your keys appear ${d.where}, ${d.usualTime}. ${d.emailNote} If we cannot deliver a key within ${d.deadlineHours} hours, we refund the price you paid for it.`,
    "font-size:14px;",
  );
}

function waiverNote(data: OrderEmailData): string {
  const text = data.waiverText || STORE_POLICY.waiver.text;
  const when = data.waiverAcceptedAt ? ` on ${formatDate(data.waiverAcceptedAt)}` : "";
  return `${label("Your consent at checkout")}
${paragraph(`You confirmed${when}: &ldquo;${escape(text)}&rdquo; Delivery begins when your key is issued to your account, so the ${STORE_POLICY.returns.withdrawalDays}-day right of withdrawal no longer applies from that point. Our <a href="${SITE_URL}/policies/warranty" style="color:${C.ink};">key guarantee</a> still covers keys that do not activate.`, "font-size:13px;")}`;
}

export async function sendWelcomeEmail(email: string, name?: string | null): Promise<boolean> {
  const firstName = name ? escape(name.split(" ")[0]) : null;
  return send({
    to: email,
    subject: `Your ${BRAND.name} account is ready`,
    html: emailWrapper(
      `${heading(firstName ? `Welcome, ${firstName}` : `Welcome to ${BRAND.name}`)}
${paragraph(`Your account is set up. Sign in with <strong style="color:${C.ink};">${escape(email)}</strong> to:`)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${C.line};margin:0 0 8px;">
  <tr><td style="padding:12px 0;border-bottom:1px solid ${C.line};font-size:15px;color:${C.ink};">See every key you buy on its order page, revealed only when you ask for it</td></tr>
  <tr><td style="padding:12px 0;border-bottom:1px solid ${C.line};font-size:15px;color:${C.ink};">Download invoices for your orders</td></tr>
  <tr><td style="padding:12px 0;border-bottom:1px solid ${C.line};font-size:15px;color:${C.ink};">Save products to look at later</td></tr>
</table>
${button(`${SITE_URL}/catalog`, "Browse the catalogue")}
${paragraph(`If you did not create this account, reply to this email and we will close it.`, "font-size:13px;margin:16px 0 0;")}`,
      { preheader: `Your ${BRAND.name} account is ready.` },
    ),
  });
}

export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<boolean> {
  const ref = orderRef(data);
  const totals = chargeTotals(data);
  const currency = currencyOf(data);
  const attachments = await invoiceFiles(data);
  return send({
    to: data.customerEmail,
    subject: `Order ${ref} confirmed — ${BRAND.name}`,
    attachments,
    html: emailWrapper(
      `${heading(`Thank you, ${escape(data.customerName.split(" ")[0] || data.customerName)}`)}
<p style="margin:0 0 20px;">${plate(`Order ${ref}`)}</p>
${paragraph(`Your payment of <strong style="color:${C.ink};">${money(totals.total, currency)}</strong> has been confirmed and we are issuing your keys.${attachments.length ? " Your invoice is attached as a PDF." : ""}`)}
${orderFacts(data)}
${itemsTable(data)}
${addressesBlock(data)}
${deliveryNote()}
${waiverNote(data)}
${sellerBlock()}
${button(`${SITE_URL}/account/orders/${data.orderId}`, "Open your order")}
${paragraph(`See our <a href="${SITE_URL}/policies/returns" style="color:${C.ink};">Refund policy</a> and <a href="${SITE_URL}/policies/shipping" style="color:${C.ink};">Delivery policy</a>.`, "font-size:13px;margin:16px 0 0;")}`,
      { preheader: `Order ${ref} is confirmed. Total ${money(totals.total, currency)}.` },
    ),
  });
}

export async function sendOrderInvoiceEmail(data: OrderEmailData): Promise<boolean> {
  const ref = orderRef(data);
  const totals = chargeTotals(data);
  const currency = currencyOf(data);
  const attachments = await invoiceFiles(data);
  return send({
    to: data.customerEmail,
    subject: `Invoice for order ${ref} — ${BRAND.name}`,
    attachments,
    html: emailWrapper(
      `${heading("Invoice")}
<p style="margin:0 0 20px;">${plate(`Invoice ${ref}`)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
<tr>
  <td width="50%" style="vertical-align:top;padding-right:12px;">${sellerBlock()}</td>
  <td width="50%" style="vertical-align:top;padding-left:12px;">${label("Billed to")}<p style="margin:0;font-size:14px;line-height:1.6;color:${C.ink};">${addressHtml(data.billingAddress ?? data.shippingAddress)}<br>${escape(data.customerEmail)}</p></td>
</tr>
</table>
${orderFacts(data)}
${itemsTable(data)}
${paragraph(`Paid in full: ${money(totals.total, currency)}. Card details are handled by our payment provider; we never receive or store your full card number.`, "font-size:13px;")}
${paragraph(`${attachments.length ? "The PDF invoice is attached. " : ""}Keep this email as your proof of purchase. Questions about this invoice: <a href="mailto:${COMPANY.email}" style="color:${C.ink};">${COMPANY.email}</a>.`, "font-size:13px;margin:0;")}`,
      { preheader: `Invoice for order ${ref}: ${money(totals.total, currency)}` },
    ),
  });
}

export async function sendKeysReadyEmail(data: OrderEmailData, items: { name: string; keys: number; platform: string | null }[]): Promise<boolean> {
  const ref = orderRef(data);
  const rows = items
    .map((item) => `<tr><td style="padding:12px 0;border-bottom:1px solid ${C.line};font-size:15px;color:${C.ink};">${escape(item.name)}${item.platform ? `<br><span style="font-size:12px;color:${C.muted};">${escape(item.platform)}</span>` : ""}</td><td style="padding:12px 0;border-bottom:1px solid ${C.line};font-size:14px;color:${C.muted};text-align:right;white-space:nowrap;">${item.keys} ${item.keys === 1 ? "key" : "keys"}</td></tr>`)
    .join("");
  return send({
    to: data.customerEmail,
    subject: `Your keys for order ${ref} are ready — ${BRAND.name}`,
    html: emailWrapper(
      `${heading("Your keys are ready")}
<p style="margin:0 0 20px;">${plate(`Order ${ref}`)}</p>
${paragraph(`Hi ${escape(data.customerName.split(" ")[0] || data.customerName)}, the keys for your order have been issued. For your security this email does not contain them: sign in and open the order to reveal and copy each key.`)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${C.line};margin:0 0 8px;">${rows}</table>
${button(`${SITE_URL}/account/orders/${data.orderId}`, "Reveal your keys")}
${paragraph(`Activation steps for each platform are on the order page and in <a href="${SITE_URL}/how-it-works" style="color:${C.ink};">How delivery works</a>. If a key does not activate, contact us within ${STORE_POLICY.guarantee.claimDays} days with the order number and a screenshot of the error.`, "font-size:13px;margin:16px 0 0;")}`,
      { preheader: `Your keys for order ${ref} are in your account.` },
    ),
  });
}

export async function sendOrderStatusEmail(data: OrderEmailData, status: "DELIVERED" | "CANCELLED" | "REFUNDED", amount?: number): Promise<boolean> {
  const ref = orderRef(data);
  const totals = chargeTotals(data);
  const currency = currencyOf(data);
  const refundDays = STORE_POLICY.returns.refundDays;
  const refunded = money(amount ?? totals.total, currency);
  const variants = {
    DELIVERED: {
      subject: `Order ${ref} has been delivered`,
      title: "Every key in your order has been delivered",
      message: `all keys in your order are now in your account. Reveal them on the order page when you are ready to activate. If a key does not activate, contact us within ${STORE_POLICY.guarantee.claimDays} days of delivery and we replace it or refund it.`,
      cta: "Open your order",
      href: `${SITE_URL}/account/orders/${data.orderId}`,
    },
    CANCELLED: {
      subject: `Order ${ref} has been cancelled`,
      title: "Your order has been cancelled",
      message: `if you were charged, we refund ${refunded} to ${STORE_POLICY.returns.refundMethod} within ${refundDays} days.`,
      cta: "Browse the catalogue",
      href: `${SITE_URL}/catalog`,
    },
    REFUNDED: {
      subject: `Refund issued for order ${ref}`,
      title: "Your refund has been issued",
      message: `we have refunded ${refunded} to ${STORE_POLICY.returns.refundMethod}. Your bank may take a few days to show it on your statement.`,
      cta: "View your order",
      href: `${SITE_URL}/account/orders/${data.orderId}`,
    },
  } as const;
  const v = variants[status];
  return send({
    to: data.customerEmail,
    subject: `${v.subject} — ${BRAND.name}`,
    html: emailWrapper(
      `${heading(v.title)}
<p style="margin:0 0 20px;">${plate(`Order ${ref}`)}</p>
${paragraph(`Hi ${escape(data.customerName.split(" ")[0] || data.customerName)}, ${v.message}`)}
${button(v.href, v.cta)}`,
      { preheader: v.title },
    ),
  });
}

export async function sendPasswordResetEmail(email: string, resetUrl: string, name?: string | null): Promise<boolean> {
  const firstName = name ? escape(name.split(" ")[0]) : null;
  const minutes = PASSWORD_RESET_TTL_MINUTES;
  const expiry = minutes % 60 === 0 ? `${minutes / 60} ${minutes / 60 === 1 ? "hour" : "hours"}` : `${minutes} minutes`;
  return send({
    to: email,
    subject: `Reset your ${BRAND.name} password`,
    html: emailWrapper(
      `${heading("Reset your password")}
${paragraph(`${firstName ? `Hi ${firstName}, we` : "We"} received a request to reset the password for the ${BRAND.name} account using ${escape(email)}. The link below works once and expires in ${expiry}.`)}
${button(resetUrl, "Set a new password")}
${paragraph(`If the button does not work, copy this link into your browser:<br><a href="${resetUrl}" style="color:${C.ink};word-break:break-all;">${resetUrl}</a>`, "font-size:13px;")}
${paragraph("If you did not ask for this, ignore this email. Your password stays the same.", "font-size:13px;margin:0;")}`,
      { preheader: `Reset your ${BRAND.name} password. The link expires in ${expiry}.` },
    ),
  });
}

interface ContactSubmission {
  name: string;
  email: string;
  orderNumber?: string;
  subject: string;
  message: string;
}

export async function sendContactFormEmail(submission: ContactSubmission): Promise<boolean> {
  const supportInbox = getReplyTo() || process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!supportInbox) {
    console.log("[Email] Contact form notification skipped (no inbox configured)");
    return false;
  }

  const order = submission.orderNumber?.trim();

  return send({
    to: supportInbox,
    subject: `Contact: ${submission.subject}${order ? ` · order ${order}` : ""}`,
    replyTo: submission.email,
    html: emailWrapper(`
      ${heading("New contact form submission")}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;font-size:14px;">
        <tr>
          <td style="padding:8px 0;color:${C.muted};width:80px;">From</td>
          <td style="padding:8px 0;color:${C.ink};font-weight:600;">${escape(submission.name)} &lt;${escape(submission.email)}&gt;</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:${C.muted};">Subject</td>
          <td style="padding:8px 0;color:${C.ink};font-weight:600;">${escape(submission.subject)}</td>
        </tr>
        ${
          order
            ? `<tr>
          <td style="padding:8px 0;color:${C.muted};">Order</td>
          <td style="padding:8px 0;color:${C.ink};font-weight:600;font-family:${MONO};">${escape(order)}</td>
        </tr>`
            : ""
        }
      </table>
      <div style="background:${C.brassTint};padding:16px;color:${C.ink};font-size:14px;line-height:1.6;white-space:pre-wrap;">${escape(submission.message)}</div>
      <p style="color:${C.muted};font-size:12px;margin:16px 0 0;">
        Reply directly to this email to respond to ${escape(submission.email)}.
      </p>
    `),
  });
}

export async function sendContactAutoReplyEmail(submission: ContactSubmission): Promise<boolean> {
  const order = submission.orderNumber?.trim();
  return send({
    to: submission.email,
    subject: `We have your message — ${BRAND.name}`,
    html: emailWrapper(
      `
      ${heading("We have your message")}
      ${paragraph(`Hi ${escape(submission.name)}, thank you for writing to ${BRAND.name}. We reply ${STORE_POLICY.support.replyTime}. Support hours: ${escape(COMPANY.supportHours)}.`)}
      <div style="background:${C.brassTint};padding:16px;margin:0 0 16px;">
        ${label("Your message")}
        <p style="margin:0 0 8px;font-size:14px;color:${C.ink};font-weight:600;">${escape(submission.subject)}${order ? ` · order <span style="font-family:${MONO};">${escape(order)}</span>` : ""}</p>
        <p style="margin:0;font-size:14px;color:${C.muted};line-height:1.6;white-space:pre-wrap;">${escape(submission.message)}</p>
      </div>
      ${paragraph(`Many questions are answered in <a href="${SITE_URL}/faq" style="color:${C.ink};">Questions</a>. Delivery and returns are covered in our <a href="${SITE_URL}/policies/shipping" style="color:${C.ink};">Delivery policy</a> and <a href="${SITE_URL}/policies/returns" style="color:${C.ink};">Returns and refunds</a>.`, "font-size:13px;margin:16px 0 0;")}
    `,
      { preheader: `We reply ${STORE_POLICY.support.replyTime}.` },
    ),
  });
}
