import React, { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, ChevronDown, ClipboardCheck, ExternalLink, MessageSquare, Search, Shuffle, Sparkles, WandSparkles } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { adminApi } from '@/lib/adminApi';
import { LESSON_FEEDBACK_OPTIONS, randomLessonFeedback } from '@/lib/lessonFeedback';
import { formatScore, SCORE_RULES } from '@/lib/scoreUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

function feedbackFor(index) {
  return LESSON_FEEDBACK_OPTIONS[index % LESSON_FEEDBACK_OPTIONS.length];
}

async function publishReview({ submission, task, feedback, reviewerEmail, scoreItem }) {
  const points = task.type === 'quiz' ? SCORE_RULES.quiz : SCORE_RULES.task;
  const category = task.type === 'quiz' ? 'quiz' : 'task';
  const notes = feedback.trim();
  const scorePayload = {
    student_email: submission.student_email,
    category,
    ref_id: task.id,
    ref_title: task.title,
    score: points,
    max_score: points,
    verified: true,
    notes,
    reviewed_by: reviewerEmail || '',
    ...(Number(task.module_number) ? { module_number: Number(task.module_number) } : {}),
  };

  await adminApi.update('TaskSubmission', submission.id, { grade: points, feedback: notes, status: 'graded' });
  if (scoreItem?.id) await adminApi.update('ScoreItem', scoreItem.id, scorePayload);
  else await adminApi.create('ScoreItem', scorePayload);
}

function SubmissionCard({ submission, task, scoreItem, reviewerEmail }) {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState(submission.feedback || scoreItem?.notes || randomLessonFeedback());
  const mutation = useMutation({
    mutationFn: () => publishReview({ submission, task, feedback, reviewerEmail, scoreItem }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['task-answer-data'] });
      toast.success('Pontuação e resposta publicadas.');
    },
    onError: (error) => toast.error(error?.message || 'Não foi possível avaliar a entrega.'),
  });
  const graded = submission.status === 'graded';

  return (
    <article className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <details className="group">
        <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-3 p-4 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset sm:p-5 [&::-webkit-details-marker]:hidden">
          <div className="min-w-0">
            <p className="font-bold text-foreground truncate">{submission.student_name || submission.student_email || 'Aluno sem identificação'}</p>
            <p className="text-xs text-muted-foreground mt-1">{task.title} · {submission.student_email}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${graded ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
              {graded ? <><CheckCircle2 size={11} /> Corrigido · {formatScore(submission.grade ?? SCORE_RULES.task)} pts</> : 'Aguardando correção'}
            </span>
            <ChevronDown size={18} aria-hidden="true" className="text-muted-foreground transition-transform group-open:rotate-180" />
            <span className="sr-only">Expandir resposta do aluno</span>
          </div>
        </summary>

        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
          <div className="mt-4 rounded-xl bg-blue-500/5 border border-blue-500/15 p-3">
            <p className="text-[10px] font-black tracking-wide text-blue-600 mb-1 flex items-center gap-1"><MessageSquare size={11} /> RESPOSTA DO ALUNO</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/80">{submission.comment && !/^Aluno:/.test(submission.comment) ? submission.comment : 'Entrega enviada por arquivo.'}</p>
            {submission.file_url && <a href={submission.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-primary hover:underline"><ExternalLink size={12} /> Abrir arquivo entregue</a>}
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <label className="text-xs font-semibold text-muted-foreground" htmlFor={`feedback-${submission.id}`}>Resposta de parabenização · {formatScore(task.type === 'quiz' ? SCORE_RULES.quiz : SCORE_RULES.task)} pontos</label>
              <button type="button" onClick={() => setFeedback(randomLessonFeedback())} className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"><Shuffle size={11} /> Sortear outra resposta</button>
            </div>
            <Textarea id={`feedback-${submission.id}`} value={feedback} onChange={(event) => setFeedback(event.target.value)} rows={3} className="text-sm" />
            <Button onClick={() => mutation.mutate()} disabled={!feedback.trim() || mutation.isPending} size="sm" className="w-full mt-2 gap-1.5">
              <Sparkles size={13} /> {mutation.isPending ? 'Publicando...' : graded ? 'Atualizar resposta e pontuação' : 'Responder e pontuar'}
            </Button>
          </div>
        </div>
      </details>
    </article>
  );
}

export default function TaskAnswers() {
  const { user: session } = useOutletContext();
  const queryClient = useQueryClient();
  const course = session?.course || 'tcc';
  const initialTask = new URLSearchParams(window.location.search).get('task') || 'all';
  const [taskFilter, setTaskFilter] = useState(initialTask);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { data = {}, isLoading } = useQuery({
    queryKey: ['task-answer-data', course],
    queryFn: async () => {
      const [tasks, submissions, scores] = await Promise.all([
        base44.entities.Task.filter({ course }, '-created_date', 500),
        base44.entities.TaskSubmission.list('-created_date', 5000),
        base44.entities.ScoreItem.list('-created_date', 10000),
      ]);
      const ids = new Set(tasks.map((task) => task.id));
      return { tasks: tasks.filter((task) => task.type === 'upload'), submissions: submissions.filter((item) => ids.has(item.task_id)), scores };
    },
  });
  const tasks = data.tasks || [];
  const submissions = data.submissions || [];
  const scores = data.scores || [];
  const taskById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
  const scoreBySubmission = useMemo(() => new Map(scores.filter((score) => score.category === 'task').map((score) => [`${score.student_email}::${score.ref_id}`, score])), [scores]);
  const pendingCount = submissions.filter((item) => item.status !== 'graded').length;
  const gradedCount = submissions.length - pendingCount;
  const visible = submissions.filter((item) => {
    const task = taskById.get(item.task_id);
    if (!task) return false;
    if (taskFilter !== 'all' && item.task_id !== taskFilter) return false;
    if (statusFilter === 'pending' && item.status === 'graded') return false;
    if (statusFilter === 'graded' && item.status !== 'graded') return false;
    return `${item.student_name || ''} ${item.student_email || ''} ${task.title} ${item.comment || ''}`.toLowerCase().includes(search.trim().toLowerCase());
  });
  const bulkMutation = useMutation({
    mutationFn: async () => {
      const results = await Promise.allSettled(visible.map((submission, index) => {
        const task = taskById.get(submission.task_id);
        return publishReview({ submission, task, feedback: feedbackFor(index), reviewerEmail: session?.email, scoreItem: scoreBySubmission.get(`${submission.student_email}::${submission.task_id}`) });
      }));
      const failures = results.filter((result) => result.status === 'rejected');
      if (failures.length) throw new Error(`${results.length - failures.length} de ${results.length} entregas foram avaliadas. Tente novamente para concluir as restantes.`);
      return results.length;
    },
    onSuccess: async (count) => {
      await queryClient.invalidateQueries({ queryKey: ['task-answer-data'] });
      toast.success(`${count} ${count === 1 ? 'entrega avaliada' : 'entregas avaliadas'} com sucesso!`);
    },
    onError: async (error) => {
      await queryClient.invalidateQueries({ queryKey: ['task-answer-data'] });
      toast.error(error.message);
    },
  });

  return (
    <main className="app-page max-w-5xl mx-auto animate-fade-in-up">
      <button type="button" onClick={() => window.history.back()} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft size={15} /> Voltar para tarefas</button>
      <section className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-card to-primary/5 p-5 sm:p-7 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0"><ClipboardCheck size={20} /></div>
            <div><p className="text-xs uppercase tracking-[0.18em] font-black text-blue-600">Central de correções</p><h1 className="text-2xl font-black text-foreground mt-1">Entregas dos trabalhos</h1><p className="text-sm text-muted-foreground mt-1">Revise, parabenize e pontue todas as entregas sem sair desta tela.</p></div>
          </div>
          <div className="sm:text-right">
            <Button onClick={() => bulkMutation.mutate()} disabled={!visible.length || bulkMutation.isPending} className="gap-2 sm:min-w-52 shadow-lg shadow-primary/15"><WandSparkles size={16} /> {bulkMutation.isPending ? 'Avaliando entregas...' : `Responder e pontuar todos (${visible.length})`}</Button>
            <p className="mt-1.5 text-[11px] text-muted-foreground">Inclui entregas já corrigidas exibidas no filtro.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-5 text-xs font-bold"><span className="rounded-full bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5">{pendingCount} para corrigir</span><span className="rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5">{gradedCount} corrigidos</span><span className="rounded-full bg-card border border-border px-3 py-1.5">{LESSON_FEEDBACK_OPTIONS.length} respostas aleatórias</span></div>
      </section>

      <div className="flex gap-2 mb-4" role="tablist" aria-label="Status das entregas">
        <Button variant={statusFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('all')}>Todas ({submissions.length})</Button>
        <Button variant={statusFilter === 'pending' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('pending')}>A corrigir ({pendingCount})</Button>
        <Button variant={statusFilter === 'graded' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('graded')}>Já corrigidos ({gradedCount})</Button>
      </div>
      <div className="grid sm:grid-cols-[1fr_280px] gap-3 mb-5">
        <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar aluno, trabalho ou resposta..." className="pl-9" /></div>
        <select aria-label="Filtrar por trabalho" value={taskFilter} onChange={(event) => setTaskFilter(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"><option value="all">Todos os trabalhos</option>{tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</select>
      </div>

      {isLoading ? <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-52 rounded-2xl bg-muted animate-pulse" />)}</div> : visible.length === 0 ? <div className="py-16 text-center rounded-2xl border border-dashed border-border text-muted-foreground"><ClipboardCheck size={40} className="mx-auto mb-3 opacity-25" /><p className="font-bold">Nenhuma entrega nesta lista.</p><p className="text-sm mt-1">Altere os filtros ou aguarde novos trabalhos.</p></div> : <div className="space-y-4">{visible.map((submission) => <SubmissionCard key={submission.id} submission={submission} task={taskById.get(submission.task_id)} scoreItem={scoreBySubmission.get(`${submission.student_email}::${submission.task_id}`)} reviewerEmail={session?.email} />)}</div>}
    </main>
  );
}
