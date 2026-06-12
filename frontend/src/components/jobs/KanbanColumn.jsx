import React, { useMemo, memo } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import KanbanCard from './KanbanCard.jsx';
import clsx from 'clsx';

const KanbanColumn = memo(({ column, jobs, onJobClick, onStatusChange }) => {
  const jobsIds = useMemo(() => jobs.map((j) => j._id), [jobs]);

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  return (
    <div 
      className={clsx(
        "flex flex-col border w-[calc(100vw-1.5rem)] lg:w-80 rounded-xl flex-shrink-0 h-full overflow-hidden transition-colors duration-200",
        isOver ? "bg-primary/5 border-primary/50 border-dashed" : "bg-surface-elevated/50 border-border"
      )}
    >
      <div className="p-3 border-b border-border flex items-center justify-between bg-surface-elevated sticky top-0 z-10">
        <h3 className="font-semibold text-text text-sm tracking-wide">{column.title}</h3>
        <span className="bg-background px-2 py-0.5 rounded-full text-xs font-medium text-text-muted border border-border">
          {jobs.length}
        </span>
      </div>
      <div 
        ref={setNodeRef}
        className="flex-1 overflow-y-auto p-2 flex flex-col gap-2 min-h-[150px]"
      >
        <SortableContext items={jobsIds} strategy={verticalListSortingStrategy}>
          {jobs.map(job => (
            <KanbanCard key={job._id} job={job} onJobClick={onJobClick} onStatusChange={onStatusChange} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
});

const areEqual = (prevProps, nextProps) => {
  if (prevProps.column.id !== nextProps.column.id) return false;
  if (prevProps.onJobClick !== nextProps.onJobClick) return false;
  if (prevProps.onStatusChange !== nextProps.onStatusChange) return false;
  
  const prevJobs = prevProps.jobs;
  const nextJobs = nextProps.jobs;
  if (prevJobs.length !== nextJobs.length) return false;
  
  for (let i = 0; i < prevJobs.length; i++) {
    if (prevJobs[i]._id !== nextJobs[i]._id) return false;
    if (prevJobs[i].status !== nextJobs[i].status) return false;
  }
  
  return true;
};

const MemoizedKanbanColumn = memo(KanbanColumn, areEqual);

KanbanColumn.displayName = 'KanbanColumn';

export default MemoizedKanbanColumn;
