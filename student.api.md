# Student API Documentation

## Overview

This document provides comprehensive information about all student APIs, including authentication, middleware, Prisma queries, and response formats.

## Table of Contents

1. [Authentication Flow](#authentication-flow)
2. [Middleware Chain](#middleware-chain)
3. [API Endpoints](#api-endpoints)
4. [Database Schema](#database-schema)
5. [Error Handling](#error-handling)
6. [Usage Examples](#usage-examples)

---

## Authentication Flow

### JWT Token Structure

Student JWT tokens contain the following payload:

```typescript
interface AccessTokenPayload {
  id: number;              // Student ID
  email: string;           // Student email
  role: "STUDENT";         // Fixed role
  userType: "student";     // User type
  batchId: number;         // Batch ID (if available)
  batchName: string;       // Batch name (if available)
  batchSlug: string;       // Batch slug (if available)
  cityId: number;          // City ID (if available)
  cityName: string;        // City name (if available)
  iat: number;             // Issued at
  exp: number;             // Expires at
}
```

### Registration vs Login

- **Registration**: Creates student account, **does NOT** generate tokens
- **Login**: Validates credentials and generates JWT tokens
- **Logout**: Clears refresh token from database

---

## Middleware Chain

Every student API goes through the following middleware chain:

### 1. `verifyToken` (auth.middleware.ts)
```typescript
// Validates JWT token and extracts user info
const authHeader = req.headers.authorization;
const token = authHeader.split(" ")[1];
const decoded = verifyAccessToken(token);
req.user = decoded; // Attaches user to request
```

### 2. `isStudent` (role.middleware.ts)
```typescript
// Validates user role
if (req.user?.userType !== 'student') {
  return res.status(403).json({ error: 'Access denied. Students only.' });
}
```

### 3. `extractStudentInfo` (student.middleware.ts)
```typescript
// Extracts student-specific info from token and attaches to request
const user = req.user as AccessTokenPayload;
req.student = user;
req.batchId = user.batchId;
req.batchName = user.batchName;
req.batchSlug = user.batchSlug;
req.cityId = user.cityId;
req.cityName = user.cityName;
```

---

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/student/register
**Purpose**: Register a new student

**Request Body**:
```json
{
  "name": "string",
  "email": "string",
  "username": "string", 
  "password": "string",
  "batch_id": "number",
  "enrollment_id": "string",
  "leetcode_id": "string",
  "gfg_id": "string"
}
```

**Prisma Query**:
```typescript
// Creates student with batch and city relationship
const student = await prisma.student.create({
  data: {
    name, email, username, password_hash,
    enrollment_id, batch_id, city_id: batch.city.id,
    leetcode_id, gfg_id
  },
  include: {
    batch: { select: { id: true, batch_name: true, slug: true, year: true }},
    city: { select: { id: true, city_name: true }}
  }
});
```

**Response** (201):
```json
{
  "message": "Student registered successfully",
  "user": {
    "id": 31,
    "name": "Test Student",
    "email": "test@student.com",
    "username": "teststudent",
    "batch": {
      "id": 11,
      "batch_name": "SOT",
      "slug": "bangalore-sot-2024",
      "year": 2024
    },
    "city": {
      "id": 1,
      "city_name": "Bangalore"
    }
  }
}
```

---

#### POST /api/auth/student/login
**Purpose**: Authenticate student and generate tokens

**Request Body** (supports both email OR username):
```json
{
  "email": "test@student.com",    // OR
  "username": "teststudent",     // OR
  "password": "password123"
}
```

**Prisma Query**:
```typescript
// Find student by email or username
const student = await prisma.student.findFirst({
  where: {
    OR: [
      email ? { email } : {},
      username ? { username } : {}
    ]
  },
  include: { city: true, batch: true }
});
```

**Response** (200):
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 31,
    "name": "Test Student",
    "email": "test@student.com",
    "username": "teststudent",
    "cityId": 1,
    "cityName": "Bangalore",
    "batchId": 11,
    "batchName": "SOT",
    "batchSlug": "bangalore-sot-2024"
  }
}
```

---

#### POST /api/auth/student/logout
**Purpose**: Logout student and invalidate refresh token

**Prisma Query**:
```typescript
// Clear refresh token from database
await prisma.student.update({
  where: { id: studentId },
  data: { refresh_token: null }
});
```

**Response** (200):
```json
{
  "message": "Student logout successful"
}
```

---

### Student Data Endpoints

#### GET /api/students/topics
**Purpose**: Get all topics with batch-specific progress

**Middleware**: `verifyToken → isStudent → extractStudentInfo`

**Prisma Query**:
```typescript
const topics = await prisma.topic.findMany({
  include: {
    classes: {
      where: { batch_id: batchId },
      include: {
        questionVisibility: {
          include: {
            question: { select: { id: true, topic_id: true }}
          }
        }
      }
    }
  },
  orderBy: { created_at: 'asc' }
});

// Get student progress
const studentProgress = await prisma.studentProgress.findMany({
  where: {
    student_id: studentId,
    question: { topic_id: { in: topicIds } }
  },
  include: { question: { select: { topic_id: true }}}
});
```

**Response** (200):
```json
[
  {
    "id": 50,
    "topic_name": "Intro to Data Structure / Algorithms / Optimisation",
    "slug": "intro-to-data-structure-/-algorithms-/-optimisation",
    "batchSpecificData": {
      "totalClasses": 0,
      "totalQuestions": 0,
      "solvedQuestions": 0
    }
  },
  {
    "id": 51,
    "topic_name": "Array Basics",
    "slug": "array-basics",
    "batchSpecificData": {
      "totalClasses": 2,
      "totalQuestions": 11,
      "solvedQuestions": 0
    }
  }
]
```

---

#### GET /api/students/topics/{topicSlug}
**Purpose**: Get topic overview with classes summary

**Middleware**: `verifyToken → isStudent → extractStudentInfo`

**Prisma Query**:
```typescript
const topic = await prisma.topic.findFirst({
  where: { slug: topicSlug },
  include: {
    classes: {
      where: { batch_id: batchId },
      include: {
        questionVisibility: {
          include: { question: { select: { id: true }}}
        }
      },
      orderBy: { created_at: 'asc' }
    }
  }
});
```

**Response** (200):
```json
{
  "id": 51,
  "topic_name": "Array Basics",
  "slug": "array-basics",
  "description": null,
  "classes": [
    {
      "id": 1,
      "class_name": "",
      "slug": "",
      "duration_minutes": null,
      "description": null,
      "totalQuestions": 4,
      "solvedQuestions": 0
    }
  ],
  "overallProgress": {
    "totalClasses": 2,
    "totalQuestions": 11,
    "solvedQuestions": 0
  }
}
```

---

#### GET /api/students/topics/{topicSlug}/classes/{classSlug}
**Purpose**: Get class details with full questions and progress

**Middleware**: `verifyToken → isStudent → extractStudentInfo`

**Prisma Query**:
```typescript
const classData = await prisma.class.findFirst({
  where: {
    slug: classSlug,
    batch_id: batchId,
    topic: { slug: topicSlug }
  },
  include: {
    topic: { select: { id: true, topic_name: true, slug: true }},
    questionVisibility: {
      include: {
        question: {
          include: {
            topic: { select: { id: true, topic_name: true, slug: true }}
          }
        }
      }
    }
  }
});
```

**Response** (200):
```json
{
  "id": 1,
  "className": "",
  "durationMinutes": null,
  "description": null,
  "topic": {
    "id": 51,
    "topicName": "Array Basics",
    "slug": "array-basics"
  },
  "questions": [
    {
      "id": 1,
      "questionName": "",
      "questionLink": "",
      "platform": "GFG",
      "level": "EASY",
      "type": "PRACTICE",
      "isSolved": false,
      "solvedAt": null
    }
  ]
}
```

---

#### GET /api/students/addedQuestions
**Purpose**: Get all questions with filters and solved status

**Middleware**: `verifyToken → isStudent → extractStudentInfo`

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `search`: Search by question name
- `topic`: Filter by topic slug
- `level`: Filter by difficulty (EASY|MEDIUM|HARD)
- `platform`: Filter by platform (LEETCODE|GFG|CODEFORCES|INTERVIEW_BIT)
- `type`: Filter by type (PRACTICE|THEORY)
- `solved`: Filter by solved status (true|false)

**Prisma Query**:
```typescript
// Complex query with multiple filters and joins
const questions = await prisma.questionVisibility.findMany({
  where: {
    class: { batch_id: batchId },
    question: {
      AND: [
        search ? { question_name: { contains: search, mode: 'insensitive' }} : {},
        topic ? { topic: { slug: topic }} : {},
        level ? { level: level } : {},
        platform ? { platform: platform } : {},
        type ? { type: type } : {}
      ]
    }
  },
  include: {
    question: {
      include: {
        topic: { select: { topic_name: true, slug: true }}
      }
    }
  },
  skip: (page - 1) * limit,
  take: limit
});
```

**Response** (200):
```json
{
  "questions": [
    {
      "id": 1,
      "questionName": "Two Sum",
      "questionLink": "https://leetcode.com/problems/two-sum/",
      "platform": "LEETCODE",
      "level": "EASY",
      "type": "PRACTICE",
      "isSolved": false,
      "solvedAt": null,
      "topic": {
        "topicName": "Array Basics",
        "slug": "array-basics"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalQuestions": 100,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Database Schema

### Student Model
```prisma
model Student {
  id                  Int               @id @default(autoincrement())
  name                String            @db.VarChar(100)
  email               String            @unique @db.VarChar(150)
  username            String            @unique @db.VarChar(100)
  password_hash       String?
  google_id           String?           @unique @db.VarChar(100)
  enrollment_id       String?           @unique @db.VarChar(100)
  city_id             Int?
  batch_id            Int?
  leetcode_id         String?           @db.VarChar(100)
  gfg_id              String?           @db.VarChar(100)
  created_at          DateTime          @default(now())
  updated_at          DateTime          @updatedAt
  provider            String            @default("google")
  refresh_token       String?
  gfg_total_solved    Int               @default(0)
  last_synced_at      DateTime?
  lc_total_solved     Int               @default(0)
  
  // Relations
  city                City?             @relation(fields: [city_id], references: [id])
  batch               Batch?            @relation(fields: [batch_id], references: [id])
  progress            StudentProgress[]
  bookmarks           Bookmark[]
  leaderboards        Leaderboard?
}
```

### Key Related Models
```prisma
model Batch {
  id          Int       @id @default(autoincrement())
  batch_name  String    @db.VarChar(100)
  slug        String    @unique @db.VarChar(100)
  year        Int
  city_id     Int
  created_at  DateTime  @default(now())
  updated_at  DateTime  @updatedAt
  
  // Relations
  city        City      @relation(fields: [city_id], references: [id])
  students    Student[]
  classes     Class[]
}

model StudentProgress {
  id             Int       @id @default(autoincrement())
  student_id     Int
  question_id    Int
  solved_at      DateTime @default(now())
  
  // Relations
  student        Student   @relation(fields: [student_id], references: [id])
  question       Question  @relation(fields: [question_id], references: [id])
}
```

---

## Error Handling

### Common Error Responses

#### Authentication Errors (401/403)
```json
{
  "error": "No token provided"
}
```
```json
{
  "error": "Invalid token"
}
```
```json
{
  "error": "Access denied. Students only."
}
```

#### Validation Errors (400)
```json
{
  "error": "Email and password are required"
}
```
```json
{
  "error": "Student authentication required"
}
```

#### Not Found Errors (404/500)
```json
{
  "error": "Topic not found"
}
```
```json
{
  "error": "Class not found"
}
```

---

## Usage Examples

### Complete Authentication Flow

```bash
# 1. Register student
curl -X POST http://localhost:5000/api/auth/student/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "username": "johndoe",
    "password": "password123",
    "batch_id": 11,
    "enrollment_id": "ENR001",
    "leetcode_id": "leetcode123",
    "gfg_id": "gfg123"
  }'

# 2. Login
curl -X POST http://localhost:5000/api/auth/student/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'

# 3. Use token to access protected endpoints
curl -X GET http://localhost:5000/api/students/topics \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Advanced Query Examples

```bash
# Get questions with filters
curl -X GET "http://localhost:5000/api/students/addedQuestions?page=1&limit=10&platform=LEETCODE&level=EASY&solved=false" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get specific class details
curl -X GET http://localhost:5000/api/students/topics/subarray/classes/class-1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Security Features

1. **JWT Authentication**: Stateless tokens with expiration
2. **Role-Based Access**: Student-only endpoints
3. **Batch Isolation**: Students see only their batch data
4. **Password Hashing**: bcryptjs for secure password storage
5. **Token Invalidation**: Refresh tokens cleared on logout
6. **Input Validation**: Comprehensive request validation

---

## Performance Considerations

1. **Database Indexing**: Optimized queries with proper indexes
2. **Eager Loading**: Includes related data to prevent N+1 queries
3. **Pagination**: Large datasets use pagination
4. **Caching**: JWT tokens cached in memory for verification
5. **Connection Pooling**: Prisma manages database connections efficiently

---

## Troubleshooting

### Common Issues

1. **"Student authentication required"**: Check middleware chain and token extraction
2. **"Class not found"**: Verify topic and class slugs exist in database
3. **"Invalid token"**: Check token expiration and JWT secret
4. **"Access denied"**: Verify user role and middleware configuration

### Debug Tips

1. Check server logs for middleware execution order
2. Verify Prisma queries in database
3. Test with valid student credentials
4. Check batch and city assignments in database

---

*Last Updated: March 2026*
