"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { signOutAction } from "@/lib/auth/actions";
import type { AppRole } from "@/lib/auth/roles";

type DashboardAccountMenuProps = {
  userRole: AppRole | null;
  dashboardHref: string | null;
  userName: string | null;
  userEmail: string | null;
  userAvatarUrl: string | null;
};

type MenuLinkProps = {
  href: string;
  label: string;
  children?: ReactNode;
  onClick: () => void;
};

const roleLabels: Record<AppRole, string> = {
  student: "طالب",
  teacher: "مدرس",
  admin: "إدارة",
};

function MenuLink({ href, label, children, onClick }: MenuLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group hover:text-primary-700 relative flex items-center justify-between overflow-hidden rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition-all duration-300 ease-out hover:-translate-x-0.5 hover:shadow-[0_10px_24px_rgb(22_138_117/0.08)]"
    >
      <span className="bg-primary-50/80 absolute inset-0 origin-right scale-x-0 rounded-2xl opacity-0 transition-all duration-300 ease-out group-hover:scale-x-100 group-hover:opacity-100" />
      <span className="relative flex items-center gap-2">
        <span className="bg-primary-500 h-1.5 w-1.5 scale-0 rounded-full opacity-0 transition-all duration-300 ease-out group-hover:scale-100 group-hover:opacity-100" />
        {label}
      </span>
      <span className="group-hover:text-primary-500 relative text-slate-400 transition-all duration-300 ease-out group-hover:-translate-x-0.5">
        {children ?? "←"}
      </span>
    </Link>
  );
}

export function DashboardAccountMenu({
  userRole,
  dashboardHref,
  userName,
  userEmail,
  userAvatarUrl,
}: DashboardAccountMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const userInitial = userName?.trim().charAt(0) || "U";
  const roleLabel = userRole ? roleLabels[userRole] : "الحساب";

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label="فتح قائمة الحساب"
        className="hover:bg-primary-50/80 flex min-w-0 items-center gap-2 rounded-full border border-white/70 bg-white/85 py-1.5 pr-1.5 pl-2 shadow-[0_10px_30px_rgb(13_37_31/0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgb(13_37_31/0.1)] sm:gap-3 sm:pl-3"
      >
        <span className="from-primary-500 to-primary-700 relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gradient-to-br text-white ring-2 ring-white sm:h-11 sm:w-11">
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
        </span>
        <span className="hidden min-w-0 text-right sm:block">
          <span className="block max-w-36 truncate text-sm font-black text-slate-900">
            {userName ?? "حسابي"}
          </span>
          <span className="block max-w-36 truncate text-xs text-slate-500">
            {roleLabel}
          </span>
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-primary-700 shrink-0 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div className="absolute top-[calc(100%+0.75rem)] left-0 z-50 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 shadow-[0_20px_60px_rgb(15_23_42/0.16)] backdrop-blur-xl">
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4">
            <div className="from-primary-500 to-primary-700 relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-gradient-to-br text-white">
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
                {userEmail ?? roleLabel}
              </p>
            </div>
          </div>

          <div className="p-2">
            <MenuLink
              href="/"
              label="الرئيسية"
              onClick={() => setOpen(false)}
            />
            {dashboardHref ? (
              <MenuLink
                href={dashboardHref}
                label="لوحتي"
                onClick={() => setOpen(false)}
              />
            ) : null}
            <MenuLink
              href="/profile"
              label="تعديل الملف الشخصي"
              onClick={() => setOpen(false)}
            />
            <form action={signOutAction} className="mt-1">
              <button
                type="submit"
                className="group relative flex w-full items-center justify-between overflow-hidden rounded-2xl px-4 py-3 text-sm font-semibold text-red-600 transition-all duration-300 ease-out hover:-translate-x-0.5 hover:shadow-[0_10px_24px_rgb(220_38_38/0.08)]"
              >
                <span className="absolute inset-0 origin-right scale-x-0 rounded-2xl bg-red-50 opacity-0 transition-all duration-300 ease-out group-hover:scale-x-100 group-hover:opacity-100" />
                <span className="relative flex items-center gap-2">
                  <span className="h-1.5 w-1.5 scale-0 rounded-full bg-red-500 opacity-0 transition-all duration-300 ease-out group-hover:scale-100 group-hover:opacity-100" />
                  تسجيل الخروج
                </span>
                <span className="relative text-red-400 transition-all duration-300 ease-out group-hover:-translate-x-0.5 group-hover:text-red-500">
                  ←
                </span>
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
