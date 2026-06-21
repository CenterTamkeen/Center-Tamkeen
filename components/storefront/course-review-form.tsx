"use client";

import { useActionState, useState } from "react";

import { initialActionState } from "@/lib/auth/action-state";
import {
  deleteCourseReviewAction,
  submitCourseReviewAction,
} from "@/lib/storefront/actions";

type CourseReviewFormProps = {
  courseId: string;
  courseHref: string;
  reviewId?: string;
  initialRating?: number;
  initialComment?: string | null;
};

const ratings = [1, 2, 3, 4, 5];

export function CourseReviewForm({
  courseId,
  courseHref,
  reviewId,
  initialRating = 0,
  initialComment = null,
}: CourseReviewFormProps) {
  const hasReview = Boolean(reviewId);
  const [selectedRating, setSelectedRating] = useState(initialRating);
  const [state, formAction, isPending] = useActionState(
    submitCourseReviewAction,
    initialActionState,
  );
  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteCourseReviewAction,
    initialActionState,
  );

  return (
    <div className="glass-panel rounded-2xl p-5">
      <form action={formAction}>
        <input type="hidden" name="courseId" value={courseId} />
        <input type="hidden" name="courseHref" value={courseHref} />

        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow">تقييمك</p>
            <h3 className="text-lg font-black">
              {hasReview ? "عدل تقييمك للكورس" : "سيب رأيك في الكورس"}
            </h3>
          </div>
          <div className="flex flex-row-reverse gap-1" dir="ltr">
            {ratings.map((rating) => (
              <label
                key={rating}
                className="cursor-pointer rounded-lg p-1 transition-transform hover:-translate-y-0.5"
                title={`${rating} نجوم`}
              >
                <input
                  type="radio"
                  name="rating"
                  value={rating}
                  checked={selectedRating === rating}
                  onChange={() => setSelectedRating(rating)}
                  className="sr-only"
                />
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill={rating <= selectedRating ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={
                    rating <= selectedRating
                      ? "text-accent-500"
                      : "text-foreground/35"
                  }
                  aria-hidden="true"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </label>
            ))}
          </div>
        </div>

        {state.fieldErrors?.rating?.[0] ? (
          <p className="mb-3 text-sm text-red-700">
            {state.fieldErrors.rating[0]}
          </p>
        ) : null}

        <label className="block space-y-2">
          <span className="text-foreground/80 text-sm font-bold">
            تعليق اختياري
          </span>
          <textarea
            name="comment"
            defaultValue={state.values?.comment ?? initialComment ?? ""}
            rows={4}
            maxLength={800}
            placeholder="اكتب تجربتك لو حابب..."
            className="field bg-background/60 min-h-28 resize-y leading-7"
          />
        </label>

        {state.fieldErrors?.comment?.[0] ? (
          <p className="mt-2 text-sm text-red-700">
            {state.fieldErrors.comment[0]}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isPending || selectedRating === 0 || isDeleting}
            className="btn-primary px-5 py-3 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {isPending
              ? "جاري الحفظ..."
              : hasReview
                ? "تحديث التقييم"
                : "حفظ التقييم"}
          </button>
          {state.message ? (
            <p
              className={`text-sm font-bold ${
                state.status === "success" ? "text-primary-700" : "text-red-700"
              }`}
            >
              {state.message}
            </p>
          ) : null}
        </div>
      </form>

      {hasReview ? (
        <form action={deleteAction} className="mt-3">
          <input type="hidden" name="courseId" value={courseId} />
          <input type="hidden" name="courseHref" value={courseHref} />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isPending || isDeleting}
              className="btn-secondary px-4 py-2.5 text-sm text-red-700 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {isDeleting ? "جاري الحذف..." : "حذف تقييمي"}
            </button>
            {deleteState.message ? (
              <p
                className={`text-sm font-bold ${
                  deleteState.status === "success"
                    ? "text-primary-700"
                    : "text-red-700"
                }`}
              >
                {deleteState.message}
              </p>
            ) : null}
          </div>
        </form>
      ) : null}

      {hasReview ? (
        <p className="text-foreground/50 mt-3 text-xs leading-6">
          لديك تقييم واحد على هذا الكورس، ويمكنك تعديله أو حذفه في أي وقت.
        </p>
      ) : null}
    </div>
  );
}
