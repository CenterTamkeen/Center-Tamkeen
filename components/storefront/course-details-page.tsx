import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { BackButton } from "@/components/navigation/back-button";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { BunnyVideoPlayer } from "@/components/storefront/bunny-video-player";
import { CoursePurchaseForm } from "@/components/storefront/course-purchase-form";
import { CourseReviewForm } from "@/components/storefront/course-review-form";
import { PurchaseScrollButton } from "@/components/storefront/purchase-scroll-button";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { getCurrentUserProfile } from "@/lib/auth/roles";
import { getBunnyStreamVideoStatus } from "@/lib/bunny-stream";
import {
  formatDuration,
  formatPrice,
  getCourseById,
  getCurrentStudentCourseProgress,
  getCurrentStudentEnrollmentCourseIds,
} from "@/lib/storefront/data";
import { buildCourseHref } from "@/lib/storefront/links";
import { gradeLabels, sectionLabels } from "@/lib/validations/auth";
import { absoluteUrl } from "@/lib/seo";

type CourseDetailsPageProps = {
  id: string;
  teacherSlug?: string;
};

export async function generateCourseMetadata(id: string): Promise<Metadata> {
  const course = await getCourseById(id);

  if (!course) {
    return {
      title: "الكورس غير موجود",
    };
  }

  return {
    title: course.title,
    description:
      course.description ??
      `تفاصيل كورس ${course.title} على منصة تمكين التعليمية.`,
    alternates: {
      canonical: buildCourseHref(course),
    },
    openGraph: {
      title: `${course.title} | منصة تمكين`,
      description:
        course.description ??
        `تفاصيل كورس ${course.title} على منصة تمكين التعليمية.`,
      url: buildCourseHref(course),
      type: "article",
      images: course.thumbnail_url
        ? [
            {
              url: course.thumbnail_url,
              alt: course.title,
            },
          ]
        : [
            {
              url: absoluteUrl("/Logo/tamkeen-transparent.png"),
              alt: "منصة تمكين",
            },
          ],
    },
  };
}

export async function CourseDetailsPage({
  id,
  teacherSlug,
}: CourseDetailsPageProps) {
  const [course, session] = await Promise.all([
    getCourseById(id),
    getCurrentUserProfile(),
  ]);

  if (!course) {
    notFound();
  }

  const courseHref = buildCourseHref(course);

  if (teacherSlug && course.teacher?.slug !== teacherSlug) {
    redirect(courseHref);
  }

  const teacherName = course.teacher?.profile?.full_name ?? "مدرس تمكين";
  const viewerName = session?.profile.full_name ?? null;
  const viewerEmail = session?.user.email ?? null;
  const isStudent = session?.profile.role === "student";
  const isEnrolled = (
    await getCurrentStudentEnrollmentCourseIds([course.id])
  ).includes(course.id);
  const previewLesson = course.lessons.find((lesson) => lesson.is_free_preview);
  const lessonCount = course.lessons.length;
  const courseProgress = isEnrolled
    ? await getCurrentStudentCourseProgress(course.id)
    : { studentId: null, progress: [] };
  const currentStudentReview = courseProgress.studentId
    ? course.reviews.find(
        (review) => review.student_id === courseProgress.studentId,
      )
    : null;
  const progressByLessonId = new Map(
    courseProgress.progress.map((item) => [item.lesson_id, item]),
  );
  const completedLessonCount = course.lessons.filter(
    (lesson) => progressByLessonId.get(lesson.id)?.status === "completed",
  ).length;
  const startedLessonCount = course.lessons.filter((lesson) =>
    progressByLessonId.has(lesson.id),
  ).length;
  const progressPercent =
    lessonCount > 0
      ? Math.round((completedLessonCount / lessonCount) * 100)
      : 0;
  const playableLesson = isEnrolled
    ? (course.lessons.find(
        (lesson) =>
          lesson.bunny_video_id &&
          progressByLessonId.get(lesson.id)?.status !== "completed",
      ) ?? course.lessons.find((lesson) => lesson.bunny_video_id))
    : undefined;
  const playableVideoStatus = playableLesson?.bunny_video_id
    ? await getBunnyStreamVideoStatus(playableLesson.bunny_video_id)
    : undefined;
  const previewVideoStatus =
    previewLesson?.bunny_video_id &&
    previewLesson.bunny_video_id !== playableLesson?.bunny_video_id
      ? await getBunnyStreamVideoStatus(previewLesson.bunny_video_id)
      : playableVideoStatus;
  const shouldShowPreviewPlayer = !isEnrolled;
  const previewCount = course.lessons.filter(
    (lesson) => lesson.is_free_preview,
  ).length;
  const totalDuration = course.lessons.reduce(
    (total, lesson) => total + (lesson.duration ?? 0),
    0,
  );
  const averageRating =
    course.reviews.length > 0
      ? course.reviews.reduce((total, review) => total + review.rating, 0) /
        course.reviews.length
      : null;
  const sectionLabel = course.target_section
    ? (sectionLabels[course.target_section as keyof typeof sectionLabels] ??
      course.target_section)
    : null;
  const gradeLabel = course.target_grade
    ? gradeLabels[course.target_grade]
    : null;

  return (
    <>
      <SiteHeader />
      <main className="overflow-x-hidden">
        {/* Hero */}
        <section
          className="relative isolate overflow-hidden border-b"
          style={{
            borderColor: "var(--footer-border)",
            background:
              "radial-gradient(circle at 82% 18%, rgb(75 200 173 / 0.16), transparent 28rem), radial-gradient(circle at 8% 8%, rgb(245 197 24 / 0.12), transparent 24rem), var(--panel-wash-background)",
          }}
        >
          <div className="container-page relative grid min-w-0 gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_410px] lg:items-start lg:py-14">
            <div className="animate-fade-up min-w-0 space-y-7">
              <div className="grid max-w-full gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
                <BackButton
                  fallbackHref="/courses"
                  label="رجوع للكورسات"
                  className="w-full max-w-full sm:w-auto"
                />
                <span className="chip w-full justify-center sm:w-auto">
                  {course.subject ?? course.teacher?.subject ?? "كورس تعليمي"}
                </span>
                {isEnrolled ? <span className="chip">مشترك بالفعل</span> : null}
              </div>

              <div className="max-w-3xl space-y-4 text-center sm:text-right">
                <p className="eyebrow">تفاصيل الكورس</p>
                <h1 className="heading-gradient text-3xl leading-tight font-black sm:text-5xl">
                  {course.title}
                </h1>
                <p className="text-foreground/70 max-w-2xl text-base leading-8 sm:text-lg">
                  {course.description ?? "تفاصيل الكورس هتظهر هنا قريبًا."}
                </p>
              </div>

              <div className="grid gap-3 text-center sm:grid-cols-2 sm:text-right xl:grid-cols-4">
                <InfoTile
                  label="المدرس"
                  value={teacherName}
                  href={
                    course.teacher?.slug
                      ? `/teachers/${course.teacher.slug}`
                      : undefined
                  }
                />
                <InfoTile
                  label="السعر"
                  value={formatPrice(course.price)}
                  tone="gold"
                />
                <InfoTile
                  label="الحصص"
                  value={`${lessonCount.toLocaleString("ar-EG")} حصة`}
                />
                <InfoTile
                  label="التقييم"
                  value={
                    averageRating
                      ? `${averageRating.toLocaleString("ar-EG", { maximumFractionDigits: 1 })} / ٥`
                      : "لا يوجد بعد"
                  }
                />
              </div>

              {gradeLabel ||
              sectionLabel ||
              totalDuration > 0 ||
              previewCount > 0 ? (
                <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                  {gradeLabel ? (
                    <span className="chip">{gradeLabel}</span>
                  ) : null}
                  {sectionLabel ? (
                    <span className="chip">{sectionLabel}</span>
                  ) : null}
                  {totalDuration > 0 ? (
                    <span className="chip">
                      مدة تقريبية {formatDuration(totalDuration)}
                    </span>
                  ) : null}
                  {previewCount > 0 ? (
                    <span className="chip">
                      {previewCount.toLocaleString("ar-EG")} حصة مجانية
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>

            <aside
              id="purchase"
              className="animate-blur-in glass-panel-strong min-w-0 overflow-hidden rounded-2xl lg:sticky lg:top-24"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="relative aspect-[4/3] overflow-hidden sm:aspect-video lg:aspect-[4/3]">
                {course.thumbnail_url ? (
                  <Image
                    src={course.thumbnail_url}
                    alt={course.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 420px"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div
                    className="text-primary-700 flex h-full items-center justify-center text-2xl font-black"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--primary-50), var(--accent-100))",
                    }}
                  >
                    تمكين
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-4 text-white">
                  <p className="text-xs font-black text-white/75">
                    جاهز للمتابعة
                  </p>
                  <p className="mt-1 text-lg font-black">
                    {isEnrolled
                      ? "اكمل من منطقة الدراسة"
                      : "اشترك وابدأ الكورس"}
                  </p>
                </div>
              </div>
              <div className="space-y-4 p-5 sm:p-6">
                <CoursePurchaseForm
                  courseId={course.id}
                  courseHref={courseHref}
                  price={course.price}
                  isStudent={isStudent}
                  isEnrolled={isEnrolled}
                />
              </div>
            </aside>
          </div>
        </section>

        {/* Content */}
        <section
          id="study"
          className="container-page grid min-w-0 gap-8 py-12 lg:grid-cols-[minmax(0,1fr)_340px]"
        >
          <div className="min-w-0 space-y-10">
            {isEnrolled ? (
              <ScrollReveal as="section">
                <div className="glass-panel-strong rounded-2xl p-5 sm:p-6">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="eyebrow">تقدم الكورس</p>
                      <h2 className="heading-gradient mt-1 text-2xl font-black">
                        وصلت لـ {progressPercent.toLocaleString("ar-EG")}%
                      </h2>
                      <p className="text-foreground/60 mt-2 text-sm leading-6">
                        {completedLessonCount.toLocaleString("ar-EG")} من{" "}
                        {lessonCount.toLocaleString("ar-EG")} حصة مكتملة، و
                        {startedLessonCount.toLocaleString("ar-EG")} حصة بدأت.
                      </p>
                    </div>
                    <span className="chip">
                      {progressPercent >= 100 ? "أنهيت الكورس" : "لسه مكملين"}
                    </span>
                  </div>
                  <div className="bg-foreground/10 mt-5 h-3 overflow-hidden rounded-full">
                    <div
                      className="from-primary-500 to-accent-500 h-full rounded-full bg-gradient-to-l transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </ScrollReveal>
            ) : null}
            {playableLesson ? (
              <ScrollReveal as="section">
                <div className="glass-panel-strong overflow-hidden rounded-2xl p-4 sm:p-5">
                  <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="eyebrow">تشغيل الحصة</p>
                      <h2 className="heading-gradient mt-1 text-2xl font-black">
                        {playableLesson.title}
                      </h2>
                    </div>
                    <span className="chip">
                      {formatDuration(playableLesson.duration)}
                    </span>
                  </div>
                  <BunnyVideoPlayer
                    lessonId={playableLesson.id}
                    courseId={course.id}
                    title={playableLesson.title}
                    posterUrl={playableLesson.thumbnail_url}
                    lessonDurationSeconds={playableLesson.duration}
                    watermarkName={viewerName}
                    watermarkEmail={viewerEmail}
                    initialStatus={playableVideoStatus}
                    initialProgressStatus={
                      progressByLessonId.get(playableLesson.id)?.status ??
                      "not_started"
                    }
                  />
                </div>
              </ScrollReveal>
            ) : !isEnrolled ? (
              <ScrollReveal as="section">
                <div className="glass-panel-strong rounded-2xl p-5 text-center">
                  <p className="eyebrow">منطقة الدراسة</p>
                  <h2 className="mt-2 text-2xl font-black">
                    اشترك في الكورس لفتح الحصص الكاملة
                  </h2>
                  <p className="text-foreground/60 mx-auto mt-3 max-w-2xl leading-7">
                    الفيديوهات الكاملة متاحة فقط للطلاب المشتركين. تقدر تشوف حصة
                    الـ Preview المجانية لو المدرس محدد واحدة.
                  </p>
                  <PurchaseScrollButton />
                </div>
              </ScrollReveal>
            ) : null}

            {/* Lessons */}
            <ScrollReveal as="section">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">خطة الدراسة</p>
                  <h2 className="heading-gradient text-2xl font-black">
                    محتوى الكورس
                  </h2>
                </div>
                <span className="chip">
                  {lessonCount.toLocaleString("ar-EG")} حصة
                </span>
              </div>
              <div className="glass-panel-strong overflow-hidden rounded-2xl">
                {course.lessons.length > 0 ? (
                  course.lessons.map((lesson, i) => (
                    <div
                      key={lesson.id}
                      className="group hover:bg-primary-50/30 grid gap-4 border-b px-4 py-4 transition-all duration-300 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5"
                      style={{ borderColor: "rgb(208 227 218 / 0.4)" }}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {lesson.thumbnail_url ? (
                          <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl">
                            <Image
                              src={lesson.thumbnail_url}
                              alt={lesson.title}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          </div>
                        ) : null}
                        <span
                          className="text-foreground/45 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black"
                          style={{
                            background: "rgb(236 245 241 / 0.6)",
                          }}
                        >
                          {(i + 1).toLocaleString("ar-EG")}
                        </span>
                        <div className="min-w-0">
                          <h3 className="group-hover:text-primary-700 font-bold transition-colors duration-300">
                            {lesson.title}
                          </h3>
                          <p className="text-foreground/50 text-sm">
                            {formatDuration(lesson.duration)}
                          </p>
                        </div>
                      </div>
                      <LessonProgressBadge
                        isEnrolled={isEnrolled}
                        isStarted={progressByLessonId.has(lesson.id)}
                        isCompleted={
                          progressByLessonId.get(lesson.id)?.status ===
                          "completed"
                        }
                      />
                      {lesson.is_free_preview ? (
                        <span
                          className="badge-pulse text-primary-700 rounded-lg px-2.5 py-1 text-xs font-black"
                          style={{
                            background:
                              "linear-gradient(135deg, rgb(231 245 241 / 0.9), rgb(197 232 223 / 0.5))",
                          }}
                        >
                          Preview
                        </span>
                      ) : !isEnrolled ? (
                        <span className="text-foreground/45 inline-flex items-center gap-2 text-xs font-black">
                          مقفلة للطلاب غير المشتركين
                        </span>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="text-foreground/60 px-5 py-10 text-center">
                    الحصص هتظهر هنا بعد إضافتها من لوحة المدرس.
                  </p>
                )}
              </div>
            </ScrollReveal>

            {/* Reviews */}
            <ScrollReveal as="section">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">آراء الطلاب</p>
                  <h2 className="heading-gradient text-2xl font-black">
                    التقييمات
                  </h2>
                </div>
                {averageRating ? (
                  <span className="chip">
                    متوسط{" "}
                    {averageRating.toLocaleString("ar-EG", {
                      maximumFractionDigits: 1,
                    })}{" "}
                    / ٥
                  </span>
                ) : null}
              </div>
              {isEnrolled ? (
                <div className="mb-5">
                  <CourseReviewForm
                    courseId={course.id}
                    courseHref={courseHref}
                    reviewId={currentStudentReview?.id}
                    initialRating={currentStudentReview?.rating}
                    initialComment={currentStudentReview?.comment}
                  />
                </div>
              ) : null}
              {course.reviews.length > 0 ? (
                <div className="grid gap-4">
                  {course.reviews.map((review) => (
                    <article
                      key={review.id}
                      className="card-modern quote-deco group p-5"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <StudentAvatar
                            name={
                              review.student?.profile?.full_name ?? "طالب تمكين"
                            }
                            src={
                              review.student?.photo_url ??
                              review.student?.profile?.avatar_url
                            }
                          />
                          <h3 className="group-hover:text-primary-700 truncate font-bold transition-colors duration-300">
                            {review.student?.profile?.full_name ?? "طالب تمكين"}
                          </h3>
                        </div>
                        <span
                          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-black"
                          style={{
                            background:
                              "linear-gradient(135deg, rgb(254 248 224 / 0.9), rgb(253 238 179 / 0.6))",
                            color: "var(--accent-700)",
                          }}
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="text-accent-500"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          {review.rating.toLocaleString("ar-EG")} / ٥
                        </span>
                      </div>
                      <p className="text-foreground/65 leading-7">
                        {review.comment ?? "تقييم بدون تعليق."}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="glass-panel text-foreground/60 rounded-xl px-5 py-10 text-center">
                  لا توجد تقييمات لهذا الكورس حتى الآن.
                </div>
              )}
            </ScrollReveal>
          </div>

          {/* Sidebar */}
          <aside className="min-w-0 space-y-5">
            <ScrollReveal>
              <div className="glass-panel-strong sticky top-24 rounded-2xl p-5">
                <h2 className="flex items-center gap-2 text-lg font-black">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--primary-600)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  حصة Preview
                </h2>
                {shouldShowPreviewPlayer && previewLesson ? (
                  <div className="mt-4 space-y-3">
                    <div
                      className="space-y-2 rounded-xl p-3"
                      style={{ background: "rgb(236 245 241 / 0.5)" }}
                    >
                      <p className="font-bold">{previewLesson.title}</p>
                      <p className="text-foreground/55 text-sm">
                        {formatDuration(previewLesson.duration)}
                      </p>
                    </div>
                    {previewLesson.bunny_video_id ? (
                      <BunnyVideoPlayer
                        lessonId={previewLesson.id}
                        title={previewLesson.title}
                        posterUrl={previewLesson.thumbnail_url}
                        lessonDurationSeconds={previewLesson.duration}
                        watermarkName={viewerName}
                        watermarkEmail={viewerEmail}
                        initialStatus={previewVideoStatus}
                      />
                    ) : null}
                  </div>
                ) : (
                  <p className="text-foreground/60 mt-4 text-sm leading-7">
                    {isEnrolled
                      ? "الحصص الكاملة متاحة لك في منطقة الدراسة."
                      : "لا توجد حصة مجانية محددة حاليًا."}
                  </p>
                )}
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <div className="glass-panel rounded-2xl p-5">
                <p className="eyebrow">ملخص سريع</p>
                <div className="mt-4 grid gap-3">
                  <SidebarStat
                    label="الحصص"
                    value={`${lessonCount.toLocaleString("ar-EG")} حصة`}
                  />
                  <SidebarStat
                    label="المدة"
                    value={
                      totalDuration > 0
                        ? formatDuration(totalDuration)
                        : "غير محددة"
                    }
                  />
                  {isEnrolled ? (
                    <SidebarStat
                      label="التقدم"
                      value={`${progressPercent.toLocaleString("ar-EG")}%`}
                    />
                  ) : null}
                  <SidebarStat
                    label="المراجعات"
                    value={`${course.reviews.length.toLocaleString("ar-EG")} تقييم`}
                  />
                </div>
              </div>
            </ScrollReveal>
          </aside>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function StudentAvatar({ name, src }: { name: string; src?: string | null }) {
  return (
    <div className="border-primary-100 bg-primary-50 text-primary-700 relative h-10 w-10 shrink-0 overflow-hidden rounded-full border text-sm font-black">
      {src ? (
        <Image
          src={src}
          alt={name}
          fill
          sizes="40px"
          className="object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center">
          {name.trim().charAt(0) || "ط"}
        </span>
      )}
    </div>
  );
}

function InfoTile({
  label,
  value,
  href,
  tone = "green",
}: {
  label: string;
  value: string;
  href?: string;
  tone?: "green" | "gold";
}) {
  const content = (
    <>
      <span className="text-foreground/55 block text-xs font-black">
        {label}
      </span>
      <span
        className={`mt-1 block truncate text-base font-black ${
          tone === "gold" ? "text-accent-700" : "text-primary-700"
        }`}
      >
        {value}
      </span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="glass-panel min-w-0 rounded-2xl px-4 py-3 hover:-translate-y-1"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="glass-panel min-w-0 rounded-2xl px-4 py-3">{content}</div>
  );
}

function LessonProgressBadge({
  isEnrolled,
  isStarted,
  isCompleted,
}: {
  isEnrolled: boolean;
  isStarted: boolean;
  isCompleted: boolean;
}) {
  if (!isEnrolled) {
    return null;
  }

  if (isCompleted) {
    return (
      <span className="bg-primary-50 text-primary-700 rounded-lg px-2.5 py-1 text-xs font-black">
        مكتملة
      </span>
    );
  }

  if (isStarted) {
    return (
      <span className="bg-accent-50 text-accent-700 rounded-lg px-2.5 py-1 text-xs font-black">
        بدأت
      </span>
    );
  }

  return (
    <span className="text-foreground/45 inline-flex items-center gap-2 text-xs font-black">
      لم تبدأ
    </span>
  );
}
function SidebarStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border bg-white/45 px-3 py-2.5">
      <span className="text-foreground/55 text-sm font-bold">{label}</span>
      <span className="font-black">{value}</span>
    </div>
  );
}
