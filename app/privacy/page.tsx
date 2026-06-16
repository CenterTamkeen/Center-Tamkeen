import type { Metadata } from "next";

import {
  StaticPageShell,
  StaticSection,
} from "@/components/site/static-page-shell";

export const metadata: Metadata = {
  title: "سياسة الخصوصية",
};

export default function PrivacyPage() {
  return (
    <StaticPageShell
      eyebrow="الخصوصية"
      title="سياسة الخصوصية"
      intro="بنحترم بيانات الطلاب والمدرسين، وبنستخدمها فقط لتشغيل الحسابات والكورسات والطلبات داخل المنصة."
    >
      <StaticSection title="البيانات التي نجمعها">
        <p>
          الاسم، رقم الهاتف، البريد الإلكتروني، بيانات المرحلة الدراسية،
          والبيانات اللازمة لتنفيذ الطلبات والاشتراكات.
        </p>
      </StaticSection>
      <StaticSection title="استخدام البيانات">
        <p>
          نستخدم البيانات لتسجيل الدخول، تفعيل الكورسات، متابعة الطلبات، تحسين
          الخدمة، والتواصل بخصوص الدعم أو التحديثات المهمة.
        </p>
      </StaticSection>
      <StaticSection title="حماية البيانات">
        <p>
          الوصول للبيانات مقيد حسب الدور داخل المنصة، ويتم تسجيل الأخطاء التقنية
          بغرض الإصلاح والمتابعة.
        </p>
      </StaticSection>
    </StaticPageShell>
  );
}
