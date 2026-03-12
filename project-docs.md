# DSA Tracker - Complete Project Documentation

## 1. Project Overview

### What this project is
- **DSA Tracker**: Educational platform for tracking Data Structures & Algorithms learning progress
- **Multi-tenant system**: Supports multiple cities, batches, and user roles
- **Progress tracking**: Monitors student problem-solving across external platforms

### What problem it solves
- **Centralized tracking**: Students solve problems on LeetCode/GFG, system tracks progress
- **Teacher management**: Teachers assign questions and monitor batch performance
- **Gamification**: Leaderboards and streaks to motivate students
- **Organization**: Structured curriculum with topics, classes, and assignments

### Who uses it
- **Students**: Solve assigned problems, track progress, compete on leaderboards
- **Teachers/Interns**: Create content, assign questions, monitor students
- **SuperAdmin**: Manage cities, batches, and admin users

### Core system workflow
Teacher creates topic → adds classes → assigns questions → students solve problems → system tracks progress → leaderboard updates automatically

---

## 2. User Roles

## SuperAdmin

**Purpose:**
System administration and multi-location management

**Responsibilities:**
• Create and manage cities
• Create and manage batches
• Create and manage admin users (Teachers/Interns)
• View system-wide statistics
• Complete platform oversight

**Key Actions:**
• CRUD operations on cities and batches
• Admin user management
• System analytics and monitoring

---

## Teacher / Admin

**Purpose:**
Content creation and student progress management

**Responsibilities:**
• Create topics and organize curriculum
• Create classes under topics
• Assign questions to classes
• Monitor student progress
• Generate batch reports

**Key Actions:**
• Topic/Class/Question management
• Question assignment to classes
• Progress tracking and analytics
• Student management within batch



## Student

**Purpose:**
Learning and problem-solving

**Responsibilities:**
• View assigned topics and questions
• Solve problems on external platforms
• Track personal progress
• Participate in leaderboards

**Key Actions:**
• View assigned content
• Mark questions as solved
• View progress and rankings
• Manage profile

---

## 3. System Architecture

### Backend Framework
- **Node.js + Express.js**: RESTful API server
- **TypeScript**: Type-safe development
- **Prisma ORM**: Database operations and migrations

### Database
- **PostgreSQL**: Primary database with relational data
- **Multi-tenant**: City → Batch → Student hierarchy
- **Indexes**: Optimized for batch-specific queries

### Authentication
- **JWT Tokens**: Access + refresh token system
- **Role-based**: SuperAdmin, Teacher, Intern, Student
- **Middleware chain**: Authentication → Authorization → Data extraction

### API Structure
```
/api/auth          - Authentication endpoints
/api/students      - Student-specific endpoints
/api/admin         - Teacher/Intern endpoints
/api/superadmin    - SuperAdmin endpoints
```

### Request Flow
Frontend → API Route → Authentication Middleware → Role Middleware → Controller → Service → Database → Response

---

## 4. API Documentation

## Student Registration

**Endpoint:**
POST /api/auth/student/register

**Description:**
Register new student with batch assignment

**Role Access:**
Public

**Frontend Usage:**
Used in **Student Registration Page** to create new student accounts

---

### Request

**Headers:**
Content-Type: application/json

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "username": "johndoe",
  "password": "password123",
  "enrollment_id": "ENR2025001",
  "batch_id": 1,
  "leetcode_id": "johndoe_lc",
  "gfg_id": "johndoe_gfg"
}
```

---

### Response Example

```json
{
  "message": "Student registered successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "username": "johndoe",
    "city": {
      "id": 1,
      "city_name": "Bangalore",
      "slug": "bangalore"
    },
    "batch": {
      "id": 1,
      "batch_name": "SO-Batch-2025",
      "slug": "so-batch-2025"
    }
  }
}
```

---

### Response Fields

- **message**: Registration status
- **user**: Created student profile
- **city**: Assigned city information
- **batch**: Assigned batch information

---

### Frontend Behavior

Frontend should:
• Collect student registration data
• Validate batch assignment
• Display success message with user details
• Redirect to login after successful registration

---

### Possible Errors

- **400**: Invalid input data
- **409**: Email/username already exists
- **500**: Server error

---

## Student Login

**Endpoint:**
POST /api/auth/student/login

**Description:**
Authenticate student and return JWT tokens

**Role Access:**
Public

**Frontend Usage:**
Used in **Student Login Page** for authentication

---

### Request

**Headers:**
Content-Type: application/json

**Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

---

### Response Example

```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "username": "johndoe",
    "role": "STUDENT",
    "city": {
      "id": 1,
      "city_name": "Bangalore",
      "slug": "bangalore"
    },
    "batch": {
      "id": 1,
      "batch_name": "SO-Batch-2025",
      "slug": "so-batch-2025"
    }
  }
}
```

---

### Response Fields

- **accessToken**: JWT access token (15 min)
- **refreshToken**: JWT refresh token (7 days)
- **user**: Student profile with batch/city info

---

### Frontend Behavior

Frontend should:
• Store tokens securely
• Save user profile in state/localStorage
• Redirect to student dashboard
• Set up authenticated requests

---

### Possible Errors

- **400**: Invalid credentials
- **401**: Authentication failed
- **500**: Server error

---

## Admin Login

**Endpoint:**
POST /api/auth/admin/login

**Description:**
Authenticate admin (Teacher/Intern/SuperAdmin) and return JWT tokens

**Role Access:**
Public

**Frontend Usage:**
Used in **Admin Login Page** for teacher/intern authentication

---

### Request

**Headers:**
Content-Type: application/json

**Body:**
```json
{
  "email": "teacher@example.com",
  "password": "password123"
}
```

---

### Response Example

```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Jane Smith",
    "email": "teacher@example.com",
    "username": "janesmith",
    "role": "TEACHER",
    "city": {
      "id": 1,
      "city_name": "Bangalore",
      "slug": "bangalore"
    },
    "batch": {
      "id": 1,
      "batch_name": "SO-Batch-2025",
      "slug": "so-batch-2025"
    }
  }
}
```

---

### Response Fields

- **accessToken**: JWT access token
- **refreshToken**: JWT refresh token
- **user**: Admin profile with role and assignments

---

### Frontend Behavior

Frontend should:
• Store tokens for authenticated requests
• Save admin role and permissions
• Redirect to appropriate admin dashboard
• Set up role-based UI

---

### Possible Errors

- **400**: Invalid credentials
- **401**: Authentication failed
- **500**: Server error

---

## Get Student Topics

**Endpoint:**
GET /api/students/topics

**Description:**
Get all topics with batch-specific progress for authenticated student

**Role Access:**
Student

**Frontend Usage:**
Used in **Student Dashboard** to display topic list with progress

---

### Request

**Headers:**
Authorization: Bearer token

---

### Response Example

```json
{
  "data": [
    {
      "id": 1,
      "topic_name": "Arrays and Strings",
      "slug": "arrays-strings",
      "batchSpecificData": {
        "totalClasses": 3,
        "totalQuestions": 15,
        "solvedQuestions": 8
      }
    },
    {
      "id": 2,
      "topic_name": "Binary Trees",
      "slug": "binary-trees",
      "batchSpecificData": {
        "totalClasses": 2,
        "totalQuestions": 10,
        "solvedQuestions": 3
      }
    }
  ]
}
```

---

### Response Fields

- **data**: Array of topics
- **id**: Topic ID
- **topic_name**: Topic display name
- **slug**: URL-friendly topic identifier
- **batchSpecificData**: Progress data for student's batch
- **totalClasses**: Number of classes in batch
- **totalQuestions**: Total assigned questions
- **solvedQuestions**: Questions solved by student

---

### Frontend Behavior

Frontend should:
• Display topic list with progress bars
• Calculate progress percentages
• Allow navigation to topic details
• Show completion status

---

### Possible Errors

- **401**: Authentication required
- **403**: Student access required
- **500**: Server error

---

## Get Topic Details

**Endpoint:**
GET /api/students/topics/:topicSlug

**Description:**
Get topic overview with classes and progress details

**Role Access:**
Student

**Frontend Usage:**
Used in **Topic Details Page** to show classes and overall progress

---

### Request

**Headers:**
Authorization: Bearer token

**Path Params:**
- **topicSlug**: Topic slug identifier

---

### Response Example

```json
{
  "id": 1,
  "topic_name": "Arrays and Strings",
  "slug": "arrays-strings",
  "description": "Fundamental data structures and string manipulation",
  "classes": [
    {
      "id": 1,
      "class_name": "Introduction to Arrays",
      "slug": "intro-arrays",
      "duration_minutes": 90,
      "totalQuestions": 5,
      "solvedQuestions": 3
    },
    {
      "id": 2,
      "class_name": "Advanced Array Problems",
      "slug": "advanced-arrays",
      "duration_minutes": 120,
      "totalQuestions": 8,
      "solvedQuestions": 4
    }
  ],
  "overallProgress": {
    "totalClasses": 2,
    "totalQuestions": 13,
    "solvedQuestions": 7
  }
}
```

---

### Response Fields

- **id**: Topic ID
- **topic_name**: Topic name
- **description**: Topic description
- **classes**: Array of classes in student's batch
- **class_name**: Class display name
- **slug**: Class slug
- **duration_minutes**: Class duration
- **totalQuestions**: Questions in class
- **solvedQuestions**: Questions solved by student
- **overallProgress**: Topic-wide progress summary

---

### Frontend Behavior

Frontend should:
• Display topic description and overview
• Show class list with progress
• Calculate overall topic progress
• Allow navigation to individual classes

---

### Possible Errors

- **401**: Authentication required
- **403**: Student access required
- **404**: Topic not found
- **500**: Server error

---

## Get Class Questions

**Endpoint:**
GET /api/students/topics/:topicSlug/classes/:classSlug

**Description:**
Get class details with all assigned questions and student progress

**Role Access:**
Student

**Frontend Usage:**
Used in **Class Details Page** to display questions for solving

---

### Request

**Headers:**
Authorization: Bearer token

**Path Params:**
- **topicSlug**: Topic slug
- **classSlug**: Class slug

---

### Response Example

```json
{
  "id": 1,
  "class_name": "Introduction to Arrays",
  "slug": "intro-arrays",
  "description": "Basic array operations and concepts",
  "duration_minutes": 90,
  "totalQuestions": 5,
  "solvedQuestions": 3,
  "questions": [
    {
      "id": 1,
      "question_name": "Two Sum",
      "question_link": "https://leetcode.com/problems/two-sum/",
      "platform": "LEETCODE",
      "level": "EASY",
      "type": "HOMEWORK",
      "isSolved": true,
      "syncAt": "2025-03-10T15:30:00Z"
    },
    {
      "id": 2,
      "question_name": "Best Time to Buy and Sell Stock",
      "question_link": "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
      "platform": "LEETCODE",
      "level": "EASY",
      "type": "CLASSWORK",
      "isSolved": false,
      "syncAt": null
    }
  ]
}
```

---

### Response Fields

- **id**: Class ID
- **class_name**: Class name
- **description**: Class description
- **duration_minutes**: Class duration
- **totalQuestions**: Total questions in class
- **solvedQuestions**: Questions solved by student
- **questions**: Array of assigned questions
- **question_name**: Question title
- **question_link**: URL to external platform
- **platform**: Source platform (LEETCODE/GFG/OTHER/INTERVIEWBIT)
- **level**: Difficulty (EASY/MEDIUM/HARD)
- **type**: Assignment type (HOMEWORK/CLASSWORK)
- **isSolved**: Student's solve status
- **syncAt**: When question was marked solved

---

### Frontend Behavior

Frontend should:
• Display class information and description
• Show question list with solve status
• Allow opening external platform links
• Enable marking questions as solved
• Show progress indicators

---

### Possible Errors

- **401**: Authentication required
- **403**: Student access required
- **404**: Class not found
- **500**: Server error

---

## Get Student Questions

**Endpoint:**
GET /api/students/addedQuestions

**Description:**
Get all assigned questions with filters, pagination, and solve status

**Role Access:**
Student

**Frontend Usage:**
Used in **Questions Page** for browsing and filtering all assigned problems

---

### Request

**Headers:**
Authorization: Bearer token

**Query Params:**
- **search**: Search in question names and topics
- **topic**: Filter by topic slug
- **level**: Filter by difficulty (EASY/MEDIUM/HARD)
- **platform**: Filter by platform (LEETCODE/GFG/OTHER/INTERVIEWBIT)
- **type**: Filter by type (HOMEWORK/CLASSWORK)
- **solved**: Filter by solve status (true/false)
- **page**: Page number (default: 1)
- **limit**: Items per page (default: 20)

---

### Response Example

```json
{
  "data": [
    {
      "id": 1,
      "question_name": "Two Sum",
      "question_link": "https://leetcode.com/problems/two-sum/",
      "platform": "LEETCODE",
      "level": "EASY",
      "type": "HOMEWORK",
      "topic": {
        "topic_name": "Arrays and Strings",
        "slug": "arrays-strings"
      },
      "created_at": "2025-03-01T10:00:00Z",
      "updated_at": "2025-03-01T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

### Response Fields

- **data**: Array of questions
  - **id**: Question ID
  - **question_name**: Question title
  - **question_link**: URL to the problem
  - **platform**: Platform (LEETCODE, GFG, OTHER, INTERVIEWBIT)
  - **level**: Difficulty (EASY, MEDIUM, HARD)
  - **type**: Assignment type (HOMEWORK, CLASSWORK)
  - **topic**: Topic information
  - **created_at**: Creation timestamp
  - **updated_at**: Last update timestamp
- **pagination**: Pagination metadata
  - **total**: Total number of questions
  - **page**: Current page number
  - **limit**: Items per page
  - **totalPages**: Total number of pages

---

### Frontend Behavior

Frontend should:
• Display filter controls with available options
• Show question list with status indicators
• Implement pagination
• Allow searching and filtering
• Display statistics summary
• Enable opening external platform links

---

### Possible Errors

- **401**: Authentication required
- **403**: Student access required
- **500**: Server error

---

## Get Student Leaderboard

**Endpoint:**
POST /api/students/leaderboard

**Description:**
Get leaderboard with personal rank and top performers

**Role Access:**
Student

**Frontend Usage:**
Used in **Leaderboard Page** to show rankings and competition

---

### Request

**Headers:**
Authorization: Bearer token
Content-Type: application/json

**Body:**
```json
{
  "limit": 10
}
```

---

### Response Example

```json
{
  "personalRank": {
    "rank": 5,
    "student": {
      "id": 1,
      "name": "John Doe",
      "username": "johndoe",
      "maxStreak": 15,
      "totalCount": 67
    }
  },
  "topPerformers": [
    {
      "rank": 1,
      "name": "Alice Smith",
      "username": "alicesmith",
      "maxStreak": 25,
      "totalCount": 85
    },
    {
      "rank": 2,
      "name": "Bob Johnson",
      "username": "bobjohnson",
      "maxStreak": 20,
      "totalCount": 78
    }
  ],
  "batchStats": {
    "totalStudents": 45,
    "averageCount": 52,
    "topStreak": 25
  }
}
```

---

### Response Fields

- **personalRank**: Student's personal ranking
- **rank**: Student's rank in batch
- **student**: Student's statistics
- **maxStreak**: Maximum solving streak
- **totalCount**: Total problems solved
- **topPerformers**: Array of top students
- **batchStats**: Batch-wide statistics
- **totalStudents**: Total students in batch
- **averageCount**: Average problems solved
- **topStreak**: Highest streak in batch

---

### Frontend Behavior

Frontend should:
• Highlight student's personal rank
• Display top performers list
• Show batch statistics
• Allow viewing more rankings
• Display streak information

---

### Possible Errors

- **401**: Authentication required
- **403**: Student access required
- **500**: Server error

---

## Get Student Profile

**Endpoint:**
GET /api/students/profile

**Description:**
Get complete student profile with all sections

**Role Access:**
Student

**Frontend Usage:**
Used in **Profile Page** to display comprehensive student information

---

### Request

**Headers:**
Authorization: Bearer token

---

### Response Example

```json
{
  "personalInfo": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "username": "johndoe",
    "leetcode_id": "johndoe_lc",
    "gfg_id": "johndoe_gfg",
    "github": "johndoe",
    "linkedin": "john-doe",
    "city": {
      "id": 1,
      "city_name": "Bangalore",
      "slug": "bangalore"
    },
    "batch": {
      "id": 1,
      "batch_name": "SO-Batch-2025",
      "slug": "so-batch-2025"
    }
  },
  "codingStats": {
    "leetcode": {
      "totalSolved": 67,
      "lastSynced": "2025-03-10T15:30:00Z"
    },
    "gfg": {
      "totalSolved": 45,
      "lastSynced": "2025-03-09T10:15:00Z"
    }
  },
  "progressSummary": {
    "totalQuestions": 150,
    "solvedQuestions": 67,
    "progressPercentage": 44.7,
    "currentStreak": 5,
    "maxStreak": 15
  },
  "recentActivity": [
    {
      "question_name": "Two Sum",
      "platform": "LEETCODE",
      "solvedAt": "2025-03-10T15:30:00Z"
    }
  ]
}
```

---

### Response Fields

- **personalInfo**: Basic student information
- **codingStats**: Platform-specific statistics
- **progressSummary**: Overall learning progress
- **recentActivity**: Recently solved questions
- **totalQuestions**: Total assigned questions
- **solvedQuestions**: Total solved questions
- **progressPercentage**: Completion percentage
- **currentStreak**: Current solving streak
- **maxStreak**: Historical maximum streak

---

### Frontend Behavior

Frontend should:
• Display personal information
• Show platform statistics
• Visualize progress summary
• List recent activity
• Allow profile editing

---

### Possible Errors

- **401**: Authentication required
- **403**: Student access required
- **500**: Server error

---

## Get All Topics (Admin)

**Endpoint:**
GET /api/admin/topics

**Description:**
Get all topics available for content management

**Role Access:**
Admin (Teacher/Intern/SuperAdmin)

**Frontend Usage:**
Used in **Admin Topics Page** for topic management

---

### Request

**Headers:**
Authorization: Bearer token

---

### Response Example

```json
[
  {
    "id": 1,
    "topic_name": "Arrays and Strings",
    "slug": "arrays-strings",
    "description": "Fundamental data structures",
    "order": 1,
    "created_at": "2025-03-01T10:00:00Z",
    "updated_at": "2025-03-01T10:00:00Z"
  }
]
```

---

### Response Fields

- **id**: Topic ID
- **topic_name**: Topic name
- **slug**: URL-friendly identifier
- **description**: Topic description
- **order**: Display order
- **created_at**: Creation timestamp
- **updated_at**: Last update timestamp

---

### Frontend Behavior

Frontend should:
• Display list of all topics
• Allow topic editing and deletion
• Show creation and update times
• Enable topic ordering

---

### Possible Errors

- **401**: Authentication required
- **403**: Admin access required
- **500**: Server error

---

## Create Topic

**Endpoint:**
POST /api/admin/topics

**Description:**
Create new topic for curriculum

**Role Access:**
Teacher or above

**Frontend Usage:**
Used in **Create Topic Modal** for adding new curriculum topics

---

### Request

**Headers:**
Authorization: Bearer token
Content-Type: application/json

**Body:**
```json
{
  "topic_name": "Dynamic Programming",
  "description": "Introduction to DP concepts and patterns",
  "order": 5
}
```

---

### Response Example

```json
{
  "message": "Topic created successfully",
  "topic": {
    "id": 5,
    "topic_name": "Dynamic Programming",
    "slug": "dynamic-programming",
    "description": "Introduction to DP concepts and patterns",
    "order": 5,
    "created_at": "2025-03-10T16:00:00Z"
  }
}
```

---

### Response Fields

- **message**: Creation status
- **topic**: Created topic details
- **id**: New topic ID
- **slug**: Generated slug from topic name

---

### Frontend Behavior

Frontend should:
• Collect topic information
• Validate required fields
• Show success message
• Refresh topic list
• Clear form after success

---

### Possible Errors

- **400**: Invalid input data
- **401**: Authentication required
- **403**: Teacher access required
- **409**: Topic name already exists
- **500**: Server error

---

## Update Topic

**Endpoint:**
PATCH /api/admin/topics/:id

**Description:**
Update existing topic information

**Role Access:**
Teacher or above

**Frontend Usage:**
Used in **Edit Topic Modal** for updating curriculum topics

---

### Request

**Headers:**
Authorization: Bearer token
Content-Type: application/json

**Path Params:**
- **id**: Topic ID

**Body:**
```json
{
  "topic_name": "Dynamic Programming Updated",
  "description": "Comprehensive DP guide with advanced patterns",
  "order": 6
}
```

---

### Response Example

```json
{
  "message": "Topic updated successfully",
  "topic": {
    "id": 5,
    "topic_name": "Dynamic Programming Updated",
    "slug": "dynamic-programming-updated",
    "description": "Comprehensive DP guide with advanced patterns",
    "order": 6,
    "updated_at": "2025-03-10T16:30:00Z"
  }
}
```

---

### Response Fields

- **message**: Update status
- **topic**: Updated topic details
- **updated_at**: Update timestamp

---

### Frontend Behavior

Frontend should:
• Pre-fill form with existing data
• Allow editing topic information
• Validate input before submission
• Show success/error messages
• Refresh topic list after update

---

### Possible Errors

- **400**: Invalid input data
- **401**: Authentication required
- **403**: Teacher access required
- **404**: Topic not found
- **409**: Topic name already exists
- **500**: Server error

---

## Delete Topic

**Endpoint:**
DELETE /api/admin/topics/:id

**Description:**
Delete topic and all associated data

**Role Access:**
Teacher or above

**Frontend Usage:**
Used in **Topic Management** for removing curriculum topics

---

### Request

**Headers:**
Authorization: Bearer token

**Path Params:**
- **id**: Topic ID

---

### Response Example

```json
{
  "message": "Topic deleted successfully"
}
```

---

### Response Fields

- **message**: Deletion status

---

### Frontend Behavior

Frontend should:
• Show confirmation dialog before deletion
• Warn about associated data loss
• Remove topic from UI after success
• Handle cascade deletion properly

---

### Possible Errors

- **401**: Authentication required
- **403**: Teacher access required
- **404**: Topic not found
- **500**: Server error

---

## Get All Questions (Admin)

**Endpoint:**
GET /api/admin/questions

**Description:**
Get all questions for management

**Role Access:**
Admin (Teacher/Intern/SuperAdmin)

**Frontend Usage:**
Used in **Question Management Page** for viewing all questions

---

### Request

**Headers:**
Authorization: Bearer token

**Query Params:**
- **topic**: Filter by topic ID
- **platform**: Filter by platform
- **level**: Filter by difficulty
- **search**: Search in question names

---

### Response Example

```json
{
  "questions": [
    {
      "id": 1,
      "question_name": "Two Sum",
      "question_link": "https://leetcode.com/problems/two-sum/",
      "platform": "LEETCODE",
      "level": "EASY",
      "type": "HOMEWORK",
      "topic": {
        "id": 1,
        "topic_name": "Arrays and Strings",
        "slug": "arrays-strings"
      },
      "created_at": "2025-03-01T10:00:00Z"
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

---

### Response Fields

- **questions**: Array of questions
- **id**: Question ID
- **question_name**: Question title
- **question_link**: External platform URL
- **platform**: Source platform
- **level**: Difficulty level
- **type**: Assignment type
- **topic**: Associated topic
- **pagination**: Pagination metadata

---

### Frontend Behavior

Frontend should:
• Display question list with filters
• Show topic and platform information
• Allow question editing and deletion
• Implement pagination
• Enable bulk operations

---

### Possible Errors

- **401**: Authentication required
- **403**: Admin access required
- **500**: Server error

---

## Create Question

**Endpoint:**
POST /api/admin/questions

**Description:**
Create new question for assignment

**Role Access:**
Teacher or above

**Frontend Usage:**
Used in **Create Question Modal** for adding new problems

---

### Request

**Headers:**
Authorization: Bearer token
Content-Type: application/json

**Body:**
```json
{
  "question_name": "Maximum Subarray",
  "question_link": "https://leetcode.com/problems/maximum-subarray/",
  "platform": "LEETCODE",
  "level": "MEDIUM",
  "type": "HOMEWORK",
  "topic_id": 1
}
```

---

### Response Example

```json
{
  "message": "Question created successfully",
  "question": {
    "id": 151,
    "question_name": "Maximum Subarray",
    "question_link": "https://leetcode.com/problems/maximum-subarray/",
    "platform": "LEETCODE",
    "level": "MEDIUM",
    "type": "HOMEWORK",
    "topic_id": 1,
    "created_at": "2025-03-10T17:00:00Z"
  }
}
```

---

### Response Fields

- **message**: Creation status
- **question**: Created question details
- **id**: New question ID

---

### Frontend Behavior

Frontend should:
• Collect question information
• Validate external platform URL
• Select topic from dropdown
• Show success message
• Refresh question list

---

### Possible Errors

- **400**: Invalid input data
- **401**: Authentication required
- **403**: Teacher access required
- **404**: Topic not found
- **409**: Question link already exists
- **500**: Server error

---

## Get Classes by Topic

**Endpoint:**
GET /api/admin/:batchSlug/topics/:topicSlug/classes

**Description:**
Get all classes for a topic in specific batch

**Role Access:**
Admin (Teacher/Intern/SuperAdmin)

**Frontend Usage:**
Used in **Topic Management Page** to show classes under topic

---

### Request

**Headers:**
Authorization: Bearer token

**Path Params:**
- **batchSlug**: Batch slug
- **topicSlug**: Topic slug

---

### Response Example

```json
{
  "classes": [
    {
      "id": 1,
      "class_name": "Array Basics",
      "slug": "array-basics",
      "description": "Introduction to array operations",
      "duration_minutes": 90,
      "class_date": "2025-03-15T14:00:00Z",
      "questionCount": 5,
      "created_at": "2025-03-01T10:00:00Z"
    }
  ]
}
```

---

### Response Fields

- **classes**: Array of classes
- **id**: Class ID
- **class_name**: Class name
- **slug**: Class slug
- **description**: Class description
- **duration_minutes**: Class duration
- **class_date**: Scheduled date
- **questionCount**: Number of assigned questions

---

### Frontend Behavior

Frontend should:
• Display class list for topic
• Show class scheduling information
• Allow class management (edit/delete)
• Display question counts
• Enable class creation

---

### Possible Errors

- **401**: Authentication required
- **403**: Admin access required
- **404**: Batch or topic not found
- **500**: Server error

---

## Create Class

**Endpoint:**
POST /api/admin/:batchSlug/topics/:topicSlug/classes

**Description:**
Create new class under topic

**Role Access:**
Teacher or above

**Frontend Usage:**
Used in **Create Class Modal** for adding new classes

---

### Request

**Headers:**
Authorization: Bearer token
Content-Type: application/json

**Path Params:**
- **batchSlug**: Batch slug
- **topicSlug**: Topic slug

**Body:**
```json
{
  "class_name": "Array Advanced",
  "slug": "array-advanced",
  "description": "Advanced array problems and techniques",
  "duration_minutes": 120,
  "class_date": "2025-03-20T16:00:00Z"
}
```

---

### Response Example

```json
{
  "message": "Class created successfully",
  "class": {
    "id": 25,
    "class_name": "Array Advanced",
    "slug": "array-advanced",
    "description": "Advanced array problems and techniques",
    "duration_minutes": 120,
    "class_date": "2025-03-20T16:00:00Z",
    "created_at": "2025-03-10T18:00:00Z"
  }
}
```

---

### Response Fields

- **message**: Creation status
- **class**: Created class details
- **id**: New class ID

---

### Frontend Behavior

Frontend should:
• Collect class information
• Validate date and duration
• Generate slug from class name
• Show success message
• Refresh class list

---

### Possible Errors

- **400**: Invalid input data
- **401**: Authentication required
- **403**: Teacher access required
- **404**: Batch or topic not found
- **409**: Class name already exists
- **500**: Server error

---

## Assign Questions to Class

**Endpoint:**
POST /api/admin/:batchSlug/topics/:topicSlug/classes/:classSlug/questions

**Description:**
Assign questions to a class

**Role Access:**
Teacher or above

**Frontend Usage:**
Used in **Question Assignment Modal** for adding questions to classes

---

### Request

**Headers:**
Authorization: Bearer token
Content-Type: application/json

**Path Params:**
- **batchSlug**: Batch slug
- **topicSlug**: Topic slug
- **classSlug**: Class slug

**Body:**
```json
{
  "question_ids": [1, 2, 3, 4, 5]
}
```

---

### Response Example

```json
{
  "message": "Questions assigned successfully",
  "assignments": [
    {
      "class_id": 25,
      "question_id": 1,
      "assigned_at": "2025-03-10T18:30:00Z"
    }
  ]
}
```

---

### Response Fields

- **message**: Assignment status
- **assignments**: Created assignment records
- **class_id**: Class ID
- **question_id**: Question ID
- **assigned_at**: Assignment timestamp

---

### Frontend Behavior

Frontend should:
• Show available questions for selection
• Allow multi-select of questions
• Display assignment preview
• Show success message
• Update class question count

---

### Possible Errors

- **400**: Invalid question IDs
- **401**: Authentication required
- **403**: Teacher access required
- **404**: Class not found
- **409**: Questions already assigned
- **500**: Server error

---

## Get Admin Dashboard

**Endpoint:**
GET /api/admin/dashboard

**Description:**
Get dashboard statistics and overview

**Role Access:**
Admin (Teacher/Intern/SuperAdmin)

**Frontend Usage:**
Used in **Admin Dashboard** for overview statistics

---

### Request

**Headers:**
Authorization: Bearer token

---

### Response Example

```json
{
  "overview": {
    "totalStudents": 45,
    "totalQuestions": 150,
    "averageProgress": 67.5,
    "activeToday": 12
  },
  "batchStats": {
    "batchName": "SO-Batch-2025",
    "totalStudents": 45,
    "averageSolved": 52,
    "topPerformer": {
      "name": "Alice Smith",
      "solvedCount": 85
    }
  },
  "recentActivity": [
    {
      "type": "question_solved",
      "studentName": "John Doe",
      "questionName": "Two Sum",
      "timestamp": "2025-03-10T15:30:00Z"
    }
  ]
}
```

---

### Response Fields

- **overview**: General statistics
- **batchStats**: Batch-specific statistics
- **recentActivity**: Recent student activities
- **totalStudents**: Number of students
- **totalQuestions**: Total assigned questions
- **averageProgress**: Average completion percentage
- **activeToday**: Students active today

---

### Frontend Behavior

Frontend should:
• Display key metrics cards
• Show batch-specific statistics
• List recent activities
• Allow navigation to detailed views
• Refresh data periodically

---

### Possible Errors

- **401**: Authentication required
- **403**: Admin access required
- **500**: Server error

---

## Get Admin Leaderboard

**Endpoint:**
POST /api/admin/leaderboard

**Description:**
Get batch leaderboard with pagination and search

**Role Access:**
Admin (Teacher/Intern/SuperAdmin)

**Frontend Usage:**
Used in **Admin Leaderboard Page** for monitoring student rankings

---

### Request

**Headers:**
Authorization: Bearer token
Content-Type: application/json

**Body:**
```json
{
  "page": 1,
  "limit": 20,
  "search": "john"
}
```

---

### Response Example

```json
{
  "leaderboard": [
    {
      "rank": 1,
      "student": {
        "id": 1,
        "name": "Alice Smith",
        "username": "alicesmith",
        "email": "alice@example.com"
      },
      "stats": {
        "totalCount": 85,
        "maxStreak": 25,
        "easyCount": 30,
        "mediumCount": 40,
        "hardCount": 15
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

### Response Fields

- **leaderboard**: Array of student rankings
- **rank**: Student's rank
- **student**: Student information
- **stats**: Performance statistics
- **totalCount**: Total problems solved
- **maxStreak**: Maximum solving streak
- **easyCount**: Easy problems solved
- **mediumCount**: Medium problems solved
- **hardCount**: Hard problems solved

---

### Frontend Behavior

Frontend should:
• Display ranking table
• Show student performance metrics
• Implement search functionality
• Allow pagination
• Enable detailed student views

---

### Possible Errors

- **401**: Authentication required
- **403**: Admin access required
- **500**: Server error

---

## Get All Students (Admin)

**Endpoint:**
GET /api/admin/students

**Description:**
Get all students in admin's batch with progress

**Role Access:**
Admin (Teacher/Intern/SuperAdmin)

**Frontend Usage:**
Used in **Student Management Page** for viewing and managing students

---

### Request

**Headers:**
Authorization: Bearer token

**Query Params:**
- **search**: Search by name/email/username
- **page**: Page number
- **limit**: Items per page

---

### Response Example

```json
{
  "students": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "username": "johndoe",
      "batch": {
        "id": 1,
        "batch_name": "SO-Batch-2025"
      },
      "progress": {
        "totalQuestions": 150,
        "solvedQuestions": 67,
        "progressPercentage": 44.7,
        "lastActivity": "2025-03-10T15:30:00Z"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

### Response Fields

- **students**: Array of students
- **id**: Student ID
- **name**: Student name
- **email**: Student email
- **username**: Student username
- **batch**: Assigned batch
- **progress**: Student progress
- **totalQuestions**: Total assigned questions
- **solvedQuestions**: Questions solved
- **progressPercentage**: Completion percentage
- **lastActivity**: Last activity timestamp

---

### Frontend Behavior

Frontend should:
• Display student list with progress
• Show search and filtering
• Allow student management actions
• Implement pagination
• Display progress indicators

---

### Possible Errors

- **401**: Authentication required
- **403**: Admin access required
- **500**: Server error

---

## Create Student (Admin)

**Endpoint:**
POST /api/admin/students

**Description:**
Create new student account

**Role Access:**
Teacher or above

**Frontend Usage:**
Used in **Add Student Modal** for creating student accounts

---

### Request

**Headers:**
Authorization: Bearer token
Content-Type: application/json

**Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "username": "janesmith",
  "password": "password123",
  "batch_id": 1,
  "leetcode_id": "janesmith_lc",
  "gfg_id": "janesmith_gfg"
}
```

---

### Response Example

```json
{
  "message": "Student created successfully",
  "student": {
    "id": 46,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "username": "janesmith",
    "batch_id": 1,
    "created_at": "2025-03-10T19:00:00Z"
  }
}
```

---

### Response Fields

- **message**: Creation status
- **student**: Created student details
- **id**: New student ID

---

### Frontend Behavior

Frontend should:
• Collect student information
• Validate email and username uniqueness
• Assign to appropriate batch
• Show success message
• Refresh student list

---

### Possible Errors

- **400**: Invalid input data
- **401**: Authentication required
- **403**: Teacher access required
- **404**: Batch not found
- **409**: Email/username already exists
- **500**: Server error

---

## Get All Cities (SuperAdmin)

**Endpoint:**
GET /api/superadmin/cities

**Description:**
Get all cities for system management

**Role Access:**
SuperAdmin

**Frontend Usage:**
Used in **SuperAdmin Cities Page** for city management

---

### Request

**Headers:**
Authorization: Bearer token

---

### Response Example

```json
[
  {
    "id": 1,
    "city_name": "Bangalore",
    "slug": "bangalore",
    "created_at": "2025-03-01T10:00:00Z"
  }
]
```

---

### Response Fields

- **id**: City ID
- **city_name**: City name
- **slug**: City slug
- **created_at**: City creation timestamp

---

### Frontend Behavior

Frontend should:
• Display city list
• Allow city management (edit/delete)
• Enable city creation

---

### Possible Errors

- **401**: Authentication required
- **403**: SuperAdmin access required
- **500**: Server error

---

## Create City (SuperAdmin)

**Endpoint:**
POST /api/superadmin/cities

**Description:**
Create new city for multi-location support

**Role Access:**
SuperAdmin

**Frontend Usage:**
Used in **Create City Modal** for adding new locations

---

### Request

**Headers:**
Authorization: Bearer token
Content-Type: application/json

**Body:**
```json
{
  "city_name": "Chennai",
  "slug": "chennai"
}
```

---

### Response Example

```json
{
  "message": "City created successfully",
  "city": {
    "id": 6,
    "city_name": "Chennai",
    "slug": "chennai",
    "created_at": "2025-03-10T20:00:00Z"
  }
}
```

---

### Response Fields

- **message**: Creation status
- **city**: Created city details
- **id**: New city ID
- **slug**: Generated slug

---

### Frontend Behavior

Frontend should:
• Collect city information
• Generate slug from city name
• Validate city name uniqueness
• Show success message
• Refresh city list

---

### Possible Errors

- **400**: Invalid input data
- **401**: Authentication required
- **403**: SuperAdmin access required
- **409**: City name already exists
- **500**: Server error

---

## Get All Batches (SuperAdmin)

**Endpoint:**
GET /api/superadmin/batches

**Description:**
Get all batches across all cities

**Role Access:**
SuperAdmin

**Frontend Usage:**
Used in **SuperAdmin Batches Page** for batch management

---

### Request

**Headers:**
Authorization: Bearer token

---

### Response Example

```json
[
  {
    "id": 1,
    "batch_name": "SO-Batch-2025",
    "slug": "so-batch-2025",
    "year": 2025,
    "city_id": 1,
    "created_at": "2025-03-01T10:00:00Z",
    "city": {
      "id": 1,
      "city_name": "Bangalore",
      "slug": "bangalore",
      "created_at": "2025-03-01T10:00:00Z"
    },
    "_count": {
      "students": 45,
      "classes": 12
    }
  }
]
```

---

### Response Fields

- **id**: Batch ID
- **batch_name**: Batch name
- **slug**: Batch slug
- **year**: Batch year
- **city_id**: City ID
- **created_at**: Batch creation timestamp
- **city**: Associated city object
- **_count**: Object with counts
  - **students**: Number of students in batch
  - **classes**: Number of classes in batch

---

### Frontend Behavior

Frontend should:
• Display batch list with city information
• Show student and class counts
• Allow batch management
• Enable batch filtering by city

---

### Possible Errors

- **401**: Authentication required
- **403**: SuperAdmin access required
- **500**: Server error

---

## Create Batch (SuperAdmin)

**Endpoint:**
POST /api/superadmin/batches

**Description:**
Create new batch under a city

**Role Access:**
SuperAdmin

**Frontend Usage:**
Used in **Create Batch Modal** for adding new batches

---

### Request

**Headers:**
Authorization: Bearer token
Content-Type: application/json

**Body:**
```json
{
  "batch_name": "SO-Batch-2026",
  "year": 2026,
  "city_id": 1,
  "slug": "so-batch-2026"
}
```

---

### Response Example

```json
{
  "message": "Batch created successfully",
  "batch": {
    "id": 13,
    "batch_name": "SO-Batch-2026",
    "year": 2026,
    "city_id": 1,
    "slug": "so-batch-2026",
    "created_at": "2025-03-10T21:00:00Z"
  }
}
```

---

### Response Fields

- **message**: Creation status
- **batch**: Created batch details
- **id**: New batch ID

---

### Frontend Behavior

Frontend should:
• Select city from dropdown
• Collect batch information
• Validate batch name uniqueness within city
• Show success message
• Refresh batch list

---

### Possible Errors

- **400**: Invalid input data
- **401**: Authentication required
- **403**: SuperAdmin access required
- **404**: City not found
- **409**: Batch name already exists
- **500**: Server error

---

## Get System Stats (SuperAdmin)

**Endpoint:**
GET /api/superadmin/stats

**Description:**
Get system-wide statistics

**Role Access:**
SuperAdmin

**Frontend Usage:**
Used in **SuperAdmin Dashboard** for system overview

---

### Request

**Headers:**
Authorization: Bearer token

---

### Response Example

```json
{
  "stats": {
    "totalCities": 5,
    "totalBatches": 12,
    "totalStudents": 450,
    "totalAdmins": 25,
    "totalQuestions": 1500,
    "totalTopics": 45
  }
}
```

---

### Response Fields

- **totalCities**: Number of cities
- **totalBatches**: Number of batches
- **totalStudents**: Number of students
- **totalAdmins**: Number of admins
- **totalQuestions**: Number of questions
- **totalTopics**: Number of topics

---

### Frontend Behavior

Frontend should:
• Display system overview cards
• Show key metrics
• Allow navigation to detailed views
• Refresh data periodically

---

### Possible Errors

- **401**: Authentication required
- **403**: SuperAdmin access required
- **500**: Server error

---

## Create Admin (SuperAdmin)

**Endpoint:**
POST /api/superadmin/admins

**Description:**
Create new admin user (Teacher/Intern)

**Role Access:**
SuperAdmin

**Frontend Usage:**
Used in **Create Admin Modal** for adding teachers/interns

---

### Request

**Headers:**
Authorization: Bearer token
Content-Type: application/json

**Body:**
```json
{
  "name": "New Teacher",
  "email": "teacher@example.com",
  "username": "newteacher",
  "password": "password123",
  "role": "TEACHER",
  "batch_id": 1,
  "city_id": 1
}
```

---

### Response Example

```json
{
  "message": "Admin created successfully",
  "admin": {
    "id": 26,
    "name": "New Teacher",
    "email": "teacher@example.com",
    "username": "newteacher",
    "role": "TEACHER",
    "batch_id": 1,
    "city_id": 1,
    "created_at": "2025-03-10T22:00:00Z"
  }
}
```

---

### Response Fields

- **message**: Creation status
- **admin**: Created admin details
- **id**: New admin ID
- **role**: Admin role (TEACHER/INTERN)

---

### Frontend Behavior

Frontend should:
• Collect admin information
• Select role and assignments
• Validate email/username uniqueness
• Show success message
• Refresh admin list

---

### Possible Errors

- **400**: Invalid input data
- **401**: Authentication required
- **403**: SuperAdmin access required
- **404**: Batch or city not found
- **409**: Email/username already exists
- **500**: Server error

---

## Health Check

**Endpoint:**
GET /health

**Description:**
System health check endpoint

**Role Access:**
Public

**Frontend Usage:**
Used for **system monitoring** and health checks

---

### Request

No authentication required

---

### Response Example

```json
{
  "status": "OK",
  "timestamp": "2025-03-10T22:30:00Z"
}
```

---

### Response Fields

- **status**: System status
- **timestamp**: Current timestamp

---

### Frontend Behavior

Frontend should:
• Use for uptime monitoring
• Display system status
• Check API availability

---

### Possible Errors

- **500**: System unhealthy

---

## 5. API Summary Table

| Method | Endpoint | Description | Role Access | Frontend Page Using It |
|--------|----------|-------------|-------------|----------------------|
| POST | /api/auth/student/register | Student registration | Public | Student Registration |
| POST | /api/auth/student/login | Student authentication | Public | Student Login |
| POST | /api/auth/admin/login | Admin authentication | Public | Admin Login |
| GET | /api/students/topics | Get student topics | Student | Student Dashboard |
| GET | /api/students/topics/:slug | Get topic details | Student | Topic Details |
| GET | /api/students/topics/:topicSlug/classes/:classSlug | Get class questions | Student | Class Details |
| GET | /api/students/addedQuestions | Get all questions | Student | Questions Page |
| POST | /api/students/leaderboard | Get student leaderboard | Student | Leaderboard |
| GET | /api/students/profile | Get student profile | Student | Profile Page |
| GET | /api/admin/topics | Get all topics | Admin | Admin Topics |
| POST | /api/admin/topics | Create topic | Teacher+ | Create Topic |
| PATCH | /api/admin/topics/:id | Update topic | Teacher+ | Edit Topic |
| DELETE | /api/admin/topics/:id | Delete topic | Teacher+ | Topic Management |
| GET | /api/admin/questions | Get all questions | Admin | Question Management |
| POST | /api/admin/questions | Create question | Teacher+ | Create Question |
| GET | /api/admin/:batchSlug/topics/:topicSlug/classes | Get classes by topic | Admin | Topic Management |
| POST | /api/admin/:batchSlug/topics/:topicSlug/classes | Create class | Teacher+ | Create Class |
| POST | /api/admin/:batchSlug/topics/:topicSlug/classes/:classSlug/questions | Assign questions | Teacher+ | Question Assignment |
| GET | /api/admin/dashboard | Get admin dashboard | Admin | Admin Dashboard |
| POST | /api/admin/leaderboard | Get admin leaderboard | Admin | Admin Leaderboard |
| GET | /api/admin/students | Get all students | Admin | Student Management |
| POST | /api/admin/students | Create student | Teacher+ | Add Student |
| GET | /api/superadmin/cities | Get all cities | SuperAdmin | Cities Management |
| POST | /api/superadmin/cities | Create city | SuperAdmin | Create City |
| GET | /api/superadmin/batches | Get all batches | SuperAdmin | Batches Management |
| POST | /api/superadmin/batches | Create batch | SuperAdmin | Create Batch |
| GET | /api/superadmin/stats | Get system stats | SuperAdmin | SuperAdmin Dashboard |
| POST | /api/superadmin/admins | Create admin | SuperAdmin | Create Admin |
| GET | /health | System health check | Public | System Monitoring |

---

## 6. System Workflows

## Teacher creates topic

1. Teacher opens topics page
2. Clicks "Create Topic" button
3. Frontend calls POST /api/admin/topics
4. Backend validates data and creates topic
5. Topic appears in topics list
6. Teacher can create classes under topic

## Student progress tracking

1. Student solves problem on external platform
2. Student marks question as solved in system
3. Backend updates StudentProgress record
4. Leaderboard recalculates rankings
5. Progress reflected in dashboard

## Question assignment workflow

1. Teacher selects class
2. Chooses questions from question bank
3. Frontend calls POST /api/admin/:batchSlug/topics/:topicSlug/classes/:classSlug/questions
4. Backend creates QuestionVisibility records
5. Questions appear in student's question list
6. Students can solve assigned problems

## Batch management (SuperAdmin)

1. SuperAdmin creates city via POST /api/superadmin/cities
2. Creates batch under city via POST /api/superadmin/batches
3. Creates admin users via POST /api/superadmin/admins
4. Admins can manage their assigned batches
5. Students register and get assigned to batches

## Leaderboard updates

1. Student solves question
2. Progress updates in database
3. Cron job recalculates leaderboards
4. Rankings updated for all students
5. Changes reflected in real-time

## Authentication flow

1. User submits login credentials
2. Backend validates email/password
3. JWT tokens generated (access + refresh)
4. Tokens stored in client
5. Subsequent requests include Authorization header
6. Middleware validates tokens on protected routes
