import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/types/database";

function getSafeNextPath(value: string | null) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return "/";
  }

  return value;
}

function createAuthRedirectClient(request: NextRequest, redirectUrl: URL) {
  const response = NextResponse.redirect(redirectUrl);
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

  return { response, supabase };
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));
  const redirectUrl = new URL(next, requestUrl.origin);

  if (!code && tokenHash && type === "recovery") {
    const { response, supabase } = createAuthRedirectClient(
      request,
      redirectUrl,
    );
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "recovery",
    });

    if (!error) {
      return response;
    }

    redirectUrl.searchParams.set("resetError", "invalid-link");
    return NextResponse.redirect(redirectUrl);
  }

  if (!code) {
    if (next === "/reset-password") {
      redirectUrl.searchParams.set("resetError", "missing-code");
    } else {
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("authError", "missing-code");
    }

    return NextResponse.redirect(redirectUrl);
  }

  const { response, supabase } = createAuthRedirectClient(request, redirectUrl);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    redirectUrl.pathname = "/login";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("authError", "invalid-link");
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
