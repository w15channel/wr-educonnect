import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Clock, CheckCircle, Plus, Upload, Play, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';
import QuizView from '../components/tasks/QuizView';
import SubmissionsList from '../components/tasks/SubmissionsList';

export default function Tasks() {
  const { user } = useOutletContext();
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [viewSubmissions, setViewSubmissions] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', type: 'upload', deadline: '', max_grade: 10, quiz_questions: [] });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 100),
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['submissions-mine'],
    queryFn: () => base44.entities.TaskSubmission.filter(
      isTeacher ? {} : { student_email: user?.email },
      '-created_date', 200
    ),
    enabled: !!user,
  });

  const createTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowForm(false);
      setForm({ title: '', description: '', type: 'upload', deadline: '', max_grade: 10, quiz_questions: [] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const submitFileMutation = useMutation({
    mutationFn: async ({ taskId, file }) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return base44.entities.TaskSubmission.create({
        task_id: taskId,
        student_email: user.email,
        student_name: user.full_name,
        file_url,
        status: 'submitted',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions-mine'] });
      toast.success('Arquivo enviado com sucesso!');
    },
  });

  const getSubmission = (taskId) => submissions.find(s => s.task_id === taskId);

  const handleFileUpload = (taskId) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) submitFileMutation.mutate({ taskId, file });
    };
    input.click();
  };

  if (selectedQuiz) {
    return <QuizView task={selectedQuiz} user={user} onBack={() => { setSelectedQuiz(null); queryClient.invalidateQueries({ queryKey: ['submissions-mine'] }); }} />;
  }

  if (viewSubmissions) {
    return <SubmissionsList task={viewSubmissions} onBack={() => setViewSubmissions(null)} />;
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Tarefas e Avaliações</h2>
          <p className="text-muted-foreground text-sm mt-1">Gerencie trabalhos, provas e entregas</p>
        </div>
        {isTeacher && (
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus size={16} /> Nova Tarefa</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Criar Tarefa</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <Input placeholder="Título" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                <Textarea placeholder="Descrição / Instruções" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upload">Envio de Arquivo</SelectItem>
                    <SelectItem value="quiz">Prova / Quiz</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="datetime-local" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} />
                <Input type="number" placeholder="Nota máxima" value={form.max_grade} onChange={e => setForm({...form, max_grade: Number(e.target.value)})} />
                <Button onClick={() => createTaskMutation.mutate(form)} disabled={!form.title} className="w-full">
                  Criar Tarefa
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <FileText size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Nenhuma tarefa criada ainda</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => {
            const submission = getSubmission(task.id);
            const isPastDeadline = task.deadline && new Date(task.deadline) < new Date();
            return (
              <div key={task.id} className="bg-card p-5 rounded-2xl border border-border shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl ${task.type === 'quiz' ? 'bg-accent/20 text-accent' : 'bg-primary/10 text-primary'}`}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{task.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <Badge variant="secondary" className="text-xs">{task.type === 'quiz' ? 'Prova' : 'Trabalho'}</Badge>
                      {task.deadline && (
                        <span className={`text-xs flex items-center gap-1 ${isPastDeadline ? 'text-destructive' : 'text-muted-foreground'}`}>
                          <Clock size={12} /> {format(new Date(task.deadline), 'dd/MM/yyyy HH:mm')}
                        </span>
                      )}
                    </div>
                    {task.description && <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{task.description}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {!isTeacher ? (
                    submission ? (
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-medium">
                          <CheckCircle size={13} /> Entregue
                        </span>
                        {submission.grade !== undefined && submission.grade !== null && (
                          <p className="text-sm font-bold text-foreground mt-1">Nota: {submission.grade}</p>
                        )}
                      </div>
                    ) : task.type === 'upload' ? (
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleFileUpload(task.id)} disabled={submitFileMutation.isPending}>
                        <Upload size={14} /> Enviar Arquivo
                      </Button>
                    ) : (
                      <Button size="sm" className="gap-1.5" onClick={() => setSelectedQuiz(task)}>
                        <Play size={14} /> Iniciar Prova
                      </Button>
                    )
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setViewSubmissions(task)}>
                        Ver Entregas
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteTaskMutation.mutate(task.id)}>
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}