import { AnimatePresence, motion } from 'framer-motion';
import { X, Calendar as CalendarIcon, MapPin, Building2, ExternalLink, Trash2, Clock } from 'lucide-react';
import Button from '../ui/Button.jsx';
import { format } from 'date-fns';

export default function EventModal({ isOpen, onClose, event }) {
  if (!event) return null;

  const { title, start, end, type, resource: job } = event;

  const getTypeStyle = (type) => {
    switch (type) {
      case 'interview': return 'text-primary bg-primary/10 border-primary/20';
      case 'followUp': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'assessment': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      case 'offer': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'rejected': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
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
      default: return 'Event';
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
                <h2 className="text-xl font-bold text-text mb-1">{job?.role}</h2>
                <div className="flex items-center gap-2 text-text-muted">
                  <Building2 className="w-4 h-4" />
                  <span>{job?.company}</span>
                </div>
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

                {job?.location && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-surface border border-border">
                      <MapPin className="w-5 h-5 text-text-muted" />
                    </div>
                    <div className="py-1">
                      <p className="text-sm font-medium text-text">{job.location}</p>
                    </div>
                  </div>
                )}
              </div>

              {job?.notes && (
                <div className="pt-4 border-t border-border">
                  <h4 className="text-sm font-semibold text-text mb-2">Notes</h4>
                  <div className="p-4 rounded-xl bg-surface/50 border border-border text-sm text-text-muted whitespace-pre-wrap">
                    {job.notes}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-surface/50 flex items-center justify-between">
              <Button variant="danger" className="text-rose-500 hover:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border-transparent h-9 px-3">
                <Trash2 className="w-4 h-4 mr-1.5" /> Remove
              </Button>
              <div className="flex items-center gap-2">
                {job?.jobUrl && (
                  <a href={job.jobUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors bg-surface-elevated hover:bg-border border border-border text-text text-sm h-9">
                    <ExternalLink className="w-4 h-4" /> View Job
                  </a>
                )}
                <Button className="h-9 px-4">Edit Details</Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
