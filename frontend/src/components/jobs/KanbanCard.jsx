import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreHorizontal, Calendar, Building2 } from 'lucide-react';
import clsx from 'clsx';

export default function KanbanCard({ job, onClick }) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: job._id,
    data: {
      type: 'Task',
      job,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={clsx(
        "bg-surface border border-border p-3 rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors group relative",
        isDragging && "opacity-50 border-primary"
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2 max-w-[80%]">
          <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-primary">{job.company.charAt(0)}</span>
          </div>
          <span className="font-semibold text-text text-sm truncate">{job.company}</span>
        </div>
        <button className="text-text-muted hover:text-text opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
      
      <p className="text-text text-sm mb-3 font-medium line-clamp-2 leading-tight">
        {job.role}
      </p>

      <div className="flex items-center justify-between text-xs text-text-muted mt-auto pt-2 border-t border-border/50">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3 h-3" />
          <span>{new Date(job.appliedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
        </div>
        {job.priority === 'High' && (
          <span className="flex items-center gap-1 text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded text-[10px] font-medium">
            High
          </span>
        )}
      </div>
    </div>
  );
}
