"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app:error-boundary]", error);
  }, [error]);

  return (
    <main className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <section className="glass-panel-strong max-w-2xl rounded-xl p-6 text-center">
        <p className="eyebrow">خطأ غير متوقع</p>
        <h1 className="mt-3 text-3xl font-black">
          حصلت مشكلة أثناء فتح الصفحة
        </h1>
        <p className="text-foreground/65 mx-auto mt-4 max-w-lg leading-8">
          جرّب إعادة تحميل الجزء الحالي. لو المشكلة اتكررت، سجّل وقت حدوثها
          وابعتها للدعم الفني.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="btn-primary">
            إعادة المحاولة
          </button>
          <Link href="/" className="btn-secondary">
            الرئيسية
          </Link>
        </div>
      </section>
    </main>
  );
}
