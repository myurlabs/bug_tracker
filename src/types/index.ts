// ============================================
// Type Definitions for Bug Tracking System
// ============================================

export type UserRole = 'admin' | 'developer' | 'tester';
export type BugPriority = 'low' | 'medium' | 'high' | 'critical';
export type BugStatus = 'open' | 'in_progress' | 'closed';

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: string;
  avatar_color: string;
}

export interface Bug {
  id: string;
  title: string;
  description: string;
  priority: BugPriority;
  status: BugStatus;
  created_by: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  description: string;
  bug_id?: string;
  bug_title?: string;
  user_id: string;
  user_name: string;
  timestamp: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface DashboardStats {
  total: number;
  open: number;
  in_progress: number;
  closed: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface DeveloperWorkload {
  developer_id: string;
  developer_name: string;
  assigned_bugs: number;
  open_bugs: number;
  in_progress_bugs: number;
}
