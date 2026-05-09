import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BookOpen, MessageSquare, ChevronDown, ChevronUp, User } from 'lucide-react';

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
          <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
            <MessageSquare size={16} className="text-blue-600" />
          </div>
          <h3 className="font-bold text-sm text-foreground">Resumos e Comentários das Aulas</h3>
        </div>
        <p className="text-sm text-muted-foreground text-center py-4">Nenhum comentário ou resumo enviado pelos alunos ainda.</p>
      </div>);

  }

  return (
    <div className="bg-card rounded-2xl border border-border p-5 hidden">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
          <MessageSquare size={16} className="text-blue-600" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-foreground">Resumos e Comentários das Aulas</h3>
          <p className="text-xs text-muted-foreground">{lessonsWithActivity.length} {lessonsWithActivity.length === 1 ? 'aula com atividade' : 'aulas com atividade'}</p>
        </div>
      </div>

      <div className="space-y-2">
        {lessonsWithActivity.map((lesson) => {
          const entries = progressByLesson[lesson.id] || [];
          const isOpen = expandedLesson === lesson.id;

          return (
            <div key={lesson.id} className="border border-border rounded-xl overflow-hidden">
              {/* Lesson header */}
              <button
                className="w-full flex items-center gap-3 p-3 hover:bg-secondary/30 transition-colors text-left"
                onClick={() => setExpandedLesson(isOpen ? null : lesson.id)}>
                
                <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                  <BookOpen size={13} className="text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{lesson.title}</p>
                  <p className="text-[10px] text-muted-foreground">{entries.length} {entries.length === 1 ? 'aluno' : 'alunos'}</p>
                </div>
                {isOpen ? <ChevronUp size={14} className="text-muted-foreground shrink-0" /> : <ChevronDown size={14} className="text-muted-foreground shrink-0" />}
              </button>

              {/* Entries */}
              {isOpen &&
              <div className="border-t border-border divide-y divide-border bg-secondary/10">
                  {entries.map((p) => {
                  const code = accessCodes.find((c) => c.student_email === p.student_email);
                  const name = code?.profile_name || code?.student_name || p.student_email;
                  const avatarColor = code?.profile_avatar_color || '#5b5ef4';
                  const photoUrl = code?.profile_photo_url || '';

                  return (
                    <div key={p.id} className="p-3 space-y-2">
                        {/* Student identity */}
                        <div className="flex items-center gap-2">
                          {photoUrl ?
                        <img src={photoUrl} alt={name} className="w-6 h-6 rounded-full object-cover shrink-0" /> :

                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ backgroundColor: avatarColor }}>
                              {name?.charAt(0)?.toUpperCase()}
                            </div>
                        }
                          <span className="text-xs font-semibold text-foreground">{name}</span>
                          <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-bold ${p.watched ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {p.watched ? '✓ Presença confirmada' : 'Pendente'}
                          </span>
                        </div>

                        {/* Summary */}
                        {p.summary &&
                      <div className="bg-white rounded-lg p-2.5 border border-border">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                              <BookOpen size={9} /> Resumo
                            </p>
                            <p className="text-xs text-foreground/80 whitespace-pre-wrap">{p.summary}</p>
                          </div>
                      }

                        {/* Comment */}
                        {p.comment &&
                      <div className="bg-white rounded-lg p-2.5 border border-border">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                              <MessageSquare size={9} /> Comentário
                            </p>
                            <p className="text-xs text-foreground/80 whitespace-pre-wrap">{p.comment}</p>
                          </div>
                      }
                      </div>);

                })}
                </div>
              }
            </div>);

        })}
      </div>
    </div>);

}