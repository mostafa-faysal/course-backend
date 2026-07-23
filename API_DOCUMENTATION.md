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

## Phase 7: Progress Tracking
- **Track Lesson Completion**: `POST /api/progress/lessons/:lessonId`
- **Student Course Progress**: `GET /api/progress/courses/:courseId`
- **Continue Watching**: `GET /api/progress/courses/:courseId/continue`

## Phase 8: Favorites System

### 1. Add Course to Favorites
- **URL**: `/api/favorites/:courseId`
- **Method**: `POST`
- **Auth**: Required (`STUDENT`)
- **Description**: Adds a course to the student's favorites (wishlist). Operation is Idempotent.
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "message": "Course added to favorites successfully"
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`
  - `403 Forbidden`
  - `404 Not Found` (If course does not exist or is not PUBLISHED)

### 2. Remove Course from Favorites
- **URL**: `/api/favorites/:courseId`
- **Method**: `DELETE`
- **Auth**: Required (`STUDENT`)
- **Description**: Removes a course from favorites. Operation is Idempotent.
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "message": "Course removed from favorites successfully"
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`
  - `403 Forbidden`

### 3. Get Student Favorites
- **URL**: `/api/favorites`
- **Method**: `GET`
- **Auth**: Required (`STUDENT`)
- **Description**: Retrieves all favorite courses for the student, ordered by most recently added.
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "data": {
      "total": 1,
      "favorites": [
        {
          "id": "uuid",
          "course_id": "uuid",
          "created_at": "2024-01-01T00:00:00.000Z",
          "is_available": true,
          "course": {
            "id": "uuid",
            "title": "Course Title",
            "description": "...",
            "price": 100,
            "status": "PUBLISHED"
          }
        }
      ]
    }
  }
  ```

### 4. Check Favorite Status
- **URL**: `/api/favorites/:courseId/status`
- **Method**: `GET`
- **Auth**: Required (`STUDENT`)
- **Description**: Checks if a specific course is in the student's favorites.
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "data": {
      "is_favorite": true
    }
  }
  ```


## Phase 9: Shopping Cart System

### 1. Add Course To Cart
- **URL**: `/api/cart/items`
- **Method**: `POST`
- **Auth**: Required (`STUDENT`)
- **Description**: Adds a course to the student's shopping cart. Creates the cart if it doesn't exist.
- **Request Body**:
  ```json
  {
    "courseId": "uuid"
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "message": "Course added to cart successfully"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Already enrolled in the course.
  - `401 Unauthorized`: Token missing or invalid.
  - `403 Forbidden`: Not a student.
  - `404 Not Found`: Course not found or not published.
  - `409 Conflict`: Course is already in the cart.

### 2. Remove Course From Cart
- **URL**: `/api/cart/items/:courseId`
- **Method**: `DELETE`
- **Auth**: Required (`STUDENT`)
- **Description**: Removes a specific course from the student's cart.
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "message": "Course removed from cart successfully"
  }
  ```
- **Error Responses**:
  - `404 Not Found`: Item not found in cart.

### 3. Get Student Cart
- **URL**: `/api/cart`
- **Method**: `GET`
- **Auth**: Required (`STUDENT`)
- **Description**: Retrieves the student's current cart items, total price, and total courses count.
- **Success Response**: `200 OK`
  ```json
  {
    "status": "success",
    "data": {
      "total_price": 80,
      "total_courses_count": 1,
      "items": [
        {
          "id": "uuid",
          "title": "Course Title",
          "thumbnail": "url",
          "price": 100,
          "discount_price": 80
        }
      ]
    }
  }
  ```

## Phase 10: Orders & Payments
- **Create Order**: `POST /api/orders`
- **Payment Integration**: `POST /api/payments/checkout`
- **Payment Verification**: `POST /api/payments/verify`
- **Order History**: `GET /api/orders`

## Phase 10: Orders & Payments

### Create Order
**Method:** POST
**URL:** `/api/orders`
**Authentication:** Student
**Description:** Creates an order from the user's cart. Calculates active prices, saves them in order items, sets order and payment status to PENDING. Returns the newly created order.

### Verify Payment
**Method:** POST
**URL:** `/api/payments/verify`
**Authentication:** Student
**Description:** Mocks the payment verification process. If success is true, marks payment SUCCESS, order PAID, clears cart, and automatically creates course enrollments.
**Body:**
```json
{
  "orderId": "uuid",
  "success": true
}
```

### Get Order History
**Method:** GET
**URL:** `/api/orders/history`
**Authentication:** Student
**Description:** Retrieves all orders belonging to the authenticated student, including items and payment details.

## Phase 11: Instructor Dashboard

**All endpoints require authentication and INSTRUCTOR role.**

### Instructor Profile
**Method:** GET
**URL:** `/api/instructor/profile`
**Description:** Retrieves the basic profile information of the authenticated instructor.

### Dashboard Overview
**Method:** GET
**URL:** `/api/instructor/dashboard`
**Description:** Retrieves top-level aggregate statistics including total courses, published courses, draft courses, total students, total revenue, average rating, total reviews, and the 5 most recent enrollments.

### Instructor Courses
**Method:** GET
**URL:** `/api/instructor/courses`
**Query Parameters:** `page`, `limit`, `search`, `sort`, `order`
**Description:** Retrieves a paginated list of courses taught by the instructor with enrollment count, average rating, and revenue per course.

### Course Statistics
**Method:** GET
**URL:** `/api/instructor/courses/:courseId/stats`
**Description:** Retrieves detailed statistics for a specific course owned by the instructor. Returns 404 if the course is not found or not owned by the instructor.

### Revenue Statistics
**Method:** GET
**URL:** `/api/instructor/revenue`
**Query Parameters:** `period` (month, year, all - default is all)
**Description:** Calculates total revenue generated across all courses from completed orders, filtered by the given period.

### Student Analytics
**Method:** GET
**URL:** `/api/instructor/students`
**Query Parameters:** `page`, `limit`, `search`, `sort`, `order`
**Description:** Retrieves a paginated list of unique students enrolled in the instructor's courses, along with total purchased courses, completed courses, average progress, and last active date.

### Latest Enrollments
**Method:** GET
**URL:** `/api/instructor/enrollments/latest`
**Query Parameters:** `page`, `limit`
**Description:** Retrieves the most recent enrollments across all courses owned by the instructor.

### Reviews Overview
**Method:** GET
**URL:** `/api/instructor/reviews`
**Query Parameters:** `page`, `limit`, `search`, `sort`, `order`
**Description:** Retrieves recent reviews left on the instructor's courses.

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
