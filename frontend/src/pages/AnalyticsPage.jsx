import { useEffect, useState } from 'react';
import { getAnalytics } from '../api/jobsApi.js';
import { AnalyticsSkeleton } from '../components/feedback/Skeletons.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card.jsx';
import {
  TrendingUp, TrendingDown, Target, BarChart3, Activity,
  AlertTriangle, ArrowRight, Lightbulb, Zap
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, Cell, Legend
} from 'recharts';

import { PIPELINE_STATUSES } from '../utils/constants.js';

// ─── Design tokens ───────────────────────────────────────────────────────────
const TOOLTIP_STYLE = {
  backgroundColor: '#1c1c1f',
  borderColor: '#ffffff15',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.08)',
};
const ITEM_STYLE = { color: '#e3e1ec' };

const STAGE_COLORS = {
  Applied:    '#4f46e5',
  Assessment: '#8b5cf6',
  Interview:  '#f59e0b',
  Offer:      '#10b981',
  Rejected:   '#f43f5e',
};

const SOURCE_COLORS = { total: '#4f46e5', interviews: '#f59e0b', offers: '#10b981' };

// ─── Shared helpers ───────────────────────────────────────────────────────────
function pct(num, den) {
  if (!den || den === 0) return 0;
  return Math.round((num / den) * 100);
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KPICard({ label, value, suffix = '', icon: Icon, colorClass = 'text-primary', subtext }) {
  return (
    <Card>
      <CardContent className="p-5 flex items-start gap-4">
        <div className={`mt-0.5 w-10 h-10 rounded-lg flex items-center justify-center shrink-0 opacity-90 ${colorClass}`}
          style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs font-medium text-text-muted uppercase tracking-wider leading-tight">{label}</p>
          <h3 className="text-xl sm:text-2xl font-bold text-text mt-0.5 leading-tight">
            {value}
            {suffix && <span className="text-sm font-normal text-text-muted ml-1">{suffix}</span>}
          </h3>
          {subtext && <p className="hidden sm:block text-xs text-text-muted mt-0.5">{subtext}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyChart({ message }) {
  return (
    <div className="h-64 flex flex-col items-center justify-center text-text-muted">
      <BarChart3 className="w-10 h-10 mb-3 opacity-25" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ─── Bottleneck Funnel ────────────────────────────────────────────────────────
// Shows sequential stage-to-stage conversion rates.
// Mobile: stacked metric cards. Desktop: horizontal bar chart.
function BottleneckFunnel({ stageConversions }) {
  if (!stageConversions || stageConversions.length < 2) {
    return <EmptyChart message="Add more applications to see conversion data" />;
  }

  // Build step objects between consecutive stages
  const steps = [];
  for (let i = 0; i < stageConversions.length - 1; i++) {
    const from = stageConversions[i];
    const to   = stageConversions[i + 1];
    const rate = pct(to.count, from.count);
    const drop = 100 - rate;
    steps.push({ from: from.stage, to: to.stage, fromCount: from.count, toCount: to.count, rate, drop });
  }

  // Worst bottleneck = highest drop-off
  const maxDrop = Math.max(...steps.map(s => s.drop));
  const maxCount = stageConversions[0].count || 1;

  // Find the conversion rate INTO each stage (from the previous stage)
  const conversionInto = {};
  steps.forEach(step => {
    const isBottleneck = step.drop === maxDrop && step.drop > 0;
    conversionInto[step.to] = { rate: step.rate, isBottleneck };
  });

  return (
    <div className="space-y-5">

      {/* ── MOBILE: metric cards ─────────────────────────────────────
           Applied is intentionally skipped — it equals "Total Applications"
           already shown in the KPI strip above. Cards start at Assessment.  */}
      <div className="grid grid-cols-3 gap-2 md:hidden">
        {stageConversions.slice(1).map((s) => {
          const conv = conversionInto[s.stage];
          return (
            <div
              key={s.stage}
              className="rounded-xl border border-border/40 bg-surface p-3 flex flex-col gap-1.5"
              style={{ borderLeftColor: STAGE_COLORS[s.stage], borderLeftWidth: 3 }}
            >
              {/* Stage name + color dot */}
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: STAGE_COLORS[s.stage] }}
                />
                <span className="text-[10px] font-semibold text-text-muted truncate">{s.stage}</span>
              </div>
              {/* Big count */}
              <span className="text-xl font-bold text-text leading-none">{s.count}</span>
              {/* Conversion badge from previous stage */}
              {conv && (
                <span
                  className={`self-start text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                    conv.isBottleneck
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : 'bg-surface-elevated border-border/40 text-text-muted'
                  }`}
                >
                  {conv.isBottleneck && '⚠ '}{conv.rate}%
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ── DESKTOP: horizontal bars ─────────────────────────────────── */}
      <div className="hidden md:block space-y-3">
        {stageConversions.map((s) => {
          const width = pct(s.count, maxCount);
          const conv  = conversionInto[s.stage];
          return (
            <div key={s.stage} className="flex items-center gap-3">
              <span className="text-xs font-medium text-text-muted w-[88px] shrink-0 text-right">
                {s.stage}
              </span>
              {/* Track */}
              <div className="flex-1 relative h-6 bg-surface rounded-full">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.max(width, 4)}%`, backgroundColor: STAGE_COLORS[s.stage] }}
                />
              </div>
              {/* Count */}
              <span className="text-xs font-bold text-text w-9 shrink-0">{s.count}</span>
              {/* Conversion badge */}
              {conv && (
                <span
                  className={`hidden lg:inline-flex shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    conv.isBottleneck
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : 'bg-surface border-border/40 text-text-muted'
                  }`}
                >
                  {conv.rate}%{conv.isBottleneck && ' ⚠'}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Bottleneck badges (both breakpoints) ─────────────────────── */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-border/40">
        {steps.map(step => {
          const isBottleneck = step.drop === maxDrop && step.drop > 0;
          return (
            <div
              key={`${step.from}-${step.to}`}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
                isBottleneck
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-surface border-border/40 text-text-muted'
              }`}
            >
              <span>{step.from}</span>
              <ArrowRight className="w-3 h-3 shrink-0" />
              <span>{step.to}</span>
              <span className={`font-bold ml-0.5 ${isBottleneck ? 'text-amber-400' : 'text-text'}`}>
                {step.rate}%
              </span>
              {isBottleneck && <AlertTriangle className="w-3 h-3 ml-0.5 shrink-0" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Insights Panel ───────────────────────────────────────────────────────────
// Generates strictly data-derived observations. No generic advice — only facts.
function buildInsights({ funnel, trends, timeMetrics, stageConversions, sourceBreakdown }) {
  const insights = [];

  const sm = Object.fromEntries((funnel || []).map(f => [f._id, f.count]));
  const total = Object.values(sm).reduce((a, b) => a + b, 0);

  if (!total) return insights;

  // 1. Biggest bottleneck step
  if (stageConversions && stageConversions.length >= 2) {
    let worstStep = null;
    let worstDrop = -1;
    for (let i = 0; i < stageConversions.length - 1; i++) {
      const from = stageConversions[i];
      const to = stageConversions[i + 1];
      const rate = from.count > 0 ? Math.round((to.count / from.count) * 100) : 0;
      const drop = 100 - rate;
      if (drop > worstDrop) {
        worstDrop = drop;
        worstStep = { from: from.stage, to: to.stage, rate, fromCount: from.count, toCount: to.count };
      }
    }
    if (worstStep && worstDrop > 0) {
      insights.push({
        icon: AlertTriangle,
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/8',
        borderColor: 'border-amber-500/20',
        label: 'Biggest Bottleneck',
        text: `Only ${worstStep.rate}% of applications progress from ${worstStep.from} to ${worstStep.to} (${worstStep.toCount} of ${worstStep.fromCount}).`,
      });
    }
  }

  // 2. Best-performing source
  if (sourceBreakdown && sourceBreakdown.length > 0) {
    const withInterviews = sourceBreakdown.filter(s => s.total >= 3);
    if (withInterviews.length > 0) {
      const best = withInterviews.reduce((a, b) =>
        pct(b.interviews, b.total) > pct(a.interviews, a.total) ? b : a
      );
      const bestRate = pct(best.interviews, best.total);
      if (bestRate > 0) {
        insights.push({
          icon: Zap,
          color: 'text-emerald-400',
          bgColor: 'bg-emerald-500/8',
          borderColor: 'border-emerald-500/20',
          label: 'Best Application Source',
          text: `${best._id} has your highest interview rate at ${bestRate}% (${best.interviews} interviews from ${best.total} applications).`,
        });
      }
    }
  }

  // 3. Month-over-month momentum
  if (trends && trends.length >= 2) {
    const sorted = [...trends].sort((a, b) =>
      a._id.year !== b._id.year ? a._id.year - b._id.year : a._id.month - b._id.month
    );
    const lastTwo = sorted.slice(-2);
    const prev = lastTwo[0].count;
    const curr = lastTwo[1].count;
    const delta = curr - prev;
    const deltaPct = prev > 0 ? Math.round((delta / prev) * 100) : null;
    const currMonth = new Date(lastTwo[1]._id.year, lastTwo[1]._id.month - 1)
      .toLocaleString('default', { month: 'long' });
    const prevMonth = new Date(lastTwo[0]._id.year, lastTwo[0]._id.month - 1)
      .toLocaleString('default', { month: 'long' });

    if (deltaPct !== null) {
      const up = delta >= 0;
      insights.push({
        icon: up ? TrendingUp : TrendingDown,
        color: up ? 'text-blue-400' : 'text-rose-400',
        bgColor: up ? 'bg-blue-500/8' : 'bg-rose-500/8',
        borderColor: up ? 'border-blue-500/20' : 'border-rose-500/20',
        label: 'Application Momentum',
        text: `${currMonth} had ${curr} applications — ${up ? 'up' : 'down'} ${Math.abs(deltaPct)}% compared to ${prevMonth} (${prev}).`,
      });
    }
  }

  // 4. Avg days to interview
  const avgDays = Math.round(timeMetrics?.avgDaysToInterview || 0);
  if (avgDays > 0) {
    insights.push({
      icon: Activity,
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/8',
      borderColor: 'border-violet-500/20',
      label: 'Average Response Time',
      text: `Your applications take an average of ${avgDays} day${avgDays !== 1 ? 's' : ''} to reach an interview stage.`,
    });
  }

  // 5. Offer conversion
  const offers = sm['Offer'] || 0;
  const offerRate = pct(offers, total);
  if (total >= 5) {
    if (offers === 0) {
      insights.push({
        icon: Target,
        color: 'text-rose-400',
        bgColor: 'bg-rose-500/8',
        borderColor: 'border-rose-500/20',
        label: 'Offer Conversion',
        text: `No offers received yet out of ${total} applications.`,
      });
    } else {
      insights.push({
        icon: Target,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/8',
        borderColor: 'border-emerald-500/20',
        label: 'Offer Conversion',
        text: `${offers} offer${offers !== 1 ? 's' : ''} from ${total} applications — a ${offerRate}% offer rate.`,
      });
    }
  }

  return insights;
}

function InsightsPanel({ funnel, trends, timeMetrics, stageConversions, sourceBreakdown }) {
  const insights = buildInsights({ funnel, trends, timeMetrics, stageConversions, sourceBreakdown });

  if (!insights.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-text-muted">
        <Lightbulb className="w-8 h-8 mb-2 opacity-30" />
        <p className="text-sm">Add more applications to generate insights.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {insights.map((ins, i) => (
        <div
          key={i}
          className={`flex gap-3 p-4 rounded-xl border ${ins.bgColor} ${ins.borderColor}`}
        >
          <div className={`mt-0.5 shrink-0 ${ins.color}`}>
            <ins.icon className="w-4 h-4" />
          </div>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${ins.color}`}>
              {ins.label}
            </p>
            <p className="text-sm text-text leading-relaxed">{ins.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Source Breakdown Chart ───────────────────────────────────────────────────
function SourceBreakdownChart({ sourceBreakdown }) {
  if (!sourceBreakdown || sourceBreakdown.length === 0) {
    return <EmptyChart message="No source data available" />;
  }

  const data = sourceBreakdown
    .filter(s => s._id)
    .map(s => ({
      name: s._id,
      Applied: s.total,
      Interviews: s.interviews,
      Offers: s.offers,
    }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }} barGap={2} barCategoryGap="25%">
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
          <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={ITEM_STYLE} cursor={{ fill: '#ffffff05' }} />
          <Legend wrapperStyle={{ fontSize: '11px', color: '#a1a1aa' }} />
          <Bar dataKey="Applied" fill={SOURCE_COLORS.total} radius={[3, 3, 0, 0]} />
          <Bar dataKey="Interviews" fill={SOURCE_COLORS.interviews} radius={[3, 3, 0, 0]} />
          <Bar dataKey="Offers" fill={SOURCE_COLORS.offers} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Momentum Chart ───────────────────────────────────────────────────────────
function MomentumChart({ trends }) {
  if (!trends || trends.length === 0) {
    return <EmptyChart message="No trend data yet" />;
  }

  const sorted = [...trends].sort((a, b) =>
    a._id.year !== b._id.year ? a._id.year - b._id.year : a._id.month - b._id.month
  );

  const chartData = sorted.map(t => ({
    name: new Date(t._id.year, t._id.month - 1).toLocaleString('default', { month: 'short', year: '2-digit' }),
    Applications: t.count,
  }));

  // Month-over-month delta caption
  let deltaCaption = null;
  if (sorted.length >= 2) {
    const prev = sorted[sorted.length - 2].count;
    const curr = sorted[sorted.length - 1].count;
    const delta = curr - prev;
    const deltaPct = prev > 0 ? Math.round((delta / prev) * 100) : null;
    const currMonth = new Date(sorted[sorted.length - 1]._id.year, sorted[sorted.length - 1]._id.month - 1)
      .toLocaleString('default', { month: 'long' });

    if (deltaPct !== null) {
      const up = delta >= 0;
      deltaCaption = {
        text: `${currMonth}: ${curr} applications (${up ? '+' : ''}${deltaPct}% vs last month)`,
        up,
      };
    }
  }

  return (
    <div className="space-y-3">
      {deltaCaption && (
        <div className={`flex items-center gap-2 text-sm font-medium ${deltaCaption.up ? 'text-emerald-400' : 'text-rose-400'}`}>
          {deltaCaption.up ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {deltaCaption.text}
        </div>
      )}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
            <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={ITEM_STYLE} />
            <Area type="monotone" dataKey="Applications" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorApps)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
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

  if (loading) return <AnalyticsSkeleton />;

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

  // ── Derived metrics ────────────────────────────────────────────────────────
  const funnel = data?.funnel || [];
  const trends = data?.trends || [];
  const timeMetrics = data?.timeMetrics || {};
  const stageConversions = data?.stageConversions || [];
  const sourceBreakdown = data?.sourceBreakdown || [];

  const sm = Object.fromEntries(funnel.map(f => [f._id, f.count]));
  const total   = Object.values(sm).reduce((a, b) => a + b, 0);
  const offers  = sm['Offer'] || 0;
  const avgDays = Math.round(timeMetrics?.avgDaysToInterview || 0);

  // Interview rate = jobs that reached Interview or Offer stage / total
  const atInterview = (sm['Interview'] || 0) + offers;
  const interviewRate = pct(atInterview, total);
  const offerRate = pct(offers, total);

  const isEmpty = total === 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">Analytics</h1>
        <p className="text-sm text-text-muted mt-1">
          Where are you getting stuck, and what's working in your job search?
        </p>
      </div>

      {isEmpty ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-25" />
            <h3 className="text-lg font-semibold text-text mb-2">No data yet</h3>
            <p className="text-sm text-text-muted max-w-sm mx-auto">
              Start adding job applications to see your pipeline analytics and decision insights.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Section 1: KPI Strip ─────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard
              label="Total Applications"
              value={total}
              icon={BarChart3}
              colorClass="text-primary"
            />
            <KPICard
              label="Interview Rate"
              value={interviewRate}
              suffix="%"
              icon={Activity}
              colorClass="text-amber-500"
              subtext={`${atInterview} of ${total} reached interview`}
            />
            <KPICard
              label="Offer Rate"
              value={offerRate}
              suffix="%"
              icon={Target}
              colorClass="text-emerald-500"
              subtext={`${offers} offer${offers !== 1 ? 's' : ''} received`}
            />
            <KPICard
              label="Avg Days to Interview"
              value={avgDays || '—'}
              suffix={avgDays ? 'days' : ''}
              icon={TrendingUp}
              colorClass="text-violet-500"
              subtext={avgDays ? 'from application to interview' : 'No interview data yet'}
            />
          </div>

          {/* ── Section 2: Bottleneck Funnel ─────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle>Where Are You Getting Stuck?</CardTitle>
              <CardDescription>
                Sequential conversion rates across your pipeline — the highlighted step is your biggest drop-off.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BottleneckFunnel stageConversions={stageConversions} />
            </CardContent>
          </Card>

          {/* ── Section 3: Insights ───────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                Insights
              </CardTitle>
              <CardDescription>
                Data-derived observations from your job search activity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InsightsPanel
                funnel={funnel}
                trends={trends}
                timeMetrics={timeMetrics}
                stageConversions={stageConversions}
                sourceBreakdown={sourceBreakdown}
              />
            </CardContent>
          </Card>

          {/* ── Section 4 & 5: Charts Row ─────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Momentum</CardTitle>
                <CardDescription>Monthly application volume over time.</CardDescription>
              </CardHeader>
              <CardContent>
                <MomentumChart trends={trends} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance by Source</CardTitle>
                <CardDescription>
                  Which platforms generated applications, interviews, and offers.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SourceBreakdownChart sourceBreakdown={sourceBreakdown} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

export default AnalyticsPage;
