# API Documentation

## Global System Architecture & Security Responses (Production Readiness)

### Request Correlation & Traceability (`X-Request-ID`)
- **Header in Responses:** Every API response now returns an `X-Request-ID` header containing a UUID.
- **Error Responses:** In case of any error (HTTP 400, 401, 403, 404, 409, 500), the generated JSON payload explicitly embeds `"requestId": "<uuid>"` to allow developers and system admins to trace logs precisely via Winston structured JSON logs.

### Rate Limiting (Protection Against DDoS & Brute-Force)
- **Global Limits:** Limited to 100 requests per IP every 15 minutes.
- **Authentication Routes Limit (`/api/auth/login`, `/api/auth/register`, `/api/auth/change-password`):** Strict maximum of 10 attempts per IP every 15 minutes.
- **Exceeding Limits Response (HTTP 429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too many requests, please try again later.",
  "requestId": "a1b2c3d4-e5f6-7890-a1b2-c3d4e5f67890"
}
```

---

## API and Database Health Check

- **Endpoint:** `GET /api/health` (also mounted at `GET /health` for Kubernetes/Docker/PM2 probes)
- **Description:** يفحص حالة تشغيل الخادم واتصاله الفعلي بقاعدة بيانات PostgreSQL عبر استعلام Prisma. في حال فقدان الاتصال بقاعدة البيانات يُرجع السيرفر حالة 503 Service Unavailable لحجب المحادثات التالفة عبر Load Balancers.
- **Token Required:** No (Public Monitoring Probe)
- **Headers:** None
- **Response:**
  - **200 OK (Healthy & Connected):**
```json
{
  "status": "ok",
  "database": "connected",
  "uptime": 123.45,
  "timestamp": "2026-07-25T16:00:00.000Z",
  "requestId": "uuid"
}
```
  - **503 Service Unavailable (Database Disconnected):**
```json
{
  "status": "error",
  "database": "disconnected",
  "uptime": 123.45,
  "timestamp": "2026-07-25T16:00:00.000Z",
  "requestId": "uuid"
}
```

---

## Get user profile

- **Endpoint:** `GET /api/user/profile`
- **Description:** يجلب بيانات الملف الشخصي الكاملة للمستخدم الحالي (مثل الاسم، الإيميل، الصورة، والسيرة الذاتية). نحتاجه في الفرونت اند لصفحة (حسابي/الملف الشخصي) لعرض بيانات المستخدم وإمكانية تعديلها.
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Request Body:** None
- **Response:**
  - **200**: Profile retrieved successfully

---

## Update user profile

- **Endpoint:** `PUT /api/user/profile`
- **Description:** يسمح للمستخدم بتحديث بيانات ملفه الشخصي (الاسم، السيرة الذاتية، الصورة الشخصية). نحتاجه في الفرونت اند بداخل صفحة (إعدادات الحساب) ليتمكن المستخدم من حفظ تعديلاته.
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Request Body:**
```json
// Check Schema
```
- **Response:**
  - **200**: Profile updated successfully

---

## Verify a certificate (Public)

- **Endpoint:** `GET /api/student-dashboard/certificates/verify/{credentialId}`
- **Description:** للتحقق من صحة شهادة الطالب باستخدام رمز الاعتماد (Credential ID).

**English Details:** مسار عام (Public Endpoint) لا يتطلب تسجيل دخول. وظيفته هي التحقق من صحة أي شهادة مصدرة من المنصة باستخدام رقم الاعتماد (Credential ID). يمكن استخدامه من قبل أصحاب العمل أو أي جهة للتأكد من أن الشهادة صحيحة ومسجلة في النظام.
- **Token Required:** No
- **Headers:**
  - None
- **Path Parameters:**
  - `credentialId` (string): 
- **Request Body:** None
- **Response:**
  - **200**: Certificate is valid

---

## Get dashboard overview metrics

- **Endpoint:** `GET /api/student-dashboard/overview`
- **Description:** يجلب ملخص أداء الطالب (Overview) لإحصائيات الإنجاز السريعة.

**English Details:** يجلب ملخص أداء الطالب (Overview) ليتم عرضه في أعلى لوحة التحكم (Dashboard). يعيد إحصائيات سريعة مثل عدد الكورسات المكتملة، الكورسات قيد الدراسة، وإجمالي الشهادات التي حصل عليها الطالب. مفيد لواجهة المستخدم لتوفير نظرة سريعة على الإنجازات.
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Request Body:** None
- **Response:**
  - **200**: Overview metrics retrieved

---

## Get enrolled courses

- **Endpoint:** `GET /api/student-dashboard/courses`
- **Description:** يجلب جميع الكورسات التي سجل فيها الطالب (My Courses).

**English Details:** يجلب جميع الكورسات التي سجل فيها الطالب (My Courses) مع تفاصيل التقدم (Progress Percentage) الخاص بكل كورس. يستخدم في الفرونت اند لعرض مكتبة الكورسات الخاصة بالطالب.
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Request Body:** None
- **Response:**
  - **200**: Enrolled courses retrieved

---

## Get recently watched courses

- **Endpoint:** `GET /api/student-dashboard/continue-watching`
- **Description:** يجلب أحدث الكورسات التي يتفاعل معها الطالب حالياً لاستكمالها (Continue Watching).

**English Details:** يجلب أحدث الكورسات التي يتفاعل معها الطالب حالياً مع تحديد آخر درس شاهده للعودة إليه مباشرة (Resume). يستخدم لعرض عنصر تحكم مباشر (Continue Watching) في لوحة التحكم لتسهيل الاستكمال.
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Request Body:** None
- **Response:**
  - **200**: Continue watching data retrieved

---

## Get earned certificates

- **Endpoint:** `GET /api/student-dashboard/certificates`
- **Description:** يجلب قائمة بجميع الشهادات التي حصل عليها الطالب (شهاداتي).

**English Details:** يجلب قائمة بجميع الشهادات التي حصل عليها الطالب. يُستخدم في لوحة تحكم الطالب بداخل قسم (شهاداتي) لتنزيلها أو مشاركتها.
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Request Body:** None
- **Response:**
  - **200**: Certificates retrieved

---

## Claim a new certificate

- **Endpoint:** `POST /api/student-dashboard/certificates/{courseId}`
- **Description:** يقوم بإنشاء شهادة جديدة للطالب بعد إتمامه الكورس بنسبة 100%.

**English Details:** يقوم بإنشاء شهادة جديدة للطالب لكورس محدد، ولكن فقط إذا كان نسبة تقدمه في الكورس 100%. يستخدم عند ضغط الطالب على زر (استخراج الشهادة) بعد إنهاء الكورس.
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Path Parameters:**
  - `courseId` (string): 
- **Request Body:** None
- **Response:**
  - **201**: Certificate claimed successfully

---

## Create a new section

- **Endpoint:** `POST /api/courses/{courseId}/sections`
- **Description:** بناء قسم جديد للكورس (مثل: الفصل الأول).

**English Details:** Create a new section
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Path Parameters:**
  - `courseId` (string): Course UUID
- **Request Body:**
```json
{
  "title": "string",
  "sequence_order": "integer"
}
```
- **Response:**
  - **201**: Section created successfully
  - **400**: Validation error or Duplicate title
  - **401**: Unauthorized
  - **403**: Forbidden (Not instructor or admin)
  - **404**: Course not found
  - **500**: Server error

---

## Update a section

- **Endpoint:** `PUT /api/courses/{courseId}/sections/{sectionId}`
- **Description:** تغيير مسمى القسم (تعديل).

**English Details:** Update a section
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Path Parameters:**
  - `courseId` (string): Course UUID
  - `sectionId` (string): Section UUID
- **Request Body:**
```json
{
  "title": "string",
  "sequence_order": "integer"
}
```
- **Response:**
  - **200**: Section updated successfully
  - **400**: Validation error or Duplicate title
  - **401**: Unauthorized
  - **403**: Forbidden (Not instructor or admin)
  - **404**: Course or Section not found
  - **500**: Server error

---

## Delete a section

- **Endpoint:** `DELETE /api/courses/{courseId}/sections/{sectionId}`
- **Description:** حذف القسم بالكامل (مدربين).

**English Details:** Delete a section
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Path Parameters:**
  - `courseId` (string): Course UUID
  - `sectionId` (string): Section UUID
- **Request Body:** None
- **Response:**
  - **200**: Section deleted successfully
  - **400**: Validation error
  - **401**: Unauthorized
  - **403**: Forbidden (Not instructor or admin)
  - **404**: Course or Section not found
  - **500**: Server error

---

## Add a review to a course

- **Endpoint:** `POST /api/courses/{id}/reviews`
- **Description:** السماح للطالب فقط بتقييم الكورس من 1 إلى 5 نجوم.

**English Details:** Add a review to a course
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Path Parameters:**
  - `id` (string): Course UUID
- **Request Body:**
```json
{
  "rating": "integer",
  "comment": "string"
}
```
- **Response:**
  - **201**: Review created successfully
  - **400**: Validation error
  - **401**: Unauthorized (Token missing/invalid)
  - **403**: Forbidden (Not a student, not enrolled, or already reviewed)
  - **404**: Course not found

---

## Get all reviews for a course

- **Endpoint:** `GET /api/courses/{id}/reviews`
- **Description:** Get all reviews for a course
- **Token Required:** No
- **Headers:**
  - None
- **Path Parameters:**
  - `id` (string): Course UUID
- **Query Parameters:**
  - `page` (integer): Page number
  - `limit` (integer): Number of reviews per page
- **Request Body:** None
- **Response:**
  - **200**: Reviews retrieved successfully
  - **400**: Validation error
  - **404**: Course not found

---

## Update an existing review

- **Endpoint:** `PUT /api/courses/{id}/reviews/{reviewId}`
- **Description:** Update an existing review
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Path Parameters:**
  - `id` (string): Course UUID
  - `reviewId` (string): Review UUID
- **Request Body:**
```json
{
  "rating": "integer",
  "comment": "string"
}
```
- **Response:**
  - **200**: Review updated successfully
  - **400**: Validation error
  - **401**: Unauthorized
  - **403**: Forbidden (Not the owner of the review)
  - **404**: Review not found

---

## Delete a review

- **Endpoint:** `DELETE /api/courses/{id}/reviews/{reviewId}`
- **Description:** Delete a review
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Path Parameters:**
  - `id` (string): Course UUID
  - `reviewId` (string): Review UUID
- **Request Body:** None
- **Response:**
  - **200**: Review deleted successfully
  - **400**: Validation error
  - **401**: Unauthorized
  - **403**: Forbidden (Not the owner of the review)
  - **404**: Review not found
  - **500**: Server error

---

## Get unread notification count

- **Endpoint:** `GET /api/notifications/unread-count`
- **Description:** يقوم هذا الـ API بإرجاع عدد الإشعارات غير المقروءة فقط. تم إنشاؤه لعمل استعلام خفيف (Light polling) لتحديث أيقونة الجرس (Badge) في الفرونت اند بدون الحاجة لتحميل لستة الإشعارات كاملة، مما يوفر استهلاك البيانات ويحسن الأداء.
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Request Body:** None
- **Response:**
  - **200**: Unread count retrieved

---

## Mark all notifications as read

- **Endpoint:** `PATCH /api/notifications/read-all`
- **Description:** يقوم بتغيير حالة كل الإشعارات غير المقروءة لتصبح مقروءة بضغطة زر واحدة. نحتاجه في الفرونت اند لزر (Mark all as read) لتنظيف القائمة ويرجع الـ unread_count كـ 0.
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Request Body:** None
- **Response:**
  - **200**: All marked as read successfully

---

## Get paginated notifications

- **Endpoint:** `GET /api/notifications`
- **Description:** يجلب تاريخ الإشعارات الخاصة بالمستخدم بنظام الـ Pagination. كما يسمح بالفلترة عبر النوع (type) أو الأهمية (priority) أو حالة القراءة. تم إنشاؤه ليعرض الإشعارات في صفحة الإشعارات الكاملة أو قائمة الـ Dropdown في الفرونت اند، مع استبعاد الإشعارات منتهية الصلاحية.
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Query Parameters:**
  - `page` (integer): Page number
  - `limit` (integer): Number of items per page
  - `type` (string): Filter by NotificationType (e.g., SYSTEM, COURSE)
  - `is_read` (boolean): Filter by read status
  - `priority` (string): Filter by priority (LOW, MEDIUM, HIGH)
- **Request Body:** None
- **Response:**
  - **200**: Notifications list retrieved

---

## Delete all notifications

- **Endpoint:** `DELETE /api/notifications`
- **Description:** يمسح كل إشعارات المستخدم بشكل نهائي. مخصص لزر (Clear All) في الفرونت اند لتفريغ صندوق الإشعارات بالكامل.
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Request Body:** None
- **Response:**
  - **200**: All notifications deleted

---

## Get notification details

- **Endpoint:** `GET /api/notifications/{id}`
- **Description:** يجلب تفاصيل إشعار محدد. تم تحسين هذا الـ API بحيث لو كان الإشعار غير مقروء وقام المستخدم بفتحه، سيقوم هذا الـ API تلقائياً بتحديث حالته إلى مقروء ويرجع الـ unread_count الجديد، مما يوفر على الفرونت اند إرسال طلب (Request) إضافي لتحديث الحالة.
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Path Parameters:**
  - `id` (string): 
- **Request Body:** None
- **Response:**
  - **200**: Notification details
  - **404**: Notification not found or expired

---

## Delete a single notification

- **Endpoint:** `DELETE /api/notifications/{id}`
- **Description:** يمسح إشعار واحد فقط نهائياً من قاعدة البيانات.
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Path Parameters:**
  - `id` (string): 
- **Request Body:** None
- **Response:**
  - **200**: Notification deleted

---

## Mark a single notification as read

- **Endpoint:** `PATCH /api/notifications/{id}/read`
- **Description:** يحول حالة إشعار واحد فقط ليكون مقروء مع إرجاع العدد المتبقي للإشعارات غير المقروءة. يمكن استخدامه لو كان هناك زر صغير (علامة مقروء) بجانب الإشعار ليتم النقر عليه بدون الدخول لصفحة التفاصيل.
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Path Parameters:**
  - `id` (string): 
- **Request Body:** None
- **Response:**
  - **200**: Marked as read

---

## Create a new lesson

- **Endpoint:** `POST /api/courses/{courseId}/sections/{sectionId}/lessons`
- **Description:** إضافة درس جديد وتحديد ترتيبه (Sequence).

**English Details:** Create a new lesson
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Path Parameters:**
  - `courseId` (string): Course UUID
  - `sectionId` (string): Section UUID
- **Request Body:**
```json
{
  "title": "string",
  "duration": "integer",
  "video_url": "string",
  "is_free_preview": "boolean",
  "sequence_order": "integer"
}
```
- **Response:**
  - **201**: Lesson created successfully
  - **400**: Validation error or duplicate title
  - **401**: Unauthorized
  - **403**: Forbidden (Not instructor or admin)
  - **404**: Course or section not found
  - **500**: Server error

---

## Update a lesson

- **Endpoint:** `PATCH /api/courses/{courseId}/sections/{sectionId}/lessons/{lessonId}`
- **Description:** تعديل تفاصيل أو فيديو الدرس.

**English Details:** Update a lesson
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Path Parameters:**
  - `courseId` (string): 
  - `sectionId` (string): 
  - `lessonId` (string): 
- **Request Body:**
```json
{
  "title": "string",
  "duration": "integer",
  "video_url": "string",
  "is_free_preview": "boolean",
  "sequence_order": "integer"
}
```
- **Response:**
  - **200**: Lesson updated successfully
  - **400**: Validation error or duplicate title
  - **401**: Unauthorized
  - **403**: Forbidden
  - **404**: Course, Section, or Lesson not found
  - **500**: Server error

---

## Delete a lesson

- **Endpoint:** `DELETE /api/courses/{courseId}/sections/{sectionId}/lessons/{lessonId}`
- **Description:** حذف الدرس بشكل نهائي.

**English Details:** Delete a lesson
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Path Parameters:**
  - `courseId` (string): 
  - `sectionId` (string): 
  - `lessonId` (string): 
- **Request Body:** None
- **Response:**
  - **200**: Lesson deleted successfully
  - **400**: Validation error
  - **401**: Unauthorized
  - **403**: Forbidden
  - **404**: Course, Section, or Lesson not found
  - **500**: Server error

---

## Get instructor profile

- **Endpoint:** `GET /api/instructor/profile`
- **Description:** Get instructor profile
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Request Body:** None
- **Response:**
  - **200**: Profile data

---

## Get instructor dashboard overview

- **Endpoint:** `GET /api/instructor/dashboard`
- **Description:** Get instructor dashboard overview
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Request Body:** None
- **Response:**
  - **200**: Dashboard stats

---

## Get courses taught by the instructor

- **Endpoint:** `GET /api/instructor/courses`
- **Description:** Get courses taught by the instructor
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Query Parameters:**
  - `page` (integer): 
  - `limit` (integer): 
  - `search` (string): 
  - `sort` (string): 
  - `order` (string): 
- **Request Body:** None
- **Response:**
  - **200**: Paginated courses

---

## Get specific course statistics

- **Endpoint:** `GET /api/instructor/courses/{courseId}/stats`
- **Description:** Get specific course statistics
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Path Parameters:**
  - `courseId` (string): 
- **Request Body:** None
- **Response:**
  - **200**: Course statistics

---

## Get revenue statistics

- **Endpoint:** `GET /api/instructor/revenue`
- **Description:** Get revenue statistics
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Query Parameters:**
  - `period` (string): 
- **Request Body:** None
- **Response:**
  - **200**: Revenue statistics

---

## Get students enrolled in instructor's courses

- **Endpoint:** `GET /api/instructor/students`
- **Description:** Get students enrolled in instructor's courses
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Query Parameters:**
  - `page` (string): 
  - `limit` (string): 
  - `search` (string): 
  - `sort` (string): 
  - `order` (string): 
- **Request Body:** None
- **Response:**
  - **200**: Paginated students

---

## Get latest enrollments

- **Endpoint:** `GET /api/instructor/enrollments/latest`
- **Description:** Get latest enrollments
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Query Parameters:**
  - `page` (string): 
  - `limit` (string): 
- **Request Body:** None
- **Response:**
  - **200**: Latest enrollments

---

## Get reviews for instructor's courses

- **Endpoint:** `GET /api/instructor/reviews`
- **Description:** Get reviews for instructor's courses
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Query Parameters:**
  - `page` (string): 
  - `limit` (string): 
  - `search` (string): 
  - `sort` (string): 
  - `order` (string): 
- **Request Body:** None
- **Response:**
  - **200**: Paginated reviews

---

## Get all home page data (Aggregated)

- **Endpoint:** `GET /api/home`
- **Description:** هذا الـ API مخصص لجلب كافة بيانات الصفحة الرئيسية في طلب واحد لتقليل عدد الطلبات (Requests).

**English Details:** هذا الـ API مخصص لجلب كافة بيانات الصفحة الرئيسية (Hero, Categories, Featured Courses, Top Instructors, Statistics, Testimonials) في طلب واحد (Single Request). تم إنشاؤه لتقليل عدد الـ Requests من الفرونت اند وتحسين سرعة تحميل الصفحة الرئيسية (Fast Initial Load).
- **Token Required:** No
- **Headers:**
  - None
- **Request Body:** None
- **Response:**
  - **200**: Home data retrieved successfully

---

## Get Hero section data

- **Endpoint:** `GET /api/home/hero`
- **Description:** يجلب بيانات القسم الأول في الصفحة الرئيسية (Hero Section) والذي يتضمن العنوان الرئيسي، الوصف، والروابط السريعة. مخصص للفرونت اند في حال الرغبة بتحميل هذا الجزء بشكل منفصل.
- **Token Required:** No
- **Headers:**
  - None
- **Request Body:** None
- **Response:**
  - **200**: Hero data retrieved

---

## Get top categories

- **Endpoint:** `GET /api/home/categories`
- **Description:** يجلب قائمة بأهم التصنيفات (Categories) مع عدد الكورسات المتاحة في كل تصنيف. يستخدم في الصفحة الرئيسية لعرض الأقسام الشائعة للطلاب للبحث والتصفح السريع.
- **Token Required:** No
- **Headers:**
  - None
- **Request Body:** None
- **Response:**
  - **200**: Categories retrieved

---

## Get featured courses

- **Endpoint:** `GET /api/home/featured-courses`
- **Description:** يجلب قائمة بأفضل أو أحدث الكورسات المميزة. يستخدم في الفرونت اند لعرض شريط تمرير (Carousel) يلفت انتباه الطالب للكورسات الأعلى تقييماً أو الأكثر مبيعاً.
- **Token Required:** No
- **Headers:**
  - None
- **Request Body:** None
- **Response:**
  - **200**: Featured courses retrieved

---

## Get top instructors

- **Endpoint:** `GET /api/home/top-instructors`
- **Description:** يجلب بيانات أفضل المدربين في المنصة بناءً على التقييمات وعدد الطلاب. مفيد في الصفحة الرئيسية لزيادة الثقة (Social Proof) وتشجيع الطلاب على التسجيل.
- **Token Required:** No
- **Headers:**
  - None
- **Request Body:** None
- **Response:**
  - **200**: Top instructors retrieved

---

## Get platform statistics

- **Endpoint:** `GET /api/home/statistics`
- **Description:** يجلب إحصائيات عامة عن المنصة مثل (إجمالي الكورسات، عدد الطلاب النشطين، إجمالي المدربين). تُستخدم في الفرونت اند في قسم الأرقام لتعزيز مصداقية المنصة أمام الزوار.
- **Token Required:** No
- **Headers:**
  - None
- **Request Body:** None
- **Response:**
  - **200**: Statistics retrieved

---

## Get student testimonials

- **Endpoint:** `GET /api/home/testimonials`
- **Description:** يجلب آراء وتقييمات الطلاب السابقين. يستخدم في الفرونت اند لزيادة الثقة والمبيعات (Testimonials Section).
- **Token Required:** No
- **Headers:**
  - None
- **Request Body:** None
- **Response:**
  - **200**: Testimonials retrieved

---

## Get FAQs

- **Endpoint:** `GET /api/home/faq`
- **Description:** يجلب الأسئلة الشائعة وإجاباتها. يستخدم في صفحة الأسئلة الشائعة أو في نهاية الصفحة الرئيسية للرد على استفسارات الزوار المعتادة.
- **Token Required:** No
- **Headers:**
  - None
- **Request Body:** None
- **Response:**
  - **200**: FAQs retrieved

---

## Get footer links

- **Endpoint:** `GET /api/home/footer`
- **Description:** يجلب الروابط السريعة، معلومات التواصل، وروابط السوشيال ميديا الخاصة بأسفل الصفحة (Footer).
- **Token Required:** No
- **Headers:**
  - None
- **Request Body:** None
- **Response:**
  - **200**: Footer data retrieved

---

## Get all favorite courses for the student

- **Endpoint:** `GET /api/favorites`
- **Description:** Get all favorite courses for the student
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Request Body:** None
- **Response:**
  - **200**: List of favorite courses retrieved successfully
  - **401**: Unauthorized
  - **403**: Forbidden

---

## Add a course to favorites

- **Endpoint:** `POST /api/favorites/{courseId}`
- **Description:** إضافة الكورس للحفظ لشرائه لاحقاً.

**English Details:** Add a course to favorites
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Path Parameters:**
  - `courseId` (string): 
- **Request Body:** None
- **Response:**
  - **200**: Course added to favorites successfully
  - **401**: Unauthorized
  - **404**: Course not found or not published

---

## Remove a course from favorites

- **Endpoint:** `DELETE /api/favorites/{courseId}`
- **Description:** إلغاء الكورس من المفضلة.

**English Details:** Remove a course from favorites
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Path Parameters:**
  - `courseId` (string): 
- **Request Body:** None
- **Response:**
  - **200**: Course removed from favorites successfully
  - **401**: Unauthorized

---

## Check if a course is in favorites

- **Endpoint:** `GET /api/favorites/{courseId}/status`
- **Description:** Check if a course is in favorites
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Path Parameters:**
  - `courseId` (string): 
- **Request Body:** None
- **Response:**
  - **200**: Favorite status retrieved successfully
  - **401**: Unauthorized

---

## Create a new course

- **Endpoint:** `POST /api/courses`
- **Description:** بدء إضافة كورس جديد (مسودة) للمدرب.

**English Details:** Create a new course
- **Token Required:** No
- **Headers:**
  - `Content-Type: application/json`
- **Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "instructor_id": "string",
  "category_id": "string",
  "price": "number",
  "discount_price": "number",
  "level": "string",
  "language": "string",
  "status": "string"
}
```
- **Response:**
  - **201**: Course created successfully
  - **400**: Validation error or Instructor/Category not found

---

## Get all courses with pagination, search, and filters

- **Endpoint:** `GET /api/courses`
- **Description:** Get all courses with pagination, search, and filters
- **Token Required:** No
- **Headers:**
  - None
- **Query Parameters:**
  - `page` (integer): Page number
  - `limit` (integer): Number of items per page
  - `search` (string): Search by title or description
  - `category_id` (string): Filter by category UUID
  - `instructor_id` (string): Filter by instructor UUID
  - `level` (string): Filter by course level (e.g. Beginner)
  - `language` (string): Filter by course language
  - `min_price` (number): Filter by minimum price
  - `max_price` (number): Filter by maximum price
  - `status` (string): Filter by status
  - `sort_by` (string): Sort field (enrollments sorts by popularity)
  - `sort_order` (string): Sort order
- **Request Body:** None
- **Response:**
  - **200**: List of courses retrieved successfully

---

## Update an existing course

- **Endpoint:** `PUT /api/courses/{id}`
- **Description:** Update an existing course
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Path Parameters:**
  - `id` (string): Course UUID
- **Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "price": "number",
  "discount_price": "number"
}
```
- **Response:**
  - **200**: Course updated successfully
  - **400**: Invalid inputs or category not found
  - **401**: Unauthorized (Token missing/invalid)
  - **403**: Forbidden (Not Admin or owner Instructor)
  - **404**: Course not found

---

## Delete a course

- **Endpoint:** `DELETE /api/courses/{id}`
- **Description:** مسح الكورس من قبل المدرب (طالما لم يمتلكه طلاب).

**English Details:** Delete a course
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Path Parameters:**
  - `id` (string): Course UUID
- **Request Body:** None
- **Response:**
  - **200**: Course deleted successfully
  - **400**: Foreign key relation violation or bad request
  - **401**: Unauthorized (Token missing/invalid)
  - **403**: Forbidden (Not Admin or owner Instructor)
  - **404**: Course not found

---

## Get detailed information of a course (Public)

- **Endpoint:** `GET /api/courses/{id}`
- **Description:** Get detailed information of a course (Public)
- **Token Required:** No
- **Headers:**
  - None
- **Path Parameters:**
  - `id` (string): Course UUID
- **Request Body:** None
- **Response:**
  - **200**: Course details retrieved successfully
  - **400**: Invalid UUID format
  - **404**: Course not found

---

## Get rating summary and distribution for a course (Public)

- **Endpoint:** `GET /api/courses/{id}/rating-summary`
- **Description:** Get rating summary and distribution for a course (Public)
- **Token Required:** No
- **Headers:**
  - None
- **Path Parameters:**
  - `id` (string): Course UUID
- **Request Body:** None
- **Response:**
  - **200**: Rating summary retrieved successfully
  - **400**: Invalid UUID format
  - **404**: Course not found
  - **500**: Server error

---

## Get related courses for a given course (Public)

- **Endpoint:** `GET /api/courses/{id}/related`
- **Description:** Get related courses for a given course (Public)
- **Token Required:** No
- **Headers:**
  - None
- **Path Parameters:**
  - `id` (string): Course UUID
- **Query Parameters:**
  - `limit` (integer): Number of related courses to return
- **Request Body:** None
- **Response:**
  - **200**: Related courses retrieved successfully
  - **400**: Invalid UUID format
  - **404**: Course not found
  - **500**: Server error

---

## Get all categories

- **Endpoint:** `GET /api/categories`
- **Description:** Get all categories
- **Token Required:** No
- **Headers:**
  - None
- **Request Body:** None
- **Response:**
  - **200**: List of categories

---

## Create a new category

- **Endpoint:** `POST /api/categories`
- **Description:** إضافة تصنيف جديد بواسطة الإدارة.

**English Details:** Create a new category
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Request Body:**
```json
{
  "name": "string",
  "icon": "string"
}
```
- **Response:**
  - **201**: Category created

---

## Get category by ID

- **Endpoint:** `GET /api/categories/{id}`
- **Description:** عرض تفاصيل التصنيف والمقررات التابعة له.

**English Details:** Get category by ID
- **Token Required:** No
- **Headers:**
  - None
- **Path Parameters:**
  - `id` (string): 
- **Request Body:** None
- **Response:**
  - **200**: Category details
  - **404**: Category not found

---

## Update an existing category

- **Endpoint:** `PUT /api/categories/{id}`
- **Description:** Update an existing category
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Path Parameters:**
  - `id` (string): 
- **Request Body:**
```json
{
  "name": "string",
  "icon": "string"
}
```
- **Response:**
  - **200**: Category updated

---

## Delete a category

- **Endpoint:** `DELETE /api/categories/{id}`
- **Description:** حذف التصنيف كلياً.

**English Details:** Delete a category
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Path Parameters:**
  - `id` (string): 
- **Request Body:** None
- **Response:**
  - **204**: Category deleted

---

## Add a course to the shopping cart

- **Endpoint:** `POST /api/cart/items`
- **Description:** Add a course to the shopping cart
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Request Body:**
```json
{
  "courseId": "string"
}
```
- **Response:**
  - **200**: Course added to cart successfully
  - **400**: Already enrolled
  - **401**: Unauthorized
  - **403**: Forbidden (Not a student)
  - **404**: Course not found or not published
  - **409**: Course is already in the cart

---

## Remove a course from the shopping cart

- **Endpoint:** `DELETE /api/cart/items/{courseId}`
- **Description:** Remove a course from the shopping cart
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Path Parameters:**
  - `courseId` (string): The ID of the course to remove
- **Request Body:** None
- **Response:**
  - **200**: Course removed from cart successfully
  - **401**: Unauthorized
  - **403**: Forbidden
  - **404**: Item not found in cart

---

## Get student's shopping cart

- **Endpoint:** `GET /api/cart`
- **Description:** Get student's shopping cart
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Request Body:** None
- **Response:**
  - **200**: Cart details retrieved successfully
  - **401**: Unauthorized
  - **403**: Forbidden

---

## Register a new student

- **Endpoint:** `POST /api/auth/register`
- **Description:** يتم استخدام هذا الـ API لإنشاء حساب جديد كطالب (Student). نحتاجه في الفرونت اند لصفحة التسجيل، وبمجرد نجاحه يرجع بيانات المستخدم مع التوكين (JWT) لتسجيل الدخول مباشرة بدون خطوة إضافية.
- **Token Required:** No
- **Headers:**
  - `Content-Type: application/json`
- **Request Body:**
```json
{
  "full_name": "string",
  "email": "string",
  "password": "string"
}
```
- **Response:**
  - **201**: User registered successfully
  - **400**: Bad request (e.g., email already exists)

---

## Login to an account

- **Endpoint:** `POST /api/auth/login`
- **Description:** تسجيل الدخول للمنصة. نحتاجه في الفرونت اند للتحقق من إيميل وباسورد المستخدم وإرجاع التوكين (JWT) الذي سيُستخدم في كل الطلبات القادمة (Requests) للـ API لإثبات هوية المستخدم.
- **Token Required:** No
- **Headers:**
  - `Content-Type: application/json`
- **Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```
- **Response:**
  - **200**: Logged in successfully
  - **401**: Invalid credentials
  - **403**: Account suspended or deleted

---

## Logout (Client-side token drop)

- **Endpoint:** `POST /api/auth/logout`
- **Description:** تسجيل الخروج من النظام. حالياً يتم الاعتماد على تنفيذه في الفرونت اند عبر مسح التوكين من الـ Local Storage، لكن هذا الـ API متوفر كخطوة استباقية (Placeholder) لإمكانية التوسع مستقبلاً وإضافة التوكين للقائمة السوداء (Blacklist).
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Request Body:** None
- **Response:**
  - **200**: Logged out successfully

---

## Get current authenticated user core identity

- **Endpoint:** `GET /api/auth/me`
- **Description:** يجلب الهوية الأساسية للمستخدم الحالي (مثل الـ ID والـ Role). نحتاجه جداً في الفرونت اند عند عمل Refresh للصفحة أو أول تحميل (Initial Load) للتأكد من أن التوكين لا يزال صالحاً، ولتوجيه المستخدم بناءً على صلاحياته (طالب، مدرب، آدمن).
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Request Body:** None
- **Response:**
  - **200**: Returns user ID and Role

---

## Change own password

- **Endpoint:** `PATCH /api/auth/change-password`
- **Description:** يسمح للمستخدم بتغيير كلمة المرور الخاصة به. نحتاجه في الفرونت اند لصفحة (الإعدادات / الأمان)، ويتطلب معرفة كلمة المرور الحالية قبل التغيير كإجراء أمني.
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Request Body:**
```json
{
  "current_password": "string",
  "new_password": "string"
}
```
- **Response:**
  - **200**: Password updated successfully
  - **400**: Validation Error
  - **403**: Forbidden (Incorrect current password or password reuse)

---

## Get Admin Dashboard Statistics

- **Endpoint:** `GET /api/admin/dashboard`
- **Description:** Get Admin Dashboard Statistics
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Request Body:** None
- **Response:**
  - **200**: Dashboard statistics retrieved successfully
  - **401**: Unauthorized
  - **403**: Forbidden (Admin only)

---

## Create User (Admin)

- **Endpoint:** `POST /api/admin/users`
- **Description:** Create User (Admin)
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Request Body:**
```json
{
  "full_name": "string",
  "email": "string",
  "password": "string",
  "role": "string"
}
```
- **Response:**
  - **201**: User created successfully
  - **403**: Forbidden (Cannot assign ADMIN role)
  - **409**: Conflict (Email already exists)

---

## Get all users (Admin)

- **Endpoint:** `GET /api/admin/users`
- **Description:** قائمة بكل المستخدمين مع فلترة وتنقيب للآدمن.

**English Details:** Get all users (Admin)
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Query Parameters:**
  - `page` (integer): 
  - `limit` (integer): 
  - `search` (string): 
  - `sort` (string): 
  - `order` (string): 
  - `role` (string): 
  - `status` (string): 
- **Request Body:** None
- **Response:**
  - **200**: Users retrieved successfully

---

## Update User Status (Admin)

- **Endpoint:** `PATCH /api/admin/users/{id}/status`
- **Description:** Update User Status (Admin)
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Path Parameters:**
  - `id` (string): 
- **Request Body:**
```json
{
  "status": "string"
}
```
- **Response:**
  - **200**: Status updated successfully
  - **403**: Forbidden
  - **404**: Not Found
  - **409**: Conflict

---

## Get User Details (Admin)

- **Endpoint:** `GET /api/admin/users/{id}`
- **Description:** عرض تفاصيل حساب المستخدم بشكل كامل للمشرف.

**English Details:** Get User Details (Admin)
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Path Parameters:**
  - `id` (string): 
- **Request Body:** None
- **Response:**
  - **200**: User details retrieved successfully
  - **404**: User not found

---

## Delete User (Admin)

- **Endpoint:** `DELETE /api/admin/users/{id}`
- **Description:** حذف حساب المستخدم بشكل كامل وصارم.

**English Details:** Delete User (Admin)
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Path Parameters:**
  - `id` (string): 
- **Request Body:** None
- **Response:**
  - **200**: User account deactivated successfully
  - **403**: Forbidden (Escalation or self-deletion)
  - **404**: User not found

---

## Update User Role (Admin)

- **Endpoint:** `PATCH /api/admin/users/{id}/role`
- **Description:** ترقية أو تعديل صلاحيات المستخدمين (مثال: تحويل طالب لمدرب).

**English Details:** Update User Role (Admin)
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Path Parameters:**
  - `id` (string): 
- **Request Body:**
```json
{
  "role": "string"
}
```
- **Response:**
  - **200**: Role updated successfully
  - **403**: Forbidden (Escalation or self-modification)
  - **404**: User not found
  - **409**: Role already applied

---

## Reset User Password (Admin)

- **Endpoint:** `POST /api/admin/users/{id}/reset-password`
- **Description:** إجبار إعادة تعيين كلمة المرور كإجراء أمنـي.

**English Details:** Reset User Password (Admin)
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Path Parameters:**
  - `id` (string): 
- **Request Body:** None
- **Response:**
  - **200**: Password reset successfully
  - **403**: Forbidden (Escalation or self-reset)
  - **404**: User not found

---

## Get User Role History (Admin)

- **Endpoint:** `GET /api/admin/users/{id}/role-history`
- **Description:** مراقبة متى ومن قام بتغيير صلاحيات المستخدم.

**English Details:** Get User Role History (Admin)
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Path Parameters:**
  - `id` (string): 
- **Request Body:** None
- **Response:**
  - **200**: History retrieved successfully
  - **404**: User not found

---

## Get all courses (Admin)

- **Endpoint:** `GET /api/admin/courses`
- **Description:** الإشراف والاطلاع على كل الكورسات في النظام.

**English Details:** Get all courses (Admin)
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Query Parameters:**
  - `page` (integer): 
  - `limit` (integer): 
  - `search` (string): 
  - `sort` (string): 
  - `order` (string): 
  - `status` (string): 
  - `category` (string): 
  - `instructor` (string): 
- **Request Body:** None
- **Response:**
  - **200**: Courses retrieved successfully

---

## Update Course Status (Admin)

- **Endpoint:** `PATCH /api/admin/courses/{id}/status`
- **Description:** نشر أو رفض الكورسات الجديدة للحفاظ على جودة المحتوى.

**English Details:** Update Course Status (Admin)
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Path Parameters:**
  - `id` (string): 
- **Request Body:**
```json
{
  "status": "string"
}
```
- **Response:**
  - **200**: Status updated successfully

---

## Get all reviews (Admin)

- **Endpoint:** `GET /api/admin/reviews`
- **Description:** الإشراف ومراقبة كل تقييمات المنصة.

**English Details:** Get all reviews (Admin)
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Query Parameters:**
  - `page` (integer): 
  - `limit` (integer): 
  - `search` (string): 
  - `sort` (string): 
  - `order` (string): 
  - `rating` (integer): 
  - `status` (string): 
- **Request Body:** None
- **Response:**
  - **200**: Reviews retrieved successfully

---

## Update Review Status (Admin)

- **Endpoint:** `PATCH /api/admin/reviews/{id}/status`
- **Description:** إخفاء التقييمات المضللة أو المسيئة.

**English Details:** Update Review Status (Admin)
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Path Parameters:**
  - `id` (string): 
- **Request Body:**
```json
{
  "status": "string"
}
```
- **Response:**
  - **200**: Status updated successfully

---

## Broadcast a notification to all users

- **Endpoint:** `POST /api/admin/notifications/broadcast`
- **Description:** مخصص للآدمنز لإرسال إشعار عام (Broadcast) لكل المستخدمين النشطين في المنصة في وقت واحد (مثل إعلانات الصيانة والتحديثات). تم برمجته ليعمل بأعلى كفاءة ممكنة عبر قاعدة البيانات بدون التأثير على أداء السيرفر.
- **Token Required:** Yes (Authorization Bearer Token)
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Request Body:**
```json
{
  "title": "string",
  "message": "string",
  "priority": "string",
  "action_url": "string"
}
```
- **Response:**
  - **201**: Notification broadcasted

---

