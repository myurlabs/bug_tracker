import React, { useState, useEffect } from 'react';
import { Bug, User, BugPriority, BugStatus } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { usersApi } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Input, TextArea, Select } from '@/components/ui/Input';

interface BugFormProps {
  bug?: Bug | null;
  onSubmit: (data: Partial<Bug>) => Promise<void>;
  onCancel: () => void;
}

export const BugForm: React.FC<BugFormProps> = ({ bug, onSubmit, onCancel }) => {
  const { user, canAssign } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [developers, setDevelopers] = useState<User[]>([]);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: bug?.title || '',
    description: bug?.description || '',
    priority: bug?.priority || 'medium' as BugPriority,
    status: bug?.status || 'open' as BugStatus,
    assigned_to: bug?.assigned_to || '',
  });

  useEffect(() => {
    const fetchDevelopers = async () => {
      const result = await usersApi.getDevelopers();
      if (result.success) {
        setDevelopers(result.data!);
      }
    };
    fetchDevelopers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await onSubmit({
        ...formData,
        assigned_to: formData.assigned_to || null,
        created_by: bug?.created_by || user?.id,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save bug');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const priorityOptions = [
    { value: 'low', label: '🟢 Low' },
    { value: 'medium', label: '🟡 Medium' },
    { value: 'high', label: '🟠 High' },
    { value: 'critical', label: '🔴 Critical' },
  ];

  const statusOptions = [
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'closed', label: 'Closed' },
  ];

  const developerOptions = [
    { value: '', label: 'Unassigned' },
    ...developers.map((dev) => ({
      value: dev.id,
      label: dev.username,
    })),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Title"
        name="title"
        placeholder="Brief description of the bug"
        value={formData.title}
        onChange={handleChange}
        required
      />

      <TextArea
        label="Description"
        name="description"
        placeholder="Detailed description including steps to reproduce, expected behavior, and actual behavior"
        value={formData.description}
        onChange={handleChange}
        rows={4}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Priority"
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          options={priorityOptions}
        />

        {bug && (
          <Select
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={statusOptions}
          />
        )}
      </div>

      {canAssign && (
        <Select
          label="Assign To"
          name="assigned_to"
          value={formData.assigned_to}
          onChange={handleChange}
          options={developerOptions}
        />
      )}

      {error && (
        <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading} className="flex-1">
          {bug ? 'Update Bug' : 'Create Bug'}
        </Button>
      </div>
    </form>
  );
};
