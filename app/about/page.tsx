import type { Metadata } from "next";

import {
  StaticPageShell,
  StaticSection,
} from "@/components/site/static-page-shell";

export const metadata: Metadata = {
  title: "عن منصة تمكين",
  description:
    "تعرف على منصة تمكين التعليمية ومبادرة تمكين لدعم طلاب الثانوية العامة بتجربة تعلم أونلاين منظمة وآمنة.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <StaticPageShell
      eyebrow="من نحن"
      title="تمكين منصة تعليمية للصعيد"
      intro="تمكين بتساعد الطالب يلاقي المدرس المناسب، يشتري الكورس بسهولة، ويتابع محتواه في مكان واحد منظم وآمن."
    >
      <StaticSection title="الرؤية">
        <p>
          نوصل تعليم أونلاين منظم وعادل لطلاب الثانوية العامة، خصوصا الطلاب خارج
          المدن الكبيرة، مع تجربة واضحة للطالب والمدرس وولي الأمر.
        </p>
      </StaticSection>
      <StaticSection title="الرسالة">
        <p>
          نبني منصة تجمع المدرسين الجادين والطلاب في نظام شراء ومتابعة ودعم
          بسيط، وتقلل الفوضى في إدارة الكورسات والاشتراكات.
        </p>
      </StaticSection>
      <StaticSection title="قصة المؤسس">
        <p>
          بدأت الفكرة من احتياج حقيقي: مدرسين عندهم محتوى قوي لكن إدارة
          الاشتراكات صعبة، وطلاب محتاجين طريقة موثوقة للوصول للحصة والكورس.
          تمكين اتبنت عشان تجعل العلاقة أوضح وأسهل للطرفين.
        </p>
      </StaticSection>
      <StaticSection title="الفريق">
        <p>
          فريق تمكين يجمع بين خبرة تعليمية وتشغيلية وتقنية. بنركز على جودة
          المحتوى، سرعة الدعم، وحماية تجربة التعلم من التعقيد.
        </p>
      </StaticSection>
    </StaticPageShell>
  );
}
