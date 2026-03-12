# SuperAdmin Module Documentation

## Overview

The **SuperAdmin module** manages the entire platform's structural configuration.
It allows the highest level user (SuperAdmin) to control **Admins, Cities, Batches, and overall platform statistics**.

SuperAdmin ensures that the system is properly structured before teachers/admins begin managing students and questions.

### Responsibilities of SuperAdmin

* Manage **Admins / Teachers**
* Manage **Cities**
* Manage **Batches**
* Monitor **platform statistics**

In future updates, the system will also support **Intern Management**.

---

# 1. Admin / Teacher Management

SuperAdmin manages all admins (teachers) in the system.

Admins are responsible for managing:

* Students
* Questions
* Leaderboards

However, admins only see the **data that belongs to their assigned City and Batch**.

### Supported Operations

* Create Admin
* Update Admin
* Delete Admin
* Get All Admins
* Search Admins
* Filter Admins
* Pagination Support

---

# Create Admin

When creating an admin, the following details are required.

## Required Fields

| Field    | Description                     |
| -------- | ------------------------------- |
| name     | Name of the admin               |
| email    | Admin login email               |
| password | Admin login password            |
| role     | Role of admin (TEACHER / ADMIN) |
| batch_id | Batch assigned to the admin     |

---

## Why City and Batch are Assigned

Each admin is assigned a **City and Batch** so that when they log into the system:

* Students list
* Questions
* Leaderboard

are automatically filtered based on their assigned **City and Batch**.

This ensures that admins only interact with **data relevant to their assigned classroom or location**.

---

## Frontend Flow for Admin Creation

The frontend must enforce the following sequence when creating an admin.

1. Select **Year**
2. Select **City**
3. Fetch **Batches based on selected City + Year**
4. Display only those batches
5. Select the batch
6. Submit the form

This filtering logic is handled **entirely on the frontend side**.

---

## API Endpoint

```
POST /superadmin/admins
```

### Request Body

```json
{
  "name": "ayush test admin",
  "email": "ayushtest@email.com",
  "password": "123456",
  "role": "TEACHER",
  "batch_id": 4
}
```

### Response Body

```json
{
  "success": true,
  "message": "Admin created successfully",
  "data": {
    "id": 10,
    "name": "ayush test admin",
    "email": "ayushtest@email.com",
    "role": "TEACHER",
    "city_id": 1,
    "batch_id": 4,
    "created_at": "2026-03-12T11:37:22.951Z",
    "updated_at": "2026-03-12T11:37:22.951Z",
    "refresh_token": null,
    "city": {
      "id": 1,
      "city_name": "Bangalore"
    },
    "batch": {
      "id": 4,
      "batch_name": "SOT"
    }
  }
}
```

---

# Update Admin

SuperAdmin can update the **City, Batch, and Year assignment** of an admin.

However, the following fields **cannot be changed**:

* Name
* Email

These are treated as **identity fields**.

### API Endpoint

```
PATCH /superadmin/admins/:id
```

### Updatable Fields

* City
* Batch
* Year

---

# Delete Admin

SuperAdmin can remove an admin completely from the system.

### API Endpoint

```
DELETE /superadmin/admins/:id
```

### Response

```json
{
  "message": "Admin deleted successfully"
}
```

---

# Get All Admins

Returns the list of all admins along with their assigned **City and Batch information**.

### Supported Features

Frontend can use this endpoint with:

* Pagination
* Offset
* Search
* Filters

---

## Available Filters

| Filter | Description            |
| ------ | ---------------------- |
| city   | Filter admins by city  |
| batch  | Filter admins by batch |
| role   | Filter admins by role  |

---

## Search Fields

Search can be performed on:

* name
* email

---

### API Endpoint

```
GET /superadmin/admins
```

### Response Example

```json
{
  "success": true,
  "data": [
    {
      "id": 4,
      "name": "Satya Sai",
      "email": "satya@example.com",
      "role": "TEACHER",
      "created_at": "2026-03-11T18:17:15.923Z",
      "updated_at": "2026-03-12T11:08:48.073Z",
      "city": {
        "id": 1,
        "city_name": "Bangalore"
      },
      "batch": {
        "id": 4,
        "batch_name": "SOT"
      }
    }
  ]
}
```

---

# 2. City Management

SuperAdmin can create, view, search, and delete cities.

Cities represent **physical locations or centers** where batches and students exist.

Each city also provides aggregated information such as:

* Total batches
* Total students

---

## Get All Cities

### API Endpoint

```
GET /superadmin/cities
```

### Response

```json
[
  {
    "id": 5,
    "city_name": "Russia",
    "created_at": "2026-03-12T11:12:38.698Z",
    "total_batches": 0,
    "total_students": 0
  },
  {
    "id": 4,
    "city_name": "Noida",
    "created_at": "2026-03-11T18:06:25.963Z",
    "total_batches": 2,
    "total_students": 29
  },
  {
    "id": 1,
    "city_name": "Bangalore",
    "created_at": "2026-03-11T18:05:43.696Z",
    "total_batches": 2,
    "total_students": 27
  }
]
```

---

### Features

Frontend can:

* Search cities by **city name**
* Display **batch count**
* Display **student count**

---

## Create City

### API Endpoint

```
POST /superadmin/cities
```

### Request Body

```json
{
  "city_name": "Pune"
}
```

### Response

```json
{
  "message": "City created successfully",
  "city": {
    "id": 5,
    "city_name": "Pune",
    "created_at": "2026-03-12T11:12:38.698Z"
  }
}
```

---

## Delete City

Deletes a particular city.

### API Endpoint

```
DELETE /superadmin/cities/:id
```

### Response

```json
{
  "message": "City deleted successfully"
}
```

---

# 3. Batch Management

Batches represent **groups of students belonging to a particular city and year**.

Each batch belongs to:

* A specific **City**
* A specific **Year**

---

## Get All Batches

### API Endpoint

```
GET /superadmin/batches
```

### Supported Features

Frontend can filter batches using:

* City name
* Year
* Pagination
* Offset

---

### Response Example

```json
{
  "id": 11,
  "batch_name": "sample Batch",
  "year": 2024,
  "city_id": 1,
  "created_at": "2026-03-12T11:29:42.730Z",
  "city": {
    "id": 1,
    "city_name": "Bangalore",
    "created_at": "2026-03-11T18:05:43.696Z"
  },
  "_count": {
    "students": 0,
    "classes": 0
  }
}
```

---

## Create Batch

Batch creation requires selecting a **City and Year**.

### Frontend Flow

1. Select **Year**
2. Select **City**
3. Enter **Batch Name**
4. Submit form

The batch will then be created for that specific **City + Year combination**.

---

### API Endpoint

```
POST /superadmin/batches
```

### Request Body

```json
{
  "batch_name": "sample Batch",
  "year": 2024,
  "city_id": 1
}
```

### Response

```json
{
  "message": "Batch created successfully",
  "batch": {
    "id": 11,
    "batch_name": "sample Batch",
    "year": 2024,
    "city_id": 1,
    "created_at": "2026-03-12T11:29:42.730Z"
  }
}
```

---

## Update Batch

SuperAdmin can update:

* Batch Name
* City
* Year

### API Endpoint

```
PATCH /superadmin/batches/:id
```

---

## Delete Batch

Deletes a batch from the system.

### API Endpoint

```
DELETE /superadmin/batches/:id
```

---

# 4. Stats Management System

This endpoint provides **overall system statistics**.

It is mainly used for **dashboard display** so SuperAdmin can quickly see platform metrics.

---

## API Endpoint

```
GET /superadmin/stats
```

### Response

```json
{
  "stats": {
    "totalCities": 5,
    "totalBatches": 8,
    "totalStudents": 105,
    "totalAdmins": 2,
    "totalQuestions": 741,
    "totalTopics": 48
  }
}
```

---

## Usage in Frontend

This endpoint is used to display **dashboard cards** such as:

* Total Cities
* Total Batches
* Total Students
* Total Admins
* Total Questions
* Total Topics

These metrics help SuperAdmin understand **overall platform scale and usage**.

---

# Summary

The SuperAdmin module acts as the **central management layer** of the platform.

It ensures proper control over:

* Organizational structure (Cities & Batches)
* Administrative access (Admins / Teachers)
* System insights (Stats)

This module guarantees that each admin works only with **relevant data from their assigned city and batch**, maintaining both **data isolation and system organization**.