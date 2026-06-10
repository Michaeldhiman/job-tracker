import React, { useMemo } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import KanbanCard from './KanbanCard.jsx';

export default function KanbanColumn({ column, jobs, onJobClick }) {
  const jobsIds = useMemo(() => jobs.map((j) => j._id), [jobs]);

  const { setNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  return (
    <div className="flex flex-col bg-surface-elevated/50 border border-border w-80 rounded-xl flex-shrink-0 h-full overflow-hidden">
      <div className="p-3 border-b border-border flex items-center justify-between bg-surface-elevated sticky top-0 z-10">
        <h3 className="font-semibold text-text text-sm tracking-wide">{column.title}</h3>
        <span className="bg-background px-2 py-0.5 rounded-full text-xs font-medium text-text-muted border border-border">
          {jobs.length}
        </span>
      </div>
      <div 
        ref={setNodeRef}
        className="flex-1 overflow-y-auto p-2 flex flex-col gap-2"
      >
        <SortableContext items={jobsIds} strategy={verticalListSortingStrategy}>
          {jobs.map(job => (
            <KanbanCard key={job._id} job={job} onClick={() => onJobClick(job)} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
