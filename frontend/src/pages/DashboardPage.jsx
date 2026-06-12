import { useEffect, useState } from 'react';
import { getAnalytics, searchJobs } from '../api/jobsApi.js';
import ErrorAlert from '../components/feedback/ErrorAlert.jsx';
import { DashboardStatsSkeleton, ChartSkeleton, InterviewListSkeleton } from '../components/feedback/Skeletons.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card.jsx';
import { Briefcase, Building2, Calendar, Target, Clock, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

function DashboardPage() {
  const [data, setData] = useState({ funnel: [], trends: [], timeMetrics: {} });
  const [interviews, setInterviews] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [analyticsRes, techRes, hrRes, screenRes, recentRes] = await Promise.all([
        getAnalytics(),
        searchJobs({ status: 'Technical', limit: 5 }),
        searchJobs({ status: 'HR', limit: 5 }),
        searchJobs({ status: 'Screening', limit: 5 }),
        searchJobs({ limit: 5 })
      ]);
      const interviewsRes = [
        ...(techRes?.results || []),
        ...(hrRes?.results || []),
        ...(screenRes?.results || [])
      ].sort((a, b) => new Date(b.interviewDate || b.appliedDate) - new Date(a.interviewDate || a.appliedDate)).slice(0, 5);
      
      if (analyticsRes.success) {
        setData(analyticsRes.data);
      }
      setInterviews(interviewsRes || []);
      setRecentJobs(recentRes?.results || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (error) {
    return (
      <div className="p-6">
        <ErrorAlert message={error} />
      </div>
    );
  }

  // Skeleton loading state — shows structure immediately
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text">Dashboard Overview</h1>
            <p className="text-text-muted text-sm">Monitor your job search progress and upcoming interviews.</p>
          </div>
        </div>
        <DashboardStatsSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartSkeleton height="h-80" />
          <InterviewListSkeleton />
        </div>
      </div>
    );
  }

  // Calculate totals from funnel data
  const totalApplications = data.funnel.reduce((acc, curr) => acc + curr.count, 0);
  const offers = data.funnel.find(f => f._id === 'Offer')?.count || 0;
  const interviewStages = ['Screening', 'Technical', 'HR'];
  const interviewsCount = data.funnel
    .filter(f => interviewStages.includes(f._id))
    .reduce((acc, curr) => acc + curr.count, 0);
  const rejections = data.funnel.find(f => f._id === 'Rejected')?.count || 0;
  const avgDays = Math.round(data.timeMetrics?.avgDaysToInterview || 0);

  // Format trends data for Recharts
  const chartData = data.trends.map(t => ({
    name: new Date(t._id.year, t._id.month - 1).toLocaleString('default', { month: 'short' }),
    Applications: t.count
  }));

  // Format funnel data for Recharts
  const funnelData = data.funnel.map(f => ({
    name: f._id,
    count: f.count
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Dashboard Overview</h1>
          <p className="text-text-muted text-sm">Monitor your job search progress and upcoming interviews.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6 flex flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-muted">Total Applications</p>
              <h3 className="text-2xl font-bold text-text">{totalApplications}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-muted">Interviews</p>
              <h3 className="text-2xl font-bold text-text">{interviewsCount}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-muted">Offers Received</p>
              <h3 className="text-2xl font-bold text-text">{offers}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-muted">Avg. Days to Interview</p>
              <h3 className="text-2xl font-bold text-text">{avgDays || '-'} <span className="text-sm font-normal">days</span></h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Application Trends</CardTitle>
            <CardDescription>Number of applications submitted per month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorApplications" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1c1c1f', borderColor: '#ffffff15', borderRadius: '8px' }}
                    itemStyle={{ color: '#e3e1ec' }}
                  />
                  <Area type="monotone" dataKey="Applications" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorApplications)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Interviews</CardTitle>
            <CardDescription>Your next scheduled events</CardDescription>
          </CardHeader>
          <CardContent>
            {interviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="w-10 h-10 text-text-muted mb-3 opacity-50" />
                <p className="text-sm text-text-muted">No upcoming interviews scheduled</p>
              </div>
            ) : (
              <div className="space-y-4">
                {interviews.map(job => (
                  <div key={job._id} className="flex items-start gap-3 p-3 rounded-lg bg-surface hover:bg-surface-elevated transition-colors border border-border">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="font-semibold text-primary">{job.company.charAt(0)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-text truncate">{job.role}</h4>
                      <p className="text-xs text-text-muted truncate">{job.company}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-medium text-amber-500 bg-amber-500/10 px-2 py-1 rounded">
                        {job.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid: Recent Applications and Stage Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>Your latest job applications</CardDescription>
          </CardHeader>
          <CardContent>
            {recentJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Briefcase className="w-10 h-10 text-text-muted mb-3 opacity-50" />
                <p className="text-sm text-text-muted">No applications found</p>
              </div>
            ) : (
              <div className="w-full">
                {/* Mobile Cards */}
                <div className="md:hidden flex flex-col gap-3">
                  {recentJobs.map(job => (
                    <div key={job._id} className="p-4 rounded-xl border border-border bg-surface flex flex-col gap-3 hover:border-primary/30 transition-colors">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <div className="font-bold text-text truncate">{job.role}</div>
                          <div className="text-sm text-text-muted truncate">{job.company}</div>
                        </div>
                        <span className={`shrink-0 inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(job.priority)}`}>
                          {job.priority || 'Medium'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-t border-border/60 pt-3">
                        <span className="text-xs font-medium text-text-muted">
                          {job.appliedDate ? new Date(job.appliedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date'}
                        </span>
                        <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/85 pb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                        <th className="py-3 px-2">Role & Company</th>
                        <th className="py-3 px-2">Date Applied</th>
                        <th className="py-3 px-2">Stage</th>
                        <th className="py-3 px-2">Priority</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 text-sm">
                      {recentJobs.map(job => (
                        <tr key={job._id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3.5 px-2">
                            <div className="font-semibold text-text">{job.role}</div>
                            <div className="text-xs text-text-muted">{job.company}</div>
                          </td>
                          <td className="py-3.5 px-2 text-text-muted">
                            {job.appliedDate ? new Date(job.appliedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                          </td>
                          <td className="py-3.5 px-2">
                            <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold ${getStatusColor(job.status)}`}>
                              {job.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-2">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${getPriorityColor(job.priority)}`}>
                              {job.priority || 'Medium'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stage Distribution</CardTitle>
            <CardDescription>Applications count by status</CardDescription>
          </CardHeader>
          <CardContent>
            {funnelData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Target className="w-10 h-10 text-text-muted mb-3 opacity-50" />
                <p className="text-sm text-text-muted">No data available</p>
              </div>
            ) : (
              <div className="h-[385px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} layout="vertical" margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
                    <XAxis type="number" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} width={100} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1c1c1f', borderColor: '#ffffff15', borderRadius: '8px' }}
                      itemStyle={{ color: '#e3e1ec' }}
                    />
                    <Bar dataKey="count" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helpers for badges styling
const getPriorityColor = (priority) => {
  switch (priority) {
    case 'High': return 'text-rose-400 bg-rose-500/10 border border-rose-500/20';
    case 'Medium': return 'text-amber-400 bg-amber-500/10 border border-amber-500/20';
    default: return 'text-slate-400 bg-slate-500/10 border border-slate-500/20';
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'Offer': return 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20';
    case 'Rejected': return 'text-rose-400 bg-rose-500/10 border border-rose-500/20';
    case 'Wishlist': return 'text-purple-400 bg-purple-500/10 border border-purple-500/20';
    default: return 'text-primary bg-primary/10 border border-primary/20';
  }
};

export default DashboardPage;
