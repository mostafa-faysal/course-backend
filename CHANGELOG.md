# Changelog

## [Universal User Profile API] Backend-Managed Avatar File Upload, Storage Provider Abstraction & Magic Bytes Security Hardening
- **Backend-Managed Upload Pipeline (`PUT /api/v1/user/profile` / `PUT /api/user/profile`)**: Refactored profile updates from JSON URL parsing to direct `multipart/form-data` file processing via Multer memory storage and Cloudinary streaming without frontend cloud upload exposure.
- **Storage Provider Abstraction Layer (`src/services/storage/`)**: Built an extensible `IStorageProvider` interface paired with `CloudinaryService` implementation to cleanly decouple user service controllers from vendor-specific storage APIs (future-proofing for AWS S3 and Supabase Storage).
- **Transactional Order of Operations & Non-Blocking Deletion**: Hardened update sequencing to upload new avatar imagery first, commit new URLs to database records, and ONLY upon successful database updates perform non-blocking deletions of replaced Cloudinary avatar assets inside insulated error-handling blocks.
- **Deep Security Hardening (Magic Bytes Validation)**: Augmented standard MIME type (`image/jpeg`, `image/png`, `image/webp`) and extension filtering in Multer with rigorous binary inspection of file buffer **Magic Bytes signatures** in the storage provider to prevent header forgery and malware delivery.
- **Cloudinary On-The-Fly Image Transformation**: Automatic cloud transformations configured to auto-convert uploads to optimized `WebP` formats, auto-quality scaling, and face-centric trimming (300x300 pixel dimensions) stored inside isolated `avatars/{userId}/{uuid}` cloud namespace.
- **Interactive Swagger OpenAPI Enhancement**: Configured binary `avatar: type: string, format: binary` Schema representation enabling interactive **Choose File** buttons directly within Swagger UI documentation for live browser verification.

## [Instructor Selective Lecture Dispatch & Unified Student Classroom API] Interactive Cohort Management & Gated Access
- **Selective Lecture Dispatch (`LessonAccess`)**: Implemented dynamic lecture assignment where instructors can choose specific enrolled students (`target_student_ids`) when adding or publishing a lesson via `POST /api/courses/:courseId/sections/:sectionId/lessons`. Added `LessonAccess` junction model and `is_targeted: Boolean` attribute on `Lesson` to cleanly distinguish global lectures from targeted cohort sessions without database bloat.
- **Unified Student Classroom API (`GET /api/student-dashboard/courses/:courseId/classroom`)**: Created a single high-performance endpoint consolidating student account details, course metadata, real-time progress metrics (including resume video triggers via `last_watched_lesson_id`), and an accessible curriculum playlist containing only global lessons plus specifically dispatched private sessions.
- **Mathematical Progress Integrity Fix**: Updated `ProgressTrackingService` and `StudentDashboardService` calculation formulas to evaluate completion percentages against each student's specific accessible lesson count rather than global course lessons, completely eliminating denominator inflation for non-recipient students.
- **Instructor Student Management & Revocation (`PATCH /api/instructor/courses/:courseId/students/:studentId/revoke`)**: Enabled instructors to filter enrolled students per course (`GET /api/instructor/students?course_id=UUID`) and revoke student learning access (`EnrollmentStatus.REVOKED`) while preserving full financial invoice and payment records in PostgreSQL.
- **Automated In-App Notification Engine**: Hooked automated real-time notification dispatches (`NotificationHelper`) alerting students whenever a new lecture is released to their account or if enrollment access is updated.

## [Phase 5 & Production Readiness] StudyFlow Enterprise Seeding, Zero-Mock Enforcement & Frontend-Agnostic APIs
- **Interactive Front-End Cohort Seeding**: Configured a specialized interactive teaching test environment within the modular seeder (`03-students.seed.ts`, `06-lessons.seed.ts`, `07-enrollments.seed.ts`, `08-progress.seed.ts`, `10-orders.seed.ts`). Specifically designed 5 deterministic test accounts (`ahmed.frontend2026@student.studyflow.com`, etc.) enrolled with completed paid orders into the **Front-End Development (React.js & Tailwind CSS)** course taught by `ahmed.ali@studyflow.com`, simulating an ongoing cohort where only Lecture 1 is currently published and ready for progressive lecture rollout by instructors.
- **Zero Schema Modifications & Database Immunity**: Respected existing database schema without generating new migrations or deleting legacy database columns; UI fields (such as `icon` on `Category`) remain untouched in DB while being permanently excluded from REST API layers via targeted Projections.
- **Zero Mock Enforcement**: Removed all fallback arrays and mock logic across services (e.g., dummy testimonials array in `HomeService`). When database tables contain no records, endpoints natively return clean empty arrays `[]`. Instructor student enrollments and platform rating averages are calculated 100% via live Prisma relational queries without artificial marketing math offsets.
- **Frontend-Agnostic & UI De-coupling**: Permanently deleted all presentation-specific attributes (`icon`, `emoji`, `color`, `background`, `svg`, `theme`, etc.) across every single API response (including `/api/home/config`, `/api/home/categories`, `Why Choose Us`, and Category CRUD endpoints). Presentation decisions and UI library selection (Lucide, Heroicons, Tabler, SVG, PNG) belong 100% to Frontend developers without backend imposition.
- **Query Optimization (`select` vs `include`)**: Upgraded `CategoryService` and related reading endpoints from heavy relational `include` queries to explicit, lightweight `select` payloads (`id`, `name`, `created_at`, `_count`), guaranteeing that presentation-only DB columns never transmit across network channels.
- **Modular Enterprise Seeding Architecture (`prisma/seeds/`)**: Transformed legacy monolithic seeding into an enterprise-grade 17-module pipeline with robust helper architecture (`helpers/constants.ts`, `assets.ts` featuring verified Cloudinary URLs only, `names.ts`, `avatars.ts`, `random.ts`, `password.ts` featuring in-memory bcrypt caching). Executing `npx prisma db seed` operates deterministically and idempotently via `skipDuplicates` and upsert checks without duplicating database rows.

## [Phase 4.7 - Enterprise Caching Layer & Home API Refinements] High-Performance Modular Caching & Autocomplete Search
- **Cache Abstraction Layer (`src/cache/`)**: Built an extensible, Redis-ready caching layer implementing `ICacheProvider` to isolate caching concerns from core business services. Includes granular cache tags and specific TTL policies (e.g., Hero: 24h, Search: 5m, Courses: 15m) with automatic tag-based invalidation upon course, category, or review mutations.
- **Dedicated Static Configuration (`GET /api/home/config`)**: Established a clean static structural endpoint returning strictly unchangeable site configurations (`hero`, `why_choose_us`, `partners`, `footer`, `settings`) for instantaneous application bootstrap without DB querying overhead.
- **Search Suggestions & Autocomplete (`GET /api/home/search-suggestions`)**: Added lightweight search suggestion endpoint. When query `q` is empty, it instinctively returns the Top 5 Popular courses (with thumbnail, title, prices, and ID). When typed, performs blazing-fast prefix matching on `title` only without heavy description lookups.
- **Cache Invalidation Automation**: Attached automatic tag invalidation hooks in `CourseService`, `CategoryService`, `ReviewService`, and `AdminService` so real-time content changes instantly wipe relevant cache segments while preserving independent cached data.
- **API Documentation & Routing**: Fully synchronized Swagger annotations in `home.routes.ts` and comprehensive JSON response representations in `API_DOCUMENTATION.md`.

## [Phase 4.6 - Home Page Architecture & Modularization] Enterprise Lazy-Loading & Zero-Dummy Data Seeding
- **Zero-Dummy Data Philosophy**: Removed hardcoded mock courses, dummy testimonials, and fallback categories across Home Page services. All content is now strictly derived from real records inside PostgreSQL.
- **Production Database Seeding (`prisma/seed.ts`)**: Appended Stage 4 seeding to inject 4 realistic student accounts (with genuine Cloudinary profile imagery), course enrollments with varying volume per course (to generate natural popularity rankings), and verified 4-star/5-star Arabic reviews to power top-rated courses and testimonials natively.
- **Lightweight Global Shell API (`GET /api/home`)**: Transformed the primary `/api/home` endpoint from an all-in-one blocking aggregator into an ultra-fast structural shell endpoint returning fixed metadata only (`hero`, `statistics`, `partners`, `platform`, `platform_info`, `footer`). This significantly reduces initial payload size and maximizes First Contentful Paint speed.
- **Modular Lazy-Loading Section Endpoints**: Implemented dedicated section APIs for asynchronous frontend rendering:
  - `GET /api/home/partners`: Retrieves platform ecosystem technology partners and integrations.
  - `GET /api/home/featured-courses`: Retrieves top published courses sorted by enrollment interaction.
  - `GET /api/home/top-rated-courses`: Dynamically calculates and orders courses by verified database review rating averages.
  - `GET /api/home/popular-courses`: Orders courses by total confirmed enrollment volume.
  - `GET /api/home/new-courses`: Returns newly published courses sorted chronologically by creation timestamp.
- **OpenAPI / Swagger Documentation**: Updated Swagger definitions in `home.routes.ts` and refreshed complete schemas in `API_DOCUMENTATION.md`.

## [Course Imagery & Udemy-Style Poster Enhancement] Production-Ready Imagery, Video Posters & Projections
- **Database Schema (`Course` Model)**: Grouped visual media fields cleanly (`thumbnail`, `card_image`, `cover_image`, `preview_video`, and `preview_image` as optional URL `String?` inputs). Added `preview_image` to act as a high-resolution Video Poster image displayed in media players before `preview_video` begins playback (essential for Udemy-grade presentation), while avoiding DB redundancy by letting frontends generate SEO tags dynamically from course titles and descriptions.
- **Input Validation & Services**: Updated Zod validators (`course.validator.ts`) with strict URL formatting validation for imagery and video poster paths (`z.string().url().optional()`), and updated `CourseService` to persist all image assets cleanly.
- **Performance & Query Optimization (No-Include Enforcement)**: Replaced heavy, unneeded relational `include` statements across reading services with strict, lightweight `select` queries to prevent excessive database payload transfer.
- **Projections Enhancement across All Services**: Exposed `card_image`, `cover_image`, and `preview_image` across API endpoints (`HomeService`, `CourseService`, `InstructorService`, `FavoriteService`, `CartService`, `OrderService`, `StudentDashboardService`, `EnrollmentService`, `LearningPlanService`, and `AdminService`).
- **OpenAPI & Swagger Documentation**: Updated Swagger definitions in `course.routes.ts` and `cart.routes.ts` with Cloudinary image and video poster URI examples (`https://res.cloudinary.com/...`).

## [Course Metadata Enhancement] Production-Ready Numerical Course Highlights
- **Database Schema (`Course` Model)**: Added optional numerical metadata fields `duration_hours: Int?`, `duration_weeks: Int?`, and `projects_count: Int?` to store non-negative integer statistics while delegating string representation to the frontend presentation layer.
- **Input Validation**: Updated Zod validator (`course.validator.ts`) enforcing non-negative integer rules (`z.number().int().min(0).optional()`) for course creation and updating to prevent invalid data types or negative values.
- **Services & API Projections**: Added consistent projection (`duration_hours`, `duration_weeks`, `projects_count`) across all services returning course cards or details (`CourseService`, `FavoriteService`, `EnrollmentService`, `CartService`, `LearningPlanService`, and `AdminService`).
- **OpenAPI / Swagger documentation**: Expanded Swagger schemas in `course.routes.ts` and updated examples in `API_DOCUMENTATION.md`.

## [Phase 18] Final Production Preparation & Security Hardening
- **Security Headers (`helmet`)**: Hardened Helmet middleware config protecting against XSS, clickjacking (`frameguard: deny`), and MIME sniffing.
- **CORS Configuration**: Restricted cross-origin resource sharing strictly to explicit domains (`CORS_ORIGIN` from `.env`).
- **Environment Startup Validation**: Implemented strict Zod schema validation for required environment variables (`DATABASE_URL`, `JWT_SECRET`, `PORT`, `NODE_ENV`, `CORS_ORIGIN`) refusing server boot upon missing configurations.
- **Compression Middleware**: Attached global payload compression on all Express API outputs.
- **Rate Limiting**: Integrated `express-rate-limit` with global IP quotas (100 requests per 15 min) and stricter brute-force shielding on authentication routes (10 attempts per 15 min).
- **Prisma Exception Hardening**: Refactored `errorHandler` middleware to cleanly map Prisma known request errors (`P2002` -> 409 Conflict, `P2025` -> 404, validation errors -> 400) without leaking internal engine errors or SQL queries in production environments.
- **Graceful Shutdown**: Added runtime hooks for `SIGINT` and `SIGTERM` signals in `server.ts`, cleanly terminating active HTTP sessions and disconnecting Prisma connections (`await prisma.$disconnect()`).
- **Real Health Probes (`GET /api/health`, `GET /health`)**: Built dedicated `HealthController` dynamically running real Prisma database checks (`SELECT 1`), returning application uptime, DB connectivity status, and HTTP 503 upon offline databases.
- **Structured Winston Logging**: Replaced generic `console.log/error` calls across startup, middleware, and health checking with a versatile singleton Winston logger (colorized output in development, fully structured JSON stack traces in production).
- **Request ID Traceability**: Developed `requestIdMiddleware` embedding unique `X-Request-ID` UUIDs into request lifecycle, headers, logs, and error responses.
- **Docker & Clustering Ops**: Authored multi-stage production `Dockerfile` (node:20-alpine), exhaustive `.dockerignore`, and PM2 `ecosystem.config.js` cluster orchestration profile.
- **Database Backup & Disaster Recovery**: Created `BACKUP_STRATEGY.md` with explicit Neon PostgreSQL Point-in-Time Recovery guidelines, manual `pg_dump` CLI workflows, and comprehensive disaster recovery protocols.
- **Zero Route Mutation Guarantee**: Maintained identical API routing architecture without introducing unneeded `/api/v1` breaking version prefixes.

## [Phase 14] Assignments System
- Advanced Git-Style Submission versioning using `AssignmentSubmissionAttempt`.
- Comprehensive Grade Audit Logs (`AssignmentGradeHistory`).
- Flexible scoping of assignments (`course_id`, `section_id`, `lesson_id`).
- Native support for Multi-File Uploads via `AssignmentAttachment` and `SubmissionAttachment`.
- Overdue vs Late submission distinctions on Student Dashboard endpoints.
- Complex aggregation limits for scaling median scoring correctly.
- Endpoints to create, update, delete, view, grade, and submit assignments.

## [Phase 13] Learning Plans & Study Roadmap
- Introduced `LearningPlan` and `LearningPlanItem` models to support custom, user-defined study roadmaps.
- Designed endpoints entirely decoupled from `Enrollment`, `Wishlist`, and `Cart` data flows to maintain strict independence.
- Implemented a resilient 3-step Prisma transaction sequence logic to handle `@@unique([learning_plan_id, sequence_order])` reordering correctly.
- Added sequence normalization to ensure seamless indexing after any course is deleted from the learning plan.
- Combined Progress and Items inside `GET /api/student/learning-plan` to return a fully frontend-ready object including `estimatedDuration` and `courseStatus`.
- Integrated a Recommendation Engine with priority favoring same-category, published courses sorted by highest enrollment.
- Restrained from using `onDelete: Cascade` on the `Course` relation to future-proof the module for Soft Deleting and Archiving features.

## [Phase 12] Admin Dashboard
- Created `AdminService` combining parallel execution `Promise.all` for highly optimized aggregation fetching.
- Handled advanced business rules blocking self-edit for admins and guarding against status conflicts.
- Structured Dashboard payload systematically matching frontend requirements.
- Standardized uniform database-level pagination, searches, sorting, filtering avoiding manual TypeScript manipulation.
- Generated dynamic recent activity timelines efficiently parsing multiple database tables.
- All endpoints protected by role-based (`ADMIN`) and global authenticated guards.
- Implemented `InstructorService` utilizing complex Prisma aggregates to power the dashboard.
- Built strict business logic preventing cross-instructor access and filtering metrics properly.
- Added `GET /api/instructor/profile` for basic instructor details.
- Added `GET /api/instructor/dashboard` with high-level aggregates (revenue, students, ratings, etc.).
- Added `GET /api/instructor/courses` with pagination, search, sorting and per-course aggregates.
- Added `GET /api/instructor/courses/:courseId/stats` to dive deeper into a specific course.
- Added `GET /api/instructor/revenue` with time period filtering.
- Added `GET /api/instructor/students` for detailed student analytics (progress, purchase counts).
- Added `GET /api/instructor/enrollments/latest` and `GET /api/instructor/reviews` for recent activity monitoring.
- All collection endpoints support full `page`, `limit`, `search`, `sort`, and `order` parameters.

## [Phase 10] Orders & Payments
- Implemented `OrderService` for creating orders within a Prisma transaction, preventing creating orders for empty carts, saving active course prices inside `OrderItem`, and protecting against double enrollments.
- Added `MockPaymentProvider` to abstract and simulate payment gateway responses securely.
- Implemented `PaymentService` to reliably handle payment verification using Prisma transactions.
- Added strict business rules: preventing verify action on same order twice, restricting verify to original order owner, clearing student cart, creating course enrollments automatically upon successful payment.
- Added `POST /api/orders` to checkout cart into an order (PENDING).
- Added `POST /api/payments/verify` to mock process the payment securely and execute the success/failure workflows.
- Added `GET /api/orders/history` to retrieve order history for students.

## [Phase 9] Shopping Cart System
- Added `CartService` to handle `Cart` and `CartItem` operations within Prisma transactions.
- Added internal `validateCart` method for future checkout compatibility.
- Handled Prisma constraints (`P2002`) to ensure duplicate-free add to cart.
- Added `POST /api/cart/items` to add courses to shopping cart.
- Added `DELETE /api/cart/items/:courseId` to remove courses from shopping cart.
- Added `GET /api/cart` to fetch student's shopping cart and dynamic calculation of total

## [Unreleased]

### Added
- **Phase 16.1: User Role Management**
  - Added `UserRoleHistory` model to track role modifications.
  - Implemented `GET /api/admin/users/:id` for user details.
  - Implemented `PATCH /api/admin/users/:id/role` for updating user roles.
  - Implemented `GET /api/admin/users/:id/role-history` to view audit logs.
- **Phase 16: Authentication System**
  - Implemented `POST /api/auth/register` and `POST /api/auth/login` using `bcryptjs` and `jsonwebtoken`.
  - Enforced strict registration to default to `STUDENT` role.
  - Added `POST /api/auth/logout` and `GET /api/auth/me`.
  - Added `DELETED` to `UserStatus` enum in Prisma schema.
  - Built JWT middleware and role-based authorization middleware.
- **Phase 15: Student Dashboard & Progress** price.
## [Phase 8] Favorites System
- Added `created_at` to `WishlistItem` in `schema.prisma`.
- Implemented `FavoriteService` supporting Idempotent addition and removal.
- Added `POST /api/favorites/:courseId` to add courses to favorites.
- Added `DELETE /api/favorites/:courseId` to remove courses from favorites.
- Added `GET /api/favorites` to fetch student favorites ordered by date added with soft delete/availability checking.
- Added `GET /api/favorites/:courseId/status` to quickly check if a course is favorited.

## [Phase 7] Progress Tracking
- Added `LessonProgress.watch_position`, `LessonProgress.completed_at`, and `Enrollment.completed_at` to schema.
- Implemented `ProgressTrackingService` with automatic percentage recalculation relying on `completedLessons == totalLessons`.
- Added `POST /api/courses/:courseId/progress/lessons/:lessonId/complete` for tracking completions.
- Added `DELETE /api/courses/:courseId/progress/lessons/:lessonId/complete` for tracking un-completions (preserves analytics and watch position).
- Added `PUT /api/courses/:courseId/progress/lessons/:lessonId/watch` to update watch position and last watched lesson.
- Added `GET /api/courses/:courseId/progress` for retrieving total/completed/remaining lessons and timestamps.


All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-07-19

### Completed Phases Recap
- **Phase 1**: Database Setup & Configuration
- **Phase 2**: Authentication & User Management
- **Phase 3**: Core API Services Setup
- **Phase 4**: Courses CRUD, Details, Search, Filters, Reviews, Related Courses
- **Phase 5**: Sections & Lessons
- **Phase 6**: Enrollment System

### Added
- **Create Course API (`POST /api/courses`)**: Allows instructors to create courses with validation.
- **Get All Courses API (`GET /api/courses`)**: Includes support for pagination, full-text search, category and level filtering, and sorting.
- **Update Course API (`PUT /api/courses/:id`)**: Allows instructors (owners) and admins to edit course details.
- **Delete Course API (`DELETE /api/courses/:id`)**: Allows instructors (owners) and admins to delete courses, handling relation constraints.
- **Course Details API (`GET /api/courses/:id`)**: Retrieves course metadata, instructor, category, sections, and lessons, masking lesson video URLs unless marked as free preview.
- **Search, Filtering, Sorting and Pagination (`GET /api/courses`)**: Enhanced with support for price ranges, instructor, language, status filters, and sorting by popularity (enrollments).
- **Create Review API (`POST /api/courses/:id/reviews`)**: Allows enrolled students to submit a rating and comment for a course.
  - *(Files modified: `review.validator.ts`, `review.service.ts`, `review.controller.ts`, `review.routes.ts`, `course.routes.ts`, `API_DOCUMENTATION.md`)*
- **Get Course Reviews API (`GET /api/courses/:id/reviews`)**: Retrieves a paginated list of reviews for a course along with the average rating and total counts.
  - *(Files modified: `review.validator.ts`, `review.service.ts`, `review.controller.ts`, `review.routes.ts`, `API_DOCUMENTATION.md`)*
- **Update Review API (`PUT /api/courses/:courseId/reviews/:reviewId`)**: Allows a student to update his own review or Admin to update any review.
  - *(Files modified: `review.validator.ts`, `review.service.ts`, `review.controller.ts`, `review.routes.ts`, `API_DOCUMENTATION.md`)*
- **Delete Review API (`DELETE /api/courses/:courseId/reviews/:reviewId`)**: Allows a student to delete his own review or Admin to delete any review.
  - *(Files modified: `review.validator.ts`, `review.service.ts`, `review.controller.ts`, `review.routes.ts`, `test-review-api.ts`, `API_DOCUMENTATION.md`)*
- **Rating Summary API (`GET /api/courses/:id/rating-summary`)**: Returns average rating, total reviews, and a distribution breakdown of star ratings (1 to 5).
  - *(Files modified: `review.validator.ts`, `review.service.ts`, `review.controller.ts`, `course.routes.ts`, `test-review-api.ts`, `API_DOCUMENTATION.md`)*
- **Related Courses API (`GET /api/courses/:id/related`)**: Returns up to 5 published courses in the same category, sorted by enrollments.
  - *(Files modified: `course.service.ts`, `course.controller.ts`, `course.routes.ts`, `test-related-courses.ts`, `API_DOCUMENTATION.md`, `PROJECT_PROGRESS.md`)*
- **Create Section API (`POST /api/courses/:courseId/sections`)**: Allows course instructor or Admin to create a section with automatic sequence shifting.
  - *(Files modified: `section.validator.ts`, `section.service.ts`, `section.controller.ts`, `section.routes.ts`, `course.routes.ts`, `test-section-api.ts`, `API_DOCUMENTATION.md`, `PROJECT_PROGRESS.md`)*
- **Delete Lesson API (`DELETE /api/courses/:courseId/sections/:sectionId/lessons/:lessonId`)**: Safely removes a lesson and automatically shifts sequence orders down to close gaps. Uses `SELECT ... FOR UPDATE` locking to guarantee integrity and prevent race conditions.
- **Update Lesson API (`PATCH /api/courses/:courseId/sections/:sectionId/lessons/:lessonId`)**: Allows instructors to seamlessly update a lesson's metadata or completely reorder it within the section. Utilizes an atomic sequence shifting algorithm inside a transaction with pessimistic locking, guaranteeing integrity.
- **Create Lesson API (`POST /api/courses/:courseId/sections/:sectionId/lessons`)**: Enables instructors to add lessons inside sections. Implements secure transactional locking on the parent `Section` to automatically determine and reliably orchestrate `sequence_order` without Write Skew.
- **Delete Section API (`DELETE /api/courses/:courseId/sections/:sectionId`)**: Safely deletes a section, automatically shifts sequence orders down to close gaps, and securely cleans up orphaned lessons and progress tracking. Uses `SELECT ... FOR UPDATE` locking to guarantee integrity.
- **Update Section API (`PUT /api/courses/:courseId/sections/:sectionId`)**: Allows course instructor or Admin to update a section title or order, with transaction-based sequence shifting.
- **`optionalAuth` middleware**: Added for endpoints requiring conditional authentication.
  - *(Files modified: `section.validator.ts`, `section.service.ts`, `section.controller.ts`, `section.routes.ts`, `course.routes.ts`, `test-section-api.ts`, `API_DOCUMENTATION.md`, `PROJECT_PROGRESS.md`)*
- **Enroll Student API (`POST /api/courses/:courseId/enroll`)**: Implemented student enrollment logic. Includes strict business logic allowing free courses to enroll instantly while explicitly preventing enrollment in paid courses (`price > 0`) until the Phase 9/10 Orders/Payment gateways are built, returning a localized 403 error. 
- **Get My Courses API (`GET /api/enrollments/my-courses`)**: Retrieves all courses a student is enrolled in along with progress percentage.
- **Get Course Enrollment Stats API (`GET /api/courses/:courseId/enrollments/stats`)**: Retrieves total enrollment numbers securely for instructors (owners only) and admins.

### Fixed
- Fixed runtime crash caused by `ts-node` type issues by migrating the development dev runner to `tsx watch`.
