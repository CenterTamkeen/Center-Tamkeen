"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global:error-boundary]", error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body>
        <main style={{ padding: 32, fontFamily: "sans-serif" }}>
          <h1>حصل خطأ في التطبيق</h1>
          <p>جرّب إعادة المحاولة، ولو المشكلة مستمرة تواصل مع الدعم.</p>
          <button type="button" onClick={reset}>
            إعادة المحاولة
          </button>
        </main>
      </body>
    </html>
  );
}
