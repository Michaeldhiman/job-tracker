import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { 
  SortableContext, 
  arrayMove, 
  sortableKeyboardCoordinates 
} from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn.jsx';
import KanbanCard, { KanbanCardContent } from './KanbanCard.jsx';
import { updateJob } from '../../api/jobsApi.js';

import { PIPELINE_STATUSES } from '../../utils/constants.js';

const COLUMNS = PIPELINE_STATUSES.map(status => ({ id: status, title: status }));

export default function KanbanBoard({ initialJobs, onJobClick }) {
  const [jobs, setJobs] = useState(initialJobs || []);
  const [activeJob, setActiveJob] = useState(null);

  useEffect(() => {
    setJobs(initialJobs);
  }, [initialJobs]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
    const { active } = event;
    const job = jobs.find(j => j._id === active.id);
    setActiveJob(job);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === 'Task';
    const isOverTask = over.data.current?.type === 'Task';
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveTask) return;

    if (isActiveTask && isOverTask) {
      setJobs(jobs => {
        const activeIndex = jobs.findIndex(t => t._id === activeId);
        const overIndex = jobs.findIndex(t => t._id === overId);

        if (jobs[activeIndex].status !== jobs[overIndex].status) {
          const newJobs = jobs.map((j, idx) => 
            idx === activeIndex ? { ...j, status: jobs[overIndex].status } : j
          );
          return arrayMove(newJobs, activeIndex, overIndex);
        }

        return arrayMove(jobs, activeIndex, overIndex);
      });
    }

    if (isActiveTask && isOverColumn) {
      setJobs(jobs => {
        const activeIndex = jobs.findIndex(t => t._id === activeId);
        const newJobs = jobs.map((j, idx) => 
          idx === activeIndex ? { ...j, status: overId } : j
        );
        return arrayMove(newJobs, activeIndex, activeIndex);
      });
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    const activeId = active.id;
    const isActiveTask = active?.data?.current?.type === 'Task';
    
    // Clear overlay state immediately for snappy UI
    setActiveJob(null);

    if (!over || !isActiveTask) {
      return;
    }

    const originalStatus = activeJob?.status;
    const newStatus = jobs.find(j => j._id === activeId)?.status;

    if (newStatus && originalStatus && originalStatus !== newStatus) {
      try {
        await updateJob(activeId, { status: newStatus });
      } catch (error) {
        console.error('Failed to update job status', error);
        // Revert status in local state on error
        setJobs(prevJobs => prevJobs.map(j => j._id === activeId ? { ...j, status: originalStatus } : j));
      }
    }
  };

  const handleDragCancel = () => {
    setActiveJob(null);
  };

  const [activeTab, setActiveTab] = useState(COLUMNS[0].id);

  const columnsWithJobs = useMemo(() => {
    return COLUMNS.map(col => ({
      ...col,
      jobs: jobs.filter(j => j.status === col.id)
    }));
  }, [jobs]);

  const handleStatusChange = useCallback(async (jobId, newStatus) => {
    try {
      await updateJob(jobId, { status: newStatus });
      setJobs(prev => prev.map(j => j._id === jobId ? { ...j, status: newStatus } : j));
    } catch (error) {
      console.error('Failed to update job status', error);
    }
  }, []);

  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.matchMedia('(min-width: 1024px)').matches);
    };
    
    // Initial check
    checkIsDesktop();

    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    mediaQuery.addEventListener('change', checkIsDesktop);
    
    return () => mediaQuery.removeEventListener('change', checkIsDesktop);
  }, []);

  return (
    <div className="h-full flex flex-col pt-4 overflow-hidden">
      {/* Status Tabs for Mobile */}
      <div className="lg:hidden flex overflow-x-auto gap-2 pb-3 mb-2 px-1 snap-x">
        {columnsWithJobs.map(col => {
          const count = col.jobs.length;
          return (
            <button
              key={col.id}
              onClick={() => setActiveTab(col.id)}
              className={`shrink-0 snap-center px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === col.id ? 'bg-primary text-white shadow-md' : 'bg-surface border border-border text-text-muted hover:bg-surface-elevated'}`}
            >
              {col.title} <span className="ml-1 opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 px-1">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          {isDesktop ? (
            <div className="flex gap-4 h-full">
              {columnsWithJobs.map(column => (
                <KanbanColumn 
                  key={column.id} 
                  column={column} 
                  jobs={column.jobs} 
                  onJobClick={onJobClick}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          ) : (
            <div className="flex h-full w-full">
              {columnsWithJobs.filter(c => c.id === activeTab).map(column => (
                <KanbanColumn 
                  key={column.id} 
                  column={column} 
                  jobs={column.jobs} 
                  onJobClick={onJobClick}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
          
          <DragOverlay dropAnimation={null}>
            {activeJob ? <KanbanCardContent job={activeJob} isOverlay={true} /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
