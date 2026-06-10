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

  const columnsWithJobs = COLUMNS.map(col => ({
    ...col,
    jobs: jobs.filter(j => j.status === col.id)
  }));

  return (
    <div className="flex h-[calc(100vh-12rem)] w-full overflow-x-auto overflow-y-hidden gap-4 pb-4 px-1">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 h-full">
          {columnsWithJobs.map(column => (
            <KanbanColumn 
              key={column.id} 
              column={column} 
              jobs={column.jobs} 
              onJobClick={onJobClick}
            />
          ))}
        </div>
        
        <DragOverlay>
          {activeJob ? <KanbanCard job={activeJob} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
