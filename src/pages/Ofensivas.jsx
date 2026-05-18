import React, { useState } from 'react';
import { useOutletContext, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Flame, CheckCircle, Lock, Star, Plus, Pencil, Trash2, Play, Send, MessageSquare, GraduationCap, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import SubmissionsList from '../components/tasks/SubmissionsList';

const DAILY_LIMIT = 5;
const POINTS_PER_ACTIVITY = 0.1;
const EMPTY_FORM = { title: '', description: '', type: 'text', order: '', points_reward: 0.1, quiz_questions: [] };

function useScopedPrefix() {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  if ((parts[0] === 'student' || parts[0] === 'adm') && parts[1]) return `/${parts[0]}/${parts[1]}`;
  return '';
}

export default function Ofensivas() {
  const { user: session } = useOutletContext();
  const isTeacher = session?.role === 'admin';
  const prefix = useScopedPrefix();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userCourse = session?.course || 'tcc';

  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [expandedId, setExpandedId] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const [uploadFiles, setUploadFiles] = useState({});
  const [uploadStatus, setUploadStatus] = useState({});
  const [viewSubmissions, setViewSubmissions] = useState(null);

  const { data: activities = [] } = useQuery({
    queryKey: ['trail-activities', userCourse],
    queryFn: () => base44.entities.TrailActivity.filter({ course: userCourse }, 'order', 100),
  });

  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: allSubmissions = [] } = useQuery({
    queryKey: ['trail-submissions', isTeacher ? 'all' : session?.email],
    queryFn: () => isTeacher
      ? base44.entities.TrailSubmission.list('-created_date', 2000)
      : base44.entities.TrailSubmission.filter({ student_email: session?.email || '' }, '-created_date', 500),
    enabled: !!session,
  });

  // Contagem de atividades feitas hoje
  const doneToday = allSubmissions.filter(s =>
    s.student_email === session?.email && s.completed_date === today
  ).length;

  const completedIds = new Set(
    allSubmissions.filter(s => s.student_email === session?.email).map(s => s.activity_id)
  );

  const sortedActivities = [...activities].sort((a, b) => (a.order || 0) - (b.order || 0));

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TrailActivity.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['trail-activities'] }); setShowForm(false); setForm(EMPTY_FORM); toast.success('Atividade criada!'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TrailActivity.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['trail-activities'] }); setEditingActivity(null); setShowForm(false); setForm(EMPTY_FORM); toast.success('Atividade atualizada!'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TrailActivity.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trail-activities'] }),
  });

  const submitTextMutation = useMutation({
    mutationFn: async ({ activityId, comment }) => {
      if (doneToday >= DAILY_LIMIT) throw new Error('Limite diário atingido');
      return base44.entities.TrailSubmission.create({
        activity_id: activityId,
        student_email: session?.email || '',
        student_name: session?.name || session?.full_name || '',
        comment,
        course: userCourse,
        status: 'submitted',
        completed_date: today,
      });
    },
    onSuccess: (_, { activityId }) => {
      queryClient.invalidateQueries({ queryKey: ['trail-submissions'] });
      setCommentInputs(prev => ({ ...prev, [activityId]: '' }));
      toast.success(`+${POINTS_PER_ACTIVITY} pts registrados!`);
    },
    onError: (err) => toast.error(err.message || 'Erro ao enviar'),
  });

  const submitFileMutation = useMutation({
    mutationFn: async ({ activityId, file }) => {
      if (doneToday >= DAILY_LIMIT) throw new Error('Limite diário atingido');
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return base44.entities.TrailSubmission.create({
        activity_id: activityId,
        student_email: session?.email || '',
        student_name: session?.name || session?.full_name || '',
        file_url,
        file_name: file.name,
        course: userCourse,
        status: 'submitted',
        completed_date: today,
      });
    },
    onSuccess: (_, { activityId }) => {
      queryClient.invalidateQueries({ queryKey: ['trail-submissions'] });
      setUploadFiles(prev => ({ ...prev, [activityId]: null }));
      setUploadStatus(prev => ({ ...prev, [activityId]: 'success' }));
      toast.success(`+${POINTS_PER_ACTIVITY} pts registrados!`);
    },
    onError: (err) => toast.error(err.message || 'Erro ao enviar'),
  });

  const handleSave = () => {
    const payload = { ...form, order: Number(form.order) || activities.length + 1, course: userCourse };
    if (editingActivity) updateMutation.mutate({ id: editingActivity.id, data: payload });
    else createMutation.mutate(payload);
  };

  const openEdit = (activity) => {
    setEditingActivity(activity);
    setForm({ title: activity.title, description: activity.description || '', type: activity.type, order: activity.order || '', points_reward: activity.points_reward || 0.1, quiz_questions: activity.quiz_questions || [] });
    setShowForm(true);
  };

  if (viewSubmissions) {
    return (
      <div className="p-3 md:p-5 max-w-[900px] mx-auto">
        <button onClick={() => setViewSubmissions(null)} className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">← Voltar</button>
        <h2 className="text-lg font-bold mb-4">{viewSubmissions.title} — Entregas</h2>
        <div className="space-y-3">
          {allSubmissions.filter(s => s.activity_id === viewSubmissions.id).map(sub => (
            <div key={sub.id} className="bg-card border border-border rounded-xl p-4 text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold">{sub.student_name || sub.student_email}</span>
                <Badge variant="secondary">{sub.status}</Badge>
              </div>
              {sub.comment && <p className="text-muted-foreground text-xs">{sub.comment}</p>}
              {sub.file_name && <p className="text-xs text-primary">{sub.file_name}</p>}
              <p className="text-[10px] text-muted-foreground mt-1">{sub.completed_date}</p>
            </div>
          ))}
          {allSubmissions.filter(s => s.activity_id === viewSubmissions.id).length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-8">Nenhuma entrega ainda.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-5 max-w-[900px] mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-foreground flex items-center gap-2">
            <Flame size={22} className="text-orange-500" /> Trilha de Ofensivas
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Complete atividades diárias e avance na trilha. Até {DAILY_LIMIT} por dia · {POINTS_PER_ACTIVITY} pts cada
          </p>
        </div>
        {isTeacher && (
          <Dialog open={showForm} onOpenChange={v => { setShowForm(v); if (!v) { setEditingActivity(null); setForm(EMPTY_FORM); } }}>
            <DialogTrigger asChild>
              <Button className="gap-2 h-9 text-sm shrink-0"><Plus size={15} /> Nova Atividade</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editingActivity ? 'Editar Atividade' : 'Criar Atividade de Trilha'}</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-3">
                <Input placeholder="Título" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                <Textarea placeholder="Descrição / Enunciado" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Resposta em Texto</SelectItem>
                    <SelectItem value="upload">Envio de Arquivo</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="number" placeholder="Posição na trilha (1, 2, 3...)" value={form.order} onChange={e => setForm({ ...form, order: e.target.value })} />
                <Button onClick={handleSave} disabled={!form.title || createMutation.isPending || updateMutation.isPending} className="w-full">
                  {editingActivity ? 'Salvar' : 'Criar Atividade'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Progresso diário */}
      {!isTeacher && (
        <div className="bg-card border border-border rounded-xl p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Flame size={16} className={doneToday > 0 ? 'text-orange-500' : 'text-muted-foreground'} />
              <span className="text-sm font-bold">Ofensiva de Hoje</span>
            </div>
            <span className="text-sm font-mono font-bold text-primary">{doneToday}/{DAILY_LIMIT}</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${(doneToday / DAILY_LIMIT) * 100}%` }}
            />
          </div>
          {doneToday >= DAILY_LIMIT && (
            <p className="text-xs text-orange-600 font-semibold mt-2 flex items-center gap-1">
              🔥 Ofensiva do dia concluída! Volte amanhã para continuar.
            </p>
          )}
          {doneToday > 0 && doneToday < DAILY_LIMIT && (
            <p className="text-xs text-muted-foreground mt-2">
              {DAILY_LIMIT - doneToday} atividade{DAILY_LIMIT - doneToday !== 1 ? 's' : ''} restante{DAILY_LIMIT - doneToday !== 1 ? 's' : ''} hoje · +{((DAILY_LIMIT - doneToday) * POINTS_PER_ACTIVITY).toFixed(1)} pts disponíveis
            </p>
          )}
        </div>
      )}

      {/* Trilha visual */}
      {sortedActivities.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Flame size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-semibold">Nenhuma atividade criada</p>
          {isTeacher && <p className="text-sm mt-1">Clique em "Nova Atividade" para começar a trilha</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedActivities.map((activity, idx) => {
            const isDone = completedIds.has(activity.id);
            const isExpanded = expandedId === activity.id;
            const canDo = !isTeacher && !isDone && doneToday < DAILY_LIMIT;
            const typeIcon = activity.type === 'quiz'
              ? <GraduationCap size={16} />
              : activity.type === 'upload'
              ? <Upload size={16} />
              : <MessageSquare size={16} />;
            const typeColor = activity.type === 'quiz'
              ? 'bg-purple-100 text-purple-600'
              : activity.type === 'upload'
              ? 'bg-blue-100 text-blue-600'
              : 'bg-orange-100 text-orange-600';

            return (
              <div key={activity.id} className={`bg-card rounded-2xl border shadow-sm overflow-hidden transition-all ${isDone ? 'border-green-200 bg-green-50/5' : 'border-border hover:shadow-md'}`}>
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer"
                  onClick={() => !isTeacher && setExpandedId(isExpanded ? null : activity.id)}
                >
                  {/* Step indicator */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${isDone ? 'bg-green-500 text-white' : 'bg-secondary text-muted-foreground'}`}>
                    {isDone ? <CheckCircle size={18} /> : idx + 1}
                  </div>

                  <div className={`p-2 rounded-xl shrink-0 ${typeColor}`}>
                    {typeIcon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-foreground truncate">
                      {activity.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground capitalize">{activity.type === 'text' ? 'Texto' : activity.type === 'upload' ? 'Arquivo' : 'Quiz'}</span>
                      <span className="text-[10px] text-yellow-600 font-semibold flex items-center gap-0.5">
                        <Star size={9} className="fill-yellow-500 text-yellow-500" /> +{activity.points_reward || POINTS_PER_ACTIVITY} pts
                      </span>
                      {isDone && <Badge className="text-[9px] bg-green-100 text-green-700 border-green-200 py-0">✓ Concluída</Badge>}
                    </div>
                  </div>

                  {!isTeacher && (
                    <div className="shrink-0 text-muted-foreground">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  )}

                  {isTeacher && (
                    <div className="flex gap-1 shrink-0">
                      <button onClick={e => { e.stopPropagation(); setViewSubmissions(activity); }} className="p-2 text-muted-foreground hover:text-primary rounded-lg text-xs border border-border">Entregas</button>
                      <button onClick={e => { e.stopPropagation(); openEdit(activity); }} className="p-2 text-muted-foreground hover:text-primary rounded-lg"><Pencil size={13} /></button>
                      <button onClick={e => { e.stopPropagation(); deleteMutation.mutate(activity.id); }} className="p-2 text-muted-foreground hover:text-destructive rounded-lg"><Trash2 size={13} /></button>
                    </div>
                  )}
                </div>

                {/* Expanded content for students */}
                {isExpanded && !isTeacher && (
                  <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                    {activity.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">{activity.description}</p>
                    )}

                    {isDone ? (
                      <p className="text-sm text-green-600 font-semibold flex items-center gap-1.5">
                        <CheckCircle size={14} /> Atividade já concluída!
                      </p>
                    ) : doneToday >= DAILY_LIMIT ? (
                      <p className="text-sm text-orange-600 font-semibold">🔥 Limite diário atingido. Volte amanhã!</p>
                    ) : activity.type === 'quiz' ? (
                      <Button size="sm" className="gap-1.5" onClick={() => navigate(`${prefix}/ofensivas/quiz/${activity.id}`)}>
                        <Play size={13} /> Iniciar Quiz
                      </Button>
                    ) : activity.type === 'upload' ? (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-foreground">📎 Enviar Arquivo</p>
                        <input
                          type="file"
                          onChange={e => setUploadFiles(prev => ({ ...prev, [activity.id]: e.target.files[0] }))}
                          className="w-full text-xs text-muted-foreground file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary file:text-primary-foreground"
                        />
                        <Button
                          size="sm"
                          className="w-full gap-1.5"
                          disabled={!uploadFiles[activity.id] || submitFileMutation.isPending}
                          onClick={() => submitFileMutation.mutate({ activityId: activity.id, file: uploadFiles[activity.id] })}
                        >
                          <Send size={13} /> Enviar
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-foreground">✍️ Sua resposta</p>
                        <Textarea
                          placeholder="Escreva sua resposta aqui..."
                          value={commentInputs[activity.id] || ''}
                          onChange={e => setCommentInputs(prev => ({ ...prev, [activity.id]: e.target.value }))}
                          rows={3}
                          className="text-sm"
                        />
                        <Button
                          size="sm"
                          className="w-full gap-1.5"
                          disabled={!commentInputs[activity.id]?.trim() || submitTextMutation.isPending}
                          onClick={() => submitTextMutation.mutate({ activityId: activity.id, comment: commentInputs[activity.id] })}
                        >
                          <Send size={13} /> Enviar Resposta
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}