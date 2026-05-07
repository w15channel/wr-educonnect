import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ExternalLink, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function SubmissionsList({ task, onBack }) {
  const queryClient = useQueryClient();
  const [grading, setGrading] = useState({});

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['task-submissions', task.id],
    queryFn: () => base44.entities.TaskSubmission.filter({ task_id: task.id }, '-created_date', 200),
  });

  const gradeMutation = useMutation({
    mutationFn: ({ id, grade, feedback }) => base44.entities.TaskSubmission.update(id, { grade: Number(grade), feedback, status: 'graded' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-submissions', task.id] });
      toast.success('Nota atribuída com sucesso!');
    },
  });

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <Button variant="ghost" className="gap-2 mb-4" onClick={onBack}>
        <ArrowLeft size={16} /> Voltar
      </Button>
      <h2 className="text-2xl font-bold text-foreground mb-1">{task.title}</h2>
      <p className="text-muted-foreground text-sm mb-6">Entregas dos alunos</p>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />)}</div>
      ) : submissions.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">Nenhuma entrega recebida.</p>
      ) : (
        <div className="space-y-3">
          {submissions.map(sub => (
            <div key={sub.id} className="bg-card p-5 rounded-2xl border border-border shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <p className="font-semibold text-foreground">{sub.student_name || sub.student_email}</p>
                  <p className="text-xs text-muted-foreground mt-1">{format(new Date(sub.created_date), 'dd/MM/yyyy HH:mm')}</p>
                  {sub.file_url && (
                    <a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="text-primary text-xs flex items-center gap-1 mt-1 hover:underline">
                      <ExternalLink size={12} /> Ver arquivo
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {sub.status === 'graded' ? (
                    <div className="text-right">
                      <Badge className="bg-green-100 text-green-700 gap-1"><CheckCircle size={12} /> Corrigido</Badge>
                      <p className="font-bold text-foreground mt-1">Nota: {sub.grade}</p>
                      {sub.feedback && <p className="text-xs text-muted-foreground mt-1">"{sub.feedback}"</p>}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Nota"
                        className="w-20 h-9"
                        value={grading[sub.id]?.grade || ''}
                        onChange={e => setGrading({...grading, [sub.id]: {...grading[sub.id], grade: e.target.value}})}
                      />
                      <Input
                        placeholder="Feedback"
                        className="w-40 h-9"
                        value={grading[sub.id]?.feedback || ''}
                        onChange={e => setGrading({...grading, [sub.id]: {...grading[sub.id], feedback: e.target.value}})}
                      />
                      <Button
                        size="sm"
                        onClick={() => gradeMutation.mutate({ id: sub.id, grade: grading[sub.id]?.grade, feedback: grading[sub.id]?.feedback })}
                        disabled={!grading[sub.id]?.grade}
                      >
                        Avaliar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}