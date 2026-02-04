import React, { useState, useEffect } from 'react';
import { DashboardStats, DeveloperWorkload, ActivityLog, User } from '@/types';
import { dashboardApi, usersApi } from '@/services/api';
import { cn } from '@/utils/cn';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [workload, setWorkload] = useState<DeveloperWorkload[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [statsRes, workloadRes, activityRes, usersRes] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getDeveloperWorkload(),
        dashboardApi.getRecentActivity(),
        usersApi.getAll(),
      ]);

      if (statsRes.success) setStats(statsRes.data!);
      if (workloadRes.success) setWorkload(workloadRes.data!);
      if (activityRes.success) setActivity(activityRes.data!);
      if (usersRes.success) setUsers(usersRes.data!);
    };

    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    { label: 'Total Bugs', value: stats?.total || 0, color: 'bg-gray-700', icon: '📊' },
    { label: 'Open', value: stats?.open || 0, color: 'bg-red-900/50', icon: '🔴', textColor: 'text-red-400' },
    { label: 'In Progress', value: stats?.in_progress || 0, color: 'bg-amber-900/50', icon: '🟡', textColor: 'text-amber-400' },
    { label: 'Closed', value: stats?.closed || 0, color: 'bg-emerald-900/50', icon: '🟢', textColor: 'text-emerald-400' },
  ];

  const priorityData = [
    { label: 'Critical', value: stats?.critical || 0, color: '#ef4444' },
    { label: 'High', value: stats?.high || 0, color: '#f97316' },
    { label: 'Medium', value: stats?.medium || 0, color: '#3b82f6' },
    { label: 'Low', value: stats?.low || 0, color: '#22c55e' },
  ];

  const totalPriority = priorityData.reduce((sum, p) => sum + p.value, 0);

  const formatTimeAgo = (timestamp: string): string => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getUserById = (id: string): User | undefined => {
    return users.find(u => u.id === id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400">Overview of your bug tracking metrics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={cn(
              'p-6 rounded-xl border border-gray-700',
              card.color
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{card.label}</p>
                <p className={cn('text-3xl font-bold mt-1', card.textColor || 'text-white')}>
                  {card.value}
                </p>
              </div>
              <span className="text-3xl">{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Distribution Chart */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Priority Distribution</h2>
          
          {/* Simple Pie Chart using CSS */}
          <div className="flex items-center gap-8">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {totalPriority > 0 ? (
                  (() => {
                    let currentAngle = 0;
                    return priorityData.map((item, index) => {
                      const percentage = (item.value / totalPriority) * 100;
                      const angle = (percentage / 100) * 360;
                      const largeArc = angle > 180 ? 1 : 0;
                      
                      const startX = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180);
                      const startY = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180);
                      const endX = 50 + 40 * Math.cos(((currentAngle + angle) * Math.PI) / 180);
                      const endY = 50 + 40 * Math.sin(((currentAngle + angle) * Math.PI) / 180);
                      
                      const pathD = `M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArc} 1 ${endX} ${endY} Z`;
                      currentAngle += angle;
                      
                      if (item.value === 0) return null;
                      
                      return (
                        <path
                          key={index}
                          d={pathD}
                          fill={item.color}
                          className="transition-all duration-300 hover:opacity-80"
                        />
                      );
                    });
                  })()
                ) : (
                  <circle cx="50" cy="50" r="40" fill="#374151" />
                )}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{totalPriority}</p>
                  <p className="text-xs text-gray-400">Total</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {priorityData.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-400 text-sm">{item.label}</span>
                  <span className="text-white font-medium ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status Overview */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Status Overview</h2>
          
          <div className="space-y-4">
            {[
              { label: 'Open', value: stats?.open || 0, max: stats?.total || 1, color: 'bg-red-500' },
              { label: 'In Progress', value: stats?.in_progress || 0, max: stats?.total || 1, color: 'bg-amber-500' },
              { label: 'Closed', value: stats?.closed || 0, max: stats?.total || 1, color: 'bg-emerald-500' },
            ].map((item) => {
              const percentage = stats?.total ? (item.value / stats.total) * 100 : 0;
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">{item.label}</span>
                    <span className="text-white">{item.value} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', item.color)}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Developer Workload */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Developer Workload</h2>
          
          {workload.length === 0 ? (
            <p className="text-gray-400 text-sm">No developers found</p>
          ) : (
            <div className="space-y-4">
              {workload.map((dev) => {
                const user = getUserById(dev.developer_id);
                return (
                  <div key={dev.developer_id} className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                      style={{ backgroundColor: user?.avatar_color || '#6366f1' }}
                    >
                      {dev.developer_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{dev.developer_name}</p>
                      <div className="flex gap-3 text-xs">
                        <span className="text-red-400">{dev.open_bugs} open</span>
                        <span className="text-amber-400">{dev.in_progress_bugs} in progress</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">{dev.assigned_bugs}</p>
                      <p className="text-xs text-gray-400">assigned</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
          
          {activity.length === 0 ? (
            <p className="text-gray-400 text-sm">No recent activity</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {activity.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 bg-gray-700/50 rounded-lg"
                >
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0">
                    {log.user_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300">
                      <span className="text-white font-medium">{log.user_name}</span>{' '}
                      <span className="text-gray-400">{log.description}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(log.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
