import Input from '../ui/Input.jsx';
import Button from '../ui/Button.jsx';

const statusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'Applied', label: 'Applied' },
  { value: 'Interview', label: 'Interview' },
  { value: 'Offer', label: 'Offer' },
  { value: 'Rejected', label: 'Rejected' },
];

function JobFilters({ filters, onChange, onClear }) {
  return (
    <div className="bg-gradient-to-br from-white/80 via-slate-50/80 to-blue-50/50 border border-slate-200/60 backdrop-blur-md rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <Input
          label="Search"
          placeholder="Search by company or role"
          value={filters.search}
          onChange={(e) => onChange('search', e.target.value)}
        />

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Status
          </label>
          <select
            className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300 bg-white/70 hover:bg-white hover:border-blue-400 backdrop-blur-sm"
            value={filters.status}
            onChange={(e) => onChange('status', e.target.value)}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <Button type="button" className="w-full" onClick={onClear}>
            🔍 Clear filters
          </Button>
        </div>
      </div>
    </div>
  );
}

export default JobFilters;


