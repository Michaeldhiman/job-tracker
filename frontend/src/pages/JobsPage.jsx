import { useEffect, useState } from 'react';
import { searchJobs } from '../api/jobsApi.js';
import ErrorAlert from '../components/feedback/ErrorAlert.jsx';
import Loader from '../components/feedback/Loader.jsx';
import Button from '../components/ui/Button.jsx';
import KanbanBoard from '../components/jobs/KanbanBoard.jsx';
import { Plus, Search, Filter } from 'lucide-react';
import Input from '../components/ui/Input.jsx';
import AddJobModal from '../components/jobs/AddJobModal.jsx';
import JobDetailsModal from '../components/jobs/JobDetailsModal.jsx';

function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddJob, setShowAddJob] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await searchJobs({ q: searchTerm, limit: 1000 });
      setJobs(data.results || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Basic debounce for search
    const delayDebounceFn = setTimeout(() => {
      fetchJobs();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleJobClick = (job) => {
    setSelectedJob(job);
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Kanban Board</h1>
          <p className="text-sm text-text-muted mt-1">Manage and track your job applications through the pipeline.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search jobs..."
              className="pl-9 h-9"
            />
          </div>
          <Button variant="secondary" className="h-9 px-3">
            <Filter className="w-4 h-4 mr-2" /> Filter
          </Button>
          <Button className="h-9" onClick={() => setShowAddJob(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Job
          </Button>
        </div>
      </div>

      <ErrorAlert message={error} />

      <div className="flex-1 min-h-0 bg-background/50 rounded-lg">
        {loading && !jobs.length ? (
          <div className="h-full flex items-center justify-center">
            <Loader text="Loading pipeline..." />
          </div>
        ) : (
          <KanbanBoard initialJobs={jobs} onJobClick={handleJobClick} />
        )}
      </div>

      <AddJobModal 
        isOpen={showAddJob} 
        onClose={() => setShowAddJob(false)} 
        onSuccess={() => {
          setShowAddJob(false);
          fetchJobs();
        }} 
      />

      <JobDetailsModal
        isOpen={!!selectedJob}
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        onSuccess={() => {
          setSelectedJob(null);
          fetchJobs();
        }}
      />
    </div>
  );
}

export default JobsPage;

