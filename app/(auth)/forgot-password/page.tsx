import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "نسيت كلمة المرور",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="استعادة كلمة المرور"
      description="اكتب الإيميل المسجل، ولو الحساب موجود هنبعتلك رابط آمن لتغيير كلمة المرور."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
