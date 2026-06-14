import Link from "next/link";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="relative mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center overflow-hidden px-4 py-16 text-center sm:px-6">
        {/* Decorative shapes */}
        <div
          className="deco-circle animate-float-soft"
          style={{
            width: 300,
            height: 300,
            top: -50,
            right: -100,
            background: "rgb(22 138 117 / 0.05)",
          }}
        />
        <div
          className="deco-circle"
          style={{
            width: 200,
            height: 200,
            bottom: -30,
            left: -60,
            background: "rgb(245 197 24 / 0.05)",
          }}
        />

        {/* Animated 404 */}
        <div className="animate-scale-up relative mb-6">
          <span className="text-gradient-animated text-8xl font-black sm:text-9xl">
            ٤٠٤
          </span>
        </div>

        <h1
          className="animate-fade-up heading-gradient text-3xl font-black sm:text-4xl"
          style={{ animationDelay: "0.1s" }}
        >
          الصفحة غير موجودة
        </h1>
        <p
          className="animate-fade-up text-foreground/65 mt-4 max-w-md leading-8"
          style={{ animationDelay: "0.2s" }}
        >
          الرابط غير صحيح أو المحتوى لم يعد متاحًا. تقدر ترجع للرئيسية أو تستكشف
          الكورسات المنشورة.
        </p>
        <div
          className="animate-fade-up mt-8 flex flex-wrap justify-center gap-3"
          style={{ animationDelay: "0.3s" }}
        >
          <Link href="/" className="btn-primary gap-2 px-6 py-3">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            الرئيسية
          </Link>
          <Link href="/courses" className="btn-secondary gap-2 px-6 py-3">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            الكورسات
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
