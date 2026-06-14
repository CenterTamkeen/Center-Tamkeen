import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type CourseRow = Database["public"]["Tables"]["courses"]["Row"];
type TeacherRow = Database["public"]["Tables"]["teachers"]["Row"];
type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];
type LessonRow = Database["public"]["Tables"]["lessons"]["Row"];

export type TeacherSummary = Pick<
  TeacherRow,
  "id" | "slug" | "bio" | "subject" | "avatar_url" | "is_active"
> & {
  profile: {
    full_name: string;
    avatar_url: string | null;
  } | null;
};

export type CourseSummary = Pick<
  CourseRow,
  | "id"
  | "teacher_id"
  | "title"
  | "description"
  | "price"
  | "thumbnail_url"
  | "is_published"
  | "created_at"
> & {
  teacher: {
    slug: string;
    subject: string;
    is_active: boolean;
    profile: {
      full_name: string;
    } | null;
  } | null;
};

export type CourseDetails = CourseSummary & {
  lessons: Pick<
    LessonRow,
    "id" | "title" | "order_index" | "duration" | "is_free_preview"
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
  sort?: "price_asc" | "price_desc" | "newest";
};

type CoursePageOptions = CourseFilters & {
  page?: number;
  pageSize?: number;
};

function logStorefrontError(label: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[storefront:${label}]`, error);
  }
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

export async function getFeaturedTeachers(limit = 6) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teachers")
    .select(
      "id, slug, bio, subject, avatar_url, is_active, profile:profiles(full_name, avatar_url)",
    )
    .eq("is_active", true)
    .limit(limit);

  if (error) {
    logStorefrontError("featured-teachers", error.message);
    return [];
  }

  return (data ?? []) as TeacherSummary[];
}

export async function getTeacherBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teachers")
    .select(
      "id, slug, bio, subject, avatar_url, is_active, profile:profiles(full_name, avatar_url)",
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    logStorefrontError("teacher-by-slug", error.message);
    return null;
  }

  return data as TeacherSummary | null;
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
      "id, teacher_id, title, description, price, thumbnail_url, is_published, created_at, teacher:teachers!inner(slug, subject, is_active, profile:profiles(full_name))",
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

  return (data ?? []) as CourseSummary[];
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
      "id, teacher_id, title, description, price, thumbnail_url, is_published, created_at, teacher:teachers!inner(slug, subject, is_active, profile:profiles(full_name))",
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

  return {
    courses: (data ?? []) as CourseSummary[],
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    page,
  };
}

export async function getCoursesByTeacher(teacherId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select(
      "id, teacher_id, title, description, price, thumbnail_url, is_published, created_at, teacher:teachers!inner(slug, subject, is_active, profile:profiles(full_name))",
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

export async function getCourseById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select(
      "id, teacher_id, title, description, price, thumbnail_url, is_published, created_at, teacher:teachers!inner(slug, subject, is_active, profile:profiles(full_name)), lessons(id, title, order_index, duration, is_free_preview), reviews(id, rating, comment, created_at, student:students(profile:profiles(full_name)))",
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
