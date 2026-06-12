import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, MapPin, Link as LinkIcon, Building2, Tag, AlignLeft, AlertCircle } from 'lucide-react';
import { createCalendarEvent } from '../../api/calendarApi.js';
import { searchJobs } from '../../api/jobsApi.js';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import Select from '../ui/Select.jsx';

const eventSchema = z.object({
  title: z.string().min(1, "Event title is required"),
  company: z.string().optional().nullable(),
  interviewRound: z.string().optional().nullable(),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid start time format (HH:MM)"),
  endTime: z.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid end time format (HH:MM)"),
  location: z.string().optional().nullable(),
  meetingLink: z.string().url("Invalid link format (must start with https://)").optional().or(z.literal("")).nullable(),
  description: z.string().optional().nullable(),
  jobId: z.string().optional().nullable(),
});

export default function NewEventModal({ isOpen, onClose, onSuccess, initialDate = null }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [jobs, setJobs] = useState([]);

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      startTime: "09:00",
      endTime: "10:00",
    }
  });

  const selectedJobId = watch('jobId');

  useEffect(() => {
    if (isOpen) {
      searchJobs({ limit: 100 })
        .then(res => setJobs(res.results || []))
        .catch(console.error);

      if (initialDate) {
        setValue('date', initialDate);
      }
    } else {
      reset();
      setError(null);
    }
  }, [isOpen, reset, initialDate, setValue]);

  // Autofill company name when a job is selected
  useEffect(() => {
    if (selectedJobId) {
      const selectedJob = jobs.find(j => j._id === selectedJobId);
      if (selectedJob) {
        setValue('company', selectedJob.company);
        setValue('title', `Interview with ${selectedJob.company}`);
        if (selectedJob.status) {
          setValue('interviewRound', selectedJob.status);
        }
      }
    }
  }, [selectedJobId, jobs, setValue]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError(null);
    try {
      // Clean up fields before POSTing
      const payload = { ...data };
      if (!payload.jobId) delete payload.jobId;
      if (!payload.meetingLink) delete payload.meetingLink;
      
      await createCalendarEvent(payload);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to create event");
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
              className="w-full max-w-xl pointer-events-auto max-h-[90vh] flex flex-col"
            >
              <Card className="flex flex-col h-full border border-border shadow-2xl overflow-hidden bg-surface">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border bg-surface-elevated/50 p-4 shrink-0">
                  <CardTitle className="text-xl">Create New Event</CardTitle>
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
                    
                    {/* Link to Job Application */}
                    <div className="space-y-1.5">
                      <Select 
                        label="Link to Application (Optional)"
                        {...register("jobId")}
                        options={jobs.map(j => ({
                          value: j._id,
                          label: `${j.role} at ${j.company} (${j.status})`
                        }))}
                        placeholder="-- Select an active job application --"
                      />
                    </div>

                    {/* Event Title */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-text">Event Title <span className="text-rose-500">*</span></label>
                      <input 
                        type="text"
                        {...register("title")}
                        placeholder="e.g. Technical Interview"
                        className={`w-full bg-background border ${errors.title ? 'border-rose-500' : 'border-border'} rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all`}
                      />
                      {errors.title && <p className="text-xs text-rose-500">{errors.title.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Company Name */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-text">Company Name</label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                          <input 
                            type="text"
                            {...register("company")}
                            placeholder="e.g. Stripe"
                            className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                          />
                        </div>
                      </div>

                      {/* Interview Round */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-text">Round / Category</label>
                        <input 
                          type="text"
                          {...register("interviewRound")}
                          placeholder="e.g. Technical Interview"
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                        />
                      </div>
                    </div>

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

                    <div className="grid grid-cols-2 gap-4">
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

                      {/* End Time */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-text">End Time <span className="text-rose-500">*</span></label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                          <input 
                            type="time"
                            {...register("endTime")}
                            onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }}
                            className={`w-full bg-background border ${errors.endTime ? 'border-rose-500' : 'border-border'} rounded-lg pl-9 pr-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer`}
                          />
                        </div>
                        {errors.endTime && <p className="text-xs text-rose-500">{errors.endTime.message}</p>}
                      </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-text">Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                        <input 
                          type="text"
                          {...register("location")}
                          placeholder="e.g. Zoom Link, Seattle Office"
                          className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                        />
                      </div>
                    </div>

                    {/* Meeting Link */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-text">Video Meeting Link (URL)</label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                        <input 
                          type="text"
                          {...register("meetingLink")}
                          placeholder="https://zoom.us/j/..."
                          className={`w-full bg-background border ${errors.meetingLink ? 'border-rose-500' : 'border-border'} rounded-lg pl-9 pr-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all`}
                        />
                      </div>
                      {errors.meetingLink && <p className="text-xs text-rose-500">{errors.meetingLink.message}</p>}
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-text">Description</label>
                      <div className="relative">
                        <AlignLeft className="absolute left-3 top-2.5 w-4 h-4 text-text-muted pointer-events-none" />
                        <textarea 
                          {...register("description")}
                          rows="2"
                          placeholder="Interviewers, agenda, or preparation notes..."
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
                    className="px-4 py-2 rounded-lg text-sm font-medium text-text hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    form="new-event-form"
                    disabled={isSubmitting}
                    className="px-6 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Event'
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
