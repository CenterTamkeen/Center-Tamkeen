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
| 5 | السلة والدفع عبر فوري (Cart & Fawry Payment) | دورة حياة الطلب | Phase 3, 4 |
| 6 | لوحة تحكم الإدارة (Admin Dashboard) | متابعة الطلبات والتقارير | Phase 5 |
| 7 | حماية الفيديوهات (VdoCipher Integration) | DRM ومشغل محمي | Phase 4, 5 |
| 8 | تكامل فوري (Fawry Integration) | الدفع التلقائي الكامل | Phase 5, 6 |
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
- [x] جدول `teachers`: `id`, `profile_id`, `slug` (unique), `bio`, `subject`, `avatar_url`, `is_active`.
- [x] جدول `courses`: `id`, `teacher_id`, `title`, `description`, `price`, `thumbnail_url`, `is_published`, `created_at`.
- [x] جدول `lessons`: `id`, `course_id`, `title`, `order_index`, `vdocipher_video_id`, `duration`, `is_free_preview`.
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

### 1.4 الـ Triggers والمنطق الخلفي

- [x] Trigger/Function: عند تحوّل `orders.status` إلى `completed` → إنشاء صفوف في `enrollments` لكل `order_item` + إضافة صف في `teacher_earnings`.
- [x] Function لتوليد `slug` تلقائي وفريد للمدرس.
- [x] إعداد Supabase Storage buckets (`avatars`, `thumbnails`) مع policies مناسبة.

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
- [x] زرار "أضف للسلة".
- [x] عرض التقييمات الخاصة بالكورس.

---

## Phase 4 — لوحة تحكم المدرس (Teacher Dashboard)

**الهدف:** نظام معزول بصلاحيات للمدرس لإدارة محتواه.

### 4.1 الهيكل العام

- [ ] Layout مخصص للوحة المدرس مع Sidebar.
- [ ] حماية المسار `/dashboard/teacher/**` (لازم role = teacher).

### 4.2 إدارة الكورسات

- [ ] صفحة عرض كورسات المدرس (List).
- [ ] إنشاء كورس جديد (العنوان، الوصف، السعر، الصورة المصغّرة).
- [ ] تعديل/حذف كورس.
- [ ] نشر/إخفاء كورس (`is_published` toggle).

### 4.3 إدارة الحصص (Lessons)

- [ ] إضافة حصة لكورس (العنوان، الفيديو).
- [ ] رفع الفيديو لـ VdoCipher وربط الـ `vdocipher_video_id` (يُستكمل في Phase 7).
- [ ] إعادة ترتيب الحصص (Drag & drop / order_index).
- [ ] تحديد حصة كـ Preview مجانية.

### 4.4 الكوبونات والإحصائيات

- [ ] إنشاء/إدارة كوبونات خصم خاصة بكورسات المدرس.
- [ ] لوحة إحصائيات: عدد الطلاب، إجمالي الأرباح المؤكدة (من `teacher_earnings` فقط).
- [ ] التأكيد إن الأرباح بتتحدّث فقط بعد `order.status = completed`.

---

## Phase 5 — السلة والدفع عبر فوري (Cart & Fawry Payment)

**الهدف:** دورة حياة الطلب من السلة لحد إنشاء طلب `pending` وتوليد رقم فوري المرجعي.

### 5.1 السلة (`/cart`)

- [ ] إضافة/إزالة كورس من السلة (state management + persistence).
- [ ] منع إضافة كورس الطالب مشترك فيه بالفعل.
- [ ] عرض الإجمالي وتطبيق كوبون الخصم.
- [ ] التحقق من صلاحية الكوبون (تاريخ، حد الاستخدام).

### 5.2 صفحة الدفع (`/checkout`)

- [ ] عرض ملخص الطلب والإجمالي النهائي.
- [ ] Server Action لإنشاء `order` بحالة `pending` + `order_items`.
- [ ] استدعاء Fawry API لإنشاء الفاتورة وتوليد الرقم المرجعي (`fawry_ref_no`) وتخزينه.
- [ ] عرض الرقم المرجعي / Fawry Widget للطالب لإتمام السداد.
- [ ] صفحة تأكيد "طلبك في انتظار السداد عبر فوري" مع تعليمات الدفع.

### 5.3 بوابة الطالب (My Courses)

- [ ] صفحة "كورساتي" تعرض الكورسات المشترك بها (من `enrollments`).
- [ ] صفحة "طلباتي" تعرض حالة كل طلب (`pending` / `completed` / `rejected`) والرقم المرجعي لفوري + سبب الرفض إن وُجد.
- [ ] منع الوصول لمحتوى الكورس قبل ما الطلب يبقى `completed`.

---

## Phase 6 — لوحة تحكم الإدارة (Admin Dashboard)

**الهدف:** الإدارة المركزية لمراجعة الطلبات والتقارير المالية.

### 6.1 الهيكل والحماية

- [ ] Layout مخصص للأدمن مع Sidebar.
- [ ] حماية المسار `/dashboard/admin/**` (لازم role = admin).

### 6.2 إدارة المدرسين والمحتوى

- [ ] إضافة/إنشاء حساب مدرس وتوليد الـ slug تلقائيًا.
- [ ] تفعيل/إيقاف حساب مدرس.
- [ ] استعراض ومراجعة كل الكورسات في المنصة.

### 6.3 متابعة الطلبات (`/dashboard/admin/orders`)

- [ ] جدول بكل الطلبات مع فلترة بالحالة (`pending` / `completed` / `rejected`).
- [ ] عرض تفاصيل الطلب: بيانات الطالب، الرقم المرجعي لفوري، الكورسات، تاريخ السداد.
- [ ] الطلبات تُفعَّل تلقائياً عبر فوري webhook (بدون قبول يدوي).
- [ ] إجراء استثنائي: إلغاء/استرجاع طلب (refund) مع كتابة `rejection_reason` في الحالات الخاصة.
- [ ] (اختياري) إشعار للطالب عند تغيير حالة الطلب.

### 6.4 التقارير المالية

- [ ] إجمالي المبيعات الكلية.
- [ ] الكوبونات المستخدمة وقيمة الخصومات.
- [ ] أرباح سنتر "تمكين" (نسبة السنتر من المبيعات).
- [ ] تقرير أرباح كل مدرس.

---

## Phase 7 — حماية الفيديوهات (VdoCipher Integration)

**الهدف:** تأمين الفيديوهات بالـ DRM ومشغّل محمي.

- [ ] إنشاء حساب VdoCipher وأخذ الـ API Secret.
- [ ] Server Action/Route لرفع الفيديوهات لـ VdoCipher من لوحة المدرس.
- [ ] حفظ الـ `vdocipher_video_id` في جدول `lessons`.
- [ ] Endpoint خلفي لإنشاء OTP + playbackInfo (مع التحقق إن الطالب مشترك في الكورس).
- [ ] دمج مشغّل VdoCipher في صفحة الكورس داخل بوابة الطالب.
- [ ] تفعيل العلامة المائية المتحركة (Dynamic Watermark) باسم/إيميل الطالب.
- [ ] التأكد إن الفيديو ميتشغّلش إلا لو في `enrollment` صالح.

---

## Phase 8 — تكامل فوري (Fawry Payment Integration)

**الهدف:** تفعيل الدفع التلقائي الكامل عبر بوابة فوري.

- [ ] إنشاء حساب/Merchant على فوري وأخذ المفاتيح (`merchant_code`, `security_key`).
- [ ] إعداد متغيرات البيئة الخاصة بفوري في `.env.local` و Vercel.
- [ ] ربط Fawry API لإنشاء الفاتورة وتوليد الرقم المرجعي (مستخدَم في Phase 5.2).
- [ ] فصل منطق التفعيل (Decoupled): التفعيل يعتمد بس على تحوّل الحالة لـ `completed` (تم في Phase 1).
- [ ] إنشاء مسار الـ webhook `app/api/v1/payments/fawry-webhook/route.ts`.
- [ ] التحقق من توقيع فوري (signature verification) قبل قبول أي تحديث.
- [ ] منطق الـ webhook لتحديث `orders.status = completed` عند تأكيد السداد (يشغّل الـ Trigger اللي يفتح الكورس).
- [ ] اختبار بيئة الـ Sandbox الخاصة بفوري end-to-end قبل الإنتاج.

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
