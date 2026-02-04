import React from 'react';
import { Bug, User } from '@/types';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { PriorityBadge, StatusBadge } from '@/components/ui/Badge';

interface BugDetailProps {
  bug: Bug;
  users: User[];
  developers: User[];
  currentUser: User;
  canAssign: boolean;
  onStatusChange: (bugId: string, status: Bug['status']) => void;
  onAssign: (bugId: string, developerId: string | null) => void;
  onEdit: () => void;
  onClose: () => void;
}

export const BugDetail: React.FC<BugDetailProps> = ({
  bug,
  users,
  developers,
  currentUser,
  canAssign,
  onStatusChange,
  onAssign,
  onEdit,
  onClose,
}) => {
  const createdBy = users.find((u) => u.id === bug.created_by);
  const assignedTo = bug.assigned_to ? users.find((u) => u.id === bug.assigned_to) : null;

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const canChangeStatus =
    currentUser.role === 'admin' ||
    (currentUser.role === 'developer' && bug.assigned_to === currentUser.id);

  const canClose =
    currentUser.role === 'admin' ||
    (currentUser.role === 'developer' && bug.assigned_to === currentUser.id);

  const canEditThis =
    currentUser.role === 'admin' ||
    bug.created_by === currentUser.id ||
    bug.assigned_to === currentUser.id;

  const statusOptions = [
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    ...(canClose ? [{ value: 'closed', label: 'Closed' }] : []),
  ];

  const developerOptions = [
    { value: '', label: 'Unassigned' },
    ...developers.map((dev) => ({ value: dev.id, label: dev.username })),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <PriorityBadge priority={bug.priority} />
          <StatusBadge status={bug.status} />
        </div>
        <h2 className="text-xl font-semibold text-white">{bug.title}</h2>
      </div>

      {/* Description */}
      <div className="bg-gray-700/50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-400 mb-2">Description</h3>
        <p className="text-gray-200 whitespace-pre-wrap">{bug.description}</p>
      </div>

      {/* Meta Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-700/50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Created By</h3>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
              style={{ backgroundColor: createdBy?.avatar_color || '#6366f1' }}
            >
              {createdBy?.username.charAt(0).toUpperCase() || '?'}
            </div>
            <span className="text-white">{createdBy?.username || 'Unknown'}</span>
          </div>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Assigned To</h3>
          {assignedTo ? (
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                style={{ backgroundColor: assignedTo.avatar_color }}
              >
                {assignedTo.username.charAt(0).toUpperCase()}
              </div>
              <span className="text-white">{assignedTo.username}</span>
            </div>
          ) : (
            <span className="text-gray-500">Not assigned</span>
          )}
        </div>
      </div>

      {/* Timestamps */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-400">Created:</span>
          <p className="text-gray-300">{formatDate(bug.created_at)}</p>
        </div>
        <div>
          <span className="text-gray-400">Last Updated:</span>
          <p className="text-gray-300">{formatDate(bug.updated_at)}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-gray-700 pt-4 space-y-4">
        {canChangeStatus && (
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Change Status
            </label>
            <Select
              options={statusOptions}
              value={bug.status}
              onChange={(e) => onStatusChange(bug.id, e.target.value as Bug['status'])}
            />
          </div>
        )}

        {canAssign && (
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Assign Developer
            </label>
            <Select
              options={developerOptions}
              value={bug.assigned_to || ''}
              onChange={(e) => onAssign(bug.id, e.target.value || null)}
            />
          </div>
        )}
      </div>

      {/* Footer Buttons */}
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={onClose} className="flex-1">
          Close
        </Button>
        {canEditThis && (
          <Button onClick={onEdit} className="flex-1">
            Edit Bug
          </Button>
        )}
      </div>
    </div>
  );
};
