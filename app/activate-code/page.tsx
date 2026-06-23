import type { Metadata } from "next";

import { ActivationCodeForm } from "@/components/site/activation-code-form";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getCurrentUserProfile, getRoleHomePath } from "@/lib/auth/roles";

export const metadata: Metadata = {
  title: "تفعيل بالكود",
  description:
    "فعّل كورس تمكين بكود التفعيل الخاص بك بعد تسجيل الدخول بحساب طالب.",
  alternates: {
    canonical: "/activate-code",
  },
};

export const dynamic = "force-dynamic";

export default async function ActivateCodePage() {
  const session = await getCurrentUserProfile();
  const userRole = session?.profile.role ?? null;
  const dashboardHref = userRole ? getRoleHomePath(userRole) : null;

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="container-page grid min-h-[calc(100vh-12rem)] place-items-center py-12 sm:py-16">
          <div className="w-full">
            <div className="mx-auto mb-7 max-w-xl text-center">
              <p className="eyebrow">كود الاشتراك</p>
              <h1 className="heading-gradient mt-3 pb-2 text-4xl leading-[1.35] font-black sm:text-5xl sm:leading-[1.3]">
                تفعيل بالكود
              </h1>
              <p className="text-foreground/65 mt-3 leading-8">
                اكتب الكود المكون من ٦ أرقام، والمنصة هتتعرف على الكورس المرتبط
                بيه وتفعله في حسابك فورًا.
              </p>
            </div>
            <ActivationCodeForm
              userRole={userRole}
              dashboardHref={dashboardHref}
            />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
