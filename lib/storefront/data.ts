import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type CourseRow = Database["public"]["Tables"]["courses"]["Row"];
type TeacherRow = Database["public"]["Tables"]["teachers"]["Row"];
type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];
type LessonRow = Database["public"]["Tables"]["lessons"]["Row"];
type LessonProgressRow = Database["public"]["Tables"]["lesson_progress"]["Row"];
type StudentGrade = Database["public"]["Enums"]["student_grade"];
type StudentSection = Database["public"]["Enums"]["student_section"];

export type TeacherSummary = Pick<
  TeacherRow,
  | "id"
  | "profile_id"
  | "slug"
  | "bio"
  | "subject"
  | "avatar_url"
  | "cover_url"
  | "is_active"
> & {
  profile: {
    full_name: string;
    avatar_url: string | null;
  } | null;
  stats?: {
    publishedCourses: number;
    studentCount: number;
  };
};

export type TeacherPublicStats = {
  publishedCourses: number;
  studentCount: number;
  ratingAverage: number | null;
  reviewCount: number;
};

export type CourseSummary = Pick<
  CourseRow,
  | "id"
  | "teacher_id"
  | "subject"
  | "title"
  | "description"
  | "price"
  | "target_grade"
  | "target_section"
  | "thumbnail_url"
  | "is_published"
  | "created_at"
> & {
  teacher: {
    slug: string;
    subject: string;
    is_active: boolean;
    avatar_url: string | null;
    profile: {
      full_name: string;
    } | null;
  } | null;
  enrollments?: { id: string }[];
};

export type CourseDetails = CourseSummary & {
  lessons: Pick<
    LessonRow,
    | "id"
    | "title"
    | "order_index"
    | "duration"
    | "is_free_preview"
    | "bunny_video_id"
    | "thumbnail_url"
    | "video_provider"
  >[];
  reviews: (Pick<ReviewRow, "id" | "rating" | "comment" | "created_at"> & {
    student: {
      profile: {
        full_name: string;
      } | null;
    } | null;
  })[];
};

export type ReviewSummary = Pick<
  ReviewRow,
  "id" | "rating" | "comment" | "created_at"
> & {
  course: {
    title: string;
  } | null;
  student: {
    profile: {
      full_name: string;
    } | null;
  } | null;
};

type CourseFilters = {
  query?: string;
  teacher?: string;
  subject?: string;
  grade?: StudentGrade;
  section?: StudentSection;
  priceType?: "free" | "paid";
  minPrice?: number;
  maxPrice?: number;
  sort?: "price_asc" | "price_desc" | "newest" | "popular";
};

type TeacherFilters = {
  query?: string;
  subject?: string;
  sort?: "newest" | "name";
};

type CoursePageOptions = CourseFilters & {
  page?: number;
  pageSize?: number;
};

type TeacherPageOptions = TeacherFilters & {
  page?: number;
  pageSize?: number;
};

function logStorefrontError(label: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[storefront:${label}]`, error);
  }
}

function getAdminClient() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

function isMissingTable(
  error: { message?: string; code?: string },
  table: string,
) {
  return (
    error.code === "PGRST205" ||
    error.message?.includes(table) ||
    error.message?.includes("schema cache") ||
    error.message?.includes("Could not find")
  );
}

async function isCurrentStudentBlockedFromTeacher(teacherId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const admin = getAdminClient();

  if (!admin) {
    return false;
  }

  const { data: student } = await admin
    .from("students")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!student) {
    return false;
  }

  const { data, error } = await admin
    .from("student_blocks")
    .select("id")
    .eq("student_id", student.id)
    .or(`teacher_id.is.null,teacher_id.eq.${teacherId}`)
    .limit(1);

  if (error) {
    if (isMissingTable(error, "student_blocks")) {
      return false;
    }

    logStorefrontError("student-blocks", error.message);
    return false;
  }

  return (data ?? []).length > 0;
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDuration(seconds: number | null) {
  if (!seconds) {
    return "مدة غير محددة";
  }

  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes.toLocaleString("ar-EG")} دقيقة`;
}

function uniqueTeachers(teachers: TeacherSummary[]) {
  const seen = new Set<string>();

  return teachers.filter((teacher) => {
    const key = teacher.profile_id || teacher.id;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

async function attachTeacherSummaryStats(teachers: TeacherSummary[]) {
  if (teachers.length === 0) {
    return teachers;
  }

  const admin = getAdminClient();

  if (!admin) {
    return teachers.map((teacher) => ({
      ...teacher,
      stats: {
        publishedCourses: 0,
        studentCount: 0,
      },
    }));
  }

  const teacherIds = teachers.map((teacher) => teacher.id);
  const { data, error } = await admin
    .from("courses")
    .select("id, teacher_id, enrollments(student_id)")
    .in("teacher_id", teacherIds)
    .eq("is_published", true);

  if (error) {
    logStorefrontError("teacher-summary-stats", error.message);
    return teachers;
  }

  const statsByTeacher = new Map<
    string,
    { publishedCourses: number; studentIds: Set<string> }
  >();

  for (const course of data ?? []) {
    const stats = statsByTeacher.get(course.teacher_id) ?? {
      publishedCourses: 0,
      studentIds: new Set<string>(),
    };

    stats.publishedCourses += 1;

    for (const enrollment of course.enrollments ?? []) {
      if (enrollment.student_id) {
        stats.studentIds.add(enrollment.student_id);
      }
    }

    statsByTeacher.set(course.teacher_id, stats);
  }

  return teachers.map((teacher) => {
    const stats = statsByTeacher.get(teacher.id);

    return {
      ...teacher,
      stats: {
        publishedCourses: stats?.publishedCourses ?? 0,
        studentCount: stats?.studentIds.size ?? 0,
      },
    };
  });
}
export async function getFeaturedTeachers(limit = 6) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teachers")
    .select(
      "id, profile_id, slug, bio, subject, avatar_url, is_active, profile:profiles(full_name, avatar_url)",
    )
    .eq("is_active", true)
    .limit(limit * 2);

  if (error) {
    logStorefrontError("featured-teachers", error.message);
    return [];
  }

  return uniqueTeachers(
    (data ?? []).map((teacher) => ({
      ...teacher,
      cover_url: null,
    })) as TeacherSummary[],
  ).slice(0, limit);
}

export async function getTeacherBySlug(slug: string) {
  const supabase = await createClient();
  const withCover = await supabase
    .from("teachers")
    .select(
      "id, profile_id, slug, bio, subject, avatar_url, cover_url, is_active, profile:profiles(full_name, avatar_url)",
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!withCover.error) {
    return withCover.data as TeacherSummary | null;
  }

  const missingCoverColumn =
    withCover.error.message.includes("cover_url") &&
    withCover.error.message.includes("does not exist");

  if (!missingCoverColumn) {
    logStorefrontError("teacher-by-slug", withCover.error.message);
    return null;
  }

  const withoutCover = await supabase
    .from("teachers")
    .select(
      "id, profile_id, slug, bio, subject, avatar_url, is_active, profile:profiles(full_name, avatar_url)",
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (withoutCover.error) {
    logStorefrontError("teacher-by-slug-fallback", withoutCover.error.message);
    return null;
  }

  return withoutCover.data
    ? ({ ...withoutCover.data, cover_url: null } as TeacherSummary)
    : null;
}

export async function getTeacherSubjects() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teachers")
    .select("subject")
    .eq("is_active", true)
    .order("subject", { ascending: true });

  if (error) {
    logStorefrontError("teacher-subjects", error.message);
    return [];
  }

  return Array.from(
    new Set((data ?? []).map((teacher) => teacher.subject).filter(Boolean)),
  );
}

export async function getCourseSubjects() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select("subject, teacher:teachers!inner(subject, is_active)")
    .eq("is_published", true)
    .eq("teacher.is_active", true)
    .order("subject", { ascending: true });

  if (error) {
    logStorefrontError("course-subjects", error.message);
    return [];
  }

  return Array.from(
    new Set(
      (data ?? [])
        .map((course) => course.subject ?? course.teacher?.subject)
        .filter((subject): subject is string => Boolean(subject)),
    ),
  );
}

export async function getTeachersPage(options: TeacherPageOptions = {}) {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(24, Math.max(6, options.pageSize ?? 12));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const supabase = await createClient();
  let query = supabase
    .from("teachers")
    .select(
      "id, profile_id, slug, bio, subject, avatar_url, is_active, created_at, profile:profiles(full_name, avatar_url)",
      { count: "exact" },
    )
    .eq("is_active", true)
    .range(from, to);

  if (options.query) {
    const { data: matchingProfiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id")
      .ilike("full_name", `%${options.query}%`);
    const profileIds = (matchingProfiles ?? []).map((profile) => profile.id);

    if (profilesError) {
      logStorefrontError("teacher-profile-search", profilesError.message);
    }

    if (profileIds.length > 0) {
      query = query.or(
        `subject.ilike.%${options.query}%,profile_id.in.(${profileIds.join(",")})`,
      );
    } else {
      query = query.ilike("subject", `%${options.query}%`);
    }
  }

  if (options.subject) {
    query = query.eq("subject", options.subject);
  }

  if (options.sort === "name") {
    query = query.order("full_name", {
      ascending: true,
      referencedTable: "profiles",
    });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error, count } = await query;

  if (error) {
    logStorefrontError("teachers-page", error.message);
    return {
      teachers: [] as TeacherSummary[],
      totalCount: 0,
      totalPages: 1,
      page,
    };
  }

  const totalCount = count ?? 0;

  const teachers = await attachTeacherSummaryStats(
    uniqueTeachers(
      (data ?? []).map((teacher) => ({
        ...teacher,
        cover_url: null,
      })) as TeacherSummary[],
    ),
  );

  return {
    teachers,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    page,
  };
}

export async function getLatestCourses(limit = 6) {
  return getCourses(
    {
      sort: "newest",
    },
    limit,
  );
}

export async function getCourses(filters: CourseFilters = {}, limit = 24) {
  const supabase = await createClient();
  let query = supabase
    .from("courses")
    .select(
      "id, teacher_id, subject, title, description, price, target_grade, target_section, thumbnail_url, is_published, created_at, teacher:teachers!inner(slug, subject, is_active, avatar_url, profile:profiles(full_name)), enrollments(id)",
    )
    .eq("is_published", true)
    .eq("teacher.is_active", true)
    .limit(limit);

  if (filters.query) {
    query = query.ilike("title", `%${filters.query}%`);
  }

  if (filters.teacher) {
    query = query.eq("teacher_id", filters.teacher);
  }

  if (filters.subject) {
    query = query.eq("subject", filters.subject);
  }

  if (filters.grade) {
    query = query.eq("target_grade", filters.grade);
  }

  if (filters.section) {
    query = query.eq("target_section", filters.section);
  }

  if (filters.priceType === "free") {
    query = query.eq("price", 0);
  } else if (filters.priceType === "paid") {
    query = query.gt("price", 0);
  }

  if (typeof filters.minPrice === "number") {
    query = query.gte("price", filters.minPrice);
  }

  if (typeof filters.maxPrice === "number") {
    query = query.lte("price", filters.maxPrice);
  }

  if (filters.sort === "price_asc") {
    query = query.order("price", { ascending: true });
  } else if (filters.sort === "price_desc") {
    query = query.order("price", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    logStorefrontError("courses", error.message);
    return [];
  }

  const courses = (data ?? []) as CourseSummary[];

  if (filters.sort === "popular") {
    return courses.sort(
      (a, b) => (b.enrollments?.length ?? 0) - (a.enrollments?.length ?? 0),
    );
  }

  return courses;
}

export async function getCoursesPage(options: CoursePageOptions = {}) {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(24, Math.max(6, options.pageSize ?? 12));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const supabase = await createClient();
  let query = supabase
    .from("courses")
    .select(
      "id, teacher_id, subject, title, description, price, target_grade, target_section, thumbnail_url, is_published, created_at, teacher:teachers!inner(slug, subject, is_active, avatar_url, profile:profiles(full_name)), enrollments(id)",
      {
        count: "exact",
      },
    )
    .eq("is_published", true)
    .eq("teacher.is_active", true)
    .range(from, to);

  if (options.query) {
    query = query.ilike("title", `%${options.query}%`);
  }

  if (options.teacher) {
    query = query.eq("teacher_id", options.teacher);
  }

  if (options.subject) {
    query = query.eq("subject", options.subject);
  }

  if (options.grade) {
    query = query.eq("target_grade", options.grade);
  }

  if (options.section) {
    query = query.eq("target_section", options.section);
  }

  if (options.priceType === "free") {
    query = query.eq("price", 0);
  } else if (options.priceType === "paid") {
    query = query.gt("price", 0);
  }

  if (typeof options.minPrice === "number") {
    query = query.gte("price", options.minPrice);
  }

  if (typeof options.maxPrice === "number") {
    query = query.lte("price", options.maxPrice);
  }

  if (options.sort === "price_asc") {
    query = query.order("price", { ascending: true });
  } else if (options.sort === "price_desc") {
    query = query.order("price", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error, count } = await query;

  if (error) {
    logStorefrontError("courses-page", error.message);
    return {
      courses: [] as CourseSummary[],
      totalCount: 0,
      totalPages: 1,
      page,
    };
  }

  const totalCount = count ?? 0;

  const courses = (data ?? []) as CourseSummary[];

  return {
    courses:
      options.sort === "popular"
        ? courses.sort(
            (a, b) =>
              (b.enrollments?.length ?? 0) - (a.enrollments?.length ?? 0),
          )
        : courses,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    page,
  };
}

export async function getCurrentStudentEnrollmentCourseIds(
  courseIds?: string[],
) {
  if (courseIds && courseIds.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const admin = getAdminClient();

  if (!admin) {
    return [];
  }

  const { data: student, error: studentError } = await admin
    .from("students")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (studentError) {
    logStorefrontError("current-student", studentError.message);
    return [];
  }

  if (!student) {
    return [];
  }

  let query = admin
    .from("enrollments")
    .select("course_id")
    .eq("student_id", student.id);

  if (courseIds) {
    query = query.in("course_id", courseIds);
  }

  const { data, error } = await query;

  if (error) {
    logStorefrontError("current-student-enrollments", error.message);
    return [];
  }

  return (data ?? []).map((enrollment) => enrollment.course_id);
}

export async function getCurrentStudentCourseProgress(courseId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      studentId: null,
      progress: [] as LessonProgressRow[],
    };
  }

  const admin = getAdminClient();

  if (!admin) {
    return {
      studentId: null,
      progress: [] as LessonProgressRow[],
    };
  }

  const { data: student, error: studentError } = await admin
    .from("students")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (studentError) {
    logStorefrontError("current-student-progress", studentError.message);
    return {
      studentId: null,
      progress: [] as LessonProgressRow[],
    };
  }

  if (!student) {
    return {
      studentId: null,
      progress: [] as LessonProgressRow[],
    };
  }

  const { data, error } = await admin
    .from("lesson_progress")
    .select("*")
    .eq("student_id", student.id)
    .eq("course_id", courseId);

  if (error) {
    if (!isMissingTable(error, "lesson_progress")) {
      logStorefrontError("lesson-progress", error.message);
    }

    return {
      studentId: student.id,
      progress: [] as LessonProgressRow[],
    };
  }

  return {
    studentId: student.id,
    progress: (data ?? []) as LessonProgressRow[],
  };
}
export async function getCoursesByTeacher(teacherId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select(
      "id, teacher_id, subject, title, description, price, target_grade, target_section, thumbnail_url, is_published, created_at, teacher:teachers!inner(slug, subject, is_active, avatar_url, profile:profiles(full_name)), enrollments(id)",
    )
    .eq("teacher_id", teacherId)
    .eq("is_published", true)
    .eq("teacher.is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    logStorefrontError("teacher-courses", error.message);
    return [];
  }

  return (data ?? []) as CourseSummary[];
}

export async function getTeacherPublicStats(
  teacherId: string,
): Promise<TeacherPublicStats> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select("id, enrollments(student_id), reviews(rating)")
    .eq("teacher_id", teacherId)
    .eq("is_published", true);

  if (error) {
    logStorefrontError("teacher-public-stats", error.message);
    return {
      publishedCourses: 0,
      studentCount: 0,
      ratingAverage: null,
      reviewCount: 0,
    };
  }

  const courses = data ?? [];
  const studentIds = new Set<string>();
  const ratings: number[] = [];

  for (const course of courses) {
    for (const enrollment of course.enrollments ?? []) {
      studentIds.add(enrollment.student_id);
    }

    for (const review of course.reviews ?? []) {
      ratings.push(review.rating);
    }
  }

  return {
    publishedCourses: courses.length,
    studentCount: studentIds.size,
    ratingAverage:
      ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        : null,
    reviewCount: ratings.length,
  };
}

export async function getCourseById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select(
      "id, teacher_id, subject, title, description, price, target_grade, target_section, thumbnail_url, is_published, created_at, teacher:teachers!inner(slug, subject, is_active, avatar_url, profile:profiles(full_name)), enrollments(id), lessons(id, title, order_index, duration, is_free_preview, bunny_video_id, thumbnail_url, video_provider), reviews(id, rating, comment, created_at, student:students(profile:profiles(full_name)))",
    )
    .eq("id", id)
    .eq("is_published", true)
    .eq("teacher.is_active", true)
    .order("order_index", {
      referencedTable: "lessons",
      ascending: true,
    })
    .maybeSingle();

  if (error) {
    logStorefrontError("course-by-id", error.message);
    return null;
  }

  if (
    data?.teacher_id &&
    (await isCurrentStudentBlockedFromTeacher(data.teacher_id))
  ) {
    return null;
  }

  return data as CourseDetails | null;
}

export async function getLatestReviews(limit = 6) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(
      "id, rating, comment, created_at, course:courses(title), student:students(profile:profiles(full_name))",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logStorefrontError("reviews", error.message);
    return [];
  }

  return (data ?? []) as ReviewSummary[];
}
