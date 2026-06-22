/**
 * Skeleton loading components — context-aware shimmer placeholders.
 * Use these instead of generic spinners when content structure is known.
 */

// Base shimmer element
export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse rounded-md bg-surface-elevated/80 ${className}`} />
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface/50 p-6 flex items-center gap-4">
      <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
  );
}

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
    </div>
  );
}

export function ChartSkeleton({ height = 'h-80', title }) {
  return (
    <div className="rounded-xl border border-border bg-surface/50 p-6 space-y-4">
      <div className="space-y-1">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-60" />
      </div>
      <div className={`${height} relative overflow-hidden rounded-lg bg-surface-elevated/30 p-4 flex items-end gap-2`}>
        {/* Fake bar chart bars */}
        {[65, 40, 80, 55, 90, 45, 70, 35].map((h, i) => (
          <div key={i} className="flex-1 flex items-end">
            <Skeleton className="w-full rounded-t-sm" style={{ height: `${h}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AreaChartSkeleton({ height = 'h-80', title }) {
  return (
    <div className="rounded-xl border border-border bg-surface/50 p-6 space-y-4">
      <div className="space-y-1">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>
      <div className={`${height} relative overflow-hidden rounded-lg bg-surface-elevated/30`}>
        {/* Fake area wave */}
        <svg className="w-full h-full opacity-20" viewBox="0 0 400 200" preserveAspectRatio="none">
          <path d="M0,150 C50,120 100,80 150,100 C200,120 250,60 300,80 C350,100 380,70 400,60 L400,200 L0,200 Z" fill="currentColor" className="text-primary" />
        </svg>
        <div className="absolute inset-0 animate-pulse bg-gradient-to-t from-surface-elevated/20 to-transparent" />
      </div>
    </div>
  );
}

export function InterviewListSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface/50 p-6 space-y-4">
      <div className="space-y-1">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-48" />
      </div>
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border">
            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-6 w-16 rounded-md shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Kanban / Jobs ────────────────────────────────────────────────────────────

export function KanbanCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface/50 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-5 rounded-full shrink-0" />
      </div>
      <Skeleton className="h-3 w-20" />
      <div className="flex items-center gap-2 pt-1">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function KanbanColumnSkeleton({ cardCount = 3 }) {
  return (
    <div className="shrink-0 w-72 flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-7 rounded-full" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {[...Array(cardCount)].map((_, i) => <KanbanCardSkeleton key={i} />)}
      </div>
    </div>
  );
}

export function KanbanSkeleton() {
  const counts = [4, 3, 2, 3, 2, 1, 2, 1];
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-full">
      {counts.map((c, i) => <KanbanColumnSkeleton key={i} cardCount={c} />)}
    </div>
  );
}

// ─── Resumes ─────────────────────────────────────────────────────────────────

export function ResumeCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface/50 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <Skeleton className="w-10 h-12 rounded shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-8 flex-1 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
        <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
      </div>
    </div>
  );
}

export function ResumesGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(count)].map((_, i) => <ResumeCardSkeleton key={i} />)}
    </div>
  );
}

// ─── Calendar ────────────────────────────────────────────────────────────────

export function CalendarGridSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1">
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <Skeleton key={i} className="h-6 w-full rounded-sm" />
        ))}
      </div>
      {/* Calendar days rows */}
      {[...Array(5)].map((_, row) => (
        <div key={row} className="grid grid-cols-7 gap-1">
          {[...Array(7)].map((_, col) => (
            <div key={col} className="h-16 rounded-lg border border-border/30 p-1 space-y-1">
              <Skeleton className="h-3 w-5" />
              {Math.random() > 0.7 && <Skeleton className="h-4 w-full rounded-sm" />}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function EventListSkeleton({ count = 3 }) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="p-3 rounded-xl border border-border space-y-1.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-64" />
      </div>
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton height="h-72" />
        <ChartSkeleton height="h-72" />
      </div>
      <AreaChartSkeleton height="h-64" />
    </div>
  );
}

// ─── Settings ────────────────────────────────────────────────────────────────

export function SettingsPanelSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="space-y-1">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-4 w-56" />
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-surface/50 p-6 space-y-4">
          <div className="space-y-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Auth Bootstrap ───────────────────────────────────────────────────────────

export function AppBootstrapLoader() {
  return (
    <div className="dark min-h-screen bg-[#09090b] flex flex-col items-center justify-center gap-6">
      {/* Branded logo mark */}
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-2xl">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2" />
          </svg>
        </div>
        {/* Spinner ring around logo */}
        <div className="absolute inset-0 rounded-2xl border-2 border-transparent border-t-primary/60 animate-spin" style={{ animationDuration: '1s' }} />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-white">Snap Job</p>
        <p className="text-xs text-zinc-500">Loading your workspace…</p>
      </div>
    </div>
  );
}
