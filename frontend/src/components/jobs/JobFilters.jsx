import Button from '../ui/Button.jsx';

import { PIPELINE_STATUSES } from '../../utils/constants.js';

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  ...PIPELINE_STATUSES.map(s => ({ value: s, label: s }))
];

const priorityOptions = [
  { value: 'all', label: 'All Priorities' },
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
];

const sourceOptions = [
  { value: 'all', label: 'All Sources' },
  { value: 'LinkedIn', label: 'LinkedIn' },
  { value: 'Naukri', label: 'Naukri' },
  { value: 'Referral', label: 'Referral' },
  { value: 'Career Page', label: 'Career Page' },
  { value: 'Indeed', label: 'Indeed' },
  { value: 'Internshala', label: 'Internshala' },
  { value: 'Other', label: 'Other' },
];

function JobFilters({ filters, onChange, onClear }) {
  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-xl p-4 shadow-glass mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4 items-end">
        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-xs font-semibold text-text-muted">
            Status
          </label>
          <select
            className="flex h-10 w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-text transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
            value={filters.status}
            onChange={(e) => onChange('status', e.target.value)}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-neutral-900 text-white">
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-xs font-semibold text-text-muted">
            Priority
          </label>
          <select
            className="flex h-10 w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-text transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
            value={filters.priority}
            onChange={(e) => onChange('priority', e.target.value)}
          >
            {priorityOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-neutral-900 text-white">
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-xs font-semibold text-text-muted">
            Source
          </label>
          <select
            className="flex h-10 w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-text transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
            value={filters.source}
            onChange={(e) => onChange('source', e.target.value)}
          >
            {sourceOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-neutral-900 text-white">
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Button 
            type="button" 
            variant="secondary"
            className="w-full h-10 text-xs font-semibold text-text hover:text-white" 
            onClick={onClear}
          >
            Clear Filters
          </Button>
        </div>
      </div>
    </div>
  );
}

export default JobFilters;
