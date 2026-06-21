"use client";

import { useActionState, useMemo, useState } from "react";

import { initialActionState } from "@/lib/auth/action-state";
import { createStudentNotificationAction } from "@/lib/notifications/actions";
import type { NotificationCourseOption } from "@/lib/notifications/data";
import { gradeLabels, sectionLabels } from "@/lib/validations/auth";

import { ErrorText, FormFeedback } from "@/components/teacher/form-feedback";

type NotificationComposerProps = {
  role: "admin" | "teacher";
  courses: NotificationCourseOption[];
};

const gradeOptions = Object.entries(gradeLabels);
const sectionOptions = Object.entries(sectionLabels);

export function NotificationComposer({
  role,
  courses,
}: NotificationComposerProps) {
  const [state, formAction, isPending] = useActionState(
    createStudentNotificationAction,
    initialActionState,
  );
  const initialTargetMode =
    state.values?.targetMode ??
    (role === "admin" ? "all_students" : "teacher_students");
  const [selectedTargetMode, setSelectedTargetMode] =
    useState(initialTargetMode);
  const isCourseTarget = selectedTargetMode === "course";
  const isGradeTarget = selectedTargetMode === "grade_section";
  const totalCourseStudents = useMemo(
    () => courses.reduce((sum, course) => sum + course.enrollmentCount, 0),
    [courses],
  );

  return (
    <div className="space-y-5">
      <form action={formAction} className="card-modern space-y-5 p-5">
        <FormFeedback state={state} />

        <div className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-2 lg:col-span-2">
            <span className="text-foreground/80 text-sm font-semibold">
              عنوان الإشعار
            </span>
            <input
              name="title"
              defaultValue={state.values?.title ?? ""}
              className="field bg-background/60 py-2.5"
              placeholder="مثال: كورس الفيزياء الجديد نزل"
            />
            <ErrorText message={state.fieldErrors?.title?.[0]} />
          </label>

          <label className="space-y-2 lg:col-span-2">
            <span className="text-foreground/80 text-sm font-semibold">
              نص الإشعار
            </span>
            <textarea
              name="body"
              defaultValue={state.values?.body ?? ""}
              className="field bg-background/60 min-h-28 py-2.5"
              placeholder="اكتب الرسالة اللي هتظهر للطالب."
            />
            <ErrorText message={state.fieldErrors?.body?.[0]} />
          </label>

          <label className="space-y-2 lg:col-span-2">
            <span className="text-foreground/80 text-sm font-semibold">
              لينك عند الضغط
            </span>
            <input
              name="href"
              defaultValue={state.values?.href ?? ""}
              className="field bg-background/60 py-2.5 text-left"
              dir="ltr"
              placeholder="/courses أو https://..."
            />
            <ErrorText message={state.fieldErrors?.href?.[0]} />
          </label>

          <label className="space-y-2">
            <span className="text-foreground/80 text-sm font-semibold">
              الطلاب المستهدفين
            </span>
            <select
              name="targetMode"
              value={selectedTargetMode}
              onChange={(event) => setSelectedTargetMode(event.target.value)}
              className="field bg-background/60 py-2.5"
            >
              {role === "admin" ? (
                <>
                  <option value="all_students">كل الطلاب</option>
                  <option value="grade_section">حسب الصف والمسار</option>
                  <option value="course">طلاب كورس معين</option>
                </>
              ) : (
                <>
                  <option value="teacher_students">كل طلابي</option>
                  <option value="course">طلاب كورس معين</option>
                </>
              )}
            </select>
            <ErrorText message={state.fieldErrors?.targetMode?.[0]} />
          </label>

          <label className="space-y-2">
            <span className="text-foreground/80 text-sm font-semibold">
              الكورس
            </span>
            <select
              name="courseId"
              defaultValue={state.values?.courseId ?? ""}
              className="field bg-background/60 py-2.5"
              disabled={!isCourseTarget}
            >
              <option value="">اختار كورس</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                  {course.teacherName ? ` - ${course.teacherName}` : ""} (
                  {course.enrollmentCount.toLocaleString("ar-EG")} طالب)
                </option>
              ))}
            </select>
            <ErrorText message={state.fieldErrors?.courseId?.[0]} />
          </label>

          {role === "admin" ? (
            <>
              <label className="space-y-2">
                <span className="text-foreground/80 text-sm font-semibold">
                  الصف
                </span>
                <select
                  name="grade"
                  defaultValue={state.values?.grade ?? ""}
                  className="field bg-background/60 py-2.5"
                  disabled={!isGradeTarget}
                >
                  <option value="">كل الصفوف</option>
                  {gradeOptions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <ErrorText message={state.fieldErrors?.grade?.[0]} />
              </label>

              <label className="space-y-2">
                <span className="text-foreground/80 text-sm font-semibold">
                  المسار
                </span>
                <select
                  name="section"
                  defaultValue={state.values?.section ?? ""}
                  className="field bg-background/60 py-2.5"
                  disabled={!isGradeTarget}
                >
                  <option value="">كل المسارات داخل الصف</option>
                  {sectionOptions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-foreground/55 text-sm font-semibold">
            {courses.length > 0
              ? `${courses.length.toLocaleString("ar-EG")} كورس متاح، بإجمالي ${totalCourseStudents.toLocaleString("ar-EG")} اشتراك.`
              : "لا توجد كورسات متاحة للاختيار."}
          </p>
          <button type="submit" disabled={isPending} className="btn-primary">
            {isPending ? "جاري الإرسال..." : "إرسال الإشعار"}
          </button>
        </div>
      </form>

      <div className="glass-panel-strong rounded-xl p-4">
        <p className="eyebrow">ملاحظات سريعة</p>
        <div className="text-foreground/65 mt-3 grid gap-2 text-sm leading-6 md:grid-cols-2">
          <p>الإشعار يظهر في لوحة الطالب ضمن آخر التنبيهات.</p>
          <p>لو كتبت لينك داخلي مثل /courses، الطالب هينتقل له عند الضغط.</p>
        </div>
      </div>
    </div>
  );
}
