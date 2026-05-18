import React, { useState } from 'react';
import { useOutletContext, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Flame, CheckCircle, Star, Plus, Pencil, Trash2, Play, Send,
  MessageSquare, GraduationCap, Upload, ChevronDown, ChevronUp,
  Trophy, Lock, FileText, Eye, Award
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
import { formatScore } from '@/lib/scoreUtils';
import { sortBySequence } from '@/lib/sequenceUtils';
import SubmissionsList from '../components/tasks/SubmissionsList';

const DAILY_LIMIT = 5;
const POINTS_PER_ACTIVITY = 0.1;
const EMPTY_FORM = { title: '', description: '', type: 'upload', deadline: '', max_grade: 10, quiz_questions: [] };

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbycd1dcbc1UTonX4c_-z9Xa4tpJpR7UE6h_uZjWBMXnOlxdKz89PZwaIfUUNwSxkPB3/exec';

function useScopedPrefix() {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  if ((parts[0] === 'student' || parts[0] === 'adm') && parts[1]) return `/${parts[0]}/${parts[1]}`;
  return '';
}

function extractTaskNumber(title = '') {
  const m = title.match(/(?:trabalho|tarefa)\s*(\d+)/i);
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

// Barra de progresso diária
function DailyProgress({ doneToday, totalSubmitted, totalTasks }) {
  const pct = Math.min((doneToday / DAILY_LIMIT) * 100, 100);
  const overallPct = totalTasks > 0 ? Math.round((totalSubmitted / totalTasks) * 100) : 0;
  return (
    <div className="bg-card border border-border rounded-2xl p-4 mb-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Flame size={18} className={doneToday > 0 ? 'text-orange-500' : 'text-muted-foreground'} />
          <span className="font-bold text-sm">Ofensiva de Hoje</span>
        </div>
        <span className="font-mono font-bold text-primary text-sm">{doneToday}/{DAILY_LIMIT}</span>
      </div>
      <div className="flex gap-1.5 mb-3">
        {Array.from({ length: DAILY_LIMIT }).map((_, i) => (
          <div key={i} className={`flex-1 h-2.5 rounded-full transition-all ${i < doneToday ? 'bg-orange-400' : 'bg-secondary'}`} />
        ))}
      </div>
      {doneToday >= DAILY_LIMIT ? (
        <p className="text-xs text-orange-600 font-bold flex items-center gap-1.5">🔥 Ofensiva do dia completa! Volte amanhã.</p>
      ) : doneToday > 0 ? (
        <p className="text-xs text-muted-foreground">{DAILY_LIMIT - doneToday} entrega{DAILY_LIMIT - doneToday !== 1 ? 's' : ''} restante{DAILY_LIMIT - doneToday !== 1 ? 's' : ''} hoje</p>
      ) : (
        <p className="text-xs text-muted-foreground">Complete até {DAILY_LIMIT} trabalhos hoje e ganhe pontos na trilha!</p>
      )}
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span>Progresso geral: <strong className="text-foreground">{totalSubmitted}/{totalTasks}</strong> trabalhos entregues</span>
        <span className="font-bold text-primary">{overallPct}%</span>
      </div>
    </div>
  );
}

// Bloco de entrega já feita pelo aluno
function SubmittedView({ submission }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl text-xs font-bold">
          <CheckCircle size={12} /> Entregue
        </span>
        {submission.grade != null && (
          <span className="text-sm font-black text-foreground bg-secondary px-3 py-1.5 rounded-xl border border-border">
            Nota: {formatScore(submission.grade)}
          </span>
        )}
        {(submission.comment || submission.file_name) && (
          <button
            onClick={() => setOpen(!open)}
            className="inline-flex items-center gap-1 text-xs text-primary border border-primary/20 px-2.5 py-1.5 rounded-xl hover:bg-primary/5 transition-colors"
          >
            <Eye size={11} /> {open ? 'Ocultar entrega' : 'Ver minha entrega'}
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
              <p className="font-bold text-foreground mb-1 flex items-center gap-1"><Award size={11} className="text-yellow-500" /> Feedback do professor:</p>
              <p className="text-muted-foreground leading-relaxed">{submission.feedback}</p>
            </div>
          )}
          <p className="text-muted-foreground/50 text-[10px]">Entregue em {submission.created_date ? format(new Date(submission.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '—'}</p>
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
  const [uploadFiles, setUploadFiles] = useState({});
  const [uploadStatus, setUploadStatus] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [submissionDetails, setSubmissionDetails] = useState({});
  const [viewSubmissions, setViewSubmissions] = useState(null);

  // Teacher form state
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', userCourse],
    queryFn: () => base44.entities.Task.filter({ course: userCourse }, '-created_date', 300),
  });

  const normalizeStudentId = (v = '') => String(v || '').trim().toLowerCase();
  const studentIdentifiers = [user?.email, user?.code].filter(Boolean).map(normalizeStudentId);

  const { data: submissions = [] } = useQuery({
    queryKey: ['submissions-mine', isTeacher ? 'all' : studentIdentifiers.join('|')],
    queryFn: async () => {
      const records = await base44.entities.TaskSubmission.list('-created_date', 3000);
      return isTeacher ? records : records.filter(s => studentIdentifiers.includes(normalizeStudentId(s.student_email)));
    },
    enabled: isTeacher || studentIdentifiers.length > 0,
  });

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Trabalhos entregues hoje (para contagem de ofensiva diária)
  const doneToday = submissions.filter(s => {
    if (!s.created_date) return false;
    const d = format(new Date(s.created_date), 'yyyy-MM-dd');
    return d === todayStr;
  }).length;

  const submissionByTaskId = {};
  submissions.forEach(s => {
    if (!submissionByTaskId[s.task_id]) submissionByTaskId[s.task_id] = s;
  });

  const sortedTasks = [...tasks]
    .filter(t => mode === 'tests' ? t.type === 'quiz' : t.type === 'upload')
    .sort(taskSorter);

  const totalSubmitted = sortedTasks.filter(t => submissionByTaskId[t.id]).length;

  // Mutations
  const createTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); setShowForm(false); setForm(EMPTY_FORM); toast.success('Trabalho criado!'); },
  });
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); setEditingTask(null); setShowForm(false); setForm(EMPTY_FORM); toast.success('Trabalho atualizado!'); },
  });
  const deleteTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const submitCommentMutation = useMutation({
    mutationFn: async ({ taskId, comment }) => {
      const res = await base44.functions.invoke('saveStudentRecord', {
        action: 'create', entity: 'TaskSubmission',
        student_identifiers: [user?.email, user?.code],
        data: {
          task_id: taskId,
          student_email: user?.email || user?.code || '',
          student_name: user?.name || user?.full_name || '',
          comment, status: 'submitted', course: userCourse,
        },
      });
      await base44.entities.Notification.create({
        recipient_email: 'admin',
        sender_email: user?.email || user?.code || '',
        sender_name: user?.name || user?.full_name || 'Aluno',
        message: `${user?.name || 'Aluno'} enviou uma resposta para: "${tasks.find(t => t.id === taskId)?.title || 'Trabalho'}"`,
        task_title: tasks.find(t => t.id === taskId)?.title || '',
        type: 'task_submission', is_read: false,
      });
      return res.data.record;
    },
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ['submissions-mine'] });
      setCommentInputs(prev => ({ ...prev, [taskId]: '' }));
      setExpandedId(null);
      toast.success('🔥 Resposta enviada! Ofensiva avançando!');
    },
  });

  const getSubmissionDetail = (taskId) => {
    const current = submissionDetails[taskId] || {};
    return { studentName: current.studentName || user?.name || user?.full_name || '' };
  };

  const getSubmissionDescription = (taskId) => {
    const detail = getSubmissionDetail(taskId);
    if (!detail.studentName?.trim()) return '';
    return `Aluno: ${detail.studentName.trim()} | Turma: ${userCourse}`;
  };

  const handleGoogleDriveUpload = async (taskId) => {
    const file = uploadFiles[taskId];
    if (!file) { toast.error('Selecione um arquivo'); return; }
    const description = getSubmissionDescription(taskId);
    if (!description) { toast.error('Preencha seu nome antes de enviar.'); return; }
    const task = tasks.find(t => t.id === taskId);
    const taskTitle = task?.title || 'Trabalho';
    const studentName = getSubmissionDetail(taskId).studentName || user?.name || user?.full_name || 'Aluno';
    const safeName = (str) => str.replace(/[^a-zA-Z0-9À-ÿ ]/g, '').trim().replace(/\s+/g, '_');
    const renamedFileName = `${safeName(taskTitle)}_${safeName(studentName)}_${file.name}`;
    setUploadStatus(prev => ({ ...prev, [taskId]: 'sending' }));
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = e.target.result.split(',')[1];
      const params = new URLSearchParams();
      params.append('fileName', renamedFileName);
      params.append('mimeType', file.type);
      params.append('fileData', base64Data);
      params.append('description', description);
      try {
        await fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: params, mode: 'no-cors' });
        await base44.functions.invoke('saveStudentRecord', {
          action: 'create', entity: 'TaskSubmission',
          student_identifiers: [user?.email, user?.code],
          data: {
            task_id: taskId,
            student_email: user.email || user.code || '',
            student_name: studentName,
            file_name: renamedFileName,
            comment: description,
            status: 'submitted', course: userCourse,
          },
        });
        await base44.entities.Notification.create({
          recipient_email: 'admin',
          sender_email: user?.email || user?.code || '',
          sender_name: studentName,
          message: `${studentName} enviou um arquivo para: "${taskTitle}"`,
          task_title: taskTitle,
          type: 'task_submission', is_read: false,
        });
        queryClient.invalidateQueries({ queryKey: ['submissions-mine'] });
        setUploadStatus(prev => ({ ...prev, [taskId]: 'success' }));
        setUploadFiles(prev => ({ ...prev, [taskId]: null }));
        setExpandedId(null);
        toast.success('🔥 Arquivo enviado! Ofensiva avançando!');
        setTimeout(() => setUploadStatus(prev => ({ ...prev, [taskId]: null })), 5000);
      } catch {
        setUploadStatus(prev => ({ ...prev, [taskId]: 'error' }));
        toast.error('Erro ao enviar. Tente novamente.');
      }
    };
    reader.readAsDataURL(file);
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setForm({ title: task.title, description: task.description || '', type: task.type, deadline: task.deadline || '', max_grade: task.max_grade || 10, quiz_questions: task.quiz_questions || [] });
    setShowForm(true);
  };

  const handleSave = () => {
    const payload = { ...form, course: userCourse };
    if (editingTask) updateTaskMutation.mutate({ id: editingTask.id, data: payload });
    else createTaskMutation.mutate(payload);
  };

  if (viewSubmissions) return <SubmissionsList task={viewSubmissions} onBack={() => setViewSubmissions(null)} />;

  return (
    <div className="p-3 md:p-5 max-w-[900px] mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-foreground flex items-center gap-2">
            <Flame size={22} className="text-orange-500" />
            {mode === 'tests' ? 'Trilha de Provas' : 'Trilha de Trabalhos'}
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isTeacher ? 'Gerencie trabalhos e veja as entregas dos alunos' : `Entregue seus trabalhos e mantenha sua trilha. Até ${DAILY_LIMIT} por dia.`}
          </p>
        </div>

        {isTeacher && (
          <Dialog open={showForm} onOpenChange={v => { setShowForm(v); if (!v) { setEditingTask(null); setForm(EMPTY_FORM); } }}>
            <DialogTrigger asChild>
              <Button className="gap-2 h-9 text-sm shrink-0"><Plus size={15} /> Novo Trabalho</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editingTask ? 'Editar Trabalho' : 'Criar Trabalho'}</DialogTitle></DialogHeader>
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
                <Button onClick={handleSave} disabled={!form.title || createTaskMutation.isPending || updateTaskMutation.isPending} className="w-full">
                  {editingTask ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Progresso diário — só alunos */}
      {!isTeacher && (
        <DailyProgress doneToday={doneToday} totalSubmitted={totalSubmitted} totalTasks={sortedTasks.length} />
      )}

      {/* Stats rápidas — só alunos */}
      {!isTeacher && sortedTasks.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-orange-500">{doneToday}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Hoje</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-green-500">{totalSubmitted}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Entregues</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-muted-foreground">{sortedTasks.length - totalSubmitted}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Pendentes</p>
          </div>
        </div>
      )}

      {sortedTasks.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Flame size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-semibold">Nenhum trabalho encontrado</p>
          {isTeacher && <p className="text-sm mt-1">Clique em "Novo Trabalho" para adicionar</p>}
        </div>
      ) : (
        <div className="relative">
          {/* Linha vertical da trilha */}
          <div className="absolute left-[23px] top-10 bottom-10 w-0.5 bg-border pointer-events-none" />

          <div className="space-y-3">
            {sortedTasks.map((task, idx) => {
              const submission = submissionByTaskId[task.id];
              const isDone = !!submission;
              const isExpanded = expandedId === task.id;
              const status = uploadStatus[task.id];
              const taskNum = extractTaskNumber(task.title) || idx + 1;
              const isPastDeadline = task.deadline && new Date(task.deadline) < new Date();

              return (
                <div key={task.id} className={`bg-card rounded-2xl border shadow-sm overflow-hidden transition-all ${
                  isDone ? 'border-green-200' : 'border-border hover:shadow-md'
                }`}>
                  {/* Cabeçalho clicável */}
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer select-none"
                    onClick={() => !isTeacher && setExpandedId(isExpanded ? null : task.id)}
                  >
                    {/* Indicador de passo */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm border-2 ${
                      isDone ? 'bg-green-500 border-green-400 text-white' : 'bg-secondary border-border text-foreground'
                    }`}>
                      {isDone ? <CheckCircle size={18} /> : taskNum}
                    </div>

                    {/* Ícone de tipo */}
                    <div className={`p-2 rounded-xl shrink-0 ${task.type === 'quiz' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>
                      {task.type === 'quiz' ? <GraduationCap size={15} /> : <FileText size={15} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-foreground truncate">{task.title}</h3>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {isDone && <Badge className="text-[9px] bg-green-100 text-green-700 border-green-200 py-0 px-1.5">✓ Entregue</Badge>}
                        {isDone && submission?.grade != null && (
                          <span className="text-[10px] text-yellow-600 font-bold flex items-center gap-0.5">
                            <Star size={9} className="fill-yellow-500" /> {formatScore(submission.grade)} pts
                          </span>
                        )}
                        {!isDone && task.deadline && (
                          <span className={`text-[10px] font-semibold ${isPastDeadline ? 'text-red-500' : 'text-muted-foreground'}`}>
                            Entrega: {format(new Date(task.deadline), 'dd/MM HH:mm')}
                            {isPastDeadline && ' · Expirou'}
                          </span>
                        )}
                        {!isDone && !task.deadline && (
                          <span className="text-[10px] text-muted-foreground">Entrega em aberto</span>
                        )}
                      </div>
                    </div>

                    {!isTeacher && (
                      <div className="shrink-0 text-muted-foreground">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    )}

                    {isTeacher && (
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={e => { e.stopPropagation(); setViewSubmissions(task); }}
                          className="p-2 text-muted-foreground hover:text-primary rounded-lg text-xs border border-border"
                        >Entregas</button>
                        <button onClick={e => { e.stopPropagation(); task.type === 'quiz' ? navigate(`${prefix}/tasks/builder/${task.id}`) : openEdit(task); }} className="p-2 text-muted-foreground hover:text-primary rounded-lg">
                          <Pencil size={13} />
                        </button>
                        <button onClick={e => { e.stopPropagation(); deleteTaskMutation.mutate(task.id); }} className="p-2 text-muted-foreground hover:text-destructive rounded-lg">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Conteúdo expandido — alunos */}
                  {isExpanded && !isTeacher && (
                    <div className="px-4 pb-4 border-t border-border pt-3 space-y-3 bg-secondary/10">
                      {task.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed">{task.description}</p>
                      )}

                      {/* Já entregue: mostra o que foi enviado */}
                      {isDone ? (
                        <SubmittedView submission={submission} />
                      ) : task.type === 'quiz' ? (
                        <Button size="sm" className="gap-1.5" onClick={() => navigate(`${prefix}/tasks/quiz/${task.id}`)}>
                          <Play size={13} /> Iniciar Prova
                        </Button>
                      ) : (
                        /* Ainda não entregue: formulário de envio */
                        <div className="space-y-3">
                          {/* Upload de arquivo */}
                          <div>
                            <p className="text-xs font-bold text-foreground mb-2">📎 Enviar Arquivo</p>
                            <Input
                              placeholder="Seu nome"
                              value={getSubmissionDetail(task.id).studentName}
                              onChange={e => setSubmissionDetails(prev => ({ ...prev, [task.id]: { ...getSubmissionDetail(task.id), studentName: e.target.value } }))}
                              className="h-9 text-xs mb-2"
                            />
                            <input
                              type="file"
                              onChange={e => setUploadFiles(prev => ({ ...prev, [task.id]: e.target.files[0] }))}
                              className="w-full text-xs text-muted-foreground file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary file:text-primary-foreground mb-2"
                            />
                            <Button
                              size="sm" className="w-full h-9 text-xs gap-1.5"
                              disabled={!uploadFiles[task.id] || status === 'sending' || !getSubmissionDescription(task.id)}
                              onClick={() => handleGoogleDriveUpload(task.id)}
                            >
                              <Send size={13} />
                              {status === 'sending' ? 'Enviando...' : 'Enviar Arquivo'}
                            </Button>
                            {status === 'error' && <p className="text-xs text-red-500 text-center mt-1">❌ Erro ao enviar. Tente novamente.</p>}
                          </div>

                          {/* Ou resposta em texto */}
                          <div className="border-t border-border/50 pt-3">
                            <p className="text-xs font-bold text-foreground mb-2">💬 Ou responder por texto</p>
                            <Textarea
                              placeholder="Se não puder enviar arquivo, escreva sua resposta aqui..."
                              value={commentInputs[task.id] || ''}
                              onChange={e => setCommentInputs(prev => ({ ...prev, [task.id]: e.target.value }))}
                              rows={4} className="text-xs"
                            />
                            <Button
                              size="sm" variant="outline" className="w-full h-9 text-xs gap-1.5 mt-2"
                              disabled={!commentInputs[task.id]?.trim() || submitCommentMutation.isPending}
                              onClick={() => submitCommentMutation.mutate({ taskId: task.id, comment: commentInputs[task.id] })}
                            >
                              <MessageSquare size={13} /> Enviar Resposta em Texto
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Troféu ao completar tudo */}
          {!isTeacher && totalSubmitted >= sortedTasks.length && sortedTasks.length > 0 && (
            <div className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-5 text-center">
              <Trophy size={32} className="mx-auto mb-2 text-yellow-500" />
              <p className="font-black text-lg text-foreground">Trilha Concluída! 🎉</p>
              <p className="text-sm text-muted-foreground mt-1">Você entregou todos os trabalhos desta trilha. Parabéns!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}