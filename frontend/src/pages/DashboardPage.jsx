import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAnalytics, searchJobs } from '../api/jobsApi.js';
import ErrorAlert from '../components/feedback/ErrorAlert.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import { Briefcase, Target, TrendingUp, BarChart3, Clock, AlertTriangle, ChevronRight, Zap, Activity, Eye, ChevronDown, CheckCircle2, RefreshCw, Plus, ArrowRight } from 'lucide-react';
import JobDetailsModal from '../components/jobs/JobDetailsModal.jsx';

function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState({ funnel: [], trends: [], timeMetrics: {}, sourceBreakdown: [], stageConversions: [] });
  const [interviews, setInterviews] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showStale, setShowStale] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');
    try {
      const [analyticsRes, activeJobsRes, recentRes] = await Promise.all([
        getAnalytics(),
        searchJobs({ status: 'Applied,Assessment,Interview,Offer', limit: 100 }),
        searchJobs({ limit: 12 })
      ]);

      const allActiveJobs = activeJobsRes?.results || [];

      if (analyticsRes.success) {
        setData(analyticsRes.data);
      }
      setInterviews(allActiveJobs);
      setRecentJobs(recentRes?.results || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const openJob = useCallback((job) => {
    setSelectedJob(job);
  }, []);

  const handleCardKeyDown = useCallback((e, job) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openJob(job);
    }
  }, [openJob]);

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <ErrorAlert message={error} />
        <Button variant="secondary" size="sm" onClick={() => loadDashboardData()}>
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="h-7 w-36 bg-surface-elevated rounded-lg" />
            <div className="h-4 w-64 bg-surface rounded-lg mt-2" />
          </div>
        </div>
        {/* KPI skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface/50 p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-elevated/60 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-20 bg-surface-elevated/40 rounded" />
                <div className="h-7 w-12 bg-surface-elevated/60 rounded" />
                <div className="h-3 w-24 bg-surface-elevated/40 rounded" />
              </div>
            </div>
          ))}
        </div>
        {/* Priorities skeleton */}
        <div className="rounded-xl border border-border bg-surface/50 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-surface-elevated/60" />
            <div className="h-5 w-40 bg-surface-elevated/60 rounded" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-surface/30">
                <div className="w-8 h-8 rounded-lg bg-surface-elevated/40" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-28 bg-surface-elevated/40 rounded" />
                  <div className="h-2.5 w-20 bg-surface-elevated/30 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Two-column skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl border border-border bg-surface/50 p-6 space-y-4">
            <div className="h-5 w-32 bg-surface-elevated/60 rounded" />
            <div className="h-3 w-56 bg-surface-elevated/40 rounded" />
            {[1,2,3].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-surface/30 border border-border/40">
                <div className="w-9 h-9 rounded-full bg-surface-elevated/40 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-36 bg-surface-elevated/40 rounded" />
                  <div className="h-2.5 w-24 bg-surface-elevated/30 rounded" />
                </div>
                <div className="h-5 w-14 bg-surface-elevated/40 rounded" />
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-border bg-surface/50 p-6 space-y-4">
            <div className="h-5 w-32 bg-surface-elevated/60 rounded" />
            <div className="h-3 w-48 bg-surface-elevated/40 rounded" />
            {[100, 60, 35].map((w, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between">
                  <div className="h-3 w-20 bg-surface-elevated/40 rounded" />
                  <div className="h-3 w-8 bg-surface-elevated/40 rounded" />
                </div>
                <div className="h-2 bg-surface-elevated/30 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Onboarding / empty state ─────────────────────────────────────────────────
  const sm = Object.fromEntries((data.funnel || []).map(f => [f._id, f.count]));
  const totalApplications = Object.values(sm).reduce((a, b) => a + b, 0);

  if (totalApplications === 0 && !loading && !error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-emerald-500/20 flex items-center justify-center mb-6 ring-1 ring-primary/10">
          <Briefcase className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-text mb-2">Start tracking your job search</h2>
        <p className="text-text-muted max-w-md mb-8 text-sm leading-relaxed">
          Add your first job application to unlock personalized insights, track interviews, manage offers, and never miss a follow-up.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={() => navigate('/jobs')} variant="primary" size="lg">
            <Plus className="w-4 h-4" />
            Add Your First Application
          </Button>
          <Button onClick={() => navigate('/jobs')} variant="secondary" size="lg">
            Explore Jobs Page
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  const appliedCount     = sm['Applied']    || 0;
  const inAssessment     = sm['Assessment'] || 0;
  const activeInterviews = sm['Interview']  || 0;
  const offers           = sm['Offer']      || 0;
  const rejections       = sm['Rejected']   || 0;
  const activePipeline   = appliedCount + inAssessment + activeInterviews;

  const interviewRate    = totalApplications > 0 ? Math.round(((activeInterviews + offers) / totalApplications) * 100) : 0;
  const offerRate        = totalApplications > 0 ? Math.round((offers / totalApplications) * 100) : 0;
  const responseRate     = totalApplications > 0 ? Math.round(((inAssessment + activeInterviews + offers) / totalApplications) * 100) : 0;

  // ── Categorize active jobs ──────────────────────────────────────────────────
  const categories = {
    offerDeadlines: [],
    upcomingInterviews: [],
    pendingAssessments: [],
    overdueFollowUps: [],
    staleApplications: []
  };

  interviews.forEach(job => {
    const days = getDaysWaiting(job);

    let isStale = false;
    if (job.status === 'Applied') {
      isStale = days >= 30;
    } else if (job.status === 'Assessment') {
      isStale = days >= 45;
    } else if (job.status === 'Interview') {
      isStale = days >= 21;
    }

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

  categories.offerDeadlines.sort((a, b) => getDaysWaiting(b) - getDaysWaiting(a));
  categories.upcomingInterviews.sort((a, b) => new Date(a.interviewDate) - new Date(b.interviewDate));
  categories.pendingAssessments.sort((a, b) => getDaysWaiting(b) - getDaysWaiting(a));
  categories.overdueFollowUps.sort((a, b) => getDaysWaiting(b) - getDaysWaiting(a));
  categories.staleApplications.sort((a, b) => getDaysWaiting(b) - getDaysWaiting(a));

  // ── Today's Priorities ──────────────────────────────────────────────────────
  const computePriorities = () => {
    const items = [];

    categories.offerDeadlines.forEach(job => {
      const deadline = job.offerDeadline || job.followUpDate;
      if (!deadline) return;
      const diffDays = Math.ceil((new Date(deadline) - new Date()) / 86400000);
      if (diffDays < 0) items.push({ job, type: 'offer', urgency: 'critical', label: 'Offer deadline passed' });
      else if (diffDays === 0) items.push({ job, type: 'offer', urgency: 'critical', label: 'Offer expires today' });
      else if (diffDays === 1) items.push({ job, type: 'offer', urgency: 'high', label: 'Offer expires tomorrow' });
      else if (diffDays <= 3) items.push({ job, type: 'offer', urgency: 'medium', label: `Offer expires in ${diffDays} days` });
    });

    categories.upcomingInterviews.forEach(job => {
      if (!job.interviewDate) return;
      const d = new Date(job.interviewDate);
      const today = new Date();
      const isToday = d.toDateString() === today.toDateString();
      const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
      const isTomorrow = d.toDateString() === tomorrow.toDateString();
      if (isToday) items.push({ job, type: 'interview', urgency: 'high', label: `Interview today at ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}` });
      else if (isTomorrow) items.push({ job, type: 'interview', urgency: 'medium', label: `Interview tomorrow at ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}` });
    });

    categories.pendingAssessments.forEach(job => {
      const deadline = job.assessmentDeadline || job.followUpDate;
      if (deadline) {
        const diffDays = Math.ceil((new Date(deadline) - new Date()) / 86400000);
        if (diffDays < 0) items.push({ job, type: 'assessment', urgency: 'critical', label: 'Assessment overdue' });
        else if (diffDays === 0) items.push({ job, type: 'assessment', urgency: 'critical', label: 'Assessment due today' });
        else if (diffDays === 1) items.push({ job, type: 'assessment', urgency: 'high', label: 'Assessment due tomorrow' });
        else if (diffDays <= 5) items.push({ job, type: 'assessment', urgency: 'medium', label: `Assessment due in ${diffDays} days` });
      }
    });

    categories.overdueFollowUps.forEach(job => {
      const days = getDaysWaiting(job);
      if (days >= 14) items.push({ job, type: 'followup', urgency: 'high', label: `Follow-up overdue by ${days} days` });
      else items.push({ job, type: 'followup', urgency: 'medium', label: `Follow-up overdue by ${days} days` });
    });

    const urgencyOrder = { critical: 0, high: 1, medium: 2 };
    items.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
    return items.slice(0, 8);
  };

  const priorities = computePriorities();

  // ── Pipeline Funnel ─────────────────────────────────────────────────────────
  const stageConversions = data.stageConversions || [];
  const funnelStages = stageConversions.length > 0 ? stageConversions : [
    { stage: 'Applied', count: totalApplications },
    { stage: 'Assessment', count: inAssessment + activeInterviews + offers },
    { stage: 'Interview', count: activeInterviews + offers },
    { stage: 'Offer', count: offers }
  ];

  const funnelConversionRates = [];
  for (let i = 0; i < funnelStages.length - 1; i++) {
    const from = funnelStages[i].count;
    const to = funnelStages[i + 1].count;
    const rate = from > 0 ? Math.round((to / from) * 100) : 0;
    funnelConversionRates.push({
      from: funnelStages[i].stage,
      to: funnelStages[i + 1].stage,
      rate
    });
  }

  // ── Quick Insights ──────────────────────────────────────────────────────────
  const computeInsights = () => {
    const insights = [];

    if (data.sourceBreakdown && data.sourceBreakdown.length > 0) {
      const bestSource = data.sourceBreakdown.reduce((a, b) => (a.interviews || 0) > (b.interviews || 0) ? a : b);
      if (bestSource._id && bestSource.total > 0) {
        insights.push({
          icon: <Zap className="w-4 h-4 text-amber-400" />,
          text: `${bestSource._id} is your highest-performing source with ${bestSource.interviews || 0} interviews from ${bestSource.total} applications.`
        });
      }
    }

    if (funnelConversionRates.length > 0) {
      const bottleneck = funnelConversionRates.reduce((a, b) => a.rate < b.rate ? a : b);
      if (bottleneck.rate < 60) {
        insights.push({
          icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
          text: `${bottleneck.from} \u2192 ${bottleneck.to} remains your largest bottleneck (${bottleneck.rate}% conversion).`
        });
      }
    }

    if (data.trends && data.trends.length >= 2) {
      const recent = data.trends.slice(-2);
      const current = recent[1]?.count || 0;
      const previous = recent[0]?.count || 0;
      if (previous > 0) {
        const change = Math.round(((current - previous) / previous) * 100);
        if (change > 0) {
          insights.push({
            icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
            text: `Applications increased by ${change}% compared to last month.`
          });
        } else if (change < 0) {
          insights.push({
            icon: <TrendingUp className="w-4 h-4 text-rose-400" />,
            text: `Applications are down ${Math.abs(change)}% compared to last month.`
          });
        }
      }
    }

    if (data.timeMetrics && data.timeMetrics.avgDaysToInterview) {
      insights.push({
        icon: <Activity className="w-4 h-4 text-blue-400" />,
        text: `Average ${Math.round(data.timeMetrics.avgDaysToInterview)} days from application to interview.`
      });
    }

    return insights.slice(0, 4);
  };

  const insights = computeInsights();

  // ── Badge helpers ───────────────────────────────────────────────────────────
  const getUrgencyIndicator = (urgency) => {
    switch (urgency) {
      case 'critical': return { dot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]', label: 'bg-rose-500/15 text-rose-400 border-rose-500/25', icon: '🔴' };
      case 'high': return { dot: 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.7)]', label: 'bg-orange-500/15 text-orange-400 border-orange-500/25', icon: '🟠' };
      case 'medium': return { dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]', label: 'bg-amber-500/15 text-amber-400 border-amber-500/25', icon: '🟡' };
      default: return { dot: 'bg-zinc-400', label: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/25', icon: '⚪' };
    }
  };

  const getDueBadge = (job) => {
    const today = new Date().toDateString();
    if (job.offerDeadline || job.followUpDate) {
      const deadline = job.offerDeadline || job.followUpDate;
      const diff = Math.ceil((new Date(deadline) - new Date()) / 86400000);
      if (diff < 0) return { text: 'Overdue', variant: 'danger' };
      if (diff === 0) return { text: 'Due Today', variant: 'danger' };
      if (diff <= 3) return { text: `Due in ${diff}d`, variant: 'warning' };
    }
    return null;
  };

  // ── Render helpers ──────────────────────────────────────────────────────────
  const renderJobCard = (job, categoryType) => {
    const action = getActionLabel(job);
    const days = getDaysWaiting(job);

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

    const dueBadge = getDueBadge(job);

    return (
      <div
        key={job._id}
        onClick={() => openJob(job)}
        onKeyDown={(e) => handleCardKeyDown(e, job)}
        tabIndex={0}
        role="button"
        title={`${job.role} at ${job.company} — ${action.text}`}
        className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all duration-200 hover:scale-[1.01] hover:shadow-md active:scale-[0.99] cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none ${borderClass}`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-sm"
            style={{ backgroundColor: charColor(job.company) }}
          >
            {job.company.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-text truncate leading-snug" title={job.role}>
                {job.role}
              </h4>
              {dueBadge && (
                <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                  dueBadge.variant === 'danger' ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                }`}>
                  {dueBadge.text}
                </span>
              )}
            </div>
            <p className="text-[11px] text-text-muted mt-0.5 truncate" title={job.company}>{job.company}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={glowDotClass} />
              <span className={`text-[10px] font-medium truncate ${action.iconClass || action.colorClass}`}>
                {action.text}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {categoryType === 'interview' && job.interviewDate ? (
            <span className="text-[10px] text-blue-400 font-semibold bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20 flex items-center gap-1">
              {formatInterviewDateTime(job.interviewDate)}
            </span>
          ) : (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${getStatusColor(job.status)}`}>
              {job.status}
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderCollapsibleCategory = (title, items, categoryType, accentClass, linkFilter) => {
    if (items.length === 0) return null;
    const displayItems = items.slice(0, 3);

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className={`text-[11px] font-bold uppercase tracking-wider ${accentClass} flex items-center gap-1.5`}>
            {title} <span className="text-text-muted font-normal normal-case">({items.length})</span>
          </h4>
          {items.length > 3 && (
            <Link
              to={linkFilter}
              className="text-[10px] font-semibold text-primary hover:text-primary-hover transition-colors flex items-center gap-0.5"
            >
              View All {items.length} <ChevronRight className="w-3 h-3" />
            </Link>
          )}
        </div>
        <div className="space-y-2">
          {displayItems.map(job => renderJobCard(job, categoryType))}
        </div>
      </div>
    );
  };

  const funnelMaxWidth = funnelStages.length > 0 ? Math.max(...funnelStages.map(s => s.count)) : 1;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-text via-text to-text-muted bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-text-muted text-sm">What matters most, right now.</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[10px] text-text-muted/60 hidden sm:inline">
              Updated {lastUpdated.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
            className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-elevated/50 transition-colors disabled:opacity-40"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Section 1: KPI Overview ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="hover:scale-[1.02] hover:shadow-xl hover:border-primary/20 transition-all duration-300">
          <CardContent className="p-4 flex flex-row items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Active</p>
              <h3 className="text-2xl font-bold text-text mt-0.5 leading-none">{activePipeline}</h3>
              <p className="text-[10px] text-text-muted mt-1">applications in progress</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:scale-[1.02] hover:shadow-xl hover:border-emerald-500/20 transition-all duration-300">
          <CardContent className="p-4 flex flex-row items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Interview Rate</p>
              <h3 className="text-2xl font-bold text-text mt-0.5 leading-none">{interviewRate}<span className="text-sm font-normal text-text-muted ml-0.5">%</span></h3>
              <p className="text-[10px] text-text-muted mt-1">{activeInterviews + offers} reached interview</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:scale-[1.02] hover:shadow-xl hover:border-blue-500/20 transition-all duration-300">
          <CardContent className="p-4 flex flex-row items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
              <Target className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Offer Rate</p>
              <h3 className="text-2xl font-bold text-text mt-0.5 leading-none">{offerRate}<span className="text-sm font-normal text-text-muted ml-0.5">%</span></h3>
              <p className="text-[10px] text-text-muted mt-1">{offers} offers received</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:scale-[1.02] hover:shadow-xl hover:border-purple-500/20 transition-all duration-300">
          <CardContent className="p-4 flex flex-row items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
              <Eye className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Response Rate</p>
              <h3 className="text-2xl font-bold text-text mt-0.5 leading-none">{responseRate}<span className="text-sm font-normal text-text-muted ml-0.5">%</span></h3>
              <p className="text-[10px] text-text-muted mt-1">{inAssessment + activeInterviews + offers} got responses</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Section 2: Today's Priorities ───────────────────────────────────── */}
      {priorities.length > 0 && (
        <Card className="border-2 border-primary/20 shadow-lg shadow-primary/5">
          <CardHeader className="pb-3 border-b border-border/40 bg-surface-elevated/20">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg font-bold text-text">Today's Priorities</CardTitle>
            </div>
            <CardDescription>
              What needs your attention right now
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {priorities.map((item, idx) => {
                const urg = getUrgencyIndicator(item.urgency);
                return (
                  <div
                    key={idx}
                    onClick={() => openJob(item.job)}
                    onKeyDown={(e) => handleCardKeyDown(e, item.job)}
                    tabIndex={0}
                    role="button"
                    title={`${item.job.role} at ${item.job.company} — ${item.label}`}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-md active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none ${
                      item.urgency === 'critical'
                        ? 'border-rose-500/30 bg-rose-500/[0.03] hover:border-rose-500/50 hover:bg-rose-500/[0.06]'
                        : item.urgency === 'high'
                        ? 'border-orange-500/25 bg-orange-500/[0.02] hover:border-orange-500/40 hover:bg-orange-500/[0.05]'
                        : 'border-amber-500/20 bg-amber-500/[0.01] hover:border-amber-500/30 hover:bg-amber-500/[0.03]'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-base ${urg.label}`}>
                      {urg.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-text truncate leading-snug" title={item.job.role}>
                        {item.job.role}
                      </p>
                      <p className="text-[10px] text-text-muted truncate mt-0.5" title={item.job.company}>{item.job.company}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`w-1 h-1 rounded-full ${urg.dot}`} />
                        <span className={`text-[10px] font-medium truncate ${
                          item.urgency === 'critical' ? 'text-rose-400' : item.urgency === 'high' ? 'text-orange-400' : 'text-amber-400'
                        }`}>
                          {item.label}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-text-muted shrink-0 opacity-30 group-hover:opacity-60 transition-opacity" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Two-Column Layout ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── Section 3: Action Center ──────────────────────────────────── */}
          <Card className="hover:border-primary/10 transition-all duration-300 shadow-md">
            <CardHeader className="pb-3 border-b border-border/40 bg-surface-elevated/20">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg font-bold text-text">Action Center</CardTitle>
              </div>
              <CardDescription>
                Track offers, interviews, assessments, and follow-ups
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-5">
              {renderCollapsibleCategory(
                'Offer Deadlines', categories.offerDeadlines, 'offer', 'text-emerald-400', '/jobs?status=Offer'
              )}
              {renderCollapsibleCategory(
                'Upcoming Interviews', categories.upcomingInterviews, 'interview', 'text-blue-400', '/jobs?status=Interview'
              )}
              {renderCollapsibleCategory(
                'Pending Assessments', categories.pendingAssessments, 'assessment', 'text-purple-400', '/jobs?status=Assessment'
              )}
              {renderCollapsibleCategory(
                'Overdue Follow-Ups', categories.overdueFollowUps, 'followup', 'text-amber-500', '/jobs'
              )}

              {categories.offerDeadlines.length === 0 &&
               categories.upcomingInterviews.length === 0 &&
               categories.pendingAssessments.length === 0 &&
               categories.overdueFollowUps.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-surface/20 border border-dashed border-border rounded-xl">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2.5" />
                  <p className="text-sm font-semibold text-text">No actions required.</p>
                  <p className="text-xs text-text-muted mt-0.5">You're up to date on all active applications.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Section 6: Recent Applications ─────────────────────────────── */}
          <Card className="hover:border-primary/10 transition-all duration-300 shadow-md">
            <CardHeader className="pb-3 border-b border-border/40 bg-surface-elevated/20">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">Recent Applications</CardTitle>
                  <CardDescription>Your latest job applications</CardDescription>
                </div>
                <Link
                  to="/jobs"
                  className="text-[11px] font-semibold text-primary hover:text-primary-hover transition-colors flex items-center gap-0.5"
                >
                  View All Applications <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {recentJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-surface/20 border border-dashed border-border rounded-xl">
                  <Briefcase className="w-8 h-8 text-text-muted mb-2.5 opacity-25" />
                  <p className="text-xs text-text-muted">No applications found</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1 custom-scrollbar">
                  {recentJobs.map(job => (
                    <div
                      key={job._id}
                      onClick={() => openJob(job)}
                      onKeyDown={(e) => handleCardKeyDown(e, job)}
                      tabIndex={0}
                      role="button"
                      title={`${job.role} at ${job.company} — ${job.status}`}
                      className="p-3 rounded-xl border border-border bg-surface/30 flex items-center gap-3 hover:border-primary/30 transition-all duration-200 cursor-pointer hover:bg-surface-elevated hover:shadow-md active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-sm"
                        style={{ backgroundColor: charColor(job.company) }}
                      >
                        {job.company.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-text truncate" title={job.role}>{job.role}</span>
                          <span className={`shrink-0 inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${getPriorityColor(job.priority)}`}>
                            {job.priority || 'Med'}
                          </span>
                        </div>
                        <p className="text-[11px] text-text-muted truncate mt-0.5" title={job.company}>{job.company}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] text-text-muted">
                            {job.appliedDate ? new Date(job.appliedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                          </span>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${getStatusColor(job.status)}`}>
                            {job.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-6">

          {/* ── Section 4: Pipeline Funnel ─────────────────────────────────── */}
          <Card className="hover:border-primary/10 transition-all duration-300 shadow-md">
            <CardHeader className="pb-3 border-b border-border/40 bg-surface-elevated/20">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                <CardTitle className="text-base font-bold">Pipeline Funnel</CardTitle>
              </div>
              <CardDescription>Conversion rates between stages</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {funnelStages.map((stage, i) => {
                  const pct = funnelMaxWidth > 0 ? Math.round((stage.count / funnelMaxWidth) * 100) : 0;
                  const stageColors = ['bg-indigo-500', 'bg-purple-500', 'bg-amber-500', 'bg-emerald-500'];
                  const stageLabels = ['Applied', 'Assessment', 'Interview', 'Offer'];
                  const colorIdx = stageLabels.indexOf(stage.stage);
                  const color = colorIdx >= 0 ? stageColors[colorIdx] : 'bg-zinc-500';

                  return (
                    <div key={stage.stage}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-text">{stage.stage}</span>
                        <span className="text-xs font-bold text-text">{stage.count}</span>
                      </div>
                      <div className="h-2 bg-surface rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${color}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {i < funnelConversionRates.length && (
                        <p className="text-[10px] text-text-muted mt-0.5 mb-1">
                          {funnelConversionRates[i].from} → {funnelConversionRates[i].to}: <span className="font-semibold text-text">{funnelConversionRates[i].rate}%</span>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-3 border-t border-border/40 flex justify-between text-xs text-text-muted">
                <span>Total Applications</span>
                <span className="font-bold text-text">{totalApplications}</span>
              </div>
            </CardContent>
          </Card>

          {/* ── Section 5: Quick Insights ──────────────────────────────────── */}
          {insights.length > 0 && (
            <Card className="hover:border-primary/10 transition-all duration-300 shadow-md">
              <CardHeader className="pb-3 border-b border-border/40 bg-surface-elevated/20">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <CardTitle className="text-base font-bold">Quick Insights</CardTitle>
                </div>
                <CardDescription>Key trends at a glance</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {insights.map((insight, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface/30 border border-border/40">
                    <div className="mt-0.5 shrink-0">{insight.icon}</div>
                    <p className="text-[11px] text-text leading-relaxed">{insight.text}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

        </div>
      </div>

      {/* ── Section 7: Stale Applications (bottom, collapsed) ──────────────── */}
      {categories.staleApplications.length > 0 && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader
            className="pb-3 border-b border-border/40 cursor-pointer hover:bg-surface-elevated/10 transition-colors select-none"
            onClick={() => setShowStale(!showStale)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowStale(!showStale); } }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-text-muted" />
                <CardTitle className="text-sm font-bold text-text-muted">
                  Stale Applications ({categories.staleApplications.length})
                </CardTitle>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-medium text-text-muted">
                {showStale ? 'Hide' : 'Show Stale'}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showStale ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </CardHeader>
          <div className={`grid transition-all duration-300 ease-in-out ${showStale ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden">
              <CardContent className="pt-4">
                <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
                  {categories.staleApplications.map(job => (
                    <div
                      key={job._id}
                      onClick={() => openJob(job)}
                      onKeyDown={(e) => handleCardKeyDown(e, job)}
                      tabIndex={0}
                      role="button"
                      title={`${job.role} at ${job.company} — ${getDaysWaiting(job)} days waiting`}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-surface/20 opacity-70 hover:opacity-100 hover:border-border/70 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-xs"
                        style={{ backgroundColor: charColor(job.company) }}
                      >
                        {job.company.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-semibold text-text-muted truncate leading-snug" title={job.role}>
                          {job.role}
                        </h4>
                        <p className="text-[10px] text-text-muted mt-0.5 truncate" title={job.company}>{job.company}</p>
                        <p className="text-[10px] text-text-muted font-medium mt-0.5">
                          Ghosted — waiting {getDaysWaiting(job)}d
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded opacity-60 ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </div>
          </div>
        </Card>
      )}

      {/* Floating action button — always visible */}
      <button
        onClick={() => navigate('/jobs')}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-200 flex items-center justify-center hover:scale-110 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
        title="Add new job application"
        aria-label="Add new job application"
      >
        <Plus className="w-5 h-5" />
      </button>

      <JobDetailsModal
        isOpen={!!selectedJob}
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        onEdit={(job) => {
          setSelectedJob(null);
          navigate('/jobs');
        }}
        onSuccess={() => {
          setSelectedJob(null);
          loadDashboardData(true);
        }}
        onJobUpdated={(updates) => {
          setSelectedJob(prev => prev ? { ...prev, ...updates } : null);
          loadDashboardData(true);
        }}
      />
    </div>
  );
}

// ─── Static Helper Functions ──────────────────────────────────────────────

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
    if (job.offerDeadline || job.followUpDate) {
      const deadline = job.offerDeadline || job.followUpDate;
      const diffTime = new Date(deadline) - new Date();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return { text: 'Offer deadline passed', iconClass: 'text-rose-500 font-medium' };
      if (diffDays === 0) return { text: 'Offer expires today', iconClass: 'text-rose-500 font-bold animate-pulse' };
      if (diffDays === 1) return { text: 'Offer expires tomorrow', iconClass: 'text-rose-400 font-semibold' };
      if (diffDays <= 7) return { text: `Offer expires in ${diffDays} days`, iconClass: 'text-amber-400' };
      return { text: `Offer expires in ${diffDays} days`, iconClass: 'text-emerald-400' };
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
    if (job.assessmentDeadline || job.followUpDate) {
      const deadline = job.assessmentDeadline || job.followUpDate;
      const diffTime = new Date(deadline) - new Date();
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
