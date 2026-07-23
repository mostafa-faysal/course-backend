# Changelog

## [Phase 11] Instructor Dashboard
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
- Added `GET /api/cart` to fetch student's shopping cart and dynamic calculation of total price.
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
