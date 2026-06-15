"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { signOutAction } from "@/lib/auth/actions";
import type { AppRole } from "@/lib/auth/roles";

type SiteHeaderClientProps = {
  userRole: AppRole | null;
  dashboardHref: string | null;
};

const navLinks = [
  { href: "/", label: "الرئيسية" },
  { href: "/courses", label: "الكورسات" },
  { href: "/teachers", label: "المدرسين" },
  { href: "/#reviews", label: "التقييمات" },
];

export function SiteHeaderClient({
  userRole,
  dashboardHref,
}: SiteHeaderClientProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isLoggedIn = Boolean(userRole && dashboardHref);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled ? "py-0 shadow-[0_1px_3px_rgb(13_37_31/0.06)]" : "py-1"
      }`}
      style={{
        background: scrolled
          ? "rgb(255 255 255 / 0.82)"
          : "rgb(255 255 255 / 0.55)",
        backdropFilter: `blur(${scrolled ? "24px" : "16px"}) saturate(180%)`,
        WebkitBackdropFilter: `blur(${scrolled ? "24px" : "16px"}) saturate(180%)`,
        borderBottom: `1px solid rgb(208 227 218 / ${scrolled ? "0.6" : "0.3"})`,
      }}
    >
      <div className="container-page flex items-center justify-between gap-4 py-3">
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative">
            <Image
              src="/Logo/tamkeen-transparent.png"
              alt="شعار تمكين"
              width={44}
              height={44}
              className="h-11 w-11 object-contain transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
              priority
            />
            <div className="bg-primary/10 absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </div>
          <span
            className="group-hover:text-primary-600 text-xl font-black transition-colors duration-300"
            style={{
              background:
                "linear-gradient(135deg, var(--primary-700), var(--primary-500))",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            تمكين
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group text-foreground/70 hover:text-primary-700 relative rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-300"
            >
              {link.label}
              <span className="from-primary-400 to-primary-600 absolute inset-x-3 -bottom-0 h-0.5 origin-right scale-x-0 rounded-full bg-gradient-to-l transition-transform duration-300 group-hover:origin-left group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <>
              <Link
                href={dashboardHref!}
                className="text-foreground/75 hover:bg-primary-50/60 hover:text-primary-700 hidden rounded-lg px-4 py-2 text-sm font-bold transition-all duration-300 sm:inline-flex"
              >
                لوحتي
              </Link>
              <Link
                href="/profile"
                className="btn-secondary hidden px-4 py-2 text-xs sm:inline-flex"
              >
                الملف
              </Link>
              <form action={signOutAction} className="hidden sm:block">
                <button type="submit" className="btn-primary px-4 py-2 text-xs">
                  خروج
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-foreground/75 hover:bg-primary-50/60 hover:text-primary-700 hidden rounded-lg px-4 py-2 text-sm font-bold transition-all duration-300 sm:inline-flex"
              >
                دخول
              </Link>
              <Link
                href="/signup"
                className="btn-primary px-4 py-2 text-xs sm:text-sm"
              >
                حساب طالب
              </Link>
            </>
          )}

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="hover:bg-primary-50/60 relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors duration-300 md:hidden"
            aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
          >
            <div className="flex w-5 flex-col items-center gap-1.5">
              <span
                className={`bg-foreground/70 h-0.5 w-full rounded-full transition-all duration-300 ${
                  menuOpen ? "translate-y-2 rotate-45" : ""
                }`}
              />
              <span
                className={`bg-foreground/70 h-0.5 w-full rounded-full transition-all duration-300 ${
                  menuOpen ? "scale-x-0 opacity-0" : ""
                }`}
              />
              <span
                className={`bg-foreground/70 h-0.5 w-full rounded-full transition-all duration-300 ${
                  menuOpen ? "-translate-y-2 -rotate-45" : ""
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      <div
        className={`border-border/40 overflow-hidden border-t transition-all duration-400 md:hidden ${
          menuOpen
            ? "max-h-96 opacity-100"
            : "max-h-0 border-t-transparent opacity-0"
        }`}
        style={{
          background: "rgb(255 255 255 / 0.92)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        <nav className="container-page flex flex-col gap-1 py-4">
          {[
            ...navLinks,
            ...(isLoggedIn
              ? [
                  { href: dashboardHref!, label: "لوحتي" },
                  { href: "/profile", label: "الملف الشخصي" },
                ]
              : [
                  { href: "/login", label: "تسجيل الدخول" },
                  { href: "/signup", label: "حساب طالب" },
                ]),
          ].map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-foreground/75 hover:bg-primary-50/60 hover:text-primary-700 rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-300 hover:pr-6"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              {link.label}
            </Link>
          ))}
          {isLoggedIn ? (
            <form action={signOutAction} className="px-4 pt-2">
              <button type="submit" className="btn-primary w-full py-3">
                خروج
              </button>
            </form>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
