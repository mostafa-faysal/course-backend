# Courses Module

---

## Category APIs

### Get All Categories
**Method:** GET
**URL:** `/api/categories`
**Description:** Retrieves a list of all categories.

### Get Category by ID
**Method:** GET
**URL:** `/api/categories/:id`
**Description:** Retrieves category details by ID.

### Create Category
**Method:** POST
**URL:** `/api/categories`
**Authentication:** Admin
**Description:** Creates a new category.

### Update Category
**Method:** PUT
**URL:** `/api/categories/:id`
**Authentication:** Admin
**Description:** Updates an existing category.

### Delete Category
**Method:** DELETE
**URL:** `/api/categories/:id`
**Authentication:** Admin
**Description:** Deletes a category.

---

## Home APIs

### Get Home Data
**Method:** GET
**URL:** `/api/home`
**Description:** Aggregated endpoint for all home page data.

### Individual Home Endpoints
- `GET /api/home/hero`
- `GET /api/home/categories`
- `GET /api/home/featured-courses`
- `GET /api/home/top-instructors`
- `GET /api/home/statistics`
- `GET /api/home/testimonials`
- `GET /api/home/faq`
- `GET /api/home/footer`

---

Method:
POST

URL:
`/api/courses`

Authentication:
- Instructor (Currently Public for Phase 4, to be secured later)

Description:
Creates a new course in the system with initial details. Validates the existence of the instructor and the category.

Request Parameters:
| Name | Type | Required | Description |
| ---- | ---- | -------- | ----------- |

Query Parameters:
| Name | Type | Required | Description |
| ---- | ---- | -------- | ----------- |

Request Body:
```json
{
  "title": "Mastering React 18",
  "description": "Learn everything about React 18, hooks, context API, and advanced patterns.",
  "instructor_id": "91df47be-2067-44c3-8790-ea80cd51dc0a",
  "category_id": "581c867a-7286-41dc-ac45-df9dcc42158c",
  "price": 49.99,
  "discount_price": 29.99,
  "level": "Intermediate",
  "language": "English",
  "requirements": [
    "Basic HTML/CSS",
    "JavaScript Fundamentals"
  ],
  "learning_outcomes": [
    "Build complex React apps",
    "Understand React Hooks"
  ],
  "status": "DRAFT"
}
```

---

## Get All Courses API

Method:
GET

URL:
`/api/courses`

Authentication:
- Public (or Admin/Instructor depending on visibility logic later)

Description:
Retrieves a paginated list of courses with advanced filtering, searching, and sorting capabilities. Returns metadata about the total count and pages.

Request Parameters:
| Name | Type | Required | Description |
| ---- | ---- | -------- | ----------- |

Query Parameters:
| Name | Type | Required | Description |
| ---- | ---- | -------- | ----------- |
| page | integer | No | Page number for pagination (default: 1) |
| limit | integer | No | Number of items per page (default: 10) |
| search | string | No | Search term to match course title or description |
| category_id | string (UUID) | No | Filter courses by specific category UUID |
| instructor_id | string (UUID) | No | Filter courses by specific instructor UUID |
| level | string | No | Filter courses by difficulty level |
| language | string | No | Filter courses by course language |
| min_price | number | No | Filter courses by minimum price |
| max_price | number | No | Filter courses by maximum price |
| status | string | No | Filter courses by status (DRAFT, PUBLISHED, HIDDEN) |
| sort_by | string | No | Field to sort by (price, created_at, title, enrollments) (default: created_at) |
| sort_order | string | No | Sorting order (asc, desc) (default: desc) |

Request Body:
```json
{}
```

---

## Update Course API

Method:
PUT

URL:
`/api/courses/:id`

Authentication:
- Instructor (Must be the course owner)
- Admin

Description:
Updates the details of an existing course. Checks both the existence of the course and whether the authenticated user has permission to modify it.

Request Parameters:
| Name | Type | Required | Description |
| ---- | ---- | -------- | ----------- |
| id | string (UUID) | Yes | The unique ID of the course to update |

Query Parameters:
| Name | Type | Required | Description |
| ---- | ---- | -------- | ----------- |

Request Body:
```json
{
  "title": "Advanced React 18 & Next.js",
  "price": 59.99
}
```

---

## Delete Course API

Method:
DELETE

URL:
`/api/courses/:id`

Authentication:
- Instructor (Must be the course owner)
- Admin

Description:
Deletes a course by its unique ID. Only the Instructor who owns the course or an Admin can perform this action. Handles database relation violations gracefully (returns error if course has active dependencies).

Request Parameters:
| Name | Type | Required | Description |
| ---- | ---- | -------- | ----------- |
| id | string (UUID) | Yes | The unique ID of the course to delete |

Query Parameters:
| Name | Type | Required | Description |
| ---- | ---- | -------- | ----------- |

Request Body:
```json
{}
```

---

## Course Details API

Method:
GET

URL:
`/api/courses/:id`

Authentication:
- Public

Description:
Retrieves detailed information of a course including instructor, category, sections, and lessons. Masks the `video_url` for lessons unless `is_free_preview` is true.

Request Parameters:
| Name | Type | Required | Description |
| ---- | ---- | -------- | ----------- |
| id | string (UUID) | Yes | The unique ID of the course to retrieve details for |

Query Parameters:
| Name | Type | Required | Description |
| ---- | ---- | -------- | ----------- |

Request Body:
```json
{}
```

---

## Create Review API

Method:
POST

URL:
`/api/courses/:id/reviews`

Authentication:
- Student (Must be enrolled in the course)

Description:
Allows a student to add a rating and an optional comment for a course they are enrolled in. A student can only review a course once.

Request Parameters:
| Name | Type | Required | Description |
| ---- | ---- | -------- | ----------- |
| id | string (UUID) | Yes | The unique ID of the course to be reviewed |

Request Body:
```json
{
  "rating": 5,
  "comment": "Excellent course! Very helpful."
}
```

Responses:
- `201 Created`: Review successfully added.
- `400 Bad Request`: Validation error (e.g. rating out of bounds).
- `401 Unauthorized`: Token missing or invalid.
- `403 Forbidden`: User is not a student, not enrolled, or already reviewed.
- `404 Not Found`: Course not found.

---

## Get Course Reviews API

Method:
GET

URL:
`/api/courses/:id/reviews`

Authentication:
- Public (Anyone can view reviews)

Description:
Retrieves a paginated list of all approved reviews for a specific course, along with the average rating and total number of reviews. Includes basic student information for each review.

Request Parameters:
| Name | Type | Required | Description |
| ---- | ---- | -------- | ----------- |
| id | string (UUID) | Yes | The unique ID of the course |

Query Parameters:
| Name | Type | Required | Description |
| ---- | ---- | -------- | ----------- |
| page | integer | No | Page number for pagination (default: 1) |
| limit | integer | No | Number of reviews per page (default: 10) |

Responses:
- `200 OK`: Reviews retrieved successfully along with stats and pagination data.
- `400 Bad Request`: Validation error for UUID or query parameters.
- `404 Not Found`: Course not found.

---

## Update Review API

Method:
PUT

URL:
`/api/courses/:courseId/reviews/:reviewId`

Authentication:
- Student (Review owner)
- Admin

Description:
Allows a student to update his own review. Admin can update any review if required.

Request Parameters:
| Name | Type | Required | Description |
| ---- | ---- | -------- | ----------- |
| courseId | string (UUID) | Yes | Course ID |
| reviewId | string (UUID) | Yes | Review ID |

Request Body (Optional fields, at least one required):
```json
{
  "rating": 4,
  "comment": "Updated review text"
}
```

Responses:
- `200 OK`: Review updated successfully.
- `400 Bad Request`: Validation error (invalid UUID or body).
- `401 Unauthorized`: Token missing or invalid.
- `403 Forbidden`: Not the owner of the review.
- `404 Not Found`: Review not found.

---

## Update Review API

Method:
PUT

URL:
`/api/courses/:courseId/reviews/:reviewId`

Authentication:
- Student (Review owner)
- Admin

Description:
Allows a student to update his own review. Admin can update any review if required.

Request Parameters:
| Name | Type | Required | Description |
| ---- | ---- | -------- | ----------- |
| courseId | string (UUID) | Yes | Course ID |
| reviewId | string (UUID) | Yes | Review ID |

Request Body (Optional fields, at least one required):
```json
{
  "rating": 4,
  "comment": "Updated review text"
}
```

Responses:
- `200 OK`: Review updated successfully.
- `400 Bad Request`: Validation error (invalid UUID or body).
- `401 Unauthorized`: Token missing or invalid.
- `403 Forbidden`: Not the owner of the review.
- `404 Not Found`: Review not found.

---

## Delete Review API

Method:
DELETE

URL:
`/api/courses/:courseId/reviews/:reviewId`

Authentication:
- Student (Review owner)
- Admin

Description:
Allows a student to delete his own review. Admin can delete any review if required.

Request Parameters:
| Name | Type | Required | Description |
| ---- | ---- | -------- | ----------- |
| courseId | string (UUID) | Yes | Course ID |
| reviewId | string (UUID) | Yes | Review ID |

Responses:
- `200 OK`: Review deleted successfully.
- `400 Bad Request`: Validation error.
- `401 Unauthorized`: Token missing or invalid.
- `403 Forbidden`: Not the owner of the review.
- `404 Not Found`: Review not found.

---

## Course Rating Summary API

Method:
GET

URL:
`/api/courses/:id/rating-summary`

Authentication:
- Public (No token required)

Description:
Returns the rating summary for a course, including average rating, total reviews, and a distribution breakdown of star ratings (1 to 5).

Request Parameters:
| Name | Type | Required | Description |
| ---- | ---- | -------- | ----------- |
| id | string (UUID) | Yes | Course ID |

Responses:
- `200 OK`: Returns the summary.
- `400 Bad Request`: Invalid course ID format.
- `404 Not Found`: Course not found.

Example Response:
```json
{
  "status": "success",
  "message": "Rating summary retrieved successfully",
  "data": {
    "average_rating": 4.5,
    "total_reviews": 120,
    "rating_distribution": {
      "5": { "count": 80, "percentage": 66.67 },
      "4": { "count": 30, "percentage": 25.00 },
      "3": { "count": 5, "percentage": 4.17 },
      "2": { "count": 3, "percentage": 2.50 },
      "1": { "count": 2, "percentage": 1.67 }
    }
  }
}
```

---

## Related Courses API

Method:
GET

URL:
`/api/courses/:id/related?limit=5`

Authentication:
- Public (No token required)

Description:
Returns a list of related courses (in the same category), excluding the current course. Only returns `PUBLISHED` courses. Sorted by enrollments and creation date.

Request Parameters:
| Name | Type | Required | Description |
| ---- | ---- | -------- | ----------- |
| id | string (UUID) | Yes | Course ID |
| limit | integer | No | Maximum number of courses to return (default: 5) |

Responses:
- `200 OK`: Returns the related courses array.
- `400 Bad Request`: Invalid course ID format.
- `404 Not Found`: Course not found.

Example Response:
```json
{
  "status": "success",
  "message": "Related courses retrieved successfully",
  "data": [
    {
      "id": "course-uuid",
      "title": "Another React Course",
      "price": 49.99,
      "discount_price": null,
      "thumbnail": "http://example.com/thumb.jpg",
      "level": "Intermediate",
      "instructor": {
        "id": "instructor-uuid",
        "full_name": "John Doe",
        "profile_picture": null
      },
      "_count": {
        "enrollments": 150,
        "reviews": 25
      }
    }
  ]
}
}
```

---

## Create Section API

Method:
POST

URL:
`/api/courses/:courseId/sections`

Authentication:
- Bearer Token required (`INSTRUCTOR` of the course, or `ADMIN`)

Description:
Creates a new section for a course. If `sequence_order` is omitted, the section is added to the end. If `sequence_order` is provided, existing sections will be shifted down automatically to make room. Duplicate titles within the same course are rejected.

Request Parameters:
| Name | Type | Required | Description |
| ---- | ---- | -------- | ----------- |
| courseId | string (UUID) | Yes | Course ID |

Request Body (JSON):
| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| title | string | Yes | The title of the section (3 to 150 chars). |
| sequence_order | integer | No | Position of the section. Auto-assigned if omitted. |

Responses:
- `201 Created`: Section created successfully.
- `400 Bad Request`: Validation error or duplicate title.
- `401 Unauthorized`: Token missing or invalid.
- `403 Forbidden`: Not the instructor of the course or an admin.
- `404 Not Found`: Course not found.

Example Request Body:
```json
{
  "title": "Introduction to Next.js",
  "sequence_order": 1
}
```

Example Response:
```json
{
  "status": "success",
  "message": "Section created successfully",
  "data": {
    "id": "sec-uuid",
    "course_id": "course-uuid",
    "title": "Introduction to Next.js",
    "sequence_order": 1,
    "created_at": "2026-07-19T10:00:00Z",
    "updated_at": "2026-07-19T10:00:00Z"
  }
}
```

---

## Update Section API

Method:
PUT

URL:
`/api/courses/:courseId/sections/:sectionId`

Authentication:
- Instructor (Must be the course owner)
- Admin

Description:
Updates a section's title and/or sequence order. Automatically shifts other sections to accommodate the new sequence order without creating duplicates or gaps.

Request Parameters:
| Name | Type | Required | Description |
| ---- | ---- | -------- | ----------- |
| courseId | string (UUID) | Yes | The unique ID of the course |
| sectionId | string (UUID) | Yes | The unique ID of the section |

Query Parameters:
| Name | Type | Required | Description |
| ---- | ---- | -------- | ----------- |

Request Body:
```json
{
  "title": "Advanced Next.js Architecture",
  "sequence_order": 2
}
```

Example Response:
```json
{
  "status": "success",
  "message": "Section updated successfully",
  "data": {
    "id": "sec-uuid",
    "course_id": "course-uuid",
    "title": "Advanced Next.js Architecture",
    "sequence_order": 2
  }
}
```

---

# Remaining Endpoints (To Be Implemented)

## Phase 5: Sections & Lessons
Endpoints for managing individual lessons within a section.

### 1. Create a Lesson
- **Endpoint**: `POST /api/courses/:courseId/sections/:sectionId/lessons`
- **Authentication**: Required (Instructor or Admin)
- **Description**: Creates a new lesson inside the specified section. Automatically places the lesson at the end of the sequence unless `sequence_order` is specified, in which case it cleanly inserts the lesson and shifts subsequent lessons down.
- **Request Body**:
  ```json
  {
    "title": "Introduction to React", // Required. Min 3 chars.
    "duration": 120,                  // Required. Duration in minutes/seconds.
    "video_url": "https://...",       // Optional.
    "is_free_preview": false,         // Optional. Defaults to false.
    "sequence_order": 1               // Optional.
  }
  ```
- **Responses**:
  - `201 Created`: Lesson successfully created.
  - `400 Bad Request`: Validation failure or duplicate title.
  - `403 Forbidden`: User is not the course instructor or an Admin.
  - `404 Not Found`: Course or section not found.

### 2. Update a Lesson
- **Endpoint**: `PATCH /api/courses/:courseId/sections/:sectionId/lessons/:lessonId`
- **Authentication**: Required (Instructor or Admin)
- **Description**: Updates a lesson's metadata or reorders it within the section using an atomic sequence shifting algorithm with pessimistic locking.
- **Request Body** (all fields optional):
  ```json
  {
    "title": "Advanced React",
    "duration": 150,
    "video_url": "https://...",
    "is_free_preview": true,
    "sequence_order": 2
  }
  ```
- **Responses**:
  - `200 OK`: Lesson updated successfully.
  - `400 Bad Request`: Validation failure or duplicate title.
  - `403 Forbidden`: User is not the course instructor or an Admin.
  - `404 Not Found`: Course, Section, or Lesson not found.

### 3. Delete a Lesson
- **Endpoint**: `DELETE /api/courses/:courseId/sections/:sectionId/lessons/:lessonId`
- **Authentication**: Required (Instructor or Admin)
- **Description**: Safely removes a lesson and automatically shifts sequence orders down to close gaps. Uses `SELECT ... FOR UPDATE` locking to guarantee integrity and prevent race conditions.
- **Responses**:
  - `200 OK`: Lesson deleted successfully.
  - `400 Bad Request`: Validation failure.
  - `403 Forbidden`: User is not the course instructor or an Admin.
  - `404 Not Found`: Course, Section, or Lesson not found.

- **Delete Section**: `DELETE /api/courses/:courseId/sections/:sectionId`
- **Create Lesson**: `POST /api/sections/:sectionId/lessons`
- **Update Lesson**: `PUT /api/lessons/:lessonId`
- **Delete Lesson**: `DELETE /api/lessons/:lessonId`
- **Lesson Ordering**: `PUT /api/courses/:courseId/lessons/reorder`
- **Video Upload**: `POST /api/upload/video`

## Phase 6: Enrollment System

### 1. Enroll in Course
- **Endpoint**: `POST /api/courses/:courseId/enroll`
- **Authentication**: Required (Student)
- **Description**: Enrolls a student in a course. If the course is free (`price == 0`), enrollment succeeds. If the course is paid (`price > 0`), it returns a `403 Forbidden` error instructing the student to purchase the course first. Validates that the course exists and is `PUBLISHED`. Automatically initializes `CourseProgress` for the student.
- **Responses**:
  - `201 Created`: Successfully enrolled.
  - `400 Bad Request`: Validation failure (UUID format) or Student is already enrolled in this course.
  - `401 Unauthorized`: Token missing or invalid.
  - `403 Forbidden`: Paid courses require purchase before enrollment.
  - `404 Not Found`: Course not found (or not published).

### 2. Get My Courses
- **Endpoint**: `GET /api/enrollments/my-courses`
- **Authentication**: Required (Student)
- **Description**: Retrieves a list of all courses the authenticated student is enrolled in, sorted by enrollment date descending.
- **Responses**:
  - `200 OK`: Returns the list of enrolled courses with progress percentage and course details (title, instructor, thumbnail).
  - `401 Unauthorized`: Token missing or invalid.

### 3. Get Course Enrollment Stats
- **Endpoint**: `GET /api/courses/:courseId/enrollments/stats`
- **Authentication**: Required (Instructor or Admin)
- **Description**: Retrieves enrollment statistics for a specific course. Instructors can only view stats for courses they own. Admins can view stats for any course.
- **Responses**:
  - `200 OK`: Returns the total number of enrollments.
  - `400 Bad Request`: Validation failure.
  - `401 Unauthorized`: Token missing or invalid.
  - `403 Forbidden`: You are not the instructor of this course.
  - `404 Not Found`: Course not found.

## Phase 7: Progress Tracking
- **Track Lesson Completion**: `POST /api/progress/lessons/:lessonId`
- **Student Course Progress**: `GET /api/progress/courses/:courseId`
- **Continue Watching**: `GET /api/progress/courses/:courseId/continue`

## Phase 8: Favorites System
- **Add Course To Favorites**: `POST /api/favorites/:courseId`
- **Remove Course From Favorites**: `DELETE /api/favorites/:courseId`
- **Get Student Favorites**: `GET /api/favorites`

## Phase 9: Shopping Cart System
- **Add Course To Cart**: `POST /api/cart/:courseId`
- **Remove Course From Cart**: `DELETE /api/cart/:courseId`
- **Get Cart**: `GET /api/cart`
- **Cart Validation**: `GET /api/cart/validate`

## Phase 10: Orders & Payments
- **Create Order**: `POST /api/orders`
- **Payment Integration**: `POST /api/payments/checkout`
- **Payment Verification**: `POST /api/payments/verify`
- **Order History**: `GET /api/orders`

## Phase 11: Instructor Dashboard
- **Instructor Courses**: `GET /api/instructor/courses`
- **Course Statistics**: `GET /api/instructor/courses/:courseId/stats`
- **Revenue Statistics**: `GET /api/instructor/revenue`
- **Student Analytics**: `GET /api/instructor/students`

## Phase 12: Admin Dashboard
- **Manage Users**: `GET /api/admin/users`, `PUT /api/admin/users/:id`
- **Manage Courses**: `GET /api/admin/courses`, `PUT /api/admin/courses/:id/status`
- **Manage Reviews**: `GET /api/admin/reviews`, `DELETE /api/admin/reviews/:id`
- **Reports & Analytics**: `GET /api/admin/reports`

## Phase 13: Notifications
- **Create Notification**: `POST /api/notifications`
- **Read Notifications**: `GET /api/notifications`, `PUT /api/notifications/:id/read`

## Phase 14: Final Production Preparation
- Security Review
- Performance Optimization
- Error Handling Review
- Swagger Final Review
- Environment Configuration
- Deployment Preparation
- Database Backup Strategy
- Production Testing
