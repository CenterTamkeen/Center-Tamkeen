import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/roles";
import { deleteTeacherReviewAction } from "@/lib/teacher/actions";
import { getCurrentTeacher, getTeacherReviews } from "@/lib/teacher/data";

export const metadata: Metadata = {
  title: "تقييمات الكورسات",
};

export default async function TeacherReviewsPage() {
  const { profile } = await requireRole("teacher", "/dashboard/teacher");
  const teacher = await getCurrentTeacher(profile.id);

  if (!teacher) {
    notFound();
  }

  const reviews = await getTeacherReviews(teacher.id);

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">التقييمات</p>
        <h2 className="text-xl font-black">تقييمات كورساتك</h2>
        <p className="text-foreground/60 mt-2 text-sm leading-7">
          تقدر تحذف أي تقييم مكتوب على كورس من كورساتك.
        </p>
      </div>

      <div className="grid gap-4">
        {reviews.map((review) => {
          const studentName =
            review.student?.profile?.full_name ?? "طالب غير معروف";
          const avatarUrl =
            review.student?.photo_url ?? review.student?.profile?.avatar_url;

          return (
            <article key={review.id} className="card-modern p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="border-primary-100 bg-primary-50 text-primary-700 relative h-11 w-11 shrink-0 overflow-hidden rounded-full border text-sm font-black">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt={studentName}
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center">
                          {studentName.trim().charAt(0) || "ط"}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-black">{studentName}</h3>
                        <span className="chip">{review.rating} / 5</span>
                      </div>
                      <p className="text-foreground/55 mt-1 text-sm">
                        {review.course?.title ?? "كورس غير معروف"} ·{" "}
                        {new Date(review.created_at).toLocaleDateString(
                          "ar-EG",
                        )}
                      </p>
                    </div>
                  </div>
                  <p className="text-foreground/70 mt-3 leading-8">
                    {review.comment || "لا يوجد تعليق نصي."}
                  </p>
                </div>
                <form action={deleteTeacherReviewAction}>
                  <input type="hidden" name="reviewId" value={review.id} />
                  <button className="btn-secondary px-3 py-2 text-xs text-red-700">
                    حذف التقييم
                  </button>
                </form>
              </div>
            </article>
          );
        })}
        {reviews.length === 0 ? (
          <div className="glass-panel text-foreground/60 rounded-xl px-5 py-12 text-center">
            لا توجد تقييمات على كورساتك حتى الآن.
          </div>
        ) : null}
      </div>
    </div>
  );
}
