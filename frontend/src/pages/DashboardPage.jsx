import { useEffect, useMemo, useState } from 'react';
import { getStatsMonthly, getStatsSummary } from '../api/jobsApi.js';
import ErrorAlert from '../components/feedback/ErrorAlert.jsx';
import Loader from '../components/feedback/Loader.jsx';
import StatsChart from '../components/stats/StatsChart.jsx';

const statusOrder = ['Applied', 'Interview', 'Offer', 'Rejected'];

function buildSummary(stats = []) {
  const base = { total: 0, Applied: 0, Interview: 0, Offer: 0, Rejected: 0 };

  stats.forEach((item) => {
    const status = item?._id;
    const count = item?.count || 0;
    if (status && base.hasOwnProperty(status)) {
      base[status] = count;
      base.total += count;
    }
  });

  return base;
}

function formatMonthly(stats = []) {
  const data = stats
    .map((item) => {
      const year = item?._id?.year;
      const month = item?._id?.month;
      if (!year || !month) return null;
      const label = new Date(year, month - 1, 1).toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric',
      });
      return { label, count: item?.count || 0, sortKey: `${year}-${String(month).padStart(2, '0')}` };
    })
    .filter(Boolean)
    // Backend returns descending; we want ascending for the chart.
    .sort((a, b) => (a.sortKey > b.sortKey ? 1 : -1));

  return data;
}

function DashboardPage() {
  const [summary, setSummary] = useState({ total: 0, Applied: 0, Interview: 0, Offer: 0, Rejected: 0 });
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const summaryCards = useMemo(
    () => [
      { label: 'Total jobs', value: summary.total },
      ...statusOrder.map((status) => ({
        label: status,
        value: summary[status] || 0,
      })),
    ],
    [summary]
  );

  const loadStats = async () => {
    setLoading(true);
    setError('');

    try {
      const [summaryRes, monthlyRes] = await Promise.all([getStatsSummary(), getStatsMonthly()]);
      setSummary(buildSummary(summaryRes?.stats || []));
      setMonthlyStats(formatMonthly(monthlyRes?.stats || []));
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Failed to load stats. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Dashboard</h1>
          <p className="mt-2 text-slate-600">Track your job search at a glance.</p>
        </div>
        <button
          type="button"
          onClick={loadStats}
          className="px-6 py-3 text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-lg disabled:opacity-50 transition-all duration-200 shadow-md transform hover:-translate-y-0.5"
          disabled={loading}
        >
          {loading ? '🔄 Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      <ErrorAlert message={error} />

      {loading && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <Loader text="Loading stats..." />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {summaryCards.map((card, idx) => (
          <div
            key={card.label}
            className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            style={{
              animation: `slideIn 0.5s ease-out ${idx * 50}ms both`
            }}
          >
            <p className="text-sm font-medium text-slate-600">{card.label}</p>
            <p className="mt-3 text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{card.value}</p>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <StatsChart data={monthlyStats} />
    </div>
  );
}

export default DashboardPage;
