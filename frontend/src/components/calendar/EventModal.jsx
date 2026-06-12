import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Calendar as CalendarIcon, MapPin, Building2, ExternalLink, Trash2, Clock, Link as LinkIcon, Video } from 'lucide-react';
import Button from '../ui/Button.jsx';
import { format } from 'date-fns';
import { deleteCalendarEvent } from '../../api/calendarApi.js';
import { deleteJob } from '../../api/jobsApi.js';

export default function EventModal({ isOpen, onClose, event, onDelete, onEditJob }) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!event) return null;

  const { title, start, end, type, resource } = event;

  const getTypeStyle = (type) => {
    switch (type) {
      case 'interview': return 'text-primary bg-primary/10 border-primary/20';
      case 'followUp': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'assessment': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      case 'offer': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'rejected': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'custom': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  };

  const getLabel = (type) => {
    switch(type) {
      case 'interview': return 'Interview';
      case 'followUp': return 'Follow Up';
      case 'assessment': return 'Assessment';
      case 'offer': return 'Offer';
      case 'rejected': return 'Rejected';
      case 'custom': return resource?.interviewRound ? `${resource.interviewRound} (Custom)` : 'Event';
      default: return 'Event';
    }
  };

  // Determine display values based on event type
  const isCustom = type === 'custom';
  const displayTitle = isCustom ? title : (resource?.role ? `${resource.role} Interview` : title);
  const displayCompany = isCustom ? (resource?.company || '') : (resource?.company || '');
  const displayNotes = isCustom ? (resource?.description || '') : (resource?.notes || '');
  const displayLocation = isCustom ? (resource?.location || '') : (resource?.location || '');
  const displayMeetingLink = isCustom ? (resource?.meetingLink || '') : '';
  const displayJobUrl = !isCustom ? (resource?.jobUrl || '') : '';

  const handleRemove = async () => {
    if (isCustom) {
      if (window.confirm("Are you sure you want to delete this event? This will also remove it from Google Calendar if connected.")) {
        setIsDeleting(true);
        try {
          await deleteCalendarEvent(resource._id);
          onClose();
          if (onDelete) onDelete();
        } catch (err) {
          alert(err.response?.data?.message || err.message || "Failed to delete event");
        } finally {
          setIsDeleting(false);
        }
      }
    } else {
      const company = resource?.company || 'Specified Company';
      const role = resource?.role || 'Job Application';
      if (window.confirm(`Are you sure you want to delete your application for ${role} at ${company}? This will remove all associated events and notes.`)) {
        setIsDeleting(true);
        try {
          await deleteJob(resource._id);
          onClose();
          if (onDelete) onDelete();
        } catch (err) {
          alert(err.response?.data?.message || err.message || "Failed to delete job application");
        } finally {
          setIsDeleting(false);
        }
      }
    }
  };

  const handleEdit = () => {
    if (!isCustom) {
      onEditJob?.(resource);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg glass-panel rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-border flex items-start justify-between">
              <div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getTypeStyle(type)} mb-3`}>
                  {getLabel(type)}
                </span>
                <h2 className="text-xl font-bold text-text mb-1">{displayTitle}</h2>
                {displayCompany && (
                  <div className="flex items-center gap-2 text-text-muted text-sm mt-1">
                    <Building2 className="w-4 h-4 text-primary" />
                    <span>{displayCompany}</span>
                  </div>
                )}
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-surface-elevated text-text-muted hover:text-text transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <div className="flex flex-col gap-4">
                {/* Date & Time */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-surface border border-border">
                    <CalendarIcon className="w-5 h-5 text-text-muted" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text">{format(start, 'EEEE, MMMM d, yyyy')}</p>
                    <p className="text-sm text-text-muted flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      {format(start, 'h:mm a')} {end && start.getTime() !== end.getTime() && `- ${format(end, 'h:mm a')}`}
                    </p>
                  </div>
                </div>

                {/* Location */}
                {displayLocation && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-surface border border-border">
                      <MapPin className="w-5 h-5 text-text-muted" />
                    </div>
                    <div className="py-1">
                      <p className="text-sm font-medium text-text">{displayLocation}</p>
                    </div>
                  </div>
                )}

                {/* Meeting Link */}
                {displayMeetingLink && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-surface border border-border">
                      <Video className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="py-1 flex-1 min-w-0">
                      <a 
                        href={displayMeetingLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-primary hover:underline flex items-center gap-1.5 truncate"
                      >
                        Join Video Meeting <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Description/Notes */}
              {displayNotes && (
                <div className="pt-4 border-t border-border">
                  <h4 className="text-sm font-semibold text-text mb-2">
                    {isCustom ? "Description" : "Notes"}
                  </h4>
                  <div className="p-4 rounded-xl bg-surface/50 border border-border text-sm text-text-muted whitespace-pre-wrap max-h-40 overflow-y-auto custom-scrollbar">
                    {displayNotes}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-surface/50 flex items-center justify-between">
              <Button 
                variant="danger" 
                disabled={isDeleting}
                onClick={handleRemove}
                className="text-rose-500 hover:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border-transparent h-9 px-3"
              >
                <Trash2 className="w-4 h-4 mr-1.5" /> 
                {isDeleting ? 'Removing...' : 'Remove'}
              </Button>
              
              <div className="flex items-center gap-2">
                {displayJobUrl && (
                  <a 
                    href={displayJobUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors bg-surface-elevated hover:bg-border border border-border text-text text-sm h-9"
                  >
                    <ExternalLink className="w-4 h-4" /> View Job
                  </a>
                )}
                {!isCustom && (
                  <Button 
                    onClick={handleEdit} 
                    className="h-9 px-4 bg-primary hover:bg-primary-hover text-white font-medium"
                  >
                    Edit Details
                  </Button>
                )}
                <Button onClick={onClose} className="h-9 px-4">Close</Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
