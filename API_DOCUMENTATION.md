# API Documentation

## Frontend-Agnostic Architecture & Zero-Mock Enforcement (StudyFlow Production Specification)

- **100% Frontend-Agnostic Response Contracts:** All API endpoints strictly return core business data (identifiers, titles, descriptions, metrics, dates) and NEVER embed presentation-specific UI attributes such as `icon`, `emoji`, `color`, `background`, `style`, or `svg`. Visual rendering decisions, design systems, and icon pack selections (Lucide, Heroicons, Tabler, etc.) remain solely the responsibility of frontend consumer applications.
- **Zero-Mock & Authentic Database Aggregation:** Endpoints are permanently stripped of fallback dummy arrays or artificial statistics formulas. When database queries yield empty records, APIs return pristine empty arrays `[]`. Platform metrics (active students, completed enrollments, review ratings, total revenue) are derived dynamically via optimized relational PostgreSQL aggregations.

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-a1b2-c3d4e5f67890",
    "name": "Ahmed Mostafa",
    "email": "ahmed.mostafa@example.com",
    "role": "STUDENT",
    "bio": "Software Engineer and Lifelong Learner",
    "profile_picture": "https://cloud-storage.example.com/profiles/avatar.jpg",
    "is_active": true,
    "created_at": "2026-01-15T10:30:00.000Z",
    "updated_at": "2026-07-25T14:20:00.000Z"
  },
  "requestId": "c3d4e5f6-7890-a1b2-c3d4-e5f67890a1b2"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "a1b2c3d4-e5f6-7890-a1b2-c3d4e5f67890",
    "name": "Ahmed Mostafa (Updated)",
    "email": "ahmed.mostafa@example.com",
    "role": "STUDENT",
    "bio": "Senior Backend Developer & Systems Architect",
    "profile_picture": "https://cloud-storage.example.com/profiles/new_avatar.jpg",
    "updated_at": "2026-07-25T20:15:00.000Z"
  },
  "requestId": "d4e5f6a1-7890-b2c3-d4e5-f67890a1b2c3"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "data": {
    "is_valid": true,
    "credential_id": "CERT-2026-998877",
    "student_name": "Ahmed Mostafa",
    "course_title": "Advanced Microservices & Node.js Architecture",
    "issued_at": "2026-07-20T12:00:00.000Z",
    "instructor_name": "Eng. Mostafa Faysal"
  },
  "requestId": "e5f67890-a1b2-c3d4-e5f6-7890a1b2c3d4"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "data": {
    "total_enrolled_courses": 5,
    "completed_courses": 2,
    "in_progress_courses": 3,
    "total_earned_certificates": 2,
    "average_progress_percentage": 68.5,
    "recent_activity": [
      {
        "course_id": "c7f8a9e0-1234-5678-9abc-def012345678",
        "course_title": "Modern TypeScript Strict Development",
        "last_accessed_at": "2026-07-25T18:00:00.000Z",
        "current_progress": 80
      }
    ]
  },
  "requestId": "f67890a1-b2c3-d4e5-f678-90a1b2c3d4e5"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "data": [
    {
      "enrollment_id": "enr-11223344",
      "course_id": "c7f8a9e0-1234-5678-9abc-def012345678",
      "title": "Modern TypeScript Strict Development",
      "thumbnail": "https://cloud-storage.example.com/courses/ts-thumb.jpg",
      "instructor": {
        "name": "Eng. Mostafa Faysal"
      },
      "progress_percentage": 80,
      "status": "IN_PROGRESS",
      "enrolled_at": "2026-06-01T09:00:00.000Z"
    }
  ],
  "requestId": "a1b2c3d4-0011-2233-4455-667788990011"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "data": {
    "course_id": "c7f8a9e0-1234-5678-9abc-def012345678",
    "course_title": "Modern TypeScript Strict Development",
    "last_lesson": {
      "lesson_id": "less-889900",
      "title": "Lesson 12: Generics and Type Guards",
      "video_url": "https://videos.example.com/stream/less-889900",
      "duration_seconds": 1420,
      "stopped_at_seconds": 615
    },
    "next_lesson_id": "less-889901"
  },
  "requestId": "b2c3d4e5-1122-3344-5566-778899001122"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "data": [
    {
      "id": "cert-556677",
      "credential_id": "CERT-2026-998877",
      "course_title": "Advanced Microservices & Node.js Architecture",
      "issued_at": "2026-07-20T12:00:00.000Z",
      "download_url": "https://cloud-storage.example.com/certificates/CERT-2026-998877.pdf"
    }
  ],
  "requestId": "c3d4e5f6-2233-4455-6677-889900112233"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "message": "Certificate generated successfully",
  "data": {
    "id": "cert-889900",
    "credential_id": "CERT-2026-112233",
    "course_id": "c7f8a9e0-1234-5678-9abc-def012345678",
    "issued_at": "2026-07-25T20:17:36.936Z"
  },
  "requestId": "d4e5f6a1-3344-5566-7788-990011223344"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "message": "Section created successfully",
  "data": {
    "id": "sec-102030",
    "course_id": "c7f8a9e0-1234-5678-9abc-def012345678",
    "title": "Module 1: Introduction to Distributed Systems",
    "sequence_order": 1,
    "created_at": "2026-07-25T20:17:36.938Z"
  },
  "requestId": "sec001-req-uuid-4455"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "message": "Section updated successfully",
  "data": {
    "id": "sec-102030",
    "course_id": "c7f8a9e0-1234-5678-9abc-def012345678",
    "title": "Module 1: Deep Dive into Distributed Systems (Updated)",
    "sequence_order": 1,
    "updated_at": "2026-07-25T20:17:36.938Z"
  },
  "requestId": "sec002-req-uuid-5566"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "message": "Section deleted successfully",
  "data": null,
  "requestId": "sec003-req-uuid-6677"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "message": "Review submitted successfully",
  "data": {
    "id": "rev-445566",
    "course_id": "c7f8a9e0-1234-5678-9abc-def012345678",
    "student_id": "a1b2c3d4-e5f6-7890-a1b2-c3d4e5f67890",
    "rating": 5,
    "comment": "Outstanding course with incredible deep technical insights!",
    "status": "APPROVED",
    "created_at": "2026-07-25T20:17:36.938Z"
  },
  "requestId": "rev001-req-uuid-7788"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "rev-445566",
        "rating": 5,
        "comment": "Outstanding course with incredible deep technical insights!",
        "student": {
          "name": "Ahmed Mostafa",
          "profile_picture": "avatar.jpg"
        },
        "created_at": "2026-07-25T15:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 24,
      "page": 1,
      "limit": 10,
      "pages": 3
    }
  },
  "requestId": "rev002-req-uuid-8899"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "message": "Review updated successfully",
  "data": {
    "id": "rev-445566",
    "rating": 4,
    "comment": "Updated review comment after completing module 5.",
    "updated_at": "2026-07-25T20:17:36.938Z"
  },
  "requestId": "rev003-req-uuid-9900"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "message": "Review removed successfully",
  "data": null,
  "requestId": "rev004-req-uuid-0011"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "data": {
    "unreadCount": 3
  },
  "requestId": "notif-req-0001"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "message": "All notifications marked as read",
  "data": {
    "updated_count": 3
  },
  "requestId": "notif-req-0002"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "data": [
    {
      "id": "notif-778899",
      "title": "Assignment Graded",
      "message": "Your submission for 'Node.js Cluster Lab' has been graded by the instructor.",
      "is_read": false,
      "created_at": "2026-07-25T19:30:00.000Z"
    }
  ],
  "requestId": "notif-req-0003"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "message": "All notifications cleared successfully",
  "data": null,
  "requestId": "notif-req-0004"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "data": {
    "id": "notif-778899",
    "title": "Assignment Graded",
    "message": "Your submission for 'Node.js Cluster Lab' has been graded by the instructor.",
    "is_read": true,
    "created_at": "2026-07-25T19:30:00.000Z"
  },
  "requestId": "notif-req-0005"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "message": "Notification deleted",
  "data": null,
  "requestId": "notif-req-0006"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "id": "notif-778899",
    "is_read": true
  },
  "requestId": "notif-req-0007"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "message": "Lesson added successfully",
  "data": {
    "id": "less-556677",
    "section_id": "sec-102030",
    "title": "Lesson 1: Understanding Load Balancing with PM2",
    "video_url": "https://cdn.example.com/videos/pm2-cluster.mp4",
    "duration_seconds": 1250,
    "sequence_order": 1,
    "is_free_preview": true,
    "created_at": "2026-07-25T20:17:36.938Z"
  },
  "requestId": "less-req-001"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "message": "Lesson details updated successfully",
  "data": {
    "id": "less-556677",
    "title": "Lesson 1: Understanding Load Balancing & Worker Threads",
    "duration_seconds": 1300,
    "updated_at": "2026-07-25T20:17:36.938Z"
  },
  "requestId": "less-req-002"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "message": "Lesson removed successfully",
  "data": null,
  "requestId": "less-req-003"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "data": {
    "id": "entity-uuid-8899",
    "name": "Entity Details Object",
    "metadata": {
      "attribute": "value"
    },
    "updated_at": "2026-07-25T18:00:00.000Z"
  },
  "requestId": "req-uuid-single-entity"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "data": {
    "total_revenue": 15400,
    "active_students": 340,
    "course_rating": 4.9,
    "completion_rate": "82%"
  },
  "requestId": "req-uuid-analytics-fetch"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "data": {
    "id": "entity-uuid-8899",
    "name": "Entity Details Object",
    "metadata": {
      "attribute": "value"
    },
    "updated_at": "2026-07-25T18:00:00.000Z"
  },
  "requestId": "req-uuid-single-entity"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "data": {
    "total_revenue": 15400,
    "active_students": 340,
    "course_rating": 4.9,
    "completion_rate": "82%"
  },
  "requestId": "req-uuid-analytics-fetch"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "data": {
    "total_revenue": 15400,
    "active_students": 340,
    "course_rating": 4.9,
    "completion_rate": "82%"
  },
  "requestId": "req-uuid-analytics-fetch"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "data": {
    "id": "entity-uuid-8899",
    "name": "Entity Details Object",
    "metadata": {
      "attribute": "value"
    },
    "updated_at": "2026-07-25T18:00:00.000Z"
  },
  "requestId": "req-uuid-single-entity"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "data": {
    "id": "entity-uuid-8899",
    "name": "Entity Details Object",
    "metadata": {
      "attribute": "value"
    },
    "updated_at": "2026-07-25T18:00:00.000Z"
  },
  "requestId": "req-uuid-single-entity"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "data": [
    {
      "id": "item-uuid-001",
      "title": "Example Portfolio Entity Item",
      "created_at": "2026-07-25T10:00:00.000Z",
      "status": "ACTIVE"
    },
    {
      "id": "item-uuid-002",
      "title": "Second Entity Record",
      "created_at": "2026-07-24T14:20:00.000Z",
      "status": "ACTIVE"
    }
  ],
  "pagination": {
    "total": 2,
    "page": 1,
    "limit": 10,
    "pages": 1
  },
  "requestId": "req-uuid-collection-fetch"
}
```

- **200**: Paginated reviews

---

## Get static structural configuration (Shell)

- **Endpoints:** `GET /api/home` & `GET /api/home/config`
- **Description:** هذا الـ API مخصص لجلب كافة البيانات الثابتة والأساسية للصفحة الرئيسية في طلب واحد لضمان أسرع وقت تحميل (First Contentful Paint) بدون انتظار معالجة الكورسات والتقييمات الحركية التي يتم تحميلها لاحقاً بطريقة Lazy-Loading أو عند الفتح. يرجع الـ JSON كافة الأقسام الثابتة: `hero`, `why_choose_us`, `partners`, `footer`, `settings`.
- **English Details:** Returns all static shell sections of the Home Page in one single optimized response (`hero`, `why_choose_us`, `partners`, `footer`, `settings`). Supported via both `/api/home` and `/api/home/config`.
- **Token Required:** No
- **Headers:** None
- **Request Body:** None
- **Response:**
  - **Example Return Object (JSON Schema):**

```json
{
  "status": "success",
  "data": {
    "hero": {
      "title": "طور مستقبلك مع أفضل الدبلومات التقنية",
      "subtitle": "تعلم من خبراء المجال من خلال مشاريع عملية، متابعة Mentors، وشهادات معتمدة تؤهلك لسوق العمل.",
      "primary_button": { "text": "استكشف الكورسات", "url": "/courses" },
      "secondary_button": { "text": "اعرف المزيد", "url": "/about" },
      "background_image": "https://res.cloudinary.com/trmszuqg/image/upload/v1785559343/1000149988_gciucp.jpg",
      "students_count": 12500,
      "courses_count": 10,
      "instructors_count": 8,
      "rating": 4.9
    },
    "why_choose_us": [
      {
        "id": "expert",
        "title": "Expert Instructors",
        "description": "Learn from senior engineers."
      },
      {
        "id": "projects",
        "title": "Real Projects",
        "description": "Build production-grade systems."
      },
      {
        "id": "mentorship",
        "title": "Live Mentorship",
        "description": "Weekly interactive Q&A sessions."
      },
      {
        "id": "career",
        "title": "Career Readiness",
        "description": "Mock interviews & portfolio reviews."
      }
    ],
    "partners": [
      {
        "name": "Microsoft Enterprise Ecosystem",
        "logo": "https://res.cloudinary.com/trmszuqg/image/upload/v1785559343/1000149988_gciucp.jpg",
        "category": "Cloud & Azure Solutions"
      }
    ],
    "settings": {
      "platform_name": "StudyFlow",
      "support_email": "support@studyflow.com",
      "support_phone": "+201000000000",
      "currency": "EGP",
      "locale": "ar-EG",
      "maintenance_mode": false,
      "social_links": {
        "facebook": "https://facebook.com/studyflow",
        "youtube": "https://youtube.com/@studyflow",
        "linkedin": "https://linkedin.com/company/studyflow"
      }
    },
    "footer": {
      "companyName": "StudyFlow",
      "description": "منصة تعليمية متخصصة في تقديم دبلومات تقنية احترافية تساعد الطلاب على اكتساب المهارات المطلوبة لسوق العمل.",
      "email": "support@studyflow.com",
      "phone": "+20 100 123 4567"
    }
  },
  "requestId": "a1b2c3d4-e5f6-7890-a1b2-c3d4e5f67890"
}
```

- **200**: Static configuration retrieved successfully

---

## Get search bar suggestions

- **Endpoint:** `GET /api/home/search-suggestions`
- **Description:** يجلب اقتراحات البحث الفورية לשريط البحث في الفرونت إند. عند فراغ الاستعلام (Empty query) يعيد أعلى 5 كورسات شعبية ومبيعاً، وعند الكتابة الفورية يفرز العناوين (Title only) للحصول على أقصى سرعة استجابة وبدون تفاصيل طويلة مثل description.
- **English Details:** Returns instant autocomplete search suggestions. If query is empty, defaults to Top 5 Popular courses (with image, price, title, slug/id). If query is provided, performs prefix/title filtering.
- **Token Required:** No
- **Headers:** None
- **Query Parameters:**
  - `q` (optional, string) - النص المكتوب في شريط البحث.
- **Response:**
  - **Example Return Object (JSON Schema):**

```json
{
  "status": "success",
  "data": [
    {
      "id": "course_uuid",
      "title": "Full-Stack Node.js & React Diploma",
      "price": 4500,
      "discount_price": 3200,
      "thumbnail": "https://res.cloudinary.com/.../thumb.webp"
    }
  ],
  "requestId": "s1g2s3g4-s5e6-7890-a1b2-c3d4e5f67890"
}
```

- **200**: Search suggestions retrieved successfully

---

## Get platform technology partners

- **Endpoint:** `GET /api/home/partners`
- **Description:** يجلب قائمة بالشركات التكنولوجية والشركاء (Partners & Ecosystems) التي تتعاون معها المنصة لزيادة الثقة والاعتماديّة.
- **Token Required:** No
- **Headers:** None
- **Request Body:** None
- **Response:**
  - **Example Return Object (JSON Schema):**

```json
{
  "status": "success",
  "data": [
    {
      "name": "Microsoft Enterprise Ecosystem",
      "logo": "https://res.cloudinary.com/trmszuqg/image/upload/v1785559343/1000149988_gciucp.jpg",
      "category": "Cloud & Azure Solutions"
    }
  ],
  "requestId": "e2a1c3b4-d5e6-7890-a1b2-c3d4e5f67890"
}
```

- **200**: Partners retrieved successfully

---

## Get Hero section data

- **Endpoint:** `GET /api/home/hero`
- **Description:** يجلب بيانات القسم الأول في الصفحة الرئيسية (Hero Section) والذي يتضمن العنوان الرئيسي، الوصف، وأرقام وإحصائيات المنصة السريعة.
- **Token Required:** No
- **Headers:** None
- **Request Body:** None
- **Response:**
  - **Example Return Object (JSON Schema):**

```json
{
  "status": "success",
  "data": {
    "title": "Learn Today, Build Your Future",
    "subtitle": "Join thousands of students learning with expert instructors through practical courses and real-world projects.",
    "primary_button": "Explore Courses",
    "secondary_button": "Become an Instructor",
    "background_image": "https://res.cloudinary.com/trmszuqg/image/upload/v1785559343/1000149988_gciucp.jpg",
    "students_count": 12500,
    "courses_count": 250,
    "instructors_count": 35
  },
  "requestId": "b2c3d4e5-f6a1-7890-b2c3-d4e5f67890a1"
}
```

- **200**: Hero data retrieved

---

## Get Platform Features (Why Choose Us)

- **Endpoint:** `GET /api/home/why-choose-us` (Alias: `GET /api/home/platform`)
- **Description:** يجلب مزايا المنصة والمميزات الخاصة بها (Why Choose Us) لتعزيز ثقة الزائر بالشهادات، أسلوب المشاريع التطبيقية، والوصول مدى الحياة.
- **Token Required:** No
- **Headers:** None
- **Request Body:** None
- **Response:**
  - **Example Return Object (JSON Schema):**

```json
{
  "status": "success",
  "data": [
    {
      "id": "expert",
      "title": "Expert Instructors",
      "description": "Learn directly from senior engineers and active field practitioners."
    },
    {
      "id": "projects",
      "title": "Real Projects",
      "description": "Build production-grade systems and portfolio-ready applications."
    },
    {
      "id": "mentorship",
      "title": "Live Mentorship",
      "description": "Weekly interactive Q&A sessions, code reviews, and continuous learning guidance."
    },
    {
      "id": "career",
      "title": "Career Readiness",
      "description": "Mock technical interviews, CV polishing, and portfolio reviews."
    }
  ],
  "requestId": "c1a2b3c4-d5e6-7890-c1a2-c3d4e5f67890"
}
```

- **200**: Why Choose Us features retrieved successfully

---

## Get featured courses

- **Endpoint:** `GET /api/home/featured-courses`
- **Description:** يجلب قائمة بالدبلومات المميزة والأكثر تفاعلاً على المنصة لعرضها في قسم المختار لكم.
- **Token Required:** No
- **Headers:** None
- **Request Body:** None
- **Response:**
  - **Example Return Object (JSON Schema):**

```json
{
  "status": "success",
  "data": [
    {
      "id": "c1a2b3c4-d5e6-7890-a1b2-c3d4e5f67890",
      "title": "Back-End (Node.js & Express) Diploma",
      "slug": "back-end-node-js-express-diploma",
      "price": 8500,
      "discount_price": 7200,
      "rating": 4.9,
      "reviews_count": 12,
      "students_count": 45,
      "duration_weeks": "17 أسبوع",
      "duration_hours": "120 ساعة",
      "projects_count": "6 مشاريع",
      "thumbnail": "https://res.cloudinary.com/trmszuqg/image/upload/v1785557519/1000150009_meduhn.jpg",
      "card_image": "https://res.cloudinary.com/trmszuqg/image/upload/v1785557556/backend_node_js_xa2rne.webp",
      "instructor": {
        "name": "Mohamed Hassan",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb"
      }
    }
  ],
  "requestId": "d4e5f6a1-b2c3-7890-d4e5-f67890a1b2c3"
}
```

- **200**: Featured courses retrieved

---

## Get top rated courses

- **Endpoint:** `GET /api/home/top-rated-courses`
- **Description:** يجلب قائمة الكورسات الأعلى تقييماً بناءً على التقييم الفعلي لطلاب المنصة (من جدول التقييمات في قاعدة البيانات)، مرتبة تنازلياً حسب متوسط التقييم.
- **Token Required:** No
- **Headers:** None
- **Request Body:** None
- **Response:**
  - Returns array of Course format JSON matching `featured-courses`.

- **200**: Top rated courses retrieved successfully

---

## Get popular courses by enrollment volume

- **Endpoint:** `GET /api/home/popular-courses`
- **Description:** يجلب قائمة الكورسات الأكثر شعبية وإقبالاً بناءً على عدد التسجيلات الفعلية (Enrollments count) في قاعدة البيانات.
- **Token Required:** No
- **Headers:** None
- **Request Body:** None
- **Response:**
  - Returns array of Course format JSON matching `featured-courses`.

- **200**: Popular courses retrieved successfully

---

## Get newest published courses

- **Endpoint:** `GET /api/home/new-courses`
- **Description:** يجلب أحدث الدبلومات التي تم إضافتها ونشرها على المنصة، مرتبة حسب تاريخ الإنشاء.
- **Token Required:** No
- **Headers:** None
- **Request Body:** None
- **Response:**
  - Returns array of Course format JSON matching `featured-courses`.

- **200**: Newest courses retrieved successfully

---

## Get top categories

- **Endpoint:** `GET /api/home/categories`
- **Description:** يجلب قائمة بأهم التصنيفات (Categories) مع عدد الكورسات المتاحة في كل تصنيف. يستخدم في الصفحة الرئيسية لعرض الأقسام الشائعة للطلاب للبحث والتصفح السريع.
- **Token Required:** No
- **Headers:** None
- **Request Body:** None
- **Response:**
  - **Example Return Object (JSON Schema):**

```json
{
  "status": "success",
  "data": [
    {
      "id": "4b6c310b-857e-4054-9457-3f338d388711",
      "name": "Web Development",
      "courses_count": 5
    },
    {
      "id": "9a1b223c-457e-4054-9457-3f338d388222",
      "name": "Data Science & AI",
      "courses_count": 2
    }
  ],
  "requestId": "c3d4e5f6-a1b2-7890-c3d4-e5f67890a1b2"
}
```

- **200**: Categories retrieved

---

## Get top instructors

- **Endpoint:** `GET /api/home/top-instructors`
- **Description:** يجلب بيانات أفضل المدربين في المنصة بناءً على التقييمات وعدد الطلاب. مفيد في الصفحة الرئيسية لزيادة الثقة (Social Proof) وتشجيع الطلاب على التسجيل.
- **Token Required:** No
- **Headers:** None
- **Request Body:** None
- **Response:**
  - **Example Return Object (JSON Schema):**

```json
{
  "status": "success",
  "data": [
    {
      "id": "11111111-a83a-4ef8-bb6d-6bb9bd380a11",
      "full_name": "Mohamed Hassan",
      "profile_picture": "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
      "bio": "Lead Software Architect with 12+ years building enterprise scalable Node.js applications.",
      "_count": { "courses_taught": 3 }
    }
  ],
  "requestId": "e5f6a1b2-c3d4-7890-e5f6-7890a1b2c3d4"
}
```

- **200**: Top instructors retrieved

---

## Get platform statistics

- **Endpoint:** `GET /api/home/statistics`
- **Description:** يجلب إحصائيات عامة عن المنصة مثل (عدد الطلاب النشطين، إجمالي الكورسات، المدربين، وعدد الشهادات المعتمدة المصدرة).
- **Token Required:** No
- **Headers:** None
- **Request Body:** None
- **Response:**
  - **Example Return Object (JSON Schema):**

```json
{
  "status": "success",
  "data": {
    "students": 12500,
    "courses": 250,
    "instructors": 35,
    "certificates": 8200
  },
  "requestId": "f6a1b2c3-d4e5-7890-f6a1-7890a1b2c3d4"
}
```

- **200**: Statistics retrieved

---

## Get student testimonials

- **Endpoint:** `GET /api/home/testimonials`
- **Description:** يجلب آراء وتقييمات الطلاب السابقين. يستخدم في الفرونت اند لزيادة الثقة والمبيعات (Testimonials Section).
- **Token Required:** No
- **Headers:** None
- **Request Body:** None
- **Response:**
  - **Example Return Object (JSON Schema):**

```json
{
  "status": "success",
  "data": [
    {
      "id": "rev-uuid-0011",
      "rating": 5,
      "comment": "الدبلومة غيرت مساري المهني بالكامل، الشرح ممتاز والتطبيق العملي على أنظمة الحضور والغياب والمشاريع كان السبب رئيسي في قبولي في وظيفتي الأولى!",
      "created_at": "2026-07-10T14:20:00.000Z",
      "student": {
        "full_name": "Ahmed Mostafa",
        "profile_picture": "https://cloud-storage.example.com/profiles/avatar1.jpg"
      }
    }
  ],
  "requestId": "a1b2c3d4-7890-e5f6-a1b2-c3d4e5f67890"
}
```

- **200**: Testimonials retrieved

---

## Get FAQs

- **Endpoint:** `GET /api/home/faq`
- **Description:** يجلب الأسئلة الشائعة وإجاباتها. يستخدم في صفحة الأسئلة الشائعة أو في نهاية الصفحة الرئيسية للرد على استفسارات الزوار المعتادة.
- **Token Required:** No
- **Headers:** None
- **Request Body:** None
- **Response:**
  - **Example Return Object (JSON Schema):**

```json
{
  "status": "success",
  "data": [
    {
      "question": "How do I enroll in a course?",
      "answer": "Simply register an account, browse our diplomas, and click 'Add to Cart' or enroll instantly."
    },
    {
      "question": "Do you offer verifiable certificates?",
      "answer": "Yes, upon course completion, you receive a digital certificate equipped with a unique Credential ID."
    }
  ],
  "requestId": "b2c3d4e5-7890-a1b2-b2c3-d4e5f67890a1"
}
```

- **200**: FAQs retrieved

---

## Get Site Settings (General Platform Metadata)

- **Endpoint:** `GET /api/home/settings` (Alias: `GET /api/home/platform-info`)
- **Description:** يجلب البيانات العامة للمنصة (الاسم، الشعار، أرقام الدعم الفني، البريد الإلكتروني، وروابط حسابات السوشيال ميديا) لتجنب تثبيتها يدوياً في كود الفرونت إند.
- **Token Required:** No
- **Headers:** None
- **Request Body:** None
- **Response:**
  - **Example Return Object (JSON Schema):**

```json
{
  "status": "success",
  "data": {
    "platform_name": "StudyFlow",
    "support_email": "support@studyflow.com",
    "support_phone": "+201000000000",
    "currency": "EGP",
    "locale": "ar-EG",
    "maintenance_mode": false,
    "social_links": {
      "facebook": "https://facebook.com/studyflow",
      "youtube": "https://youtube.com/@studyflow",
      "linkedin": "https://linkedin.com/company/studyflow"
    }
  },
  "requestId": "e5f67890-a1b2-c3d4-e5f6-7890a1b2c3d4"
}
```

- **200**: Site settings metadata retrieved

---

## Get footer links

- **Endpoint:** `GET /api/home/footer`
- **Description:** يجلب الروابط السريعة، معلومات التواصل، وروابط السوشيال ميديا الخاصة بأسفل الصفحة (Footer).
- **Token Required:** No
- **Headers:** None
- **Request Body:** None
- **Response:**
  - **Example Return Object (JSON Schema):**

```json
{
  "status": "success",
  "data": {
    "logo": "https://res.cloudinary.com/trmszuqg/image/upload/v1785559347/1000149993_lijztj.jpg",
    "description": "StudyFlow is the premier training powerhouse designed to bridge the gap between academic learning and high-level enterprise software engineering.",
    "quickLinks": [
      { "label": "About Us", "url": "/about" },
      { "label": "Browse Courses", "url": "/courses" },
      { "label": "Verify Certificate", "url": "/verify-certificate" },
      { "label": "Support & FAQs", "url": "/faq" }
    ],
    "socialLinks": {
      "facebook": "https://facebook.com/studyflow",
      "linkedin": "https://linkedin.com/company/studyflow",
      "youtube": "https://youtube.com/@studyflow"
    },
    "copyright": "© 2026 StudyFlow. All rights reserved."
  },
  "requestId": "c3d4e5f6-7890-b2c3-c3d4-e5f67890a1b2"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "data": {
    "id": "entity-uuid-8899",
    "name": "Entity Details Object",
    "metadata": {
      "attribute": "value"
    },
    "updated_at": "2026-07-25T18:00:00.000Z"
  },
  "requestId": "req-uuid-single-entity"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "message": "Created successfully",
  "data": {
    "id": "res-uuid-item-001",
    "status": "ACTIVE",
    "timestamp": "2026-07-25T20:30:00.000Z"
  },
  "requestId": "req-uuid-post-action"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "message": "Resource deleted successfully",
  "data": null,
  "requestId": "req-uuid-delete-action"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "data": {
    "id": "entity-uuid-8899",
    "name": "Entity Details Object",
    "metadata": {
      "attribute": "value"
    },
    "updated_at": "2026-07-25T18:00:00.000Z"
  },
  "requestId": "req-uuid-single-entity"
}
```

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
  "duration_hours": "number",
  "duration_weeks": "number",
  "projects_count": "number",
  "thumbnail": "https://res.cloudinary.com/.../thumb.webp",
  "card_image": "https://res.cloudinary.com/.../card.webp",
  "cover_image": "https://res.cloudinary.com/.../cover.webp",
  "preview_video": "https://...",
  "status": "string"
}
```

- **Response:**
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "message": "Created successfully",
  "data": {
    "id": "res-uuid-item-001",
    "status": "ACTIVE",
    "timestamp": "2026-07-25T20:30:00.000Z"
  },
  "requestId": "req-uuid-post-action"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "data": [
    {
      "id": "item-uuid-001",
      "title": "Example Portfolio Entity Item",
      "duration_hours": 120,
      "duration_weeks": 16,
      "projects_count": 6,
      "created_at": "2026-07-25T10:00:00.000Z",
      "status": "ACTIVE"
    },
    {
      "id": "item-uuid-002",
      "title": "Second Entity Record",
      "created_at": "2026-07-24T14:20:00.000Z",
      "status": "ACTIVE"
    }
  ],
  "pagination": {
    "total": 2,
    "page": 1,
    "limit": 10,
    "pages": 1
  },
  "requestId": "req-uuid-collection-fetch"
}
```

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
  "discount_price": "number",
  "duration_hours": "number",
  "duration_weeks": "number",
  "projects_count": "number"
}
```

- **Response:**
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "message": "Updated successfully",
  "data": {
    "id": "res-uuid-item-001",
    "status": "ACTIVE",
    "timestamp": "2026-07-25T20:30:00.000Z"
  },
  "requestId": "req-uuid-put-action"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "message": "Resource deleted successfully",
  "data": null,
  "requestId": "req-uuid-delete-action"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "data": {
    "id": "entity-uuid-8899",
    "name": "Entity Details Object",
    "duration_hours": 120,
    "duration_weeks": 16,
    "projects_count": 6,
    "metadata": {
      "attribute": "value"
    },
    "updated_at": "2026-07-25T18:00:00.000Z"
  },
  "requestId": "req-uuid-single-entity"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "data": {
    "total_revenue": 15400,
    "active_students": 340,
    "course_rating": 4.9,
    "completion_rate": "82%"
  },
  "requestId": "req-uuid-analytics-fetch"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "data": {
    "id": "entity-uuid-8899",
    "name": "Entity Details Object",
    "metadata": {
      "attribute": "value"
    },
    "updated_at": "2026-07-25T18:00:00.000Z"
  },
  "requestId": "req-uuid-single-entity"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "data": [
    {
      "id": "item-uuid-001",
      "title": "Example Portfolio Entity Item",
      "created_at": "2026-07-25T10:00:00.000Z",
      "status": "ACTIVE"
    },
    {
      "id": "item-uuid-002",
      "title": "Second Entity Record",
      "created_at": "2026-07-24T14:20:00.000Z",
      "status": "ACTIVE"
    }
  ],
  "pagination": {
    "total": 2,
    "page": 1,
    "limit": 10,
    "pages": 1
  },
  "requestId": "req-uuid-collection-fetch"
}
```

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
  "name": "string"
}
```

- **Response:**
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "message": "Created successfully",
  "data": {
    "id": "res-uuid-item-001",
    "status": "ACTIVE",
    "timestamp": "2026-07-25T20:30:00.000Z"
  },
  "requestId": "req-uuid-post-action"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "data": {
    "id": "entity-uuid-8899",
    "name": "Entity Details Object",
    "metadata": {
      "attribute": "value"
    },
    "updated_at": "2026-07-25T18:00:00.000Z"
  },
  "requestId": "req-uuid-single-entity"
}
```

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
  "name": "string"
}
```

- **Response:**
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "message": "Updated successfully",
  "data": {
    "id": "res-uuid-item-001",
    "status": "ACTIVE",
    "timestamp": "2026-07-25T20:30:00.000Z"
  },
  "requestId": "req-uuid-put-action"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "message": "Resource deleted successfully",
  "data": null,
  "requestId": "req-uuid-delete-action"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "message": "Created successfully",
  "data": {
    "id": "res-uuid-item-001",
    "status": "ACTIVE",
    "timestamp": "2026-07-25T20:30:00.000Z"
  },
  "requestId": "req-uuid-post-action"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "message": "Resource deleted successfully",
  "data": null,
  "requestId": "req-uuid-delete-action"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "data": {
    "id": "entity-uuid-8899",
    "name": "Entity Details Object",
    "metadata": {
      "attribute": "value"
    },
    "updated_at": "2026-07-25T18:00:00.000Z"
  },
  "requestId": "req-uuid-single-entity"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "message": "Created successfully",
  "data": {
    "id": "res-uuid-item-001",
    "status": "ACTIVE",
    "timestamp": "2026-07-25T20:30:00.000Z"
  },
  "requestId": "req-uuid-post-action"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "message": "Created successfully",
  "data": {
    "id": "res-uuid-item-001",
    "status": "ACTIVE",
    "timestamp": "2026-07-25T20:30:00.000Z"
  },
  "requestId": "req-uuid-post-action"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "message": "Created successfully",
  "data": {
    "id": "res-uuid-item-001",
    "status": "ACTIVE",
    "timestamp": "2026-07-25T20:30:00.000Z"
  },
  "requestId": "req-uuid-post-action"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "data": {
    "id": "entity-uuid-8899",
    "name": "Entity Details Object",
    "metadata": {
      "attribute": "value"
    },
    "updated_at": "2026-07-25T18:00:00.000Z"
  },
  "requestId": "req-uuid-single-entity"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "message": "Updated successfully",
  "data": {
    "id": "res-uuid-item-001",
    "status": "ACTIVE",
    "timestamp": "2026-07-25T20:30:00.000Z"
  },
  "requestId": "req-uuid-patch-action"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "data": {
    "total_revenue": 15400,
    "active_students": 340,
    "course_rating": 4.9,
    "completion_rate": "82%"
  },
  "requestId": "req-uuid-analytics-fetch"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "message": "Created successfully",
  "data": {
    "id": "res-uuid-item-001",
    "status": "ACTIVE",
    "timestamp": "2026-07-25T20:30:00.000Z"
  },
  "requestId": "req-uuid-post-action"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "data": [
    {
      "id": "item-uuid-001",
      "title": "Example Portfolio Entity Item",
      "created_at": "2026-07-25T10:00:00.000Z",
      "status": "ACTIVE"
    },
    {
      "id": "item-uuid-002",
      "title": "Second Entity Record",
      "created_at": "2026-07-24T14:20:00.000Z",
      "status": "ACTIVE"
    }
  ],
  "pagination": {
    "total": 2,
    "page": 1,
    "limit": 10,
    "pages": 1
  },
  "requestId": "req-uuid-collection-fetch"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "message": "Updated successfully",
  "data": {
    "id": "res-uuid-item-001",
    "status": "ACTIVE",
    "timestamp": "2026-07-25T20:30:00.000Z"
  },
  "requestId": "req-uuid-patch-action"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "data": {
    "id": "entity-uuid-8899",
    "name": "Entity Details Object",
    "metadata": {
      "attribute": "value"
    },
    "updated_at": "2026-07-25T18:00:00.000Z"
  },
  "requestId": "req-uuid-single-entity"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "message": "Resource deleted successfully",
  "data": null,
  "requestId": "req-uuid-delete-action"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "message": "Updated successfully",
  "data": {
    "id": "res-uuid-item-001",
    "status": "ACTIVE",
    "timestamp": "2026-07-25T20:30:00.000Z"
  },
  "requestId": "req-uuid-patch-action"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "message": "Created successfully",
  "data": {
    "id": "res-uuid-item-001",
    "status": "ACTIVE",
    "timestamp": "2026-07-25T20:30:00.000Z"
  },
  "requestId": "req-uuid-post-action"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "data": {
    "id": "entity-uuid-8899",
    "name": "Entity Details Object",
    "metadata": {
      "attribute": "value"
    },
    "updated_at": "2026-07-25T18:00:00.000Z"
  },
  "requestId": "req-uuid-single-entity"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "data": {
    "id": "entity-uuid-8899",
    "name": "Entity Details Object",
    "metadata": {
      "attribute": "value"
    },
    "updated_at": "2026-07-25T18:00:00.000Z"
  },
  "requestId": "req-uuid-single-entity"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "message": "Updated successfully",
  "data": {
    "id": "res-uuid-item-001",
    "status": "ACTIVE",
    "timestamp": "2026-07-25T20:30:00.000Z"
  },
  "requestId": "req-uuid-patch-action"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "data": [
    {
      "id": "item-uuid-001",
      "title": "Example Portfolio Entity Item",
      "created_at": "2026-07-25T10:00:00.000Z",
      "status": "ACTIVE"
    },
    {
      "id": "item-uuid-002",
      "title": "Second Entity Record",
      "created_at": "2026-07-24T14:20:00.000Z",
      "status": "ACTIVE"
    }
  ],
  "pagination": {
    "total": 2,
    "page": 1,
    "limit": 10,
    "pages": 1
  },
  "requestId": "req-uuid-collection-fetch"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "message": "Updated successfully",
  "data": {
    "id": "res-uuid-item-001",
    "status": "ACTIVE",
    "timestamp": "2026-07-25T20:30:00.000Z"
  },
  "requestId": "req-uuid-patch-action"
}
```

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
  - **Example Return Object (JSON Schema):**

```json
{
  "success": true,
  "message": "Created successfully",
  "data": {
    "id": "res-uuid-item-001",
    "status": "ACTIVE",
    "timestamp": "2026-07-25T20:30:00.000Z"
  },
  "requestId": "req-uuid-post-action"
}
```

- **201**: Notification broadcasted

---

## Selective Lecture Dispatch & Student Classroom Management (Interactive Cohorts)

### 1. Add Lesson with Selective Student Target (Instructor)
- **Endpoint:** `POST /api/courses/:courseId/sections/:sectionId/lessons`
- **Description:** يسمح للمدرس بإضافة محاضرة جديدة سواء لكل المشتركين أو تخصيصها لمجموعة محددة من الطلاب المشتركين في الكورس (بإدخال أرقامهم في `target_student_ids`). يتم إرسال إشعار فوري للطلاب المستهدفين.
- **Token Required:** Yes (`INSTRUCTOR` or `ADMIN`)
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Request Body Example:**
```json
{
  "title": "React Hooks Live Recording (Session 2)",
  "duration": 3600,
  "video_url": "https://res.cloudinary.com/studyflow/video/upload/v12345/lesson2.mp4",
  "is_free_preview": false,
  "target_student_ids": [
    "cddfa21a-4c20-4e08-9b88-5c1a7d6e8f11",
    "fdeba32a-5c20-4e08-9b88-5c1a7d6e8f22"
  ]
}
```
- **Response (201 Created):**
```json
{
  "status": "success",
  "message": "Lesson added successfully",
  "data": {
    "id": "aaa111-bbb222-ccc333",
    "title": "React Hooks Live Recording (Session 2)",
    "duration": 3600,
    "video_url": "https://res.cloudinary.com/...",
    "sequence_order": 2,
    "is_free_preview": false,
    "is_targeted": true,
    "accessible_to": [
      { "student_id": "cddfa21a-4c20-4e08-9b88-5c1a7d6e8f11" },
      { "student_id": "fdeba32a-5c20-4e08-9b88-5c1a7d6e8f22" }
    ]
  }
}
```

---

### 2. Revoke Student Enrollment (Instructor Dashboard)
- **Endpoint:** `PATCH /api/instructor/courses/:courseId/students/:studentId/revoke`
- **Description:** يتيح للإنستراكتور تجميد/إلغاء اشتراك طالب في كورس معين (بتحويل الحالة إلى `REVOKED`) وإرسال إشعار فوري له، مع حفظ الفاتورة المالية والطلب في قاعدة البيانات دون حذف.
- **Token Required:** Yes (`INSTRUCTOR`)
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):**
```json
{
  "status": "success",
  "message": "Student enrollment revoked successfully",
  "data": {
    "id": "enrollment-uuid-001",
    "student_id": "student-uuid-001",
    "course_id": "course-uuid-001",
    "status": "REVOKED"
  }
}
```

---

### 3. Unified Student Classroom API (Student Dashboard)
- **Endpoint:** `GET /api/student-dashboard/courses/:courseId/classroom`
- **Description:** يجلب واجهة الدراسة الموحدة للطالب في الكورس، شاملة بيانات حسابه، تفاصيل الكورس، إحصائيات ونسبة تقدمه المحسوبة حصرياً على المحاضرات المتاحة له، ومحاضرة الاستئناف (`last_watched_lesson_id`)، بالإضافة لقائمة الدروس (العامة + الدروس المخصصة له خصيصاً).
- **Token Required:** Yes (`STUDENT` enrolled in the course)
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "student_info": {
      "id": "student-uuid-001",
      "full_name": "أحمد علي",
      "email": "ahmed@student.studyflow.com",
      "enrolled_at": "2026-08-01T10:00:00.000Z",
      "enrollment_status": "ACTIVE"
    },
    "course_info": {
      "id": "course-uuid-001",
      "title": "Front-End Development (React.js & Tailwind CSS)",
      "description": "Comprehensive interactive bootcamp...",
      "level": "BEGINNER",
      "language": "Arabic"
    },
    "progress_metrics": {
      "progress_percentage": 50.0,
      "completed_lessons_count": 1,
      "total_accessible_lessons": 2,
      "last_watched_lesson_id": "lesson-1-uuid",
      "completed_lesson_ids": ["lesson-1-uuid"],
      "completed_at": null
    },
    "curriculum": [
      {
        "section_id": "section-1-uuid",
        "title": "Week 1 - React Fundamentals",
        "sequence_order": 1,
        "lessons": [
          {
            "lesson_id": "lesson-1-uuid",
            "title": "Introduction to JSX & VDOM",
            "duration": 3000,
            "video_url": "https://...",
            "sequence_order": 1,
            "is_free_preview": true,
            "is_targeted": false,
            "is_completed": true,
            "watch_position_seconds": 3000,
            "last_watched_at": "2026-08-01T12:00:00.000Z"
          },
          {
            "lesson_id": "lesson-2-uuid",
            "title": "React Hooks Live Recording (Session 2)",
            "duration": 3600,
            "video_url": "https://...",
            "sequence_order": 2,
            "is_free_preview": false,
            "is_targeted": true,
            "is_completed": false,
            "watch_position_seconds": 450,
            "last_watched_at": "2026-08-01T14:30:00.000Z"
          }
        ]
      }
    ]
  }
}
```

---

## Universal User Profile API (Backend-Managed Avatar Upload)

### 1. Get User Profile
- **Endpoint:** `GET /api/user/profile` (or `/api/users/profile`)
- **Description:** يجلب بيانات الملف الشخصي الكاملة للمستخدم الحالي.
- **Token Required:** Yes (`Bearer Token` in Authorization header)
- **Response:**
```json
{
  "id": "uuid-string",
  "email": "student@studyflow.com",
  "full_name": "Ahmed Ali",
  "role": "STUDENT",
  "status": "ACTIVE",
  "bio": "Frontend Developer & React Enthusiast",
  "avatar_url": "https://res.cloudinary.com/trmszuqg/image/upload/v12345/avatars/uuid/filename.webp",
  "created_at": "2026-08-01T10:00:00.000Z"
}
```

### 2. Update User Profile (Backend-Managed File Upload)
- **Endpoint:** `PUT /api/user/profile` (or `/api/users/profile`)
- **Description:** تحديث بيانات الملف الشخصي (الاسم، السيرة الذاتية) مع خيار إرفاق وصيانة صورة البروفايل مباشرة عبر ملف مادي كـ `multipart/form-data`. يتولى الباك اند الرفع المباشر إلى خوادم سحابية (Cloudinary) مع قص الصورة (300x300 Face Crop) وتحويلها التلقائي لصيغة `WebP` فائقة الجودة، ومن ثم التحديث التلقائي وحذف الصورة السحابة القديمة إن وجد بأمان.
- **Token Required:** Yes (`Bearer Token` in Authorization header)
- **Content-Type:** `multipart/form-data`
- **Form Data Fields:**
  - `avatar` (File, Optional): ملف الصورة بصيغة JPEG أو PNG أو WebP بحد أقصى 5MB. يتم فحصه أمنياً عبر **Magic Bytes Signature Validation**.
  - `full_name` (String, Optional): الاسم الكامل الجديد.
  - `bio` (String, Optional): نبذة تعريفية للمستخدم.
- **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "uuid-string",
    "email": "student@studyflow.com",
    "full_name": "Ahmed Ali (Updated)",
    "role": "STUDENT",
    "status": "ACTIVE",
    "bio": "Senior Frontend Engineer & Instructor",
    "avatar_url": "https://res.cloudinary.com/trmszuqg/image/upload/v1785559999/avatars/user-id/uuid.webp",
    "updated_at": "2026-08-03T12:00:00.000Z"
  }
}
```
- **Error Responses:**
  - `400 Bad Request`: "Unsupported file format. Only JPEG, PNG, and WebP images are allowed." (أو التلاعب بالتوقيع الثماني للملف - Magic Bytes Mismatch).
  - `413 Payload Too Large`: عندما يولد المتصفح ملفاً فوق سعة 5MB.
  - `401 Unauthorized`: التوكين مفقود أو انتهت صلاحيته.
