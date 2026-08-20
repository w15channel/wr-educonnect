import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MessageSquare } from 'lucide-react';

export default function LessonCommentsPanel() {
  const [expandedLesson, setExpandedLesson] = useState(null);

  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons'],
    queryFn: () => base44.entities.RecordedLesson.list('order', 100)
  });

  const { data: allProgress = [] } = useQuery({
    queryKey: ['all-lesson-progress'],
    queryFn: () => base44.entities.LessonProgress.list('-created_date', 2000)
  });

  const { data: accessCodes = [] } = useQuery({
    queryKey: ['access-codes'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 200)
  });

  // Agrupa progresses por lesson_id, filtrando apenas os que têm comentário ou resumo
  const progressByLesson = {};
  allProgress.forEach((p) => {
    if (!p.comment && !p.summary) return;
    if (!progressByLesson[p.lesson_id]) progressByLesson[p.lesson_id] = [];
    progressByLesson[p.lesson_id].push(p);
  });

  const lessonsWithActivity = lessons.filter((l) => progressByLesson[l.id]?.length > 0);

  if (lessonsWithActivity.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center">
            <MessageSquare size={16} className="text-primary" />
          </div>
          <h3 className="font-bold text-sm text-foreground">Resumos e Comentários das Aulas</h3>
        </div>
        <p className="text-sm text-muted-foreground text-center py-4">Nenhum comentário ou resumo enviado pelos alunos ainda.</p>
      </div>);

  }

  return null;

























































































}