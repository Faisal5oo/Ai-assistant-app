import { NextResponse } from "next/server";
import { COOKIE_NAME, verifyToken } from "@/lib/auth-utils";

const PROTECTED_PREFIXES = [
  "/",
  "/dashboard",
  "/tasks",
  "/analytics",
  "/productivity",
];

function isProtectedPath(pathname) {
  // Root path is a special case — treat it as protected so unauthenticated
  // visitors are sent to /auth instead of being redirected to /dashboard
  // (which would then fail all data fetches and show "Not authenticated" toasts).
  if (pathname === "/") return true;
  return PROTECTED_PREFIXES.some(
    (prefix) => prefix !== "/" && (pathname === prefix || pathname.startsWith(`${prefix}/`))
  );
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;

  // Already on the auth page — redirect authenticated users to their dashboard.
  if (pathname.startsWith("/auth")) {
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Allow API routes to pass through — they run their own requireAuth checks
  // and return JSON 401 responses rather than HTML redirects.
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  // Unauthenticated — redirect to /auth preserving the intended destination.
  if (!session) {
    const loginUrl = new URL("/auth", request.url);
    // Only attach ?from= for non-root paths so the post-login redirect is useful.
    if (pathname !== "/") {
      loginUrl.searchParams.set("from", pathname);
    }
    const response = NextResponse.redirect(loginUrl);

    // Clean up an expired/invalid token cookie so the browser doesn't keep
    // sending it on subsequent requests.
    if (token) {
      response.cookies.delete(COOKIE_NAME);
    }

    return response;
  }

  // Authenticated user hitting the root — send them straight to /dashboard.
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Run middleware on every request EXCEPT:
     *  - Next.js internals (_next/static, _next/image, favicon.ico)
     *  - Any static file with a file extension (images, fonts, etc.)
     *
     * This ensures the auth-redirect logic fires for page navigations
     * (/, /dashboard, /tasks, /analytics, /productivity/*) as well as
     * all API routes (/api/*).
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|css|js)$).*)",
  ],
};
