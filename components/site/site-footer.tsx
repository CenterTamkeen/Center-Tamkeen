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
          background: "var(--footer-background)",
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
              منصة تعليمية عربية بتجمع المدرسين والكورسات وأكواد التفعيل في
              تجربة بسيطة ومنظمة، عشان الطالب يوصل للمادة والمدرس المناسب بسرعة.
            </p>
            <div className="text-foreground/60 flex flex-col gap-2 text-sm">
              <a
                href="https://wa.me/201111901562"
                target="_blank"
                rel="noreferrer"
                className="hover:text-primary-700 flex items-center gap-2 transition-colors duration-300"
              >
                <svg
                  className="text-primary-500 h-4 w-4 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                واتساب: 01111901562
              </a>
              <a
                href="mailto:centertamkeen64@gmail.com"
                className="hover:text-primary-700 flex items-center gap-2 transition-colors duration-300"
              >
                <svg
                  className="text-primary-500 h-4 w-4 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                centertamkeen64@gmail.com
              </a>
              <a
                href="https://www.facebook.com/share/1b84HsBzqi/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-primary-700 flex items-center gap-2 transition-colors duration-300"
              >
                <svg
                  className="text-primary-500 h-4 w-4 shrink-0"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                فيسبوك تمكين
              </a>
            </div>
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
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="border-t py-5"
          style={{ borderColor: "var(--footer-border)" }}
        >
          <div className="container-page text-foreground/45 flex flex-col items-center justify-between gap-4 text-xs md:flex-row">
            <p>© {new Date().getFullYear()} تمكين. جميع الحقوق محفوظة.</p>
            <div className="flex items-center gap-1.5">
              <span>تم تطوير المنصة من خلال</span>
              <a
                href="https://www.linkedin.com/in/yasa-jaber/"
                target="_blank"
                rel="noreferrer"
                className="group text-foreground/80 relative inline-flex items-center px-1 py-1 text-sm font-black transition-all duration-300 hover:-translate-y-0.5"
              >
                <span className="bg-primary-500 absolute inset-x-0 bottom-0 h-[2px] origin-right scale-x-0 rounded-full transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
                <span className="group-hover:text-primary-600 transition-colors duration-300">
                  yasa jaber
                </span>
              </a>
              <span className="text-sm font-medium">و</span>
              <a
                href="https://www.linkedin.com/in/3bnaser/"
                target="_blank"
                rel="noreferrer"
                className="group text-foreground/80 relative inline-flex items-center px-1 py-1 text-sm font-black transition-all duration-300 hover:-translate-y-0.5"
              >
                <span className="bg-primary-500 absolute inset-x-0 bottom-0 h-[2px] origin-right scale-x-0 rounded-full transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
                <span className="group-hover:text-primary-600 transition-colors duration-300">
                  3bnaser
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
