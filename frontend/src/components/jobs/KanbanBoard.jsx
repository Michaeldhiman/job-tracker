import React, { useState, useEffect } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { 
  SortableContext, 
  arrayMove, 
  sortableKeyboardCoordinates 
} from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn.jsx';
import KanbanCard from './KanbanCard.jsx';
import { updateJob } from '../../api/jobsApi.js';

const COLUMNS = [
  { id: 'Wishlist', title: 'Wishlist' },
  { id: 'Applied', title: 'Applied' },
  { id: 'OA', title: 'OA / Test' },
  { id: 'Screening', title: 'Screening' },
  { id: 'Technical', title: 'Technical' },
  { id: 'HR', title: 'HR' },
  { id: 'Offer', title: 'Offer' },
  { id: 'Rejected', title: 'Rejected' },
];

export default function KanbanBoard({ initialJobs, onJobClick }) {
  const [jobs, setJobs] = useState(initialJobs || []);
  const [activeJob, setActiveJob] = useState(null);

  useEffect(() => {
    setJobs(initialJobs);
  }, [initialJobs]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
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
    if (!over) {
      setActiveJob(null);
      return;
    }

    const activeId = active.id;
    const isActiveTask = active.data.current?.type === 'Task';
    if (!isActiveTask) {
      setActiveJob(null);
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
    
    setActiveJob(null);
  };

  const [activeTab, setActiveTab] = useState(COLUMNS[0].id);

  const columnsWithJobs = COLUMNS.map(col => ({
    ...col,
    jobs: jobs.filter(j => j.status === col.id)
  }));

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      await updateJob(jobId, { status: newStatus });
      setJobs(prev => prev.map(j => j._id === jobId ? { ...j, status: newStatus } : j));
    } catch (error) {
      console.error('Failed to update job status', error);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] w-full gap-4">
      {/* Mobile Tab Bar */}
      <div className="lg:hidden flex overflow-x-auto custom-scrollbar pb-2 gap-2 snap-x px-1">
        {COLUMNS.map(col => {
          const count = columnsWithJobs.find(c => c.id === col.id)?.jobs.length || 0;
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
        >
          {/* Desktop View: All Columns */}
          <div className="hidden lg:flex gap-4 h-full">
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

          {/* Mobile View: Single Column */}
          <div className="flex lg:hidden h-full w-full">
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
          
          <DragOverlay>
            {activeJob ? <KanbanCard job={activeJob} /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
