// ============================================
// Production Database Service
// Uses localStorage (can be replaced with real API)
// NO DEMO DATA - Real user registration required
// ============================================

import { User, Bug, ActivityLog } from '../types';

const DB_KEYS = {
  USERS: 'bugtracker_users',
  BUGS: 'bugtracker_bugs',
  ACTIVITY: 'bugtracker_activity',
  CURRENT_USER: 'bugtracker_current_user',
  TOKEN: 'bugtracker_token',
  DB_VERSION: 'bugtracker_version',
};

const CURRENT_DB_VERSION = '2.0.0'; // Increment to reset database

// Generate unique ID
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Password hashing (production: use bcrypt on server)
export const hashPassword = (password: string): string => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  // Add salt-like suffix for extra security
  const salt = password.length.toString(16);
  return `hashed_${Math.abs(hash).toString(16)}_${salt}`;
};

// Verify password
export const verifyPassword = (password: string, hash: string): boolean => {
  return hashPassword(password) === hash;
};

// Generate avatar color based on username
const generateAvatarColor = (username: string): string => {
  const colors = [
    '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#ef4444', '#f97316',
    '#f59e0b', '#eab308', '#84cc16', '#22c55e',
    '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  ];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Initialize empty database - NO DEMO DATA
export const initializeDatabase = (): void => {
  const storedVersion = localStorage.getItem(DB_KEYS.DB_VERSION);
  
  // Reset if version changed or first time
  if (storedVersion !== CURRENT_DB_VERSION) {
    // Clear old data
    Object.values(DB_KEYS).forEach(key => localStorage.removeItem(key));
    
    // Initialize empty collections
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify([]));
    localStorage.setItem(DB_KEYS.BUGS, JSON.stringify([]));
    localStorage.setItem(DB_KEYS.ACTIVITY, JSON.stringify([]));
    localStorage.setItem(DB_KEYS.DB_VERSION, CURRENT_DB_VERSION);
    
    console.log('🔧 Database initialized (v' + CURRENT_DB_VERSION + ')');
  }
};

// Reset database completely
export const resetDatabase = (): void => {
  Object.values(DB_KEYS).forEach(key => localStorage.removeItem(key));
  initializeDatabase();
};

// ============================================
// USER OPERATIONS
// ============================================

export const getUsers = (): User[] => {
  const data = localStorage.getItem(DB_KEYS.USERS);
  return data ? JSON.parse(data) : [];
};

export const getUserById = (id: string): User | undefined => {
  return getUsers().find(u => u.id === id);
};

export const getUserByUsername = (username: string): User | undefined => {
  return getUsers().find(u => u.username.toLowerCase() === username.toLowerCase());
};

export const getDevelopers = (): User[] => {
  return getUsers().filter(u => u.role === 'developer' || u.role === 'admin');
};

export const createUser = (username: string, email: string, password: string, role: User['role']): User => {
  const users = getUsers();
  
  // Check if username already exists
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    throw new Error('Username already exists');
  }
  
  // Check if email already exists
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('Email already registered');
  }
  
  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Please enter a valid email address');
  }
  
  // Validate password
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }
  
  // Validate username
  if (username.length < 3) {
    throw new Error('Username must be at least 3 characters');
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    throw new Error('Username can only contain letters, numbers, and underscores');
  }
  
  const newUser: User = {
    id: generateId(),
    username,
    email,
    password_hash: hashPassword(password),
    role,
    created_at: new Date().toISOString(),
    avatar_color: generateAvatarColor(username),
  };
  
  users.push(newUser);
  localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
  
  // Log activity
  addActivityLog({
    action: 'user_registered',
    description: `New ${role} "${username}" registered`,
    user_id: newUser.id,
    user_name: username,
  });
  
  return newUser;
};

export const updateUser = (id: string, updates: Partial<User>): User | null => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return null;
  
  users[index] = { ...users[index], ...updates };
  localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
  return users[index];
};

export const deleteUser = (id: string): boolean => {
  const users = getUsers();
  const filtered = users.filter(u => u.id !== id);
  if (filtered.length === users.length) return false;
  localStorage.setItem(DB_KEYS.USERS, JSON.stringify(filtered));
  return true;
};

// ============================================
// BUG OPERATIONS
// ============================================

export const getBugs = (): Bug[] => {
  const data = localStorage.getItem(DB_KEYS.BUGS);
  return data ? JSON.parse(data) : [];
};

export const getBugById = (id: string): Bug | undefined => {
  return getBugs().find(b => b.id === id);
};

export const createBug = (bug: Omit<Bug, 'id' | 'created_at' | 'updated_at'>): Bug => {
  const bugs = getBugs();
  
  // Validate
  if (!bug.title || bug.title.trim().length < 3) {
    throw new Error('Bug title must be at least 3 characters');
  }
  
  if (!bug.description || bug.description.trim().length < 10) {
    throw new Error('Bug description must be at least 10 characters');
  }
  
  const newBug: Bug = {
    ...bug,
    title: bug.title.trim(),
    description: bug.description.trim(),
    id: generateId(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  bugs.push(newBug);
  localStorage.setItem(DB_KEYS.BUGS, JSON.stringify(bugs));
  
  return newBug;
};

export const updateBug = (id: string, updates: Partial<Bug>): Bug | null => {
  const bugs = getBugs();
  const index = bugs.findIndex(b => b.id === id);
  if (index === -1) return null;
  
  bugs[index] = {
    ...bugs[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  localStorage.setItem(DB_KEYS.BUGS, JSON.stringify(bugs));
  return bugs[index];
};

export const deleteBug = (id: string): boolean => {
  const bugs = getBugs();
  const filtered = bugs.filter(b => b.id !== id);
  if (filtered.length === bugs.length) return false;
  localStorage.setItem(DB_KEYS.BUGS, JSON.stringify(filtered));
  return true;
};

// ============================================
// ACTIVITY LOG OPERATIONS
// ============================================

export const getActivityLogs = (): ActivityLog[] => {
  const data = localStorage.getItem(DB_KEYS.ACTIVITY);
  return data ? JSON.parse(data) : [];
};

export const addActivityLog = (log: Omit<ActivityLog, 'id' | 'timestamp'>): ActivityLog => {
  const logs = getActivityLogs();
  const newLog: ActivityLog = {
    ...log,
    id: generateId(),
    timestamp: new Date().toISOString(),
  };
  logs.unshift(newLog);
  // Keep only last 100 logs
  const trimmed = logs.slice(0, 100);
  localStorage.setItem(DB_KEYS.ACTIVITY, JSON.stringify(trimmed));
  return newLog;
};

export const clearActivityLogs = (): void => {
  localStorage.setItem(DB_KEYS.ACTIVITY, JSON.stringify([]));
};

// ============================================
// AUTH OPERATIONS
// ============================================

export const setCurrentUser = (user: User, token: string): void => {
  // Don't store password hash in session
  const safeUser = { ...user };
  delete (safeUser as Record<string, unknown>).password_hash;
  localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(safeUser));
  localStorage.setItem(DB_KEYS.TOKEN, token);
};

export const getCurrentUser = (): { user: User | null; token: string | null } => {
  const userData = localStorage.getItem(DB_KEYS.CURRENT_USER);
  const token = localStorage.getItem(DB_KEYS.TOKEN);
  return {
    user: userData ? JSON.parse(userData) : null,
    token,
  };
};

export const clearCurrentUser = (): void => {
  localStorage.removeItem(DB_KEYS.CURRENT_USER);
  localStorage.removeItem(DB_KEYS.TOKEN);
};

// Generate JWT-like token
export const generateToken = (userId: string): string => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    userId,
    exp: Date.now() + 86400000, // 24 hours
    iat: Date.now(),
  };
  const signature = generateId(); // Simplified signature
  return `${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(payload))}.${signature}`;
};

export const verifyToken = (token: string): { valid: boolean; userId?: string } => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false };
    
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp < Date.now()) {
      return { valid: false };
    }
    return { valid: true, userId: payload.userId };
  } catch {
    return { valid: false };
  }
};

// ============================================
// STATISTICS
// ============================================

export const getStats = () => {
  const bugs = getBugs();
  const users = getUsers();
  
  return {
    totalBugs: bugs.length,
    openBugs: bugs.filter(b => b.status === 'open').length,
    inProgressBugs: bugs.filter(b => b.status === 'in_progress').length,
    closedBugs: bugs.filter(b => b.status === 'closed').length,
    criticalBugs: bugs.filter(b => b.priority === 'critical' && b.status !== 'closed').length,
    highPriorityBugs: bugs.filter(b => b.priority === 'high' && b.status !== 'closed').length,
    totalUsers: users.length,
    totalDevelopers: users.filter(u => u.role === 'developer').length,
    totalTesters: users.filter(u => u.role === 'tester').length,
    totalAdmins: users.filter(u => u.role === 'admin').length,
  };
};
