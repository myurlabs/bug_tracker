import React from 'react';
import { cn } from '@/utils/cn';
import { BugPriority, BugStatus } from '@/types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className,
}) => {
  const variants = {
    default: 'bg-gray-700 text-gray-300',
    success: 'bg-emerald-900/50 text-emerald-400 border border-emerald-700',
    warning: 'bg-amber-900/50 text-amber-400 border border-amber-700',
    danger: 'bg-red-900/50 text-red-400 border border-red-700',
    info: 'bg-blue-900/50 text-blue-400 border border-blue-700',
    purple: 'bg-purple-900/50 text-purple-400 border border-purple-700',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

// Priority Badge
interface PriorityBadgeProps {
  priority: BugPriority;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const config = {
    critical: { variant: 'danger' as const, label: 'Critical', icon: '🔴' },
    high: { variant: 'warning' as const, label: 'High', icon: '🟠' },
    medium: { variant: 'info' as const, label: 'Medium', icon: '🟡' },
    low: { variant: 'success' as const, label: 'Low', icon: '🟢' },
  };

  const { variant, label, icon } = config[priority];

  return (
    <Badge variant={variant}>
      <span className="mr-1">{icon}</span>
      {label}
    </Badge>
  );
};

// Status Badge
interface StatusBadgeProps {
  status: BugStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = {
    open: { variant: 'danger' as const, label: 'Open' },
    in_progress: { variant: 'warning' as const, label: 'In Progress' },
    closed: { variant: 'success' as const, label: 'Closed' },
  };

  const { variant, label } = config[status];

  return <Badge variant={variant}>{label}</Badge>;
};

// Role Badge
interface RoleBadgeProps {
  role: 'admin' | 'developer' | 'tester';
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const config = {
    admin: { variant: 'purple' as const, label: 'Admin' },
    developer: { variant: 'info' as const, label: 'Developer' },
    tester: { variant: 'success' as const, label: 'Tester' },
  };

  const { variant, label } = config[role];

  return <Badge variant={variant}>{label}</Badge>;
};
