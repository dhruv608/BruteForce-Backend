# DSA Tracker - Complete System Documentation

## 📘 Documentation Map

| Section | Description |
|---------|-------------|
| [Project Overview](#1-project-overview) | System idea and architecture |
| [System Roles](#2-system-roles) | Student, Admin, SuperAdmin roles |
| [UI Page → API Mapping](#3-ui-page--api-mapping) | Frontend integration guide |
| [Authentication APIs](#4-complete-api-documentation) | Login and registration endpoints |
| [Student APIs](#student-apis) | Endpoints used by students |
| [Admin APIs](#admin-apis) | Content management APIs |
| [SuperAdmin APIs](#superadmin-apis) | Platform administration APIs |
| [API Summary Table](#5-api-summary-table) | Quick reference for all endpoints |
| [System Workflows](#6-system-workflows) | Real system operations |

---

## 📋 Table of Contents

### **Quick Navigation**
- [Project Overview](#1-project-overview)
- [System Roles](#2-system-roles)
- [UI Page → API Mapping](#3-ui-page--api-mapping)
- [Authentication APIs](#4-complete-api-documentation)
- [Student APIs](#student-apis)
- [Admin APIs](#admin-apis)
- [SuperAdmin APIs](#superadmin-apis)
- [API Summary Table](#6-api-summary-table)
- [System Workflows](#7-system-workflows)

---

### **Detailed Sections**
1. [Project Overview](#1-project-overview)
2. [System Roles](#2-system-roles)
3. [UI Page → API Mapping](#3-ui-page--api-mapping)
4. [Complete API Documentation](#4-complete-api-documentation)
   - [Authentication APIs](#authentication-apis)
   - [Student APIs](#student-apis)
   - [Admin APIs](#admin-apis)
   - [SuperAdmin APIs](#superadmin-apis)
5. [API Summary Table](#5-api-summary-table)
6. [System Workflows](#6-system-workflows)

---

## 📘 Project Overview

### What the System Is
- **DSA Tracker**: Educational platform for tracking Data Structures & Algorithms learning progress
- **Multi-tenant system**: Supports multiple cities, batches, and user roles
- **Progress tracking**: Monitors student problem-solving across external platforms (LeetCode, GFG)

### What Problem It Solves
- **Centralized tracking**: Students solve problems on LeetCode/GFG, system automatically tracks progress
- **Teacher management**: Teachers assign questions and monitor batch performance efficiently
- **Gamification**: Leaderboards and streaks motivate students to practice consistently
- **Organization**: Structured curriculum with topics, classes, and assignments

### Who Uses It
- **Students**: Solve assigned problems, track progress, compete on leaderboards
- **Teachers/Interns**: Create content, assign questions, monitor students
- **SuperAdmin**: Manage cities, batches, and admin users

### Core System Logic
Teacher creates topic → adds classes → assigns questions → students solve problems → system tracks progress → leaderboard updates automatically

### System Architecture
- **Backend**: Node.js + Express.js + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens (access + refresh)
- **Request Flow**: Frontend → API → Controller → Service → Database → Response

---

## 👥 System Roles

### SuperAdmin
**Purpose**: System administration and multi-location management

**Responsibilities**:
• Create and manage cities
• Create and manage batches  
• Create and manage admin users (Teachers/Interns)
• View system-wide statistics
• Complete platform oversight

**Main Pages**: Cities, Batches, Admins, System Stats

**Key Actions**: CRUD operations on cities and batches, admin user management, system analytics

---

### Admin / Teacher / Intern
**Purpose**: Content creation and student progress management

**Responsibilities**:
• Create topics and organize curriculum
• Create classes under topics
• Assign questions to classes
• Monitor student progress
• Generate batch reports

**Main Pages**: Dashboard, Topics, Classes, Questions, Students, Leaderboard

**Key Actions**: Topic/Class/Question management, question assignment, progress tracking

---

### Student
**Purpose**: Learning and problem-solving

**Responsibilities**:
• View assigned topics and questions
• Solve problems on external platforms
• Track personal progress
• Participate in leaderboards

**Main Pages**: Dashboard, Topics, Classes, Questions, Leaderboard, Profile

**Key Actions**: View assigned content, mark questions solved, view progress and rankings

---

## 🗺 UI Page → API Mapping

### Student Dashboard
**Purpose**: Shows student progress and quick statistics

**UI Components**:
• Questions solved card
• Day streak card  
• Topics unlocked
• Global rank
• Featured topics

**APIs Used**:
- `GET /api/students/topics`
- `POST /api/students/leaderboard`

**Fields Used**:

| UI Element | API Field |
|------------|-----------|
| Questions Solved | solvedQuestions |
| Day Streak | currentStreak |
| Topics Unlocked | unlockedTopics |
| Global Rank | personalRank.rank |

**Frontend Behavior**:
• Display statistics cards from aggregated topic data
• Render topic progress bars
• Allow topic navigation

---

### Topics Page
**Purpose**: Shows all learning topics with progress

**APIs Used**:
- `GET /api/students/topics`

**Fields Used**:

| UI Element | API Field |
|------------|-----------|
| Topic Name | topic_name |
| Progress Bar | solvedQuestions / totalQuestions |
| Total Classes | totalClasses |
| Topic Slug | slug |

**Frontend Behavior**:
• Display all topics with progress bars
• Calculate progress percentage
• Navigate to topic details

---

### Topic Details Page
**Purpose**: Shows all classes inside a topic

**APIs Used**:
- `GET /api/students/topics/:topicSlug`

**Fields Used**:

| UI Element | API Field |
|------------|-----------|
| Class Name | class_name |
| Duration | duration_minutes |
| Solved Questions | solvedQuestions |
| Total Questions | totalQuestions |

**Frontend Behavior**:
• List all classes in topic
• Use `slug` for routing when class is clicked
• Show progress for each class
• Allow navigation to class details page

---

### Class Page
**Purpose**: Shows questions assigned to a class

**APIs Used**:
- `GET /api/students/topics/:topicSlug/classes/:classSlug`

**Fields Used**:

| UI Element | API Field |
|------------|-----------|
| Question Name | question_name |
| Platform | platform |
| Difficulty | level |
| Status | isSolved |
| Question Link | question_link |
| Question Type | type |

**Frontend Behavior**:
• Display question list with solve status
• Open external links for questions
• Mark questions as solved

---

### Questions Page
**Purpose**: Browse and filter all assigned questions

**APIs Used**:
- `GET /api/students/addedQuestions`

**Fields Used**:

| UI Element | API Field |
|------------|-----------|
| Question Title | question_name |
| Topic | topic.topic_name |
| Platform | platform |
| Difficulty | level |
| Status | solved |
| Question Type | type |

**Frontend Behavior**:
• Display filterable question list
• Apply topic/platform/difficulty filters
• Show solve status indicators

---

### Leaderboard Page
**Purpose**: Show student rankings

**APIs Used**:
- `POST /api/students/leaderboard`

**Fields Used**:

| UI Element | API Field |
|------------|-----------|
| Rank | rank |
| Student Name | name |
| Score | totalCount |
| Streak | maxStreak |
| Batch | batch.batch_name |

**Frontend Behavior**:
• Display top 10 students
• Show personal rank
• Highlight current student

---

### Student Profile Page
**Purpose**: Shows detailed student statistics

**APIs Used**:
- `GET /api/students/profile`

**Fields Used**:

| UI Element | API Field |
|------------|-----------|
| Total Solved | solvedQuestions |
| Current Streak | currentStreak |
| Max Streak | maxStreak |
| Platform Stats | codingStats |
| Personal Info | name, email, username |
| City & Batch | city, batch |

**Frontend Behavior**:
• Display comprehensive statistics
• Show platform-wise progress
• Display personal information

---

## 4. Admin Panel - UI Page → API Mapping

### Admin Dashboard
**Purpose**: Overview of batch performance and statistics

**APIs Used**:
- `GET /api/admin/dashboard`

**Fields Used**:

| UI Element | API Field |
|------------|-----------|
| Total Students | totalStudents |
| Total Questions | totalQuestions |
| Average Progress | avgProgress |
| Recent Activity | recentActivity |

**Frontend Behavior**:
• Display batch statistics
• Show performance metrics
• Quick access to management pages

---

### Topics Management Page
**Purpose**: Create and manage topics

**APIs Used**:
- `GET /api/admin/topics`
- `POST /api/admin/topics`
- `PATCH /api/admin/topics/:id`
- `DELETE /api/admin/topics/:id`

**Fields Used**:

| UI Element | API Field |
|------------|-----------|
| Topic Name | topic_name |
| Description | description |
| Order | order |
| Created At | created_at |
| Updated At | updated_at |

**Frontend Behavior**:
• List all topics with actions
• Create new topics via modal
• Edit existing topics
• Delete topics with confirmation

---

### Classes Management Page
**Purpose**: Manage classes within topics

**APIs Used**:
- `GET /api/admin/{batchSlug}/topics/{topicSlug}/classes`
- `POST /api/admin/{batchSlug}/topics/{topicSlug}/classes`
- `PATCH /api/admin/{batchSlug}/topics/{topicSlug}/classes/{classSlug}`
- `DELETE /api/admin/{batchSlug}/topics/{topicSlug}/classes/{classSlug}`

**Fields Used**:

| UI Element | API Field |
|------------|-----------|
| Class Name | class_name |
| Duration | duration_minutes |
| Description | description |
| Class Date | class_date |

**Frontend Behavior**:
• Show classes for selected topic
• Use `slug` for routing when class is edited/deleted
• Display class schedule and details
• Allow CRUD operations on classes

---

### Questions Management Page
**Purpose**: Create and manage questions

**APIs Used**:
- `GET /api/admin/questions`
- `POST /api/admin/questions`
- `PATCH /api/admin/questions/:id`
- `DELETE /api/admin/questions/:id`
- `POST /api/admin/questions/bulk-upload`

**Fields Used**:

| UI Element | API Field |
|------------|-----------|
| Question Name | question_name |
| Question Link | question_link |
| Platform | platform |
| Difficulty | level |
| Type | type |
| Topic | topic.topic_name |

**Frontend Behavior**:
• Display question list with filters
• Create new questions
• Bulk upload via file
• Edit/delete existing questions

---

### Question Assignment Page
**Purpose**: Assign questions to classes

**APIs Used**:
- `POST /api/admin/{batchSlug}/topics/{topicSlug}/classes/{classSlug}/questions`
- `GET /api/admin/{batchSlug}/topics/{topicSlug}/classes/{classSlug}/questions`
- `DELETE /api/admin/{batchSlug}/topics/{topicSlug}/classes/{classSlug}/questions/{questionId}`

**Fields Used**:

| UI Element | API Field |
|------------|-----------|
| Question List | questions |
| Assigned Questions | assignedQuestions |
| Class ID | class_id |
| Question ID | question_id |

**Frontend Behavior**:
• Show available questions
• Assign multiple questions to class
• Remove assigned questions
• Display current assignments

---

### Students Management Page
**Purpose**: Manage students in batch

**APIs Used**:
- `GET /api/admin/students`
- `POST /api/admin/students`
- `GET /api/admin/students/{username}`
- `PATCH /api/admin/students/{id}`
- `DELETE /api/admin/students/{id}`
- `POST /api/admin/students/progress`

**Fields Used**:

| UI Element | API Field |
|------------|-----------|
| Student Name | name |
| Email | email |
| Username | username |
| Batch | batch.batch_name |
| Progress | solvedQuestions |
| LeetCode ID | leetcode_id |
| GFG ID | gfg_id |

**Frontend Behavior**:
• List all students in batch
• Create new student accounts
• Edit student details
• Add manual progress
• View student reports

---

### Admin Leaderboard Page
**Purpose**: View batch leaderboard with analytics

**APIs Used**:
- `POST /api/admin/leaderboard`
- `POST /api/admin/leaderboard/recalculate`

**Fields Used**:

| UI Element | API Field |
|------------|-----------|
| Rank | rank |
| Student Name | name |
| Score | totalCount |
| Streak | currentStreak |
| Batch | batch.batch_name |

**Frontend Behavior**:
• Display batch leaderboard
• Search and filter students
• Recalculate rankings
• Export data

---

## 5. SuperAdmin Panel - UI Page → API Mapping

### Cities Management Page
**Purpose**: Manage system cities

**APIs Used**:
- `GET /api/superadmin/cities`
- `POST /api/superadmin/cities`
- `PATCH /api/superadmin/cities/:id`
- `DELETE /api/superadmin/cities/:id`

**Fields Used**:

| UI Element | API Field |
|------------|-----------|
| City Name | city_name |
| Created At | created_at |
| Batch Count | _count.batches |
| Student Count | _count.students |

**Frontend Behavior**:
• Display cities in management table
• Use `slug` for routing when city is edited/deleted
• Show batch and student statistics
• Allow CRUD operations on cities

---

### Batches Management Page
**Purpose**: Manage system batches

**APIs Used**:
- `GET /api/superadmin/batches`
- `POST /api/superadmin/batches`
- `PATCH /api/superadmin/batches/:id`
- `DELETE /api/superadmin/batches/:id`

**Fields Used**:

| UI Element | API Field |
|------------|-----------|
| Batch Name | batch_name |
| Year | year |
| City | city.city_name |
| Student Count | _count.students |
| Class Count | _count.classes |

**Frontend Behavior**:
• Display batches in management table
• Use `slug` for routing when batch is edited/deleted
• Show city association and statistics
• Allow CRUD operations on batches

---

### Admins Management Page
**Purpose**: Create and manage admin users

**APIs Used**:
- `POST /api/superadmin/admins`

**Fields Used**:

| UI Element | API Field |
|------------|-----------|
| Admin Name | name |
| Email | email |
| Username | username |
| Role | role |
| Batch | batch.batch_name |
| City | city.city_name |

**Frontend Behavior**:
• Create new admin accounts
• Assign roles and batches
• Set admin permissions

---

### System Statistics Page
**Purpose**: View platform-wide analytics

**APIs Used**:
- `GET /api/superadmin/stats`

**Fields Used**:

| UI Element | API Field |
|------------|-----------|
| Total Cities | totalCities |
| Total Batches | totalBatches |
| Total Students | totalStudents |
| Total Admins | totalAdmins |
| Total Questions | totalQuestions |
| Total Topics | totalTopics |

**Frontend Behavior**:
• Display system statistics
• Show growth metrics
• Platform health overview

---

## 🔐 Complete API Documentation

### Authentication APIs

**Quick Navigation:**
- [Student Registration](#student-registration)
- [Student Login](#student-login)
- [Student Logout](#student-logout)
- [Admin Login](#admin-login)
- [Admin Logout](#admin-logout)

**Authentication API Endpoints:**
- `POST /api/auth/student/register` - Register new student
- `POST /api/auth/student/login` - Student login
- `POST /api/auth/student/logout` - Student logout
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/admin/logout` - Admin logout

<details>
<summary>Authentication API Details</summary>

#### Student Registration

---

**Endpoint**

POST /api/auth/student/register

---

**Description**

Register a new student account and assign to batch.

---

**Role Access**

Public

---

**Used In Frontend**

Student Registration Form

---

**Request Body**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "username": "johndoe",
  "password": "password123",
  "batch_id": 1,
  "leetcode_id": "johndoe_lc",
  "gfg_id": "johndoe_gfg"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Student full name |
| email | string | Yes | Student email (unique) |
| username | string | Yes | Username (unique) |
| password | string | Yes | Account password |
| batch_id | number | Yes | Batch ID to assign student |
| leetcode_id | string | No | LeetCode username |
| gfg_id | string | No | GeeksforGeeks username |

---

**Example API Call (Frontend)**

```javascript
const response = await axios.post("/api/auth/student/register", {
  name: "John Doe",
  email: "john@example.com",
  username: "johndoe",
  password: "password123",
  batch_id: 1,
  leetcode_id: "johndoe_lc"
});
```

---

**Response Example**

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

**Response Fields Explanation**

| Field | Description |
|-------|-------------|
| message | Success message |
| user | Created student object with relations |
| user.id | Student ID |
| user.name | Student name |
| user.email | Student email |
| user.username | Student username |
| user.city | Assigned city information |
| user.batch | Assigned batch information |

---

**Frontend Usage**

Frontend should:

• Collect all required fields in registration form
• Validate email format and password strength
• Show batch selection dropdown
• Redirect to login after successful registration
• Display error messages for validation failures

---

**Possible Errors**

| Status Code | Meaning |
| ----------- | ------- |
| 400 | Invalid input data or missing required fields |
| 409 | Email or username already exists |
| 404 | Batch not found |
| 500 | Server error |

---

#### Student Login

---

**Endpoint**

POST /api/auth/student/login

---

**Description**

Authenticate student and return access tokens.

---

**Role Access**

Public

---

**Used In Frontend**

Student Login Form

---

**Request Body**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

OR

```json
{
  "username": "johndoe",
  "password": "password123"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | No* | Student email (if not using username) |
| username | string | No* | Student username (if not using email) |
| password | string | Yes | Account password |

*Either email or username is required

---

**Example API Call (Frontend)**

```javascript
const response = await axios.post("/api/auth/student/login", {
  email: "john@example.com",
  password: "password123"
});

const { accessToken, refreshToken, user } = response.data;
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);
```

---

**Response Example**

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

**Response Fields Explanation**

| Field | Description |
|-------|-------------|
| message | Success message |
| accessToken | JWT token for API calls (15 min expiry) |
| refreshToken | JWT token for refreshing access token (7 days) |
| user | Authenticated student information |
| user.role | User role (always "STUDENT") |

---

**Frontend Usage**

Frontend should:

• Store tokens in localStorage or secure storage
• Include access token in all API headers: `Authorization: Bearer ${token}`
• Implement token refresh logic before expiry
• Redirect to dashboard on successful login
• Handle token expiry gracefully

---

**Possible Errors**

| Status Code | Meaning |
| ----------- | ------- |
| 400 | Missing credentials |
| 401 | Invalid email/username or password |
| 500 | Server error |

---

#### Admin Login

---

**Endpoint**

POST /api/auth/admin/login

---

**Description**

Authenticate admin/teacher/superadmin and return access tokens.

---

**Role Access**

Public

---

**Used In Frontend**

Admin Login Form

---

**Request Body**

```json
{
  "email": "teacher@example.com",
  "password": "password123"
}
```

OR

```json
{
  "username": "teacher",
  "password": "password123"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | No* | Admin email (if not using username) |
| username | string | No* | Admin username (if not using email) |
| password | string | Yes | Account password |

*Either email or username is required

---

**Example API Call (Frontend)**

```javascript
const response = await axios.post("/api/auth/admin/login", {
  email: "teacher@example.com",
  password: "password123"
});

const { accessToken, refreshToken, user } = response.data;
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);
```

---

**Response Example**

```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Jane Smith",
    "email": "teacher@example.com",
    "username": "teacher",
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

**Response Fields Explanation**

| Field | Description |
|-------|-------------|
| message | Success message |
| accessToken | JWT token for API calls (15 min expiry) |
| refreshToken | JWT token for refreshing access token (7 days) |
| user | Authenticated admin information |
| user.role | Admin role (SUPERADMIN, TEACHER, INTERN) |

---

**Frontend Usage**

Frontend should:

• Store tokens securely
• Check user.role to determine admin permissions
• Redirect to appropriate dashboard based on role
• Implement role-based UI rendering

---

**Possible Errors**

| Status Code | Meaning |
| ----------- | ------- |
| 400 | Missing credentials |
| 401 | Invalid credentials |
| 500 | Server error |

---

</details>

---

### 🎓 Student APIs

**Quick Navigation:**
- [Get Topics with Progress](#get-topics-with-progress)
- [Get Topic Details](#get-topic-details)
- [Get Class Questions](#get-class-questions)
- [Get All Questions](#get-all-questions)
- [Get Leaderboard](#get-leaderboard)
- [Get Profile](#get-profile)

**Student API Endpoints:**
- `GET /api/students/topics` - Get topics with progress
- `GET /api/students/topics/:topicSlug` - Get topic details
- `GET /api/students/topics/:topicSlug/classes/:classSlug` - Get class questions
- `GET /api/students/addedQuestions` - Get all assigned questions
- `POST /api/students/leaderboard` - Get leaderboard data
- `GET /api/students/profile` - Get student profile

<details>
<summary>Student API Details</summary>

#### Get Topics with Progress

---

**Endpoint**

GET /api/students/topics

---

**Description**

Returns all topics with student's batch-specific progress.

---

**Role Access**

Student

---

**Used In Frontend**

Topics Page, Student Dashboard

---

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| No parameters available | | |

---

**Example API Call (Frontend)**

```javascript
const response = await axios.get("/api/students/topics", {
  headers: {
    Authorization: `Bearer ${token}` 
  }
});
```

---

**Response Example**

```json
[
  {
    "id": 1,
    "topic_name": "Arrays and Strings",
    "slug": "arrays-strings",
    "batchSpecificData": {
      "totalClasses": 6,
      "totalQuestions": 40,
      "solvedQuestions": 15
    }
  },
  {
    "id": 2,
    "topic_name": "Dynamic Programming",
    "slug": "dynamic-programming",
    "batchSpecificData": {
      "totalClasses": 8,
      "totalQuestions": 35,
      "solvedQuestions": 8
    }
  }
]
```

---

**Response Fields Explanation**

| Field | Description |
|-------|-------------|
| id | Topic ID |
| topic_name | Topic display name |
| slug | URL-friendly topic identifier |
| batchSpecificData | Batch-specific progress information |
| totalClasses | Number of classes in this topic for student's batch |
| totalQuestions | Total questions assigned to this batch |
| solvedQuestions | Questions solved by student in this topic |

---

**Frontend Usage**

Frontend should:

• Display all topics with progress bars
• Use `slug` for routing when topic is clicked
• Calculate progress percentage: (solvedQuestions / totalQuestions) * 100
• Allow clicking on topics to navigate to topic details page
• Display total classes count

---

**Possible Errors**

| Status Code | Meaning |
| ----------- | ------- |
| 401 | Authentication required |
| 500 | Server error |

---

#### Get Topic Details with Classes

---

**Endpoint**

GET /api/students/topics/:topicSlug

---

**Description**

Get topic overview with classes summary and progress.

---

**Role Access**

Student

---

**Used In Frontend**

Topic Details Page

---

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| topicSlug | string | Unique topic identifier |

---

**Example API Call (Frontend)**

```javascript
const response = await axios.get("/api/students/topics/arrays-strings", {
  headers: {
    Authorization: `Bearer ${token}` 
  }
});
```

---

**Response Example**

```json
{
  "id": 1,
  "topic_name": "Arrays and Strings",
  "slug": "arrays-strings",
  "description": "Fundamental data structures and algorithms",
  "order": 1,
  "batchSpecificData": {
    "totalQuestions": 40,
    "solvedQuestions": 15,
    "classes": [
      {
        "id": 1,
        "class_name": "Introduction to Arrays",
        "slug": "intro-arrays",
        "duration_minutes": 90,
        "totalQuestions": 8,
        "solvedQuestions": 5
      },
      {
        "id": 2,
        "class_name": "String Manipulation",
        "slug": "string-manipulation",
        "duration_minutes": 120,
        "totalQuestions": 10,
        "solvedQuestions": 3
      }
    ]
  }
}
```

---

**Response Fields Explanation**

| Field | Description |
|-------|-------------|
| id | Topic ID |
| topic_name | Topic display name |
| slug | Topic slug |
| description | Topic description |
| order | Display order |
| batchSpecificData | Batch-specific information |
| totalQuestions | Total questions in topic for this batch |
| solvedQuestions | Questions solved by student |
| classes | Array of classes in this topic |
| classes[].id | Class ID |
| classes[].class_name | Class display name |
| classes[].slug | Class slug for navigation |
| classes[].duration_minutes | Class duration in minutes |
| classes[].totalQuestions | Questions in this class |
| classes[].solvedQuestions | Questions solved by student |

---

**Frontend Usage**

Frontend should:

• Display topic information and description
• Show overall topic progress
• List all classes with individual progress
• Make class names clickable for navigation
• Show class duration information
• Calculate progress for each class

---

**Possible Errors**

| Status Code | Meaning |
| ----------- | ------- |
| 401 | Authentication required |
| 404 | Topic not found |
| 500 | Server error |

---

#### Get Class Details with Questions

---

**Endpoint**

GET /api/students/topics/:topicSlug/classes/:classSlug

---

**Description**

Get class details with all assigned questions and student progress.

---

**Role Access**

Student

---

**Used In Frontend**

Class Page

---

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| topicSlug | string | Topic identifier |
| classSlug | string | Class identifier |

---

**Example API Call (Frontend)**

```javascript
const response = await axios.get("/api/students/topics/arrays-strings/classes/intro-arrays", {
  headers: {
    Authorization: `Bearer ${token}` 
  }
});
```

---

**Response Example**

```json
{
  "id": 1,
  "class_name": "Introduction to Arrays",
  "slug": "intro-arrays",
  "description": "Basic array operations and problems",
  "duration_minutes": 90,
  "class_date": "2025-03-15T14:00:00Z",
  "batchSpecificData": {
    "totalQuestions": 8,
    "solvedQuestions": 5,
    "questions": [
      {
        "id": 1,
        "question_name": "Two Sum",
        "question_link": "https://leetcode.com/problems/two-sum/",
        "platform": "LEETCODE",
        "level": "EASY",
        "type": "HOMEWORK",
        "isSolved": true,
        "syncAt": "2025-03-10T15:30:00Z",
        "topic": {
          "topic_name": "Arrays and Strings",
          "slug": "arrays-strings"
        }
      },
      {
        "id": 2,
        "question_name": "Maximum Subarray",
        "question_link": "https://leetcode.com/problems/maximum-subarray/",
        "platform": "LEETCODE",
        "level": "MEDIUM",
        "type": "CLASSWORK",
        "isSolved": false,
        "syncAt": null,
        "topic": {
          "topic_name": "Arrays and Strings",
          "slug": "arrays-strings"
        }
      }
    ]
  }
}
```

---

**Response Fields Explanation**

| Field | Description |
|-------|-------------|
| id | Class ID |
| class_name | Class display name |
| slug | Class slug |
| description | Class description |
| duration_minutes | Class duration |
| class_date | Scheduled class date |
| batchSpecificData | Batch-specific information |
| totalQuestions | Total questions in class |
| solvedQuestions | Questions solved by student |
| questions | Array of assigned questions |
| questions[].id | Question ID |
| questions[].question_name | Question title |
| questions[].question_link | External platform link |
| questions[].platform | Platform (LEETCODE, GFG, OTHER, INTERVIEWBIT) |
| questions[].level | Difficulty (EASY, MEDIUM, HARD) |
| questions[].type | Assignment type (HOMEWORK, CLASSWORK) |
| questions[].isSolved | Whether student solved this question |
| questions[].syncAt | When question was marked solved |
| questions[].topic | Topic information |

---

**Frontend Usage**

Frontend should:

• Display class information and schedule
• Show overall class progress
• List all questions with solve status
• Make question links clickable (open in new tab)
• Show difficulty badges and platform icons
• Allow marking questions as solved
• Display sync timestamps for solved questions

---

**Possible Errors**

| Status Code | Meaning |
| ----------- | ------- |
| 401 | Authentication required |
| 404 | Topic or class not found |
| 500 | Server error |

---

#### Get All Questions with Filters

---

**Endpoint**

GET /api/students/addedQuestions

---

**Description**

Get all questions assigned to student's batch with filtering and pagination.

---

**Role Access**

Student

---

**Used In Frontend**

Questions Page

---

**Query Parameters**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| search | string | Search by question name or topic | search=dp |
| topic | string | Filter by topic slug | topic=arrays-strings |
| level | string | Filter by difficulty | level=medium |
| platform | string | Filter by platform | platform=leetcode |
| type | string | Filter by assignment type | type=homework |
| solved | string | Filter by solve status | solved=true |
| page | number | Page number (default: 1) | page=2 |
| limit | number | Items per page (default: 20) | limit=10 |

---

**Example API Call (Frontend)**

```javascript
const response = await axios.get("/api/students/addedQuestions", {
  params: {
    page: 1,
    limit: 10,
    level: "medium",
    platform: "leetcode",
    solved: "false"
  },
  headers: {
    Authorization: `Bearer ${token}` 
  }
});
```

---

**Response Example**

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
      "isSolved": true,
      "syncAt": "2025-03-10T15:30:00Z",
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
    "limit": 10,
    "totalQuestions": 45,
    "totalPages": 5
  },
  "filters": {
    "topics": [
      {
        "id": 1,
        "topic_name": "Arrays and Strings",
        "slug": "arrays-strings"
      }
    ],
    "levels": ["EASY", "MEDIUM", "HARD"],
    "platforms": ["LEETCODE", "GFG", "OTHER", "INTERVIEWBIT"],
    "types": ["HOMEWORK", "CLASSWORK"]
  },
  "stats": {
    "total": 45,
    "solved": 23
  }
}
```

---

**Response Fields Explanation**

| Field | Description |
|-------|-------------|
| questions | Array of question objects |
| questions[].id | Question ID |
| questions[].question_name | Question title |
| questions[].question_link | External platform link |
| questions[].platform | Platform (LEETCODE, GFG, OTHER, INTERVIEWBIT) |
| questions[].level | Difficulty (EASY, MEDIUM, HARD) |
| questions[].type | Assignment type (HOMEWORK, CLASSWORK) |
| questions[].isSolved | Solve status |
| questions[].syncAt | When marked solved |
| questions[].topic | Topic information |
| pagination | Pagination metadata |
| pagination.page | Current page |
| pagination.limit | Items per page |
| pagination.totalQuestions | Total questions matching filters |
| pagination.totalPages | Total pages |
| filters | Available filter options |
| filters.topics | Topics available for filtering |
| filters.levels | All difficulty levels |
| filters.platforms | All platforms |
| filters.types | All assignment types |
| stats | Overall statistics |
| stats.total | Total questions |
| stats.solved | Solved questions |

---

**Frontend Usage**

Frontend should:

• Display filter controls with available options
• Implement search functionality
• Show question list with status indicators
• Implement pagination controls
• Display difficulty badges and platform icons
• Allow clicking questions to open external links
• Show filter options dynamically from response
• Display overall statistics

---

**Possible Errors**

| Status Code | Meaning |
| ----------- | ------- |
| 401 | Authentication required |
| 400 | Invalid filter parameters |
| 500 | Server error |

---

#### Get Student Leaderboard

---

**Endpoint**

POST /api/students/leaderboard

---

**Description**

Get leaderboard with top 10 students and student's personal rank.

---

**Role Access**

Student

---

**Used In Frontend**

Leaderboard Page

---

**Request Body**

```json
{}
```

Empty request body - uses authenticated student's batch context.

---

**Example API Call (Frontend)**

```javascript
const response = await axios.post("/api/students/leaderboard", {}, {
  headers: {
    Authorization: `Bearer ${token}` 
  }
});
```

---

**Response Example**

```json
{
  "top10": [
    {
      "rank": 1,
      "name": "Alice Johnson",
      "username": "alice",
      "totalCount": 45,
      "currentStreak": 12,
      "maxStreak": 15,
      "batch": {
        "batch_name": "SO-Batch-2025",
        "slug": "so-batch-2025"
      }
    },
    {
      "rank": 2,
      "name": "Bob Smith",
      "username": "bob",
      "totalCount": 42,
      "currentStreak": 8,
      "maxStreak": 12,
      "batch": {
        "batch_name": "SO-Batch-2025",
        "slug": "so-batch-2025"
      }
    }
  ],
  "personalRank": {
    "rank": 15,
    "name": "John Doe",
    "username": "johndoe",
    "totalCount": 28,
    "currentStreak": 5,
    "maxStreak": 8,
    "batch": {
      "batch_name": "SO-Batch-2025",
      "slug": "so-batch-2025"
    }
  }
}
```

---

**Response Fields Explanation**

| Field | Description |
|-------|-------------|
| top10 | Array of top 10 students |
| top10[].rank | Student rank |
| top10[].name | Student name |
| top10[].username | Student username |
| top10[].totalCount | Total questions solved |
| top10[].currentStreak | Current solving streak |
| top10[].maxStreak | Maximum streak achieved |
| top10[].batch | Student batch information |
| personalRank | Current student's ranking information |
| personalRank.rank | Current student's rank |
| personalRank.name | Current student's name |
| personalRank.username | Current student's username |

---

**Frontend Usage**

Frontend should:

• Display top 10 students in leaderboard format
• Highlight current student's personal rank
• Show rank numbers, names, and scores
• Display streak information
• Show batch information for context
• Allow refreshing leaderboard data
• Highlight rank changes (if tracking previous data)

---

**Possible Errors**

| Status Code | Meaning |
| ----------- | ------- |
| 401 | Authentication required |
| 500 | Server error |

---

#### Get Student Profile

---

**Endpoint**

GET /api/students/profile

---

**Description**

Get complete student profile with all statistics and progress data.

---

**Role Access**

Student

---

**Used In Frontend**

Student Profile Page

---

**Query Parameters**

No parameters available.

---

**Example API Call (Frontend)**

```javascript
const response = await axios.get("/api/students/profile", {
  headers: {
    Authorization: `Bearer ${token}` 
  }
});
```

---

**Response Example**

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
      "totalSolved": 25,
      "easySolved": 15,
      "mediumSolved": 8,
      "hardSolved": 2,
      "lastSync": "2025-03-10T15:30:00Z"
    },
    "gfg": {
      "totalSolved": 18,
      "easySolved": 12,
      "mediumSolved": 5,
      "hardSolved": 1,
      "lastSync": "2025-03-09T10:15:00Z"
    }
  },
  "streakInfo": {
    "currentStreak": 5,
    "maxStreak": 8,
    "lastSolvedDate": "2025-03-10T15:30:00Z"
  },
  "progressOverview": {
    "solvedQuestions": 43,
    "totalQuestions": 120,
    "completionPercentage": 35.8,
    "topicsCompleted": 3,
    "totalTopics": 8
  },
  "recentActivity": [
    {
      "question_name": "Two Sum",
      "platform": "LEETCODE",
      "solved_at": "2025-03-10T15:30:00Z"
    }
  ],
  "heatmap": [
    {
      "date": "2025-03-10",
      "count": 3
    }
  ]
}
```

---

**Response Fields Explanation**

| Field | Description |
|-------|-------------|
| personalInfo | Student's basic information |
| personalInfo.id | Student ID |
| personalInfo.name | Full name |
| personalInfo.email | Email address |
| personalInfo.username | Username |
| personalInfo.leetcode_id | LeetCode username |
| personalInfo.gfg_id | GFG username |
| personalInfo.github | GitHub username |
| personalInfo.linkedin | LinkedIn profile |
| personalInfo.city | Assigned city |
| personalInfo.batch | Assigned batch |
| codingStats | Platform-wise statistics |
| codingStats.leetcode | LeetCode progress |
| codingStats.gfg | GFG progress |
| codingStats.[platform].totalSolved | Total solved on platform |
| codingStats.[platform].lastSync | Last sync timestamp |
| streakInfo | Streak information |
| streakInfo.currentStreak | Current solving streak |
| streakInfo.maxStreak | Maximum streak achieved |
| progressOverview | Overall progress summary |
| progressOverview.solvedQuestions | Total questions solved |
| progressOverview.totalQuestions | Total assigned questions |
| progressOverview.completionPercentage | Completion percentage |
| recentActivity | Recent solved questions |
| heatmap | Daily activity data for calendar view |

---

**Frontend Usage**

Frontend should:

• Display personal information in profile section
• Show platform-wise statistics with progress bars
• Display streak information with visual indicators
• Show overall progress with percentage
• Render recent activity timeline
• Create heatmap calendar visualization
• Allow editing profile information
• Show last sync timestamps for each platform

---

**Possible Errors**

| Status Code | Meaning |
| ----------- | ------- |
| 401 | Authentication required |
| 500 | Server error |

---

</details>

---

### 🧑‍🏫 Admin APIs

**Quick Navigation:**
- [Get Admin Dashboard](#get-admin-dashboard)
- [Topics Management](#topics-management)
- [Classes Management](#classes-management)
- [Questions Management](#questions-management)
- [Question Assignment](#question-assignment)
- [Students Management](#students-management)
- [Leaderboard Management](#leaderboard-management)
- [Testing & Sync Tools](#testing--sync-tools)

**Admin API Endpoints:**
- `GET /api/admin/dashboard` - Get admin dashboard
- `GET /api/admin/cities` - Get cities list
- `POST /api/admin/batches` - Create batch
- `GET /api/admin/batches` - Get batches
- `GET /api/admin/topics` - Get all topics
- `POST /api/admin/topics` - Create topic
- `PATCH /api/admin/topics/:id` - Update topic
- `DELETE /api/admin/topics/:id` - Delete topic
- `POST /api/admin/topics/bulk` - Bulk create topics
- `GET /api/admin/questions` - Get questions
- `POST /api/admin/questions` - Create question
- `PATCH /api/admin/questions/:id` - Update question
- `DELETE /api/admin/questions/:id` - Delete question
- `POST /api/admin/questions/bulk-upload` - Bulk upload questions
- `GET /api/admin/students` - Get students
- `POST /api/admin/students` - Create student
- `PATCH /api/admin/students/:id` - Update student
- `DELETE /api/admin/students/:id` - Delete student
- `GET /api/admin/students/:username` - Get student report
- `POST /api/admin/students/progress` - Add student progress
- `POST /api/admin/students/sync/:id` - Manual student sync
- `POST /api/admin/leaderboard` - Get leaderboard
- `POST /api/admin/leaderboard/recalculate` - Recalculate leaderboard
- `GET /api/admin/test/leetcode/:username` - Test LeetCode sync
- `GET /api/admin/test/gfg/:username` - Test GFG sync
- Batch-specific endpoints for topics, classes, and questions

<details>
<summary>Admin API Details</summary>

#### Get Admin Dashboard

---

**Endpoint**

GET /api/admin/dashboard

---

**Description**

Get admin dashboard with batch statistics and performance metrics.

---

**Role Access**

Admin (Teacher/Intern/SuperAdmin)

---

**Used In Frontend**

Admin Dashboard

---

**Query Parameters**

No parameters available.

---

**Example API Call (Frontend)**

```javascript
const response = await axios.get("/api/admin/dashboard", {
  headers: {
    Authorization: `Bearer ${token}` 
  }
});
```

---

**Response Example**

```json
{
  "batchStats": {
    "totalStudents": 45,
    "totalQuestions": 120,
    "avgProgress": 65.5,
    "activeStudents": 38
  },
  "recentActivity": [
    {
      "studentName": "John Doe",
      "action": "solved_question",
      "details": "Two Sum",
      "timestamp": "2025-03-10T15:30:00Z"
    }
  ],
  "topicProgress": [
    {
      "topicName": "Arrays and Strings",
      "avgCompletion": 75.0,
      "totalQuestions": 40
    }
  ],
  "leaderboardPreview": [
    {
      "rank": 1,
      "name": "Alice Johnson",
      "score": 45
    }
  ]
}
```

---

**Response Fields Explanation**

| Field | Description |
|-------|-------------|
| batchStats | Batch-level statistics |
| batchStats.totalStudents | Total students in batch |
| batchStats.totalQuestions | Total questions assigned |
| batchStats.avgProgress | Average completion percentage |
| batchStats.activeStudents | Students with recent activity |
| recentActivity | Recent student activities |
| topicProgress | Topic-wise progress overview |
| leaderboardPreview | Top 5 students preview |

---

**Frontend Usage**

Frontend should:

• Display key statistics cards
• Show recent activity feed
• Render topic progress charts
• Display leaderboard preview
• Allow navigation to detailed pages
• Show batch performance metrics

---

**Possible Errors**

| Status Code | Meaning |
| ----------- | ------- |
| 401 | Authentication required |
| 403 | Admin access required |
| 500 | Server error |

---

#### Get All Topics (Admin)

---

**Endpoint**

GET /api/admin/topics

---

**Description**

Get all topics available for content management.

---

**Role Access**

Admin (Teacher/Intern/SuperAdmin)

---

**Used In Frontend**

Topics Management Page

---

**Query Parameters**

No parameters available.

---

**Example API Call (Frontend)**

```javascript
const response = await axios.get("/api/admin/topics", {
  headers: {
    Authorization: `Bearer ${token}` 
  }
});
```

---

**Response Example**

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
  },
  {
    "id": 2,
    "topic_name": "Dynamic Programming",
    "slug": "dynamic-programming",
    "description": "Advanced DP techniques",
    "order": 2,
    "created_at": "2025-03-02T11:00:00Z",
    "updated_at": "2025-03-05T14:30:00Z"
  }
]
```

---

**Response Fields Explanation**

| Field | Description |
|-------|-------------|
| id | Topic ID |
| topic_name | Topic display name |
| slug | URL-friendly identifier |
| description | Topic description |
| order | Display order |
| created_at | Creation timestamp |
| updated_at | Last update timestamp |

---

**Frontend Usage**

Frontend should:

• Display all topics in a table or list
• Show create, edit, delete actions
• Allow sorting by order or creation date
• Display topic descriptions
• Provide search functionality
• Show creation and update timestamps

---

**Possible Errors**

| Status Code | Meaning |
| ----------- | ------- |
| 401 | Authentication required |
| 403 | Admin access required |
| 500 | Server error |

---

#### Create Topic

---

**Endpoint**

POST /api/admin/topics

---

**Description**

Create a new topic for content organization.

---

**Role Access**

Teacher+ (Teacher, Intern, SuperAdmin)

---

**Used In Frontend**

Topics Management Page (Create Modal)

---

**Request Body**

```json
{
  "topic_name": "Graph Algorithms",
  "description": "Graph traversal and algorithms",
  "order": 3
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| topic_name | string | Yes | Topic display name |
| description | string | No | Topic description |
| order | number | No | Display order |

---

**Example API Call (Frontend)**

```javascript
const response = await axios.post("/api/admin/topics", {
  topic_name: "Graph Algorithms",
  description: "Graph traversal and algorithms",
  order: 3
}, {
  headers: {
    Authorization: `Bearer ${token}` 
  }
});
```

---

**Response Example**

```json
{
  "message": "Topic created successfully",
  "topic": {
    "id": 3,
    "topic_name": "Graph Algorithms",
    "slug": "graph-algorithms",
    "description": "Graph traversal and algorithms",
    "order": 3,
    "created_at": "2025-03-10T16:00:00Z",
    "updated_at": "2025-03-10T16:00:00Z"
  }
}
```

---

**Response Fields Explanation**

| Field | Description |
|-------|-------------|
| message | Success message |
| topic | Created topic object |
| topic.id | New topic ID |
| topic.slug | Auto-generated slug |
| topic.created_at | Creation timestamp |

---

**Frontend Usage**

Frontend should:

• Show create topic modal/form
• Validate topic name uniqueness
• Auto-generate slug preview
• Handle creation success/error
• Refresh topics list after creation
• Show confirmation message

---

**Possible Errors**

| Status Code | Meaning |
| ----------- | ------- |
| 400 | Invalid input or topic name exists |
| 401 | Authentication required |
| 403 | Teacher+ access required |
| 500 | Server error |

---

#### Update Topic

---

**Endpoint**

PATCH /api/admin/topics/:id

---

**Description**

Update existing topic information.

---

**Role Access**

Teacher+ (Teacher, Intern, SuperAdmin)

---

**Used In Frontend**

Topics Management Page (Edit Modal)

---

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Topic ID to update |

---

**Request Body**

```json
{
  "topic_name": "Advanced Graph Algorithms",
  "description": "Advanced graph traversal and algorithms",
  "order": 4
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| topic_name | string | No | Updated topic name |
| description | string | No | Updated description |
| order | number | No | Updated display order |

---

**Example API Call (Frontend)**

```javascript
const response = await axios.patch("/api/admin/topics/3", {
  topic_name: "Advanced Graph Algorithms",
  description: "Advanced graph traversal and algorithms",
  order: 4
}, {
  headers: {
    Authorization: `Bearer ${token}` 
  }
});
```

---

**Response Example**

```json
{
  "message": "Topic updated successfully",
  "topic": {
    "id": 3,
    "topic_name": "Advanced Graph Algorithms",
    "slug": "advanced-graph-algorithms",
    "description": "Advanced graph traversal and algorithms",
    "order": 4,
    "created_at": "2025-03-10T16:00:00Z",
    "updated_at": "2025-03-10T16:30:00Z"
  }
}
```

---

**Response Fields Explanation**

| Field | Description |
|-------|-------------|
| message | Success message |
| topic | Updated topic object |
| topic.updated_at | Update timestamp |

---

**Frontend Usage**

Frontend should:

• Show edit topic modal with current values
• Validate input before submission
• Handle slug regeneration if name changes
• Update topics list after successful edit
• Show error messages for validation failures

---

**Possible Errors**

| Status Code | Meaning |
| ----------- | ------- |
| 400 | Invalid input or topic name exists |
| 401 | Authentication required |
| 403 | Teacher+ access required |
| 404 | Topic not found |
| 500 | Server error |

---

#### Delete Topic

---

**Endpoint**

DELETE /api/admin/topics/:id

---

**Description**

Delete a topic (only if no questions exist).

---

**Role Access**

Teacher+ (Teacher, Intern, SuperAdmin)

---

**Used In Frontend**

Topics Management Page (Delete Action)

---

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Topic ID to delete |

---

**Example API Call (Frontend)**

```javascript
const response = await axios.delete("/api/admin/topics/3", {
  headers: {
    Authorization: `Bearer ${token}` 
  }
});
```

---

**Response Example**

```json
{
  "message": "Topic deleted successfully"
}
```

---

**Response Fields Explanation**

| Field | Description |
|-------|-------------|
| message | Success confirmation message |

---

**Frontend Usage**

Frontend should:

• Show delete confirmation dialog
• Check if topic has questions before allowing delete
• Handle delete success/error appropriately
• Remove topic from list after deletion
• Show appropriate error messages

---

**Possible Errors**

| Status Code | Meaning |
| ----------- | ------- |
| 400 | Topic has existing questions |
| 401 | Authentication required |
| 403 | Teacher+ access required |
| 404 | Topic not found |
| 500 | Server error |

---

#### Get Classes for Topic

---

**Endpoint**

GET /api/admin/{batchSlug}/topics/{topicSlug}/classes

---

**Description**

Get all classes for a specific topic in admin's batch.

---

**Role Access**

Admin (Teacher/Intern/SuperAdmin)

---

**Used In Frontend**

Classes Management Page

---

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| batchSlug | string | Batch identifier |
| topicSlug | string | Topic identifier |

---

**Example API Call (Frontend)**

```javascript
const response = await axios.get("/api/admin/so-batch-2025/topics/arrays-strings/classes", {
  headers: {
    Authorization: `Bearer ${token}` 
  }
});
```

---

**Response Example**

```json
[
  {
    "id": 1,
    "class_name": "Introduction to Arrays",
    "slug": "intro-arrays",
    "description": "Basic array operations",
    "duration_minutes": 90,
    "class_date": "2025-03-15T14:00:00Z",
    "created_at": "2025-03-01T10:00:00Z",
    "updated_at": "2025-03-01T10:00:00Z",
    "questionCount": 8
  },
  {
    "id": 2,
    "class_name": "String Manipulation",
    "slug": "string-manipulation",
    "description": "String operations and problems",
    "duration_minutes": 120,
    "class_date": "2025-03-17T16:00:00Z",
    "created_at": "2025-03-02T11:00:00Z",
    "updated_at": "2025-03-05T14:30:00Z",
    "questionCount": 10
  }
]
```

---

**Response Fields Explanation**

| Field | Description |
|-------|-------------|
| id | Class ID |
| class_name | Class display name |
| slug | Class slug |
| description | Class description |
| duration_minutes | Duration in minutes |
| class_date | Scheduled date/time |
| created_at | Creation timestamp |
| updated_at | Last update timestamp |
| questionCount | Number of assigned questions |

---

**Frontend Usage**

Frontend should:

• Display classes in table/list format
• Show class schedule information
• Display question counts
• Provide create, edit, delete actions
• Allow sorting by date or name
• Show class duration information

---

**Possible Errors**

| Status Code | Meaning |
| ----------- | ------- |
| 401 | Authentication required |
| 403 | Admin access required |
| 404 | Batch or topic not found |
| 500 | Server error |

---

#### Create Class

---

**Endpoint**

POST /api/admin/{batchSlug}/topics/{topicSlug}/classes

---

**Description**

Create a new class under a topic.

---

**Role Access**

Teacher+ (Teacher, Intern, SuperAdmin)

---

**Used In Frontend**

Classes Management Page (Create Modal)

---

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| batchSlug | string | Batch identifier |
| topicSlug | string | Topic identifier |

---

**Request Body**

```json
{
  "class_name": "Advanced Arrays",
  "description": "Complex array problems",
  "duration_minutes": 120,
  "class_date": "2025-03-20T14:00:00Z"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| class_name | string | Yes | Class display name |
| description | string | No | Class description |
| duration_minutes | number | No | Duration in minutes |
| class_date | string | No | Scheduled date (ISO format) |

---

**Example API Call (Frontend)**

```javascript
const response = await axios.post("/api/admin/so-batch-2025/topics/arrays-strings/classes", {
  class_name: "Advanced Arrays",
  description: "Complex array problems",
  duration_minutes: 120,
  class_date: "2025-03-20T14:00:00Z"
}, {
  headers: {
    Authorization: `Bearer ${token}` 
  }
});
```

---

**Response Example**

```json
{
  "message": "Class created successfully",
  "class": {
    "id": 3,
    "class_name": "Advanced Arrays",
    "slug": "advanced-arrays",
    "description": "Complex array problems",
    "duration_minutes": 120,
    "class_date": "2025-03-20T14:00:00Z",
    "created_at": "2025-03-10T16:00:00Z",
    "updated_at": "2025-03-10T16:00:00Z"
  }
}
```

---

**Response Fields Explanation**

| Field | Description |
|-------|-------------|
| message | Success message |
| class | Created class object |
| class.id | New class ID |
| class.slug | Auto-generated slug |

---

**Frontend Usage**

Frontend should:

• Show create class modal/form
• Validate class name uniqueness within topic
• Auto-generate slug preview
• Handle date/time picker for scheduling
• Refresh classes list after creation
• Show confirmation message

---

**Possible Errors**

| Status Code | Meaning |
| ----------- | ------- |
| 400 | Invalid input or class name exists |
| 401 | Authentication required |
| 403 | Teacher+ access required |
| 404 | Batch or topic not found |
| 500 | Server error |

---

#### Get Questions (Admin)

---

**Endpoint**

GET /api/admin/questions

---

**Description**

Get all questions with filtering and pagination for admin management.

---

**Role Access**

Admin (Teacher/Intern/SuperAdmin)

---

**Used In Frontend**

Questions Management Page

---

**Query Parameters**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| topicSlug | string | Filter by topic slug | topicSlug=arrays-strings |
| level | string | Filter by difficulty | level=medium |
| platform | string | Filter by platform | platform=leetcode |
| type | string | Filter by assignment type | type=homework |
| search | string | Search by question name | search=dp |
| page | number | Page number (default: 1) | page=2 |
| limit | number | Items per page (default: 10) | limit=20 |

---

**Example API Call (Frontend)**

```javascript
const response = await axios.get("/api/admin/questions", {
  params: {
    page: 1,
    limit: 20,
    level: "medium",
    platform: "leetcode"
  },
  headers: {
    Authorization: `Bearer ${token}` 
  }
});
```

---

**Response Example**

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
    "limit": 20,
    "totalPages": 3
  }
}
```

---

**Response Fields Explanation**

| Field | Description |
|-------|-------------|
| data | Array of question objects |
| data[].id | Question ID |
| data[].question_name | Question title |
| data[].question_link | External platform link |
| data[].platform | Platform (LEETCODE, GFG, OTHER, INTERVIEWBIT) |
| data[].level | Difficulty (EASY, MEDIUM, HARD) |
| data[].type | Assignment type (HOMEWORK, CLASSWORK) |
| data[].topic | Topic information |
| data[].created_at | Creation timestamp |
| pagination | Pagination metadata |
| pagination.total | Total questions matching filters |
| pagination.page | Current page |
| pagination.limit | Items per page |
| pagination.totalPages | Total pages |

---

**Frontend Usage**

Frontend should:

• Display filter controls for all parameters
• Implement search functionality
• Show questions in table/list format
• Display platform badges and difficulty indicators
• Implement pagination controls
• Provide edit/delete actions for each question
• Show topic information for each question

---

**Possible Errors**

| Status Code | Meaning |
| ----------- | ------- |
| 401 | Authentication required |
| 403 | Admin access required |
| 400 | Invalid filter parameters |
| 500 | Server error |

---

#### Create Question

---

**Endpoint**

POST /api/admin/questions

---

**Description**

Create a new question in the system.

---

**Role Access**

Teacher+ (Teacher, Intern, SuperAdmin)

---

**Used In Frontend**

Questions Management Page (Create Modal)

---

**Request Body**

```json
{
  "question_name": "Maximum Subarray",
  "question_link": "https://leetcode.com/problems/maximum-subarray/",
  "topic_id": 1,
  "platform": "LEETCODE",
  "level": "MEDIUM",
  "type": "HOMEWORK"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| question_name | string | Yes | Question title |
| question_link | string | Yes | External platform URL |
| topic_id | number | Yes | Topic ID |
| platform | string | No | Platform (LEETCODE, GFG, OTHER, INTERVIEWBIT) |
| level | string | No | Difficulty (EASY, MEDIUM, HARD) |
| type | string | No | Assignment type (HOMEWORK, CLASSWORK) |

---

**Example API Call (Frontend)**

```javascript
const response = await axios.post("/api/admin/questions", {
  question_name: "Maximum Subarray",
  question_link: "https://leetcode.com/problems/maximum-subarray/",
  topic_id: 1,
  platform: "LEETCODE",
  level: "MEDIUM",
  type: "HOMEWORK"
}, {
  headers: {
    Authorization: `Bearer ${token}` 
  }
});
```

---

**Response Example**

```json
{
  "message": "Question created successfully",
  "question": {
    "id": 2,
    "question_name": "Maximum Subarray",
    "question_link": "https://leetcode.com/problems/maximum-subarray/",
    "platform": "LEETCODE",
    "level": "MEDIUM",
    "type": "HOMEWORK",
    "topic_id": 1,
    "created_at": "2025-03-10T16:00:00Z",
    "updated_at": "2025-03-10T16:00:00Z"
  }
}
```

---

**Response Fields Explanation**

| Field | Description |
|-------|-------------|
| message | Success message |
| question | Created question object |
| question.id | New question ID |
| question.created_at | Creation timestamp |

---

**Frontend Usage**

Frontend should:

• Show create question modal/form
• Provide topic selection dropdown
• Auto-detect platform from URL
• Validate URL format
• Refresh questions list after creation
• Show confirmation message

---

**Possible Errors**

| Status Code | Meaning |
| ----------- | ------- |
| 400 | Invalid input or question exists for topic |
| 401 | Authentication required |
| 403 | Teacher+ access required |
| 404 | Topic not found |
| 500 | Server error |

---

#### Assign Questions to Class

---

**Endpoint**

POST /api/admin/{batchSlug}/topics/{topicSlug}/classes/{classSlug}/questions

---

**Description**

Assign multiple questions to a specific class.

---

**Role Access**

Teacher+ (Teacher, Intern, SuperAdmin)

---

**Used In Frontend**

Question Assignment Page

---

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| batchSlug | string | Batch identifier |
| topicSlug | string | Topic identifier |
| classSlug | string | Class identifier |

---

**Request Body**

```json
{
  "question_ids": [1, 2, 3, 4, 5]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| question_ids | array | Yes | Array of question IDs to assign |

---

**Example API Call (Frontend)**

```javascript
const response = await axios.post("/api/admin/so-batch-2025/topics/arrays-strings/classes/intro-arrays/questions", {
  question_ids: [1, 2, 3, 4, 5]
}, {
  headers: {
    Authorization: `Bearer ${token}` 
  }
});
```

---

**Response Example**

```json
{
  "message": "Questions assigned successfully",
  "assignedCount": 5,
  "assignments": [
    {
      "class_id": 1,
      "question_id": 1
    },
    {
      "class_id": 1,
      "question_id": 2
    }
  ]
}
```

---

**Response Fields Explanation**

| Field | Description |
|-------|-------------|
| message | Success message |
| assignedCount | Number of questions assigned |
| assignments | Array of assignment objects |
| assignments[].class_id | Class ID |
| assignments[].question_id | Question ID |

---

**Frontend Usage**

Frontend should:

• Show available questions list with checkboxes
• Allow bulk selection of questions
• Validate selection before submission
• Show assignment success/error
• Refresh assigned questions list
• Handle duplicate assignments gracefully

---

**Possible Errors**

| Status Code | Meaning |
| ----------- | ------- |
| 400 | Invalid question IDs or empty array |
| 401 | Authentication required |
| 403 | Teacher+ access required |
| 404 | Batch, topic, or class not found |
| 500 | Server error |

---

</details>

---

### 🏢 SuperAdmin APIs

**Quick Navigation:**
- [Cities Management](#cities-management)
- [Batches Management](#batches-management)
- [Admins Management](#admins-management)
- [System Statistics](#system-statistics)

**SuperAdmin API Endpoints:**
- `GET /api/superadmin/cities` - Get all cities
- `POST /api/superadmin/cities` - Create city
- `PATCH /api/superadmin/cities/:id` - Update city
- `DELETE /api/superadmin/cities/:id` - Delete city
- `GET /api/superadmin/batches` - Get all batches
- `POST /api/superadmin/batches` - Create batch
- `PATCH /api/superadmin/batches/:id` - Update batch
- `DELETE /api/superadmin/batches/:id` - Delete batch
- `POST /api/superadmin/admins` - Create admin user
- `GET /api/superadmin/stats` - Get system statistics

<details>
<summary>SuperAdmin API Details</summary>

#### Get All Cities

---

**Endpoint**

GET /api/superadmin/cities

---

**Description**

Get all cities for system management.

---

**Role Access**

SuperAdmin

---

**Used In Frontend**

Cities Management Page

---

**Query Parameters**

No parameters available.

---

**Example API Call (Frontend)**

```javascript
const response = await axios.get("/api/superadmin/cities", {
  headers: {
    Authorization: `Bearer ${token}` 
  }
});
```

---

**Response Example**

```json
[
  {
    "id": 1,
    "city_name": "Bangalore",
    "slug": "bangalore",
    "created_at": "2025-03-01T10:00:00Z"
  },
  {
    "id": 2,
    "city_name": "Chennai",
    "slug": "chennai",
    "created_at": "2025-03-02T11:00:00Z"
  }
]
```

---

**Response Fields Explanation**

| Field | Description |
|-------|-------------|
| id | City ID |
| city_name | City display name |
| slug | URL-friendly identifier |
| created_at | Creation timestamp |

---

**Frontend Usage**

Frontend should:

• Display all cities in table format
• Show create, edit, delete actions
• Display city creation dates
• Provide search functionality
• Show batch counts for each city

---

**Possible Errors**

| Status Code | Meaning |
| ----------- | ------- |
| 401 | Authentication required |
| 403 | SuperAdmin access required |
| 500 | Server error |

---

#### Create City

---

**Endpoint**

POST /api/superadmin/cities

---

**Description**

Create a new city for multi-location support.

---

**Role Access**

SuperAdmin

---

**Used In Frontend**

Cities Management Page (Create Modal)

---

**Request Body**

```json
{
  "city_name": "Mumbai"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| city_name | string | Yes | City display name |

---

**Example API Call (Frontend)**

```javascript
const response = await axios.post("/api/superadmin/cities", {
  city_name: "Mumbai"
}, {
  headers: {
    Authorization: `Bearer ${token}` 
  }
});
```

---

**Response Example**

```json
{
  "message": "City created successfully",
  "city": {
    "id": 3,
    "city_name": "Mumbai",
    "slug": "mumbai",
    "created_at": "2025-03-10T16:00:00Z"
  }
}
```

---

**Response Fields Explanation**

| Field | Description |
|-------|-------------|
| message | Success message |
| city | Created city object |
| city.id | New city ID |
| city.slug | Auto-generated slug |

---

**Frontend Usage**

Frontend should:

• Show create city modal/form
• Validate city name uniqueness
• Auto-generate slug preview
• Refresh cities list after creation
• Show confirmation message

---

**Possible Errors**

| Status Code | Meaning |
| ----------- | ------- |
| 400 | Invalid input or city name exists |
| 401 | Authentication required |
| 403 | SuperAdmin access required |
| 500 | Server error |

---

#### Get System Statistics

---

**Endpoint**

GET /api/superadmin/stats

---

**Description**

Get platform-wide statistics and metrics.

---

**Role Access**

SuperAdmin

---

**Used In Frontend**

System Statistics Page

---

**Query Parameters**

No parameters available.

---

**Example API Call (Frontend)**

```javascript
const response = await axios.get("/api/superadmin/stats", {
  headers: {
    Authorization: `Bearer ${token}` 
  }
});
```

---

**Response Example**

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

**Response Fields Explanation**

| Field | Description |
|-------|-------------|
| totalCities | Number of cities in system |
| totalBatches | Number of batches across all cities |
| totalStudents | Total registered students |
| totalAdmins | Total admin users |
| totalQuestions | Total questions in system |
| totalTopics | Total topics created |

---

**Frontend Usage**

Frontend should:

• Display statistics in card format
• Show growth trends over time
• Provide visual charts/metrics
• Allow data export functionality
• Show real-time updates

---

**Possible Errors**

| Status Code | Meaning |
| ----------- | ------- |
| 401 | Authentication required |
| 403 | SuperAdmin access required |
| 500 | Server error |

---

#### Update City

---

**Endpoint**

PATCH /api/superadmin/cities/:id

---

**Description**

Update existing city information.

---

**Role Access**

SuperAdmin

---

**Used In Frontend**

Cities Management Page (Edit Modal)

---

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | City ID to update |

---

**Request Body**

```json
{
  "city_name": "New Bangalore"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| city_name | string | Yes | Updated city name |

---

**Example API Call (Frontend)**

```javascript
const response = await axios.patch("/api/superadmin/cities/1", {
  city_name: "New Bangalore"
}, {
  headers: {
    Authorization: `Bearer ${token}` 
  }
});
```

---

**Response Example**

```json
{
  "message": "City updated successfully",
  "city": {
    "id": 1,
    "city_name": "New Bangalore",
    "slug": "new-bangalore",
    "created_at": "2025-03-01T10:00:00Z",
    "updated_at": "2025-03-10T16:30:00Z"
  }
}
```

---

**Response Fields Explanation**

| Field | Description |
|-------|-------------|
| message | Success message |
| city | Updated city object |
| city.updated_at | Update timestamp |

---

**Frontend Usage**

Frontend should:

• Show edit city modal with current value
• Validate city name uniqueness
• Handle slug regeneration if name changes
• Update cities list after successful edit

---

**Possible Errors**

| Status Code | Meaning |
| ----------- | ------- |
| 400 | Invalid input or city name exists |
| 401 | Authentication required |
| 403 | SuperAdmin access required |
| 404 | City not found |
| 500 | Server error |

---

#### Delete City

---

**Endpoint**

DELETE /api/superadmin/cities/:id

---

**Description**

Delete a city (only if no batches exist).

---

**Role Access**

SuperAdmin

---

**Used In Frontend**

Cities Management Page (Delete Action)

---

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | City ID to delete |

---

**Example API Call (Frontend)**

```javascript
const response = await axios.delete("/api/superadmin/cities/1", {
  headers: {
    Authorization: `Bearer ${token}` 
  }
});
```

---

**Response Example**

```json
{
  "message": "City deleted successfully"
}
```

---

**Response Fields Explanation**

| Field | Description |
|-------|-------------|
| message | Success confirmation message |

---

**Frontend Usage**

Frontend should:

• Show delete confirmation dialog
• Check if city has batches before allowing delete
• Handle delete success/error appropriately
• Remove city from list after deletion

---

**Possible Errors**

| Status Code | Meaning |
| ----------- | ------- |
| 400 | City has existing batches |
| 401 | Authentication required |
| 403 | SuperAdmin access required |
| 404 | City not found |
| 500 | Server error |

---

#### Update Batch

---

**Endpoint**

PATCH /api/superadmin/batches/:id

---

**Description**

Update existing batch information.

---

**Role Access**

SuperAdmin

---

**Used In Frontend**

Batches Management Page (Edit Modal)

---

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Batch ID to update |

---

**Request Body**

```json
{
  "batch_name": "Updated Batch 2025",
  "year": 2025,
  "city_id": 1
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| batch_name | string | No | Updated batch name |
| year | number | No | Updated batch year |
| city_id | number | No | Updated city ID |

---

**Example API Call (Frontend)**

```javascript
const response = await axios.patch("/api/superadmin/batches/1", {
  batch_name: "Updated Batch 2025",
  year: 2025,
  city_id: 1
}, {
  headers: {
    Authorization: `Bearer ${token}` 
  }
});
```

---

**Response Example**

```json
{
  "message": "Batch updated successfully",
  "batch": {
    "id": 1,
    "batch_name": "Updated Batch 2025",
    "slug": "updated-batch-2025",
    "year": 2025,
    "city_id": 1,
    "created_at": "2025-03-01T10:00:00Z",
    "updated_at": "2025-03-10T16:30:00Z"
  }
}
```

---

**Response Fields Explanation**

| Field | Description |
|-------|-------------|
| message | Success message |
| batch | Updated batch object |
| batch.updated_at | Update timestamp |

---

**Frontend Usage**

Frontend should:

• Show edit batch modal with current values
• Validate input before submission
• Handle slug regeneration if name changes
• Update batches list after successful edit

---

**Possible Errors**

| Status Code | Meaning |
| ----------- | ------- |
| 400 | Invalid input or batch name exists |
| 401 | Authentication required |
| 403 | SuperAdmin access required |
| 404 | Batch or city not found |
| 500 | Server error |

---

#### Delete Batch

---

**Endpoint**

DELETE /api/superadmin/batches/:id

---

**Description**

Delete a batch (only if no students exist).

---

**Role Access**

SuperAdmin

---

**Used In Frontend**

Batches Management Page (Delete Action)

---

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Batch ID to delete |

---

**Example API Call (Frontend)**

```javascript
const response = await axios.delete("/api/superadmin/batches/1", {
  headers: {
    Authorization: `Bearer ${token}` 
  }
});
```

---

**Response Example**

```json
{
  "message": "Batch deleted successfully"
}
```

---

**Response Fields Explanation**

| Field | Description |
|-------|-------------|
| message | Success confirmation message |

---

**Frontend Usage**

Frontend should:

• Show delete confirmation dialog
• Check if batch has students before allowing delete
• Handle delete success/error appropriately
• Remove batch from list after deletion

---

**Possible Errors**

| Status Code | Meaning |
| ----------- | ------- |
| 400 | Batch has existing students |
| 401 | Authentication required |
| 403 | SuperAdmin access required |
| 404 | Batch not found |
| 500 | Server error |

---

#### Create Admin User

---

**Endpoint**

POST /api/superadmin/admins

---

**Description**

Create a new admin user (Teacher/Intern/SuperAdmin).

---

**Role Access**

SuperAdmin

---

**Used In Frontend**

Admins Management Page (Create Modal)

---

**Request Body**

```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "username": "janesmith",
  "password": "password123",
  "role": "TEACHER",
  "batch_id": 1
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Admin full name |
| email | string | Yes | Admin email (unique) |
| username | string | Yes | Username (unique) |
| password | string | Yes | Account password |
| role | string | Yes | Admin role (SUPERADMIN, TEACHER, INTERN) |
| batch_id | number | Yes | Batch ID to assign admin |

---

**Example API Call (Frontend)**

```javascript
const response = await axios.post("/api/superadmin/admins", {
  name: "Jane Smith",
  email: "jane@example.com",
  username: "janesmith",
  password: "password123",
  role: "TEACHER",
  batch_id: 1
}, {
  headers: {
    Authorization: `Bearer ${token}` 
  }
});
```

---

**Response Example**

```json
{
  "message": "Admin created successfully",
  "admin": {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "username": "janesmith",
    "role": "TEACHER",
    "batch_id": 1,
    "created_at": "2025-03-10T16:00:00Z"
  }
}
```

---

**Response Fields Explanation**

| Field | Description |
|-------|-------------|
| message | Success message |
| admin | Created admin object |
| admin.id | New admin ID |
| admin.created_at | Creation timestamp |

---

**Frontend Usage**

Frontend should:

• Show create admin modal/form
• Validate email and username uniqueness
• Provide role selection dropdown
• Show batch selection dropdown
• Handle creation success/error

---

**Possible Errors**

| Status Code | Meaning |
| ----------- | ------- |
| 400 | Invalid input or admin exists |
| 401 | Authentication required |
| 403 | SuperAdmin access required |
| 404 | Batch not found |
| 500 | Server error |

**Status**: ⚠️ **Pending Implementation** - Currently marked as not working in backend

---

#### Get Cities (Admin)

---

**Endpoint**

GET /api/admin/cities

---

**Description**

Get all cities for admin reference.

---

**Role Access**

Admin (Teacher/Intern/SuperAdmin)

---

**Used In Frontend**

Admin City Selection Dropdowns

---

**Query Parameters**

No parameters available.

---

**Example API Call (Frontend)**

```javascript
const response = await axios.get("/api/admin/cities", {
  headers: {
    Authorization: `Bearer ${token}` 
  }
});
```

---

**Response Example**

```json
[
  {
    "id": 1,
    "city_name": "Bangalore",
    "slug": "bangalore",
    "created_at": "2025-03-01T10:00:00Z"
  },
  {
    "id": 2,
    "city_name": "Chennai",
    "slug": "chennai",
    "created_at": "2025-03-02T11:00:00Z"
  }
]
```

---

**Response Fields Explanation**

| Field | Description |
|-------|-------------|
| id | City ID |
| city_name | City display name |
| slug | URL-friendly identifier |
| created_at | Creation timestamp |

---

**Frontend Usage**

Frontend should:

• Display cities in dropdown selectors
• Use for batch creation forms
• Cache data for performance

---

**Possible Errors**

| Status Code | Meaning |
| ----------- | ------- |
| 401 | Authentication required |
| 403 | Admin access required |
| 500 | Server error |

---

#### Get Questions (Admin)

---

**Endpoint**

GET /api/admin/questions

---

**Description**

Get all questions available for assignment (duplicate of existing documented API).

---

**Role Access**

Admin (Teacher/Intern/SuperAdmin)

---

**Used In Frontend**

Question Assignment Page

---

**Query Parameters**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| topicSlug | string | Filter by topic slug | topicSlug=arrays-strings |
| level | string | Filter by difficulty | level=medium |
| platform | string | Filter by platform | platform=leetcode |
| type | string | Filter by assignment type | type=homework |
| search | string | Search by question name | search=dp |
| page | number | Page number (default: 1) | page=2 |
| limit | number | Items per page (default: 10) | limit=20 |

---

**Example API Call (Frontend)**

```javascript
const response = await axios.get("/api/admin/questions", {
  params: {
    page: 1,
    limit: 20,
    level: "medium"
  },
  headers: {
    Authorization: `Bearer ${token}` 
  }
});
```

---

**Response Example**

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
      }
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

---

**Response Fields Explanation**

| Field | Description |
|-------|-------------|
| data | Array of question objects |
| data[].id | Question ID |
| data[].question_name | Question title |
| data[].question_link | External platform link |
| data[].platform | Platform (LEETCODE, GFG, OTHER, INTERVIEWBIT) |
| data[].level | Difficulty (EASY, MEDIUM, HARD) |
| data[].type | Assignment type (HOMEWORK, CLASSWORK) |
| data[].topic | Topic information |
| pagination | Pagination metadata |

---

**Frontend Usage**

Frontend should:

• Display available questions for assignment
• Implement filtering and pagination
• Show question details in selection interface
• Handle bulk selection for assignment

---

**Possible Errors**

| Status Code | Meaning |
| ----------- | ------- |
| 401 | Authentication required |
| 403 | Admin access required |
| 400 | Invalid filter parameters |
| 500 | Server error |

---

#### Recalculate Leaderboard

---

**Endpoint**

POST /api/admin/leaderboard/recalculate

---

**Description**

Force recalculation of leaderboard rankings for all students.

---

**Role Access**

Admin (Teacher/Intern/SuperAdmin)

---

**Used In Frontend**

Admin Leaderboard Management

---

**Request Body**

```json
{}
```

Empty request body - triggers full leaderboard recalculation.

---

**Example API Call (Frontend)**

```javascript
const response = await axios.post("/api/admin/leaderboard/recalculate", {}, {
  headers: {
    Authorization: `Bearer ${token}` 
  }
});
```

---

**Response Example**

```json
{
  "message": "Leaderboard recalculated successfully",
  "processed": 45,
  "updated": 38
}
```

---

**Response Fields Explanation**

| Field | Description |
|-------|-------------|
| message | Success message |
| processed | Number of students processed |
| updated | Number of students with updated rankings |

---

**Frontend Usage**

Frontend should:

• Show recalculate button in leaderboard management
• Display loading state during processing
• Show success/error messages
• Refresh leaderboard data after completion
• Use sparingly due to processing overhead

---

**Possible Errors**

| Status Code | Meaning |
| ----------- | ------- |
| 401 | Authentication required |
| 403 | Admin access required |
| 500 | Server error during recalculation |

---

#### Test LeetCode Sync

---

**Endpoint**

GET /api/admin/test/leetcode/:username

---

**Description**

Test LeetCode API integration for a specific username.

---

**Role Access**

Admin (Teacher/Intern/SuperAdmin)

---

**Used In Frontend**

Admin Testing Tools

---

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| username | string | LeetCode username to test |

---

**Example API Call (Frontend)**

```javascript
const response = await axios.get("/api/admin/test/leetcode/johndoe", {
  headers: {
    Authorization: `Bearer ${token}` 
  }
});
```

---

**Response Example**

```json
{
  "success": true,
  "data": {
    "username": "johndoe",
    "totalSolved": 25,
    "easySolved": 15,
    "mediumSolved": 8,
    "hardSolved": 2,
    "lastSync": "2025-03-10T15:30:00Z"
  }
}
```

---

**Response Fields Explanation**

| Field | Description |
|-------|-------------|
| success | Test success status |
| data | LeetCode user data |
| data.username | LeetCode username |
| data.totalSolved | Total problems solved |
| data.easySolved | Easy problems solved |
| data.mediumSolved | Medium problems solved |
| data.hardSolved | Hard problems solved |
| data.lastSync | Last sync timestamp |

---

**Frontend Usage**

Frontend should:

• Provide testing interface for platform integration
• Display test results clearly
• Show error messages for failed tests
• Use for troubleshooting sync issues

---

**Possible Errors**

| Status Code | Meaning |
| ----------- | ------- |
| 401 | Authentication required |
| 403 | Admin access required |
| 404 | Username not found |
| 500 | API integration error |

---

#### Test GFG Sync

---

**Endpoint**

GET /api/admin/test/gfg/:username

---

**Description**

Test GeeksforGeeks API integration for a specific username.

---

**Role Access**

Admin (Teacher/Intern/SuperAdmin)

---

**Used In Frontend**

Admin Testing Tools

---

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| username | string | GFG username to test |

---

**Example API Call (Frontend)**

```javascript
const response = await axios.get("/api/admin/test/gfg/johndoe", {
  headers: {
    Authorization: `Bearer ${token}` 
  }
});
```

---

**Response Example**

```json
{
  "success": true,
  "data": {
    "username": "johndoe",
    "totalSolved": 18,
    "easySolved": 12,
    "mediumSolved": 5,
    "hardSolved": 1,
    "lastSync": "2025-03-09T10:15:00Z"
  }
}
```

---

**Response Fields Explanation**

| Field | Description |
|-------|-------------|
| success | Test success status |
| data | GFG user data |
| data.username | GFG username |
| data.totalSolved | Total problems solved |
| data.easySolved | Easy problems solved |
| data.mediumSolved | Medium problems solved |
| data.hardSolved | Hard problems solved |
| data.lastSync | Last sync timestamp |

---

**Frontend Usage**

Frontend should:

• Provide testing interface for platform integration
• Display test results clearly
• Show error messages for failed tests
• Use for troubleshooting sync issues

---

**Possible Errors**

| Status Code | Meaning |
| ----------- | ------- |
| 401 | Authentication required |
| 403 | Admin access required |
| 404 | Username not found |
| 500 | API integration error |

---

#### Manual Student Sync

---

**Endpoint**

POST /api/admin/students/sync/:id

---

**Description**

Manually trigger progress sync for a specific student.

---

**Role Access**

Admin (Teacher/Intern/SuperAdmin)

---

**Used In Frontend**

Student Management

---

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Student ID to sync |

---

**Request Body**

```json
{}
```

Empty request body - triggers manual sync.

---

**Example API Call (Frontend)**

```javascript
const response = await axios.post("/api/admin/students/sync/1", {}, {
  headers: {
    Authorization: `Bearer ${token}` 
  }
});
```

---

**Response Example**

```json
{
  "message": "Student sync completed successfully",
  "syncedQuestions": 5,
  "newProgress": 2
}
```

---

**Response Fields Explanation**

| Field | Description |
|-------|-------------|
| message | Success message |
| syncedQuestions | Number of questions synced |
| newProgress | New progress records created |

---

**Frontend Usage**

Frontend should:

• Provide sync button in student management
• Show loading state during sync
• Display sync results
• Update student progress after completion
• Use for troubleshooting sync issues

---

**Possible Errors**

| Status Code | Meaning |
| ----------- | ------- |
| 401 | Authentication required |
| 403 | Admin access required |
| 404 | Student not found |
| 500 | Sync process error |

---

</details>

---

## 📊 API Summary Table

| Method | Endpoint | Description | Role Access | Frontend Page |
|--------|----------|-------------|-------------|---------------|
| POST | /api/auth/student/register | Register student | Public | Registration |
| POST | /api/auth/student/login | Student login | Public | Login |
| POST | /api/auth/admin/login | Admin login | Public | Login |
| GET | /api/students/topics | Get topics | Student | Topics Page |
| GET | /api/students/topics/:slug | Get topic details | Student | Topic Details |
| GET | /api/students/topics/:slug/classes/:slug | Get class | Student | Class Page |
| GET | /api/students/addedQuestions | Get questions | Student | Questions Page |
| POST | /api/students/leaderboard | Get leaderboard | Student | Leaderboard |
| GET | /api/students/profile | Get profile | Student | Profile |
| GET | /api/admin/dashboard | Get dashboard | Admin | Admin Dashboard |
| GET/POST/PATCH/DEL | /api/admin/topics | Manage topics | Admin | Topics Management |
| GET/POST/PATCH/DEL | /api/admin/{batch}/topics/{topic}/classes | Manage classes | Admin | Classes Management |
| GET/POST/PATCH/DEL | /api/admin/questions | Manage questions | Admin | Questions Management |
| GET/POST/PATCH/DEL | /api/admin/students | Manage students | Admin | Students Management |
| GET/POST/PATCH/DEL | /api/superadmin/cities | Manage cities | SuperAdmin | Cities Management |
| GET/POST/PATCH/DEL | /api/superadmin/batches | Manage batches | SuperAdmin | Batches Management |
| POST | /api/superadmin/admins | Create admin | SuperAdmin | Admins Management |
| GET | /api/superadmin/stats | Get system stats | SuperAdmin | System Stats |

---

## 🔄 System Workflows

### Teacher Creates Topic Workflow
1. Teacher opens Topics Management page
2. Clicks "Create Topic" button
3. Fills topic form (name, description, order)
4. Frontend calls `POST /api/admin/topics`
5. Backend validates and saves topic
6. Topic appears in topics list
7. Teacher can create classes under topic

### Student Solving Question Workflow
1. Student navigates to Class page
2. Views assigned questions list
3. Clicks question link (opens LeetCode/GFG)
4. Solves problem on external platform
5. Returns to class page
6. Marks question as solved
7. Progress updates automatically
8. Leaderboard ranks update

### Admin Assigns Questions Workflow
1. Admin opens Question Assignment page
2. Selects class from dropdown
3. Views available questions list
4. Selects multiple questions
5. Clicks "Assign Questions"
6. Frontend calls `POST /api/admin/{batch}/topics/{topic}/classes/{class}/questions`
7. Questions appear in student class page

### SuperAdmin Creates City Workflow
1. SuperAdmin opens Cities Management page
2. Clicks "Create City" button
3. Enters city name
4. Frontend calls `POST /api/superadmin/cities`
5. Backend generates slug and saves city
6. City appears in cities list
7. SuperAdmin can create batches under city

---

## 9. Data Models

### Student Model
- Personal info: name, email, username
- Platform IDs: leetcode_id, gfg_id
- Progress tracking: solvedQuestions, currentStreak
- Relations: city, batch

### Admin Model  
- Personal info: name, email, username
- Role: SUPERADMIN, TEACHER, INTERN
- Relations: city, batch

### Topic Model
- Content: topic_name, description, order
- Progress tracking: solvedQuestions, totalQuestions
- Relations: classes, questions

### Class Model
- Schedule: class_name, duration_minutes, class_date
- Progress: solvedQuestions, totalQuestions
- Relations: topic, questions

### Question Model
- Details: question_name, question_link, platform
- Metadata: level, type, topic
- Progress tracking: solved status

---

## 10. Authentication Flow

### Login Process
1. User submits credentials
2. Backend validates email/username and password
3. Generate access token (15 min) and refresh token (7 days)
4. Return tokens with user data
5. Frontend stores tokens in localStorage
6. Include access token in API headers
7. Refresh token when expired

### Role-Based Access
- **SuperAdmin**: Full system access
- **Teacher/Intern**: Batch-level content management
- **Student**: Learning and progress tracking

---

## 11. Error Handling

### Standard Error Responses
- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource already exists
- **500 Internal Server Error**: Server error

### Frontend Error Behavior
- Display user-friendly error messages
- Redirect to login on 401 errors
- Show validation errors on forms
- Handle network errors gracefully

---

## 12. Performance Considerations

### Database Optimizations
- Indexed queries for batch-specific data
- Efficient pagination for large datasets
- Optimized leaderboard calculations
- Cached frequently accessed data

### Frontend Optimizations
- Lazy loading for large lists
- Debounced search inputs
- Efficient state management
- Optimized re-renders

---

## 13. Security Features

### Authentication Security
- JWT token expiration
- Refresh token rotation
- Password hashing with bcrypt
- Secure token storage

### API Security
- Role-based access control
- Input validation and sanitization
- SQL injection prevention
- XSS protection

---

## 14. Deployment Notes

### Environment Variables
- DATABASE_URL: PostgreSQL connection
- JWT_SECRET: Token signing secret
- PORT: Server port (default 5000)

### Swagger Documentation
- Available at `/api-docs`
- Interactive API testing
- Complete endpoint documentation
- Authentication testing support

---

## 15. Future Enhancements

### Planned Features
- Real-time progress updates
- Advanced analytics dashboard
- Mobile app integration
- Automated progress sync
- Enhanced gamification

### Scalability Considerations
- Microservices architecture
- Database sharding
- CDN integration
- Load balancing
