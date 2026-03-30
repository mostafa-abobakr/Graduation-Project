# Staff Schedule System — Backend API & Implementation Guide

This document is a comprehensive guide for the Backend Developer. It outlines how the database should be structured, the exact API endpoints the React Frontend expects, and the core business logic needed to handle shifts.

---

## 🏛️ 1. Suggested Database Schema

To support this frontend seamlessly, you’ll need two main tables: **Employees** and **Shifts**.

### Table: `employees`
| Column Name   | Type         | Notes |
|--------------|-------------|-------|
| `id`         | Int (PK)    | Unique ID for the employee |
| `name`       | Varchar     | Full name (e.g., "Jane Doe") |
| `avatar`     | Varchar     | 2 letter initials (e.g., "JD") or an image URL |
| `role`       | Varchar     | "Server", "Chef", "Cashier", etc. |
| `status`     | Enum/String | `"active"`, `"on-leave"`, `"terminated"` |
| `target_hours`| Int        | Maximum or expected hours per week |
| `rest_id`    | Int (FK)    | Links to the Restaurant table |

### Table: `shifts`
| Column Name   | Type         | Notes |
|--------------|-------------|-------|
| `id`         | Int (PK)    | Unique ID for the shift |
| `emp_id`     | Int (FK)    | Links to `employees.id` |
| `date`       | Date        | The strict calendar date of the shift (YYYY-MM-DD) |
| `start_time` | Time/String | E.g., "09:00:00" or "9:00 am" |
| `end_time`   | Time/String | E.g., "17:00:00" or "5:00 pm" |
| `status`     | Enum/String | `"draft"` or `"published"` |
| `rest_id`    | Int (FK)    | Links to the Restaurant table |

---

## 🔌 2. API Endpoints Required

### A. Retrieve Employee Data
The UI uses this to populate the right-side "Employees" panel.

* **Endpoint:** `GET /api/restaurants/{restID}/staff`
* **Response Payload:**
```json
[
  {
    "id": 101, 
    "name": "Jane Doe", 
    "avatar": "JD", 
    "role": "Head Chef", 
    "status": "active", 
    "hours": 40 
  }
]
```
> **Backend Tip:** Do an inner join or a simple `WHERE rest_id = ? AND status != 'terminated'`.

### B. Retrieve Weekly / Daily Shifts
The schedule grid loads dynamically. The frontend will pass a `start_date` and `end_date` so you only query what the user is currently viewing.

* **Endpoint (Week View):** `GET /api/shifts?start_date=2026-03-01&end_date=2026-03-07&restID=2`
* **Endpoint (Day View):** `GET /api/shifts?start_date=2026-03-05&end_date=2026-03-05&restID=2`

> **Why are Week and Day View the same?**
> The UI switches dynamically between showing a 7-day calendar and a 1-day calendar. To prevent you from writing two duplicate block of `GET` endpoint logic, the frontend will simply send the exact same date for `start_date` and `end_date` when viewing a specific day.

* **Response Payload (Full realistic week example):**
```json
[
  {
    "id": "shift-101",
    "staffId": 101,
    "staffName": "Jane Doe",
    "date": "2026-03-01",
    "startTime": "9:00 am",
    "endTime": "5:00 pm",
    "confirmed": true
  },
  {
    "id": "shift-102",
    "staffId": 101,
    "staffName": "Jane Doe",
    "date": "2026-03-03",
    "startTime": "11:00 am",
    "endTime": "7:00 pm",
    "confirmed": true
  },
  {
    "id": "shift-103",
    "staffId": 102,
    "staffName": "John Smith",
    "date": "2026-03-01",
    "startTime": "8:00 am",
    "endTime": "2:00 pm",
    "confirmed": false
  },
  {
    "id": "shift-104",
    "staffId": 102,
    "staffName": "John Smith",
    "date": "2026-03-05",
    "startTime": "2:00 pm",
    "endTime": "9:00 pm",
    "confirmed": false
  },
  {
    "id": "shift-105",
    "staffId": 103,
    "staffName": "Sara Ali",
    "date": "2026-03-02",
    "startTime": "10:00 am",
    "endTime": "4:00 pm",
    "confirmed": true
  },
  {
    "id": "shift-106",
    "staffId": 103,
    "staffName": "Sara Ali",
    "date": "2026-03-04",
    "startTime": "12:00 pm",
    "endTime": "8:00 pm",
    "confirmed": true
  },
  {
    "id": "shift-107",
    "staffId": 103,
    "staffName": "Sara Ali",
    "date": "2026-03-06",
    "startTime": "9:00 am",
    "endTime": "5:00 pm",
    "confirmed": false
  },
  {
    "id": "shift-108",
    "staffId": 104,
    "staffName": "Ahmed Youssef",
    "date": "2026-03-07",
    "startTime": "3:00 pm",
    "endTime": "9:00 pm",
    "confirmed": true
  }
]
```

> **Reading the Data:**
> - `confirmed: true` → shift color shows a ✅ green checkmark in the UI (status is `"published"` in your DB)
> - `confirmed: false` → shift has no checkmark (status is `"draft"` in your DB)
> - Multiple shifts for the same employee across different dates is perfectly valid
> - Two employees can have shifts on the same date (the UI places them each in their day column)
> - An employee missing from a date simply means no shift card appears in that column

### C. Create / Assign a New Shift
Triggered when a manager clicks the `+` icon to add an employee to a shift.

* **Endpoint:** `POST /api/shifts`
* **Request Payload:**
```json
{
  "staffId": 101, 
  "date": "2026-03-05", 
  "startTime": "12:00 pm",
  "endTime": "8:00 pm",
  "restID": 2
}
```
> **Backend Logic Steps:**
> 1. Validate that the employee (`staffId`) exists and works at `restID`.
> 2. Validate that `startTime` is before `endTime`.
> 3. Save to the database with `status = "draft"`.
> 4. Return the ID of the newly created shift to the frontend.

### D. Publish Schedule (Finalize Week)
When the manager finishes building the schedule and hits the "Publish Schedule" button.

* **Endpoint:** `POST /api/schedules/publish`
* **Request Payload:**
```json
{
  "start_date": "2026-03-01",
  "end_date": "2026-03-07",
  "restaurant_id": 2
}
```
> **Backend Logic Steps:**
> 1. Run an `UPDATE` query: `UPDATE shifts SET status = 'published' WHERE rest_id = ? AND date >= ? AND date <= ? AND status = 'draft'`.
> 2. **Notifications (Optional but recommended):** Query all employees affected by this update and trigger an Email, SMS, or Push Notification saying: *"Your schedule for the week of March 1st has been published!"*

---

## 🚦 3. Critical Warnings & Edge Cases for Backend Devs

1. **Avoid UTC Timestamps for Dates (`YYYY-MM-DD`)**: 
   The frontend UI calendar relies strictly on exact date strings. Be extremely careful **not** to return ISO timestamps like `"2026-03-28T23:00:00.000Z"` for the `date` field. Depending on the user's browser timezone, Javascript might accidentally shift that backwards to `"2026-03-27"`. Always return pure local strings: `"2026-03-28"`.

2. **Frontend Dynamic Hashing (Colors)**:
   You do **not** need to store or calculate Tailwind color classes (like `bg-cyan-500`) in the database. The frontend contains a `getStaffColor(staffId)` helper function that automatically calculates reliable colors for each user dynamically.

3. **Hours Computation**:
   Currently, the React UI automatically totals up the number of shifts an employee has. If you want to be more advanced, you can calculate the exact time difference between `start_time` and `end_time` using SQL and send total `worked_hours` back in the `GET /api/restaurants/{restID}/staff` endpoint!
