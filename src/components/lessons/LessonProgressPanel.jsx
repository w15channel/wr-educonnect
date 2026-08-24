import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, BookOpen, MessageSquare, CheckCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function LessonProgressPanel({ lesson, onBack }) {
  const [search, setSearch] = useState('');

  const { data: progresses = [], isLoading } = useQuery({
    queryKey: ['lesson-progress-panel', lesson.id],
    queryFn: () => base44.entities.LessonProgress.filter({ lesson_id: lesson.id }, '-created_date', 500),
  });

  const entries = progresses.filter(p => p.comment || p.summary || p.watched);
  const filtered = search.trim()
    ? entries.filter(p =>
        (p.student_email || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.comment || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.summary || '').toLowerCase().includes(search.toLowerCase())
      )
    : entries;

  const watchedCount = entries.filter(p => p.watched).length;

  return (
    <div className="app-page max-w-4xl mx-auto animate-fade-in-up">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft size={15} /> Voltar para Aulas
      </button>

      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
          <BookOpen size={18} className="text-purple-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-foreground truncate">{lesson.title}</h2>
          <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
            <span><strong className="text-foreground">{watchedCount}</strong> presença(s) confirmada(s)</span>
            <span><strong className="text-foreground">{entries.length}</strong> interação(ões)</span>
          </div>
        </div>
      </div>

      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-8 h-9 text-sm"
          placeholder="Buscar por aluno ou conteúdo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare size={40} className="mx-auto mb-3 opacity-20" />
          <p className="font-semibold">Nenhum comentário ou resumo encontrado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <div key={p.id} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-black text-primary shrink-0">
                  {(p.student_email || '?').charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-foreground truncate flex-1">{p.student_email}</span>
                {p.watched && (
                  <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 border border-green-200 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                    <CheckCircle size={9} /> Presente
                  </span>
                )}
              </div>

              {p.summary && (
                <div className="mb-3">
                  <p className="text-[10px] font-bold text-muted-foreground mb-1 flex items-center gap-1">
                    <BookOpen size={9} /> RESUMO DO ALUNO
                  </p>
                  <p className="text-sm text-foreground/80 bg-secondary/40 rounded-xl px-3 py-2 leading-relaxed whitespace-pre-wrap">{p.summary}</p>
                </div>
              )}

              {p.comment && (
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground mb-1 flex items-center gap-1">
                    <MessageSquare size={9} /> COMENTÁRIO DO ALUNO
                  </p>
                  <p className="text-sm text-foreground/80 bg-secondary/40 rounded-xl px-3 py-2 leading-relaxed whitespace-pre-wrap">{p.comment}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}