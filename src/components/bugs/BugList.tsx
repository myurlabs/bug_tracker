import React, { useState, useEffect, useCallback } from 'react';
import { Bug, User } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { bugsApi, usersApi } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PriorityBadge, StatusBadge } from '@/components/ui/Badge';
import { BugForm } from './BugForm';
import { BugDetail } from './BugDetail';

interface BugListProps {
  showOnlyMyBugs?: boolean;
}

export const BugList: React.FC<BugListProps> = ({ showOnlyMyBugs = false }) => {
  const { user, canCreate, canDelete, canAssign } = useAuth();
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [developers, setDevelopers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBug, setSelectedBug] = useState<Bug | null>(null);

  // Filter states
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assigned_to: 'all',
    search: '',
  });

  // Sort state
  const [sortBy, setSortBy] = useState<'updated_at' | 'created_at' | 'priority'>('updated_at');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchBugs = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await bugsApi.getAll(filters);
      if (result.success) {
        let filteredBugs = result.data!;
        
        // Filter by user if showing "My Bugs"
        if (showOnlyMyBugs && user) {
          filteredBugs = filteredBugs.filter(
            (bug) => bug.assigned_to === user.id || bug.created_by === user.id
          );
        }

        // Sort bugs
        filteredBugs.sort((a, b) => {
          if (sortBy === 'priority') {
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            const diff = priorityOrder[b.priority] - priorityOrder[a.priority];
            return sortOrder === 'desc' ? diff : -diff;
          }
          const dateA = new Date(a[sortBy]).getTime();
          const dateB = new Date(b[sortBy]).getTime();
          return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });

        setBugs(filteredBugs);
      }
    } catch {
      setError('Failed to load bugs');
    } finally {
      setIsLoading(false);
    }
  }, [filters, showOnlyMyBugs, user, sortBy, sortOrder]);

  useEffect(() => {
    const fetchUsers = async () => {
      const [usersRes, devsRes] = await Promise.all([
        usersApi.getAll(),
        usersApi.getDevelopers(),
      ]);
      if (usersRes.success) setUsers(usersRes.data!);
      if (devsRes.success) setDevelopers(devsRes.data!);
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchBugs();
  }, [fetchBugs]);

  const getUserById = (id: string): User | undefined => {
    return users.find((u) => u.id === id);
  };

  const handleCreateBug = async (data: Partial<Bug>) => {
    const result = await bugsApi.create(data as Omit<Bug, 'id' | 'created_at' | 'updated_at'>, user!);
    if (result.success) {
      setShowCreateModal(false);
      fetchBugs();
    } else {
      throw new Error(result.error);
    }
  };

  const handleUpdateBug = async (data: Partial<Bug>) => {
    if (!selectedBug) return;
    const result = await bugsApi.update(selectedBug.id, data, user!);
    if (result.success) {
      setShowEditModal(false);
      setSelectedBug(null);
      fetchBugs();
    } else {
      throw new Error(result.error);
    }
  };

  const handleDeleteBug = async (bugId: string) => {
    if (!confirm('Are you sure you want to delete this bug?')) return;
    const result = await bugsApi.delete(bugId, user!);
    if (result.success) {
      fetchBugs();
    } else {
      alert(result.error);
    }
  };

  const handleStatusChange = async (bugId: string, status: Bug['status']) => {
    const result = await bugsApi.updateStatus(bugId, status, user!);
    if (result.success) {
      fetchBugs();
    } else {
      alert(result.error);
    }
  };

  const handleAssign = async (bugId: string, developerId: string | null) => {
    const result = await bugsApi.assign(bugId, developerId, user!);
    if (result.success) {
      fetchBugs();
    } else {
      alert(result.error);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'closed', label: 'Closed' },
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priority' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  const developerOptions = [
    { value: 'all', label: 'All Developers' },
    { value: '', label: 'Unassigned' },
    ...developers.map((dev) => ({ value: dev.id, label: dev.username })),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {showOnlyMyBugs ? 'My Bugs' : 'All Bugs'}
          </h1>
          <p className="text-gray-400">
            {bugs.length} bug{bugs.length !== 1 ? 's' : ''} found
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowCreateModal(true)}>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Bug
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Input
            placeholder="Search bugs..."
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          />
          <Select
            options={statusOptions}
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
          />
          <Select
            options={priorityOptions}
            value={filters.priority}
            onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value }))}
          />
          <Select
            options={developerOptions}
            value={filters.assigned_to}
            onChange={(e) => setFilters((prev) => ({ ...prev, assigned_to: e.target.value }))}
          />
          <Select
            options={[
              { value: 'updated_at', label: 'Last Updated' },
              { value: 'created_at', label: 'Created Date' },
              { value: 'priority', label: 'Priority' },
            ]}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          />
        </div>
      </div>

      {/* Bug Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      ) : error ? (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-400">
          {error}
        </div>
      ) : bugs.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-white mb-2">No bugs found</h3>
          <p className="text-gray-400 mb-4">Get started by creating your first bug report</p>
          {canCreate && (
            <Button onClick={() => setShowCreateModal(true)}>Create Bug</Button>
          )}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700 text-left">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Bug</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Assigned To</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {bugs.map((bug) => {
                  const createdBy = getUserById(bug.created_by);
                  const assignedTo = bug.assigned_to ? getUserById(bug.assigned_to) : null;
                  const canEditThis = user?.role === 'admin' || bug.created_by === user?.id || bug.assigned_to === user?.id;

                  return (
                    <tr
                      key={bug.id}
                      className="hover:bg-gray-750 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedBug(bug);
                        setShowDetailModal(true);
                      }}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-medium truncate max-w-xs">{bug.title}</p>
                          <p className="text-gray-500 text-sm">
                            by {createdBy?.username || 'Unknown'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <PriorityBadge priority={bug.priority} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={bug.status} />
                      </td>
                      <td className="px-6 py-4">
                        {assignedTo ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                              style={{ backgroundColor: assignedTo.avatar_color }}
                            >
                              {assignedTo.username.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-gray-300 text-sm">{assignedTo.username}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-400 text-sm">{formatDate(bug.created_at)}</span>
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          {canEditThis && (
                            <button
                              onClick={() => {
                                setSelectedBug(bug);
                                setShowEditModal(true);
                              }}
                              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteBug(bug.id)}
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Bug"
        size="lg"
      >
        <BugForm
          onSubmit={handleCreateBug}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedBug(null);
        }}
        title="Edit Bug"
        size="lg"
      >
        <BugForm
          bug={selectedBug}
          onSubmit={handleUpdateBug}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedBug(null);
          }}
        />
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedBug(null);
        }}
        title="Bug Details"
        size="lg"
      >
        {selectedBug && (
          <BugDetail
            bug={selectedBug}
            users={users}
            developers={developers}
            currentUser={user!}
            canAssign={canAssign}
            onStatusChange={handleStatusChange}
            onAssign={handleAssign}
            onEdit={() => {
              setShowDetailModal(false);
              setShowEditModal(true);
            }}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedBug(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
};
