# خطة تنفيذ منصة "تمكين" (Project Roadmap & Phases)

> هذا الملف بيقسّم المشروع لمراحل (Phases) متسلسلة، وكل مرحلة جواها تاسكات مفصّلة قابلة للتنفيذ والمتابعة.
> استخدم الـ checkboxes لمتابعة التقدّم: `[ ]` لسه، `[x]` خلصت.

## فهرس المراحل

| # | المرحلة | الهدف الرئيسي | الاعتمادية |
| --- | --- | --- | --- |
| 0 | تجهيز البيئة والأساسات (Project Setup) | إعداد المشروع والأدوات | — |
| 1 | قاعدة البيانات والأمان (Database & RLS) | تصميم الـ Schema وعزل البيانات | Phase 0 |
| 2 | المصادقة والصلاحيات (Auth & Roles) | تسجيل الدخول ونظام الأدوار | Phase 1 |
| 3 | واجهة الطلاب (Student Storefront) | الصفحات العامة والتصفح | Phase 1, 2 |
| 4 | لوحة تحكم المدرس (Teacher Dashboard) | إدارة المحتوى والكورسات | Phase 2, 3 |
| 5 | طلب الاشتراك والدفع لاحقًا (Course Requests & Future Payment) | دورة حياة الطلب الحالية وتجهيز الدفع | Phase 3, 4 |
| 6 | لوحة تحكم الإدارة (Admin Dashboard) | متابعة الطلبات والتقارير | Phase 5 |
| 7 | حماية الفيديوهات (Bunny Stream Integration) | رفع وتشغيل فيديو مؤمن | Phase 4, 5 |
| 8 | تكامل بوابة دفع مستقبلية | الدفع التلقائي الكامل | Phase 5, 6 |
| 9 | الاختبار والإطلاق (Testing & Deployment) | النشر على Vercel | الكل |

---

## Phase 0 — تجهيز البيئة والأساسات (Project Setup)

**الهدف:** تجهيز مشروع Next.js شغّال ومربوط بكل الأدوات الأساسية قبل ما نبدأ نبني features.

- [x] إنشاء مشروع Next.js (App Router) مع TypeScript.
- [x] تثبيت وإعداد Tailwind CSS.
- [x] ضبط الموقع ليكون **عربي بالكامل و RTL أساسي**: `<html lang="ar" dir="rtl">`، خط عربي مناسب، وكل المكوّنات تُبنى باتجاه RTL افتراضيًا (بدون نسخة إنجليزية).
- [x] إعداد بنية المجلدات (`app/`, `components/`, `lib/`, `types/`, `hooks/`).
- [x] إعداد ESLint + Prettier + Husky (pre-commit hooks).
- [x] إنشاء مشروع على Supabase وأخذ مفاتيح الـ API.
- [x] إعداد ملف `.env.local` مع المتغيرات (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
- [x] إنشاء Supabase clients (browser client + server client) في `lib/supabase`.
- [x] إعداد ريبو Git وربطه بـ GitHub.
- [x] إعداد ملف design tokens أساسي (ألوان، خطوط، spacing) متوافق مع هوية "تمكين".

---

## Phase 1 — قاعدة البيانات والأمان (Database Schema & RLS)

**الهدف:** تصميم الـ Schema الكامل مع تفعيل عزل البيانات (RLS) من البداية.

> تم تنفيذ Phase 1 كـ migration محلية في `supabase/migrations/20260614012854_phase_1_schema_rls.sql`، مع تحديث `types/database.ts`. الخطوة التالية هي تطبيق الـ SQL على مشروع Supabase أو تشغيله عبر Supabase CLI عند توفره.

### 1.1 تصميم الجداول (Tables)

- [x] جدول `profiles` (مرتبط بـ `auth.users`): `id`, `full_name` (رباعي), `role` (`student` | `teacher` | `admin`), `avatar_url`, `phone`.
- [x] جدول `students` (بيانات الطالب الإضافية، مرتبط بـ `profiles`): `id`, `profile_id`, `student_phone`, `father_phone`, `school_name`, `gender` (`male` | `female`), `grade` (`first_secondary` | `second_secondary` | `third_secondary`), `section` (`general` | `scientific` | `literary` | `science` | `mathematics`), `photo_url`.
- [x] جدول `teachers`: `id`, `profile_id`, `slug` (unique), `bio`, `subject`, `avatar_url`, `cover_url`, `is_active`.
- [x] جدول `courses`: `id`, `teacher_id`, `subject`, `title`, `description`, `price`, `target_grade`, `target_section`, `thumbnail_url`, `is_published`, `created_at`.
- [x] جدول `lessons`: `id`, `course_id`, `title`, `order_index`, `vdocipher_video_id` legacy، `bunny_video_id`, `video_provider`, `thumbnail_url`, `duration`, `is_free_preview`.
- [x] جدول `orders`: `id`, `student_id`, `total_amount`, `status` (`pending` | `completed` | `rejected`), `fawry_ref_no`, `rejection_reason`, `created_at`.
- [x] جدول `order_items`: `id`, `order_id`, `course_id`, `price_at_purchase`.
- [x] جدول `enrollments`: `id`, `student_id`, `course_id`, `order_id`, `enrolled_at`.
- [x] جدول `coupons`: `id`, `teacher_id`, `code`, `discount_type` (`percentage` | `fixed`), `discount_value`, `usage_limit`, `used_count`, `is_active`, `expires_at`.
- [x] جدول `reviews` (آراء الطلاب): `id`, `student_id`, `course_id`, `rating`, `comment`, `created_at`.
- [x] جدول `teacher_earnings` (أرباح المدرسين): `id`, `teacher_id`, `order_id`, `amount`, `created_at`.

### 1.2 العلاقات والـ Indexes

- [x] تعريف Foreign Keys بين كل الجداول.
- [x] إضافة Indexes على الأعمدة الأكثر استخدامًا في الفلترة (`teacher_id`, `course_id`, `student_id`, `status`, `slug`).
- [x] إضافة Unique constraints (مثل `slug`, `coupons.code` لكل مدرس).

### 1.3 تفعيل Row Level Security (RLS)

- [x] تفعيل RLS على كل الجداول الحساسة.
- [x] Policy: المدرس يقدر يقرأ/يعدّل كورساته وحصصه فقط.
- [x] Policy: الطالب يقدر يقرأ الكورسات المنشورة فقط، والحصص بتاعت الكورسات اللي مشترك فيها.
- [x] Policy: الطالب يقدر يقرأ طلباته (`orders`) الخاصة به فقط.
- [x] Policy: الأدمن عنده صلاحيات كاملة (عبر service role أو policy خاصة).
- [x] Policy: حماية الـ `enrollments` بحيث متتعملش إلا من خلال السيرفر بعد اكتمال الطلب.
- [x] Policy: حماية الحصص بحيث تظهر الـ Preview أو حصص الكورس المشترك فيه فقط للطالب.

### 1.4 الـ Triggers والمنطق الخلفي

- [x] Trigger/Function: عند تحوّل `orders.status` إلى `completed` → إنشاء صفوف في `enrollments` لكل `order_item` + إضافة صف في `teacher_earnings`.
- [x] Function لتوليد `slug` تلقائي وفريد للمدرس.
- [x] إعداد Supabase Storage buckets (`avatars`, `thumbnails`) مع policies مناسبة.
- [x] إضافة جداول/منطق داعم للإشعارات، حظر الطلاب، استهداف الكوبونات، وإعلانات الصفحة الرئيسية.

---

## Phase 2 — المصادقة والصلاحيات (Authentication & Roles)

**الهدف:** نظام تسجيل دخول آمن مع تمييز الأدوار (Role-Based Access).

- [x] إعداد Supabase Auth (Email/Password). _(يتطلب تفعيل Email/Password من Supabase Auth Dashboard عند التشغيل الفعلي)_
- [x] صفحة تسجيل الدخول (Login) بالإيميل والباسورد.
- [x] إعداد جلسات آمنة باستخدام HttpOnly Cookies (Supabase SSR).
- [x] بناء Middleware للتحقق من الجلسة وحماية المسارات (`/dashboard/**`).
- [x] منطق توجيه حسب الدور: `student` → بوابة الطالب، `teacher` → `/dashboard/teacher`، `admin` → `/dashboard/admin`.
- [x] صفحة "نسيت كلمة المرور" وإعادة التعيين.
- [x] صفحة تعديل الملف الشخصي (الاسم، الصورة، رقم الهاتف، باقي بيانات الطالب).
- [x] Helper functions للتحقق من الدور في الـ Server Components والـ Server Actions.

### 2.1 صفحة تسجيل الطالب (Student Sign Up)

فورم التسجيل بياخد البيانات دي (كلها مطلوبة) مع فالديشن على الكلاينت والسيرفر (Zod + React Hook Form):

- [x] **اسم الطالب (رباعي):** نص، مطلوب، 4 مقاطع على الأقل، حروف عربي/إنجليزي بس (بدون أرقام/رموز).
- [x] **رقم تليفون الطالب:** مطلوب، رقم مصري صحيح (11 رقم يبدأ بـ `01`)، نمط `^01[0-2,5]\d{8}$`.
- [x] **رقم تليفون الأب:** مطلوب، نفس فالديشن الموبايل المصري، ولازم يكون مختلف عن رقم الطالب.
- [x] **اسم المدرسة:** نص، مطلوب.
- [x] **النوع (Gender):** Select مطلوب — (ذكر `male` / أنثى `female`).
- [x] **السنة الدراسية (Grade):** Select مطلوب — (أولى ثانوي / تانية ثانوي / تالتة ثانوي).
- [x] **الشعبة (Section):** Select مطلوب ومرتبط بالسنة الدراسية (Dependent / Cascading):
  - أولى ثانوي → (عام `general`) فقط.
  - تانية ثانوي → (علمي `scientific` / أدبي `literary`).
  - تالتة ثانوي → (علمي علوم `science` / علمي رياضة `mathematics` / أدبي `literary`).
  - يتقفل/يتمسح اختيار الشعبة لو اتغيرت السنة، ويتم التحقق على السيرفر إن الشعبة متوافقة مع السنة.
- [x] **الإيميل:** مطلوب، صيغة إيميل صحيحة، وفريد (مش متسجّل قبل كده).
- [x] **الباسورد:** مطلوب، 8 حروف على الأقل، يحتوي حرف كبير وصغير ورقم على الأقل.
- [x] **تأكيد الباسورد:** مطلوب، لازم يطابق الباسورد بالظبط.
- [x] **صورة الطالب:** مطلوبة، صورة (jpg/png/webp)، حجم أقصى (مثلاً 2MB)، تترفع على Supabase Storage (`avatars`/`students`).
- [x] إظهار رسائل خطأ واضحة بالعربي تحت كل حقل.
- [x] عند نجاح التسجيل: إنشاء مستخدم في Supabase Auth + صف في `profiles` (role = `student`) + صف في `students` بالبيانات.
- [x] رفع صورة الطالب وحفظ الـ `photo_url`.
- [x] إرسال كود تحقق للبريد أثناء التسجيل عبر SMTP، والتحقق النهائي من تكرار الإيميل عند إنشاء مستخدم Supabase.

---

## Phase 3 — واجهة الطلاب (Student Storefront)

**الهدف:** الصفحات العامة اللي بيشوفها الزائر والطالب.

### 3.1 الصفحة الرئيسية (`/`)

- [x] Hero section تسويقي بهوية "تمكين".
- [x] قسم "أبرز المدرسين" (يسحب من `teachers` المفعّلين).
- [x] قسم "أحدث الكورسات".
- [x] قسم "آراء وتقييمات الطلاب" (من `reviews`).
- [x] Footer + Navbar متجاوبين (Responsive) مع دعم RTL.

### 3.2 صفحة استكشاف المواد (`/courses`)

- [x] عرض كل الكورسات المنشورة في شكل Grid (Course Cards).
- [x] فلترة بالبحث النصي (اسم المادة).
- [x] فلترة باسم المدرس.
- [x] فلترة/ترتيب بالسعر (من الأقل للأعلى والعكس).
- [x] Pagination أو Infinite scroll.
- [x] حالة فاضية (Empty state) لو مفيش نتائج.

### 3.3 صفحة المدرس (`/teachers/[slug]`)

- [x] جلب بيانات المدرس بالـ `slug` (SSR للـ SEO).
- [x] عرض الصورة والنبذة والمادة.
- [x] عرض كورسات المدرس فقط.
- [x] صفحة 404 مخصصة لو الـ slug مش موجود.

### 3.4 صفحة تفاصيل الكورس (`/courses/[id]`)

- [x] عرض تفاصيل الكورس والسعر وقائمة الحصص.
- [x] عرض حصة Preview مجانية لو متاحة.
- [x] زر طلب الكورس من صفحة التفاصيل.
- [x] عرض التقييمات الخاصة بالكورس.
- [x] منع تشغيل الحصص الكاملة لغير المشتركين، مع عرض حصة Preview إن وجدت.

---

## Phase 4 — لوحة تحكم المدرس (Teacher Dashboard)

**الهدف:** نظام معزول بصلاحيات للمدرس لإدارة محتواه.

### 4.1 الهيكل العام

- [x] Layout مخصص للوحة المدرس مع Sidebar.
- [x] حماية المسار `/dashboard/teacher/**` (لازم role = teacher).

### 4.2 إدارة الكورسات

- [x] صفحة عرض كورسات المدرس (List).
- [x] إنشاء كورس جديد (العنوان، الوصف، السعر، الصورة المصغّرة).
- [x] تعديل/حذف كورس.
- [x] نشر/إخفاء كورس (`is_published` toggle).

### 4.3 إدارة الحصص (Lessons)

- [x] إضافة حصة لكورس (العنوان، الفيديو).
- [x] رفع الفيديو إلى Bunny Stream من لوحة المدرس عبر TUS، وحفظ `bunny_video_id` داخليًا.
- [x] إعادة ترتيب الحصص (Drag & drop / order_index).
- [x] تحديد حصة كـ Preview مجانية.
- [x] تعديل/حذف/نقل/حذف جماعي للحصص، مع حذف فيديوهات Bunny غير المستخدمة.

### 4.4 الكوبونات والإحصائيات

- [x] إنشاء/إدارة كوبونات خصم خاصة بكورسات المدرس.
- [x] لوحة إحصائيات: عدد الطلاب، إجمالي الأرباح المؤكدة (من `teacher_earnings` فقط).
- [x] التأكيد إن الأرباح بتتحدّث فقط بعد `order.status = completed`.

---

## Phase 5 — طلب الاشتراك والدفع لاحقًا (Course Requests & Future Payment)

**الهدف:** دورة حياة الطلب الحالية من صفحة الكورس إلى قبول الأدمن، مع إبقاء schema جاهزًا لبوابة دفع لاحقًا.

### 5.1 السلة (`/cart`)

- [ ] إضافة/إزالة كورس من السلة (state management + persistence).
- [ ] منع إضافة كورس الطالب مشترك فيه بالفعل.
- [ ] عرض الإجمالي وتطبيق كوبون الخصم.
- [ ] التحقق من صلاحية الكوبون (تاريخ، حد الاستخدام).

### 5.2 طلب كورس واحد من صفحة التفاصيل

- [x] عرض سعر الكورس والإجمالي بعد الكوبون داخل صفحة التفاصيل.
- [x] Server Action لإنشاء `order` بحالة `pending` + `order_items`.
- [x] تطبيق كوبون مرتبط بالكورس والمدرس مع دعم استهداف طلاب محددين.
- [ ] منع إنشاء طلب `pending` مكرر لنفس الطالب والكورس.
- [ ] صفحة/رسالة متابعة أوضح بعد إنشاء الطلب.
- [ ] استدعاء بوابة دفع مستقبلية لإنشاء فاتورة وتوليد رقم مرجعي (`fawry_ref_no` أو ما يعادله).

### 5.3 بوابة الطالب (My Courses)

- [x] صفحة "كورساتي" تعرض الكورسات المشترك بها (من `enrollments`).
- [ ] صفحة "طلباتي" تعرض حالة كل طلب (`pending` / `completed` / `rejected`) والرقم المرجعي إن وُجد + سبب الرفض إن وُجد.
- [x] منع تشغيل محتوى الكورس الكامل قبل ما الطلب يبقى `completed` وينشئ `enrollment`.

---

## Phase 6 — لوحة تحكم الإدارة (Admin Dashboard)

**الهدف:** الإدارة المركزية لمراجعة الطلبات والتقارير المالية.

### 6.1 الهيكل والحماية

- [x] Layout مخصص للأدمن مع Sidebar.
- [x] حماية المسار `/dashboard/admin/**` (لازم role = admin).

### 6.2 إدارة المدرسين والمحتوى

- [x] إضافة/إنشاء حساب مدرس وتوليد الـ slug تلقائيًا من لوحة الأدمن.
- [x] تفعيل/إيقاف حساب مدرس.
- [x] استعراض ومراجعة كل الكورسات في المنصة.

### 6.3 متابعة الطلبات (`/dashboard/admin/orders`)

- [x] جدول بكل الطلبات مع فلترة بالحالة (`pending` / `completed` / `rejected`).
- [x] عرض تفاصيل الطلب: بيانات الطالب، الكورسات، تاريخ الطلب، والرقم المرجعي إن وجد.
- [x] قبول الطلب يدويًا وتحويله إلى `completed` لتفعيل الكورس.
- [x] رفض الطلب مع كتابة `rejection_reason`.
- [ ] الطلبات تُفعَّل تلقائياً عبر Webhook دفع مستقبلًا (بدون قبول يدوي).
- [x] إشعار للطالب عند اكتمال الطلب عبر trigger الإشعارات.

### 6.4 التقارير المالية

- [x] إجمالي المبيعات الكلية.
- [x] الكوبونات المستخدمة وقيمة الخصومات.
- [x] أرباح سنتر "تمكين" (نسبة السنتر من المبيعات).
- [x] تقرير أرباح كل مدرس.

---

## Phase 7 — حماية الفيديوهات (Bunny Stream Integration)

**الهدف:** رفع الفيديوهات من لوحة المدرس وتشغيلها للطلاب بصلاحيات واضحة وروابط Bunny مؤقتة.

- [x] إعداد متغيرات Bunny Stream (`BUNNY_STREAM_LIBRARY_ID`, `BUNNY_STREAM_API_KEY`, `BUNNY_STREAM_TOKEN_SECURITY_KEY`).
- [x] Route لتجهيز TUS upload credentials للمدرس بعد التأكد أنه مالك الكورس.
- [x] رفع الفيديو من لوحة المدرس مباشرة إلى Bunny Stream بدون إدخال ID يدوي.
- [x] حفظ `bunny_video_id` في جدول `lessons`.
- [x] Endpoint خلفي `/api/bunny/playback` لإصدار signed embed URL بعد التحقق من `lessonId`.
- [x] Endpoint `/api/bunny/video-status` محمي: `lessonId` للعرض المصرح، و`videoId` للمدرس/الأدمن أثناء الرفع.
- [x] دمج مشغّل Bunny في صفحة الكورس للـ Preview أو للطالب المشترك.
- [x] التأكد إن الفيديو الكامل ميتشغّلش إلا لو في `enrollment` صالح.
- [ ] اختبار إعدادات Bunny في production بعد تفعيل Embed View Token Authentication.
- [ ] دراسة watermark أو DRM أقوى لو اتطلب مستوى حماية أعلى من Bunny signed embeds.

---

## Phase 8 — تكامل بوابة دفع مستقبلية

**الهدف:** تفعيل الدفع التلقائي الكامل بعد اختيار بوابة الدفع النهائية.

- [ ] اختيار بوابة الدفع النهائية وآلية الدفع المطلوبة.
- [ ] إنشاء حساب/Merchant وأخذ المفاتيح.
- [ ] إعداد متغيرات البيئة الخاصة بالبوابة في `.env.local` و Vercel.
- [ ] ربط API لإنشاء الفاتورة وتوليد الرقم المرجعي.
- [ ] فصل منطق التفعيل (Decoupled): التفعيل يعتمد بس على تحوّل الحالة لـ `completed` (تم في Phase 1).
- [ ] إنشاء مسار Webhook مناسب للبوابة المختارة.
- [ ] التحقق من توقيع الـ Webhook قبل قبول أي تحديث.
- [ ] منطق الـ webhook لتحديث `orders.status = completed` عند تأكيد السداد (يشغّل الـ Trigger اللي يفتح الكورس).
- [ ] اختبار بيئة Sandbox end-to-end قبل الإنتاج.

---

## Phase 9 — الاختبار والإطلاق (Testing & Deployment)

**الهدف:** التأكد من جودة المنصة ونشرها للإنتاج.

- [ ] كتابة اختبارات للمنطق الحرج (دورة حياة الطلب، فتح الكورس، حساب الأرباح).
- [ ] اختبار سيناريوهات RLS (مدرس مش بيوصل لبيانات مدرس تاني / طالب مش بيوصل لكورس مش مشترك فيه).
- [ ] اختبار التجاوب (Responsive) على الموبايل والتابلت والديسكتوب.
- [ ] مراجعة الأداء والـ SEO (metadata, sitemap, lighthouse).
- [ ] مراجعة أمان (env secrets, service role key مش متسرّب للـ client).
- [ ] إعداد الدومين على Vercel + شهادة SSL.
- [ ] إعداد متغيرات البيئة في Vercel للإنتاج.
- [ ] نشر نسخة الإنتاج (Production) + smoke testing بعد النشر.
- [ ] تجهيز بيانات أولية (Seed) لأول مجموعة مدرسين/كورسات.
