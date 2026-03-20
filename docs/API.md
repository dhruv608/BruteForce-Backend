# DSA Tracker Backend API Documentation

## Table of Contents

1. [Authentication](#authentication)
2. [Student APIs](#student-apis)
3. [Admin APIs](#admin-apis)
4. [SuperAdmin APIs](#superadmin-apis)
5. [Common Response Formats](#common-response-formats)
6. [Error Handling](#error-handling)

---

## Authentication

### Base URL: `/api/auth`

All authentication endpoints are **public** and don't require authentication tokens.

#### 1. Student Registration
**Endpoint:** `POST /api/auth/student/register`

**Request Body:**
```json
{
  "name": "string",
  "email": "string", 
  "username": "string",
  "password": "string",
  "batch_id": "number",
  "leetcode_id": "string (optional)",
  "gfg_id": "string (optional)",
  "github": "string (optional)",
  "linkedin": "string (optional)",
  "enrollment_id": "string (optional)"
}
```

**Response:**
```json
{
  "message": "Student registered successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "username": "johndoe",
    "batch_id": 1,
    "city_id": 1,
    "leetcode_id": "john123",
    "gfg_id": "john456",
    "github": "johndoe",
    "linkedin": "https://linkedin.com/in/johndoe",
    "enrollment_id": "ENR123"
  }
}
```

#### 2. Student Login
**Endpoint:** `POST /api/auth/student/login`

**Request Body:**
```json
{
  "email": "string (optional)",
  "username": "string (optional)",
  "password": "string"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "john@example.com",
    "username": "johndoe",
    "role": "STUDENT",
    "userType": "student",
    "batchId": 1,
    "batchSlug": "batch-2024",
    "cityId": 1
  },
  "tokens": {
    "accessToken": "jwt_token_here",
    "refreshToken": "refresh_token_here"
  }
}
```

#### 3. Student Logout
**Endpoint:** `POST /api/auth/student/logout`

**Headers:** `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "message": "Logout successful"
}
```

#### 4. Admin Login
**Endpoint:** `POST /api/auth/admin/login`

**Request Body:**
```json
{
  "email": "string (optional)",
  "username": "string (optional)",
  "password": "string"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "username": "admin",
    "role": "SUPERADMIN|TEACHER|INTERN",
    "userType": "admin",
    "batchId": 1,
    "batchSlug": "batch-2024",
    "cityId": 1
  },
  "tokens": {
    "accessToken": "jwt_token_here",
    "refreshToken": "refresh_token_here"
  }
}
```

#### 5. Admin Logout
**Endpoint:** `POST /api/auth/admin/logout`

**Headers:** `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "message": "Logout successful"
}
```

---

## Student APIs

### Base URL: `/api/students`

All endpoints require **authentication + STUDENT role**.

#### 1. Get Topics with Batch Progress
**Endpoint:** `GET /api/students/topics`

**Headers:** `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "topics": [
    {
      "id": 1,
      "topic_name": "Arrays",
      "slug": "arrays",
      "description": "Array data structures and algorithms",
      "classes": [
        {
          "id": 1,
          "class_name": "Basic Arrays",
          "slug": "basic-arrays",
          "duration": "2 hours",
          "totalQuestions": 10,
          "solvedQuestions": 7
        }
      ],
      "totalQuestions": 25,
      "solvedQuestions": 15
    }
  ]
}
```

#### 2. Get Topic Overview
**Endpoint:** `GET /api/students/topics/:topicSlug`

**Response:**
```json
{
  "topic": {
    "id": 1,
    "topic_name": "Arrays",
    "slug": "arrays",
    "description": "Array data structures and algorithms",
    "totalQuestions": 25,
    "solvedQuestions": 15
  },
  "classes": [
    {
      "id": 1,
      "class_name": "Basic Arrays",
      "slug": "basic-arrays",
      "duration": "2 hours",
      "totalQuestions": 10,
      "solvedQuestions": 7
    }
  ]
}
```

#### 3. Get Class Details with Questions
**Endpoint:** `GET /api/students/topics/:topicSlug/classes/:classSlug`

**Response:**
```json
{
  "class": {
    "id": 1,
    "class_name": "Basic Arrays",
    "slug": "basic-arrays",
    "duration": "2 hours",
    "description": "Introduction to arrays"
  },
  "questions": [
    {
      "id": 1,
      "question_name": "Two Sum",
      "level": "EASY",
      "platform": "LEETCODE",
      "platform_question_id": "1",
      "link": "https://leetcode.com/problems/two-sum/",
      "isSolved": true,
      "solvedAt": "2024-01-01T10:00:00.000Z"
    }
  ],
  "progress": {
    "totalQuestions": 10,
    "solvedQuestions": 7,
    "completionPercentage": 70
  }
}
```

#### 4. Get All Questions with Filters
**Endpoint:** `GET /api/students/addedQuestions`

**Description:** Get all questions with filtering options and solved status.

**Query Parameters (All Optional):**
- `level`: Filter by difficulty (EASY, MEDIUM, HARD)
- `platform`: Filter by platform (LEETCODE, GFG, CODESTUDIO)
- `topic`: Filter by topic name
- `solved`: Filter by solved status (true/false)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Example:** `GET /api/students/addedQuestions?level=EASY&solved=true&page=1&limit=10`

**Response:**
```json
{
  "questions": [
    {
      "id": 1,
      "question_name": "Two Sum",
      "level": "EASY",
      "platform": "LEETCODE",
      "platform_question_id": "1",
      "link": "https://leetcode.com/problems/two-sum/",
      "topic": {
        "id": 1,
        "topic_name": "Arrays",
        "slug": "arrays"
      },
      "isSolved": true,
      "solvedAt": "2024-01-01T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

#### 5. Get Student Leaderboard
**Endpoint:** `POST /api/students/leaderboard`

**Description:** Get leaderboard with top 10 students and student's personal rank.

**Request Body:**
```json
{
  "city": "all|city_name",
  "type": "weekly|monthly|all",
  "year": 2024
}
```

**Filters:**
- `city`: "all" for global rank, or specific city name for city rank
- `type`: "weekly" for weekly leaderboard, "monthly" for monthly, "all" for all-time
- `year`: Filter by batch year

**Response:**
```json
{
  "top10": [
    {
      "student_id": 1,
      "name": "John Doe",
      "username": "johndoe",
      "batch_year": 2024,
      "city_name": "New York",
      "max_streak": 5,
      "easy_solved": 85.5,
      "medium_solved": 72.3,
      "hard_solved": 45.8,
      "total_solved": 67.87,
      "rank": 1
    }
  ],
  "yourRank": {
    "rank": 15,
    "student_id": 15,
    "name": "Jane Smith",
    "username": "janesmith",
    "batch_year": 2024,
    "city_name": "New York",
    "max_streak": 3,
    "easy_solved": 65.2,
    "medium_solved": 58.9,
    "hard_solved": 32.1,
    "total_solved": 52.07
  },
  "filters": {
    "city": "all",
    "year": 2024,
    "type": "all"
  }
}
```

#### 6. Get Student Profile
**Endpoint:** `GET /api/students/profile`

**Description:** Get complete student profile with all sections.

**Response:**
```json
{
  "student": {
    "name": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "enrollmentId": "ENR123",
    "city": "New York",
    "batch": "Batch 2024",
    "year": 2024,
    "github": "johndoe",
    "linkedin": "https://linkedin.com/in/johndoe",
    "leetcode": "john123",
    "gfg": "john456",
    "profileImageUrl": "https://bucket.s3.region.amazonaws.com/profile-images/1234567890-123456789.jpg"
  },
  "codingStats": {
    "totalSolved": 243,
    "totalAssigned": 741,
    "easy": {
      "assigned": 215,
      "solved": 118
    },
    "medium": {
      "assigned": 388,
      "solved": 104
    },
    "hard": {
      "assigned": 138,
      "solved": 21
    }
  },
  "streak": {
    "currentStreak": 1,
    "maxStreak": 5
  },
  "leaderboard": {
    "globalRank": 15,
    "cityRank": 3
  },
  "heatmap": [
    {
      "date": "2024-01-01T00:00:00.000Z",
      "count": 5
    }
  ],
  "recentActivity": [
    {
      "problemTitle": "Two Sum",
      "difficulty": "EASY",
      "solvedAt": "2024-01-01T10:00:00.000Z"
    }
  ]
}
```

#### 7. Get Public Student Profile
**Endpoint:** `GET /api/students/profile/:username`

**Description:** Get public student profile by username (no authentication required).

**Path Parameters:**
- `username`: Student username

**Response:**
```json
{
  "student": {
    "name": "John Doe",
    "username": "johndoe",
    "city": "New York",
    "batch": "Batch 2024",
    "year": 2024,
    "github": "johndoe",
    "linkedin": "https://linkedin.com/in/johndoe",
    "leetcode": "john123",
    "gfg": "john456",
    "profileImageUrl": "https://bucket.s3.region.amazonaws.com/profile-images/1234567890-123456789.jpg"
  },
  "codingStats": {
    "totalSolved": 243,
    "totalAssigned": 741,
    "easy": {
      "assigned": 215,
      "solved": 118
    },
    "medium": {
      "assigned": 388,
      "solved": 104
    },
    "hard": {
      "assigned": 138,
      "solved": 21
    }
  },
  "streak": {
    "currentStreak": 1,
    "maxStreak": 5
  },
  "leaderboard": {
    "globalRank": 15,
    "cityRank": 3
  },
  "heatmap": [
    {
      "date": "2024-01-01T00:00:00.000Z",
      "count": 5
    }
  ],
  "recentActivity": [
    {
      "problemTitle": "Two Sum",
      "difficulty": "EASY",
      "solvedAt": "2024-01-01T10:00:00.000Z"
    }
  ]
}
```

#### 8. Upload Profile Image
**Endpoint:** `POST /api/students/profile-image`

**Description:** Upload or update student profile image.

**Headers:** `Authorization: Bearer <access_token>`

**Request:** `multipart/form-data`
- `file`: Image file (JPEG, JPG, PNG, max 5MB)

**Response:**
```json
{
  "success": true,
  "message": "Profile image uploaded successfully",
  "data": {
    "profileImageUrl": "https://bucket.s3.region.amazonaws.com/profile-images/1234567890-123456789.jpg",
    "fileName": "profile.jpg",
    "fileSize": 1024000
  }
}
```

#### 9. Delete Profile Image
**Endpoint:** `DELETE /api/students/profile-image`

**Description:** Delete student profile image.

**Headers:** `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "success": true,
  "message": "Profile image deleted successfully"
}
```

#### 10. Get Profile Image
**Endpoint:** `GET /api/students/profile-image`

**Description:** Get student profile image URL.

**Headers:** `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "profileImageUrl": "https://bucket.s3.region.amazonaws.com/profile-images/1234567890-123456789.jpg"
  }
}
```

---

## Admin APIs

### Base URL: `/api/admin`

All admin endpoints require **authentication + ADMIN role** (SuperAdmin, Teacher, Intern).

#### 1. Get Cities
**Endpoint:** `GET /api/admin/cities`

**Description:** Get all available cities.

**Response:**
```json
{
  "cities": [
    {
      "id": 1,
      "city_name": "New York",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### 2. Get Batches
**Endpoint:** `GET /api/admin/batches`

**Description:** Get all batches with optional filters.

**Query Parameters (Optional):**
- `city_id`: Filter by city ID
- `year`: Filter by batch year

**Response:**
```json
{
  "batches": [
    {
      "id": 1,
      "batch_name": "Batch 2024",
      "slug": "batch-2024",
      "year": 2024,
      "city_id": 1,
      "city": {
        "city_name": "New York"
      },
      "easy_assigned": 215,
      "medium_assigned": 388,
      "hard_assigned": 138,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### 3. Get Topics
**Endpoint:** `GET /api/admin/topics`

**Description:** Get all topics.

**Response:**
```json
{
  "topics": [
    {
      "id": 1,
      "topic_name": "Arrays",
      "slug": "arrays",
      "description": "Array data structures and algorithms",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### 4. Create Topic (Teacher+)
**Endpoint:** `POST /api/admin/topics`

**Description:** Create a new topic (Teacher and SuperAdmin only).

**Request Body:**
```json
{
  "topic_name": "String Manipulation",
  "slug": "string-manipulation",
  "description": "String processing algorithms"
}
```

**Response:**
```json
{
  "message": "Topic created successfully",
  "topic": {
    "id": 2,
    "topic_name": "String Manipulation",
    "slug": "string-manipulation",
    "description": "String processing algorithms"
  }
}
```

#### 5. Update Topic (Teacher+)
**Endpoint:** `PATCH /api/admin/topics/:id`

**Description:** Update an existing topic (Teacher and SuperAdmin only).

**Path Parameters:**
- `id`: Topic ID

**Request Body:**
```json
{
  "topic_name": "Advanced String Manipulation",
  "description": "Advanced string processing algorithms"
}
```

**Response:**
```json
{
  "message": "Topic updated successfully",
  "topic": {
    "id": 1,
    "topic_name": "Advanced String Manipulation",
    "slug": "string-manipulation",
    "description": "Advanced string processing algorithms",
    "updated_at": "2024-01-01T12:00:00.000Z"
  }
}
```

#### 6. Delete Topic (Teacher+)
**Endpoint:** `DELETE /api/admin/topics/:id`

**Description:** Delete a topic (Teacher and SuperAdmin only).

**Path Parameters:**
- `id`: Topic ID

**Response:**
```json
{
  "message": "Topic deleted successfully"
}
```

#### 7. Get Questions
**Endpoint:** `GET /api/admin/questions`

**Description:** Get all questions with optional filters.

**Query Parameters (Optional):**
- `level`: Filter by difficulty (EASY, MEDIUM, HARD)
- `platform`: Filter by platform (LEETCODE, GFG, CODESTUDIO)
- `topic_id`: Filter by topic ID
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:**
```json
{
  "questions": [
    {
      "id": 1,
      "question_name": "Two Sum",
      "level": "EASY",
      "platform": "LEETCODE",
      "platform_question_id": "1",
      "link": "https://leetcode.com/problems/two-sum/",
      "topic": {
        "id": 1,
        "topic_name": "Arrays",
        "slug": "arrays"
      },
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### 8. Create Question (Teacher+)
**Endpoint:** `POST /api/admin/questions`

**Description:** Create a new question (Teacher and SuperAdmin only).

**Request Body:**
```json
{
  "question_name": "Three Sum",
  "level": "MEDIUM",
  "platform": "LEETCODE",
  "platform_question_id": "15",
  "link": "https://leetcode.com/problems/3sum/",
  "topic_id": 1
}
```

**Response:**
```json
{
  "message": "Question created successfully",
  "question": {
    "id": 2,
    "question_name": "Three Sum",
    "level": "MEDIUM",
    "platform": "LEETCODE",
    "platform_question_id": "15",
    "link": "https://leetcode.com/problems/3sum/",
    "topic_id": 1,
    "created_at": "2024-01-01T12:00:00.000Z"
  }
}
```

#### 9. Update Question (Teacher+)
**Endpoint:** `PATCH /api/admin/questions/:id`

**Description:** Update an existing question (Teacher and SuperAdmin only).

**Path Parameters:**
- `id`: Question ID

**Request Body:**
```json
{
  "question_name": "Updated Three Sum",
  "level": "HARD",
  "link": "https://leetcode.com/problems/3sum/"
}
```

**Response:**
```json
{
  "message": "Question updated successfully",
  "question": {
    "id": 2,
    "question_name": "Updated Three Sum",
    "level": "HARD",
    "platform": "LEETCODE",
    "platform_question_id": "15",
    "link": "https://leetcode.com/problems/3sum/",
    "topic_id": 1,
    "updated_at": "2024-01-01T12:00:00.000Z"
  }
}
```

#### 10. Delete Question (Teacher+)
**Endpoint:** `DELETE /api/admin/questions/:id`

**Description:** Delete a question (Teacher and SuperAdmin only).

**Path Parameters:**
- `id`: Question ID

**Response:**
```json
{
  "message": "Question deleted successfully"
}
```

#### 11. Bulk Upload Questions (Teacher+)
**Endpoint:** `POST /api/admin/questions/bulk-upload`

**Description:** Upload multiple questions via CSV file (Teacher and SuperAdmin only).

**Request:** `multipart/form-data`
- `file`: CSV file with questions data

**CSV Format:**
```csv
question_name,level,platform,platform_question_id,link,topic_slug
Two Sum,EASY,LEETCODE,1,https://leetcode.com/problems/two-sum/,arrays
```

**Response:**
```json
{
  "message": "Questions uploaded successfully",
  "results": {
    "totalProcessed": 10,
    "successCount": 8,
    "failureCount": 2,
    "failures": [
      {
        "row": 3,
        "error": "Invalid topic slug"
      },
      {
        "row": 7,
        "error": "Duplicate platform question ID"
      }
    ]
  }
}
```

#### 12. Get Admin Stats
**Endpoint:** `POST /api/admin/stats`

**Description:** Get comprehensive admin statistics.

**Request Body:**
```json
{
  "batch_id": 1,
  "city_id": 1
}
```

**Response:**
```json
{
  "stats": {
    "totalStudents": 150,
    "activeStudents": 120,
    "totalQuestions": 500,
    "averageProgress": 65.5,
    "topPerformers": [
      {
        "student_id": 1,
        "name": "John Doe",
        "totalSolved": 245,
        "completionPercentage": 85.2
      }
    ],
    "batchStats": {
      "totalStudents": 150,
      "averageProgress": 65.5,
      "easyCompletion": 75.3,
      "mediumCompletion": 60.8,
      "hardCompletion": 45.2
    }
  }
}
```

#### 13. Get Admin Leaderboard
**Endpoint:** `POST /api/admin/leaderboard`

**Description:** Get admin leaderboard with pagination and search.

**Request Body:**
```json
{
  "city": "all|city_name",
  "type": "weekly|monthly|all",
  "year": 2024,
  "page": 1,
  "limit": 20,
  "search": "john"
}
```

**Filters:**
- `city`: "all" for global, or specific city name
- `type`: "weekly", "monthly", or "all"
- `year`: Batch year filter
- `page`: Page number
- `limit`: Items per page
- `search`: Search by student name or username

**Response:**
```json
{
  "leaderboard": [
    {
      "student_id": 1,
      "name": "John Doe",
      "username": "johndoe",
      "batch_year": 2024,
      "city_name": "New York",
      "max_streak": 5,
      "easy_solved": 85.5,
      "medium_solved": 72.3,
      "hard_solved": 45.8,
      "total_solved": 67.87,
      "rank": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

#### 14. Get Students
**Endpoint:** `GET /api/admin/students`

**Description:** Get all students with optional filters.

**Query Parameters (Optional):**
- `batch_id`: Filter by batch ID
- `city_id`: Filter by city ID
- `search`: Search by name or username
- `page`: Page number
- `limit`: Items per page

**Example:** `GET /api/admin/students?batch_id=1&search=john&page=1&limit=20`

**Response:**
```json
{
  "students": [
    {
      "id": 1,
      "name": "John Doe",
      "username": "johndoe",
      "email": "john@example.com",
      "enrollment_id": "ENR123",
      "batch": {
        "id": 1,
        "batch_name": "Batch 2024",
        "year": 2024
      },
      "city": {
        "id": 1,
        "city_name": "New York"
      },
      "leetcode_id": "john123",
      "gfg_id": "john456",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

#### 15. Create Student (Teacher+)
**Endpoint:** `POST /api/admin/students`

**Description:** Create a new student (Teacher and SuperAdmin only).

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "username": "janesmith",
  "password": "password123",
  "batch_id": 1,
  "leetcode_id": "jane456",
  "gfg_id": "jane789",
  "github": "janesmith",
  "linkedin": "https://linkedin.com/in/janesmith",
  "enrollment_id": "ENR456"
}
```

**Response:**
```json
{
  "message": "Student created successfully",
  "student": {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "username": "janesmith",
    "batch_id": 1,
    "city_id": 1,
    "leetcode_id": "jane456",
    "gfg_id": "jane789",
    "github": "janesmith",
    "linkedin": "https://linkedin.com/in/janesmith",
    "enrollment_id": "ENR456",
    "created_at": "2024-01-01T12:00:00.000Z"
  }
}
```

#### 16. Update Student (Teacher+)
**Endpoint:** `PATCH /api/admin/students/:id`

**Description:** Update student details (Teacher and SuperAdmin only).

**Path Parameters:**
- `id`: Student ID

**Request Body:**
```json
{
  "name": "Jane Updated",
  "email": "jane.updated@example.com",
  "github": "janeupdated",
  "linkedin": "https://linkedin.com/in/janeupdated"
}
```

**Response:**
```json
{
  "message": "Student updated successfully",
  "student": {
    "id": 2,
    "name": "Jane Updated",
    "email": "jane.updated@example.com",
    "username": "janesmith",
    "batch_id": 1,
    "city_id": 1,
    "leetcode_id": "jane456",
    "gfg_id": "jane789",
    "github": "janeupdated",
    "linkedin": "https://linkedin.com/in/janeupdated",
    "enrollment_id": "ENR456",
    "updated_at": "2024-01-01T12:00:00.000Z"
  }
}
```

#### 17. Delete Student (Teacher+)
**Endpoint:** `DELETE /api/admin/students/:id`

**Description:** Delete a student (Teacher and SuperAdmin only).

**Path Parameters:**
- `id`: Student ID

**Response:**
```json
{
  "message": "Student deleted successfully"
}
```

#### 18. Add Student Progress (Teacher+)
**Endpoint:** `POST /api/admin/students/progress`

**Description:** Manually add/update student progress (Teacher and SuperAdmin only).

**Request Body:**
```json
{
  "student_id": 1,
  "question_id": 1,
  "status": "SOLVED",
  "solved_at": "2024-01-01T10:00:00.000Z"
}
```

**Response:**
```json
{
  "message": "Student progress updated successfully",
  "progress": {
    "id": 123,
    "student_id": 1,
    "question_id": 1,
    "status": "SOLVED",
    "solved_at": "2024-01-01T10:00:00.000Z",
    "sync_at": "2024-01-01T10:00:00.000Z"
  }
}
```

#### 19. Manual Sync Student
**Endpoint:** `POST /api/admin/students/sync/:id`

**Description:** Manually sync student progress from external platforms.

**Path Parameters:**
- `id`: Student ID

**Response:**
```json
{
  "message": "Student sync completed successfully",
  "results": {
    "leetcode": {
      "synced": 15,
      "updated": 12,
      "failed": 3
    },
    "gfg": {
      "synced": 10,
      "updated": 8,
      "failed": 2
    },
    "totalProgress": 25
  }
}
```

#### 20. Bulk Student Upload
**Endpoint:** `POST /api/admin/bulk-operations`

**Description:** Bulk upload students via CSV file.

**Request:** `multipart/form-data`
- `file`: CSV file with student data

**CSV Format:**
```csv
name,email,username,password,batch_id,leetcode_id,gfg_id,github,linkedin,enrollment_id
John Doe,john@example.com,johndoe,password123,1,john123,john456,johndoe,https://linkedin.com/in/johndoe,ENR123
```

**Response:**
```json
{
  "message": "Students uploaded successfully",
  "results": {
    "totalProcessed": 50,
    "successCount": 45,
    "failureCount": 5,
    "failures": [
      {
        "row": 3,
        "error": "Email already exists"
      },
      {
        "row": 7,
        "error": "Invalid batch ID"
      }
    ]
  }
}
```

#### 21. Download Batch Report
**Endpoint:** `POST /api/admin/student/reportdownload`

**Description:** Download batch report in CSV format.

**Request Body:**
```json
{
  "batch_id": 1,
  "format": "csv"
}
```

**Response:** CSV file download with headers:
```
Content-Type: text/csv
Content-Disposition: attachment; filename="batch_report_2024-01-01.csv"
```

**CSV Content:**
```csv
student_id,name,email,username,total_solved,easy_solved,medium_solved,hard_solved,completion_percentage
1,John Doe,john@example.com,johndoe,245,118,104,21,65.5
2,Jane Smith,jane@example.com,janesmith,189,95,72,22,50.8
```

#### 22. Batch-Specific Routes

All routes below require `batchSlug` parameter and valid batch context.

##### 22.1 Get Topics for Batch
**Endpoint:** `GET /api/admin/:batchSlug/topics`

**Description:** Get all topics for a specific batch.

**Path Parameters:**
- `batchSlug`: Batch slug (e.g., "batch-2024")

**Response:**
```json
{
  "topics": [
    {
      "id": 1,
      "topic_name": "Arrays",
      "slug": "arrays",
      "description": "Array data structures and algorithms",
      "classes_count": 5,
      "total_questions": 50,
      "assigned_questions": 45
    }
  ]
}
```

##### 22.2 Get Classes by Topic
**Endpoint:** `GET /api/admin/:batchSlug/topics/:topicSlug/classes`

**Description:** Get all classes under a topic for a specific batch.

**Path Parameters:**
- `batchSlug`: Batch slug
- `topicSlug`: Topic slug

**Response:**
```json
{
  "classes": [
    {
      "id": 1,
      "class_name": "Basic Arrays",
      "slug": "basic-arrays",
      "duration": "2 hours",
      "description": "Introduction to arrays",
      "assigned_questions": 10,
      "total_students": 150
    }
  ]
}
```

##### 22.3 Create Class in Topic (Teacher+)
**Endpoint:** `POST /api/admin/:batchSlug/topics/:topicSlug/classes`

**Description:** Create a new class under a topic (Teacher and SuperAdmin only).

**Request Body:**
```json
{
  "class_name": "Advanced Arrays",
  "slug": "advanced-arrays",
  "duration": "3 hours",
  "description": "Advanced array algorithms"
}
```

**Response:**
```json
{
  "message": "Class created successfully",
  "class": {
    "id": 2,
    "class_name": "Advanced Arrays",
    "slug": "advanced-arrays",
    "duration": "3 hours",
    "description": "Advanced array algorithms",
    "topic_id": 1,
    "created_at": "2024-01-01T12:00:00.000Z"
  }
}
```

##### 22.4 Get Class Details
**Endpoint:** `GET /api/admin/:batchSlug/topics/:topicSlug/classes/:classSlug`

**Description:** Get detailed class information.

**Path Parameters:**
- `batchSlug`: Batch slug
- `topicSlug`: Topic slug
- `classSlug`: Class slug

**Response:**
```json
{
  "class": {
    "id": 1,
    "class_name": "Basic Arrays",
    "slug": "basic-arrays",
    "duration": "2 hours",
    "description": "Introduction to arrays",
    "topic": {
      "id": 1,
      "topic_name": "Arrays",
      "slug": "arrays"
    },
    "assigned_questions": 10,
    "total_students": 150,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

##### 22.5 Update Class (Teacher+)
**Endpoint:** `PATCH /api/admin/:batchSlug/topics/:topicSlug/classes/:classSlug`

**Description:** Update class details (Teacher and SuperAdmin only).

**Path Parameters:**
- `batchSlug`: Batch slug
- `topicSlug`: Topic slug
- `classSlug`: Class slug

**Request Body:**
```json
{
  "class_name": "Updated Basic Arrays",
  "duration": "2.5 hours",
  "description": "Updated introduction to arrays"
}
```

**Response:**
```json
{
  "message": "Class updated successfully",
  "class": {
    "id": 1,
    "class_name": "Updated Basic Arrays",
    "slug": "basic-arrays",
    "duration": "2.5 hours",
    "description": "Updated introduction to arrays",
    "topic_id": 1,
    "updated_at": "2024-01-01T12:00:00.000Z"
  }
}
```

##### 22.6 Delete Class (Teacher+)
**Endpoint:** `DELETE /api/admin/:batchSlug/topics/:topicSlug/classes/:classSlug`

**Description:** Delete a class (Teacher and SuperAdmin only).

**Path Parameters:**
- `batchSlug`: Batch slug
- `topicSlug`: Topic slug
- `classSlug`: Class slug

**Response:**
```json
{
  "message": "Class deleted successfully"
}
```

##### 22.7 Assign Questions to Class (Teacher+)
**Endpoint:** `POST /api/admin/:batchSlug/topics/:topicSlug/classes/:classSlug/questions`

**Description:** Assign questions to a class (Teacher and SuperAdmin only).

**Request Body:**
```json
{
  "question_ids": [1, 2, 3, 4, 5]
}
```

**Response:**
```json
{
  "message": "Questions assigned to class successfully",
  "results": {
    "assigned_count": 5,
    "already_assigned": 0,
    "not_found": 0
  }
}
```

##### 22.8 Get Assigned Questions of Class
**Endpoint:** `GET /api/admin/:batchSlug/topics/:topicSlug/classes/:classSlug/questions`

**Description:** Get all questions assigned to a class.

**Path Parameters:**
- `batchSlug`: Batch slug
- `topicSlug`: Topic slug
- `classSlug`: Class slug

**Query Parameters (Optional):**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:**
```json
{
  "questions": [
    {
      "id": 1,
      "question_name": "Two Sum",
      "level": "EASY",
      "platform": "LEETCODE",
      "platform_question_id": "1",
      "link": "https://leetcode.com/problems/two-sum/",
      "topic": {
        "id": 1,
        "topic_name": "Arrays",
        "slug": "arrays"
      },
      "assigned_at": "2024-01-01T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "totalPages": 1
  }
}
```

##### 22.9 Remove Question from Class (Teacher+)
**Endpoint:** `DELETE /api/admin/:batchSlug/topics/:topicSlug/classes/:classSlug/questions/:questionId`

**Description:** Remove a question from a class (Teacher and SuperAdmin only).

**Path Parameters:**
- `batchSlug`: Batch slug
- `topicSlug`: Topic slug
- `classSlug`: Class slug
- `questionId`: Question ID

**Response:**
```json
{
  "message": "Question removed from class successfully"
}
```

---

## SuperAdmin APIs

### Base URL: `/api/superadmin`

All SuperAdmin endpoints require **authentication + SUPERADMIN role**.

#### 1. City Management

##### 1.1 Create City
**Endpoint:** `POST /api/superadmin/cities`

**Description:** Create a new city.

**Request Body:**
```json
{
  "city_name": "Boston"
}
```

**Response:**
```json
{
  "message": "City created successfully",
  "city": {
    "id": 2,
    "city_name": "Boston",
    "created_at": "2024-01-01T12:00:00.000Z"
  }
}
```

##### 1.2 Get All Cities
**Endpoint:** `GET /api/superadmin/cities`

**Description:** Get all cities.

**Response:**
```json
{
  "cities": [
    {
      "id": 1,
      "city_name": "New York",
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "city_name": "Boston",
      "created_at": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

##### 1.3 Delete City
**Endpoint:** `DELETE /api/superadmin/cities/:id`

**Description:** Delete a city.

**Path Parameters:**
- `id`: City ID

**Response:**
```json
{
  "message": "City deleted successfully"
}
```

#### 2. Batch Management

##### 2.1 Create Batch
**Endpoint:** `POST /api/superadmin/batches`

**Description:** Create a new batch.

**Request Body:**
```json
{
  "batch_name": "Batch 2025",
  "slug": "batch-2025",
  "year": 2025,
  "city_id": 1,
  "easy_assigned": 250,
  "medium_assigned": 400,
  "hard_assigned": 150
}
```

**Response:**
```json
{
  "message": "Batch created successfully",
  "batch": {
    "id": 2,
    "batch_name": "Batch 2025",
    "slug": "batch-2025",
    "year": 2025,
    "city_id": 1,
    "easy_assigned": 250,
    "medium_assigned": 400,
    "hard_assigned": 150,
    "created_at": "2024-01-01T12:00:00.000Z"
  }
}
```

##### 2.2 Get All Batches
**Endpoint:** `GET /api/superadmin/batches`

**Description:** Get all batches.

**Response:**
```json
{
  "batches": [
    {
      "id": 1,
      "batch_name": "Batch 2024",
      "slug": "batch-2024",
      "year": 2024,
      "city_id": 1,
      "city": {
        "city_name": "New York"
      },
      "easy_assigned": 215,
      "medium_assigned": 388,
      "hard_assigned": 138,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

##### 2.3 Update Batch
**Endpoint:** `PATCH /api/superadmin/batches/:id`

**Description:** Update batch details.

**Path Parameters:**
- `id`: Batch ID

**Request Body:**
```json
{
  "batch_name": "Updated Batch 2024",
  "easy_assigned": 220,
  "medium_assigned": 390
}
```

**Response:**
```json
{
  "message": "Batch updated successfully",
  "batch": {
    "id": 1,
    "batch_name": "Updated Batch 2024",
    "slug": "batch-2024",
    "year": 2024,
    "city_id": 1,
    "easy_assigned": 220,
    "medium_assigned": 390,
    "hard_assigned": 138,
    "updated_at": "2024-01-01T12:00:00.000Z"
  }
}
```

##### 2.4 Delete Batch
**Endpoint:** `DELETE /api/superadmin/batches/:id`

**Description:** Delete a batch.

**Path Parameters:**
- `id`: Batch ID

**Response:**
```json
{
  "message": "Batch deleted successfully"
}
```

#### 3. Admin Management

##### 3.1 Create Admin
**Endpoint:** `POST /api/superadmin/admins`

**Description:** Create a new admin (SuperAdmin only).

**Request Body:**
```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "password123",
  "role": "TEACHER|INTERN",
  "batch_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin created successfully",
  "data": {
    "id": 2,
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "TEACHER",
    "batch_id": 1,
    "city_id": 1,
    "created_at": "2024-01-01T12:00:00.000Z"
  }
}
```

##### 3.2 Get All Admins
**Endpoint:** `GET /api/superadmin/admins`

**Description:** Get all admins with optional filters (defaults to TEACHER role only).

**Query Parameters (Optional):**
- `role`: Filter by role (TEACHER, INTERN) - defaults to TEACHER
- `batch_id`: Filter by batch ID
- `city_id`: Filter by city ID
- `search`: Search by name or username

**Example:** `GET /api/superadmin/admins?role=TEACHER&batch_id=1`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Admin",
      "email": "john.admin@example.com",
      "role": "TEACHER",
      "batch": {
        "id": 1,
        "batch_name": "Batch 2024",
        "year": 2024
      },
      "city": {
        "id": 1,
        "city_name": "New York"
      },
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

##### 3.3 Update Admin
**Endpoint:** `PATCH /api/superadmin/admins/:id`

**Description:** Update admin details (only role and batch_id allowed for SuperAdmin).

**Path Parameters:**
- `id`: Admin ID

**Request Body:**
```json
{
  "role": "TEACHER",
  "batch_id": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin updated successfully",
  "data": {
    "id": 1,
    "name": "John Admin",
    "email": "john.admin@example.com",
    "role": "TEACHER",
    "batch_id": 2,
    "city_id": 1,
    "updated_at": "2024-01-01T12:00:00.000Z"
  }
}
```

##### 3.4 Delete Admin
**Endpoint:** `DELETE /api/superadmin/admins/:id`

**Description:** Delete an admin.

**Path Parameters:**
- `id`: Admin ID

**Response:**
```json
{
  "success": true,
  "message": "Admin deleted successfully"
}
```

#### 4. System Statistics

##### 4.1 Get System Stats
**Endpoint:** `GET /api/superadmin/stats`

**Description:** Get comprehensive system statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCities": 10,
    "totalBatches": 25,
    "totalStudents": 2500,
    "totalAdmins": 50,
    "totalQuestions": 1000,
    "totalTopics": 20
  }
}
```

---

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

**Common Error Examples:**

#### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid request data",
  "details": "Email is required"
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "error": "Authentication required",
  "details": "Invalid or missing access token"
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "error": "Insufficient permissions",
  "details": "User role does not have access to this resource"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "error": "Resource not found",
  "details": "Student with ID 999 does not exist"
}
```

#### 409 Conflict
```json
{
  "success": false,
  "error": "Resource already exists",
  "details": "Email already registered"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "details": "Database connection failed"
}
```

### Pagination Response
```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## Error Handling

### Common HTTP Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource already exists
- **500 Internal Server Error**: Server error

### Common Error Messages

- `"Authentication required"`: Missing or invalid token
- `"Insufficient permissions"`: User doesn't have required role
- `"Student not found"`: Student resource not found
- `"Admin not found"`: Admin resource not found
- `"Email already exists"`: Email already registered
- `"Username already exists"`: Username already taken
- `"Invalid credentials"`: Incorrect login details

---

## Authentication Flow

1. **Login**: Use `/api/auth/student/login` or `/api/auth/admin/login` to get tokens
2. **Store Tokens**: Save access and refresh tokens securely
3. **Make Authenticated Requests**: Include access token in `Authorization: Bearer <token>` header
4. **Token Refresh**: Implement refresh token logic when access token expires
5. **Logout**: Call respective logout endpoint to invalidate tokens

---

## Rate Limiting & Best Practices

1. **Token Management**: Refresh tokens before they expire
2. **Error Handling**: Implement proper error handling for all API calls
3. **Pagination**: Use pagination for large datasets
4. **Filtering**: Use available filters to reduce data transfer
5. **File Uploads**: Use appropriate file formats and size limits
6. **Security**: Never expose sensitive information in frontend code

---

## Testing Endpoints

Use tools like Postman, curl, or Swagger UI (`/api-docs`) to test endpoints:

```bash
# Example: Login as student
curl -X POST http://localhost:5000/api/auth/student/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# Example: Get student profile
curl -X GET http://localhost:5000/api/students/profile \
  -H "Authorization: Bearer <access_token>"
```

---

## Notes

- All timestamps are in UTC format
- All IDs are integers
- Boolean values are `true`/`false`
- Null values are represented as `null` in JSON
- File uploads use `multipart/form-data`
- All datetime fields follow ISO 8601 format
- Pagination starts from page 1
- Search is case-insensitive where applicable
