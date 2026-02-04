import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { UserRole } from '@/types';

export const LoginPage: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(true); // Start with register for new users
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'tester' as UserRole,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    // Validation
    if (isRegister) {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        setIsLoading(false);
        return;
      }
      if (formData.username.length < 3) {
        setError('Username must be at least 3 characters');
        setIsLoading(false);
        return;
      }
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        setIsLoading(false);
        return;
      }
    }

    try {
      const result = isRegister
        ? await register(formData.username, formData.email, formData.password, formData.role)
        : await login(formData.username, formData.password);

      if (!result.success) {
        setError(result.error || 'An error occurred');
      } else if (isRegister) {
        setSuccess('Account created successfully! Logging you in...');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">BugTracker Pro</h1>
          <p className="text-gray-400 mt-2">Professional Issue Management System</p>
        </div>

        {/* Form Card */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8 shadow-xl">
          <h2 className="text-2xl font-semibold text-white mb-2">
            {isRegister ? 'Create Your Account' : 'Welcome Back'}
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            {isRegister 
              ? 'Register to start tracking bugs with your team' 
              : 'Sign in to access your dashboard'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Username"
              name="username"
              type="text"
              placeholder="Choose a username"
              value={formData.username}
              onChange={handleChange}
              required
              autoComplete="username"
            />

            {isRegister && (
              <Input
                label="Email Address"
                name="email"
                type="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            )}

            <Input
              label="Password"
              name="password"
              type="password"
              placeholder={isRegister ? 'Create a password (min 6 chars)' : 'Enter your password'}
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />

            {isRegister && (
              <>
                <Input
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />

                <Select
                  label="Your Role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  options={[
                    { value: 'tester', label: '🧪 Tester - Report and track bugs' },
                    { value: 'developer', label: '👨‍💻 Developer - Fix assigned bugs' },
                    { value: 'admin', label: '👑 Admin - Manage team & assign bugs' },
                  ]}
                />

                {/* Role Info */}
                <div className="bg-gray-700/50 rounded-lg p-3 text-xs text-gray-400">
                  <p className="font-medium text-gray-300 mb-1">Role Permissions:</p>
                  <ul className="space-y-1">
                    <li>• <span className="text-emerald-400">Tester:</span> Create & edit own bugs</li>
                    <li>• <span className="text-blue-400">Developer:</span> Update status, close assigned bugs</li>
                    <li>• <span className="text-purple-400">Admin:</span> Full access, assign bugs, manage users</li>
                  </ul>
                </div>

                {/* Email Notification Info */}
                <div className="bg-indigo-900/30 border border-indigo-700 rounded-lg p-3 text-xs">
                  <p className="font-medium text-indigo-300 mb-1 flex items-center gap-2">
                    <span>📧</span> Email Notifications
                  </p>
                  <p className="text-indigo-200/70">
                    You'll receive email notifications when bugs are assigned to you or when status changes.
                  </p>
                </div>
              </>
            )}

            {error && (
              <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-900/30 border border-emerald-700 rounded-lg">
                <p className="text-sm text-emerald-400">{success}</p>
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              {isRegister ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
                setSuccess('');
              }}
              className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
            >
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
            </button>
          </div>
        </div>

        {/* Getting Started Tips */}
        <div className="mt-6 bg-gray-800/50 rounded-xl border border-gray-700 p-4">
          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <span>🚀</span> Getting Started
          </h3>
          <ol className="text-xs text-gray-400 space-y-2">
            <li className="flex gap-2">
              <span className="text-indigo-400 font-medium">1.</span>
              Create an account with your email and preferred role
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-400 font-medium">2.</span>
              Testers can create bug reports immediately
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-400 font-medium">3.</span>
              Admins assign bugs to developers (they get email!)
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-400 font-medium">4.</span>
              Track progress on the dashboard
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};
