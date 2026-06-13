import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Briefcase, Building2, MapPin, IndianRupee, Calendar, 
  Link as LinkIcon, User, Mail, Tag, AlignLeft, AlertCircle, 
  Trash2, Clock, Globe, BarChart2, FileText, ExternalLink, Download, Edit 
} from 'lucide-react';
import { updateJob, deleteJob } from '../../api/jobsApi.js';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import InterviewHistory from './InterviewHistory.jsx';

const STAGES = [
  { id: 'Applied', label: 'Applied', activeClass: 'bg-indigo-500 text-white border-indigo-500' },
  { id: 'Assessment', label: 'Assessment', activeClass: 'bg-purple-500 text-white border-purple-500' },
  { id: 'Interview', label: 'Interview', activeClass: 'bg-orange-500 text-white border-orange-500' },
  { id: 'Offer', label: 'Offer', activeClass: 'bg-emerald-500 text-white border-emerald-500' },
  { id: 'Rejected', label: 'Rejected', activeClass: 'bg-rose-500 text-white border-rose-500' },
];

export default function JobDetailsModal({ isOpen, job, onClose, onSuccess, onEdit, onJobUpdated }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const { success: toastSuccess, error: toastError } = useToast();

  if (!job) return null;

  const handleStageChange = async (newStage) => {
    if (job.status === newStage || isUpdating) return;
    
    setIsUpdating(true);
    setError(null);
    try {
      await updateJob(job._id, { status: newStage });
      toastSuccess(`Moved to "${newStage}"`, `${job.role} updated`);
      onSuccess();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to update status";
      setError(msg);
      toastError(msg, 'Update failed');
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete your application for ${job.role} at ${job.company}?`)) {
      setIsDeleting(true);
      setError(null);
      try {
        await deleteJob(job._id);
        toastSuccess(`"${job.role}" at ${job.company} deleted`, 'Application deleted');
        onSuccess();
      } catch (err) {
        const msg = err.response?.data?.message || err.message || "Failed to delete job";
        setError(msg);
        toastError(msg, 'Delete failed');
        setIsDeleting(false);
      }
    }
  };

  // Format currency
  const formatSalary = (val) => {
    if (!val) return 'Not specified';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const currentStageInfo = STAGES.find(s => s.id === job.status) || STAGES[1];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-3xl pointer-events-auto max-h-[90vh] flex flex-col"
            >
              <Card className="flex flex-col h-full border border-border shadow-2xl overflow-hidden bg-surface">
                {/* Header */}
                <CardHeader className="flex flex-row items-start justify-between border-b border-border bg-surface-elevated/50 p-4 shrink-0">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-lg mt-0.5 shrink-0">
                      {job.company.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-text flex items-center gap-2 flex-wrap">
                        {job.role}
                      </CardTitle>
                      <p className="text-sm text-text-muted flex items-center gap-1.5 mt-0.5">
                        <Building2 className="w-4 h-4 text-primary shrink-0" />
                        <span className="font-medium text-text/80">{job.company}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                      job.priority === 'High' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                      job.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                      'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    }`}>
                      {job.priority} Priority
                    </span>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-text-muted hover:text-text transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </CardHeader>
                
                {/* Content Area */}
                <div className="overflow-y-auto p-6 flex-1 custom-scrollbar space-y-6">
                  {error && (
                    <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-start gap-3 text-sm">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <p>{error}</p>
                    </div>
                  )}

                  {/* Stage Selector (Tapping to move stage) */}
                  <div className="bg-surface-elevated/40 border border-border p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-semibold text-text uppercase tracking-wider flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-primary" /> 
                        Pipeline Stage {isUpdating && <span className="text-xs text-text-muted normal-case font-normal">(Updating...)</span>}
                      </h4>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${currentStageInfo.activeClass}`}>
                        {job.status}
                      </span>
                    </div>
                    
                    {/* Stage Grid - Super easy to tap on Mobile */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {STAGES.map((stage) => {
                        const isActive = job.status === stage.id;
                        return (
                          <button
                            key={stage.id}
                            disabled={isUpdating}
                            onClick={() => handleStageChange(stage.id)}
                            className={`py-2 px-3 rounded-lg text-xs font-semibold border text-center transition-all ${
                              isActive 
                                ? stage.activeClass + " shadow-md"
                                : "border-border bg-background text-text-muted hover:text-text hover:border-primary/50"
                            } ${isUpdating ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            {stage.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Grid of Key Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column details */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-text border-b border-border/60 pb-1.5">Job Information</h4>
                      
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center py-0.5">
                          <span className="text-text-muted flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> Applied Date
                          </span>
                          <span className="text-text font-medium">{formatDate(job.appliedDate)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center py-0.5">
                          <span className="text-text-muted flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> Location
                          </span>
                          <span className="text-text font-medium">{job.location || 'Remote / Unspecified'}</span>
                        </div>
                        
                        <div className="flex justify-between items-center py-0.5">
                          <span className="text-text-muted flex items-center gap-2">
                            <IndianRupee className="w-4 h-4" /> Salary Expected
                          </span>
                          <span className="text-text font-medium">{formatSalary(job.salary)}</span>
                        </div>

                        <div className="flex justify-between items-center py-0.5">
                          <span className="text-text-muted flex items-center gap-2">
                            <Globe className="w-4 h-4" /> Source
                          </span>
                          <span className="text-text font-medium">{job.source || 'Other'}</span>
                        </div>

                        {job.jobUrl && (
                          <div className="flex justify-between items-center py-0.5">
                            <span className="text-text-muted flex items-center gap-2">
                              <LinkIcon className="w-4 h-4" /> Job Link
                            </span>
                            <a 
                              href={job.jobUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline font-medium flex items-center gap-1"
                            >
                              Open Link <Globe className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Recruiter Details */}
                      {(job.recruiterName || job.recruiterEmail) && (
                        <div className="pt-2 space-y-3">
                          <h5 className="text-xs font-semibold text-text uppercase tracking-wider">Recruiter Details</h5>
                          <div className="p-3 bg-surface-elevated/20 border border-border/80 rounded-xl space-y-2">
                            {job.recruiterName && (
                              <div className="flex items-center gap-2 text-sm">
                                <User className="w-4 h-4 text-primary" />
                                <span className="text-text font-medium">{job.recruiterName}</span>
                              </div>
                            )}
                            {job.recruiterEmail && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="w-4 h-4 text-primary" />
                                <a href={`mailto:${job.recruiterEmail}`} className="text-text hover:text-primary transition-colors hover:underline">
                                  {job.recruiterEmail}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column details */}
                    <div className="space-y-4">
                      {/* Timeline/History */}
                      <h4 className="text-sm font-semibold text-text border-b border-border/60 pb-1.5">Application Timeline</h4>
                      
                      <div className="relative pl-6 space-y-4">
                        <div className="absolute left-2.5 top-1.5 bottom-1.5 w-0.5 bg-border" />
                        
                        {job.history && job.history.length > 0 ? (
                          job.history.map((hist, idx) => {
                            const isLast = idx === job.history.length - 1;
                            return (
                              <div key={idx} className="relative flex flex-col gap-0.5">
                                <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 ${
                                  isLast ? 'bg-primary border-primary scale-125' : 'bg-background border-border'
                                }`} />
                                <span className={`text-sm font-semibold ${isLast ? 'text-text' : 'text-text-muted'}`}>
                                  {hist.status}
                                </span>
                                <span className="text-xs text-text-muted">
                                  {new Date(hist.at).toLocaleDateString(undefined, { 
                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                                  })}
                                </span>
                              </div>
                            );
                          })
                        ) : (
                          <div className="relative flex flex-col gap-0.5">
                            <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 bg-primary border-primary" />
                            <span className="text-sm font-semibold text-text">{job.status}</span>
                            <span className="text-xs text-text-muted">{formatDate(job.appliedDate)}</span>
                          </div>
                        )}
                      </div>

                      <InterviewHistory 
                        job={job} 
                        onUpdate={async (updates) => {
                          try {
                            await updateJob(job._id, updates);
                            toastSuccess("Interview history updated");
                            if (onJobUpdated) {
                              onJobUpdated(updates);
                            }
                          } catch (err) {
                            toastError("Failed to update interview history");
                            throw err;
                          }
                        }} 
                      />

                      {/* Tags */}
                      {job.tags && job.tags.length > 0 && (
                        <div className="pt-2 space-y-2">
                          <h4 className="text-xs font-semibold text-text uppercase tracking-wider flex items-center gap-1.5">
                            <Tag className="w-4 h-4 text-primary" /> Tags
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {job.tags.map((tag, idx) => (
                              <span key={idx} className="text-xs bg-background border border-border px-2 py-0.5 rounded-lg text-text font-medium">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Resume Section */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-text border-b border-border/60 pb-1.5 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" /> Resume Submitted
                    </h4>
                    {job.resumeUrl || job.resumeId ? (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 bg-surface-elevated/20 border border-border/80 rounded-xl gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium text-text truncate max-w-[220px]" title={job.resumeId?.name || job.resumeName || 'Resume'}>
                                {job.resumeId?.name || job.resumeName || 'Resume'}
                              </p>
                              {(!job.resumeId && (job.resumeName || job.resumeUrl)) && (
                                <span className="text-[10px] bg-rose-500/10 text-rose-500 border border-rose-500/20 px-1.5 py-0.5 rounded font-semibold shrink-0">
                                  Deleted Resume
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-text-muted mt-0.5">
                              {job.resumeId?.createdAt 
                                ? `Uploaded ${new Date(job.resumeId.createdAt).toLocaleDateString()}` 
                                : 'Preserved submission record'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => window.open(job.resumeId?.url || job.resumeUrl, '_blank')}
                            className="h-8 text-xs flex items-center gap-1 px-3"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> View
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => {
                              const url = job.resumeId?.url || job.resumeUrl;
                              if (url) {
                                const downloadUrl = url.includes('cloudinary.com') 
                                  ? url.replace('/upload/', '/upload/fl_attachment/') 
                                  : url;
                                window.open(downloadUrl, '_blank');
                              }
                            }}
                            className="h-8 text-xs flex items-center gap-1 px-3"
                          >
                            <Download className="w-3.5 h-3.5" /> Download
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 text-center text-sm text-text-muted bg-background/30 border border-dashed border-border rounded-xl">
                        No resume was associated with this application.
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {job.notes && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-text border-b border-border/60 pb-1.5 flex items-center gap-2">
                        <AlignLeft className="w-4 h-4 text-primary" /> Notes
                      </h4>
                      <div className="bg-background/50 border border-border p-4 rounded-xl text-sm text-text-muted leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto custom-scrollbar">
                        {job.notes}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Footer Buttons */}
                <CardFooter className="border-t border-border bg-surface-elevated/30 p-4 shrink-0 flex justify-between gap-3">
                  <Button 
                    variant="danger" 
                    onClick={handleDelete} 
                    disabled={isDeleting || isUpdating}
                    className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border-rose-500/20 hover:border-transparent py-2 h-9"
                  >
                    <Trash2 className="w-4 h-4" /> 
                    {isDeleting ? 'Deleting...' : 'Delete Application'}
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="secondary" 
                      onClick={() => onEdit?.(job)}
                      disabled={isDeleting || isUpdating}
                      className="flex items-center gap-2 py-2 h-9"
                    >
                      <Edit className="w-4 h-4" /> Edit Details
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={onClose}
                      disabled={isDeleting || isUpdating}
                      className="py-2 h-9"
                    >
                      Close
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
