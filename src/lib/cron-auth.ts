import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

function same(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function isAuthorizedCron(req: Request): boolean {
  let secret: string;
  try {
    secret = env.CRON_SECRET;
  } catch {
    return false;
  }
  const auth = req.headers.get("authorization");
  if (auth && same(auth, `Bearer ${secret}`)) return true;
  const fromQuery = new URL(req.url).searchParams.get("secret");
  return Boolean(fromQuery && same(fromQuery, secret));
}
