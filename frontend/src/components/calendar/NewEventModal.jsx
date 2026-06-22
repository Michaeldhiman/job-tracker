import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, AlignLeft, AlertCircle, FileText } from 'lucide-react';
import { createCalendarEvent, updateCalendarEvent } from '../../api/calendarApi.js';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid start time format (HH:MM)"),
  description: z.string().optional().nullable(),
});

export default function NewEventModal({ isOpen, onClose, onSuccess, initialDate = null, eventToEdit = null }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      date: new Date().toISOString().split('T')[0],
      startTime: "09:00",
      description: "",
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (eventToEdit) {
        reset({
          title: eventToEdit.title || '',
          date: eventToEdit.date ? new Date(eventToEdit.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          startTime: eventToEdit.startTime || '09:00',
          description: eventToEdit.description || '',
        });
      } else {
        reset({
          title: '',
          date: initialDate || new Date().toISOString().split('T')[0],
          startTime: "09:00",
          description: "",
        });
      }
      setError(null);
    } else {
      reset();
      setError(null);
    }
  }, [isOpen, reset, initialDate, eventToEdit]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = { ...data };

      // Calculate endTime defaulting to 1 hour (60 minutes) after startTime
      const [sh, sm] = payload.startTime.split(':').map(Number);
      const totalMinutes = sh * 60 + sm + 60;
      const eh = Math.floor(totalMinutes / 60) % 24;
      const em = totalMinutes % 60;
      payload.endTime = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;

      if (eventToEdit) {
        // If the event was linked to a job, pass jobId and eventType to keep links
        if (eventToEdit.jobId) payload.jobId = eventToEdit.jobId._id || eventToEdit.jobId;
        if (eventToEdit.eventType) payload.eventType = eventToEdit.eventType;
        await updateCalendarEvent(eventToEdit._id, payload);
      } else {
        await createCalendarEvent(payload);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to save event");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-lg pointer-events-auto max-h-[90vh] flex flex-col"
            >
              <Card className="flex flex-col h-full border border-border shadow-2xl overflow-hidden bg-surface">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border bg-surface-elevated/50 p-4 shrink-0">
                  <CardTitle className="text-xl">
                    {eventToEdit ? 'Edit Event Details' : 'Create New Custom Event'}
                  </CardTitle>
                  <button onClick={onClose} className="p-1.5 rounded-md hover:bg-white/10 text-text-muted hover:text-text transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </CardHeader>
                
                <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
                  {error && (
                    <div className="mb-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-start gap-3 text-sm">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <p>{error}</p>
                    </div>
                  )}

                  <form id="new-event-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    
                    {/* Event Title */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-text">Title <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                        <input 
                          type="text"
                          {...register("title")}
                          placeholder="e.g. Prep for Stripe Interview"
                          className={`w-full bg-background border ${errors.title ? 'border-rose-500' : 'border-border'} rounded-lg pl-9 pr-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all`}
                        />
                      </div>
                      {errors.title && <p className="text-xs text-rose-500">{errors.title.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Date Picker */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-text">Date <span className="text-rose-500">*</span></label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                          <input 
                            type="date"
                            {...register("date")}
                            onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }}
                            className={`w-full bg-background border ${errors.date ? 'border-rose-500' : 'border-border'} rounded-lg pl-9 pr-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer`}
                          />
                        </div>
                        {errors.date && <p className="text-xs text-rose-500">{errors.date.message}</p>}
                      </div>

                      {/* Start Time */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-text">Start Time <span className="text-rose-500">*</span></label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                          <input 
                            type="time"
                            {...register("startTime")}
                            onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }}
                            className={`w-full bg-background border ${errors.startTime ? 'border-rose-500' : 'border-border'} rounded-lg pl-9 pr-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer`}
                          />
                        </div>
                        {errors.startTime && <p className="text-xs text-rose-500">{errors.startTime.message}</p>}
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-text">Description</label>
                      <div className="relative">
                        <AlignLeft className="absolute left-3 top-2.5 w-4 h-4 text-text-muted pointer-events-none" />
                        <textarea 
                          {...register("description")}
                          rows="3"
                          placeholder="Event notes, guidelines, or preparation details..."
                          className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none"
                        />
                      </div>
                    </div>

                  </form>
                </div>
                
                <CardFooter className="border-t border-border bg-surface-elevated/30 p-4 shrink-0 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-text hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    form="new-event-form"
                    disabled={isSubmitting}
                    className="px-6 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      eventToEdit ? 'Save Changes' : 'Create Event'
                    )}
                  </button>
                </CardFooter>
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
