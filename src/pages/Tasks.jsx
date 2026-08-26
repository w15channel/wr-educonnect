import React, { useState } from 'react';
import { useOutletContext, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { adminApi } from '@/lib/adminApi';
import {
  ClipboardList, CheckCircle, Plus, Pencil, Trash2, Play, Send, GraduationCap, FileText, ChevronDown, ChevronUp,
  Trophy, Eye, EyeOff, Award, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import SubmissionsList from '../components/tasks/SubmissionsList';
import AIExamGenerator from '../components/tasks/AIExamGenerator';
import ParticipationCelebration from '@/components/shared/ParticipationCelebration';
import useApostilaModuleUnlocks from '@/hooks/useApostilaModuleUnlocks';

const EMPTY_FORM = { title: '', description: '', type: 'upload', deadline: '', max_grade: 6, quiz_questions: [], module_number: '' };

function useScopedPrefix() {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  if ((parts[0] === 'student' || parts[0] === 'adm') && parts[1]) return `/${parts[0]}/${parts[1]}`;
  return '';
}

function extractTaskNumber(title = '') {
  const m = title.match(/(?:trabalho|tarefa|prova)\s*(\d+)/i);
  return m ? Number(m[1]) : null;
}

function taskSorter(a, b) {
  const na = extractTaskNumber(a.title);
  const nb = extractTaskNumber(b.title);
  if (na !== null && nb !== null && na !== nb) return na - nb;
  if (na !== null && nb === null) return -1;
  if (na === null && nb !== null) return 1;
  return (a.created_date || '').localeCompare(b.created_date || '');
}

function SubmittedView({ submission }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl text-xs font-bold">
          <CheckCircle size={12} /> Entregue
        </span>

        {(submission.comment || submission.file_name) && (
          <button
            onClick={() => setOpen(!open)}
            className="inline-flex items-center gap-1 text-xs text-primary border border-primary/20 px-2.5 py-1.5 rounded-xl hover:bg-primary/5 transition-colors"
          >
            <Eye size={11} /> {open ? 'Ocultar' : 'Ver minha entrega'}
          </button>
        )}
      </div>
      {open && (
        <div className="bg-secondary/40 border border-border rounded-xl p-3 space-y-2 text-xs">
          {submission.file_name && (
            <div className="flex items-center gap-2 text-primary">
              <FileText size={12} />
              <span className="font-semibold truncate">{submission.file_name}</span>
            </div>
          )}
          {submission.comment && submission.comment !== `Aluno: ${submission.student_name} | Turma: ${submission.course}` && (
            <div>
              <p className="font-bold text-foreground mb-1">Sua resposta:</p>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{submission.comment}</p>
            </div>
          )}
          {submission.feedback && (
            <div className="border-t border-border pt-2">
              <p className="font-bold text-foreground mb-1 flex items-center gap-1"><Award size={11} className="text-yellow-500" /> Feedback:</p>
              <p className="text-muted-foreground">{submission.feedback}</p>
            </div>
          )}
          <p className="text-muted-foreground/50 text-[10px]">
            {submission.created_date ? format(new Date(submission.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '—'}
          </p>
        </div>
      )}
    </div>
  );
}

export default function Tasks({ mode = 'tasks' }) {
  const { user: session } = useOutletContext();
  const user = session;
  const isTeacher = session?.role === 'admin';
  const prefix = useScopedPrefix();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userCourse = session?.course || 'tcc';

  const [expandedId, setExpandedId] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const [viewSubmissions, setViewSubmissions] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', userCourse],
    queryFn: () => base44.entities.Task.filter({ course: userCourse }, '-created_date', 300),
  });

  const normalizeEmail = (v = '') => String(v || '').trim().toLowerCase();
  const studentEmails = [user?.email, user?.code].filter(Boolean).map(normalizeEmail);

  const { data: submissions = [] } = useQuery({
    queryKey: ['submissions-mine', isTeacher ? 'all' : studentEmails.join('|')],
    queryFn: async () => {
      const records = await base44.entities.TaskSubmission.list('-created_date', 3000);
      return isTeacher ? records : records.filter(s => studentEmails.includes(normalizeEmail(s.student_email)));
    },
    enabled: isTeacher || studentEmails.length > 0,
  });

  const submissionByTaskId = {};
  submissions.forEach(s => { if (!submissionByTaskId[s.task_id]) submissionByTaskId[s.task_id] = s; });

  const sortedTasks = [...tasks]
    .filter(t => isTeacher || !t.is_hidden)
    .filter(t => mode === 'tests' ? t.type === 'quiz' : t.type === 'upload')
    .sort(taskSorter);

  const totalSubmitted = sortedTasks.filter(t => submissionByTaskId[t.id]).length;

  // CRUD mutations
  const createMutation = useMutation({
    mutationFn: d => adminApi.create('Task', d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); setShowForm(false); setForm(EMPTY_FORM); toast.success('Trabalho criado!'); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminApi.update('Task', id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); setEditingTask(null); setShowForm(false); setForm(EMPTY_FORM); toast.success('Atualizado!'); },
  });
  const deleteMutation = useMutation({
    mutationFn: id => adminApi.delete('Task', id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
  const toggleVisibilityMutation = useMutation({
    mutationFn: ({ id, isHidden }) => adminApi.update('Task', id, { is_hidden: isHidden }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Visibilidade da tarefa atualizada.');
    },
  });

  const { moduleUnlocked } = useApostilaModuleUnlocks(userCourse, user);
  const isTaskLocked = (task) => !isTeacher && task.module_number && !moduleUnlocked[Number(task.module_number) - 1];

  const submitCommentMutation = useMutation({
    mutationFn: async ({ taskId, comment }) => {
      await base44.functions.invoke('saveStudentRecord', {
        action: 'create', entity: 'TaskSubmission',
        student_identifiers: [user?.email, user?.code],
        data: { task_id: taskId, student_email: user?.email || user?.code || '', student_name: user?.name || user?.full_name || '', comment, status: 'submitted', course: userCourse },
      });
      const taskTitle = tasks.find(t => t.id === taskId)?.title || 'Trabalho';
      await base44.entities.Notification.create({
        recipient_email: 'admin', sender_email: user?.email || '', sender_name: user?.name || 'Aluno',
        message: `${user?.name || 'Aluno'} enviou resposta para: "${taskTitle}"`,
        task_title: taskTitle, type: 'task_submission', is_read: false,
      });
    },
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ['submissions-mine'] });
      setCommentInputs(prev => ({ ...prev, [taskId]: '' }));
      setExpandedId(null);
      toast.success('Resposta enviada!');
      setCelebrating(true);
    },
  });

  const openEdit = (task) => {
    setEditingTask(task);
    setForm({ title: task.title, description: task.description || '', type: task.type, deadline: task.deadline || '', max_grade: task.type === 'quiz' ? 50 : 5, quiz_questions: task.quiz_questions || [], module_number: task.module_number || '' });
    setShowForm(true);
  };

  if (viewSubmissions) return <SubmissionsList task={viewSubmissions} onBack={() => setViewSubmissions(null)} />;
  if (showAIGenerator && mode === 'tests') return <AIExamGenerator onBack={() => setShowAIGenerator(false)} course={userCourse} />;

  return (
    <div className="app-page max-w-[900px] mx-auto animate-fade-in-up">
      {celebrating && <ParticipationCelebration session={session} achievement={{ kind: 'task', message: 'respondeu uma tarefa com dedicação.' }} message="Tarefa entregue! Parabéns pela dedicação! 🎉" onClose={() => setCelebrating(false)} />}
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList size={22} className="text-primary" />
            {mode === 'tests' ? 'Provas' : 'Tarefas'}
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isTeacher
              ? 'Gerencie tarefas e veja as entregas dos alunos'
              : `As tarefas são baseadas nas aulas da Apostila: estude na Apostila e responda aqui (${totalSubmitted}/${sortedTasks.length} entregue${totalSubmitted !== 1 ? 's' : ''})`
            }
          </p>
        </div>

        {isTeacher && (
          <div className="flex gap-2 items-center">
            {mode === 'tests' && (
              <Button
                variant="outline"
                onClick={() => setShowAIGenerator(true)}
                className="gap-2 h-9 text-sm shrink-0 border-violet-500/40 text-violet-400 hover:bg-violet-500/10 hover:text-violet-300"
              >
                <Sparkles size={14} /> Gerar com IA
              </Button>
            )}
          <Dialog open={showForm} onOpenChange={v => { setShowForm(v); if (!v) { setEditingTask(null); setForm(EMPTY_FORM); } }}>
            <DialogTrigger asChild>
              <Button className="gap-2 h-9 text-sm shrink-0"><Plus size={15} /> {mode === 'tests' ? 'Nova Prova Manual' : 'Nova Tarefa'}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <Input placeholder="Título (ex: Trabalho 01 — Tema)" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                <Textarea placeholder="Descrição / Instruções" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upload">Envio de Arquivo</SelectItem>
                    <SelectItem value="quiz">Prova / Quiz</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="datetime-local" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
                <Input type="number" placeholder="Nota máxima" value={form.max_grade} onChange={e => setForm({ ...form, max_grade: Number(e.target.value) })} />
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Módulo da Apostila (opcional)</label>
                  <Select value={form.module_number ? String(form.module_number) : 'none'} onValueChange={v => setForm({ ...form, module_number: v === 'none' ? '' : Number(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                        <SelectItem key={n} value={String(n)}>Módulo {n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground mt-1">Vincular esta tarefa a um módulo trava o acesso do aluno ao próximo módulo da apostila até ela ser entregue.</p>
                </div>
                <Button onClick={() => { const p = { ...form, course: userCourse }; editingTask ? updateMutation.mutate({ id: editingTask.id, data: p }) : createMutation.mutate(p); }} disabled={!form.title} className="w-full">
                  {editingTask ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        )}
      </div>

      {/* Progress bar — students */}
      {!isTeacher && sortedTasks.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold flex items-center gap-1.5"><ClipboardList size={14} /> Progresso Geral</span>
            <span className="font-mono font-bold text-primary text-sm">{totalSubmitted}/{sortedTasks.length}</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${sortedTasks.length > 0 ? (totalSubmitted / sortedTasks.length) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      {sortedTasks.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <ClipboardList size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-semibold">Nenhuma tarefa encontrada</p>
          {isTeacher && <p className="text-sm mt-1">Clique em "Nova Tarefa" para adicionar</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedTasks.map((task, idx) => {
            const submission = submissionByTaskId[task.id];
            const isDone = !!submission;
            const isExpanded = expandedId === task.id;
            const taskNum = extractTaskNumber(task.title) || idx + 1;
            const isPastDeadline = task.deadline && new Date(task.deadline) < new Date();
            const locked = isTaskLocked(task);

            if (locked) return (
              <div key={task.id} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden opacity-50">
                <div className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-muted text-xl">🔒</div>
                  <div className="p-2 rounded-xl shrink-0 bg-blue-100 text-blue-600"><FileText size={15} /></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-foreground truncate">{task.title}</h3>
                    <p className="text-[10px] text-amber-600 font-semibold mt-0.5">⏳ Conclua o módulo anterior na apostila para liberar</p>
                  </div>
                </div>
              </div>
            );

            return (
              <div key={task.id} className={`bg-card rounded-2xl border shadow-sm overflow-hidden transition-all ${isDone ? 'border-green-200' : 'border-border hover:shadow-md'} ${isTeacher && task.is_hidden ? 'opacity-60' : ''}`}>
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer select-none"
                  onClick={() => !isTeacher && setExpandedId(isExpanded ? null : task.id)}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm border-2 ${isDone ? 'bg-green-500 border-green-400 text-white' : 'bg-secondary border-border text-foreground'}`}>
                    {isDone ? <CheckCircle size={18} /> : taskNum}
                  </div>

                  <div className={`p-2 rounded-xl shrink-0 ${task.type === 'quiz' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                    {task.type === 'quiz' ? <GraduationCap size={15} /> : <FileText size={15} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-foreground truncate">{task.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {isDone && <Badge className="text-[9px] bg-green-100 text-green-700 border-green-200 py-0 px-1.5">✓ Entregue</Badge>}

                      {!isDone && task.deadline && (
                        <span className={`text-[10px] font-semibold ${isPastDeadline ? 'text-red-500' : 'text-muted-foreground'}`}>
                          Prazo: {format(new Date(task.deadline), 'dd/MM HH:mm')}{isPastDeadline ? ' · Expirou' : ''}
                        </span>
                      )}
                      {!isDone && !task.deadline && <span className="text-[10px] text-muted-foreground">Em aberto</span>}
                      {isTeacher && task.is_hidden && (
                        <Badge className="text-[9px] bg-amber-100 text-amber-700 border-amber-200 py-0 px-1.5">Oculta para alunos</Badge>
                      )}
                    </div>
                  </div>

                  {!isTeacher && <div className="shrink-0 text-muted-foreground">{isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>}

                  {isTeacher && (
                    <div className="flex gap-1 shrink-0">
                      <button onClick={e => { e.stopPropagation(); setViewSubmissions(task); }} className="p-2 text-muted-foreground hover:text-primary rounded-lg text-xs border border-border">Entregas</button>
                      <button onClick={e => { e.stopPropagation(); task.type === 'quiz' ? navigate(`${prefix}/tasks/builder/${task.id}`) : openEdit(task); }} className="p-2 text-muted-foreground hover:text-primary rounded-lg"><Pencil size={13} /></button>
                      <button
                        onClick={e => { e.stopPropagation(); toggleVisibilityMutation.mutate({ id: task.id, isHidden: !task.is_hidden }); }}
                        className={`p-2 rounded-lg ${task.is_hidden ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}
                        title={task.is_hidden ? 'Mostrar para alunos' : 'Ocultar para alunos'}
                      >
                        {task.is_hidden ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                      <button onClick={e => { e.stopPropagation(); deleteMutation.mutate(task.id); }} className="p-2 text-muted-foreground hover:text-destructive rounded-lg"><Trash2 size={13} /></button>
                    </div>
                  )}
                </div>

                {isExpanded && !isTeacher && (
                  <div className="px-4 pb-4 border-t border-border pt-3 space-y-3 bg-secondary/10">
                    {task.description && <p className="text-sm text-muted-foreground leading-relaxed">{task.description}</p>}

                    {isDone ? (
                      <SubmittedView submission={submission} />
                    ) : task.type === 'quiz' ? (
                      <Button size="sm" className="gap-1.5" onClick={() => navigate(`${prefix}/tasks/quiz/${task.id}`)}>
                        <Play size={13} /> Iniciar Prova
                      </Button>
                    ) : (
                      <div>
                        <p className="text-xs font-bold text-foreground mb-2">💬 Sua Resposta</p>
                        <Textarea placeholder="Escreva sua resposta aqui..." value={commentInputs[task.id] || ''} onChange={e => setCommentInputs(prev => ({ ...prev, [task.id]: e.target.value }))} rows={5} className="text-xs" />
                        <Button size="sm" className="w-full gap-1.5 mt-2" disabled={!commentInputs[task.id]?.trim() || submitCommentMutation.isPending} onClick={() => submitCommentMutation.mutate({ taskId: task.id, comment: commentInputs[task.id] })}>
                          <Send size={13} /> Enviar Resposta
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {!isTeacher && totalSubmitted >= sortedTasks.length && sortedTasks.length > 0 && (
            <div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5 text-center">
              <Trophy size={30} className="mx-auto mb-2 text-green-500" />
              <p className="font-black text-base text-foreground">Todas as tarefas entregues! 🎉</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
