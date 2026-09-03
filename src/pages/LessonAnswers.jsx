import React, { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, MessageSquare, Search, Shuffle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { adminApi } from '@/lib/adminApi';
import { LESSON_FEEDBACK_OPTIONS, randomLessonFeedback } from '@/lib/lessonFeedback';
import { formatScore, roundScore, SCORE_RULES } from '@/lib/scoreUtils';
import { sortBySequence } from '@/lib/sequenceUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

function AnswerCard({ progress, lesson, scoreItem, reviewerEmail }) {
  const queryClient = useQueryClient();
  const [grade, setGrade] = useState(scoreItem?.score == null ? formatScore(SCORE_RULES.lesson) : formatScore(scoreItem.score));
  const [feedback, setFeedback] = useState(scoreItem?.notes || randomLessonFeedback());

  const saveMutation = useMutation({
    mutationFn: async () => {
      const numericGrade = roundScore(String(grade).replace(',', '.'));
      if (!Number.isFinite(Number(String(grade).replace(',', '.'))) || numericGrade < 0 || numericGrade > SCORE_RULES.lesson) {
        throw new Error(`Informe uma nota entre 0 e ${formatScore(SCORE_RULES.lesson)}.`);
      }
      if (!feedback.trim()) throw new Error('Escreva uma devolutiva para publicar.');

      const payload = {
        student_email: progress.student_email,
        category: 'lesson',
        ref_id: lesson.id,
        ref_title: lesson.title,
        score: numericGrade,
        max_score: SCORE_RULES.lesson,
        verified: true,
        notes: feedback.trim(),
        reviewed_by: reviewerEmail || '',
        ...(lesson.module_number ? { module_number: lesson.module_number } : {}),
      };
      return scoreItem?.id
        ? adminApi.update('ScoreItem', scoreItem.id, payload)
        : adminApi.create('ScoreItem', payload);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['lesson-answer-scores'] }),
        queryClient.invalidateQueries({ queryKey: ['lesson-score-feedback'] }),
        queryClient.invalidateQueries({ queryKey: ['score-items'] }),
      ]);
      toast.success('Nota e feedback publicados para o aluno.');
    },
    onError: (error) => toast.error(error.message || 'Não foi possível publicar a avaliação.'),
  });

  return (
    <article className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-foreground truncate">{progress.student_email || 'Aluno sem identificação'}</p>
          <p className="text-xs text-muted-foreground mt-1">{lesson.title}</p>
        </div>
        {scoreItem?.verified && (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
            <CheckCircle size={11} /> Avaliação publicada
          </span>
        )}
      </div>

      <div className="grid gap-3 mt-4">
        {progress.summary && (
          <div className="rounded-xl bg-purple-500/5 border border-purple-500/15 p-3">
            <p className="text-[10px] font-black tracking-wide text-purple-600 mb-1">RESUMO DO ALUNO</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/80">{progress.summary}</p>
          </div>
        )}
        {progress.comment && (
          <div className="rounded-xl bg-blue-500/5 border border-blue-500/15 p-3">
            <p className="text-[10px] font-black tracking-wide text-blue-600 mb-1">COMENTÁRIO DO ALUNO</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/80">{progress.comment}</p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-border grid sm:grid-cols-[120px_1fr] gap-3 items-start">
        <div>
          <label className="text-xs font-semibold text-muted-foreground" htmlFor={`grade-${progress.id}`}>Nota (máx. {formatScore(SCORE_RULES.lesson)})</label>
          <Input id={`grade-${progress.id}`} inputMode="decimal" value={grade} onChange={(event) => setGrade(event.target.value)} className="mt-1" />
        </div>
        <div>
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-semibold text-muted-foreground" htmlFor={`feedback-${progress.id}`}>Feedback ao aluno</label>
            <button type="button" onClick={() => setFeedback(randomLessonFeedback())} className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline">
              <Shuffle size={11} /> Sortear outra resposta
            </button>
          </div>
          <Textarea id={`feedback-${progress.id}`} value={feedback} onChange={(event) => setFeedback(event.target.value)} rows={3} className="mt-1 text-sm" />
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} size="sm" className="w-full mt-2">
            {saveMutation.isPending ? 'Publicando...' : scoreItem?.verified ? 'Atualizar avaliação' : 'Publicar nota e feedback'}
          </Button>
        </div>
      </div>
    </article>
  );
}

export default function LessonAnswers() {
  const { user: session } = useOutletContext();
  const [search, setSearch] = useState('');
  const [lessonFilter, setLessonFilter] = useState(() => new URLSearchParams(window.location.search).get('lesson') || 'all');
  const course = session?.course || 'tcc';

  const { data: lessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ['lesson-answers-lessons', course],
    queryFn: () => base44.entities.RecordedLesson.filter({ course }, 'order', 200),
  });
  const { data: progresses = [], isLoading: progressLoading } = useQuery({
    queryKey: ['lesson-answers-progress'],
    queryFn: () => base44.entities.LessonProgress.list('-created_date', 5000),
  });
  const { data: scores = [], isLoading: scoresLoading } = useQuery({
    queryKey: ['lesson-answer-scores'],
    queryFn: () => base44.entities.ScoreItem.list('-updated_date', 10000),
  });

  const orderedLessons = useMemo(() => sortBySequence(lessons), [lessons]);
  const lessonById = useMemo(() => new Map(orderedLessons.map((lesson) => [lesson.id, lesson])), [orderedLessons]);
  const scoreByAnswer = useMemo(() => new Map(scores
    .filter((score) => score.category === 'lesson')
    .map((score) => [`${score.student_email}::${score.ref_id}`, score])), [scores]);
  const answers = progresses.filter((progress) => {
    if (!lessonById.has(progress.lesson_id) || (!progress.summary && !progress.comment)) return false;
    if (lessonFilter !== 'all' && progress.lesson_id !== lessonFilter) return false;
    const haystack = `${progress.student_email || ''} ${progress.summary || ''} ${progress.comment || ''} ${lessonById.get(progress.lesson_id)?.title || ''}`.toLowerCase();
    return haystack.includes(search.trim().toLowerCase());
  });
  const pendingCount = answers.filter((answer) => !scoreByAnswer.get(`${answer.student_email}::${answer.lesson_id}`)?.verified).length;
  const isLoading = lessonsLoading || progressLoading || scoresLoading;

  return (
    <main className="app-page max-w-5xl mx-auto animate-fade-in-up">
      <button type="button" onClick={() => window.history.back()} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft size={15} /> Voltar para aulas
      </button>
      <section className="rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-card to-primary/5 p-5 sm:p-7 mb-5">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/20"><Sparkles size={20} /></div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] font-black text-purple-600">Central de devolutivas</p>
            <h1 className="text-2xl font-black text-foreground mt-1">Notas e feedback das aulas</h1>
            <p className="text-sm text-muted-foreground mt-1">Avalie as opiniões e os resumos dos alunos em um espaço exclusivo.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-5 text-xs font-bold">
          <span className="rounded-full bg-card border border-border px-3 py-1.5">{answers.length} resposta(s)</span>
          <span className="rounded-full bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5">{pendingCount} aguardando avaliação</span>
          <span className="rounded-full bg-purple-50 border border-purple-200 text-purple-700 px-3 py-1.5">{LESSON_FEEDBACK_OPTIONS.length} feedbacks sugeridos</span>
        </div>
      </section>

      <div className="grid sm:grid-cols-[1fr_260px] gap-3 mb-5">
        <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar aluno, aula ou conteúdo..." className="pl-9" /></div>
        <select aria-label="Filtrar por aula" value={lessonFilter} onChange={(event) => setLessonFilter(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground">
          <option value="all">Todas as aulas</option>
          {orderedLessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-56 rounded-2xl bg-muted animate-pulse" />)}</div>
      ) : answers.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-border text-muted-foreground"><MessageSquare size={40} className="mx-auto mb-3 opacity-25" /><p className="font-bold">Nenhuma resposta encontrada.</p><p className="text-sm mt-1">Novos resumos e comentários aparecerão aqui.</p></div>
      ) : (
        <div className="space-y-4">{answers.map((progress) => <AnswerCard key={progress.id} progress={progress} lesson={lessonById.get(progress.lesson_id)} scoreItem={scoreByAnswer.get(`${progress.student_email}::${progress.lesson_id}`)} reviewerEmail={session?.email} />)}</div>
      )}
    </main>
  );
}
