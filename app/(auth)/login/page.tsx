import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
};

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const notice =
    params.registered === "1"
      ? "تم إنشاء الحساب بنجاح. سجل دخولك الآن."
      : params.passwordChanged === "1"
        ? "تم تغيير كلمة المرور. سجل دخولك من جديد."
        : undefined;

  return (
    <AuthShell
      title="تسجيل الدخول"
      description="ادخل لحسابك عشان توصل للوحة المناسبة حسب صلاحيتك: طالب، مدرس، أو إدارة تمكين."
    >
      <LoginForm notice={notice} />
    </AuthShell>
  );
}
