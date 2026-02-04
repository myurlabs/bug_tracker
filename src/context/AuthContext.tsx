// ============================================
// Authentication Context
// Provides auth state and methods throughout the app
// ============================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types';
import { authApi } from '../services/api';
import { initializeDatabase, getCurrentUser as getStoredUser } from '../services/database';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, email: string, password: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  canCreate: boolean;
  canAssign: boolean;
  canDelete: boolean;
  canCloseAny: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize database and check for existing session
  useEffect(() => {
    initializeDatabase();
    
    const checkAuth = async () => {
      const stored = getStoredUser();
      if (stored.user && stored.token) {
        const result = await authApi.getCurrentUser();
        if (result.success && result.data) {
          setUser(result.data);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const result = await authApi.login(username, password);
    if (result.success && result.data) {
      setUser(result.data.user);
      return { success: true };
    }
    return { success: false, error: result.error };
  }, []);

  const register = useCallback(async (username: string, email: string, password: string, role: UserRole) => {
    const result = await authApi.register(username, email, password, role);
    if (result.success && result.data) {
      setUser(result.data.user);
      return { success: true };
    }
    return { success: false, error: result.error };
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  // Role-based permissions
  const canCreate = user?.role === 'tester' || user?.role === 'admin';
  const canAssign = user?.role === 'admin';
  const canDelete = user?.role === 'admin';
  const canCloseAny = user?.role === 'admin';

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    canCreate,
    canAssign,
    canDelete,
    canCloseAny,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
