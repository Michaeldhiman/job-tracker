import { useEffect, useState } from 'react';
import { getAnalytics } from '../api/jobsApi.js';
import { AnalyticsSkeleton } from '../components/feedback/Skeletons.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card.jsx';
import { TrendingUp, TrendingDown, Target, BarChart3, PieChart as PieChartIcon, Activity, FileText } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4', '#84cc16', '#ec4899'];

const STATUS_ORDER = ['Wishlist', 'Applied', 'OA', 'Screening', 'Technical', 'HR', 'Offer', 'Rejected'];

function KPICard({ label, value, suffix = '', icon: Icon, color = 'text-primary' }) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`w-11 h-11 rounded-lg bg-${color.replace('text-', '')}/10 flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
          <h3 className="text-xl font-bold text-text mt-0.5">{value}{suffix && <span className="text-sm font-normal text-text-muted ml-1">{suffix}</span>}</h3>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="h-80 flex flex-col items-center justify-center text-text-muted">
      <BarChart3 className="w-12 h-12 mb-3 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await getAnalytics();
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Activity className="w-12 h-12 text-rose-500 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-text mb-2">Unable to load analytics</h3>
            <p className="text-sm text-text-muted">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data || !data.funnel?.length) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Analytics</h1>
          <p className="text-sm text-text-muted mt-1">Deep dive into your job search performance.</p>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-semibold text-text mb-2">No data yet</h3>
            <p className="text-sm text-text-muted max-w-sm mx-auto">Start adding job applications to see your analytics and conversion metrics here.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Compute KPIs
  const total = data.funnel.reduce((s, f) => s + f.count, 0);
  const offers = data.funnel.find(f => f._id === 'Offer')?.count || 0;
  const rejected = data.funnel.find(f => f._id === 'Rejected')?.count || 0;
  const interviewStages = ['Screening', 'Technical', 'HR'];
  const interviewCount = data.funnel.filter(f => interviewStages.includes(f._id)).reduce((s, f) => s + f.count, 0);
  const applied = data.funnel.find(f => f._id === 'Applied')?.count || 0;

  const responseRate = total > 0 ? Math.round(((total - applied - (data.funnel.find(f => f._id === 'Wishlist')?.count || 0)) / total) * 100) : 0;
  const interviewRate = total > 0 ? Math.round((interviewCount / total) * 100) : 0;
  const offerRate = total > 0 ? Math.round((offers / total) * 100) : 0;
  const rejectionRate = total > 0 ? Math.round((rejected / total) * 100) : 0;

  // Format funnel for horizontal bar
  const funnelData = STATUS_ORDER
    .map(status => {
      const found = data.funnel.find(f => f._id === status);
      return { name: status, count: found?.count || 0 };
    })
    .filter(d => d.count > 0);

  // Pie chart data
  const pieData = data.funnel.map(f => ({ name: f._id, value: f.count })).sort((a, b) => b.value - a.value);

  // Monthly trends
  const trendsData = (data.trends || []).map(t => ({
    name: new Date(t._id.year, t._id.month - 1).toLocaleString('default', { month: 'short', year: '2-digit' }),
    Applications: t.count
  }));

  // Conversion funnel (sequential)
  const conversionStages = [
    { name: 'Applied', count: (data.funnel.find(f => f._id === 'Applied')?.count || 0) + interviewCount + offers },
    { name: 'Screening', count: (data.funnel.find(f => f._id === 'Screening')?.count || 0) + (data.funnel.find(f => f._id === 'Technical')?.count || 0) + (data.funnel.find(f => f._id === 'HR')?.count || 0) + offers },
    { name: 'Interview', count: (data.funnel.find(f => f._id === 'Technical')?.count || 0) + (data.funnel.find(f => f._id === 'HR')?.count || 0) + offers },
    { name: 'Offer', count: offers },
  ].filter(s => s.count > 0);

  const avgDays = Math.round(data.timeMetrics?.avgDaysToInterview || 0);
  const resumeStats = data.resumeStats || { totalResumes: 0, totalStorage: 0, mostUsedResume: null, resumeUsage: [] };

  const customTooltipStyle = { backgroundColor: '#1c1c1f', borderColor: '#ffffff15', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">Analytics</h1>
        <p className="text-sm text-text-muted mt-1">Deep dive into your job search performance.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard label="Total" value={total} icon={BarChart3} color="text-primary" />
        <KPICard label="Response Rate" value={responseRate} suffix="%" icon={TrendingUp} color="text-emerald-500" />
        <KPICard label="Interview Rate" value={interviewRate} suffix="%" icon={Activity} color="text-amber-500" />
        <KPICard label="Offer Rate" value={offerRate} suffix="%" icon={Target} color="text-emerald-500" />
        <KPICard label="Rejection Rate" value={rejectionRate} suffix="%" icon={TrendingDown} color="text-rose-500" />
        <KPICard label="Avg to Interview" value={avgDays || '—'} suffix={avgDays ? 'days' : ''} icon={Activity} color="text-blue-500" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Funnel</CardTitle>
            <CardDescription>Distribution of jobs across statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {funnelData.length === 0 ? <EmptyChart message="No pipeline data" /> : (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" horizontal vertical={false} />
                    <XAxis type="number" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} width={80} />
                    <Tooltip cursor={{ fill: '#ffffff05' }} contentStyle={customTooltipStyle} itemStyle={{ color: '#e3e1ec' }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {funnelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Proportion of each application status</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? <EmptyChart message="No status data" /> : (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={customTooltipStyle} itemStyle={{ color: '#e3e1ec' }} />
                    <Legend wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Applications</CardTitle>
            <CardDescription>Application volume over time</CardDescription>
          </CardHeader>
          <CardContent>
            {trendsData.length === 0 ? <EmptyChart message="No trend data yet" /> : (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                    <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={customTooltipStyle} itemStyle={{ color: '#e3e1ec' }} />
                    <Area type="monotone" dataKey="Applications" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorApps)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>How applications progress through stages</CardDescription>
          </CardHeader>
          <CardContent>
            {conversionStages.length === 0 ? <EmptyChart message="No conversion data" /> : (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={conversionStages} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                    <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={customTooltipStyle} itemStyle={{ color: '#e3e1ec' }} />
                    <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]}>
                      {conversionStages.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                      ))}
                    </Bar>
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

export default AnalyticsPage;
