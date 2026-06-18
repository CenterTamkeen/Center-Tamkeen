import { NextResponse } from "next/server";

import { sendStudentSignupVerificationCode } from "@/lib/auth/email-codes";
import { loginSchema } from "@/lib/validations/auth";

function getSiteUrl(request: Request) {
  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const host = forwardedHost ?? request.headers.get("host") ?? requestUrl.host;
  const protocol = forwardedProto ?? requestUrl.protocol.replace(":", "");

  return `${protocol}://${host}`;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: unknown;
  } | null;
  const parsed = loginSchema.pick({ email: true }).safeParse({
    email: body?.email,
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        status: "error",
        message: "اكتب بريد إلكتروني صحيح الأول.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    const result = await sendStudentSignupVerificationCode(
      parsed.data.email,
      getSiteUrl(request),
    );

    return NextResponse.json(
      {
        status: result.ok ? "success" : "error",
        message: result.message,
        fieldErrors: result.fieldErrors,
      },
      { status: result.status },
    );
  } catch (error) {
    console.error("Failed to send student signup code.", error);
    return NextResponse.json(
      {
        status: "error",
        message: "تعذر إرسال كود التفعيل. تأكد من إعدادات Brevo.",
      },
      { status: 500 },
    );
  }
}
