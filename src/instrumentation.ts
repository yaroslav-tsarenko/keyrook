export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { assertPaymentConfig } = await import("@/lib/env");
  assertPaymentConfig();
}
