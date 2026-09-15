import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getRoleHomePath, type AppRole } from "@/lib/auth/roles";
import type { Database } from "@/types/database";

const authRoutes = ["/login", "/signup", "/forgot-password"];
const protectedRoutes = ["/dashboard", "/profile"];

function isRoute(pathname: string, routes: string[]) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function redirectTo(
  request: NextRequest,
  pathname: string,
  sourceResponse: NextResponse,
) {
  const response = NextResponse.redirect(new URL(pathname, request.url));

  // Supabase may refresh the access token while getUser() runs below. Keep
  // the refreshed auth cookies when this request also needs a redirect.
  sourceResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });

  return response;
}

function loginRedirect(request: NextRequest, sourceResponse: NextResponse) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  const response = NextResponse.redirect(loginUrl);

  sourceResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });

  return response;
}

function isAllowedDashboardPath(pathname: string, role: AppRole) {
  if (pathname === "/dashboard") {
    return false;
  }

  if (pathname.startsWith("/dashboard/admin")) {
    return role === "admin";
  }

  if (pathname.startsWith("/dashboard/teacher")) {
    return role === "teacher";
  }

  if (pathname.startsWith("/dashboard/student")) {
    return role === "student";
  }

  return true;
}

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  if (!user && isRoute(pathname, protectedRoutes)) {
    return loginRedirect(request, response);
  }

  if (!user) {
    return response;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile && isRoute(pathname, protectedRoutes)) {
    return redirectTo(request, "/login", response);
  }

  if (profile && isRoute(pathname, authRoutes)) {
    return redirectTo(request, getRoleHomePath(profile.role), response);
  }

  if (profile && pathname.startsWith("/dashboard")) {
    if (pathname === "/dashboard") {
      return redirectTo(request, getRoleHomePath(profile.role), response);
    }

    if (!isAllowedDashboardPath(pathname, profile.role)) {
      return redirectTo(request, getRoleHomePath(profile.role), response);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
