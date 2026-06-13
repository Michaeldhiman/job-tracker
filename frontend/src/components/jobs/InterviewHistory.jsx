import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';

export default function InterviewHistory({ job, onUpdate }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Optimistic UI state
  const [optimisticInterviews, setOptimisticInterviews] = useState(job.interviews || []);

  useEffect(() => {
    setOptimisticInterviews(job.interviews || []);
  }, [job.interviews]);

  // Form state
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');

  const sortedInterviews = [...optimisticInterviews].sort((a, b) => new Date(a.date) - new Date(b.date));

  const resetForm = () => {
    setTitle('');
    setDate('');
    setNotes('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleAddRound = () => {
    resetForm();
    setIsAdding(true);
  };

  const handleEditRound = (round) => {
    setTitle(round.title);
    setDate(new Date(round.date).toISOString().split('T')[0]);
    setNotes(round.notes || '');
    setEditingId(round._id);
    setIsAdding(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title || !date) return;

    const previousInterviews = [...optimisticInterviews];
    let updatedInterviews = [...optimisticInterviews];

    if (editingId) {
      updatedInterviews = updatedInterviews.map(r => 
        (r._id === editingId || r.tempId === editingId) ? { ...r, title, date, notes } : r
      );
    } else {
      updatedInterviews.push({
        tempId: Math.random().toString(), // temporary ID for optimistic UI
        title,
        date,
        notes
      });
    }

    setOptimisticInterviews(updatedInterviews);
    resetForm();
    
    try {
      // Strip tempId before sending to backend
      const payloadInterviews = updatedInterviews.map(({ tempId, ...rest }) => rest);
      await onUpdate({ interviews: payloadInterviews });
    } catch (err) {
      setOptimisticInterviews(previousInterviews); // Rollback on failure
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this interview round?')) {
      const previousInterviews = [...optimisticInterviews];
      const updatedInterviews = optimisticInterviews.filter(r => r._id !== id && r.tempId !== id);
      setOptimisticInterviews(updatedInterviews);
      
      try {
        const payloadInterviews = updatedInterviews.map(({ tempId, ...rest }) => rest);
        await onUpdate({ interviews: payloadInterviews });
      } catch (err) {
        setOptimisticInterviews(previousInterviews); // Rollback on failure
      }
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (job.status !== 'Interview' && optimisticInterviews.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="flex justify-between items-center border-b border-border/60 pb-2">
        <h4 className="text-sm font-semibold text-text flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Interview History
        </h4>
        {!isAdding && !editingId && (
          <Button variant="ghost" size="sm" onClick={handleAddRound} className="h-8 text-xs px-2">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Round
          </Button>
        )}
      </div>

      <div className="space-y-6 relative">
        {/* Vertical Timeline Line */}
        {sortedInterviews.length > 0 && (
          <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-border/50 rounded-full" />
        )}

        {sortedInterviews.map((round) => (
          <div key={round._id || round.tempId || round.date} className="relative pl-10 group">
            {/* Timeline Dot */}
            <div className="absolute left-1 top-2.5 w-6 h-6 rounded-full border-2 bg-background border-border flex items-center justify-center z-10 group-hover:border-primary/50 transition-colors">
              <div className="w-2 h-2 rounded-full bg-border group-hover:bg-primary/50 transition-colors" />
            </div>

            <div className="bg-surface border border-border p-3 rounded-xl shadow-sm group-hover:shadow-md transition-all">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h5 className="font-semibold text-sm text-text">
                    {round.title}
                  </h5>
                  <p className="text-xs text-text-muted mt-0.5">{formatDate(round.date)}</p>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEditRound(round)}
                    className="p-1.5 rounded-md hover:bg-primary/10 text-text-muted hover:text-primary transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(round._id)}
                    className="p-1.5 rounded-md hover:bg-rose-500/10 text-text-muted hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {round.notes && (
                <div className="mt-3 p-2.5 bg-background rounded-lg border border-border/50 text-sm text-text-muted/90 flex items-start gap-2 whitespace-pre-wrap">
                  <FileText className="w-4 h-4 shrink-0 mt-0.5 opacity-50" />
                  <span>{round.notes}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {sortedInterviews.length === 0 && !isAdding && (
          <div className="text-center py-6 px-4 bg-surface/50 rounded-xl border border-dashed border-border text-sm text-text-muted">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p>No interview rounds recorded yet.</p>
          </div>
        )}
      </div>

      {/* Form Overlay Modal */}
      <AnimatePresence>
        {(isAdding || editingId) && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
              onClick={resetForm}
            />
            <div className="fixed inset-0 flex items-center justify-center p-4 z-[70] pointer-events-none">
              <motion.form
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="w-full max-w-lg bg-surface-elevated border border-border p-6 rounded-2xl shadow-2xl pointer-events-auto"
                onSubmit={handleSave}
              >
                <h5 className="font-bold text-lg text-text mb-4 border-b border-border/60 pb-3">
                  {editingId ? 'Edit Interview Round' : 'Add Interview Round'}
                </h5>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Round Name"
                      placeholder="e.g. Technical Round 1"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                    <div className="flex flex-col gap-1.5 w-full">
                      <label className="text-sm font-semibold text-text">Date</label>
                      <input
                        type="date"
                        className="flex h-11 w-full rounded-xl border border-border hover:border-primary/50 bg-background px-3.5 py-2 text-sm text-text transition-all focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        onClick={(e) => e.target.showPicker && e.target.showPicker()}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-text mb-1.5">Notes (Optional)</label>
                    <textarea
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-3 text-sm text-text placeholder-text-muted/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all custom-scrollbar resize-y min-h-[100px]"
                      placeholder="What was discussed? Any feedback?"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border/60 mt-2">
                  <Button variant="ghost" type="button" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit">
                    {editingId ? 'Save Changes' : 'Add Round'}
                  </Button>
                </div>
              </div>
            </motion.form>
          </div>
        </>
        )}
      </AnimatePresence>
    </div>
  );
}
