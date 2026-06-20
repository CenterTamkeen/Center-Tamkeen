import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import { BackToTop } from "@/components/site/back-to-top";
import "./globals.css";

const themeInitScript = `
(() => {
  try {
    const storedTheme = localStorage.getItem("tamkeen-theme");
    const theme = storedTheme || "light";
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  } catch {
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
  }
})();
`;

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
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {children}
        <BackToTop />
      </body>
    </html>
  );
}
