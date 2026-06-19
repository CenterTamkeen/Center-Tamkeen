import { notFound, redirect } from "next/navigation";

import {
  CourseDetailsPage,
  generateCourseMetadata,
} from "@/components/storefront/course-details-page";
import { getCourseById } from "@/lib/storefront/data";
import { buildCourseHref } from "@/lib/storefront/links";

type CoursePageProps = {
  params: Promise<{
    segments: string[];
  }>;
};

export const dynamic = "force-dynamic";

function readCourseRoute(segments: string[]) {
  if (segments.length === 1) {
    return {
      id: segments[0],
      teacherSlug: undefined,
      isLegacy: true,
    };
  }

  if (segments.length === 2) {
    return {
      teacherSlug: segments[0],
      id: segments[1],
      isLegacy: false,
    };
  }

  return null;
}

export async function generateMetadata({ params }: CoursePageProps) {
  const { segments } = await params;
  const route = readCourseRoute(segments);

  if (!route) {
    return {
      title: "الكورس غير موجود",
    };
  }

  return generateCourseMetadata(route.id);
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { segments } = await params;
  const route = readCourseRoute(segments);

  if (!route) {
    notFound();
  }

  if (route.isLegacy) {
    const course = await getCourseById(route.id);

    if (!course) {
      notFound();
    }

    if (course.teacher?.slug) {
      redirect(buildCourseHref(course));
    }
  }

  return <CourseDetailsPage id={route.id} teacherSlug={route.teacherSlug} />;
}
