export function formatPrice(
  amount: number | string,
  currency: string = "USD",
  locale: string = "en-GB"
): string {
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(numericAmount);
}
