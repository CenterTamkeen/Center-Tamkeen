import Image from "next/image";

import type { ReviewSummary } from "@/lib/storefront/data";

type ReviewCardProps = {
  review: ReviewSummary;
};

export function ReviewCard({ review }: ReviewCardProps) {
  const studentName = review.student?.profile?.full_name ?? "طالب تمكين";
  const avatarUrl =
    review.student?.photo_url ?? review.student?.profile?.avatar_url;

  return (
    <article className="card-modern quote-deco group p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="border-primary-100 bg-primary-50 text-primary-700 relative h-10 w-10 shrink-0 overflow-hidden rounded-full border text-sm font-black">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={studentName}
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center">
                {studentName.trim().charAt(0) || "ط"}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="group-hover:text-primary-700 truncate font-bold transition-colors duration-300">
              {studentName}
            </h3>
            <p className="text-foreground/50 mt-0.5 truncate text-sm">
              {review.course?.title ?? "كورس تمكين"}
            </p>
          </div>
        </div>
        <div
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-black"
          style={{
            background:
              "linear-gradient(135deg, rgb(254 248 224 / 0.9), rgb(253 238 179 / 0.6))",
            color: "var(--accent-700)",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="text-accent-500"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span>{review.rating.toLocaleString("ar-EG")} / ٥</span>
        </div>
      </div>
      <p className="text-foreground/65 leading-7">
        {review.comment ?? "تجربة ممتازة ومنظمة."}
      </p>
    </article>
  );
}
