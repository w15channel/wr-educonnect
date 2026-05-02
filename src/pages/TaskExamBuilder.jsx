import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ExamBuilder from '@/components/tasks/ExamBuilder';

export default function TaskExamBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();

  // id === 'new' means creating a new exam
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 100),
    enabled: id !== 'new',
  });

  const editingExam = id === 'new' ? null : tasks.find(t => t.id === id);

  const handleBack = () => navigate('/tasks');

  if (id !== 'new' && isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return <ExamBuilder editingExam={editingExam || null} onBack={handleBack} />;
}