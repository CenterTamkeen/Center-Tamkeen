import type { createAdminClient } from "@/lib/supabase/admin";
import { deleteBunnyStreamVideo } from "@/lib/bunny-stream";
import { deleteImageByUrl } from "@/lib/cloudinary";
import type { Database } from "@/types/database";

type AdminClient = ReturnType<typeof createAdminClient>;
type CourseRow = Pick<
  Database["public"]["Tables"]["courses"]["Row"],
  "id" | "teacher_id" | "title" | "thumbnail_url"
> & {
  teacher: {
    profile_id: string;
  } | null;
};
type LessonRow = Pick<
  Database["public"]["Tables"]["lessons"]["Row"],
  "bunny_video_id"
>;
type OrderItemRow = Pick<
  Database["public"]["Tables"]["order_items"]["Row"],
  "order_id" | "price_at_purchase"
>;
type RemainingOrderItemRow = OrderItemRow & {
  course: {
    teacher_id: string;
  } | null;
};

export type DeleteCourseResult =
  | {
      ok: true;
      course: CourseRow;
    }
  | {
      ok: false;
      message: string;
    };

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean))) as string[];
}

function isMissingNotificationCourseId(error: {
  code?: string;
  message?: string;
}) {
  return (
    error.code === "PGRST204" ||
    error.message?.includes("course_id") ||
    error.message?.includes("schema cache") ||
    error.message?.includes("Could not find")
  );
}

async function deleteCourseAssets(course: CourseRow, lessons: LessonRow[]) {
  await Promise.all([
    deleteImageByUrl(course.thumbnail_url),
    ...uniqueStrings(lessons.map((lesson) => lesson.bunny_video_id)).map(
      async (videoId) => {
        try {
          await deleteBunnyStreamVideo(videoId);
        } catch (error) {
          console.error("Failed to delete course Bunny Stream video.", error);
        }
      },
    ),
  ]);
}

async function deleteCourseNotifications({
  admin,
  course,
  studentProfileIds,
}: {
  admin: AdminClient;
  course: CourseRow;
  studentProfileIds: string[];
}) {
  const courseIdDelete = await admin
    .from("notifications")
    .delete()
    .eq("course_id", course.id);

  if (
    courseIdDelete.error &&
    !isMissingNotificationCourseId(courseIdDelete.error)
  ) {
    console.error(
      "Failed to delete course notifications.",
      courseIdDelete.error,
    );
  }

  const hrefDelete = await admin
    .from("notifications")
    .delete()
    .eq("href", `/courses/${course.id}`);

  if (hrefDelete.error) {
    console.error(
      "Failed to delete course href notifications.",
      hrefDelete.error,
    );
  }

  const teacherProfileId = course.teacher?.profile_id;

  if (teacherProfileId) {
    const teacherNotificationsDelete = await admin
      .from("notifications")
      .delete()
      .eq("recipient_profile_id", teacherProfileId)
      .in("kind", ["new_enrollment", "course_publish"])
      .ilike("body", `%${course.title}%`);

    if (teacherNotificationsDelete.error) {
      console.error(
        "Failed to delete legacy teacher course notifications.",
        teacherNotificationsDelete.error,
      );
    }
  }

  if (studentProfileIds.length > 0) {
    const studentNotificationsDelete = await admin
      .from("notifications")
      .delete()
      .in("recipient_profile_id", studentProfileIds)
      .in("kind", ["enrollment_approved", "enrollment_activated"])
      .ilike("body", `%${course.title}%`);

    if (studentNotificationsDelete.error) {
      console.error(
        "Failed to delete legacy student course notifications.",
        studentNotificationsDelete.error,
      );
    }
  }
}

async function recalculateTeacherEarnings({
  admin,
  teacherId,
  orderIds,
}: {
  admin: AdminClient;
  teacherId: string;
  orderIds: string[];
}) {
  if (orderIds.length === 0) {
    return null;
  }

  const { data, error } = await admin
    .from("order_items")
    .select("order_id, price_at_purchase, course:courses!inner(teacher_id)")
    .in("order_id", orderIds)
    .eq("course.teacher_id", teacherId);

  if (error) {
    return error;
  }

  const totalsByOrder = new Map<string, number>();

  for (const item of (data ?? []) as RemainingOrderItemRow[]) {
    totalsByOrder.set(
      item.order_id,
      (totalsByOrder.get(item.order_id) ?? 0) + item.price_at_purchase,
    );
  }

  for (const orderId of orderIds) {
    const amount = totalsByOrder.get(orderId) ?? 0;
    const result =
      amount > 0
        ? await admin.from("teacher_earnings").upsert(
            {
              teacher_id: teacherId,
              order_id: orderId,
              amount,
            },
            { onConflict: "teacher_id,order_id" },
          )
        : await admin
            .from("teacher_earnings")
            .delete()
            .eq("teacher_id", teacherId)
            .eq("order_id", orderId);

    if (result.error) {
      return result.error;
    }
  }

  return null;
}

export async function deleteCourseAndRelatedData({
  admin,
  courseId,
  teacherId,
}: {
  admin: AdminClient;
  courseId: string;
  teacherId?: string;
}): Promise<DeleteCourseResult> {
  if (!courseId) {
    return { ok: false, message: "الكورس غير صحيح." };
  }

  let courseQuery = admin
    .from("courses")
    .select(
      "id, teacher_id, title, thumbnail_url, teacher:teachers(profile_id)",
    )
    .eq("id", courseId);

  if (teacherId) {
    courseQuery = courseQuery.eq("teacher_id", teacherId);
  }

  const { data: courseData, error: courseError } =
    await courseQuery.maybeSingle();
  const course = courseData as CourseRow | null;

  if (courseError || !course) {
    if (courseError) {
      console.error("Failed to load course before deletion.", courseError);
    }

    return { ok: false, message: "الكورس غير موجود أو لا يمكن حذفه." };
  }

  const [lessonsQuery, enrollmentsQuery, orderItemsQuery] = await Promise.all([
    admin.from("lessons").select("bunny_video_id").eq("course_id", course.id),
    admin
      .from("enrollments")
      .select("student:students(profile_id)")
      .eq("course_id", course.id),
    admin
      .from("order_items")
      .select("order_id, price_at_purchase")
      .eq("course_id", course.id),
  ]);

  if (orderItemsQuery.error) {
    console.error("Failed to load course order items.", orderItemsQuery.error);
    return { ok: false, message: "تعذر تحميل طلبات الكورس قبل الحذف." };
  }

  const lessons = lessonsQuery.error
    ? []
    : ((lessonsQuery.data ?? []) as LessonRow[]);

  if (lessonsQuery.error) {
    console.error(
      "Failed to load course lessons before deletion.",
      lessonsQuery.error,
    );
  }

  const studentProfileIds = enrollmentsQuery.error
    ? []
    : uniqueStrings(
        (enrollmentsQuery.data ?? []).map(
          (enrollment) => enrollment.student?.profile_id,
        ),
      );

  if (enrollmentsQuery.error) {
    console.error(
      "Failed to load course enrollment profiles before deletion.",
      enrollmentsQuery.error,
    );
  }

  const orderItems = (orderItemsQuery.data ?? []) as OrderItemRow[];
  const affectedOrderIds = uniqueStrings(
    orderItems.map((item) => item.order_id),
  );

  await deleteCourseNotifications({
    admin,
    course,
    studentProfileIds,
  });

  const { error: deleteOrderItemsError } = await admin
    .from("order_items")
    .delete()
    .eq("course_id", course.id);

  if (deleteOrderItemsError) {
    console.error(
      "Failed to delete course order items.",
      deleteOrderItemsError,
    );
    return { ok: false, message: "تعذر حذف عناصر طلبات الكورس." };
  }

  const earningsError = await recalculateTeacherEarnings({
    admin,
    teacherId: course.teacher_id,
    orderIds: affectedOrderIds,
  });

  if (earningsError) {
    console.error("Failed to recalculate teacher earnings.", earningsError);
    return { ok: false, message: "تعذر تحديث أرباح المدرس بعد حذف الكورس." };
  }

  let deleteCourseQuery = admin.from("courses").delete().eq("id", course.id);

  if (teacherId) {
    deleteCourseQuery = deleteCourseQuery.eq("teacher_id", teacherId);
  }

  const { error: deleteCourseError } = await deleteCourseQuery;

  if (deleteCourseError) {
    console.error("Failed to delete course.", deleteCourseError);
    return { ok: false, message: "تعذر حذف الكورس." };
  }

  await deleteCourseAssets(course, lessons);

  return { ok: true, course };
}
