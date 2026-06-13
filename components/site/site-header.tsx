import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-border/80 bg-background/95 sticky top-0 z-30 border-b backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/Logo/tamkeen.png"
            alt="شعار تمكين"
            width={44}
            height={44}
            className="h-11 w-11 object-contain"
            priority
          />
          <span className="text-primary-700 text-xl font-bold">تمكين</span>
        </Link>

        <nav className="text-foreground/75 hidden items-center gap-6 text-sm font-semibold md:flex">
          <Link href="/courses" className="hover:text-primary-700 transition">
            الكورسات
          </Link>
          <Link href="/#teachers" className="hover:text-primary-700 transition">
            المدرسين
          </Link>
          <Link href="/#reviews" className="hover:text-primary-700 transition">
            التقييمات
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hover:bg-surface-muted rounded-md px-3 py-2 text-sm font-semibold transition"
          >
            دخول
          </Link>
          <Link
            href="/signup"
            className="bg-primary text-primary-foreground hover:bg-primary-600 rounded-md px-4 py-2 text-sm font-semibold transition"
          >
            حساب طالب
          </Link>
        </div>
      </div>
    </header>
  );
}
