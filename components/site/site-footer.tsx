import Image from "next/image";
import Link from "next/link";

import { getCurrentUserProfile, getRoleHomePath } from "@/lib/auth/roles";

export async function SiteFooter() {
  const session = await getCurrentUserProfile();
  const dashboardHref = session ? getRoleHomePath(session.profile.role) : null;
  const quickLinks = dashboardHref
    ? [
        { href: dashboardHref, label: "لوحتي" },
        { href: "/profile", label: "الملف الشخصي" },
        { href: "/courses", label: "تصفح الكورسات" },
        { href: "/teachers", label: "المدرسين" },
      ]
    : [
        { href: "/courses", label: "تصفح الكورسات" },
        { href: "/teachers", label: "المدرسين" },
        { href: "/signup", label: "حساب طالب" },
        { href: "/login", label: "تسجيل الدخول" },
      ];

  return (
    <footer className="relative overflow-hidden">
      {/* Gradient top border */}
      <div
        className="h-px w-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgb(22 138 117 / 0.3), rgb(245 197 24 / 0.2), transparent)",
        }}
      />

      <div
        className="relative"
        style={{
          background:
            "linear-gradient(180deg, rgb(236 245 241 / 0.5) 0%, rgb(255 255 255 / 0.6) 100%)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        {/* Decorative circles */}
        <div
          className="deco-circle"
          style={{
            width: 300,
            height: 300,
            top: -100,
            right: -100,
            background: "rgb(22 138 117 / 0.04)",
          }}
        />
        <div
          className="deco-circle"
          style={{
            width: 200,
            height: 200,
            bottom: -50,
            left: "20%",
            background: "rgb(245 197 24 / 0.04)",
          }}
        />

        <div className="container-page relative grid gap-10 py-14 md:grid-cols-[1.3fr_0.8fr_0.8fr]">
          {/* Brand column */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Image
                  src="/Logo/tamkeen-transparent.png"
                  alt="شعار تمكين"
                  width={44}
                  height={44}
                  className="h-10 w-10 object-contain"
                />
              </div>
              <span className="eyebrow text-xl">تمكين</span>
            </div>
            <p className="text-foreground/65 max-w-md text-sm leading-7">
              منصة تعليمية عربية بتجمع المدرسين والكورسات والطلبات في تجربة
              بسيطة ومنظمة، عشان الطالب يوصل للمادة والمدرس المناسب بسرعة.
            </p>
          </div>

          {/* Quick links */}
          <div className="space-y-4">
            <h2 className="text-foreground/90 font-black">روابط سريعة</h2>
            <nav className="flex flex-col gap-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group text-foreground/60 hover:text-primary-700 flex items-center gap-2 text-sm transition-all duration-300 hover:translate-x-[-4px]"
                >
                  <span className="bg-primary-400 inline-block h-1 w-0 rounded-full transition-all duration-300 group-hover:w-3" />
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h2 className="text-foreground/90 font-black">الدعم والمتابعة</h2>
            <nav className="flex flex-col gap-2">
              {[
                { href: "/about", label: "عن تمكين" },
                { href: "/how-it-works", label: "كيف يعمل الموقع" },
                { href: "/faq", label: "الأسئلة الشائعة" },
                { href: "/contact", label: "تواصل معنا" },
                { href: "/privacy", label: "سياسة الخصوصية" },
                { href: "/terms", label: "الشروط والأحكام" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group text-foreground/60 hover:text-primary-700 flex items-center gap-2 text-sm transition-all duration-300 hover:translate-x-[-4px]"
                >
                  <span className="bg-accent-400 inline-block h-1 w-0 rounded-full transition-all duration-300 group-hover:w-3" />
                  {link.label}
                </Link>
              ))}
              {!dashboardHref ? (
                <Link
                  href="/forgot-password"
                  className="group text-foreground/60 hover:text-primary-700 flex items-center gap-2 text-sm transition-all duration-300 hover:translate-x-[-4px]"
                >
                  <span className="bg-accent-400 inline-block h-1 w-0 rounded-full transition-all duration-300 group-hover:w-3" />
                  نسيت كلمة المرور
                </Link>
              ) : null}
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="border-t py-5"
          style={{ borderColor: "rgb(208 227 218 / 0.4)" }}
        >
          <div className="container-page text-foreground/45 flex items-center justify-between text-xs">
            <p>© {new Date().getFullYear()} تمكين. جميع الحقوق محفوظة.</p>
            <p className="text-gradient-animated font-bold">تمكين التعليمية</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
