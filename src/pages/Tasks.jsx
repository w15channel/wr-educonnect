import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import useCourseFilteredEmails from '@/hooks/useCourseFilteredEmails';
import { FileText, Clock, CheckCircle, Plus, Play, Trash2, Pencil, GraduationCap, ClipboardList, Send, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';
import SubmissionsList from '../components/tasks/SubmissionsList';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbycd1dcbc1UTonX4c_-z9Xa4tpJpR7UE6h_uZjWBMXnOlxdKz89PZwaIfUUNwSxkPB3/exec';

const EMPTY_FORM = { title: '', description: '', type: 'upload', deadline: '', max_grade: 10, quiz_questions: [] };

export default function Tasks({ mode = 'all' }) {
  const { user: session } = useOutletContext();
  const user = session;
  const isTeacher = session?.role === 'admin';
  const { course: routeCourse } = useCourseFilteredEmails();
  const userCourse = routeCourse || session?.course || 'tcc';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [viewSubmissions, setViewSubmissions] = useState(null);
  const [activeTab, setActiveTab] = useState(mode === 'tests' ? 'quizzes' : 'tasks');
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploadStatus, setUploadStatus] = useState({});
  const [uploadFiles, setUploadFiles] = useState({});
  const [commentInputs, setCommentInputs] = useState({});

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', userCourse],
    queryFn: () => base44.entities.Task.filter({ course: userCourse }, '-created_date', 200),
  });
  const { data: unlockRules = [] } = useQuery({
    queryKey: ['unlock-rules-tasks', userCourse],
    queryFn: () => base44.entities.Announcement.filter({ course: userCourse, type: 'unlock_rule' }, '-updated_date', 20),
  });
  const taskUnlockRule = unlockRules.find(r => r.scope === 'tasks');
  const unlockedTaskCount = Math.max(10, Number(taskUnlockRule?.unlock_until || 10));

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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); setShowForm(false); setForm(EMPTY_FORM); toast.success('Tarefa criada!'); },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); setEditingTask(null); setShowForm(false); setForm(EMPTY_FORM); toast.success('Tarefa atualizada!'); },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
  const updateUnlockMutation = useMutation({
    mutationFn: async (unlockUntil) => {
      const payload = { course: userCourse, type: 'unlock_rule', scope: 'tasks', title: `Unlock tasks ${userCourse}`, unlock_until: Number(unlockUntil) };
      if (taskUnlockRule?.id) return base44.entities.Announcement.update(taskUnlockRule.id, payload);
      return base44.entities.Announcement.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unlock-rules-tasks', userCourse] });
      toast.success('Desbloqueio de tarefas atualizado!');
    },
  });

  const submitFileMutation = useMutation({
    mutationFn: async ({ taskId, file }) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return base44.entities.TaskSubmission.create({
        task_id: taskId,
        student_email: user.email || user.code || '',
        student_name: user.name || user.full_name || '',
        file_url,
        status: 'submitted',
      });
    },
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ['submissions-mine'] });
      setUploadStatus(prev => ({ ...prev, [taskId]: 'success' }));
      toast.success('Arquivo enviado com sucesso!');
      setTimeout(() => setUploadStatus(prev => ({ ...prev, [taskId]: null })), 5000);
    },
  });

  const sendNotificationToTeacher = async (taskTitle, submissionType) => {
    // Busca admin para notificar
    const admins = await base44.entities.AccessCode.filter({ is_active: true }, '-created_date', 200);
    // Notifica via entidade interna (não e-mail externo)
    const studentName = user?.name || user?.full_name || user?.email || 'Aluno';
    await base44.entities.Notification.create({
      recipient_email: 'admin',
      sender_email: user?.email || user?.code || '',
      sender_name: studentName,
      message: `${studentName} enviou um ${submissionType} para: "${taskTitle}"`,
      task_title: taskTitle,
      type: 'task_submission',
      is_read: false,
    });
  };

  const handleGoogleDriveUpload = async (taskId) => {
    const file = uploadFiles[taskId];
    if (!file) { toast.error('Selecione um arquivo'); return; }
    const task = tasks.find(t => t.id === taskId);
    const taskTitle = task?.title || 'Tarefa';
    const studentName = user?.name || user?.full_name || 'Aluno';
    // Prefixo no nome do arquivo: TítuloDaTarefa_NomeDoAluno_arquivo.ext
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
      try {
        await fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: params, mode: 'no-cors' });
        // Salva na plataforma
        await base44.entities.TaskSubmission.create({
          task_id: taskId,
          student_email: user.email || user.code || '',
          student_name: studentName,
          file_name: renamedFileName,
          status: 'submitted',
        });
        // Notificação interna ao professor
        await sendNotificationToTeacher(taskTitle, 'arquivo');
        queryClient.invalidateQueries({ queryKey: ['submissions-mine'] });
        setUploadStatus(prev => ({ ...prev, [taskId]: 'success' }));
        setUploadFiles(prev => ({ ...prev, [taskId]: null }));
        toast.success('Trabalho enviado com sucesso!');
        setTimeout(() => setUploadStatus(prev => ({ ...prev, [taskId]: null })), 5000);
      } catch (err) {
        setUploadStatus(prev => ({ ...prev, [taskId]: 'error' }));
      }
    };
    reader.readAsDataURL(file);
  };

  const getSubmission = (taskId) => submissions.find(s => s.task_id === taskId);

  const openEdit = (task) => {
    setEditingTask(task);
    setForm({ title: task.title, description: task.description || '', type: task.type, deadline: task.deadline || '', max_grade: task.max_grade || 10, quiz_questions: task.quiz_questions || [] });
    setShowForm(true);
  };

  const handleSave = () => {
    if (editingTask) updateTaskMutation.mutate({ id: editingTask.id, data: { ...form, course: userCourse } });
    else createTaskMutation.mutate({ ...form, course: userCourse });
  };

  const extractTaskNumber = (title = '') => {
    const m = title.match(/tarefa\s*(\d+)/i);
    return m ? Number(m[1]) : null;
  };

  const taskSorter = (a, b) => {
    const na = extractTaskNumber(a.title);
    const nb = extractTaskNumber(b.title);
    if (na !== null && nb !== null && na !== nb) return na - nb;
    if (na !== null && nb === null) return -1;
    if (na === null && nb !== null) return 1;
    return (a.created_date || '').localeCompare(b.created_date || '');
  };

  const uploadTasks = tasks.filter(t => t.type === 'upload').sort(taskSorter);
  const quizTasks = tasks.filter(t => t.type === 'quiz').sort(taskSorter);
  const displayedTasks = mode === 'tasks' ? uploadTasks : mode === 'tests' ? quizTasks : (activeTab === 'tasks' ? uploadTasks : quizTasks);

  const submitCommentMutation = useMutation({
    mutationFn: async ({ taskId, comment }) => {
      const sub = await base44.entities.TaskSubmission.create({
        task_id: taskId,
        student_email: user?.email || user?.code || '',
        student_name: user?.name || user?.full_name || '',
        comment,
        status: 'submitted',
      });
      // Notificação interna ao professor
      const task = tasks.find(t => t.id === taskId);
      const taskTitle = task?.title || 'Tarefa';
      const studentName = user?.name || user?.full_name || user?.email || 'Aluno';
      await base44.entities.Notification.create({
        recipient_email: 'admin',
        sender_email: user?.email || user?.code || '',
        sender_name: studentName,
        message: `${studentName} enviou uma resposta para: "${taskTitle}"`,
        task_title: taskTitle,
        type: 'task_submission',
        is_read: false,
      });
      return sub;
    },
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ['submissions-mine'] });
      setCommentInputs(prev => ({ ...prev, [taskId]: '' }));
      toast.success('Resposta enviada!');
    },
  });

  if (viewSubmissions) return <SubmissionsList task={viewSubmissions} onBack={() => setViewSubmissions(null)} />;

  return (
    <div className="p-4 lg:p-7 max-w-5xl mx-auto animate-fade-in-up">
      <div className="flex items-center justify-between mb-5 gap-3">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-foreground">{mode === 'tests' ? 'Provas' : mode === 'tasks' ? 'Tarefas' : 'Tarefas e Avaliações'}</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Gerencie trabalhos, provas e entregas</p>
        </div>
        {isTeacher && (
          <div className="flex gap-2">
            <Button variant="outline" className="h-9 text-sm" onClick={() => updateUnlockMutation.mutate(unlockedTaskCount + 1)} disabled={updateUnlockMutation.isPending}>
              Liberar próximo trabalho
            </Button>
            <Button variant="outline" className="gap-2 h-9 text-sm border-purple-300 text-purple-700 hover:bg-purple-50" onClick={() => navigate('/tasks/builder/new')}>
              <GraduationCap size={15} /> Nova Prova
            </Button>
          <Dialog open={showForm} onOpenChange={(v) => { setShowForm(v); if (!v) { setEditingTask(null); setForm(EMPTY_FORM); } }}>
            <DialogTrigger asChild>
              <Button className="gap-2 h-9 text-sm"><Plus size={15} /> Nova Tarefa</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editingTask ? 'Editar Tarefa' : 'Criar Tarefa'}</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <Input placeholder="Título" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                <Textarea placeholder="Descrição / Instruções para o aluno" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} />
                <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upload">Envio de Arquivo (Tarefa)</SelectItem>
                    <SelectItem value="quiz">Prova / Quiz</SelectItem>
                  </SelectContent>
                </Select>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Data de entrega</label>
                  <Input type="datetime-local" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} />
                  <p className="text-[10px] text-muted-foreground mt-1">Esta data também será adicionada ao calendário dos alunos</p>
                </div>
                <Input type="number" placeholder="Nota máxima" value={form.max_grade} onChange={e => setForm({...form, max_grade: Number(e.target.value)})} />
                <Button onClick={handleSave} disabled={!form.title || createTaskMutation.isPending || updateTaskMutation.isPending} className="w-full">
                  {editingTask ? 'Salvar Alterações' : 'Criar Tarefa'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        )}
      </div>
      {isTeacher && <p className="text-xs text-muted-foreground mb-3">Trabalhos/provas liberados para a turma: <strong>{unlockedTaskCount}</strong>.</p>}

      {mode === 'all' && (<>{/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 rounded-xl p-1 mb-5 w-full sm:w-fit">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex flex-1 sm:flex-none items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'tasks' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <ClipboardList size={14} /> Tarefas
          {uploadTasks.length > 0 && <span className="bg-orange-100 text-orange-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{uploadTasks.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab('quizzes')}
          className={`flex flex-1 sm:flex-none items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'quizzes' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <GraduationCap size={14} /> Provas
          {quizTasks.length > 0 && <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{quizTasks.length}</span>}
        </button>
      </div></>)}

      {displayedTasks.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          {activeTab === 'tasks' ? <ClipboardList size={48} className="mx-auto mb-4 opacity-20" /> : <GraduationCap size={48} className="mx-auto mb-4 opacity-20" />}
          <p className="text-lg font-semibold">{activeTab === 'tasks' ? 'Nenhuma tarefa criada' : 'Nenhuma prova criada'}</p>
          {isTeacher && <p className="text-sm mt-1">Clique em "Nova Tarefa" para adicionar</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {displayedTasks.map((task, idx) => {
            const submission = getSubmission(task.id);
            const isPastDeadline = task.deadline && new Date(task.deadline) < new Date();
            const status = uploadStatus[task.id];
            const sequentialNumber = idx + 1;
            const isLocked = !isTeacher && sequentialNumber > unlockedTaskCount;

            if (isLocked) return (
              <div key={task.id} className="bg-card rounded-2xl border border-border shadow-sm opacity-60 select-none">
                <div className="flex items-start gap-3 p-4 sm:p-5">
                  <div className="p-2.5 rounded-xl shrink-0 bg-muted text-muted-foreground">
                    <span className="text-lg">🔒</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground text-sm leading-snug">Tarefa {sequentialNumber} · {task.title}</h3>
                    <p className="text-xs text-amber-600 font-semibold mt-1 flex items-center gap-1">⏳ Em breve — será liberado pelo professor</p>
                  </div>
                </div>
              </div>
            );

            return (
              <div key={task.id} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 p-4 sm:p-5">
                  <div className={`p-2.5 rounded-xl shrink-0 ${task.type === 'quiz' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>
                    <FileText size={17} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground text-sm leading-snug">Tarefa {sequentialNumber} · {task.title}</h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <Badge variant="secondary" className="text-[10px]">{task.type === 'quiz' ? 'Prova' : 'Tarefa'}</Badge>
                      {task.deadline && (
                        <span className={`text-[10px] flex items-center gap-1 font-semibold ${isPastDeadline ? 'text-red-600' : 'text-muted-foreground'}`}>
                          <Clock size={10} /> Entrega: {format(new Date(task.deadline), 'dd/MM HH:mm')}
                          {isPastDeadline && ' (Expirou)'}
                        </span>
                      )}
                      {task.max_grade && <span className="text-[10px] text-muted-foreground">Valor: {task.max_grade} pts</span>}
                    </div>
                    {task.description && <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{task.description}</p>}
                  </div>
                </div>

                {/* Student upload/comment section */}
                {!isTeacher && task.type === 'upload' && !submission && (
                  <div className="px-4 sm:px-5 pb-4 border-t border-border pt-3 bg-secondary/20 space-y-3">
                    <div>
                      <p className="text-xs font-bold text-foreground mb-2">📎 Enviar Arquivo</p>
                      <input
                        type="file"
                        onChange={e => setUploadFiles(prev => ({ ...prev, [task.id]: e.target.files[0] }))}
                        className="w-full text-xs text-muted-foreground file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary file:text-primary-foreground hover:file:opacity-90 cursor-pointer mb-2"
                      />
                      <Button
                        size="sm"
                        className="w-full h-9 text-xs gap-1.5"
                        disabled={!uploadFiles[task.id] || status === 'sending'}
                        onClick={() => handleGoogleDriveUpload(task.id)}
                      >
                        <Send size={13} />
                        {status === 'sending' ? 'Enviando, aguarde...' : 'Enviar Arquivo'}
                      </Button>
                      {status === 'error' && <p className="text-xs text-red-500 text-center mt-1.5 font-semibold">❌ Erro ao enviar. Tente novamente.</p>}
                    </div>
                    <div className="border-t border-border/50 pt-3">
                      <p className="text-xs font-bold text-foreground mb-2">💬 Responder por Comentário</p>
                      <Textarea
                        placeholder="Se não puder enviar arquivo, escreva sua resposta aqui..."
                        value={commentInputs[task.id] || ''}
                        onChange={e => setCommentInputs(prev => ({ ...prev, [task.id]: e.target.value }))}
                        rows={3}
                        className="text-xs"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-9 text-xs gap-1.5 mt-2"
                        disabled={!commentInputs[task.id]?.trim() || submitCommentMutation.isPending}
                        onClick={() => submitCommentMutation.mutate({ taskId: task.id, comment: commentInputs[task.id] })}
                      >
                        <MessageSquare size={13} /> Enviar Comentário
                      </Button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="px-4 sm:px-5 pb-4 flex items-center justify-end gap-2 flex-wrap">
                  {!isTeacher ? (
                    submission ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl text-xs font-bold">
                          <CheckCircle size={12} /> Entregue
                        </span>
                        {submission.grade !== undefined && submission.grade !== null && (
                          <span className="text-sm font-black text-foreground bg-secondary px-3 py-1.5 rounded-xl border border-border">
                            Nota: {submission.grade}
                          </span>
                        )}
                      </div>
                    ) : task.type === 'quiz' ? (
                      <Button size="sm" className="gap-1.5 w-full sm:w-auto h-9 text-xs" onClick={() => navigate(`/tasks/quiz/${task.id}`)}>
                        <Play size={13} /> Iniciar Prova
                      </Button>
                    ) : null
                  ) : (
                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none h-8 text-xs" onClick={() => setViewSubmissions(task)}>
                        Ver Entregas
                      </Button>
                      <button onClick={() => {
                        if (task.type === 'quiz') { navigate(`/tasks/builder/${task.id}`); }
                        else openEdit(task);
                      }} className="p-2 text-muted-foreground hover:text-primary transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => deleteTaskMutation.mutate(task.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg">
                        <Trash2 size={13} />
                      </button>
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
