"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard:error-boundary]", error);
  }, [error]);

  return (
    <section className="glass-panel-strong rounded-xl p-6 text-center">
      <p className="eyebrow">لوحة التحكم</p>
      <h2 className="mt-2 text-2xl font-black">تعذر تحميل بيانات اللوحة</h2>
      <p className="text-foreground/65 mx-auto mt-3 max-w-lg leading-8">
        فيه طلب بيانات لم يكتمل. جرّب مرة أخرى، ولو استمرت المشكلة راجع اتصال
        Supabase أو الصلاحيات.
      </p>
      <button type="button" onClick={reset} className="btn-primary mt-5">
        إعادة التحميل
      </button>
    </section>
  );
}
