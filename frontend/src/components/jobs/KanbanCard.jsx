import React, { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreHorizontal, Calendar, Building2 } from 'lucide-react';
import clsx from 'clsx';

import { PIPELINE_STATUSES } from '../../utils/constants.js';

const STATUSES = PIPELINE_STATUSES;

const KanbanCardContent = memo(({ job, isDragging, isOverlay, onJobClick, onStatusChange, listeners, attributes, setNodeRef, style }) => {
  const handleStatusSelect = (e) => {
    e.stopPropagation();
    if (onStatusChange) {
      onStatusChange(job._id, e.target.value);
    }
  };

  const handleClick = () => {
    if (onJobClick) onJobClick(job);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={clsx(
        "bg-surface border border-border p-3 rounded-lg shadow-sm cursor-grab active:cursor-grabbing transition-all duration-250 ease-out group relative",
        !isDragging && !isOverlay && "hover:-translate-y-0.5 hover:shadow-md hover:border-primary/50",
        isDragging && "opacity-30 border-primary",
        isOverlay && "scale-105 rotate-2 shadow-2xl border-primary bg-surface cursor-grabbing z-50"
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2 max-w-[80%]">
          <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-primary">{job.company.charAt(0)}</span>
          </div>
          <span className="font-semibold text-text text-sm truncate">{job.company}</span>
        </div>
        <div className="relative">
          <button className="text-text-muted hover:text-text opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
            <MoreHorizontal className="w-4 h-4" />
          </button>
          <select 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            value={job.status}
            onChange={handleStatusSelect}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <option disabled value="">Change Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
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
});

KanbanCardContent.displayName = 'KanbanCardContent';

const KanbanCard = memo(({ job, onJobClick, onStatusChange, isOverlay }) => {
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
    transition: transition || 'transform 250ms ease',
    transform: CSS.Transform.toString(transform),
  };

  if (isOverlay) {
    return (
      <KanbanCardContent 
        job={job} 
        isOverlay={true} 
      />
    );
  }

  return (
    <KanbanCardContent
      job={job}
      onJobClick={onJobClick}
      onStatusChange={onStatusChange}
      isDragging={isDragging}
      listeners={listeners}
      attributes={attributes}
      setNodeRef={setNodeRef}
      style={style}
    />
  );
});

KanbanCard.displayName = 'KanbanCard';

export default KanbanCard;
