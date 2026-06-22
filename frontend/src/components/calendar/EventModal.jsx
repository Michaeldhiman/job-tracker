import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X, Calendar as CalendarIcon, Building2, ExternalLink,
  Trash2, Clock, Video, Edit2, Bell, BellOff, CheckCircle, RefreshCw, Briefcase
} from 'lucide-react';
import Button from '../ui/Button.jsx';
import { format } from 'date-fns';
import { deleteCalendarEvent } from '../../api/calendarApi.js';

// ─── Job status badge config ───────────────────────────────────────────────
const JOB_STATUS_STYLES = {
  Applied:     'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Assessment:  'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Interview:   'bg-primary/10 text-primary border-primary/20',
  Offer:       'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Rejected:    'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

// ─── Event type badge config ───────────────────────────────────────────────
const TYPE_BADGE = {
  interview:  'text-primary bg-primary/10 border-primary/20',
  followUp:   'text-amber-500 bg-amber-500/10 border-amber-500/20',
  assessment: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  offer:      'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  rejected:   'text-rose-500 bg-rose-500/10 border-rose-500/20',
  custom:     'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
};

const TYPE_LABEL = {
  interview:  'Interview',
  followUp:   'Follow Up',
  assessment: 'Assessment',
  offer:      'Offer',
  rejected:   'Rejected',
  custom:     'Custom Event',
};

const SYNC_STATUS = {
  synced:  { label: 'Synced with Google', icon: CheckCircle, cls: 'text-emerald-400' },
  pending: { label: 'Sync pending',       icon: RefreshCw,    cls: 'text-amber-400 animate-spin' },
  failed:  { label: 'Sync failed',        icon: X,            cls: 'text-rose-400' },
};

// ─── Reusable detail row ───────────────────────────────────────────────────
function DetailRow({ icon: Icon, iconClass = 'text-text-muted', children }) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-surface border border-border shrink-0 mt-0.5">
        <Icon className={`w-4 h-4 ${iconClass}`} />
      </div>
      <div className="flex-1 min-w-0 py-1">{children}</div>
    </div>
  );
}

// ─── Main EventModal ───────────────────────────────────────────────────────
export default function EventModal({ isOpen, onClose, event, onDelete, onEditJob, onEditCustomEvent }) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!event) return null;

  const { title, start, end, type, resource, eventMeta } = event;
  const isCustom = type === 'custom';

  // ── Read sync/reminder state from eventMeta (passed from CalendarPage) ───
  // resource is the populated Job object for generated events and doesn't
  // carry syncStatus, reminder24hSent, or reminder1hSent. eventMeta provides
  // these regardless of event type.
  const meta = eventMeta || {};
  const syncStatus        = meta.syncStatus || '';
  const reminder24hSent   = meta.reminder24hSent ?? false;
  const reminder1hSent    = meta.reminder1hSent ?? false;

  // ── Derive display values ────────────────────────────────────────────────
  const displayTitle = (() => {
    if (isCustom) return title;
    const company = resource?.company || '';
    const role    = resource?.role    || '';
    switch (type) {
      case 'interview':  return role ? `${role} Interview` : title;
      case 'followUp':   return company ? `Follow Up: ${company}` : title;
      case 'assessment': return company ? `Assessment: ${company}` : title;
      case 'offer':      return company ? `Offer Deadline: ${company}` : title;
      default:           return title;
    }
  })();

  const displayCompany      = resource?.company || '';
  const displayNotes        = isCustom ? resource?.description || '' : resource?.notes || '';
  const displayMeetingLink  = isCustom ? resource?.meetingLink || '' : '';
  const displayJobUrl       = !isCustom ? resource?.jobUrl || '' : '';
  const displayRound        = isCustom ? resource?.interviewRound || '' : '';
  const displayStatus       = !isCustom ? resource?.status || '' : '';
  const emailNotifsEnabled  = !isCustom ? (resource?.interviewReminders ?? false) : null;

  const typeLabel = isCustom && displayRound
    ? `${displayRound}`
    : TYPE_LABEL[type] ?? 'Event';

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleRemove = async () => {
    if (isCustom) {
      if (!window.confirm('Delete this custom event? It will also be removed from Google Calendar if connected.')) return;
    } else {
      const typeLabel = TYPE_LABEL[type] ?? 'event';
      if (!window.confirm(`Remove this ${typeLabel.toLowerCase()} event? This clears the scheduled date on the job application but does NOT delete the application itself.`)) return;
    }

    setIsDeleting(true);
    try {
      // For both custom and generated events, we call deleteCalendarEvent.
      // The backend distinguishes: generated events clear the job's date field;
      // custom events are deleted from the Event collection.
      await deleteCalendarEvent(event.id);
      onClose();
      onDelete?.();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to remove event');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    if (isCustom) {
      onEditCustomEvent?.(event);
    } else {
      onEditJob?.(resource);
    }
  };

  // ── Shared modal content ──────────────────────────────────────────────────
  const ModalContent = (
    <>
      {/* Header */}
      <div className="px-5 pt-5 pb-4 sm:px-6 sm:pt-6 border-b border-border flex items-start justify-between gap-4 shrink-0">
        <div className="min-w-0 flex-1">
          {/* Event type + status badges row */}
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${TYPE_BADGE[type] ?? TYPE_BADGE.custom}`}>
              {typeLabel}
            </span>
            {displayStatus && JOB_STATUS_STYLES[displayStatus] && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${JOB_STATUS_STYLES[displayStatus]}`}>
                <Briefcase className="w-3 h-3 mr-1" />
                {displayStatus}
              </span>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-text leading-snug">{displayTitle}</h2>
          {displayCompany && (
            <div className="flex items-center gap-1.5 text-text-muted text-sm mt-1.5">
              <Building2 className="w-4 h-4 text-primary shrink-0" />
              <span className="font-medium">{displayCompany}</span>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-surface-elevated text-text-muted hover:text-text transition-colors shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content — scrollable */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-4">

        {/* Date & Time */}
        <DetailRow icon={CalendarIcon}>
          <p className="text-sm font-semibold text-text">{format(start, 'EEEE, MMMM d, yyyy')}</p>
          <p className="text-sm text-text-muted flex items-center gap-1 mt-0.5">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            {format(start, 'h:mm a')}
            {end && start.getTime() !== end.getTime() && (
              <span> – {format(end, 'h:mm a')}</span>
            )}
          </p>
        </DetailRow>

        {/* Meeting Link */}
        {displayMeetingLink && (
          <DetailRow icon={Video} iconClass="text-indigo-400">
            <a
              href={displayMeetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-primary hover:underline flex items-center gap-1.5 truncate"
            >
              Join Video Meeting <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
          </DetailRow>
        )}

        {/* Job Application Link */}
        {displayJobUrl && (
          <DetailRow icon={ExternalLink} iconClass="text-text-muted">
            <a
              href={displayJobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-primary hover:underline flex items-center gap-1.5 truncate"
            >
              View Job Posting <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
          </DetailRow>
        )}

        {/* Reminder status — all events (data sourced from eventMeta) */}
        {syncStatus && (
          <DetailRow icon={Bell} iconClass="text-text-muted">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Reminders &amp; Sync</p>
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                reminder24hSent
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-surface text-text-muted border-border'
              }`}>
                {reminder24hSent ? <CheckCircle className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
                24h reminder {reminder24hSent ? 'sent' : 'pending'}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                reminder1hSent
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-surface text-text-muted border-border'
              }`}>
                {reminder1hSent ? <CheckCircle className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
                1h reminder {reminder1hSent ? 'sent' : 'pending'}
              </span>
              {syncStatus && SYNC_STATUS[syncStatus] && (() => {
                const s = SYNC_STATUS[syncStatus];
                const Icon = s.icon;
                return (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${s.cls} bg-opacity-10`}>
                    <Icon className="w-3 h-3" /> {s.label}
                  </span>
                );
              })()}
            </div>
          </DetailRow>
        )}

        {/* Notification preference — job events only */}
        {!isCustom && emailNotifsEnabled !== null && (
          <DetailRow icon={Bell} iconClass="text-text-muted">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Notifications</p>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
              emailNotifsEnabled
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-surface text-text-muted border-border'
            }`}>
              {emailNotifsEnabled ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
              Interview reminders {emailNotifsEnabled ? 'enabled' : 'disabled'}
            </span>
          </DetailRow>
        )}

        {/* Notes / Description */}
        {displayNotes && (
          <div className="pt-3 border-t border-border">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              {isCustom ? 'Description' : 'Notes'}
            </h4>
            <div className="p-4 rounded-xl bg-surface/50 border border-border text-sm text-text-muted whitespace-pre-wrap max-h-40 overflow-y-auto custom-scrollbar leading-relaxed">
              {displayNotes}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 sm:px-6 border-t border-border bg-surface/50 flex items-center justify-between gap-3 shrink-0">
        <Button
          variant="danger"
          disabled={isDeleting}
          onClick={handleRemove}
          className="text-rose-500 hover:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border-transparent h-9 px-3 text-sm"
        >
          <Trash2 className="w-4 h-4 mr-1.5" />
          {isDeleting ? 'Removing…' : 'Remove'}
        </Button>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleEdit}
            className="h-9 px-4 text-sm font-medium"
          >
            <Edit2 className="w-4 h-4 mr-1.5" />
            {isCustom ? 'Edit Event' : 'Edit Job'}
          </Button>
          <Button onClick={onClose} variant="secondary" className="h-9 px-4 text-sm">
            Close
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Mobile: Bottom Sheet ── */}
          <div className="fixed inset-0 z-50 sm:hidden flex items-end justify-center">
            <motion.div
              key="event-backdrop-mobile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            />
            <motion.div
              key="event-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              className="relative w-full max-h-[92vh] glass-panel rounded-t-3xl shadow-2xl flex flex-col z-10 overflow-hidden"
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-0 shrink-0">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>
              {ModalContent}
            </motion.div>
          </div>

          {/* ── Desktop: Centered Modal ── */}
          <div className="fixed inset-0 z-50 hidden sm:flex items-center justify-center p-4 sm:p-6">
            <motion.div
              key="event-backdrop-desktop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              key="event-dialog"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full max-w-lg max-h-[88vh] glass-panel rounded-2xl shadow-2xl flex flex-col z-10 overflow-hidden"
            >
              {ModalContent}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
