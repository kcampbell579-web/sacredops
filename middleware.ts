import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// worker.sacredops.app is the workers' front door: hitting its root sends them
// straight to a worker-only sign-up (no demo, no "new company"). Everything
// else (the /worker portal, APIs, assets) is left untouched.
export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") || "").split(":")[0].toLowerCase();
  const url = req.nextUrl;
  if (host.startsWith("worker.") && url.pathname === "/") {
    url.pathname = "/login";
    url.searchParams.set("worker", "1");
    url.searchParams.set("mode", "solo");
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  // Only intervene on the site root; never touch API routes, assets, or /worker.
  matcher: ["/"],
};
