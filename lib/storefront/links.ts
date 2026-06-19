type CourseLinkInput = {
  id: string;
  teacher: {
    slug: string | null;
  } | null;
};

export function buildCourseHref(course: CourseLinkInput, hash?: string) {
  const teacherSlug = course.teacher?.slug;
  const path = teacherSlug
    ? `/courses/${teacherSlug}/${course.id}`
    : `/courses/${course.id}`;

  return hash ? `${path}#${hash}` : path;
}
