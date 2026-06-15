import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import { BackToTop } from "@/components/site/back-to-top";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "منصة تمكين التعليمية",
    template: "%s | تمكين",
  },
  description:
    "منصة تمكين التعليمية لطلاب الثانوية العامة بالصعيد — كورسات ومحتوى تعليمي محمي من نخبة المدرسين.",
  metadataBase: new URL("https://center-tamkeen.com"),
};

export const viewport: Viewport = {
  themeColor: "#168A75",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="bg-background text-foreground flex min-h-full flex-col"
        suppressHydrationWarning
      >
        {children}
        <BackToTop />
      </body>
    </html>
  );
}
