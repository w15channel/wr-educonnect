import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ExternalLink, CheckCircle, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { formatScore, roundScore } from '@/lib/scoreUtils';

// Componente isolado por submissão — evita re-render geral e bug de perda de foco
function SubmissionRow({ sub, task }) {
  const queryClient = useQueryClient();
  const [grade, setGrade] = useState(sub.grade !== undefined && sub.grade !== null ? formatScore(sub.grade) : '');
  const [feedback, setFeedback] = useState(sub.feedback || '');

  const gradeMutation = useMutation({
    mutationFn: async () => {
      const normalizedGrade = roundScore(String(grade).replace(',', '.'));
      const updated = await base44.entities.TaskSubmission.update(sub.id, {
        grade: normalizedGrade,
        feedback,
        status: 'graded',
      });
      const category = task.type === 'quiz' ? 'quiz' : 'task';
      const existing = await base44.entities.ScoreItem.filter({ student_email: sub.student_email, category, ref_id: sub.task_id }, '-created_date', 1);
      const scorePayload = {
        student_email: sub.student_email,
        category,
        ref_id: sub.task_id,
        ref_title: task.title,
        score: normalizedGrade,
        max_score: roundScore(task.max_grade || (task.type === 'quiz' ? 60 : 6)),
        verified: true,
        notes: feedback || '',
      };
      if (existing[0]) await base44.entities.ScoreItem.update(existing[0].id, scorePayload);
      else await base44.entities.ScoreItem.create(scorePayload);
      await base44.functions.invoke('populateScoreCache', { student_email: sub.student_email });
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-submissions', sub.task_id] });
      queryClient.invalidateQueries({ queryKey: ['access-codes'] });
      toast.success('Nota atribuída e cache atualizado!');
    },
  });

  const isGraded = sub.status === 'graded';

  return (
    <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
      {/* Student info */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="font-semibold text-foreground">{sub.student_name || sub.student_email}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(sub.created_date), 'dd/MM/yyyy HH:mm')}</p>
        </div>
        {isGraded && (
          <Badge className="bg-green-100 text-green-700 gap-1 shrink-0">
            <CheckCircle size={12} /> Corrigido · {formatScore(sub.grade)} pts
          </Badge>
        )}
      </div>

      {/* File */}
      {sub.file_url && (
        <a href={sub.file_url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-primary text-xs hover:underline mb-3">
          <ExternalLink size={12} /> Ver arquivo enviado
        </a>
      )}

      {/* File name */}
      {sub.file_name && !sub.file_url && (
        <p className="text-xs text-muted-foreground mb-3 font-mono bg-secondary/50 px-2 py-1 rounded-lg inline-block">
          📎 {sub.file_name}
        </p>
      )}

      {/* Comment/text answer — filter out upload metadata strings */}
      {sub.comment && !/^Aluno:/.test(sub.comment) && (
        <div className="bg-secondary/40 rounded-xl p-3 mb-4 border border-border">
          <p className="text-[10px] font-bold text-muted-foreground mb-1 flex items-center gap-1">
            <MessageSquare size={10} /> Resposta do aluno
          </p>
          <p className="text-sm text-foreground/80 whitespace-pre-wrap">{sub.comment}</p>
        </div>
      )}

      {/* Previous feedback (graded) */}
      {isGraded && sub.feedback && (
        <div className="bg-primary/5 rounded-xl p-3 mb-4 border border-primary/15">
          <p className="text-[10px] font-bold text-primary mb-1">Sua devolutiva anterior:</p>
          <p className="text-xs text-foreground/80">{sub.feedback}</p>
        </div>
      )}

      {/* Grading form */}
      <div className="space-y-2 pt-3 border-t border-border">
        <p className="text-xs font-bold text-foreground mb-2">{isGraded ? 'Atualizar avaliação' : 'Avaliar entrega'}</p>
        <div className="flex items-center gap-2">
          <div className="shrink-0">
            <label className="text-[10px] text-muted-foreground font-semibold block mb-1">Nota {task?.max_grade ? `(máx. ${formatScore(task.max_grade)})` : ''}</label>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="0"
              className="w-24 h-9"
              value={grade}
              onChange={e => setGrade(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground font-semibold block mb-1">Devolutiva / Feedback</label>
          <Textarea
            placeholder="Escreva o feedback para o aluno..."
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            rows={3}
            className="text-sm"
          />
        </div>
        <Button
          size="sm"
          className="w-full h-9 text-xs"
          onClick={() => gradeMutation.mutate()}
          disabled={!grade || gradeMutation.isPending}
        >
          {gradeMutation.isPending ? 'Salvando...' : isGraded ? 'Atualizar Avaliação' : 'Confirmar Avaliação'}
        </Button>
      </div>
    </div>
  );
}

export default function SubmissionsList({ task, onBack }) {
  const normalizeTitle = (value = '') => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\b(tarefa|trabalho)\b/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['task-submissions', task.id, task.title],
    queryFn: async () => {
      const records = await base44.entities.TaskSubmission.list('-created_date', 3000);
      const taskTitle = normalizeTitle(task.title);
      return records.filter(sub => sub.task_id === task.id || (taskTitle && normalizeTitle([sub.task_title, sub.file_name, sub.comment].filter(Boolean).join(' ')).includes(taskTitle.slice(0, 20))));
    },
  });

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <Button variant="ghost" className="gap-2 mb-4" onClick={onBack}>
        <ArrowLeft size={16} /> Voltar
      </Button>
      <h2 className="text-2xl font-bold text-foreground mb-1">{task.title}</h2>
      <p className="text-muted-foreground text-sm mb-6">
        Entregas dos alunos · {submissions.length} {submissions.length === 1 ? 'entrega' : 'entregas'}
      </p>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />)}</div>
      ) : submissions.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">Nenhuma entrega recebida.</p>
      ) : (
        <div className="space-y-4">
          {submissions.map(sub => (
            <SubmissionRow key={sub.id} sub={sub} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}