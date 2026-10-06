const GTIN_LENGTHS = new Set([8, 12, 13, 14]);

export function isValidGtin(code: string): boolean {
  if (!/^\d+$/.test(code) || !GTIN_LENGTHS.has(code.length)) return false;
  if (/^0+$/.test(code)) return false;
  const digits = code.split("").map(Number);
  const check = digits.pop()!;
  const sum = digits.reverse().reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

export function validGtin(...candidates: (string | null | undefined)[]): string | null {
  for (const raw of candidates) {
    const code = raw?.replace(/[\s-]+/g, "") ?? "";
    if (isValidGtin(code)) return code;
  }
  return null;
}
