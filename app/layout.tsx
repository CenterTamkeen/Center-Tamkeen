import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import { BackToTop } from "@/components/site/back-to-top";
import {
  absoluteUrl,
  seoKeywords,
  siteDescription,
  siteName,
  siteTitle,
  siteUrl,
} from "@/lib/seo";
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
    default: `${siteTitle} | مبادرة تمكين`,
    template: "%s | تمكين",
  },
  description: siteDescription,
  keywords: seoKeywords,
  applicationName: siteName,
  authors: [{ name: siteName, url: siteUrl }],
  creator: siteName,
  publisher: siteName,
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? {
        google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
      }
    : undefined,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "ar_EG",
    url: siteUrl,
    siteName,
    title: `${siteTitle} | مبادرة تمكين`,
    description: siteDescription,
    images: [
      {
        url: absoluteUrl("/Logo/tamkeen-transparent.png"),
        width: 1200,
        height: 630,
        alt: siteTitle,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteTitle} | مبادرة تمكين`,
    description: siteDescription,
    images: [absoluteUrl("/Logo/tamkeen-transparent.png")],
  },
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/Icon/tamkeen-transparent.ico" }],
    shortcut: "/Icon/tamkeen-transparent.ico",
    apple: "/Logo/tamkeen-transparent.png",
  },
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
