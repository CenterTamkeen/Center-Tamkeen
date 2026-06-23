import type { Metadata } from "next";

import {
  StaticPageShell,
  StaticSection,
} from "@/components/site/static-page-shell";

export const metadata: Metadata = {
  title: "كيف يعمل الموقع",
  description:
    "اعرف خطوات استخدام منصة تمكين: إنشاء حساب طالب، اختيار الكورس، تفعيل الاشتراك بالكود، ومتابعة الدروس.",
  alternates: {
    canonical: "/how-it-works",
  },
};

export default function HowItWorksPage() {
  return (
    <StaticPageShell
      eyebrow="الخطوات"
      title="كيف يعمل تمكين"
      intro="تجربة تمكين مبنية على خطوات قليلة: إنشاء حساب، اختيار مدرس أو كورس، الحصول على كود التفعيل، ثم متابعة المحتوى من لوحة الطالب."
    >
      <StaticSection title="١. إنشاء حساب طالب">
        <p>
          املأ بياناتك الدراسية وبيانات التواصل عشان يظهر لك المحتوى المناسب.
        </p>
      </StaticSection>
      <StaticSection title="٢. اختيار الكورس">
        <p>
          تصفح الكورسات أو صفحات المدرسين، واقرأ تفاصيل الكورس قبل الاشتراك.
        </p>
      </StaticSection>
      <StaticSection title="٣. إدخال كود التفعيل">
        <p>
          بعد تأكيد الدفع مع فريق تمكين على واتساب، أدخل كود التفعيل من الناف
          بار أو داخل صفحة الكورس لفتح الوصول فورًا.
        </p>
      </StaticSection>
      <StaticSection title="٤. متابعة التعلم">
        <p>
          بعد التفعيل، ستجد كورساتك داخل لوحة الطالب وتقدر تتابع الدروس المتاحة.
        </p>
      </StaticSection>
    </StaticPageShell>
  );
}
