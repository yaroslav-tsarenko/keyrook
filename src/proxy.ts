import { type NextRequest, NextResponse } from "next/server";
import { verifyTokenEdge } from "@/lib/token-edge";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("session_token")?.value;
  const payload = token ? await verifyTokenEdge(token) : null;

  if (!payload) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
