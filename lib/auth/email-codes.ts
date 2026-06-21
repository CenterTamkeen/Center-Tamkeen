import crypto from "node:crypto";

import { sendEmail } from "@/lib/email/smtp";
import { getSignupCodeEmailHtml } from "@/lib/email/templates";
import { createAdminClient } from "@/lib/supabase/admin";

type EmailCodePurpose = "student_signup";

const codeTtlMinutes = 10;
const codeCooldownSeconds = 60;
const maxAttempts = 5;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getCodeSecret() {
  const secret = process.env.EMAIL_CODE_SECRET;

  if (!secret) {
    throw new Error(
      "EMAIL_CODE_SECRET is not configured. Set a dedicated secret for email verification codes.",
    );
  }

  return secret;
}

function hashEmailCode(email: string, purpose: EmailCodePurpose, code: string) {
  const secret = getCodeSecret();

  if (!secret) {
    throw new Error("EMAIL_CODE_SECRET is not configured.");
  }

  return crypto
    .createHash("sha256")
    .update(`${normalizeEmail(email)}:${purpose}:${code}:${secret}`)
    .digest("hex");
}

function generateCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

function getExpiryDate() {
  return new Date(Date.now() + codeTtlMinutes * 60 * 1000);
}

function getSendEmailFailureMessage(error: unknown) {
  const message =
    typeof error === "object" && error && "message" in error
      ? String(error.message)
      : "";
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("verify a domain") ||
    normalizedMessage.includes("domain") ||
    normalizedMessage.includes("own email") ||
    normalizedMessage.includes("testing emails")
  ) {
    return "Brevo رفض إرسال الإيميل. تأكد إن Sender متفعل في Brevo.";
  }

  return "تعذر إرسال كود التفعيل. راجع الإيميل وجرّب مرة أخرى.";
}

export async function sendStudentSignupVerificationCode(
  email: string,
  siteUrl?: string,
): Promise<{
  ok: boolean;
  message: string;
  status: number;
  fieldErrors?: Record<string, string[]>;
}> {
  const admin = createAdminClient();
  const normalizedEmail = normalizeEmail(email);
  const now = Date.now();

  const { data: currentCode } = await admin
    .from("email_verification_codes")
    .select("created_at")
    .eq("email", normalizedEmail)
    .eq("purpose", "student_signup")
    .maybeSingle();

  if (
    currentCode?.created_at &&
    now - new Date(currentCode.created_at).getTime() <
      codeCooldownSeconds * 1000
  ) {
    return {
      ok: false,
      message: "استنى دقيقة قبل إرسال كود جديد.",
      status: 429,
    };
  }

  const code = generateCode();
  const expiresAt = getExpiryDate();
  const { error: saveError } = await admin
    .from("email_verification_codes")
    .upsert(
      {
        email: normalizedEmail,
        purpose: "student_signup",
        code_hash: hashEmailCode(normalizedEmail, "student_signup", code),
        attempts: 0,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
      },
      {
        onConflict: "email,purpose",
      },
    );

  if (saveError) {
    console.error("Failed to save signup email verification code.", saveError);
    return {
      ok: false,
      message: "تعذر تجهيز كود التفعيل. جرّب مرة أخرى.",
      status: 500,
    };
  }

  const { error: sendError } = await sendEmail({
    to: normalizedEmail,
    subject: "كود تفعيل حساب تمكين",
    html: getSignupCodeEmailHtml(code, codeTtlMinutes, siteUrl),
    text: [
      "كود تفعيل حساب تمكين",
      "",
      `كود التفعيل: ${code}`,
      `الكود صالح لمدة ${codeTtlMinutes} دقائق فقط.`,
      "لو الطلب مش منك، تجاهل الرسالة بأمان.",
    ].join("\n"),
  });

  if (sendError) {
    console.error("Failed to send signup email verification code.", sendError);
    return {
      ok: false,
      message: getSendEmailFailureMessage(sendError),
      status: 500,
    };
  }

  return {
    ok: true,
    message:
      "تم إرسال كود التفعيل على الإيميل. الكود صالح لمدة 10 دقائق. لو مش لاقيه في الوارد، دور عليه في الرسائل غير المرغوب فيها أو Spam.",
    status: 200,
  };
}

export async function verifyStudentSignupCode(email: string, code: string) {
  const admin = createAdminClient();
  const normalizedEmail = normalizeEmail(email);
  const normalizedCode = code.trim();

  const { data: storedCode, error } = await admin
    .from("email_verification_codes")
    .select("id, code_hash, attempts, expires_at")
    .eq("email", normalizedEmail)
    .eq("purpose", "student_signup")
    .maybeSingle();

  if (error || !storedCode) {
    return "ابعت كود تفعيل للإيميل الأول.";
  }

  if (new Date(storedCode.expires_at).getTime() < Date.now()) {
    await admin
      .from("email_verification_codes")
      .delete()
      .eq("id", storedCode.id);
    return "كود التفعيل انتهت صلاحيته. ابعت كود جديد.";
  }

  if (storedCode.attempts >= maxAttempts) {
    await admin
      .from("email_verification_codes")
      .delete()
      .eq("id", storedCode.id);
    return "تم تجاوز عدد المحاولات. ابعت كود جديد.";
  }

  const expectedHash = hashEmailCode(
    normalizedEmail,
    "student_signup",
    normalizedCode,
  );

  if (storedCode.code_hash !== expectedHash) {
    await admin
      .from("email_verification_codes")
      .update({ attempts: storedCode.attempts + 1 })
      .eq("id", storedCode.id);
    return "كود التفعيل غير صحيح.";
  }

  await admin.from("email_verification_codes").delete().eq("id", storedCode.id);
  return null;
}
