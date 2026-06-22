import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/seo";
import { getCourses, getFeaturedTeachers } from "@/lib/storefront/data";
import { buildCourseHref } from "@/lib/storefront/links";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/courses",
    "/teachers",
    "/about",
    "/how-it-works",
    "/faq",
    "/contact",
    "/privacy",
    "/terms",
  ].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.8,
  }));

  const [teachers, courses] = await Promise.all([
    getFeaturedTeachers(1000),
    getCourses({}, 1000),
  ]);

  const teacherRoutes: MetadataRoute.Sitemap = teachers.map((teacher) => ({
    url: `${siteUrl}/teachers/${teacher.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const courseRoutes: MetadataRoute.Sitemap = courses.map((course) => ({
    url: `${siteUrl}${buildCourseHref(course)}`,
    lastModified: course.created_at ? new Date(course.created_at) : now,
    changeFrequency: "weekly",
    priority: 0.75,
  }));

  return [...staticRoutes, ...teacherRoutes, ...courseRoutes];
}
