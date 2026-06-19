"use client";

import { useActionState } from "react";

import { FormFeedback } from "@/components/teacher/form-feedback";
import { acceptOrderAction } from "@/lib/admin/actions";
import { initialActionState } from "@/lib/auth/action-state";

export function OrderAcceptForm({ orderId }: { orderId: string }) {
  const [state, formAction, isPending] = useActionState(
    acceptOrderAction,
    initialActionState,
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <FormFeedback state={state} />
      <button
        type="submit"
        disabled={isPending}
        className="btn-primary px-3 py-2 text-xs"
      >
        {isPending ? "جاري التفعيل..." : "قبول / تفعيل"}
      </button>
    </form>
  );
}
