"use client";

import { useActionState, useState } from "react";

import { initialActionState } from "@/lib/auth/action-state";
import {
  createCouponAction,
  deleteCouponAction,
  updateCouponAction,
} from "@/lib/teacher/actions";
import type {
  TeacherCoupon,
  TeacherCouponStudent,
  TeacherCourse,
} from "@/lib/teacher/data";

import { ErrorText, FormFeedback } from "./form-feedback";

function formatDateInput(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

function CouponFields({
  coupon,
  courses,
  students,
  stateValues,
}: {
  coupon?: TeacherCoupon;
  courses: TeacherCourse[];
  students: TeacherCouponStudent[];
  stateValues?: Record<string, string>;
}) {
  const initialTargetStudentIds =
    stateValues?.targetStudentIds?.split(",").filter(Boolean) ??
    coupon?.target_students.map((student) => student.id) ??
    [];
  const [restrictToStudent, setRestrictToStudent] = useState(
    initialTargetStudentIds.length > 0,
  );
  const [studentQuery, setStudentQuery] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(
    initialTargetStudentIds,
  );
  const normalizedQuery = studentQuery.trim().toLowerCase();
  const filteredStudents = students.filter((student) => {
    if (!normalizedQuery) {
      return true;
    }

    return [
      student.profile?.full_name,
      student.student_phone,
      student.profile?.phone,
      student.email,
    ]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(normalizedQuery));
  });

  function toggleStudent(studentId: string) {
    setSelectedStudentIds((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId],
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <label className="space-y-2 sm:col-span-2 lg:col-span-5">
        <span className="text-foreground/80 text-sm font-semibold">الكورس</span>
        <select
          name="courseId"
          defaultValue={stateValues?.courseId ?? coupon?.course_id ?? ""}
          className="field bg-background/60 py-2.5"
          required
        >
          <option value="">اختار الكورس</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
      </label>
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
      <div className="space-y-3 sm:col-span-2 lg:col-span-5">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            name="restrictToStudent"
            type="checkbox"
            defaultChecked={restrictToStudent}
            onChange={(event) => {
              setRestrictToStudent(event.target.checked);

              if (!event.target.checked) {
                setSelectedStudentIds([]);
              }
            }}
            className="accent-primary-600 h-4 w-4"
          />
          كوبون لطلاب محددين فقط
        </label>
        {restrictToStudent ? (
          <div className="grid gap-3 rounded-xl border bg-white/50 p-3">
            <input
              type="hidden"
              name="targetStudentIds"
              value={selectedStudentIds.join(",")}
            />
            <label className="grid gap-2.5">
              <span className="text-foreground/80 text-sm font-semibold">
                بحث في الطلاب
              </span>
              <input
                type="search"
                value={studentQuery}
                onChange={(event) => setStudentQuery(event.target.value)}
                placeholder="ابحث بالاسم أو رقم الطالب أو الإيميل"
                className="field bg-background/60 py-2.5"
              />
            </label>
            <div className="max-h-52 overflow-y-auto rounded-xl border bg-white/70">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <label
                    key={student.id}
                    className="flex cursor-pointer items-center justify-between gap-3 border-b px-3 py-2.5 text-sm last:border-b-0"
                  >
                    <span>
                      <span className="block font-bold">
                        {student.profile?.full_name ?? "طالب بدون اسم"}
                      </span>
                      <span className="text-foreground/50 block text-xs">
                        {student.student_phone}
                        {student.profile?.phone
                          ? ` - ${student.profile.phone}`
                          : ""}
                        {student.email ? ` - ${student.email}` : ""}
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.includes(student.id)}
                      onChange={() => toggleStudent(student.id)}
                      className="accent-primary-600 h-4 w-4"
                    />
                  </label>
                ))
              ) : (
                <p className="text-foreground/55 px-3 py-5 text-center text-sm">
                  لا يوجد طلاب مطابقين للبحث.
                </p>
              )}
            </div>
            <p className="text-foreground/55 text-xs font-semibold">
              تم اختيار {selectedStudentIds.length.toLocaleString("ar-EG")} طالب
            </p>
          </div>
        ) : (
          <input type="hidden" name="targetStudentIds" value="" />
        )}
      </div>
    </div>
  );
}

function CreateCouponForm({
  courses,
  students,
}: {
  courses: TeacherCourse[];
  students: TeacherCouponStudent[];
}) {
  const [state, formAction, isPending] = useActionState(
    createCouponAction,
    initialActionState,
  );

  return (
    <form action={formAction} className="card-modern space-y-4 p-5">
      <FormFeedback state={state} />
      <CouponFields
        courses={courses}
        students={students}
        stateValues={state.values}
      />
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
          state.fieldErrors?.courseId?.[0] ??
          state.fieldErrors?.usageLimit?.[0] ??
          state.fieldErrors?.targetStudentIds?.[0]
        }
      />
    </form>
  );
}

function CouponEditForm({
  coupon,
  courses,
  students,
}: {
  coupon: TeacherCoupon;
  courses: TeacherCourse[];
  students: TeacherCouponStudent[];
}) {
  const [state, formAction, isPending] = useActionState(
    updateCouponAction,
    initialActionState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="couponId" value={coupon.id} />
      <FormFeedback state={state} />
      <CouponFields
        coupon={coupon}
        courses={courses}
        students={students}
        stateValues={state.values}
      />
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
          state.fieldErrors?.courseId?.[0] ??
          state.fieldErrors?.usageLimit?.[0] ??
          state.fieldErrors?.targetStudentIds?.[0]
        }
      />
    </form>
  );
}

function StudentName({
  student,
}: {
  student: {
    student_phone: string;
    profile: {
      full_name: string;
    } | null;
  } | null;
}) {
  return (
    <>
      {student?.profile?.full_name ?? "طالب بدون اسم"}
      {student?.student_phone ? (
        <span className="text-foreground/50"> - {student.student_phone}</span>
      ) : null}
    </>
  );
}

export function CouponManager({
  coupons,
  courses,
  students,
}: {
  coupons: TeacherCoupon[];
  courses: TeacherCourse[];
  students: TeacherCouponStudent[];
}) {
  return (
    <div className="space-y-5">
      <CreateCouponForm courses={courses} students={students} />
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
                  <p className="text-foreground/55 mt-1 text-sm">
                    الكورس: {coupon.course?.title ?? "غير محدد"}
                  </p>
                  <p className="text-foreground/55 mt-1 text-sm">
                    {coupon.target_students.length > 0 ? (
                      <>
                        مخصص لـ{" "}
                        {coupon.target_students
                          .map(
                            (student) =>
                              student.profile?.full_name ?? "طالب بدون اسم",
                          )
                          .join("، ")}
                      </>
                    ) : (
                      "متاح لأي طالب"
                    )}
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
              <div className="mb-4 rounded-xl bg-white/60 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold">الطلاب اللي استخدموا الكوبون</p>
                  <span className="chip">
                    {coupon.coupon_redemptions.length.toLocaleString("ar-EG")}{" "}
                    طالب
                  </span>
                </div>
                {coupon.coupon_redemptions.length > 0 ? (
                  <div className="grid gap-2">
                    {coupon.coupon_redemptions.map((redemption) => (
                      <div
                        key={redemption.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-white/70 px-3 py-2 text-sm"
                      >
                        <span className="font-semibold">
                          <StudentName student={redemption.student} />
                        </span>
                        <span className="text-foreground/55">
                          {new Date(redemption.redeemed_at).toLocaleDateString(
                            "ar-EG",
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-foreground/55 text-sm">
                    مفيش استخدامات مسجلة للكوبون ده حتى الآن.
                  </p>
                )}
              </div>
              <CouponEditForm
                coupon={coupon}
                courses={courses}
                students={students}
              />
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
