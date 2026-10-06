import { STORE_POLICY } from "@/config/store-policy";

export type EsaErrorCode =
  | "unauthorized"
  | "insufficient_balance"
  | "price_changed"
  | "out_of_stock"
  | "not_found"
  | "duplicate_external_id"
  | "rate_limited"
  | "network"
  | "timeout"
  | "bad_response"
  | "unknown";

export class EsaError extends Error {
  readonly code: EsaErrorCode;
  readonly httpStatus?: number;
  readonly raw?: string;

  constructor(code: EsaErrorCode, opts: { raw?: string; httpStatus?: number; message?: string } = {}) {
    super(opts.message ?? opts.raw ?? code);
    this.name = "EsaError";
    this.code = code;
    this.raw = opts.raw;
    this.httpStatus = opts.httpStatus;
  }
}

export function mapEsaError(httpStatus: number, raw: string | null | undefined): EsaError {
  const text = (raw ?? "").toLowerCase();
  const has = (...needles: string[]) => needles.some((n) => text.includes(n));
  let code: EsaErrorCode = "unknown";
  if (httpStatus === 401 || httpStatus === 403) code = "unauthorized";
  else if (httpStatus === 429) code = "rate_limited";
  else if (has("balance", "insufficient funds", "not enough")) code = "insufficient_balance";
  else if (has("orderexternalid", "external id", "already exists")) code = "duplicate_external_id";
  else if (has("price")) code = "price_changed";
  else if (has("out of stock", "no offers", "not available", "qty")) code = "out_of_stock";
  else if (httpStatus === 404) code = "not_found";
  else if (httpStatus >= 500) code = "bad_response";
  return new EsaError(code, { raw: raw ?? undefined, httpStatus });
}

export function customerMessageFor(code: EsaErrorCode | string | null | undefined): string {
  const refund = `We refund the price you paid for it to ${STORE_POLICY.returns.refundMethod} within ${STORE_POLICY.returns.refundDays} days.`;
  if (code === "price_changed" || code === "out_of_stock") return `This key went out of stock before we could issue it. ${refund}`;
  return `We could not issue this key. ${refund}`;
}
