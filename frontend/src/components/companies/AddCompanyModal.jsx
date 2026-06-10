import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, MapPin, Link as LinkIcon, Briefcase, AlignLeft, AlertCircle } from 'lucide-react';
import axiosClient from '../../api/axiosClient.js';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card.jsx';

const companySchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  industry: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  location: z.string().optional(),
  careerPage: z.string().url("Invalid URL").optional().or(z.literal("")),
  notes: z.string().optional()
});

export default function AddCompanyModal({ isOpen, onClose, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(companySchema)
  });

  const handleClose = () => {
    reset();
    setError(null);
    onClose();
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = { ...data };
      if (!payload.website) delete payload.website;
      if (!payload.careerPage) delete payload.careerPage;

      await axiosClient.post('/api/companies', payload);
      reset();
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to add company");
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
            onClick={handleClose}
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
                  <CardTitle className="text-xl">Add New Company</CardTitle>
                  <button onClick={handleClose} className="p-1.5 rounded-md hover:bg-white/10 text-text-muted hover:text-text transition-colors">
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

                  <form id="add-company-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text">Company Name <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input 
                          {...register("name")}
                          placeholder="e.g. Acme Corp"
                          className={`w-full bg-background border ${errors.name ? 'border-rose-500' : 'border-border'} rounded-lg pl-9 pr-4 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all`}
                        />
                      </div>
                      {errors.name && <p className="text-xs text-rose-500">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text">Industry</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input 
                          {...register("industry")}
                          placeholder="e.g. Software, Finance"
                          className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text">Location (HQ)</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input 
                          {...register("location")}
                          placeholder="e.g. San Francisco, CA"
                          className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text">Website</label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input 
                          {...register("website")}
                          placeholder="https://"
                          className={`w-full bg-background border ${errors.website ? 'border-rose-500' : 'border-border'} rounded-lg pl-9 pr-4 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all`}
                        />
                      </div>
                      {errors.website && <p className="text-xs text-rose-500">{errors.website.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text">Career Page</label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input 
                          {...register("careerPage")}
                          placeholder="https://"
                          className={`w-full bg-background border ${errors.careerPage ? 'border-rose-500' : 'border-border'} rounded-lg pl-9 pr-4 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all`}
                        />
                      </div>
                      {errors.careerPage && <p className="text-xs text-rose-500">{errors.careerPage.message}</p>}
                    </div>

                    <div className="space-y-2">
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
                  </form>
                </div>
                
                <CardFooter className="border-t border-border bg-surface-elevated/30 p-4 shrink-0 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={handleClose}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-text hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    form="add-company-form"
                    disabled={isSubmitting}
                    className="px-6 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-hover focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Add Company'
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
