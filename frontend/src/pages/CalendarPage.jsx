import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, isToday, isAfter, startOfDay, isTomorrow, isSameWeek } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { searchJobs } from '../api/jobsApi.js';
import { getCalendarStatus, getCalendarEvents, syncCalendar, getGoogleAuthUrl, disconnectCalendar } from '../api/calendarApi.js';
import { CalendarGridSkeleton, EventListSkeleton } from '../components/feedback/Skeletons.jsx';
import EventModal from '../components/calendar/EventModal.jsx';
import NewEventModal from '../components/calendar/NewEventModal.jsx';
import AddJobModal from '../components/jobs/AddJobModal.jsx';
import Button from '../components/ui/Button.jsx';
import { CalendarPlus, CalendarClock, Target, AlertCircle, CheckCircle2, RefreshCw, Radio } from 'lucide-react';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [showEditJob, setShowEditJob] = useState(false);
  const [jobToEdit, setJobToEdit] = useState(null);
  // Controlled date for react-big-calendar — required for Today button to work
  const [calendarDate, setCalendarDate] = useState(new Date());
  
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [lastSyncDate, setLastSyncDate] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [selectedDateForNewEvent, setSelectedDateForNewEvent] = useState(null);

  const fetchAllEvents = async () => {
    try {
      // 1. Fetch Google Status
      const statusRes = await getCalendarStatus();
      if (statusRes?.success && statusRes.connection) {
        setGoogleConnected(statusRes.connection.googleCalendarConnected);
        setGoogleEmail(statusRes.connection.googleCalendarEmail || '');
        setLastSyncDate(statusRes.connection.calendarConnectionDate ? new Date(statusRes.connection.calendarConnectionDate) : null);
      }

      // 2. Fetch Jobs (for mapped events)
      const jobsRes = await searchJobs({ limit: 1000 });
      const jobs = jobsRes.results || [];
      const mappedJobsEvents = jobs.map(job => {
        const evts = [];
        if (job.interviewDate) {
          evts.push({
            title: `Interview: ${job.company}`,
            start: new Date(job.interviewDate),
            end: new Date(new Date(job.interviewDate).getTime() + 60 * 60 * 1000), // +1 hour
            resource: job,
            type: 'interview'
          });
        }
        if (job.followUpDate) {
          evts.push({
            title: `Follow Up: ${job.company}`,
            start: new Date(job.followUpDate),
            end: new Date(new Date(job.followUpDate).getTime() + 30 * 60 * 1000),
            resource: job,
            type: 'followUp'
          });
        }
        return evts;
      }).flat();

      // 3. Fetch Custom Events
      const customEventsRes = await getCalendarEvents();
      const customEvents = customEventsRes.events || [];
      const mappedCustomEvents = customEvents.map(evt => {
        const datePart = new Date(evt.date).toISOString().split('T')[0];
        const start = new Date(`${datePart}T${evt.startTime}:00`);
        const end = new Date(`${datePart}T${evt.endTime}:00`);
        return {
          id: evt._id,
          title: evt.title,
          start,
          end,
          resource: evt,
          type: 'custom',
        };
      });

      // Combine both arrays
      setEvents([...mappedJobsEvents, ...mappedCustomEvents]);
    } catch (err) {
      console.error("Failed to load calendar events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check callback status parameters
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const message = urlParams.get('message');
    
    if (status === 'success') {
      setFeedback({ type: 'success', text: 'Google Calendar connected and synchronized successfully!' });
      // clean query params from url
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (status === 'error') {
      setFeedback({ type: 'error', text: `Failed to sync Google Calendar: ${message || 'Auth failed'}` });
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    fetchAllEvents();
  }, []);

  const handleConnectGoogle = async () => {
    try {
      setFeedback(null);
      const res = await getGoogleAuthUrl();
      if (res?.url) {
        window.location.href = res.url;
      }
    } catch (err) {
      setFeedback({ type: 'error', text: 'Failed to initiate Google Authentication.' });
    }
  };

  const handleSyncNow = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setFeedback(null);
    try {
      await syncCalendar();
      setFeedback({ type: 'success', text: 'Calendar synchronized with Google successfully!' });
      await fetchAllEvents();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || err.message || 'Synchronization failed.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (window.confirm("Are you sure you want to disconnect your Google Calendar? This will stop syncing your interviews and remove Google tokens from your account.")) {
      setLoading(true);
      setFeedback(null);
      try {
        const res = await disconnectCalendar();
        if (res.success) {
          setGoogleConnected(false);
          setGoogleEmail('');
          setLastSyncDate(null);
          setFeedback({ type: 'success', text: 'Google Calendar account disconnected successfully.' });
          await fetchAllEvents();
        }
      } catch (err) {
        setFeedback({ 
          type: 'error', 
          text: err.response?.data?.message || err.message || 'Failed to disconnect Google Calendar.' 
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const eventStyleGetter = (event) => {
    let backgroundColor = 'var(--color-primary)';
    let borderColor = 'transparent';
    let textColor = 'white';

    switch (event.type) {
      case 'interview': 
        backgroundColor = 'rgb(var(--color-primary))'; 
        break;
      case 'followUp': 
        backgroundColor = 'rgb(245, 158, 11)'; // amber-500
        break;
      case 'assessment': 
        backgroundColor = 'rgb(168, 85, 247)'; // purple-500
        break;
      case 'offer': 
        backgroundColor = 'rgb(16, 185, 129)'; // emerald-500
        break;
      case 'rejected': 
        backgroundColor = 'rgb(244, 63, 94)'; // rose-500
        break;
      case 'custom':
        backgroundColor = 'rgb(79, 70, 229)'; // indigo-600
        break;
    }

    return { 
      style: { 
        backgroundColor, 
        borderRadius: '6px', 
        opacity: 0.95, 
        color: textColor, 
        border: `1px solid ${borderColor}`,
        fontWeight: '500',
        fontSize: '0.8rem',
        padding: '2px 4px'
      } 
    };
  };

  const todayEvents = events.filter(e => isToday(new Date(e.start)));
  const tomorrowEvents = events.filter(e => isTomorrow(new Date(e.start)));
  
  // Only show upcoming events for the current month and the next month
  const now = new Date();
  const limitDate = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59, 999);
  
  const thisWeekEvents = events
    .filter(e => {
      const eventDate = new Date(e.start);
      return isSameWeek(eventDate, now) && isAfter(eventDate, startOfDay(now)) && !isToday(eventDate) && !isTomorrow(eventDate);
    })
    .sort((a, b) => new Date(a.start) - new Date(b.start));

  const upcomingEvents = events
    .filter(e => {
      const eventDate = new Date(e.start);
      return isAfter(eventDate, startOfDay(now)) && 
             !isToday(eventDate) && 
             !isTomorrow(eventDate) &&
             !isSameWeek(eventDate, now) &&
             eventDate <= limitDate;
    })
    .sort((a, b) => new Date(a.start) - new Date(b.start));
  const handleSelectSlot = ({ start }) => {
    const localDateString = format(start, 'yyyy-MM-dd');
    setSelectedDateForNewEvent(localDateString);
    setShowNewEvent(true);
  };

  return (
    <div className="flex flex-col gap-6 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Interviews</h1>
          <p className="text-sm text-text-muted mt-1">Manage your interview schedule and custom events.</p>
        </div>
        <div className="flex gap-3">
          {googleConnected ? (
            <Button variant="secondary" onClick={handleSyncNow} disabled={isSyncing} className="h-9">
              <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          ) : (
            <Button variant="secondary" onClick={handleConnectGoogle} className="h-9">
              <CalendarClock className="w-4 h-4 mr-2" /> Connect Google Calendar
            </Button>
          )}
          <Button onClick={() => setShowNewEvent(true)} className="h-9">
            <CalendarPlus className="w-4 h-4 mr-2" /> New Event
          </Button>
        </div>
      </div>

      {/* Google Calendar Connection Status Banner */}
      {feedback && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 text-sm ${
          feedback.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
          <p>{feedback.text}</p>
        </div>
      )}

      {googleConnected ? (
        <div className="glass-panel p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-emerald-500/10 bg-emerald-500/5">
          <div className="flex items-center gap-3">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse shrink-0" />
            <div>
              <p className="text-sm font-semibold text-text">Google Calendar Sync Connected</p>
              <p className="text-xs text-text-muted">Account: <span className="text-emerald-400 font-medium">{googleEmail}</span></p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {lastSyncDate && (
              <span className="text-xs text-text-muted">
                Last Synced: {lastSyncDate.toLocaleDateString()} at {lastSyncDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <Button 
              variant="ghost" 
              onClick={handleDisconnect} 
              className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 h-auto font-medium animate-all"
            >
              Disconnect
            </Button>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-border bg-surface-elevated/10">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-text">Google Calendar Not Synced</p>
              <p className="text-xs text-text-muted">Connect your account to synchronize interviews, assessments, and notifications automatically.</p>
            </div>
          </div>
          <Button onClick={handleConnectGoogle} className="h-10 px-5 text-sm bg-primary hover:bg-primary-hover font-bold shrink-0">
            Connect Google Calendar
          </Button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
          <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4">
            <h3 className="font-semibold text-text flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" /> Today's Events
            </h3>
            {loading ? (
              <EventListSkeleton count={3} />
            ) : todayEvents.length > 0 ? (
              <div className="space-y-3">
                {todayEvents.map((evt, i) => (
                  <div key={i} onClick={() => setSelectedEvent(evt)} className="p-3 rounded-xl bg-surface hover:bg-surface-elevated border border-border cursor-pointer transition-colors flex flex-col gap-1">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">{evt.type}</span>
                    <span className="text-sm font-medium text-text line-clamp-1">
                      {evt.type === 'custom' ? evt.title : `${evt.resource.role} at ${evt.resource.company}`}
                    </span>
                    <span className="text-xs text-text-muted">{format(new Date(evt.start), 'h:mm a')}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center border border-dashed border-border rounded-xl">
                <p className="text-sm text-text-muted">No events today.</p>
              </div>
            )}
          </div>

          <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4">
            <h3 className="font-semibold text-text flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-emerald-500" /> Tomorrow
            </h3>
            {tomorrowEvents.length > 0 ? (
              <div className="space-y-3">
                {tomorrowEvents.map((evt, i) => (
                  <div key={i} onClick={() => setSelectedEvent(evt)} className="p-3 rounded-xl bg-surface hover:bg-surface-elevated border border-border cursor-pointer transition-colors flex flex-col gap-1">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">{evt.type}</span>
                    <span className="text-sm font-medium text-text line-clamp-1">
                      {evt.type === 'custom' ? evt.title : `${evt.resource.role} at ${evt.resource.company}`}
                    </span>
                    <span className="text-xs text-text-muted">{format(new Date(evt.start), 'h:mm a')}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted italic px-2">No events tomorrow.</p>
            )}
          </div>

          <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4">
            <h3 className="font-semibold text-text flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-blue-500" /> This Week
            </h3>
            {thisWeekEvents.length > 0 ? (
              <div className="space-y-3">
                {thisWeekEvents.map((evt, i) => (
                  <div key={i} onClick={() => setSelectedEvent(evt)} className="p-3 rounded-xl bg-surface hover:bg-surface-elevated border border-border cursor-pointer transition-colors flex flex-col gap-1">
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{format(new Date(evt.start), 'EEEE, h:mm a')}</span>
                    <span className="text-sm font-medium text-text line-clamp-1">
                      {evt.type === 'custom' ? evt.title : `${evt.resource.role} at ${evt.resource.company}`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted italic px-2">No other events this week.</p>
            )}
          </div>

          <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4">
            <h3 className="font-semibold text-text flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-amber-500" /> Upcoming
            </h3>
            <div className="space-y-3">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((evt, i) => (
                  <div key={i} onClick={() => setSelectedEvent(evt)} className="p-3 rounded-xl bg-surface hover:bg-surface-elevated border border-border cursor-pointer transition-colors flex flex-col gap-1">
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{format(new Date(evt.start), 'MMM d, yyyy')}</span>
                    <span className="text-sm font-medium text-text line-clamp-1">
                      {evt.type === 'custom' ? evt.title : `${evt.resource.role} at ${evt.resource.company}`}
                    </span>
                    <span className="text-xs text-text-muted">{evt.type}</span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center flex flex-col items-center justify-center text-text-muted border border-dashed border-border rounded-xl h-full">
                  <AlertCircle className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-sm">Your schedule is clear.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Calendar View */}
        <div className="hidden lg:block flex-1 glass-card rounded-2xl p-6">
          {loading ? (
            <CalendarGridSkeleton />
          ) : (
            <div className="h-[600px] lg:h-[800px]">
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
                selectable={true}
                onSelectSlot={handleSelectSlot}
                views={['month', 'agenda']}
                className="custom-calendar modern-calendar"
              />
            </div>
          )}
        </div>
      </div>

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
        onClose={() => {
          setShowEditJob(false);
          setJobToEdit(null);
        }}
        onSuccess={() => {
          setShowEditJob(false);
          setJobToEdit(null);
          fetchAllEvents();
        }}
      />

      <NewEventModal
        isOpen={showNewEvent}
        onClose={() => {
          setShowNewEvent(false);
          setSelectedDateForNewEvent(null);
        }}
        initialDate={selectedDateForNewEvent}
        onSuccess={() => {
          setShowNewEvent(false);
          setSelectedDateForNewEvent(null);
          fetchAllEvents();
        }}
      />

      <style>{`
        .modern-calendar.rbc-calendar { font-family: 'Inter', sans-serif; }
        .modern-calendar .rbc-toolbar { margin-bottom: 20px; }
        .modern-calendar .rbc-toolbar button { 
          color: rgb(var(--color-text-muted)); 
          border-color: var(--color-border); 
          border-radius: 8px;
          padding: 6px 12px;
          transition: all 0.2s;
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
        .modern-calendar .rbc-header {
          padding: 12px 0;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.75rem;
          color: rgb(var(--color-text-muted));
        }
        .modern-calendar .rbc-off-range-bg { background-color: rgba(0,0,0,0.05); }
        .modern-calendar .rbc-today { 
          background: radial-gradient(circle at top right, rgb(var(--color-primary) / 0.18), rgb(var(--color-primary) / 0.04)) !important;
          outline: 2px solid rgb(var(--color-primary) / 0.5) !important;
          outline-offset: -2px;
          z-index: 5;
          position: relative;
          box-shadow: inset 0 0 12px rgb(var(--color-primary) / 0.1) !important;
        }
        .modern-calendar .rbc-today::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 4px;
          background: rgb(var(--color-primary));
          z-index: 6;
        }
        .modern-calendar .rbc-today .rbc-date-cell a,
        .modern-calendar .rbc-today .rbc-date-cell button,
        .modern-calendar .rbc-today .rbc-date-cell .rbc-button-link {
          background-color: rgb(var(--color-primary)) !important;
          color: #ffffff !important;
          border-radius: 9999px;
          width: 26px;
          height: 26px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          margin-top: 4px;
          margin-right: 4px;
          font-size: 0.8rem;
          box-shadow: 0 0 12px 2px rgb(var(--color-primary) / 0.6);
          animation: rbcTodayPulse 1.8s infinite;
        }
        @keyframes rbcTodayPulse {
          0% {
            box-shadow: 0 0 8px 1px rgb(var(--color-primary) / 0.6);
            transform: scale(0.95);
          }
          50% {
            box-shadow: 0 0 18px 5px rgb(var(--color-primary) / 0.4);
            transform: scale(1.05);
          }
          100% {
            box-shadow: 0 0 8px 1px rgb(var(--color-primary) / 0.6);
            transform: scale(0.95);
          }
        }
        .modern-calendar .rbc-event { padding: 2px; }
      `}</style>
    </div>
  );
}
