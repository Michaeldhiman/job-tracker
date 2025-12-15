import { useMemo, useRef, useState } from 'react';
import { uploadResume } from '../../api/jobsApi.js';

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

function JobTable({ jobs = [], onEdit, onDelete, onJobUpdated, onError }) {
  const fileInputsRef = useRef({});
  const [uploadingId, setUploadingId] = useState(null);
  const [inlineErrors, setInlineErrors] = useState({});

  const jobsWithMemo = useMemo(() => jobs, [jobs]);

  const triggerFilePicker = (jobId) => {
    const input = fileInputsRef.current[jobId];
    if (input) {
      input.value = '';
      input.click();
    }
  };

  const handleFileChange = async (jobId, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('resume', file);

    setUploadingId(jobId);
    setInlineErrors((prev) => ({ ...prev, [jobId]: '' }));

    try {
      const response = await uploadResume(jobId, formData);
      const updatedJob = response.job || response;
      onJobUpdated?.(updatedJob);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to upload resume. Please try again.';
      onError?.(message);

      const resumeError = err.response?.data?.errors?.resume;
      if (resumeError) {
        setInlineErrors((prev) => ({ ...prev, [jobId]: resumeError }));
      }
    } finally {
      setUploadingId(null);
      event.target.value = '';
    }
  };

  if (!jobs.length) {
    return (
      <div className="text-slate-600 text-sm bg-gradient-to-br from-slate-50 to-slate-100 border border-dashed border-slate-300 rounded-xl p-8 text-center">
        <p className="text-lg font-semibold mb-2">📭 No jobs found</p>
        <p>Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
              Company
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
              Role
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
              Applied
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
              Salary
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
              Tags
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {jobsWithMemo.map((job) => (
            <tr key={job._id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 text-sm font-medium text-slate-900">{job.company || '—'}</td>
              <td className="px-6 py-4 text-sm text-slate-700">{job.role || '—'}</td>
              <td className="px-6 py-4 text-sm">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${
                  job.status === 'Applied' ? 'bg-blue-100 text-blue-800' :
                  job.status === 'Interview' ? 'bg-purple-100 text-purple-800' :
                  job.status === 'Offer' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {job.status || '—'}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">
                {formatDate(job.appliedDate || job.createdAt)}
              </td>
              <td className="px-6 py-4 text-sm font-medium text-slate-700">
                {job.salary ? `$${job.salary.toLocaleString()}` : '—'}
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">
                {Array.isArray(job.tags) && job.tags.length
                  ? job.tags.map((tag, i) => (
                      <span key={i} className="inline-block bg-slate-200 text-slate-700 px-2 py-1 rounded text-xs mr-1 mb-1">
                        {tag}
                      </span>
                    ))
                  : '—'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">
                <div className="flex gap-3 items-center">
                  {job.resumeUrl ? (
                    <a
                      href={job.resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View resume
                    </a>
                  ) : (
                    <span className="text-gray-500 text-xs">No resume</span>
                  )}

                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.rtf"
                      className="hidden"
                      ref={(el) => {
                        if (el) fileInputsRef.current[job._id] = el;
                      }}
                      onChange={(event) => handleFileChange(job._id, event)}
                    />
                    <button
                      type="button"
                      className="text-indigo-600 hover:text-indigo-800 disabled:opacity-60"
                      onClick={() => triggerFilePicker(job._id)}
                      disabled={uploadingId === job._id}
                    >
                      {uploadingId === job._id
                        ? 'Uploading...'
                        : job.resumeUrl
                        ? 'Update Resume'
                        : 'Upload Resume'}
                    </button>
                  </div>

                  {inlineErrors[job._id] && (
                    <span className="text-xs text-red-600">{inlineErrors[job._id]}</span>
                  )}

                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-800"
                    onClick={() => onEdit?.(job)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-red-600 hover:text-red-800"
                    onClick={() => onDelete?.(job)}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default JobTable;


