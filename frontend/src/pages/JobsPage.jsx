import { useEffect, useState } from 'react';
import { getJobs, createJob, updateJob, deleteJob, exportCsv } from '../api/jobsApi.js';
import JobFilters from '../components/jobs/JobFilters.jsx';
import JobTable from '../components/jobs/JobTable.jsx';
import JobForm from '../components/jobs/JobForm.jsx';
import ErrorAlert from '../components/feedback/ErrorAlert.jsx';
import Loader from '../components/feedback/Loader.jsx';
import Button from '../components/ui/Button.jsx';
import useJobsFilters from '../hooks/useJobsFilters.js';

function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [exporting, setExporting] = useState(false);

  const { filters, setFilter, clearFilters, filteredJobs } = useJobsFilters(jobs);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getJobs({ limit: 1000 });
        setJobs(data.jobs || []);
      } catch (err) {
        const message =
          err.response?.data?.message ||
          err.message ||
          'Failed to load jobs. Please try again.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const handleCreate = () => {
    setEditingJob(null);
    setShowForm(true);
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setShowForm(true);
  };

  const handleDelete = async (job) => {
    const confirmed = window.confirm('Delete this job?');
    if (!confirmed) return;

    try {
      await deleteJob(job._id);
      setJobs((prev) => prev.filter((item) => item._id !== job._id));
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to delete job. Please try again.';
      setError(message);
    }
  };

  const handleFormSubmit = async (formData, setFieldError, setServerError) => {
    try {
      if (editingJob) {
        const response = await updateJob(editingJob._id, formData);
        if (response.job) {
          setJobs((prev) =>
            prev.map((job) => (job._id === editingJob._id ? response.job : job))
          );
        }
      } else {
        const response = await createJob(formData);
        if (response.job) {
          setJobs((prev) => [response.job, ...prev]);
        }
      }

      setShowForm(false);
      setEditingJob(null);
    } catch (err) {
      const data = err.response?.data;
      if (data?.message) {
        setServerError(data.message);
      } else {
        setServerError(err.message || 'Something went wrong.');
      }

      if (data?.errors) {
        Object.entries(data.errors).forEach(([field, message]) => {
          setFieldError(field, { type: 'server', message });
        });
      }
    }
  };

  const handleJobUpdated = (updatedJob) => {
    if (!updatedJob?._id) return;
    setJobs((prev) => prev.map((job) => (job._id === updatedJob._id ? updatedJob : job)));
  };

  const handleResumeError = (message) => {
    setError(message);
  };

  const handleExportCsv = async () => {
    const params = {};
    if (filters.status && filters.status !== 'all') {
      params.status = filters.status;
    }
    if (filters.search?.trim()) {
      params.search = filters.search.trim();
    }

    try {
      setExporting(true);
      setError('');
      const blob = await exportCsv(params);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'jobs.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Failed to export CSV. Please try again.';
      setError(message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">💼 Jobs</h1>
          <p className="mt-2 text-slate-600">Manage and filter your job applications.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <Button onClick={handleExportCsv} disabled={exporting} className="w-full sm:w-auto flex items-center justify-center gap-2">
            {exporting ? '📥 Downloading...' : '📥 Export CSV'}
          </Button>
          <Button onClick={handleCreate} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
            ➕ Add job
          </Button>
        </div>
      </div>

      <ErrorAlert message={error} />

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {editingJob ? '✏️ Edit job' : '➕ Add a job'}
            </h2>
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600 transition text-2xl"
              onClick={() => {
                setShowForm(false);
                setEditingJob(null);
              }}
            >
              ✕
            </button>
          </div>

          <JobForm
            initialData={editingJob}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingJob(null);
            }}
          />
        </div>
      )}

      <JobFilters filters={filters} onChange={setFilter} onClear={clearFilters} />

      <div className="min-h-[200px]">
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <Loader text="Loading jobs..." />
          </div>
        ) : !jobs.length ? (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 text-center space-y-3">
            <p className="text-lg font-semibold text-gray-900">No jobs yet</p>
            <p className="text-sm text-gray-600">
              No jobs yet — click “Add job” to create your first one.
            </p>
            <div className="flex justify-center">
              <Button onClick={handleCreate}>Add your first job</Button>
            </div>
          </div>
        ) : (
          <JobTable
            jobs={filteredJobs}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onJobUpdated={handleJobUpdated}
            onError={handleResumeError}
          />
        )}
      </div>
    </div>
  );
}

export default JobsPage;

