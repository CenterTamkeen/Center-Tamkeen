import Link from "next/link";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        <p className="chip">٤٠٤</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">
          الصفحة غير موجودة
        </h1>
        <p className="text-foreground/70 mt-4 leading-8">
          الرابط غير صحيح أو المحتوى لم يعد متاحًا. تقدر ترجع للرئيسية أو تستكشف
          الكورسات المنشورة.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary px-5 py-2.5">
            الرئيسية
          </Link>
          <Link href="/courses" className="btn-secondary px-5 py-2.5">
            الكورسات
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
