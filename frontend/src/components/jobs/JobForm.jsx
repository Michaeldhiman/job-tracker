import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '../ui/Input.jsx';
import Button from '../ui/Button.jsx';
import ErrorAlert from '../feedback/ErrorAlert.jsx';

const statusOptions = ['Applied', 'Interview', 'Offer', 'Rejected'];

const jobSchema = z.object({
  company: z.string().min(1, 'Company is required'),
  role: z.string().optional(),
  status: z.enum(statusOptions),
  appliedDate: z.string().optional(),
  salary: z.string().optional(),
  tags: z.string().optional(),
  notes: z.string().optional(),
});

function JobForm({ initialData = null, onSubmit, onCancel }) {
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      company: initialData?.company || '',
      role: initialData?.role || '',
      status: initialData?.status || 'Applied',
      appliedDate: initialData?.appliedDate
        ? initialData.appliedDate.split('T')[0]
        : '',
      salary: initialData?.salary ? String(initialData.salary) : '',
      tags: Array.isArray(initialData?.tags) ? initialData.tags.join(', ') : '',
      notes: initialData?.notes || '',
    },
  });

  const handleFormSubmit = async (values) => {
    setServerError('');

    const payload = {
      ...values,
      salary: values.salary ? Number(values.salary) : undefined,
      tags: values.tags
        ? values.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [],
    };

    try {
      await onSubmit(payload, setError, setServerError);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Something went wrong. Please try again.';
      setServerError(message);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(handleFormSubmit)}>
      {serverError && <ErrorAlert message={serverError} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Company *"
          placeholder="Company name"
          error={errors.company?.message}
          {...register('company')}
        />

        <Input
          label="Role"
          placeholder="Job title"
          error={errors.role?.message}
          {...register('role')}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300"
            {...register('status')}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          {errors.status?.message && (
            <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
          )}
        </div>

        <Input
          label="Applied date"
          type="date"
          error={errors.appliedDate?.message}
          {...register('appliedDate')}
        />

        <Input
          label="Salary (optional)"
          type="number"
          min="0"
          step="1000"
          placeholder="e.g. 120000"
          error={errors.salary?.message}
          {...register('salary')}
        />

        <Input
          label="Tags (comma separated)"
          placeholder="Remote, Referral"
          error={errors.tags?.message}
          {...register('tags')}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300"
          rows="3"
          placeholder="Notes about this application"
          {...register('notes')}
        />
        {errors.notes?.message && (
          <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save job'}
        </Button>
        <button
          type="button"
          className="text-sm text-gray-600 hover:text-gray-800"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default JobForm;


