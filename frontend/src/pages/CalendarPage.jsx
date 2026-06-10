import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, isToday, isAfter, startOfDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { searchJobs } from '../api/jobsApi.js';
import Loader from '../components/feedback/Loader.jsx';
import EventModal from '../components/calendar/EventModal.jsx';
import Button from '../components/ui/Button.jsx';
import { CalendarPlus, CalendarClock, Target, AlertCircle } from 'lucide-react';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await searchJobs({ limit: 1000 });
        const jobs = res.results || [];
        const mappedEvents = jobs.map(job => {
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
        
        setEvents(mappedEvents);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const eventStyleGetter = (event) => {
    let backgroundColor = 'var(--color-primary)';
    let borderColor = 'transparent';
    let textColor = 'white';

    switch (event.type) {
      case 'interview': 
        backgroundColor = 'rgb(var(--color-primary))'; 
        break;
      case 'followUp': 
        backgroundColor = 'rgb(var(--color-amber-500))'; 
        break;
      case 'assessment': 
        backgroundColor = 'rgb(168, 85, 247)'; // purple-500
        break;
      case 'offer': 
        backgroundColor = 'rgb(var(--color-emerald-500))'; 
        break;
      case 'rejected': 
        backgroundColor = 'rgb(var(--color-rose-500))'; 
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
  const upcomingEvents = events.filter(e => isAfter(new Date(e.start), startOfDay(new Date())) && !isToday(new Date(e.start))).sort((a,b) => new Date(a.start) - new Date(b.start)).slice(0, 5);

  return (
    <div className="flex flex-col gap-6 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Calendar</h1>
          <p className="text-sm text-text-muted mt-1">Manage your interview schedule and follow-ups.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="h-9">
            <CalendarClock className="w-4 h-4 mr-2" /> Sync Calendar
          </Button>
          <Button className="h-9">
            <CalendarPlus className="w-4 h-4 mr-2" /> New Event
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
          <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4">
            <h3 className="font-semibold text-text flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" /> Today's Events
            </h3>
            {todayEvents.length > 0 ? (
              <div className="space-y-3">
                {todayEvents.map((evt, i) => (
                  <div key={i} onClick={() => setSelectedEvent(evt)} className="p-3 rounded-xl bg-surface hover:bg-surface-elevated border border-border cursor-pointer transition-colors flex flex-col gap-1">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">{evt.type}</span>
                    <span className="text-sm font-medium text-text line-clamp-1">{evt.resource.role} at {evt.resource.company}</span>
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
              <CalendarClock className="w-4 h-4 text-amber-500" /> Upcoming
            </h3>
            <div className="space-y-3">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((evt, i) => (
                  <div key={i} onClick={() => setSelectedEvent(evt)} className="p-3 rounded-xl bg-surface hover:bg-surface-elevated border border-border cursor-pointer transition-colors flex flex-col gap-1">
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{format(new Date(evt.start), 'MMM d, yyyy')}</span>
                    <span className="text-sm font-medium text-text line-clamp-1">{evt.resource.company}</span>
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
        <div className="flex-1 glass-card rounded-2xl p-6">
          {loading ? (
            <div className="h-[600px] flex items-center justify-center"><Loader /></div>
          ) : (
            <div className="h-[600px] lg:h-[800px]">
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%', color: 'rgb(var(--color-text))' }}
                eventPropGetter={eventStyleGetter}
                onSelectEvent={(evt) => setSelectedEvent(evt)}
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
        .modern-calendar .rbc-today { background-color: rgba(var(--color-primary), 0.05); }
        .modern-calendar .rbc-event { padding: 2px; }
      `}</style>
    </div>
  );
}
