import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-border bg-surface border-t">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Image
              src="/Logo/tamkeen.png"
              alt="شعار تمكين"
              width={44}
              height={44}
              className="h-10 w-10 object-contain"
            />
            <span className="text-primary-700 text-xl font-bold">تمكين</span>
          </div>
          <p className="text-foreground/70 max-w-md leading-7">
            منصة تعليمية عربية لطلاب الثانوية العامة، بتجمع المدرسين والكورسات
            والاشتراكات في مكان واحد.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="font-bold">روابط سريعة</h2>
          <nav className="text-foreground/70 flex flex-col gap-2 text-sm">
            <Link href="/courses" className="hover:text-primary-700">
              تصفح الكورسات
            </Link>
            <Link href="/signup" className="hover:text-primary-700">
              تسجيل طالب
            </Link>
            <Link href="/login" className="hover:text-primary-700">
              تسجيل الدخول
            </Link>
          </nav>
        </div>

        <div className="space-y-3">
          <h2 className="font-bold">الدعم</h2>
          <p className="text-foreground/70 text-sm leading-7">
            تابع لوحة الطالب لمعرفة الطلبات والكورسات بعد تفعيل الدفع في المراحل
            القادمة.
          </p>
        </div>
      </div>
    </footer>
  );
}
