import { useEffect, useState } from 'react';
import { getAnalytics, searchJobs } from '../api/jobsApi.js';
import ErrorAlert from '../components/feedback/ErrorAlert.jsx';
import { DashboardStatsSkeleton } from '../components/feedback/Skeletons.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card.jsx';
import { Briefcase, Calendar, Target, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import JobDetailsModal from '../components/jobs/JobDetailsModal.jsx';

function DashboardPage() {
  const [data, setData] = useState({ funnel: [], trends: [], timeMetrics: {} });
  const [interviews, setInterviews] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showStale, setShowStale] = useState(false);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [analyticsRes, activeJobsRes, recentRes] = await Promise.all([
        getAnalytics(),
        searchJobs({ status: 'Applied,Assessment,Interview,Offer', limit: 100 }),
        searchJobs({ limit: 5 })
      ]);
      
      const allActiveJobs = activeJobsRes?.results || [];
      
      if (analyticsRes.success) {
        setData(analyticsRes.data);
      }
      setInterviews(allActiveJobs);
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
          {/* Pipeline Health skeleton */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4 animate-pulse">
            <div className="h-4 w-32 bg-surface rounded" />
            <div className="h-3 w-48 bg-surface rounded" />
            {[100, 60, 35, 15, 25].map((w, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between">
                  <div className="h-3 w-20 bg-surface rounded" />
                  <div className="h-3 w-8 bg-surface rounded" />
                </div>
                <div className="h-1.5 bg-surface rounded-full">
                  <div className="h-full bg-surface-elevated rounded-full" style={{ width: `${w}%` }} />
                </div>
              </div>
            ))}
          </div>
          {/* Active jobs skeleton */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 space-y-4 animate-pulse">
            <div className="h-4 w-44 bg-surface rounded" />
            <div className="h-3 w-64 bg-surface rounded" />
            {[1,2,3,4].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-surface">
                <div className="w-9 h-9 rounded-full bg-surface-elevated shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-36 bg-surface-elevated rounded" />
                  <div className="h-2.5 w-24 bg-surface-elevated rounded" />
                </div>
                <div className="h-5 w-20 bg-surface-elevated rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Derived metrics ─────────────────────────────────────────────────────────
  const sm = Object.fromEntries((data.funnel || []).map(f => [f._id, f.count]));
  const totalApplications = Object.values(sm).reduce((a, b) => a + b, 0);

  // Operational KPIs (pipeline-health, not rates)
  const appliedCount    = sm['Applied']    || 0;
  const inAssessment    = sm['Assessment'] || 0;
  const activeInterviews = sm['Interview'] || 0;
  const offers          = sm['Offer']      || 0;
  const rejections      = sm['Rejected']   || 0;
  const activePipeline  = appliedCount + inAssessment + activeInterviews; // jobs still in play
  const rejectionRate   = totalApplications > 0 ? Math.round((rejections / totalApplications) * 100) : 0;

  // Categorize active jobs and stale applications
  const categories = {
    offerDeadlines: [],
    upcomingInterviews: [],
    pendingAssessments: [],
    overdueFollowUps: [],
    staleApplications: []
  };

  interviews.forEach(job => {
    const days = getDaysWaiting(job);
    
    // Status-specific stale check
    let isStale = false;
    if (job.status === 'Applied') {
      isStale = days >= 30;
    } else if (job.status === 'Assessment') {
      isStale = days >= 45;
    } else if (job.status === 'Interview') {
      isStale = days >= 21;
    } // Offer is never stale

    if (isStale) {
      categories.staleApplications.push(job);
      return;
    }

    if (job.status === 'Offer') {
      categories.offerDeadlines.push(job);
    } else if (job.status === 'Interview') {
      const isFuture = job.interviewDate && new Date(job.interviewDate) > new Date();
      if (isFuture) {
        categories.upcomingInterviews.push(job);
      } else {
        categories.overdueFollowUps.push(job);
      }
    } else if (job.status === 'Assessment') {
      categories.pendingAssessments.push(job);
    } else if (job.status === 'Applied') {
      if (days >= 7) {
        categories.overdueFollowUps.push(job);
      }
    }
  });

  // Sort categories
  categories.offerDeadlines.sort((a, b) => getDaysWaiting(b) - getDaysWaiting(a));
  categories.upcomingInterviews.sort((a, b) => new Date(a.interviewDate) - new Date(b.interviewDate));
  categories.pendingAssessments.sort((a, b) => getDaysWaiting(b) - getDaysWaiting(a));
  categories.overdueFollowUps.sort((a, b) => getDaysWaiting(b) - getDaysWaiting(a));
  categories.staleApplications.sort((a, b) => getDaysWaiting(b) - getDaysWaiting(a));

  const hasActiveActions = 
    categories.offerDeadlines.length > 0 ||
    categories.upcomingInterviews.length > 0 ||
    categories.pendingAssessments.length > 0 ||
    categories.overdueFollowUps.length > 0;

  const renderJobCard = (job, categoryType) => {
    const action = getActionLabel(job);
    const days = getDaysWaiting(job);

    // Dynamic styles based on status/category
    let borderClass = 'border-border bg-surface hover:border-primary/30 hover:bg-surface-elevated';
    let glowDotClass = 'w-1.5 h-1.5 rounded-full shrink-0 ';
    
    if (job.status === 'Offer') {
      const expiringSoon = job.followUpDate && Math.ceil((new Date(job.followUpDate) - new Date()) / 86400000) <= 2;
      borderClass = expiringSoon 
        ? 'border-rose-500/25 bg-rose-500/[0.02] hover:border-rose-500/40 hover:bg-rose-500/[0.04]' 
        : 'border-emerald-500/20 bg-emerald-500/[0.01] hover:border-emerald-500/40 hover:bg-emerald-500/[0.03]';
      glowDotClass += 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]';
    } else if (categoryType === 'interview') {
      borderClass = 'border-blue-500/20 bg-blue-500/[0.01] hover:border-blue-500/40 hover:bg-blue-500/[0.03]';
      glowDotClass += 'bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.7)]';
    } else if (categoryType === 'assessment') {
      const expiringSoon = job.followUpDate && Math.ceil((new Date(job.followUpDate) - new Date()) / 86400000) <= 2;
      borderClass = expiringSoon 
        ? 'border-rose-500/25 bg-rose-500/[0.02] hover:border-rose-500/40 hover:bg-rose-500/[0.04]'
        : 'border-purple-500/20 bg-purple-500/[0.01] hover:border-purple-500/40 hover:bg-purple-500/[0.03]';
      glowDotClass += 'bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.7)]';
    } else if (categoryType === 'followup') {
      borderClass = days >= 14 
        ? 'border-rose-500/25 bg-rose-500/[0.02] hover:border-rose-500/40 hover:bg-rose-500/[0.04]'
        : 'border-amber-500/20 bg-amber-500/[0.01] hover:border-amber-500/40 hover:bg-amber-500/[0.03]';
      glowDotClass += 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.7)]';
    } else {
      glowDotClass += 'bg-zinc-400';
    }

    return (
      <div 
        key={job._id}
        onClick={() => setSelectedJob(job)}
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 rounded-xl border transition-all duration-300 hover:scale-[1.01] hover:shadow-md cursor-pointer ${borderClass}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Company Initial Circle */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-sm"
            style={{ backgroundColor: charColor(job.company) }}
          >
            {job.company.charAt(0).toUpperCase()}
          </div>
          
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-semibold text-text truncate leading-snug">
              {job.role}
            </h4>
            <p className="text-[10px] text-text-muted mt-0.5 truncate">{job.company}</p>
            
            {/* Action Label */}
            <div className="flex items-center gap-1.5 mt-1">
              <span className={glowDotClass} />
              <span className={`text-[10px] font-medium truncate ${action.iconClass || action.colorClass}`}>
                {action.text}
              </span>
            </div>
          </div>
        </div>
        
        {/* Right side info (dates / time details, or status and days waiting) */}
        <div className="flex items-center gap-2 sm:justify-end shrink-0 pl-10 sm:pl-0">
          {categoryType === 'interview' && job.interviewDate ? (
            <span className="text-[9.5px] text-blue-400 font-semibold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 flex items-center gap-1">
              📅 {formatInterviewDateTime(job.interviewDate)}
            </span>
          ) : (
            <>
              <span className="text-[9.5px] text-text-muted font-medium">
                {days === 0 ? 'today' : `${days}d waiting`}
              </span>
              <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded ${getStatusColor(job.status)}`}>
                {job.status}
              </span>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-6">
      {/* Dashboard Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-text via-text to-text-muted bg-clip-text text-transparent">
            Dashboard Overview
          </h1>
          <p className="text-text-muted text-sm">Your live pipeline status and what needs attention today.</p>
        </div>
      </div>

      {/* Main 2-Column Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2/3 width) - KPIs & Action Center */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* Active Pipeline */}
            <Card className="hover:scale-[1.02] hover:shadow-xl hover:border-primary/20 transition-all duration-300">
              <CardContent className="p-4 flex flex-row items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                  <Briefcase className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Active</p>
                  <h3 className="text-xl font-bold text-text mt-0.5 leading-none">{activePipeline}</h3>
                  <p className="text-[9.5px] text-text-muted mt-1 truncate">in progress</p>
                </div>
              </CardContent>
            </Card>

            {/* In Assessment */}
            <Card className="hover:scale-[1.02] hover:shadow-xl hover:border-purple-500/20 transition-all duration-300">
              <CardContent className="p-4 flex flex-row items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                  <AlertCircle className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Tests</p>
                  <h3 className="text-xl font-bold text-text mt-0.5 leading-none">{inAssessment}</h3>
                  <p className="text-[9.5px] text-text-muted mt-1 truncate">assessments</p>
                </div>
              </CardContent>
            </Card>

            {/* Active Interviews */}
            <Card className="hover:scale-[1.02] hover:shadow-xl hover:border-amber-500/20 transition-all duration-300">
              <CardContent className="p-4 flex flex-row items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
                  <Calendar className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Interviews</p>
                  <h3 className="text-xl font-bold text-text mt-0.5 leading-none">{activeInterviews}</h3>
                  <p className="text-[9.5px] text-text-muted mt-1 truncate">scheduled / rounds</p>
                </div>
              </CardContent>
            </Card>

            {/* Rejection Rate */}
            <Card className={`hover:scale-[1.02] hover:shadow-xl transition-all duration-300 ${rejectionRate > 50 ? 'hover:border-rose-500/20' : 'hover:border-emerald-500/20'}`}>
              <CardContent className="p-4 flex flex-row items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${rejectionRate > 50 ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                  <Target className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Rejections</p>
                  <h3 className={`text-xl font-bold mt-0.5 leading-none ${rejectionRate > 50 ? 'text-rose-400' : 'text-text'}`}>
                    {rejectionRate}<span className="text-xs font-normal text-text-muted ml-0.5">%</span>
                  </h3>
                  <p className="text-[9.5px] text-text-muted mt-1 truncate">{rejections} rejected</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Center Card */}
          <Card className="hover:border-primary/10 transition-all duration-300 shadow-md">
            <CardHeader className="pb-3 border-b border-border/40 bg-surface-elevated/20">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg font-bold text-text">Action Center</CardTitle>
              </div>
              <CardDescription>
                Urgent actions and follow-ups categorized by priority
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
              {/* Active Action Categories */}
              {!hasActiveActions ? (
                <div className="flex flex-col items-center justify-center py-10 text-center bg-surface/20 border border-dashed border-border rounded-xl">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2.5" />
                  <p className="text-sm font-semibold text-text">No actions required.</p>
                  <p className="text-xs text-text-muted mt-0.5">You're up to date on all active applications.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* 1. Offer Deadlines */}
                  {categories.offerDeadlines.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
                        Offer Deadlines ({categories.offerDeadlines.length})
                      </h4>
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1.5 custom-scrollbar">
                        {categories.offerDeadlines.map(job => renderJobCard(job, 'offer'))}
                      </div>
                    </div>
                  )}

                  {/* 2. Upcoming Interviews */}
                  {categories.upcomingInterviews.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.7)]" />
                        Upcoming Interviews ({categories.upcomingInterviews.length})
                      </h4>
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1.5 custom-scrollbar">
                        {categories.upcomingInterviews.map(job => renderJobCard(job, 'interview'))}
                      </div>
                    </div>
                  )}

                  {/* 3. Pending Assessments */}
                  {categories.pendingAssessments.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.7)]" />
                        Pending Assessments ({categories.pendingAssessments.length})
                      </h4>
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1.5 custom-scrollbar">
                        {categories.pendingAssessments.map(job => renderJobCard(job, 'assessment'))}
                      </div>
                    </div>
                  )}

                  {/* 4. Overdue Follow-Ups */}
                  {categories.overdueFollowUps.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.7)]" />
                        Overdue Follow-Ups ({categories.overdueFollowUps.length})
                      </h4>
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1.5 custom-scrollbar">
                        {categories.overdueFollowUps.map(job => renderJobCard(job, 'followup'))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Collapsible Stale Section */}
              {categories.staleApplications.length > 0 && (
                <div className="pt-4 border-t border-border/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                      Stale Applications ({categories.staleApplications.length})
                    </h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowStale(!showStale);
                      }}
                      className="text-[10px] font-bold text-primary hover:text-primary-hover transition-colors px-2 py-0.5 rounded-md hover:bg-white/5 cursor-pointer"
                    >
                      {showStale ? 'Hide Stale' : 'Show Stale'}
                    </button>
                  </div>
                  
                  {showStale && (
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1.5 custom-scrollbar animate-all duration-300">
                      {categories.staleApplications.map(job => (
                        <div 
                          key={job._id}
                          onClick={() => setSelectedJob(job)}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 rounded-xl border border-border/40 bg-surface/20 opacity-70 hover:opacity-100 hover:border-border/70 transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-xs opacity-60"
                              style={{ backgroundColor: charColor(job.company) }}
                            >
                              {job.company.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-semibold text-text-muted truncate leading-snug">
                                {job.role}
                              </h4>
                              <p className="text-[10px] text-text-muted mt-0.5 truncate">{job.company}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[9.5px] text-text-muted font-medium">
                                  💤 Ghosted / Likely Inactive (waiting {getDaysWaiting(job)}d)
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 sm:justify-end shrink-0 pl-10 sm:pl-0">
                            <span className="text-[9.5px] text-text-muted">
                              {getDaysWaiting(job)}d waiting
                            </span>
                            <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded opacity-60 ${getStatusColor(job.status)}`}>
                              {job.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1/3 width) - Pipeline Health & Recent Applications */}
        <div className="space-y-6">
          
          {/* Pipeline Health */}
          <Card className="hover:border-primary/10 transition-all duration-300 shadow-md">
            <CardHeader className="pb-3 border-b border-border/40 bg-surface-elevated/20">
              <CardTitle className="text-base font-bold">Pipeline Health</CardTitle>
              <CardDescription>Distribution across all active stages</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {[
                { label: 'Applied', count: appliedCount, color: '#6366f1' },
                { label: 'Assessment', count: inAssessment, color: '#a855f7' },
                { label: 'Interview', count: activeInterviews, color: '#f59e0b' },
                { label: 'Offer', count: offers, color: '#10b981' },
              ].map(s => {
                const pct = totalApplications > 0 ? Math.round((s.count / totalApplications) * 100) : 0;
                return (
                  <div key={s.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="text-xs font-semibold text-text">{s.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-text-muted">{pct}%</span>
                        <span className="text-xs font-bold text-text w-6 text-right">{s.count}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: s.color }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="pt-3 border-t border-border/40 flex justify-between text-xs text-text-muted">
                <span>Rejected / Closed</span>
                <span className="font-bold text-rose-400">{rejections}</span>
              </div>
              <div className="pt-1.5 flex justify-between text-xs text-text-muted">
                <span>Total Applications</span>
                <span className="font-bold text-text">{totalApplications}</span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Applications */}
          <Card className="hover:border-primary/10 transition-all duration-300 shadow-md">
            <CardHeader className="pb-3 border-b border-border/40 bg-surface-elevated/20">
              <CardTitle className="text-base font-bold">Recent Applications</CardTitle>
              <CardDescription>Your latest job applications</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {recentJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-surface/20 border border-dashed border-border rounded-xl">
                  <Briefcase className="w-8 h-8 text-text-muted mb-2.5 opacity-25" />
                  <p className="text-xs text-text-muted">No applications found</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1.5 custom-scrollbar">
                  {recentJobs.map(job => (
                    <div 
                      key={job._id} 
                      onClick={() => setSelectedJob(job)}
                      className="p-3 rounded-xl border border-border bg-surface/30 flex flex-col gap-2.5 hover:border-primary/30 transition-all cursor-pointer hover:bg-surface-elevated hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-text truncate leading-tight">{job.role}</div>
                          <div className="text-[10px] text-text-muted truncate mt-0.5">{job.company}</div>
                        </div>
                        <span className={`shrink-0 inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${getPriorityColor(job.priority)}`}>
                          {job.priority || 'Medium'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-t border-border/40 pt-2">
                        <span className="text-[10px] font-medium text-text-muted">
                          {job.appliedDate ? new Date(job.appliedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date'}
                        </span>
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      <JobDetailsModal
        isOpen={!!selectedJob}
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        onEdit={(job) => {
          setSelectedJob(null);
          window.location.href = '/jobs';
        }}
        onSuccess={() => {
          setSelectedJob(null);
          loadDashboardData();
        }}
        onJobUpdated={(updates) => {
          setSelectedJob(prev => prev ? { ...prev, ...updates } : null);
          loadDashboardData();
        }}
      />
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
    case 'Assessment': return 'text-purple-400 bg-purple-500/10 border border-purple-500/20';
    case 'Interview': return 'text-orange-400 bg-orange-500/10 border border-orange-500/20';
    default: return 'text-primary bg-primary/10 border border-primary/20';
  }
};

const charColor = (company) => {
  if (!company) return '#6366f1';
  let hash = 0;
  for (let i = 0; i < company.length; i++) {
    hash = company.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 60%, 45%)`;
};

const getDaysWaiting = (job) => {
  if (!job.appliedDate && !job.createdAt) return 0;
  if (!job.history || job.history.length === 0) {
    return Math.max(0, Math.floor((Date.now() - new Date(job.appliedDate || job.createdAt)) / 86400000));
  }
  const currentHist = [...job.history].reverse().find(h => h.status === job.status);
  const date = currentHist ? new Date(currentHist.at) : new Date(job.appliedDate || job.createdAt);
  return Math.max(0, Math.floor((Date.now() - date) / 86400000));
};

const formatInterviewDateTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const timeString = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  
  if (date.toDateString() === today.toDateString()) {
    return `Today at ${timeString}`;
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow at ${timeString}`;
  } else {
    const options = { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
    return date.toLocaleDateString(undefined, options);
  }
};

const getActionLabel = (job) => {
  const days = getDaysWaiting(job);

  if (job.status === 'Offer') {
    if (job.followUpDate) {
      const diffTime = new Date(job.followUpDate) - new Date();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return { text: 'Offer deadline passed', iconClass: 'text-rose-500 font-medium' };
      if (diffDays === 0) return { text: 'Offer expires today', iconClass: 'text-rose-500 font-bold animate-pulse' };
      if (diffDays === 1) return { text: 'Offer expires tomorrow', iconClass: 'text-rose-400 font-semibold' };
      return { text: `Offer expires in ${diffDays} days`, iconClass: 'text-amber-400' };
    }
    return { text: 'Review & respond to offer letter', iconClass: 'text-emerald-400' };
  }

  if (job.status === 'Interview') {
    const isFuture = job.interviewDate && new Date(job.interviewDate) > new Date();
    if (isFuture) {
      return { text: 'Interview scheduled', iconClass: 'text-blue-400' };
    }
    if (days >= 4) {
      return { text: 'Follow-up recommended (completed interview)', iconClass: 'text-rose-400' };
    }
    return { text: 'Send thank-you email & await feedback', iconClass: 'text-emerald-400' };
  }

  if (job.status === 'Assessment') {
    if (job.followUpDate) {
      const diffTime = new Date(job.followUpDate) - new Date();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return { text: 'Assessment deadline passed', iconClass: 'text-rose-500 font-medium' };
      if (diffDays === 0) return { text: 'Assessment due today', iconClass: 'text-rose-500 font-bold animate-pulse' };
      if (diffDays === 1) return { text: 'Assessment due tomorrow', iconClass: 'text-rose-400 font-semibold' };
      return { text: `Assessment due in ${diffDays} days`, iconClass: 'text-amber-400' };
    }
    if (days >= 12) {
      return { text: 'Verify test completion & follow up', iconClass: 'text-rose-400' };
    }
    if (days >= 5) {
      return { text: 'Complete pending assessment / test', iconClass: 'text-amber-400' };
    }
    return { text: 'Check test portal & start prep', iconClass: 'text-purple-400' };
  }

  if (job.status === 'Applied') {
    if (days >= 14) {
      return { text: 'Send follow-up email to hiring team', iconClass: 'text-rose-400' };
    }
    if (days >= 7) {
      return { text: 'Find hiring manager on LinkedIn', iconClass: 'text-amber-400' };
    }
    return { text: 'Application submitted — awaiting screen', iconClass: 'text-zinc-400' };
  }

  return { text: 'Application updated', iconClass: 'text-zinc-400' };
};

export default DashboardPage;
