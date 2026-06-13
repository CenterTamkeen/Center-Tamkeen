import type { ReviewSummary } from "@/lib/storefront/data";

type ReviewCardProps = {
  review: ReviewSummary;
};

export function ReviewCard({ review }: ReviewCardProps) {
  const studentName = review.student?.profile?.full_name ?? "طالب تمكين";

  return (
    <article className="border-border bg-surface rounded-md border p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold">{studentName}</h3>
          <p className="text-foreground/55 text-sm">
            {review.course?.title ?? "كورس تمكين"}
          </p>
        </div>
        <p className="bg-accent-50 text-accent-700 rounded-md px-2.5 py-1 text-sm font-bold">
          {review.rating.toLocaleString("ar-EG")} / ٥
        </p>
      </div>
      <p className="text-foreground/70 leading-7">
        {review.comment ?? "تجربة ممتازة ومنظمة."}
      </p>
    </article>
  );
}
