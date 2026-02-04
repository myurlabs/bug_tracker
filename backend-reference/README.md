# BugTracker Pro - Flask Backend Reference

This directory contains a reference Flask backend implementation for BugTracker Pro.

## Setup Instructions

### 1. Create Virtual Environment
```bash
cd backend-reference
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Set Environment Variables (Optional)
Create a `.env` file:
```env
SECRET_KEY=your-super-secret-key
JWT_SECRET_KEY=your-jwt-secret-key
DATABASE_URL=sqlite:///bugtracker.db
```

### 4. Run the Application
```bash
python app.py
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/register | Register new user |
| POST | /api/login | Login and get JWT token |
| GET | /api/me | Get current user (requires JWT) |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users | Get all users |
| GET | /api/developers | Get all developers |

### Bugs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/bugs | Get all bugs (with filters) |
| GET | /api/bugs/:id | Get bug by ID |
| POST | /api/bugs | Create new bug |
| PUT | /api/bugs/:id | Update bug |
| PATCH | /api/bugs/:id/status | Update bug status |
| PATCH | /api/bugs/:id/assign | Assign bug to developer |
| DELETE | /api/bugs/:id | Delete bug |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/dashboard/stats | Get bug statistics |
| GET | /api/dashboard/workload | Get developer workload |
| GET | /api/dashboard/activity | Get recent activity |

## Database Schema

### Users Table
- id (Integer, Primary Key)
- username (String, Unique)
- password_hash (String)
- role (String: 'admin', 'developer', 'tester')
- created_at (DateTime)

### Bugs Table
- id (Integer, Primary Key)
- title (String)
- description (Text)
- priority (String: 'low', 'medium', 'high', 'critical')
- status (String: 'open', 'in_progress', 'closed')
- created_by (Foreign Key -> Users)
- assigned_to (Foreign Key -> Users, Nullable)
- created_at (DateTime)
- updated_at (DateTime)

### Activity Logs Table
- id (Integer, Primary Key)
- action (String)
- bug_id (Integer)
- bug_title (String)
- user_id (Foreign Key -> Users)
- timestamp (DateTime)

## Integration with Frontend

To connect the React frontend to this Flask backend:

1. Update `src/services/api.ts` to make actual HTTP requests:

```typescript
// Replace simulated API calls with fetch/axios calls
const API_BASE = 'http://localhost:5000/api';

export const authApi = {
  login: async (username: string, password: string) => {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return response.json();
  },
  // ... other endpoints
};
```

2. Store the JWT token and include it in request headers:

```typescript
const token = localStorage.getItem('token');
fetch(url, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
```

## Security Notes

- In production, use environment variables for secrets
- Enable HTTPS
- Implement rate limiting
- Add input sanitization
- Use a production-ready database (PostgreSQL, MySQL)
- Implement proper logging and monitoring
