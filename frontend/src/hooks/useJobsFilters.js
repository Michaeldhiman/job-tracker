import { useMemo, useState } from 'react';

const defaultFilters = {
  search: '',
  status: 'all',
};

function useJobsFilters(jobs = []) {
  const [filters, setFilters] = useState(defaultFilters);

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
  };

  const filteredJobs = useMemo(() => {
    const { search, status } = filters;
    return jobs.filter((job) => {
      const matchesStatus = status === 'all' ? true : job.status === status;

      const term = search.trim().toLowerCase();
      const matchesSearch = term
        ? (job.company || '').toLowerCase().includes(term) ||
          (job.role || '').toLowerCase().includes(term)
        : true;

      return matchesStatus && matchesSearch;
    });
  }, [jobs, filters]);

  return {
    filters,
    setFilter,
    clearFilters,
    filteredJobs,
  };
}

export default useJobsFilters;


