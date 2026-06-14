"use client";

import { useActionState } from "react";

import { initialActionState } from "@/lib/auth/action-state";
import {
  createCouponAction,
  deleteCouponAction,
  updateCouponAction,
} from "@/lib/teacher/actions";
import type { TeacherCoupon } from "@/lib/teacher/data";

import { ErrorText, FormFeedback } from "./form-feedback";

function formatDateInput(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

function CouponFields({
  coupon,
  stateValues,
}: {
  coupon?: TeacherCoupon;
  stateValues?: Record<string, string>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <label className="space-y-2">
        <span className="text-foreground/80 text-sm font-semibold">الكود</span>
        <input
          name="code"
          defaultValue={stateValues?.code ?? coupon?.code ?? ""}
          className="field bg-background/60 py-2.5 text-left uppercase"
          dir="ltr"
        />
      </label>
      <label className="space-y-2">
        <span className="text-foreground/80 text-sm font-semibold">
          نوع الخصم
        </span>
        <select
          name="discountType"
          defaultValue={
            stateValues?.discountType ?? coupon?.discount_type ?? "percentage"
          }
          className="field bg-background/60 py-2.5"
        >
          <option value="percentage">نسبة</option>
          <option value="fixed">مبلغ ثابت</option>
        </select>
      </label>
      <label className="space-y-2">
        <span className="text-foreground/80 text-sm font-semibold">
          قيمة الخصم
        </span>
        <input
          name="discountValue"
          type="number"
          min="1"
          step="1"
          defaultValue={
            stateValues?.discountValue ?? coupon?.discount_value ?? ""
          }
          className="field bg-background/60 py-2.5 text-right"
        />
      </label>
      <label className="space-y-2">
        <span className="text-foreground/80 text-sm font-semibold">
          حد الاستخدام
        </span>
        <input
          name="usageLimit"
          type="number"
          min="1"
          step="1"
          defaultValue={stateValues?.usageLimit ?? coupon?.usage_limit ?? ""}
          className="field bg-background/60 py-2.5 text-right"
        />
      </label>
      <label className="space-y-2">
        <span className="text-foreground/80 text-sm font-semibold">
          تاريخ الانتهاء
        </span>
        <input
          name="expiresAt"
          type="date"
          defaultValue={
            stateValues?.expiresAt ??
            formatDateInput(coupon?.expires_at ?? null)
          }
          className="field bg-background/60 py-2.5 text-right"
        />
      </label>
    </div>
  );
}

function CreateCouponForm() {
  const [state, formAction, isPending] = useActionState(
    createCouponAction,
    initialActionState,
  );

  return (
    <form action={formAction} className="card-modern space-y-4 p-5">
      <FormFeedback state={state} />
      <CouponFields stateValues={state.values} />
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            name="isActive"
            type="checkbox"
            defaultChecked
            className="accent-primary-600 h-4 w-4"
          />
          تفعيل الكوبون
        </label>
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? "جاري الإنشاء..." : "إنشاء كوبون"}
        </button>
      </div>
      <ErrorText
        message={
          state.fieldErrors?.code?.[0] ??
          state.fieldErrors?.discountValue?.[0] ??
          state.fieldErrors?.usageLimit?.[0]
        }
      />
    </form>
  );
}

function CouponEditForm({ coupon }: { coupon: TeacherCoupon }) {
  const [state, formAction, isPending] = useActionState(
    updateCouponAction,
    initialActionState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="couponId" value={coupon.id} />
      <FormFeedback state={state} />
      <CouponFields coupon={coupon} stateValues={state.values} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              name="isActive"
              type="checkbox"
              defaultChecked={coupon.is_active}
              className="accent-primary-600 h-4 w-4"
            />
            مفعل
          </label>
          <span className="text-foreground/55 text-xs font-semibold">
            استخدم {coupon.used_count.toLocaleString("ar-EG")} مرة
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="btn-secondary px-4 py-2 text-xs"
          >
            حفظ
          </button>
        </div>
      </div>
      <ErrorText
        message={
          state.fieldErrors?.code?.[0] ??
          state.fieldErrors?.discountValue?.[0] ??
          state.fieldErrors?.usageLimit?.[0]
        }
      />
    </form>
  );
}

export function CouponManager({ coupons }: { coupons: TeacherCoupon[] }) {
  return (
    <div className="space-y-5">
      <CreateCouponForm />
      <div className="space-y-3">
        {coupons.length > 0 ? (
          coupons.map((coupon) => (
            <article
              key={coupon.id}
              className="glass-panel-strong rounded-xl p-5"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-black">{coupon.code}</p>
                  <p className="text-foreground/55 text-sm">
                    {coupon.discount_type === "percentage"
                      ? `${coupon.discount_value}%`
                      : `${coupon.discount_value.toLocaleString("ar-EG")} جنيه`}
                  </p>
                </div>
                <form action={deleteCouponAction}>
                  <input type="hidden" name="couponId" value={coupon.id} />
                  <button
                    type="submit"
                    className="btn-secondary px-3 py-2 text-xs text-red-700"
                  >
                    حذف
                  </button>
                </form>
              </div>
              <CouponEditForm coupon={coupon} />
            </article>
          ))
        ) : (
          <div className="glass-panel text-foreground/60 rounded-xl px-5 py-10 text-center">
            لا توجد كوبونات حتى الآن.
          </div>
        )}
      </div>
    </div>
  );
}
