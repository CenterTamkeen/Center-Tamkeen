import type { MetadataRoute } from "next";

import { siteDescription, siteName } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "منصة تمكين التعليمية",
    short_name: siteName,
    description: siteDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#168A75",
    dir: "rtl",
    lang: "ar-EG",
    icons: [
      {
        src: "/Icon/tamkeen-transparent.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
      {
        src: "/Logo/tamkeen-transparent.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
