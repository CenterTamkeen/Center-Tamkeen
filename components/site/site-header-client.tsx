"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { signOutAction } from "@/lib/auth/actions";
import type { AppRole } from "@/lib/auth/roles";

type SiteHeaderClientProps = {
  userRole: AppRole | null;
  dashboardHref: string | null;
  userName: string | null;
  userEmail: string | null;
  userAvatarUrl: string | null;
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
  userName,
  userEmail,
  userAvatarUrl,
}: SiteHeaderClientProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const isLoggedIn = Boolean(userRole && dashboardHref);
  const userInitial = userName?.trim().charAt(0) || "U";

  useEffect(() => {
    if (!accountMenuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [accountMenuOpen]);

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
            <div className="relative hidden sm:block" ref={accountMenuRef}>
              <button
                type="button"
                onClick={() => setAccountMenuOpen((open) => !open)}
                aria-expanded={accountMenuOpen}
                aria-label="فتح قائمة الحساب"
                className="hover:bg-primary-50/70 flex items-center gap-3 rounded-full border border-white/70 bg-white/80 py-1.5 pr-1.5 pl-3 shadow-[0_10px_30px_rgb(13_37_31/0.08)] transition-all duration-300"
              >
                <div className="from-primary-500 to-primary-700 relative h-11 w-11 overflow-hidden rounded-full bg-gradient-to-br text-white ring-2 ring-white">
                  {userAvatarUrl ? (
                    <Image
                      src={userAvatarUrl}
                      alt={userName ?? "الحساب"}
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-base font-black">
                      {userInitial}
                    </span>
                  )}
                </div>
                <div className="max-w-36 text-right">
                  <p className="truncate text-sm font-black text-slate-900">
                    {userName ?? "حسابي"}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {userEmail ?? "عرض الحساب"}
                  </p>
                </div>
              </button>

              {accountMenuOpen ? (
                <div className="absolute top-[calc(100%+0.75rem)] left-0 z-50 w-72 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 shadow-[0_20px_60px_rgb(15_23_42/0.16)] backdrop-blur-xl">
                  <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4">
                    <div className="from-primary-500 to-primary-700 relative h-14 w-14 overflow-hidden rounded-full bg-gradient-to-br text-white">
                      {userAvatarUrl ? (
                        <Image
                          src={userAvatarUrl}
                          alt={userName ?? "الحساب"}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-lg font-black">
                          {userInitial}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 text-right">
                      <p className="truncate text-base font-black text-slate-900">
                        {userName ?? "حسابي"}
                      </p>
                      <p className="truncate text-sm text-slate-500">
                        {userEmail ?? ""}
                      </p>
                    </div>
                  </div>

                  <div className="p-2">
                    <Link
                      href={dashboardHref!}
                      onClick={() => setAccountMenuOpen(false)}
                      className="hover:bg-primary-50/80 hover:text-primary-700 flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition-colors"
                    >
                      <span>لوحتي</span>
                      <span className="text-slate-400">←</span>
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setAccountMenuOpen(false)}
                      className="hover:bg-primary-50/80 hover:text-primary-700 flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition-colors"
                    >
                      <span>تعديل الملف الشخصي</span>
                      <span className="text-slate-400">←</span>
                    </Link>
                    <form action={signOutAction} className="mt-1">
                      <button
                        type="submit"
                        className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                      >
                        <span>تسجيل الخروج</span>
                        <span className="text-red-400">←</span>
                      </button>
                    </form>
                  </div>
                </div>
              ) : null}
            </div>
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
              className="group text-foreground/75 hover:text-primary-700 relative overflow-hidden rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 ease-out hover:-translate-x-1 hover:shadow-[0_10px_24px_rgb(22_138_117/0.08)]"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <span className="bg-primary-50/80 absolute inset-0 origin-right scale-x-0 rounded-xl opacity-0 transition-all duration-300 ease-out group-hover:scale-x-100 group-hover:opacity-100" />
              <span className="relative flex items-center gap-2">
                <span className="bg-primary-500 h-1.5 w-1.5 scale-0 rounded-full opacity-0 transition-all duration-300 ease-out group-hover:scale-100 group-hover:opacity-100" />
                {link.label}
              </span>
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
