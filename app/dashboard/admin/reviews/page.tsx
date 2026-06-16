import type { Metadata } from "next";

import { deleteReviewAction } from "@/lib/admin/actions";
import { getAdminReviews } from "@/lib/admin/data";

export const metadata: Metadata = {
  title: "Moderation التقييمات",
};

export default async function AdminReviewsPage() {
  const reviews = await getAdminReviews();

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">Moderation</p>
        <h2 className="text-xl font-black">إدارة التقييمات</h2>
        <p className="text-foreground/60 mt-2 text-sm leading-7">
          الحذف متاح الآن. الإخفاء/الإظهار والردود يحتاجوا أعمدة إضافية في قاعدة
          البيانات.
        </p>
      </div>

      <div className="grid gap-4">
        {reviews.map((review) => (
          <article key={review.id} className="card-modern p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-black">
                    {review.student?.profile?.full_name ?? "طالب غير معروف"}
                  </h3>
                  <span className="chip">{review.rating} / 5</span>
                </div>
                <p className="text-foreground/55 mt-2 text-sm">
                  {review.course?.title ?? "كورس غير معروف"} ·{" "}
                  {review.course?.teacher?.profile?.full_name ??
                    "مدرس غير معروف"}{" "}
                  · {new Date(review.created_at).toLocaleDateString("ar-EG")}
                </p>
                <p className="text-foreground/70 mt-3 leading-8">
                  {review.comment || "لا يوجد تعليق نصي."}
                </p>
              </div>
              <form action={deleteReviewAction}>
                <input type="hidden" name="reviewId" value={review.id} />
                <button className="btn-secondary px-3 py-2 text-xs text-red-700">
                  حذف التقييم
                </button>
              </form>
            </div>
          </article>
        ))}
        {reviews.length === 0 ? (
          <div className="glass-panel text-foreground/60 rounded-xl px-5 py-12 text-center">
            لا توجد تقييمات حتى الآن.
          </div>
        ) : null}
      </div>
    </div>
  );
}
