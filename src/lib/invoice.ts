import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { COMPANY } from "@/lib/company";
import { BRAND } from "@/lib/brand";
import { PAYMENT_METHOD_LABEL } from "@/lib/payments/types";
import { addressLines, displayOrderNumber, orderCurrency, orderTotals, type Numeric, type OrderAmountsSource, type StoredAddress } from "@/lib/orders";

export interface InvoiceSource extends OrderAmountsSource {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  shippingAddress?: unknown;
  billingAddress?: unknown;
  paymentMethod?: string | null;
  createdAt?: Date | string;
  paidAt?: Date | string | null;
  items: { productName: string; variantName?: string | null; quantity: number; price: Numeric }[];
}

export interface InvoiceFile {
  filename: string;
  content: Buffer;
  contentType: "application/pdf";
}

const PAGE = { width: 595.28, height: 841.89, margin: 48 };

function hex(value: string): RGB {
  const n = parseInt(value.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

const INK = hex("#141517");
const MUTED = hex("#45474b");
const SUBTLE = hex("#54565b");
const PAINT = hex("#141517");
const LAMP = hex("#c77a12");
const LINE = hex("#a9abaf");

const FONT_FILES = {
  display: "sofia-sans-condensed-latin-700-normal.woff",
  body: "source-sans-3-latin-400-normal.woff",
  strong: "source-sans-3-latin-600-normal.woff",
  mono: "martian-mono-latin-500-normal.woff",
} as const;

const FALLBACK_LETTERS: Record<string, string> = {
  "Ł": "L", "ł": "l", "Đ": "D", "đ": "d", "Ħ": "H", "ħ": "h", "ı": "i", "Ŀ": "L", "ŀ": "l", "Ŧ": "T", "ŧ": "t",
  "Ø": "O", "ø": "o", "Æ": "AE", "æ": "ae", "Œ": "OE", "œ": "oe", "ß": "ss", "Þ": "Th", "þ": "th", "Ð": "D", "ð": "d",
  "‘": "'", "’": "'", "“": "\"", "”": "\"", "−": "-", "—": "-", "–": "-", "…": "...",
};

interface Fonts {
  display: PDFFont;
  body: PDFFont;
  strong: PDFFont;
  mono: PDFFont;
}

async function fontBytes(file: string): Promise<Uint8Array | null> {
  try {
    return await readFile(join(process.cwd(), "public", "fonts", file));
  } catch {
    return null;
  }
}

async function embedFonts(doc: PDFDocument): Promise<Fonts> {
  doc.registerFontkit(fontkit);
  const [display, body, strong, mono] = await Promise.all([fontBytes(FONT_FILES.display), fontBytes(FONT_FILES.body), fontBytes(FONT_FILES.strong), fontBytes(FONT_FILES.mono)]);
  return {
    display: display ? await doc.embedFont(display, { subset: true }) : await doc.embedFont(StandardFonts.HelveticaBold),
    mono: mono ? await doc.embedFont(mono, { subset: true }) : await doc.embedFont(StandardFonts.Courier),
    body: body ? await doc.embedFont(body, { subset: true }) : await doc.embedFont(StandardFonts.Helvetica),
    strong: strong ? await doc.embedFont(strong, { subset: true }) : await doc.embedFont(StandardFonts.HelveticaBold),
  };
}

const charsetCache = new WeakMap<PDFFont, Set<number>>();

function printable(font: PDFFont, text: string): string {
  let set = charsetCache.get(font);
  if (!set) {
    set = new Set(font.getCharacterSet());
    charsetCache.set(font, set);
  }
  const supported = set;
  return Array.from(text.replace(/[\r\n\t]+/g, " "))
    .map((char) => {
      if (supported.has(char.codePointAt(0) ?? 0)) return char;
      const mapped = FALLBACK_LETTERS[char];
      if (mapped && Array.from(mapped).every((c) => supported.has(c.codePointAt(0) ?? 0))) return mapped;
      const base = char.normalize("NFD").replace(/\p{M}/gu, "");
      if (base && Array.from(base).every((c) => supported.has(c.codePointAt(0) ?? 0))) return base;
      return "?";
    })
    .join("");
}

function wrap(font: PDFFont, text: string, size: number, width: number): string[] {
  const words = printable(font, text).split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= width) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    let chunk = word;
    while (font.widthOfTextAtSize(chunk, size) > width && chunk.length > 1) {
      let cut = chunk.length - 1;
      while (cut > 1 && font.widthOfTextAtSize(chunk.slice(0, cut), size) > width) cut -= 1;
      lines.push(chunk.slice(0, cut));
      chunk = chunk.slice(cut);
    }
    current = chunk;
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function money(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(amount);
}

function longDate(value: Date | string | null | undefined): string {
  const date = value ? new Date(value) : new Date();
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

export function invoiceNumber(orderNumber: string): string {
  return `INV-${displayOrderNumber(orderNumber)}`;
}

export function invoiceFilename(orderNumber: string): string {
  return `${BRAND.name.toLowerCase()}-invoice-${displayOrderNumber(orderNumber).toLowerCase()}.pdf`;
}

export function sellerLines(): string[] {
  return [
    `${BRAND.name} is a trading name of ${COMPANY.name}.`,
    `${COMPANY.registeredOffice}, ${COMPANY.country}`,
    `Company number ${COMPANY.companyNumber}`,
    ...(COMPANY.vatRegistered ? [`VAT number ${COMPANY.vatNumber}`] : []),
    COMPANY.email,
  ];
}

class Writer {
  page: PDFPage;
  y: number;
  pages: PDFPage[] = [];

  constructor(
    private doc: PDFDocument,
    readonly fonts: Fonts,
  ) {
    this.page = this.addPage();
    this.y = PAGE.height - PAGE.margin;
  }

  addPage(): PDFPage {
    const page = this.doc.addPage([PAGE.width, PAGE.height]);
    this.pages.push(page);
    this.page = page;
    this.y = PAGE.height - PAGE.margin;
    return page;
  }

  text(value: string, x: number, y: number, options: { font?: PDFFont; size?: number; color?: RGB; align?: "left" | "right"; tracking?: number } = {}) {
    const font = options.font ?? this.fonts.body;
    const size = options.size ?? 9.5;
    const safe = printable(font, value);
    const spacing = options.tracking ?? 0;
    const width = font.widthOfTextAtSize(safe, size) + spacing * Math.max(0, safe.length - 1);
    const left = options.align === "right" ? x - width : x;
    if (spacing) {
      let cursor = left;
      for (const char of Array.from(safe)) {
        this.page.drawText(char, { x: cursor, y, size, font, color: options.color ?? INK });
        cursor += font.widthOfTextAtSize(char, size) + spacing;
      }
      return;
    }
    this.page.drawText(safe, { x: left, y, size, font, color: options.color ?? INK });
  }

  label(value: string, x: number, y: number, align: "left" | "right" = "left") {
    this.text(value.toUpperCase(), x, y, { font: this.fonts.strong, size: 7, color: SUBTLE, tracking: 0.9, align });
  }

  rule(y: number, thickness: number, color: RGB, from = PAGE.margin, to = PAGE.width - PAGE.margin) {
    this.page.drawLine({ start: { x: from, y }, end: { x: to, y }, thickness, color });
  }
}

const COLUMNS = {
  qty: PAGE.width - PAGE.margin - 190,
  unit: PAGE.width - PAGE.margin - 92,
  amount: PAGE.width - PAGE.margin,
};
const DESCRIPTION_WIDTH = COLUMNS.qty - 40 - PAGE.margin;
const FOOTER_SPACE = 64;

function tableHeader(w: Writer) {
  w.label("Description", PAGE.margin, w.y);
  w.label("Qty", COLUMNS.qty, w.y, "right");
  w.label("Unit price", COLUMNS.unit, w.y, "right");
  w.label("Amount", COLUMNS.amount, w.y, "right");
  w.y -= 7;
  w.rule(w.y, 1.25, PAINT);
  w.y -= 16;
}

function wordmark(w: Writer, x: number, y: number, size: number) {
  const font = w.fonts.display;
  const name = BRAND.name;
  const cut = name.indexOf("i");
  const dotless = font.getCharacterSet().includes(0x131);
  if (cut < 0 || !dotless) {
    w.text(name, x, y, { font, size, color: PAINT });
    return;
  }
  const head = name.slice(0, cut);
  const tail = name.slice(cut + 1);
  const headWidth = font.widthOfTextAtSize(head, size);
  const stemWidth = font.widthOfTextAtSize("\u0131", size);
  w.page.drawText(head, { x, y, size, font, color: PAINT });
  w.page.drawText("\u0131", { x: x + headWidth, y, size, font, color: PAINT });
  const side = size * 0.105;
  w.page.drawRectangle({ x: x + headWidth + (stemWidth - side) / 2, y: y + size * 0.6, width: side, height: side, color: LAMP });
  w.page.drawText(tail, { x: x + headWidth + stemWidth, y, size, font, color: PAINT });
}

function masthead(w: Writer, number: string, compact: boolean) {
  const top = PAGE.height - PAGE.margin;
  wordmark(w, PAGE.margin, top - 22, compact ? 20 : 28);
  w.label("Invoice", PAGE.width - PAGE.margin, top - 8, "right");
  w.text(number, PAGE.width - PAGE.margin, top - 24, { font: w.fonts.mono, size: 11, align: "right" });
  w.rule(top - 36, 2, PAINT);
  w.y = top - 36 - 28;
}

function factRows(w: Writer, rows: [string, string][], x: number, width: number) {
  for (const [name, value] of rows) {
    w.text(name, x, w.y, { color: MUTED, size: 9 });
    const lines = wrap(w.fonts.body, value, 9, width - 92);
    lines.forEach((line, index) => w.text(line, x + width, w.y - index * 12, { size: 9, align: "right" }));
    w.y -= Math.max(1, lines.length) * 12 + 5;
  }
}

function addressColumn(w: Writer, title: string, lines: string[], x: number, top: number): number {
  let y = top;
  w.label(title, x, y);
  y -= 15;
  for (const line of lines) {
    for (const part of wrap(w.fonts.body, line, 9.5, 220)) {
      w.text(part, x, y, { size: 9.5 });
      y -= 13;
    }
  }
  return y;
}

export async function renderInvoicePdf(order: InvoiceSource): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const number = invoiceNumber(order.orderNumber);
  const currency = orderCurrency(order);
  const totals = orderTotals(order);
  const issued = order.paidAt ?? order.createdAt;

  doc.setTitle(`${BRAND.name} invoice ${number}`);
  doc.setAuthor(COMPANY.name);
  doc.setSubject(`Invoice for order ${displayOrderNumber(order.orderNumber)}`);
  doc.setCreator(BRAND.name);
  doc.setProducer(BRAND.name);
  if (issued) doc.setCreationDate(new Date(issued));

  const fonts = await embedFonts(doc);
  const w = new Writer(doc, fonts);
  masthead(w, number, false);

  const columnTop = w.y;
  const rightX = PAGE.width / 2 + 16;
  const rightWidth = PAGE.width - PAGE.margin - rightX;
  w.label("Seller", PAGE.margin, columnTop);
  w.text(COMPANY.name, PAGE.margin, columnTop - 16, { font: fonts.strong, size: 10.5 });
  let leftY = columnTop - 31;
  for (const line of sellerLines()) {
    for (const part of wrap(fonts.body, line, 9, PAGE.width / 2 - PAGE.margin - 8)) {
      w.text(part, PAGE.margin, leftY, { size: 9, color: MUTED });
      leftY -= 12.5;
    }
  }

  w.y = columnTop;
  w.label("Details", rightX, w.y);
  w.y -= 16;
  factRows(
    w,
    [
      ["Invoice number", number],
      ["Invoice date", longDate(issued)],
      ["Order number", displayOrderNumber(order.orderNumber)],
      ["Order date", longDate(order.createdAt)],
      ["Currency", currency],
      ["Payment method", order.paymentMethod === "card" || !order.paymentMethod ? PAYMENT_METHOD_LABEL : order.paymentMethod],
    ],
    rightX,
    rightWidth,
  );

  w.y = Math.min(leftY, w.y) - 14;
  w.rule(w.y, 0.75, LINE);
  w.y -= 22;

  const delivery = (order.shippingAddress ?? null) as StoredAddress | null;
  const billing = ((order.billingAddress ?? null) as StoredAddress | null) ?? delivery;
  const billedLines = addressLines(billing);
  const billedTo = [...(billedLines.length ? billedLines : [order.customerName]), order.customerEmail];
  const billedBottom = addressColumn(w, "Billed to", billedTo, PAGE.margin, w.y);
  const deliveredBottom = addressColumn(w, "Delivery", ["Digital activation keys", `Issued to the ${BRAND.name} account`, order.customerEmail], rightX, w.y);
  w.y = Math.min(billedBottom, deliveredBottom) - 22;

  tableHeader(w);
  order.items.forEach((item, index) => {
    const line = totals.lines[index];
    const nameLines = wrap(fonts.body, item.productName, 9.5, DESCRIPTION_WIDTH);
    const variantLines = item.variantName ? wrap(fonts.body, item.variantName, 8.5, DESCRIPTION_WIDTH) : [];
    const height = nameLines.length * 13 + variantLines.length * 11.5 + 10;
    if (w.y - height < PAGE.margin + FOOTER_SPACE) {
      w.addPage();
      masthead(w, number, true);
      tableHeader(w);
    }
    const rowTop = w.y;
    nameLines.forEach((part, i) => w.text(part, PAGE.margin, rowTop - i * 13, { size: 9.5 }));
    variantLines.forEach((part, i) => w.text(part, PAGE.margin, rowTop - nameLines.length * 13 - i * 11.5 + 1, { size: 8.5, color: MUTED }));
    w.text(String(item.quantity), COLUMNS.qty, rowTop, { size: 9.5, color: MUTED, align: "right" });
    w.text(money(line?.unit ?? 0, currency), COLUMNS.unit, rowTop, { font: fonts.mono, size: 8.5, color: MUTED, align: "right" });
    w.text(money(line?.total ?? 0, currency), COLUMNS.amount, rowTop, { font: fonts.mono, size: 8.5, align: "right" });
    w.y = rowTop - height + 13 - 6;
    w.rule(w.y + 6, 0.5, LINE);
    w.y -= 12;
  });

  const summary: [string, string][] = [["Subtotal", money(totals.subtotal, currency)]];
  if (totals.discount > 0) summary.push([`Discount (${totals.discountPercent}%)`, `-${money(totals.discount, currency)}`]);
  if (totals.vatRegistered && !totals.vatIncluded) summary.push([`VAT (${totals.vatRatePercent}%)`, money(totals.vat, currency)]);

  const summaryHeight = summary.length * 16 + 60 + (totals.vatRegistered && totals.vatIncluded ? 16 : 0);
  if (w.y - summaryHeight < PAGE.margin + FOOTER_SPACE) {
    w.addPage();
    masthead(w, number, true);
  }
  const labelX = COLUMNS.unit - 40;
  w.y -= 4;
  for (const [name, value] of summary) {
    w.text(name, labelX, w.y, { size: 9.5, color: MUTED, align: "right" });
    w.text(value, COLUMNS.amount, w.y, { font: fonts.mono, size: 8.5, align: "right" });
    w.y -= 16;
  }
  w.rule(w.y + 6, 1.25, PAINT, labelX - 150, COLUMNS.amount);
  w.y -= 14;
  w.text(`Total (${currency})`, labelX, w.y, { font: fonts.strong, size: 11, align: "right" });
  w.text(money(totals.total, currency), COLUMNS.amount, w.y, { font: fonts.mono, size: 12, align: "right" });
  w.y -= 16;
  if (totals.vatRegistered && totals.vatIncluded) {
    w.text(`Includes VAT at ${totals.vatRatePercent}%`, labelX, w.y, { size: 9, color: MUTED, align: "right" });
    w.text(money(totals.vat, currency), COLUMNS.amount, w.y, { size: 9, color: MUTED, align: "right" });
    w.y -= 16;
  }

  w.y -= 20;
  const paidNote = `Paid in full on ${longDate(issued)}: ${money(totals.total, currency)}. Card details are handled by our payment provider; we never receive or store your full card number.`;
  for (const part of wrap(fonts.body, paidNote, 9, PAGE.width - PAGE.margin * 2)) {
    w.text(part, PAGE.margin, w.y, { size: 9, color: MUTED });
    w.y -= 12.5;
  }

  const footer = `${COMPANY.name} · ${COMPANY.registeredOffice}, ${COMPANY.country} · Company number ${COMPANY.companyNumber} · ${COMPANY.email}`;
  w.pages.forEach((page, index) => {
    w.page = page;
    w.rule(PAGE.margin + 18, 0.5, LINE);
    const parts = wrap(fonts.body, footer, 7.5, PAGE.width - PAGE.margin * 2 - 70);
    parts.forEach((part, i) => w.text(part, PAGE.margin, PAGE.margin + 4 - i * 10, { size: 7.5, color: SUBTLE }));
    w.text(`Page ${index + 1} of ${w.pages.length}`, PAGE.width - PAGE.margin, PAGE.margin + 4, { size: 7.5, color: SUBTLE, align: "right" });
  });

  return doc.save();
}

export async function invoiceAttachment(order: InvoiceSource): Promise<InvoiceFile> {
  const bytes = await renderInvoicePdf(order);
  return { filename: invoiceFilename(order.orderNumber), content: Buffer.from(bytes), contentType: "application/pdf" };
}
