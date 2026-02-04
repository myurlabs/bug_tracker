import React, { useState, useEffect } from 'react';
import { User } from '@/types';
import { usersApi } from '@/services/api';
import { RoleBadge } from '@/components/ui/Badge';

export const UsersList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      const result = await usersApi.getAll();
      if (result.success) {
        setUsers(result.data!);
      }
      setIsLoading(false);
    };
    fetchUsers();
  }, []);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getRoleStats = () => {
    const admins = users.filter(u => u.role === 'admin').length;
    const developers = users.filter(u => u.role === 'developer').length;
    const testers = users.filter(u => u.role === 'tester').length;
    return { admins, developers, testers };
  };

  const stats = getRoleStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <p className="text-gray-400">Manage system users and their roles</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <p className="text-gray-400 text-sm">Total Users</p>
          <p className="text-3xl font-bold text-white mt-1">{users.length}</p>
        </div>
        <div className="bg-purple-900/30 rounded-xl border border-purple-700 p-4">
          <p className="text-purple-400 text-sm">Admins</p>
          <p className="text-3xl font-bold text-purple-400 mt-1">{stats.admins}</p>
        </div>
        <div className="bg-blue-900/30 rounded-xl border border-blue-700 p-4">
          <p className="text-blue-400 text-sm">Developers</p>
          <p className="text-3xl font-bold text-blue-400 mt-1">{stats.developers}</p>
        </div>
        <div className="bg-emerald-900/30 rounded-xl border border-emerald-700 p-4">
          <p className="text-emerald-400 text-sm">Testers</p>
          <p className="text-3xl font-bold text-emerald-400 mt-1">{stats.testers}</p>
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700 text-left">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-750">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                          style={{ backgroundColor: user.avatar_color }}
                        >
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.username}</p>
                          <p className="text-gray-500 text-sm">ID: {user.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-400 text-sm">{formatDate(user.created_at)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-sm text-emerald-400">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
