import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Subdomains that route to something other than a specific company.
const RESERVED = new Set([
  "www", "app", "api", "admin", "demo", "worker", "workers", "staging", "dev",
  "sacredops", "mail", "support", "help", "status", "blog", "login", "signup",
]);

// Subdomain routing on the site root:
//   worker.sacredops.app  → worker-only sign-up (no demo)
//   acme.sacredops.app    → login auto-scoped to Acme (crew skips the company code)
// Logged-in visitors are left alone so they land in the app, not the login page.
// Everything except "/" is untouched (see matcher), so the portals/APIs/assets
// work identically on every host.
export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") || "").split(":")[0].toLowerCase();
  const url = req.nextUrl;
  if (url.pathname !== "/") return NextResponse.next();

  // Apex marketing domain (sacredops.app / www.sacredops.app) → serve the
  // marketing page from public/site.html. Keeps the app on its subdomains.
  if (host === "sacredops.app" || host === "www.sacredops.app") {
    url.pathname = "/site.html";
    return NextResponse.rewrite(url);
  }

  const parts = host.split(".");
  const sub = parts.length >= 3 ? parts[0] : "";
  if (!sub) return NextResponse.next();

  // Already signed in → don't force the login page.
  if (req.cookies.get("sacredops_session")) return NextResponse.next();

  if (sub === "worker" || sub === "workers") {
    url.pathname = "/login";
    url.searchParams.set("worker", "1");
    url.searchParams.set("mode", "solo");
    return NextResponse.rewrite(url);
  }

  // demo.sacredops.app → the tab-less demo signup (company code + name + email
  // + password), so prospects sign up like a real company and become leads.
  if (sub === "demo") {
    url.pathname = "/login";
    url.searchParams.set("mode", "demo");
    return NextResponse.rewrite(url);
  }

  if (!RESERVED.has(sub)) {
    url.pathname = "/login";
    url.searchParams.set("company", sub);
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
