# BugTracker Pro - Issue Management System

A complete production-style Bug Tracking Web Application (JIRA-lite) built with React, TypeScript, and Tailwind CSS.

## 🚀 Features

### Authentication System
- User registration and login
- JWT-like session handling (simulated with localStorage)
- Role-based access: Admin / Developer / Tester

### Bug Management
- Create, edit, and delete bugs
- Assign bugs to developers
- Priority levels: Low / Medium / High / Critical
- Status tracking: Open / In Progress / Closed
- Timestamp tracking
- Created by user tracking

### Dashboard
- Bug statistics overview
- Priority distribution pie chart
- Status progress bars
- Developer workload summary
- Recent activity feed

### Bug Workflow
- Testers create bugs
- Admins assign developers
- Developers update status
- Only assigned developers can close bugs

### UI Features
- Dark professional theme
- Sidebar navigation
- Bug table with filters & search
- Status color badges
- Modal forms for creating/editing
- Responsive layout

## 🔐 Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Developer | developer1 | dev123 |
| Developer | developer2 | dev123 |
| Tester | tester1 | test123 |

## 🛠 Architecture

### Project Structure
```
/src
  /components
    /auth         - Authentication components
    /bugs         - Bug management components
    /dashboard    - Dashboard and analytics
    /layout       - Layout components (Sidebar)
    /ui           - Reusable UI components
    /users        - User management
  /context        - React Context providers
  /services       - API and database services
  /types          - TypeScript type definitions
  /utils          - Utility functions
```

### Data Flow
1. **Database Service** (`services/database.ts`) - Handles all data operations using localStorage
2. **API Service** (`services/api.ts`) - Simulates REST API endpoints
3. **Auth Context** (`context/AuthContext.tsx`) - Manages authentication state
4. **Components** - React components for UI

### Role-Based Permissions

| Action | Admin | Developer | Tester |
|--------|-------|-----------|--------|
| Create Bug | ✅ | ❌ | ✅ |
| Edit Any Bug | ✅ | ❌ | ❌ |
| Edit Own/Assigned | ✅ | ✅ | ✅ |
| Delete Bug | ✅ | ❌ | ❌ |
| Assign Bug | ✅ | ❌ | ❌ |
| Close Any Bug | ✅ | ❌ | ❌ |
| Close Assigned Bug | ✅ | ✅ | ❌ |
| View Users | ✅ | ❌ | ❌ |

## 🔌 API Endpoints (Simulated)

### Auth
- `POST /register` - Register new user
- `POST /login` - User login
- `POST /logout` - User logout
- `GET /me` - Get current user

### Bugs
- `GET /bugs` - Get all bugs (with filters)
- `GET /bugs/:id` - Get bug by ID
- `POST /bugs` - Create new bug
- `PUT /bugs/:id` - Update bug
- `PATCH /bugs/:id/status` - Update bug status
- `PATCH /bugs/:id/assign` - Assign bug to developer
- `DELETE /bugs/:id` - Delete bug

### Users
- `GET /users` - Get all users
- `GET /developers` - Get all developers

### Dashboard
- `GET /dashboard/stats` - Get bug statistics
- `GET /dashboard/workload` - Get developer workload
- `GET /dashboard/activity` - Get recent activity

## 🎨 Color Scheme

- Background: Gray-900 (`#111827`)
- Cards: Gray-800 (`#1f2937`)
- Borders: Gray-700 (`#374151`)
- Primary: Indigo-600 (`#4f46e5`)
- Critical: Red (`#ef4444`)
- High: Orange (`#f97316`)
- Medium: Blue (`#3b82f6`)
- Low: Green (`#22c55e`)

## 📝 Notes

This is a frontend-only implementation that simulates a backend using localStorage. In a production environment, you would replace the `services/api.ts` with actual API calls to a Flask/Django/Node.js backend.

The architecture is designed to make this transition seamless - just update the API service to make real HTTP requests instead of calling the database service directly.
