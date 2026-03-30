# Staff Page — Backend API & Implementation Guide

This document is a complete reference for backend developers to understand what data the `StaffPage.jsx` requires, with two distinct views depending on the logged-in user's role.

---

## 👤 Role-Based Views

The page renders **two completely different layouts** based on `user.role`:

| Role       | What they see |
|------------|--------------|
| `admin`    | Platform-wide overview — Staff counts & ratings aggregated **across all restaurants** |
| `manager`  | Single-restaurant view — A detailed table of their **own restaurant's employees** |

> The frontend checks `isAdmin` from the `AuthContext`. Your JWT or session must expose the user's role so the frontend can determine which view to render.

---

## 🏛️ 1. Suggested Database Tables

### Table: `employees`
| Column         | Type         | Notes |
|----------------|-------------|-------|
| `id`           | Int (PK)    | Unique employee ID |
| `name`         | Varchar     | Full name (e.g., `"Maria Garcia"`) |
| `avatar`       | Varchar     | 2-letter initials (e.g., `"MG"`) — used as UI fallback |
| `role`         | Varchar     | Job title: `"Head Chef"`, `"Server"`, `"Bartender"`, etc. |
| `shift`        | Varchar     | `"Morning"` or `"Evening"` |
| `status`       | Enum/String | `"active"` or `"on-leave"` |
| `hours_per_week` | Int       | Actual hours worked this week |
| `rating`       | Float       | Performance rating out of 5.0 |
| `rest_id`      | Int (FK)    | Links to the restaurant this employee belongs to |

### Table: `restaurants`
| Column     | Type         | Notes |
|------------|-------------|-------|
| `id`       | Int (PK)    | Unique restaurant ID |
| `name`     | Varchar     | Restaurant name (e.g., `"ZeroWaste Downtown"`) |
| `city`     | Varchar     | City location |
| `manager`  | Varchar     | Manager's full name |
| `status`   | Enum/String | `"active"` or `"inactive"` |

---

## 🔌 2. Required API Endpoints

---

### A. Manager View — Get All Employees for My Restaurant
Used to populate the main employee table for a **Manager**.

**Endpoint:** `GET /api/restaurants/{restID}/staff`
**Auth:** Requires a valid manager session token.

**Response Payload (Single Object):**
```json
{
  "summary": {
    "total_staff": 8,
    "active_today": 7,
    "total_hours_this_week": 251,
    "avg_rating": 4.6
  },
  "staff": [
    {
      "id": 1,
      "name": "Maria Garcia",
      "avatar": "MG",
      "role": "Head Chef",
      "shift": "Morning",
      "status": "active",
      "hours": 42,
      "rating": 4.9
    },
    {
      "id": 2,
      "name": "James Wilson",
      "avatar": "JW",
      "role": "Sous Chef",
      "shift": "Morning",
      "status": "active",
      "hours": 38,
      "rating": 4.7
    },
    {
      "id": 3,
      "name": "Aisha Patel",
      "avatar": "AP",
      "role": "Line Cook",
      "shift": "Evening",
      "status": "active",
      "hours": 36,
      "rating": 4.5
    },
    {
      "id": 4,
      "name": "Carlos Rodriguez",
      "avatar": "CR",
      "role": "Server",
      "shift": "Morning",
      "status": "active",
      "hours": 32,
      "rating": 4.8
    },
    {
      "id": 5,
      "name": "Emma Thompson",
      "avatar": "ET",
      "role": "Server",
      "shift": "Evening",
      "status": "on-leave",
      "hours": 0,
      "rating": 4.6
    },
    {
      "id": 6,
      "name": "David Kim",
      "avatar": "DK",
      "role": "Bartender",
      "shift": "Evening",
      "status": "active",
      "hours": 35,
      "rating": 4.4
    },
    {
      "id": 7,
      "name": "Sophie Brown",
      "avatar": "SB",
      "role": "Host",
      "shift": "Morning",
      "status": "active",
      "hours": 28,
      "rating": 4.9
    },
    {
      "id": 8,
      "name": "Omar Hassan",
      "avatar": "OH",
      "role": "Dishwasher",
      "shift": "Evening",
      "status": "active",
      "hours": 40,
      "rating": 4.3
    }
  ]
}
```

> **How the frontend reads this object:**
> - **Total Staff card** → `data.summary.total_staff`
> - **Active Today card** → `data.summary.active_today`
> - **Hours This Week card** → `data.summary.total_hours_this_week`
> - **Avg. Rating card** → `data.summary.avg_rating`
> - **Employee table rows** → `data.staff` array

> **How the backend should compute `summary`:**
> ```sql
> SELECT
>   COUNT(*)                                         AS total_staff,
>   COUNT(*) FILTER (WHERE status = 'active')        AS active_today,
>   COALESCE(SUM(hours_per_week), 0)                 AS total_hours_this_week,
>   ROUND(AVG(rating)::numeric, 1)                   AS avg_rating
> FROM employees
> WHERE rest_id = ?
> ```

---

### B. Admin View — Get All Restaurants with Staff Stats
Used to populate the platform-wide table for an **Admin**.

**Endpoint:** `GET /api/admin/restaurants/stats`
**Auth:** Requires a valid admin session token.

**Response Payload (Single Object):**
```json
{
  "summary": {
    "total_staff_platform": 35,
    "active_locations": 3,
    "avg_rating": 4.5
  },
  "restaurants": [
    {
      "id": 1,
      "name": "ZeroWaste Downtown",
      "city": "Cairo",
      "manager": "Ahmed Hassan",
      "status": "active",
      "staff": 12,
      "rating": 4.7
    },
    {
      "id": 2,
      "name": "ZeroWaste Marina",
      "city": "Alexandria",
      "manager": "Fatima Ali",
      "status": "active",
      "staff": 9,
      "rating": 4.5
    },
    {
      "id": 3,
      "name": "ZeroWaste Mall",
      "city": "Giza",
      "manager": "Omar Khalil",
      "status": "active",
      "staff": 14,
      "rating": 4.8
    },
    {
      "id": 4,
      "name": "ZeroWaste Airport",
      "city": "Cairo",
      "manager": "Sara Mohamed",
      "status": "inactive",
      "staff": 0,
      "rating": 3.9
    }
  ]
}
```

> **How the frontend reads this object:**
> - **Total Staff (Platform) card** → `data.summary.total_staff_platform`
> - **Active Locations card** → `data.summary.active_locations`
> - **Avg. Rating card** → `data.summary.avg_rating`
> - **Restaurants table rows** → `data.restaurants` array

> **How the backend should compute `summary`:**
> ```sql
> SELECT
>   SUM(e_count)                                          AS total_staff_platform,
>   COUNT(*) FILTER (WHERE r.status = 'active')           AS active_locations,
>   ROUND(AVG(r.rating)::numeric, 1)                      AS avg_rating
> FROM restaurants r
> LEFT JOIN (SELECT rest_id, COUNT(*) AS e_count FROM employees GROUP BY rest_id) e
>   ON e.rest_id = r.id
> ```

---

## 🗂️ 3. Data Field Reference

| Field      | Comes from | How the UI uses it |
|------------|-----------|-------------------|
| `name`     | employees  | Displayed as full name in the employee table row |
| `avatar`   | employees  | Shown as a 2-letter circle avatar badge |
| `role`     | employees  | Displayed in the "Role" column |
| `shift`    | employees  | Displayed in the "Shift" column (`"Morning"` / `"Evening"`) |
| `status`   | employees  | `"active"` → green **Active** badge; `"on-leave"` → grey **On Leave** badge |
| `hours`    | employees  | Shown in the "Hours/wk" column; summed for the summary stat card |
| `rating`   | employees  | Shown as `4.9/5` in the "Rating" column |
| `staff`    | restaurants | Shown directly in the Admin restaurant table "Staff Count" column |

---

## 🚦 4. Critical Notes for Backend Devs

1. **`status` field is case-sensitive:** The frontend strictly checks `status === "active"` and `status === "on-leave"` (with a hyphen). Do not use `"Active"` (capitalized) or `"ON_LEAVE"` or similar variants.

2. **Do NOT send the `avatar` as an image URL yet:** The UI currently expects 2 initials (e.g., `"MG"`). If you want to support profile photos later, you can add an optional `"avatarUrl"` field and the frontend team will update accordingly.

3. **`hours` should be `0` for on-leave employees**, not `null` or `undefined`, to prevent calculation errors in the sum/average operations on the frontend.

4. **Role Separation is critical:** The backend must identify whether the session token belongs to an `admin` or a `manager`, and return the appropriate data. The frontend will request the correct endpoint based on the role exposed in the auth context.
