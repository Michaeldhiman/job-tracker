import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, isToday, isAfter, startOfDay, isTomorrow, isSameWeek } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { searchJobs } from '../api/jobsApi.js';
import { getCalendarEvents } from '../api/calendarApi.js';
import { CalendarGridSkeleton, EventListSkeleton } from '../components/feedback/Skeletons.jsx';
import EventModal from '../components/calendar/EventModal.jsx';
import NewEventModal from '../components/calendar/NewEventModal.jsx';
import AddJobModal from '../components/jobs/AddJobModal.jsx';
import Button from '../components/ui/Button.jsx';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CalendarPlus, CalendarClock, Target, AlertCircle,
  CheckCircle2, X, Plus, Clock, ChevronRight
} from 'lucide-react';

// ─── Module-level constants ────────────────────────────────────────────────
const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

export const TYPE_STYLES = {
  interview:  { badge: 'text-primary bg-primary/10 border-primary/20',           dot: 'bg-primary',      hex: 'rgb(var(--color-primary))' },
  followUp:   { badge: 'text-amber-500 bg-amber-500/10 border-amber-500/20',      dot: 'bg-amber-500',    hex: 'rgb(245,158,11)' },
  assessment: { badge: 'text-purple-500 bg-purple-500/10 border-purple-500/20',   dot: 'bg-purple-500',   hex: 'rgb(168,85,247)' },
  offer:      { badge: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-500', hex: 'rgb(16,185,129)' },
  rejected:   { badge: 'text-rose-500 bg-rose-500/10 border-rose-500/20',         dot: 'bg-rose-500',     hex: 'rgb(244,63,94)' },
  custom:     { badge: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',   dot: 'bg-indigo-400',   hex: 'rgb(99,102,241)' },
};

export const TYPE_LABELS = {
  interview: 'Interview',
  followUp: 'Follow Up',
  assessment: 'Assessment',
  offer: 'Offer',
  rejected: 'Rejected',
  custom: 'Custom',
};

export const getEventDisplayTitle = (evt) => {
  if (evt.type === 'custom') return evt.title;
  if (evt.resource?.role) return `${evt.resource.role} Interview`;
  return evt.title;
};

export const getEventDisplayCompany = (evt) => evt.resource?.company || '';

// ─── EventCard — used in sidebar and mobile list ───────────────────────────
function EventCard({ evt, onClick }) {
  const dotClass = TYPE_STYLES[evt.type]?.dot ?? 'bg-primary';
  return (
    <button
      onClick={onClick}
      className="w-full p-3 rounded-xl bg-surface hover:bg-surface-elevated border border-border hover:border-primary/30 cursor-pointer transition-all text-left flex items-start gap-3 group focus:outline-none focus:ring-1 focus:ring-primary/50"
    >
      {/* Type color bar */}
      <div className={`w-1 self-stretch rounded-full shrink-0 ${dotClass}`} />
      <div className="min-w-0 flex-1">
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block">
          {TYPE_LABELS[evt.type] ?? evt.type}
        </span>
        <p className="text-sm font-medium text-text line-clamp-1 mt-0.5 group-hover:text-primary transition-colors">
          {getEventDisplayTitle(evt)}
        </p>
        {getEventDisplayCompany(evt) && (
          <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{getEventDisplayCompany(evt)}</p>
        )}
        <p className="text-xs text-text-muted mt-1.5 flex items-center gap-1">
          <Clock className="w-3 h-3 shrink-0" />
          {format(new Date(evt.start), 'h:mm a')}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-text-muted shrink-0 mt-1 group-hover:text-primary transition-colors" />
    </button>
  );
}

// ─── EventListItem — compact row inside EventListModal ─────────────────────
function EventListItem({ evt, onClick }) {
  const styles = TYPE_STYLES[evt.type] ?? TYPE_STYLES.custom;
  return (
    <button
      onClick={onClick}
      className="w-full p-4 rounded-xl bg-surface hover:bg-surface-elevated border border-border hover:border-primary/30 transition-all text-left flex items-start justify-between gap-4 group focus:outline-none focus:ring-1 focus:ring-primary/50 min-h-[64px]"
    >
      <div className="min-w-0 flex-1">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border mb-1.5 ${styles.badge}`}>
          {TYPE_LABELS[evt.type] ?? 'Event'}
        </span>
        <p className="text-sm font-semibold text-text group-hover:text-primary transition-colors leading-snug">
          {getEventDisplayTitle(evt)}
        </p>
        {getEventDisplayCompany(evt) && (
          <p className="text-xs text-text-muted mt-0.5">{getEventDisplayCompany(evt)}</p>
        )}
      </div>
      <div className="flex items-center gap-1 text-xs text-text-muted shrink-0 mt-0.5">
        <Clock className="w-3.5 h-3.5" />
        <span className="font-medium">{format(new Date(evt.start), 'h:mm a')}</span>
      </div>
    </button>
  );
}

// ─── AgendaEvent — custom renderer for each row in Agenda view ───────────────
function AgendaEvent({ event }) {
  const styles = TYPE_STYLES[event.type] ?? TYPE_STYLES.custom;
  const title = getEventDisplayTitle(event);
  const company = getEventDisplayCompany(event);

  return (
    <div className="flex items-center gap-3 py-0.5 w-full group">
      {/* Accent dot */}
      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${styles.dot}`} />
      <div className="flex-1 min-w-0 flex items-center gap-2.5 flex-wrap">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${styles.badge}`}>
          {TYPE_LABELS[event.type] ?? 'Event'}
        </span>
        <span className="text-sm font-semibold text-text group-hover:text-primary transition-colors truncate">
          {title}
        </span>
        {company && (
          <span className="text-xs text-text-muted shrink-0 hidden sm:inline">{company}</span>
        )}
      </div>
    </div>
  );
}

// ─── AgendaDate — custom date cell renderer for Agenda view ──────────────────
function AgendaDate({ day }) {
  const todayFlag = isToday(day);
  return (
    <div className={`flex flex-col items-center gap-0 select-none ${todayFlag ? 'text-primary' : 'text-text-muted'}`}>
      <span className="text-[10px] font-bold uppercase tracking-widest leading-none">
        {format(day, 'EEE')}
      </span>
      <span
        className={`text-xl font-black leading-tight tabular-nums ${
          todayFlag
            ? 'text-primary drop-shadow-[0_0_8px_rgb(var(--color-primary)/0.7)]'
            : 'text-text'
        }`}
      >
        {format(day, 'd')}
      </span>
      <span className="text-[10px] font-semibold uppercase leading-none opacity-70">
        {format(day, 'MMM')}
      </span>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function CalendarPage() {
  const navigate = useNavigate();

  // Core state
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [showEditJob, setShowEditJob] = useState(false);
  const [jobToEdit, setJobToEdit] = useState(null);
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Upcoming events overlay modal
  const [showAllUpcomingModal, setShowAllUpcomingModal] = useState(false);

  // Mobile UX
  const [activeTab, setActiveTab] = useState('today');
  const [currentView, setCurrentView] = useState('month');
  const [selectedDateForNewEvent, setSelectedDateForNewEvent] = useState(null);

  // Event discovery state
  const [selectedDate, setSelectedDate] = useState(null);      // highlighted empty date
  const [eventListDate, setEventListDate] = useState(null);    // date for multi-event modal
  const [eventListEvents, setEventListEvents] = useState([]);  // events for multi-event modal

  useEffect(() => {
    // Default to month view on all screen sizes so date-cell taps work.
    // The event list below the calendar (Today/Tomorrow/Upcoming tabs) already
    // provides the agenda-style overview on mobile — the calendar itself is
    // used as a visual date-picker, which requires the month grid.
    setCurrentView('month');
  }, []);

  // ── Data fetching ────────────────────────────────────────────────────────
  const fetchAllEvents = async () => {
    try {
      const jobsRes = await searchJobs({ limit: 1000 });
      const mappedJobsEvents = (jobsRes.results || []).flatMap(job => {
        const evts = [];
        if (job.interviewDate) {
          evts.push({
            title: `Interview: ${job.company}`,
            start: new Date(job.interviewDate),
            end: new Date(new Date(job.interviewDate).getTime() + 60 * 60 * 1000),
            resource: job,
            type: 'interview',
          });
        }
        if (job.followUpDate) {
          evts.push({
            title: `Follow Up: ${job.company}`,
            start: new Date(job.followUpDate),
            end: new Date(new Date(job.followUpDate).getTime() + 30 * 60 * 1000),
            resource: job,
            type: 'followUp',
          });
        }
        return evts;
      });

      const customEventsRes = await getCalendarEvents();
      const mappedCustomEvents = (customEventsRes.events || []).map(evt => {
        const datePart = new Date(evt.date).toISOString().split('T')[0];
        const start = new Date(`${datePart}T${evt.startTime}:00`);
        const end = new Date(`${datePart}T${evt.endTime}:00`);
        return { id: evt._id, title: evt.title, start, end, resource: evt, type: 'custom' };
      });

      setEvents([...mappedJobsEvents, ...mappedCustomEvents]);
    } catch (err) {
      console.error('Failed to load calendar events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllEvents();
  }, []);



  // ── Event style getter ───────────────────────────────────────────────────
  const eventStyleGetter = useCallback((event) => ({
    style: {
      backgroundColor: TYPE_STYLES[event.type]?.hex ?? 'rgb(var(--color-primary))',
      borderRadius: '6px',
      opacity: 0.92,
      color: 'white',
      border: 'none',
      fontWeight: '500',
      fontSize: '0.72rem',
      padding: '2px 6px',
      cursor: 'pointer',
    },
  }), []);

  // ── NEW: Unified slot selection — desktop + mobile ─────────────────────
  // 0 events → highlight date, no modal
  // 1 event  → open EventModal directly
  // 2+ events → open EventListModal
  const handleSelectSlot = useCallback(({ start }) => {
    const clickedDay = startOfDay(new Date(start));
    const dayEvents = events
      .filter(e => startOfDay(new Date(e.start)).getTime() === clickedDay.getTime())
      .sort((a, b) => new Date(a.start) - new Date(b.start));

    if (dayEvents.length === 0) {
      // Highlight the date; clear any existing highlight first
      setSelectedDate(prev =>
        prev?.getTime() === clickedDay.getTime() ? null : clickedDay
      );
      return;
    }

    if (dayEvents.length === 1) {
      setSelectedEvent(dayEvents[0]);
      return;
    }

    setEventListDate(start);
    setEventListEvents(dayEvents);
  }, [events]);

  // ── Day cell visual highlight for selected empty date ──────────────────
  const dayPropGetter = useCallback((date) => {
    if (selectedDate && startOfDay(date).getTime() === selectedDate.getTime()) {
      return {
        style: {
          backgroundColor: 'rgb(var(--color-primary) / 0.09)',
          outline: '2px solid rgb(var(--color-primary) / 0.35)',
          outlineOffset: '-2px',
        },
      };
    }
    return {};
  }, [selectedDate]);

  // ── calendarComponents ─────────────────────────────────────────────────────
  const calendarComponents = useMemo(() => ({
    month: {
      dateHeader: ({ date, label, isOffRange }) => {
        const dayStart = startOfDay(date);
        const dayEvts = events.filter(e =>
          startOfDay(new Date(e.start)).getTime() === dayStart.getTime()
        );
        const uniqueTypes = [...new Set(dayEvts.map(e => e.type))];
        const visibleTypes = uniqueTypes.slice(0, 3);
        const extra = Math.max(0, dayEvts.length - visibleTypes.length);

        return (
          <div className={`flex flex-col items-end px-1.5 pt-1 pb-0.5 w-full select-none ${isOffRange ? 'opacity-30' : ''}`}>
            <span className="text-xs font-semibold tabular-nums leading-none">{label}</span>
            {dayEvts.length > 0 && (
              <div className="flex items-center gap-0.5 mt-1 flex-wrap justify-end">
                {visibleTypes.map((type, i) => (
                  <span
                    key={i}
                    className={`w-2 h-2 rounded-full shrink-0 ${TYPE_STYLES[type]?.dot ?? 'bg-primary'}`}
                  />
                ))}
                {extra > 0 && (
                  <span className="text-[9px] font-bold text-text-muted ml-0.5">+{extra}</span>
                )}
              </div>
            )}
          </div>
        );
      },
    },
    // ── Agenda view custom renderers ──────────────────────────────────────
    agenda: {
      event: AgendaEvent,
      date: AgendaDate,
    },
  }), [events, handleSelectSlot]);

  // ── Computed event groups ────────────────────────────────────────────────
  const now = useMemo(() => new Date(), []);

  const todayEvents = useMemo(() => {
    return events.filter(e => isToday(new Date(e.start)));
  }, [events]);

  const upcomingEvents = useMemo(() => {
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    return events
      .filter(e => new Date(e.start) > todayEnd)
      .sort((a, b) => new Date(a.start) - new Date(b.start));
  }, [events, now]);

  const upcomingLimit = 10;
  const displayedUpcoming = useMemo(() => {
    return upcomingEvents.slice(0, upcomingLimit);
  }, [upcomingEvents]);

  const openNewEvent = (date = null) => {
    setSelectedDateForNewEvent(date);
    setShowNewEvent(true);
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 min-h-full">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Interviews</h1>
          <p className="text-sm text-text-muted mt-1">Tap a date to view events. Use the button to create new ones.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <Button id="calendar-new-event-btn" onClick={() => openNewEvent()} className="h-9 w-full sm:w-auto">
            <CalendarPlus className="w-4 h-4 mr-2" /> New Event
          </Button>
        </div>
      </div>


      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Desktop Layout                                                      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex flex-row gap-6">

        {/* Sidebar */}
        <div className="w-80 shrink-0 flex flex-col gap-5">

          {/* Today */}
          <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4">
            <h3 className="font-semibold text-text flex items-center gap-2 text-sm">
              <Target className="w-4 h-4 text-primary shrink-0" /> Today's Events
              {todayEvents.length > 0 && (
                <span className="ml-auto text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {todayEvents.length}
                </span>
              )}
            </h3>
            {loading ? (
              <EventListSkeleton count={3} />
            ) : todayEvents.length > 0 ? (
              <div className="space-y-2">
                {todayEvents.map((evt, i) => (
                  <EventCard key={i} evt={evt} onClick={() => setSelectedEvent(evt)} />
                ))}
              </div>
            ) : (
              <div className="py-5 text-center border border-dashed border-border rounded-xl">
                <p className="text-sm text-text-muted">No events today.</p>
              </div>
            )}
          </div>

          {/* Upcoming */}
          <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4">
            <h3 className="font-semibold text-text flex items-center gap-2 text-sm">
              <CalendarClock className="w-4 h-4 text-amber-500 shrink-0" /> Upcoming
            </h3>
            {loading ? (
              <EventListSkeleton count={3} />
            ) : displayedUpcoming.length > 0 ? (
              <div className="space-y-3">
                {displayedUpcoming.map((evt, i) => (
                  <div key={i}>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 pl-1">
                      {format(new Date(evt.start), 'MMM d, yyyy')}
                    </p>
                    <EventCard evt={evt} onClick={() => setSelectedEvent(evt)} />
                  </div>
                ))}
                {upcomingEvents.length > upcomingLimit && (
                  <button
                    onClick={() => setShowAllUpcomingModal(true)}
                    className="w-full py-2 text-center text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 hover:border-primary/30 rounded-xl transition-all mt-2"
                  >
                    View All ({upcomingEvents.length})
                  </button>
                )}
              </div>
            ) : (
              <div className="py-8 text-center flex flex-col items-center text-text-muted border border-dashed border-border rounded-xl">
                <AlertCircle className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">Your schedule is clear.</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Calendar */}
        <div className="flex-1 min-w-0 glass-card rounded-2xl p-6">
          {/* Selected-date hint */}
          {selectedDate && (
            <div className="mb-4 px-4 py-2.5 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between gap-3">
              <p className="text-sm text-primary font-medium">
                {format(selectedDate, 'MMMM d, yyyy')} — No events scheduled.
              </p>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => openNewEvent(format(selectedDate, 'yyyy-MM-dd'))}
                  className="h-7 px-3 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Event
                </Button>
                <button onClick={() => setSelectedDate(null)} className="text-text-muted hover:text-text transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          {loading ? (
            <CalendarGridSkeleton />
          ) : (
            <div className="h-[600px] lg:h-[760px]">
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                date={calendarDate}
                onNavigate={(newDate) => setCalendarDate(newDate)}
                style={{ height: '100%', color: 'rgb(var(--color-text))' }}
                eventPropGetter={eventStyleGetter}
                onSelectEvent={(evt) => setSelectedEvent(evt)}
                dayPropGetter={dayPropGetter}
                components={calendarComponents}
                views={['month', 'agenda']}
                length={1}
                selectable={true}
                onSelectSlot={handleSelectSlot}
                onView={(v) => {
                  // Auto-jump to today when switching to agenda so it always
                  // shows today's events, not events for some past/future date.
                  if (v === 'agenda') setCalendarDate(new Date());
                }}
                className="custom-calendar modern-calendar"
              />
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Mobile Layout                                                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex lg:hidden flex-col gap-6">

        {/* Tab Selector */}
        <div className="flex bg-surface-elevated/40 border border-border p-1 rounded-xl">
          {['today', 'upcoming'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
              }}
              className={`flex-1 py-2 text-center rounded-lg text-xs font-bold capitalize transition-all ${
                activeTab === tab
                  ? 'bg-primary text-white shadow-md'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Compact Calendar */}
        <div className="glass-card rounded-2xl p-3">
          {/* Selected-date hint on mobile */}
          {selectedDate && (
            <div className="mb-3 px-3 py-2 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between gap-2">
              <p className="text-xs text-primary font-medium flex-1 min-w-0 truncate">
                {format(selectedDate, 'MMM d')} — No events. Tap + to add.
              </p>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => openNewEvent(format(selectedDate, 'yyyy-MM-dd'))}
                  className="text-xs font-semibold text-primary"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button onClick={() => setSelectedDate(null)} className="text-text-muted">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
          <div className="h-[440px]">
            {loading ? (
              <CalendarGridSkeleton />
            ) : (
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                date={calendarDate}
                onNavigate={(newDate) => setCalendarDate(newDate)}
                style={{ height: '100%', color: 'rgb(var(--color-text))' }}
                eventPropGetter={eventStyleGetter}
                onSelectEvent={(evt) => setSelectedEvent(evt)}
                longPressThreshold={10}
                dayPropGetter={dayPropGetter}
                components={calendarComponents}
                view={currentView}
                onView={(v) => {
                  setCurrentView(v);
                  // Auto-jump to today when switching to agenda.
                  if (v === 'agenda') setCalendarDate(new Date());
                }}
                views={['month', 'week', 'agenda']}
                length={1}
                selectable={true}
                onSelectSlot={handleSelectSlot}
                className="custom-calendar modern-calendar"
              />
            )}
          </div>
        </div>

        {/* Mobile Event List */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4">
          <h3 className="font-semibold text-text flex items-center gap-2 text-sm">
            {activeTab === 'today' && <><Target className="w-4 h-4 text-primary" /> Today's Events</>}
            {activeTab === 'upcoming' && <><CalendarClock className="w-4 h-4 text-amber-500" /> Upcoming</>}
          </h3>

          {loading ? (
            <EventListSkeleton count={2} />
          ) : activeTab === 'today' ? (
            todayEvents.length > 0 ? (
              <div className="space-y-2">
                {todayEvents.map((evt, i) => <EventCard key={i} evt={evt} onClick={() => setSelectedEvent(evt)} />)}
              </div>
            ) : (
              <div className="py-6 text-center border border-dashed border-border rounded-xl">
                <p className="text-sm text-text-muted">No events today.</p>
              </div>
            )
          ) : (
            displayedUpcoming.length > 0 ? (
              <div className="space-y-3">
                {displayedUpcoming.map((evt, i) => (
                  <div key={i}>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 pl-1">
                      {format(new Date(evt.start), 'MMM d, yyyy')}
                    </p>
                    <EventCard evt={evt} onClick={() => setSelectedEvent(evt)} />
                  </div>
                ))}
                {upcomingEvents.length > upcomingLimit && (
                  <button
                    onClick={() => setShowAllUpcomingModal(true)}
                    className="w-full py-2.5 text-center text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 hover:border-primary/30 rounded-xl transition-all mt-2 active:scale-95"
                  >
                    View All ({upcomingEvents.length})
                  </button>
                )}
              </div>
            ) : (
              <div className="py-8 text-center flex flex-col items-center text-text-muted border border-dashed border-border rounded-xl">
                <AlertCircle className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">Your schedule is clear.</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* ── Mobile FAB — persistent event creation button ─────────────────── */}
      <motion.button
        id="calendar-fab"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 20 }}
        onClick={() => openNewEvent()}
        className="fixed bottom-6 right-5 z-40 lg:hidden w-14 h-14 rounded-full bg-primary hover:bg-primary-hover text-white shadow-xl shadow-primary/40 flex items-center justify-center transition-colors active:scale-95"
        aria-label="Create new event"
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <EventModal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        event={selectedEvent}
        onDelete={fetchAllEvents}
        onEditJob={(job) => {
          setSelectedEvent(null);
          setJobToEdit(job);
          setShowEditJob(true);
        }}
      />

      <AddJobModal
        isOpen={showEditJob}
        jobToEdit={jobToEdit}
        onClose={() => { setShowEditJob(false); setJobToEdit(null); }}
        onSuccess={() => { setShowEditJob(false); setJobToEdit(null); fetchAllEvents(); }}
      />

      <NewEventModal
        isOpen={showNewEvent}
        onClose={() => { setShowNewEvent(false); setSelectedDateForNewEvent(null); }}
        initialDate={selectedDateForNewEvent}
        onSuccess={() => { setShowNewEvent(false); setSelectedDateForNewEvent(null); fetchAllEvents(); }}
      />

      <EventListModal
        isOpen={!!eventListDate}
        onClose={() => { setEventListDate(null); setEventListEvents([]); }}
        date={eventListDate}
        events={eventListEvents}
        onSelectEvent={(evt) => {
          setSelectedEvent(evt);
          setEventListDate(null);
          setEventListEvents([]);
        }}
        onAddEvent={(date) => {
          openNewEvent(format(new Date(date), 'yyyy-MM-dd'));
          setEventListDate(null);
          setEventListEvents([]);
        }}
      />

      <UpcomingEventsModal
        isOpen={showAllUpcomingModal}
        onClose={() => setShowAllUpcomingModal(false)}
        events={upcomingEvents}
        onSelectEvent={(evt) => {
          setSelectedEvent(evt);
          setShowAllUpcomingModal(false);
        }}
      />

      {/* ── Calendar Styles ──────────────────────────────────────────────── */}
      <style>{`
        .modern-calendar.rbc-calendar { font-family: 'Inter', sans-serif; }
        .modern-calendar .rbc-toolbar { margin-bottom: 16px; }
        .modern-calendar .rbc-toolbar button {
          color: rgb(var(--color-text-muted));
          border-color: var(--color-border);
          border-radius: 8px;
          padding: 6px 12px;
          transition: all 0.15s;
          font-size: 0.8rem;
        }
        .modern-calendar .rbc-toolbar button:hover {
          background-color: rgb(var(--color-surface-elevated));
          color: rgb(var(--color-text));
        }
        .modern-calendar .rbc-toolbar button.rbc-active {
          background-color: rgb(var(--color-surface-elevated));
          color: rgb(var(--color-text));
          box-shadow: none;
        }
        .modern-calendar .rbc-month-view,
        .modern-calendar .rbc-time-view,
        .modern-calendar .rbc-agenda-view {
          border-color: var(--color-border);
          border-radius: 12px;
          overflow: hidden;
        }
        .modern-calendar .rbc-day-bg,
        .modern-calendar .rbc-month-row,
        .modern-calendar .rbc-header {
          border-color: var(--color-border);
        }
        /* Entire day cell is a pointer target */
        .modern-calendar .rbc-day-bg {
          cursor: pointer;
          transition: background-color 0.12s;
        }
        .modern-calendar .rbc-day-bg:hover {
          background-color: rgb(var(--color-surface-elevated) / 0.5);
        }
        .modern-calendar .rbc-header {
          padding: 10px 0;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.7rem;
          color: rgb(var(--color-text-muted));
          letter-spacing: 0.05em;
        }
        .modern-calendar .rbc-off-range-bg { background-color: rgba(0,0,0,0.04); }
        .modern-calendar .rbc-today {
          background: radial-gradient(circle at top right, rgb(var(--color-primary) / 0.18), rgb(var(--color-primary) / 0.04)) !important;
          outline: 2px solid rgb(var(--color-primary) / 0.5) !important;
          outline-offset: -2px;
          z-index: 5;
          position: relative;
        }
        .modern-calendar .rbc-today::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 3px;
          background: rgb(var(--color-primary));
          z-index: 6;
        }
        /* Today date number pill */
        .modern-calendar .rbc-today .rbc-date-cell a,
        .modern-calendar .rbc-today .rbc-date-cell button,
        .modern-calendar .rbc-today .rbc-date-cell .rbc-button-link {
          background-color: rgb(var(--color-primary)) !important;
          color: #fff !important;
          border-radius: 9999px;
          width: 24px; height: 24px;
          display: inline-flex;
          align-items: center; justify-content: center;
          font-weight: 800;
          font-size: 0.78rem;
          box-shadow: 0 0 10px 2px rgb(var(--color-primary) / 0.5);
          animation: rbcTodayPulse 2s infinite;
        }
        @keyframes rbcTodayPulse {
          0%   { box-shadow: 0 0 6px 1px rgb(var(--color-primary) / 0.6); transform: scale(0.96); }
          50%  { box-shadow: 0 0 16px 4px rgb(var(--color-primary) / 0.35); transform: scale(1.04); }
          100% { box-shadow: 0 0 6px 1px rgb(var(--color-primary) / 0.6); transform: scale(0.96); }
        }
        .modern-calendar .rbc-event {
          padding: 2px 5px;
          font-size: 0.72rem;
        }
        .modern-calendar .rbc-event:focus { outline: none; box-shadow: 0 0 0 2px rgb(var(--color-primary) / 0.5); }

        /* ── Mobile: hide event text chips, dots-only in date header ── */
        @media (max-width: 1023px) {
          .modern-calendar .rbc-month-view .rbc-event {
            display: none !important;
          }
          .modern-calendar .rbc-month-view .rbc-show-more {
            display: none !important;
          }
          .modern-calendar .rbc-toolbar {
            flex-direction: column;
            gap: 8px;
            align-items: stretch;
          }
          .modern-calendar .rbc-toolbar-label {
            text-align: center;
            font-size: 0.9rem;
            font-weight: 700;
          }
          .modern-calendar .rbc-btn-group {
            display: flex;
            justify-content: center;
            width: 100%;
          }
          .modern-calendar .rbc-btn-group button {
            flex: 1;
            text-align: center;
            padding: 5px 8px;
          }
          .modern-calendar .rbc-month-row {
            min-height: 52px;
          }
        }

        /* ═══════════════════════════════════════════════════════════════
           Agenda View — Complete Restyle
           Key fix: background color from eventStyleGetter was bleeding
           into the entire agenda row. We reset it here and delegate
           visual color to the custom AgendaEvent component instead.
        ═══════════════════════════════════════════════════════════════ */
        .modern-calendar .rbc-agenda-view {
          border: none !important;
          border-radius: 12px !important;
          overflow: hidden;
        }
        .modern-calendar .rbc-agenda-view table.rbc-agenda-table {
          border: none !important;
          width: 100%;
          border-collapse: collapse;
        }
        /* Hide redundant DATE / TIME / EVENT column headers */
        .modern-calendar .rbc-agenda-view .rbc-agenda-table thead {
          display: none !important;
        }
        /* Row — hover + separator */
        .modern-calendar .rbc-agenda-table tbody > tr {
          border-bottom: 1px solid var(--color-border) !important;
          transition: background-color 0.12s;
          cursor: pointer;
        }
        .modern-calendar .rbc-agenda-table tbody > tr:last-child {
          border-bottom: none !important;
        }
        .modern-calendar .rbc-agenda-table tbody > tr:hover {
          background-color: rgb(var(--color-surface-elevated) / 0.55) !important;
        }
        /* Date cell — compact, left-aligned, separated */
        .modern-calendar .rbc-agenda-date-cell {
          padding: 12px 14px 12px 16px !important;
          vertical-align: middle !important;
          border-right: 1px solid var(--color-border) !important;
          width: 64px !important;
          min-width: 64px !important;
          text-align: center !important;
          background: rgb(var(--color-surface) / 0.4);
        }
        /* Time cell */
        .modern-calendar .rbc-agenda-time-cell {
          padding: 12px 14px !important;
          vertical-align: middle !important;
          border-right: 1px solid var(--color-border) !important;
          white-space: nowrap !important;
          font-size: 0.72rem !important;
          font-weight: 600 !important;
          font-variant-numeric: tabular-nums !important;
          color: rgb(var(--color-text-muted)) !important;
          min-width: 110px !important;
          width: 110px !important;
          letter-spacing: -0.01em;
        }
        /* Event cell */
        .modern-calendar .rbc-agenda-event-cell {
          padding: 10px 16px !important;
          vertical-align: middle !important;
        }
        /* ───────────────────────────────────────────────────────────────
           NUCLEAR background reset for agenda view.
           react-big-calendar's EventWrapper may apply the eventPropGetter
           background-color at the <tr>, <td>, or a wrapper <div> level.
           We hit all layers to prevent ANY amber/orange flooding.
        ─────────────────────────────────────────────────────────────── */
        /* Row level — in case EventWrapper injects bg on <tr> */
        .modern-calendar .rbc-agenda-table tbody > tr,
        .modern-calendar .rbc-agenda-table tbody > tr > td {
          background-color: transparent !important;
        }
        /* Restore date-cell tinted bg after the reset above */
        .modern-calendar .rbc-agenda-date-cell {
          background-color: rgb(var(--color-surface) / 0.4) !important;
        }
        /* Event cell and ALL descendants — covers EventWrapper div/span */
        .modern-calendar .rbc-agenda-event-cell,
        .modern-calendar .rbc-agenda-event-cell > *,
        .modern-calendar .rbc-agenda-event-cell .rbc-event {
          background: none !important;
          background-color: transparent !important;
          border: none !important;
          box-shadow: none !important;
          color: rgb(var(--color-text)) !important;
          padding: 0 !important;
          border-radius: 0 !important;
          cursor: pointer !important;
          width: 100% !important;
        }
        /* Re-apply event cell padding after blanket reset */
        .modern-calendar .rbc-agenda-event-cell {
          padding: 10px 16px !important;
          vertical-align: middle !important;
        }
        .modern-calendar .rbc-agenda-event-cell .rbc-event:focus,
        .modern-calendar .rbc-agenda-event-cell > *:focus {
          outline: none !important;
          box-shadow: none !important;
        }
        /* Empty state */
        .modern-calendar .rbc-agenda-empty {
          padding: 56px 24px !important;
          text-align: center !important;
          color: rgb(var(--color-text-muted)) !important;
          font-size: 0.9rem !important;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}

// ─── EventListModal ────────────────────────────────────────────────────────
// Renders as a bottom-sheet on mobile (< sm) and a centered modal on desktop.
function EventListModal({ isOpen, onClose, date, events, onSelectEvent, onAddEvent }) {
  if (!isOpen || !date) return null;

  const sortedEvents = [...events].sort((a, b) => new Date(a.start) - new Date(b.start));
  const dateLabel = format(new Date(date), 'MMMM d, yyyy');
  const eventCount = events.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Mobile Bottom Sheet (hidden on sm+) ── */}
          <div className="fixed inset-0 z-50 sm:hidden flex items-end justify-center">
            <motion.div
              key="backdrop-mobile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            />
            <motion.div
              key="sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              className="relative w-full max-h-[88vh] glass-panel rounded-t-3xl shadow-2xl flex flex-col z-10 overflow-hidden"
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>
              {/* Header */}
              <div className="px-5 pt-2 pb-4 border-b border-border flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-base font-bold text-text">{dateLabel}</h2>
                  <p className="text-xs text-text-muted mt-0.5">
                    {eventCount} event{eventCount !== 1 ? 's' : ''} scheduled
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-surface-elevated text-text-muted hover:text-text transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {sortedEvents.map((evt, idx) => (
                  <EventListItem
                    key={idx}
                    evt={evt}
                    onClick={() => onSelectEvent(evt)}
                  />
                ))}
              </div>
              {/* Footer */}
              <div className="p-4 border-t border-border bg-surface/60 flex items-center justify-between gap-3 shrink-0">
                <Button
                  variant="secondary"
                  onClick={() => onAddEvent(date)}
                  className="h-9 px-4 text-xs font-semibold flex-1 justify-center"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Add Event
                </Button>
                <Button onClick={onClose} className="h-9 px-5 text-xs font-semibold">
                  Close
                </Button>
              </div>
            </motion.div>
          </div>

          {/* ── Desktop Modal (hidden on mobile) ── */}
          <div className="fixed inset-0 z-50 hidden sm:flex items-center justify-center p-4">
            <motion.div
              key="backdrop-desktop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              key="dialog"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full max-w-md max-h-[80vh] glass-panel rounded-2xl shadow-2xl flex flex-col z-10 overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 border-b border-border flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-text">{dateLabel}</h2>
                  <p className="text-xs text-text-muted mt-0.5">
                    {eventCount} event{eventCount !== 1 ? 's' : ''} scheduled
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-surface-elevated text-text-muted hover:text-text transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
                {sortedEvents.map((evt, idx) => (
                  <EventListItem
                    key={idx}
                    evt={evt}
                    onClick={() => onSelectEvent(evt)}
                  />
                ))}
              </div>
              {/* Footer */}
              <div className="p-4 border-t border-border bg-surface/50 flex items-center justify-between gap-3 shrink-0">
                <Button
                  variant="secondary"
                  onClick={() => onAddEvent(date)}
                  className="h-9 px-4 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Event
                </Button>
                <Button onClick={onClose} className="h-9 px-5 text-xs font-semibold">
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── UpcomingEventsModal ───────────────────────────────────────────────────
// Renders a list of all upcoming events in a bottom sheet on mobile and centered modal on desktop.
function UpcomingEventsModal({ isOpen, onClose, events, onSelectEvent }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Mobile Bottom Sheet (hidden on sm+) ── */}
          <div className="fixed inset-0 z-50 sm:hidden flex items-end justify-center">
            <motion.div
              key="backdrop-mobile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            />
            <motion.div
              key="sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              className="relative w-full max-h-[88vh] glass-panel rounded-t-3xl shadow-2xl flex flex-col z-10 overflow-hidden"
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>
              {/* Header */}
              <div className="px-5 pt-2 pb-4 border-b border-border flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-base font-bold text-text">Upcoming Events</h2>
                  <p className="text-xs text-text-muted mt-0.5">
                    {events.length} event{events.length !== 1 ? 's' : ''} scheduled
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-surface-elevated text-text-muted hover:text-text transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {events.map((evt, idx) => (
                  <div key={idx} className="space-y-1">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider pl-1">
                      {format(new Date(evt.start), 'MMMM d, yyyy')}
                    </p>
                    <EventListItem
                      evt={evt}
                      onClick={() => onSelectEvent(evt)}
                    />
                  </div>
                ))}
              </div>
              {/* Footer */}
              <div className="p-4 border-t border-border bg-surface/60 flex items-center justify-end shrink-0">
                <Button onClick={onClose} className="h-9 px-5 text-xs font-semibold">
                  Close
                </Button>
              </div>
            </motion.div>
          </div>

          {/* ── Desktop Modal (hidden on mobile) ── */}
          <div className="fixed inset-0 z-50 hidden sm:flex items-center justify-center p-4">
            <motion.div
              key="backdrop-desktop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              key="dialog"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full max-w-md max-h-[80vh] glass-panel rounded-2xl shadow-2xl flex flex-col z-10 overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 border-b border-border flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-text">Upcoming Events</h2>
                  <p className="text-xs text-text-muted mt-0.5">
                    {events.length} event{events.length !== 1 ? 's' : ''} scheduled
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-surface-elevated text-text-muted hover:text-text transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                {events.map((evt, idx) => (
                  <div key={idx} className="space-y-1">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider pl-1">
                      {format(new Date(evt.start), 'MMMM d, yyyy')}
                    </p>
                    <EventListItem
                      evt={evt}
                      onClick={() => onSelectEvent(evt)}
                    />
                  </div>
                ))}
              </div>
              {/* Footer */}
              <div className="p-4 border-t border-border bg-surface/50 flex items-center justify-end shrink-0">
                <Button onClick={onClose} className="h-9 px-5 text-xs font-semibold">
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
