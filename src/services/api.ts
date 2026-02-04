// ============================================
// API Service - Production REST API Layer
// Mimics real backend behavior
// ============================================

import { User, Bug, ActivityLog, DashboardStats, DeveloperWorkload } from '../types';
import * as db from './database';
import { notifyBugAssigned, notifyStatusChanged, notifyBugCreated } from './emailService';

// API Response types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================
// AUTH ENDPOINTS
// ============================================

export const authApi = {
  // POST /register
  register: async (
    username: string,
    email: string,
    password: string,
    role: User['role']
  ): Promise<ApiResponse<{ user: User; token: string }>> => {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 300));

    try {
      // Create user (validation happens in database layer)
      const user = db.createUser(username, email, password, role);
      const token = db.generateToken(user.id);
      db.setCurrentUser(user, token);

      return { success: true, data: { user, token } };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  // POST /login
  login: async (
    username: string,
    password: string
  ): Promise<ApiResponse<{ user: User; token: string }>> => {
    await new Promise(r => setTimeout(r, 300));

    const user = db.getUserByUsername(username);
    if (!user) {
      return { success: false, error: 'Invalid username or password' };
    }

    // Verify password
    if (!db.verifyPassword(password, user.password_hash)) {
      return { success: false, error: 'Invalid username or password' };
    }

    const token = db.generateToken(user.id);
    db.setCurrentUser(user, token);

    return { success: true, data: { user, token } };
  },

  // POST /logout
  logout: async (): Promise<ApiResponse<null>> => {
    db.clearCurrentUser();
    return { success: true };
  },

  // GET /me
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const { user, token } = db.getCurrentUser();
    if (!user || !token) {
      return { success: false, error: 'Not authenticated' };
    }

    const verified = db.verifyToken(token);
    if (!verified.valid) {
      db.clearCurrentUser();
      return { success: false, error: 'Session expired' };
    }

    // Get fresh user data
    const freshUser = db.getUserById(verified.userId!);
    if (!freshUser) {
      db.clearCurrentUser();
      return { success: false, error: 'User not found' };
    }

    return { success: true, data: freshUser };
  },
};

// ============================================
// USERS ENDPOINTS
// ============================================

export const usersApi = {
  // GET /users
  getAll: async (): Promise<ApiResponse<User[]>> => {
    await new Promise(r => setTimeout(r, 100));
    const users = db.getUsers();
    // Remove password hashes for security
    const safeUsers = users.map(u => ({ ...u, password_hash: '' }));
    return { success: true, data: safeUsers };
  },

  // GET /developers
  getDevelopers: async (): Promise<ApiResponse<User[]>> => {
    await new Promise(r => setTimeout(r, 100));
    const developers = db.getDevelopers();
    const safeDevs = developers.map(u => ({ ...u, password_hash: '' }));
    return { success: true, data: safeDevs };
  },

  // GET /users/:id
  getById: async (id: string): Promise<ApiResponse<User>> => {
    const user = db.getUserById(id);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    return { success: true, data: { ...user, password_hash: '' } };
  },

  // DELETE /users/:id
  delete: async (id: string, currentUser: User): Promise<ApiResponse<null>> => {
    if (currentUser.role !== 'admin') {
      return { success: false, error: 'Only admins can delete users' };
    }
    if (currentUser.id === id) {
      return { success: false, error: 'Cannot delete your own account' };
    }
    
    const deleted = db.deleteUser(id);
    if (!deleted) {
      return { success: false, error: 'User not found' };
    }
    return { success: true };
  },
};

// ============================================
// BUGS ENDPOINTS
// ============================================

export const bugsApi = {
  // GET /bugs
  getAll: async (filters?: {
    status?: string;
    priority?: string;
    assigned_to?: string;
    search?: string;
  }): Promise<ApiResponse<Bug[]>> => {
    await new Promise(r => setTimeout(r, 100));
    let bugs = db.getBugs();

    // Apply filters
    if (filters) {
      if (filters.status && filters.status !== 'all') {
        bugs = bugs.filter(b => b.status === filters.status);
      }
      if (filters.priority && filters.priority !== 'all') {
        bugs = bugs.filter(b => b.priority === filters.priority);
      }
      if (filters.assigned_to && filters.assigned_to !== 'all') {
        bugs = bugs.filter(b => b.assigned_to === filters.assigned_to);
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        bugs = bugs.filter(b => 
          b.title.toLowerCase().includes(search) ||
          b.description.toLowerCase().includes(search)
        );
      }
    }

    // Sort by updated_at descending
    bugs.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    return { success: true, data: bugs };
  },

  // GET /bugs/:id
  getById: async (id: string): Promise<ApiResponse<Bug>> => {
    const bug = db.getBugById(id);
    if (!bug) {
      return { success: false, error: 'Bug not found' };
    }
    return { success: true, data: bug };
  },

  // POST /bugs
  create: async (
    bugData: Omit<Bug, 'id' | 'created_at' | 'updated_at'>,
    currentUser: User
  ): Promise<ApiResponse<Bug>> => {
    await new Promise(r => setTimeout(r, 200));

    try {
      const bug = db.createBug(bugData);

      // Log activity
      db.addActivityLog({
        action: 'created',
        description: `Created bug "${bug.title}"`,
        bug_id: bug.id,
        bug_title: bug.title,
        user_id: currentUser.id,
        user_name: currentUser.username,
      });

      // 📧 Notify admins about new bug (if critical/high priority)
      if (bug.priority === 'critical' || bug.priority === 'high') {
        const admins = db.getUsers().filter(u => u.role === 'admin' && u.id !== currentUser.id);
        admins.forEach(admin => {
          if (admin.email) {
            notifyBugCreated(
              admin.email,
              admin.username,
              currentUser.username,
              bug.title,
              bug.description,
              bug.priority
            );
          }
        });
      }

      return { success: true, data: bug };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  // PUT /bugs/:id
  update: async (
    id: string,
    updates: Partial<Bug>,
    currentUser: User
  ): Promise<ApiResponse<Bug>> => {
    await new Promise(r => setTimeout(r, 200));

    const existingBug = db.getBugById(id);
    if (!existingBug) {
      return { success: false, error: 'Bug not found' };
    }

    // Role-based access control
    if (currentUser.role === 'tester' && currentUser.id !== existingBug.created_by) {
      return { success: false, error: 'Testers can only edit bugs they created' };
    }

    const bug = db.updateBug(id, updates);
    if (!bug) {
      return { success: false, error: 'Failed to update bug' };
    }

    // Log activity
    db.addActivityLog({
      action: 'updated',
      description: `Updated bug "${bug.title}"`,
      bug_id: bug.id,
      bug_title: bug.title,
      user_id: currentUser.id,
      user_name: currentUser.username,
    });

    return { success: true, data: bug };
  },

  // PATCH /bugs/:id/status
  updateStatus: async (
    id: string,
    status: Bug['status'],
    currentUser: User
  ): Promise<ApiResponse<Bug>> => {
    await new Promise(r => setTimeout(r, 200));

    const existingBug = db.getBugById(id);
    if (!existingBug) {
      return { success: false, error: 'Bug not found' };
    }

    // Only assigned developer can close bug
    if (status === 'closed') {
      if (currentUser.role === 'developer' && existingBug.assigned_to !== currentUser.id) {
        return { success: false, error: 'Only the assigned developer can close this bug' };
      }
      if (currentUser.role === 'tester') {
        return { success: false, error: 'Testers cannot close bugs' };
      }
    }

    const bug = db.updateBug(id, { status });
    if (!bug) {
      return { success: false, error: 'Failed to update status' };
    }

    const statusText = status.replace('_', ' ');
    
    // Log activity
    db.addActivityLog({
      action: `status_${status}`,
      description: `Changed status to "${statusText}" on "${bug.title}"`,
      bug_id: bug.id,
      bug_title: bug.title,
      user_id: currentUser.id,
      user_name: currentUser.username,
    });

    // 📧 Notify the bug creator about status change
    const bugCreator = db.getUserById(bug.created_by);
    if (bugCreator && bugCreator.email && bugCreator.id !== currentUser.id) {
      notifyStatusChanged(
        bugCreator.email,
        bugCreator.username,
        currentUser.username,
        bug.title,
        bug.description,
        bug.priority,
        status
      );
    }

    return { success: true, data: bug };
  },

  // PATCH /bugs/:id/assign
  assign: async (
    id: string,
    developerId: string | null,
    currentUser: User
  ): Promise<ApiResponse<Bug>> => {
    await new Promise(r => setTimeout(r, 200));

    // Only admin can assign bugs
    if (currentUser.role !== 'admin') {
      return { success: false, error: 'Only admins can assign bugs' };
    }

    const existingBug = db.getBugById(id);
    if (!existingBug) {
      return { success: false, error: 'Bug not found' };
    }

    if (developerId) {
      const developer = db.getUserById(developerId);
      if (!developer || (developer.role !== 'developer' && developer.role !== 'admin')) {
        return { success: false, error: 'Invalid developer' };
      }
    }

    const bug = db.updateBug(id, { assigned_to: developerId });
    if (!bug) {
      return { success: false, error: 'Failed to assign bug' };
    }

    // Log activity
    const developer = developerId ? db.getUserById(developerId) : null;
    db.addActivityLog({
      action: developer ? 'assigned' : 'unassigned',
      description: developer 
        ? `Assigned "${bug.title}" to ${developer.username}` 
        : `Unassigned "${bug.title}"`,
      bug_id: bug.id,
      bug_title: bug.title,
      user_id: currentUser.id,
      user_name: currentUser.username,
    });

    // 📧 Send email notification to assigned developer
    if (developer && developer.email) {
      notifyBugAssigned(
        developer.email,
        developer.username,
        currentUser.username,
        bug.title,
        bug.description,
        bug.priority
      );
    }

    return { success: true, data: bug };
  },

  // DELETE /bugs/:id
  delete: async (id: string, currentUser: User): Promise<ApiResponse<null>> => {
    await new Promise(r => setTimeout(r, 200));

    // Only admin can delete bugs
    if (currentUser.role !== 'admin') {
      return { success: false, error: 'Only admins can delete bugs' };
    }

    const bug = db.getBugById(id);
    if (!bug) {
      return { success: false, error: 'Bug not found' };
    }

    const deleted = db.deleteBug(id);
    if (!deleted) {
      return { success: false, error: 'Failed to delete bug' };
    }

    // Log activity
    db.addActivityLog({
      action: 'deleted',
      description: `Deleted bug "${bug.title}"`,
      bug_id: id,
      bug_title: bug.title,
      user_id: currentUser.id,
      user_name: currentUser.username,
    });

    return { success: true };
  },
};

// ============================================
// DASHBOARD ENDPOINTS
// ============================================

export const dashboardApi = {
  // GET /dashboard/stats
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const bugs = db.getBugs();
    
    const stats: DashboardStats = {
      total: bugs.length,
      open: bugs.filter(b => b.status === 'open').length,
      in_progress: bugs.filter(b => b.status === 'in_progress').length,
      closed: bugs.filter(b => b.status === 'closed').length,
      critical: bugs.filter(b => b.priority === 'critical').length,
      high: bugs.filter(b => b.priority === 'high').length,
      medium: bugs.filter(b => b.priority === 'medium').length,
      low: bugs.filter(b => b.priority === 'low').length,
    };

    return { success: true, data: stats };
  },

  // GET /dashboard/workload
  getDeveloperWorkload: async (): Promise<ApiResponse<DeveloperWorkload[]>> => {
    const developers = db.getDevelopers();
    const bugs = db.getBugs();

    const workload: DeveloperWorkload[] = developers.map(dev => {
      const assignedBugs = bugs.filter(b => b.assigned_to === dev.id);
      return {
        developer_id: dev.id,
        developer_name: dev.username,
        assigned_bugs: assignedBugs.length,
        open_bugs: assignedBugs.filter(b => b.status === 'open').length,
        in_progress_bugs: assignedBugs.filter(b => b.status === 'in_progress').length,
      };
    });

    return { success: true, data: workload };
  },

  // GET /dashboard/activity
  getRecentActivity: async (): Promise<ApiResponse<ActivityLog[]>> => {
    const logs = db.getActivityLogs();
    return { success: true, data: logs.slice(0, 20) };
  },
};
