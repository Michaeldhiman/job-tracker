import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Briefcase, Building2, MapPin, IndianRupee, Calendar, Link as LinkIcon, User, Mail, Tag, AlignLeft, AlertCircle, Plus, FileText, Check, ChevronDown } from 'lucide-react';
import { createJob, updateJob, getCompanies, getResumes, uploadResumeDirect } from '../../api/jobsApi.js';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card.jsx';
import { useToast } from '../../context/ToastContext.jsx';

import { PIPELINE_STATUSES } from '../../utils/constants.js';

const jobSchema = z.object({
  company: z.string().min(2, "Company name must be at least 2 characters"),
  role: z.string().min(2, "Role must be at least 2 characters"),
  status: z.enum(["Applied", "Assessment", "Interview", "Offer", "Rejected"]).optional(),
  appliedDate: z.string().optional().nullable().or(z.literal("")),
  source: z.enum(["LinkedIn", "Naukri", "Referral", "Career Page", "Indeed", "Internshala", "Other"]).optional(),
  priority: z.enum(["Low", "Medium", "High"]).optional(),
  location: z.string().optional(),
  salary: z.string().optional(),
  recruiterName: z.string().optional(),
  recruiterEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  jobUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  tags: z.string().optional(),
  notes: z.string().optional(),
  resumeId: z.string().optional()
});

export default function AddJobModal({ isOpen, onClose, onSuccess, jobToEdit = null }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const inlineResumeInputRef = useRef(null);
  const { success: toastSuccess, error: toastError } = useToast();

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      status: "Applied",
      source: "LinkedIn",
      priority: "Medium",
      appliedDate: new Date().toISOString().split('T')[0],
      resumeId: ""
    }
  });

  const selectedStatus = watch("status");
  const selectedResumeId = watch("resumeId");

  useEffect(() => {
    if (isOpen) {
      // Load companies
      getCompanies({ limit: 100 })
        .then(res => setCompanies(res.companies || []))
        .catch(console.error);

      // Load resumes
      getResumes({ limit: 100 })
        .then(res => setResumes(res.resumes || []))
        .catch(console.error);

      if (jobToEdit) {
        reset({
          company: jobToEdit.company || '',
          role: jobToEdit.role || '',
          status: jobToEdit.status || 'Applied',
          appliedDate: jobToEdit.appliedDate ? new Date(jobToEdit.appliedDate).toISOString().split('T')[0] : '',
          source: jobToEdit.source || 'LinkedIn',
          priority: jobToEdit.priority || 'Medium',
          location: jobToEdit.location || '',
          salary: jobToEdit.salary ? String(jobToEdit.salary) : '',
          recruiterName: jobToEdit.recruiterName || '',
          recruiterEmail: jobToEdit.recruiterEmail || '',
          jobUrl: jobToEdit.jobUrl || '',
          tags: jobToEdit.tags ? jobToEdit.tags.join(', ') : '',
          notes: jobToEdit.notes || '',
          resumeId: jobToEdit.resumeId?._id || jobToEdit.resumeId || ''
        });
      } else {
        reset({
          status: "Applied",
          source: "LinkedIn",
          priority: "Medium",
          appliedDate: new Date().toISOString().split('T')[0],
          company: '',
          role: '',
          location: '',
          salary: '',
          recruiterName: '',
          recruiterEmail: '',
          jobUrl: '',
          tags: '',
          notes: '',
          resumeId: ''
        });
      }
      setError(null);
    } else {
      reset();
      setError(null);
    }
  }, [isOpen, reset, jobToEdit]);

  const handleInlineUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingResume(true);
      setError(null);
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await uploadResumeDirect(formData);
      const newResume = res.resume;
      if (newResume) {
        setResumes(prev => {
          if (prev.some(r => r._id === newResume._id)) {
            return prev;
          }
          return [newResume, ...prev];
        });
        setValue('resumeId', newResume._id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload resume');
    } finally {
      setIsUploadingResume(false);
      if (inlineResumeInputRef.current) inlineResumeInputRef.current.value = '';
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError(null);
    try {
      // Transform data
      const payload = { ...data };
      if (payload.salary) payload.salary = Number(payload.salary);
      if (!payload.salary) delete payload.salary;
      if (payload.tags) {
        payload.tags = payload.tags.split(',').map(t => t.trim()).filter(Boolean);
      } else {
        payload.tags = [];
      }
      if (!payload.jobUrl) delete payload.jobUrl;
      if (!payload.recruiterEmail) delete payload.recruiterEmail;

      // Map resumeUrl and resumeName for preservation
      if (payload.resumeId) {
        const selected = resumes.find(r => r._id === payload.resumeId);
        if (selected) {
          payload.resumeName = selected.name;
          payload.resumeUrl = selected.url;
        }
      } else {
        payload.resumeId = null;
        payload.resumeName = null;
        payload.resumeUrl = null;
      }
      
      if (jobToEdit) {
        await updateJob(jobToEdit._id, payload);
        toastSuccess(`Updated "${payload.role}" at ${payload.company}`, 'Application updated');
      } else {
        await createJob(payload);
        toastSuccess(`Added "${payload.role}" at ${payload.company}`, 'Application added');
      }
      onSuccess();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to save application";
      setError(msg);
      toastError(msg, 'Save failed');
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
              className="w-full max-w-2xl pointer-events-auto max-h-[90vh] flex flex-col"
            >
              <Card className="flex flex-col h-full border border-border shadow-2xl overflow-hidden bg-surface">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border bg-surface-elevated/50 p-4 shrink-0">
                  <CardTitle className="text-xl">{jobToEdit ? 'Edit Application' : 'Add New Application'}</CardTitle>
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

                  <form id="add-job-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Basic Info */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-text">Company <span className="text-rose-500">*</span></label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                          <input 
                            list="companies-list"
                            {...register("company")}
                            placeholder="e.g. Google"
                            className={`w-full bg-background border ${errors.company ? 'border-rose-500' : 'border-border'} rounded-lg pl-9 pr-4 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all`}
                          />
                          <datalist id="companies-list">
                            {companies.map(c => <option key={c._id} value={c.name} />)}
                          </datalist>
                        </div>
                        {errors.company && <p className="text-xs text-rose-500">{errors.company.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-text">Role <span className="text-rose-500">*</span></label>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                          <input 
                            {...register("role")}
                            placeholder="e.g. Frontend Engineer"
                            className={`w-full bg-background border ${errors.role ? 'border-rose-500' : 'border-border'} rounded-lg pl-9 pr-4 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all`}
                          />
                        </div>
                        {errors.role && <p className="text-xs text-rose-500">{errors.role.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-text">Status</label>
                        <div className="relative">
                          <select 
                            {...register("status")}
                            className="w-full bg-background border border-border rounded-lg pl-4 pr-10 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all appearance-none cursor-pointer"
                          >
                            {PIPELINE_STATUSES.map(status => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-text">Applied Date</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                          <input 
                            type="date"
                            {...register("appliedDate")}
                            className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all [color-scheme:dark]"
                          />
                        </div>
                      </div>

                      {/* Details */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-text">Location</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                          <input 
                            {...register("location")}
                            placeholder="e.g. Remote, Bangalore"
                            className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-text">Salary Expected</label>
                        <div className="relative">
                          <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                          <input 
                            type="number"
                            {...register("salary")}
                            placeholder="e.g. 150000"
                            className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-text">Source</label>
                        <div className="relative">
                          <select 
                            {...register("source")}
                            className="w-full bg-background border border-border rounded-lg pl-4 pr-10 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all appearance-none cursor-pointer"
                          >
                            <option value="LinkedIn">LinkedIn</option>
                            <option value="Naukri">Naukri</option>
                            <option value="Referral">Referral</option>
                            <option value="Career Page">Career Page</option>
                            <option value="Indeed">Indeed</option>
                            <option value="Internshala">Internshala</option>
                            <option value="Other">Other</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-text">Priority</label>
                        <div className="relative">
                          <select 
                            {...register("priority")}
                            className="w-full bg-background border border-border rounded-lg pl-4 pr-10 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all appearance-none cursor-pointer"
                          >
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                        </div>
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-sm font-medium text-text">Job URL</label>
                        <div className="relative">
                          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                          <input 
                            {...register("jobUrl")}
                            placeholder="https://"
                            className={`w-full bg-background border ${errors.jobUrl ? 'border-rose-500' : 'border-border'} rounded-lg pl-9 pr-4 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all`}
                          />
                        </div>
                        {errors.jobUrl && <p className="text-xs text-rose-500">{errors.jobUrl.message}</p>}
                      </div>

                      {/* Recruiter */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-text">Recruiter Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                          <input 
                            {...register("recruiterName")}
                            placeholder="Name"
                            className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-text">Recruiter Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                          <input 
                            type="email"
                            {...register("recruiterEmail")}
                            placeholder="email@company.com"
                            className={`w-full bg-background border ${errors.recruiterEmail ? 'border-rose-500' : 'border-border'} rounded-lg pl-9 pr-4 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all`}
                          />
                        </div>
                        {errors.recruiterEmail && <p className="text-xs text-rose-500">{errors.recruiterEmail.message}</p>}
                      </div>

                      {/* Resume Selection & Inline Upload */}
                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-sm font-medium text-text flex justify-between items-center">
                          <span className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-primary" /> Submitted Resume</span>
                          {isUploadingResume && <span className="text-xs text-primary animate-pulse">Uploading to Cloudinary...</span>}
                          {!isUploadingResume && selectedResumeId && <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Resume is Uploaded</span>}
                        </label>
                        <div className="flex gap-2">
                          {selectedResumeId ? (
                            <div className="flex-1 flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2 text-sm text-emerald-400">
                              <div className="flex items-center gap-2 truncate">
                                <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span className="font-semibold truncate">
                                  {resumes.find(r => r._id === selectedResumeId)?.name || jobToEdit?.resumeId?.name || jobToEdit?.resumeName || "Linked Resume"}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setValue("resumeId", "")}
                                className="text-xs text-rose-500 hover:text-rose-400 font-semibold ml-2 shrink-0 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="relative flex-1">
                                <select 
                                  {...register("resumeId")}
                                  className="w-full bg-background border border-border rounded-lg pl-4 pr-10 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all appearance-none cursor-pointer"
                                >
                                  <option value="">No Resume Linked</option>
                                  {resumes.map(r => (
                                    <option key={r._id} value={r._id}>
                                      {r.name} ({new Date(r.createdAt).toLocaleDateString()})
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                              </div>
                              <input 
                                type="file"
                                ref={inlineResumeInputRef}
                                onChange={handleInlineUpload}
                                accept=".pdf,.doc,.docx"
                                className="hidden"
                              />
                              <button
                                type="button"
                                onClick={() => inlineResumeInputRef.current?.click()}
                                disabled={isUploadingResume}
                                className="px-3 py-2 bg-white/5 border border-border rounded-lg text-sm text-text hover:bg-white/10 transition-colors flex items-center gap-1.5 shrink-0"
                              >
                                <Plus className="w-4 h-4" /> Upload New
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-sm font-medium text-text">Tags (comma separated)</label>
                        <div className="relative">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                          <input 
                            {...register("tags")}
                            placeholder="React, Node.js, Remote"
                            className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-sm font-medium text-text">Notes</label>
                        <div className="relative">
                          <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
                          <textarea 
                            {...register("notes")}
                            rows="3"
                            placeholder="Any additional information..."
                            className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none"
                          />
                        </div>
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
                    form="add-job-form"
                    disabled={isSubmitting}
                    className="px-6 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-hover focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      jobToEdit ? 'Save Changes' : 'Add Application'
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
