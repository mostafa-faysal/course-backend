# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-07-19

### Completed Phases Recap
- **Phase 1**: Database Setup & Configuration
- **Phase 2**: Authentication & User Management
- **Phase 3**: Core API Services Setup
- **Phase 4.1**: Categories CRUD
- **Phase 4.2 - 4.4**: Courses CRUD, Details, Search, Filters, Pagination
- **Phase 4.5 (In Progress)**: Reviews & Ratings, Related Courses

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

### Fixed
- Fixed runtime crash caused by `ts-node` type issues by migrating the development dev runner to `tsx watch`.
