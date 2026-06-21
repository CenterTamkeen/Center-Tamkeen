"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";

import { signOutAction } from "@/lib/auth/actions";
import { markNotificationsAsRead } from "@/lib/notifications/actions";
import { ThemeToggle } from "@/components/site/theme-toggle";
import type { AppRole } from "@/lib/auth/roles";
import type { NotificationItem } from "@/lib/notifications/data";

type SiteHeaderClientProps = {
  userRole: AppRole | null;
  dashboardHref: string | null;
  userName: string | null;
  userEmail: string | null;
  userAvatarUrl: string | null;
  notifications: NotificationItem[];
};

function formatNotificationDate(value: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

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
  notifications,
}: SiteHeaderClientProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [markedRead, setMarkedRead] = useState(false);
  const [isPending, startTransition] = useTransition();
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const isLoggedIn = Boolean(userRole && dashboardHref);
  const userInitial = userName?.trim().charAt(0) || "U";
  const serverUnread = notifications.filter((item) => !item.read_at).length;
  const unreadCount = markedRead ? 0 : serverUnread;

  function markUnreadNotifications() {
    if (serverUnread <= 0 || markedRead) {
      return;
    }

    setMarkedRead(true);
    startTransition(() => {
      markNotificationsAsRead();
    });
  }

  function toggleNotifications() {
    const willOpen = !notificationsOpen;

    setNotificationsOpen(willOpen);

    if (willOpen) {
      markUnreadNotifications();
    }
  }

  useEffect(() => {
    if (!accountMenuOpen && !notificationsOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }

      if (!notificationsRef.current?.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
        setNotificationsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [accountMenuOpen, notificationsOpen]);

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
          ? "rgb(var(--header-surface-rgb) / 0.82)"
          : "rgb(var(--header-surface-rgb) / 0.55)",
        backdropFilter: `blur(${scrolled ? "24px" : "16px"}) saturate(180%)`,
        WebkitBackdropFilter: `blur(${scrolled ? "24px" : "16px"}) saturate(180%)`,
        borderBottom: `1px solid rgb(var(--header-border-rgb) / ${scrolled ? "0.6" : "0.3"})`,
      }}
    >
      <div className="container-page flex items-center justify-between gap-2 py-3 sm:gap-4">
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
            className="group-hover:text-primary-600 hidden text-xl font-black transition-colors duration-300 sm:inline"
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

        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          {isLoggedIn ? (
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                onClick={toggleNotifications}
                aria-expanded={notificationsOpen}
                aria-label="فتح الإشعارات"
                className="border-border/70 bg-surface/80 hover:bg-primary-50/70 dark:hover:bg-surface-muted/90 relative flex h-11 w-11 items-center justify-center rounded-full shadow-[0_10px_30px_rgb(13_37_31/0.08)] backdrop-blur transition-all duration-300"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 ? (
                  <span className="bg-danger ring-background absolute -top-1 -right-1 min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] leading-none font-black text-white ring-2">
                    {Math.min(unreadCount, 9).toLocaleString("ar-EG")}
                  </span>
                ) : null}
              </button>

              {notificationsOpen ? (
                <div className="border-border/70 bg-surface/95 absolute top-[calc(100%+0.75rem)] left-0 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl shadow-[0_20px_60px_rgb(15_23_42/0.18)] backdrop-blur-xl">
                  <div className="border-border/60 flex items-center justify-between border-b px-4 py-3">
                    <div>
                      <p className="text-sm font-black">الإشعارات</p>
                      <p className="text-foreground/55 text-xs font-semibold">
                        آخر تحديثات الحساب والكورسات
                      </p>
                    </div>
                    {serverUnread > 0 && !markedRead ? (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={markUnreadNotifications}
                        className="bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-full px-2.5 py-1 text-xs font-black transition-colors disabled:opacity-50"
                      >
                        تعليم الكل كمقروء
                      </button>
                    ) : null}
                  </div>

                  <div className="max-h-80 overflow-y-auto p-2">
                    {notifications.length > 0 ? (
                      notifications.map((item) => {
                        const content = (
                          <div className="hover:bg-primary-50/70 dark:hover:bg-surface-muted/85 rounded-xl px-3 py-3 transition-colors">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 text-right">
                                <p className="truncate text-sm font-black">
                                  {item.title}
                                </p>
                                <p className="text-foreground/60 mt-1 line-clamp-2 text-xs leading-5">
                                  {item.body}
                                </p>
                              </div>
                              {!item.read_at && !markedRead ? (
                                <span className="bg-primary-500 mt-1 h-2.5 w-2.5 shrink-0 rounded-full" />
                              ) : null}
                            </div>
                            <p className="text-foreground/45 mt-2 text-xs font-semibold">
                              {formatNotificationDate(item.created_at)}
                            </p>
                          </div>
                        );

                        return item.href ? (
                          <Link
                            key={item.id}
                            href={item.href}
                            onClick={() => setNotificationsOpen(false)}
                            className="block"
                          >
                            {content}
                          </Link>
                        ) : (
                          <div key={item.id}>{content}</div>
                        );
                      })
                    ) : (
                      <div className="px-4 py-8 text-center">
                        <p className="font-black">لا توجد إشعارات بعد</p>
                        <p className="text-foreground/60 mt-2 text-sm leading-6">
                          أي قبول اشتراك أو حصة جديدة هيظهر هنا.
                        </p>
                      </div>
                    )}
                  </div>

                  {dashboardHref ? (
                    <Link
                      href={dashboardHref}
                      onClick={() => setNotificationsOpen(false)}
                      className="border-border/60 hover:bg-primary-50/70 dark:hover:bg-surface-muted/90 text-primary-700 flex items-center justify-between border-t px-4 py-3 text-sm font-black"
                    >
                      <span>عرض اللوحة</span>
                      <span aria-hidden="true">←</span>
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
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
          background: "rgb(var(--header-surface-rgb) / 0.92)",
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
