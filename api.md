#  DSA Tracker API Documentation

> **Complete API documentation for frontend developers**  
> **Version**: 1.0.0 | **Last Updated**: Feb 2025

---

## 🔐 Authentication Setup

### Base URL
```
http://localhost:5000
```

### Authentication Headers
All protected routes require:
```http
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
Content-Type: application/json
```

### Token Flow
1. **Login** → Get `accessToken` + `refreshToken`
2. **Store** tokens securely in frontend
3. **Use `accessToken`** for all API requests
4. **Refresh** token when expired (if implemented)

---

## 🚀 AUTHENTICATION ROUTES (`/api/auth`)

### Student Registration
```http
POST /api/auth/student/register
```

**Request Body:**
```json
{
  "name": "Student Name",
  "email": "student@example.com", 
  "username": "student123",
  "password": "password123"
}
```

**Success Response (201):**
```json
{
  "message": "Student registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Student Name",
    "email": "student@example.com",
    "username": "student123"
  }
}
```

**Error Response (400):**
```json
{
  "error": "Email already exists"
}
```

---

### Student Login
```http
POST /api/auth/student/login
```

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Student Name",
    "email": "student@example.com",
    "username": "student123"
  }
}
```

---

### Admin Login (All Roles)
```http
POST /api/auth/admin/login
```

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Admin Name",
    "email": "admin@example.com",
    "username": "admin123",
    "role": "SUPERADMIN"
  }
}
```

---

## 👑 SUPERADMIN ROUTES (`/api/superadmin`)
**🔒 Access**: SuperAdmin only  
**🔐 Authentication**: Required

### Cities Management

#### Get All Cities
```http
GET /api/superadmin/cities
```

**Success Response (200):**
```json
{
  "cities": [
    {
      "id": 1,
      "city_name": "Mumbai",
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "city_name": "Pune", 
      "created_at": "2025-01-02T00:00:00.000Z",
      "updated_at": "2025-01-02T00:00:00.000Z"
    }
  ]
}
```

---

#### Create City
```http
POST /api/superadmin/cities
```

**Request Body:**
```json
{
  "city_name": "New City"
}
```

**Success Response (201):**
```json
{
  "message": "City created successfully",
  "city": {
    "id": 3,
    "city_name": "New City",
    "created_at": "2025-02-01T10:30:00.000Z",
    "updated_at": "2025-02-01T10:30:00.000Z"
  }
}
```

---

#### Update City
```http
PATCH /api/superadmin/cities/:id
```

**URL Parameters:**
- `id` (number) - City ID

**Request Body:**
```json
{
  "city_name": "Updated City Name"
}
```

**Success Response (200):**
```json
{
  "message": "City updated successfully",
  "city": {
    "id": 1,
    "city_name": "Updated City Name",
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-02-01T10:30:00.000Z"
  }
}
```

---

#### Delete City
```http
DELETE /api/superadmin/cities/:id
```

**URL Parameters:**
- `id` (number) - City ID

**Success Response (200):**
```json
{
  "message": "City deleted successfully"
}
```

---

### Batches Management

#### Get All Batches
```http
GET /api/superadmin/batches
```

**Success Response (200):**
```json
{
  "batches": [
    {
      "id": 1,
      "batch_name": "Batch A",
      "year": 2024,
      "city_id": 1,
      "slug": "batch-a",
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-01-01T00:00:00.000Z",
      "city": {
        "id": 1,
        "city_name": "Mumbai"
      }
    }
  ]
}
```

---

#### Create Batch
```http
POST /api/superadmin/batches
```

**Request Body:**
```json
{
  "batch_name": "New Batch",
  "year": 2024,
  "city_id": 1
}
```

**Success Response (201):**
```json
{
  "message": "Batch created successfully",
  "batch": {
    "id": 3,
    "batch_name": "New Batch",
    "year": 2024,
    "city_id": 1,
    "slug": "new-batch",
    "created_at": "2025-02-01T10:30:00.000Z",
    "updated_at": "2025-02-01T10:30:00.000Z"
  }
}
```

---

#### Update Batch
```http
PATCH /api/superadmin/batches/:id
```

**URL Parameters:**
- `id` (number) - Batch ID

**Request Body:**
```json
{
  "batch_name": "Updated Batch",
  "year": 2024,
  "city_id": 1
}
```

---

#### Delete Batch
```http
DELETE /api/superadmin/batches/:id
```

**URL Parameters:**
- `id` (number) - Batch ID

---

### Admin Management

#### Create Admin (Teacher/Intern)
```http
POST /api/superadmin/admins
```

**Request Body:**
```json
{
  "name": "Teacher Name",
  "email": "teacher@example.com",
  "username": "teacher123",
  "password": "password123",
  "role": "TEACHER"
}
```

**Success Response (201):**
```json
{
  "message": "Admin registered successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "name": "Teacher Name",
    "email": "teacher@example.com",
    "username": "teacher123",
    "role": "TEACHER"
  }
}
```

---

### System Statistics

#### Get System Stats
```http
GET /api/superadmin/stats
```

**Success Response (200):**
```json
{
  "stats": {
    "totalCities": 5,
    "totalBatches": 12,
    "totalStudents": 150,
    "totalAdmins": 8,
    "totalQuestions": 500,
    "totalTopics": 25
  }
}
```

---

## 🎓 ADMIN ROUTES (`/api/admin`)
**🔒 Access**: All Admin Roles (SuperAdmin, Teacher, Intern)  
**🔐 Authentication**: Required

### Global Routes (No Batch Context)

#### Get All Cities
```http
GET /api/admin/cities
```

**Success Response (200):**
```json
{
  "cities": [
    {
      "id": 1,
      "city_name": "Mumbai",
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

---

#### Get All Batches
```http
GET /api/admin/batches
```

**Success Response (200):**
```json
{
  "batches": [
    {
      "id": 1,
      "batch_name": "Batch A",
      "year": 2024,
      "city_id": 1,
      "slug": "batch-a",
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-01-01T00:00:00.000Z",
      "city": {
        "id": 1,
        "city_name": "Mumbai"
      }
    }
  ]
}
```

---

#### Create Batch
```http
POST /api/admin/batches
```

**Request Body:**
```json
{
  "batch_name": "New Batch",
  "year": 2024,
  "city_id": 1
}
```

---

### Topics Management

#### Get All Topics
```http
GET /api/admin/topics
```

**Success Response (200):**
```json
{
  "topics": [
    {
      "id": 1,
      "topic_name": "Arrays",
      "slug": "arrays",
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

---

#### Create Topic
```http
POST /api/admin/topics
```
**🔒 Access**: Teacher or SuperAdmin only

**Request Body:**
```json
{
  "topic_name": "New Topic"
}
```

**Success Response (201):**
```json
{
  "message": "Topic created successfully",
  "topic": {
    "id": 3,
    "topic_name": "New Topic",
    "slug": "new-topic",
    "created_at": "2025-02-01T10:30:00.000Z",
    "updated_at": "2025-02-01T10:30:00.000Z"
  }
}
```
# 📚 Bulk Upload Topics API

## 🔹 Endpoint

POST `/api/admin/topics/bulk`

---

## 🔐 Authorization

This route is protected.

Required Header:

Authorization: Bearer <JWT_TOKEN>

Only **Admin / Teacher or Above** roles are allowed.

---

## 📥 Request Body

Content-Type: `application/json`

```json
{
  "topics": [
    "Arrays",
    "Strings",
    "Linked List",
    "Stack",
    "Queue",
    "Trees"
  ]
}
---

### Questions Management

#### Get All Questions
```http
GET /api/admin/questions
```

**Query Parameters (Optional):**
- `topic_id` (number) - Filter by topic
- `level` (string) - Filter by level (EASY, MEDIUM, HARD)
- `platform` (string) - Filter by platform (LEETCODE, GFG, OTHER)

**Success Response (200):**
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
      "topic_id": 1,
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-01-01T00:00:00.000Z",
      "topic": {
        "id": 1,
        "topic_name": "Arrays",
        "slug": "arrays"
      }
    }
  ]
}
```

---

### Workspace Routes (Batch Context)
**📝 All routes below require**: `batchSlug` parameter

#### Get Topics for Batch
```http
GET /api/admin/:batchSlug/topics
```

**URL Parameters:**
- `batchSlug` (string) - Batch slug

**Success Response (200):**
```json
{
  "topics": [
    {
      "id": 1,
      "topic_name": "Arrays",
      "slug": "arrays",
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

---

#### Get Classes by Topic
```http
GET /api/admin/:batchSlug/topics/:topicSlug/classes
```

**URL Parameters:**
- `batchSlug` (string) - Batch slug
- `topicSlug` (string) - Topic slug

**Success Response (200):**
```json
{
  "classes": [
    {
      "id": 1,
      "class_number": "Class 1",
      "class_date": "2025-02-01T10:00:00.000Z",
      "pdf_url": "https://example.com/class1.pdf",
      "description": "Introduction to Arrays",
      "duration_minutes": 60,
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-01-01T00:00:00.000Z",
      "topic": {
        "id": 1,
        "topic_name": "Arrays",
        "slug": "arrays"
      }
    }
  ]
}
```

---

#### Create Class
```http
POST /api/admin/:batchSlug/topics/:topicSlug/classes
```
**🔒 Access**: Teacher or SuperAdmin only

**URL Parameters:**
- `batchSlug` (string) - Batch slug
- `topicSlug` (string) - Topic slug

**Request Body:**
```json
{
  "class_name": "Class 3",
  "class_date": "2025-02-15T10:00:00.000Z",
  "pdf_url": "https://example.com/class3.pdf",
  "description": "Arrays Problem Solving",
  "duration_minutes": 75
}
```

**Success Response (201):**
```json
{
  "message": "Class created successfully",
  "class": {
    "id": 3,
    "class_number": "Class 3",
    "class_date": "2025-02-15T10:00:00.000Z",
    "pdf_url": "https://example.com/class3.pdf",
    "description": "Arrays Problem Solving",
    "duration_minutes": 75,
    "topic_id": 1,
    "batch_id": 1,
    "created_at": "2025-02-01T10:30:00.000Z",
    "updated_at": "2025-02-01T10:30:00.000Z"
  }
}
```

---

#### Get Class Details
```http
GET /api/admin/:batchSlug/classes/:classSlug
```

**URL Parameters:**
- `batchSlug` (string) - Batch slug
- `classSlug` (string) - Class slug

**Success Response (200):**
```json
{
  "class": {
    "id": 1,
    "class_number": "Class 1",
    "class_date": "2025-02-01T10:00:00.000Z",
    "pdf_url": "https://example.com/class1.pdf",
    "description": "Introduction to Arrays",
    "duration_minutes": 60,
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T00:00:00.000Z",
    "topic": {
      "id": 1,
      "topic_name": "Arrays",
      "slug": "arrays"
    },
    "questions": [
      {
        "id": 1,
        "question_name": "Two Sum",
        "question_link": "https://leetcode.com/problems/two-sum/",
        "platform": "LEETCODE",
        "level": "EASY",
        "type": "HOMEWORK"
      }
    ]
  }
}
```

---

#### Assign Questions to Class
```http
POST /api/admin/:batchSlug/classes/:classSlug/questions
```
**🔒 Access**: Teacher or SuperAdmin only

**URL Parameters:**
- `batchSlug` (string) - Batch slug
- `classSlug` (string) - Class slug

**Request Body:**
```json
{
  "question_ids": [1, 2, 3, 4, 5]
}
```

**Success Response (200):**
```json
{
  "message": "Questions assigned successfully",
  "assigned_count": 5
}
```

---

#### Remove Question from Class
```http
DELETE /api/admin/:batchSlug/classes/:classSlug/questions/:questionId
```
**🔒 Access**: Teacher or SuperAdmin only

**URL Parameters:**
- `batchSlug` (string) - Batch slug
- `classSlug` (string) - Class slug
- `questionId` (number) - Question ID

**Success Response (200):**
```json
{
  "message": "Question removed from class successfully"
}
```

---

## 👨‍🎓 STUDENT ROUTES (`/api/student`)
**🔒 Access**: Students only  
**🔐 Authentication**: Required

### Analytics

#### Get Weekly Analytics
```http
GET /api/student/analytics/weekly
```

**Success Response (200):**
```json
{
  "weekly_progress": {
    "2025-01-28": 3,
    "2025-01-29": 2,
    "2025-01-30": 4,
    "2025-01-31": 1,
    "2025-02-01": 2,
    "2025-02-02": 3,
    "2025-02-03": 1
  }
}
```

---

#### Get Monthly Analytics
```http
GET /api/student/analytics/monthly
```

**Success Response (200):**
```json
{
  "monthly_progress": {
    "2025-01-01": 2,
    "2025-01-02": 1,
    "2025-01-03": 3,
    "...": "30 days of data...",
    "2025-01-31": 1
  }
}
```

---

### Classes

#### Get Upcoming Classes
```http
GET /api/student/classes/upcoming
```

**Success Response (200):**
```json
{
  "upcoming_classes": [
    {
      "id": 1,
      "class_number": "Class 1",
      "class_date": "2025-02-05T10:00:00.000Z",
      "pdf_url": "https://example.com/class1.pdf",
      "topic": {
        "id": 1,
        "topic_name": "Arrays"
      },
      "_count": {
        "questionVisibility": 10
      }
    }
  ]
}
```

---

## 🎯 Error Responses

### Standard Error Format
```json
{
  "error": "Error message here"
}
```

### Common HTTP Status Codes
- `200` - ✅ Success
- `201` - ✅ Created successfully  
- `400` - ❌ Bad request (missing/invalid data)
- `401` - ❌ Unauthorized (invalid/missing token)
- `403` - ❌ Forbidden (insufficient permissions)
- `404` - ❌ Not found
- `500` - ❌ Internal server error

### Error Examples

#### Authentication Error
```json
{
  "error": "Invalid token"
}
```

#### Permission Error
```json
{
  "error": "Insufficient permissions"
}
```

#### Validation Error
```json
{
  "error": "City name is required"
}
```

---

## 🔑 Role Hierarchy & Permissions

### Role Access Levels

| Role | Cities | Batches | Topics | Questions | Classes | Students |
|------|--------|---------|--------|-----------|---------|----------|
| **SUPERADMIN** | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ View |
| **TEACHER** | ❌ | ❌ | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ View |
| **INTERN** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ View |
| **STUDENT** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ Own |

**Legend:**
- ✅ CRUD = Create, Read, Update, Delete
- ✅ View = Read-only access
- ❌ = No access

---

## 📱 Frontend Implementation Guide

### Quick Start Steps

1. **Authentication Setup**
   ```javascript
   // Login and store tokens
   const login = async (email, password) => {
     const response = await fetch('/api/auth/admin/login', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ email, password })
     });
     const data = await response.json();
     localStorage.setItem('accessToken', data.accessToken);
     return data;
   };
   ```

2. **API Client Setup**
   ```javascript
   const apiClient = {
     get: (url) => fetch(url, {
       headers: {
         'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
         'Content-Type': 'application/json'
       }
     }),
     post: (url, body) => fetch(url, {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
         'Content-Type': 'application/json'
       },
       body: JSON.stringify(body)
     })
   };
   ```

3. **Error Handling**
   ```javascript
   const handleApiError = (response) => {
     if (response.status === 401) {
       // Redirect to login
       window.location.href = '/login';
     } else if (response.status === 403) {
       // Show permission error
       alert('You don\'t have permission for this action');
     }
   };
   ```

### Required UI Components

1. **Authentication Forms**
   - Login form (email/password)
   - Registration form (students)

2. **Admin Dashboard**
   - Cities management (CRUD)
   - Batches management (CRUD)
   - Topics management (CRUD)
   - Questions management
   - Class creation and assignment

3. **Student Dashboard**
   - Analytics charts
   - Upcoming classes
   - Progress tracking

### State Management Tips

- Store user info and tokens securely
- Implement automatic token refresh
- Cache frequently accessed data
- Handle loading states properly

---

## 🚀 Usage Examples

### SuperAdmin Creates City
```bash
curl -X POST http://localhost:5000/api/superadmin/cities \
  -H "Authorization: Bearer SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"city_name": "Pune"}'
```

### Teacher Creates Topic
```bash
curl -X POST http://localhost:5000/api/admin/topics \
  -H "Authorization: Bearer TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"topic_name": "Dynamic Programming"}'
```

### Teacher Creates Class
```bash
curl -X POST http://localhost:5000/api/admin/batch-a/topics/arrays/classes \
  -H "Authorization: Bearer TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "class_number": "Class 1",
    "class_date": "2025-02-01T10:00:00.000Z",
    "pdf_url": "https://example.com/class1.pdf",
    "description": "Introduction to Arrays",
    "duration_minutes": 60
  }'
```

### Assign Questions to Class
```bash
curl -X POST http://localhost:5000/api/admin/batch-a/classes/class-1/questions \
  -H "Authorization: Bearer TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question_ids": [1, 2, 3, 4, 5]}'
```

---

## 📋 Implementation Checklist

### ✅ Completed Features
- [x] Authentication (Login/Registration)
- [x] SuperAdmin: Cities CRUD
- [x] SuperAdmin: Batches CRUD  
- [x] SuperAdmin: Admin creation
- [x] Admin: Topics CRUD
- [x] Admin: Questions viewing
- [x] Admin: Classes CRUD
- [x] Admin: Question assignment
- [x] Student: Basic analytics
- [x] Student: Upcoming classes

### 🚧 Coming Soon (Not Implemented)
- [ ] Student profile management
- [ ] Student question solving
- [ ] Student progress tracking
- [ ] Leaderboard system
- [ ] Bookmark functionality
- [ ] Advanced analytics
- [ ] Search functionality

---

*📖 This documentation covers all currently implemented API endpoints. For any questions or issues, contact the backend team.*

**Last Updated**: February 2025  
**API Version**: 1.0.0