export function formatOrderDate(iso: string, withTime = false): string {
  const options: Intl.DateTimeFormatOptions = withTime
    ? { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { day: "numeric", month: "short", year: "numeric" };
  return new Intl.DateTimeFormat("en-GB", options).format(new Date(iso));
}
