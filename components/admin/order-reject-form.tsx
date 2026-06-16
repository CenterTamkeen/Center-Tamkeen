"use client";

import { useActionState } from "react";

import { ErrorText, FormFeedback } from "@/components/teacher/form-feedback";
import { rejectOrderAction } from "@/lib/admin/actions";
import { initialActionState } from "@/lib/auth/action-state";

export function OrderRejectForm({ orderId }: { orderId: string }) {
  const [state, formAction, isPending] = useActionState(
    rejectOrderAction,
    initialActionState,
  );

  return (
    <form action={formAction} className="mt-4 space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <FormFeedback state={state} />
      <label className="space-y-2">
        <span className="text-foreground/70 text-sm font-semibold">
          سبب الإلغاء أو الاسترجاع
        </span>
        <textarea
          name="rejectionReason"
          rows={2}
          defaultValue={
            state.values?.orderId === orderId
              ? state.values?.rejectionReason
              : ""
          }
          className="field bg-background/60 resize-none py-2.5 text-sm leading-6"
        />
        {state.values?.orderId === orderId ? (
          <ErrorText message={state.fieldErrors?.rejectionReason?.[0]} />
        ) : null}
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="btn-secondary px-3 py-2 text-xs text-red-700"
      >
        {isPending ? "جاري التسجيل..." : "إلغاء / استرجاع"}
      </button>
    </form>
  );
}
