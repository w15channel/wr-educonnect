import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trophy, ChevronLeft, CheckCircle, Clock, BookOpen, Video, FileText, MessageSquare, Star, Users, Search, AlertCircle, Heart, ArrowUpDown, Activity, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';

const CATEGORY_CONFIG = {
  lesson: { label: 'Aula Gravada', icon: BookOpen, color: 'bg-purple-100 text-purple-700' },
  live_attendance: { label: 'Presença Live', icon: Video, color: 'bg-red-100 text-red-700' },
  task: { label: 'Tarefa', icon: FileText, color: 'bg-orange-100 text-orange-700' },
  quiz: { label: 'Prova', icon: Trophy, color: 'bg-blue-100 text-blue-700' },
  forum: { label: 'Fórum', icon: MessageSquare, color: 'bg-green-100 text-green-700' },
  therapist: { label: 'Terapeuta da Semana', icon: Heart, color: 'bg-pink-100 text-pink-700' },
};

function StudentScoreDetail({ code, onBack }) {
  const queryClient = useQueryClient();
  const email = code.student_email || '';
  const displayName = code.profile_name || code.student_name || 'Sem nome';

  const { data: lessons = [] } = useQuery({ queryKey: ['lessons'], queryFn: () => base44.entities.RecordedLesson.list('order', 100) });
  const { data: progresses = [] } = useQuery({ queryKey: ['lesson-progress', email], queryFn: () => base44.entities.LessonProgress.filter({ student_email: email }, '-created_date', 200) });
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => base44.entities.Task.list('-created_date', 100) });
  const { data: submissions = [] } = useQuery({ queryKey: ['submissions-student', email], queryFn: () => base44.entities.TaskSubmission.filter({ student_email: email }, '-created_date', 200) });
  const { data: attendances = [] } = useQuery({ queryKey: ['attendances', email], queryFn: () => base44.entities.LiveAttendance.filter({ student_email: email }, '-created_date', 100) });
  const { data: liveSessions = [] } = useQuery({ queryKey: ['live-sessions'], queryFn: () => base44.entities.LiveSession.list('-scheduled_at', 50) });
  const { data: forumPosts = [] } = useQuery({ queryKey: ['forum-posts', email], queryFn: () => base44.entities.ForumPost.filter({ author_email: email }, '-created_date', 100) });
  const { data: forumReplies = [] } = useQuery({ queryKey: ['forum-replies', email], queryFn: () => base44.entities.ForumReply.filter({ author_email: email }, '-created_date', 100) });
  const { data: scoreItems = [] } = useQuery({ queryKey: ['score-items', email], queryFn: () => base44.entities.ScoreItem.filter({ student_email: email }, '-created_date', 500) });
  const { data: pairings = [] } = useQuery({ queryKey: ['therapist-pairings-score', email], queryFn: () => base44.entities.TherapistPairing.list('-pairing_date', 200) });

  const [scores, setScores] = useState({});
  const [notes, setNotes] = useState({});
  const [activeSection, setActiveSection] = useState('lessons');

  const updateScoreMutation = useMutation({
    mutationFn: async ({ category, ref_id, ref_title, score, max_score, notes: itemNotes }) => {
      const existing = scoreItems.find(s => s.category === category && s.ref_id === ref_id);
      const data = { student_email: email, category, ref_id, ref_title, score: Number(score), max_score, verified: true, notes: itemNotes || '' };
      if (existing) return base44.entities.ScoreItem.update(existing.id, data);
      return base44.entities.ScoreItem.create(data);
    },
    onMutate: async ({ category, ref_id, ref_title, score, max_score, notes: itemNotes }) => {
      await queryClient.cancelQueries({ queryKey: ['score-items', email] });
      const previous = queryClient.getQueryData(['score-items', email]);
      queryClient.setQueryData(['score-items', email], (old = []) => {
        const existing = old.find(s => s.category === category && s.ref_id === ref_id);
        const updated = { student_email: email, category, ref_id, ref_title, score: Number(score), max_score, verified: true, notes: itemNotes || '', id: existing?.id || `optimistic_${ref_id}` };
        if (existing) return old.map(s => s.category === category && s.ref_id === ref_id ? updated : s);
        return [...old, updated];
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['score-items', email], ctx.previous);
      toast.error('Erro ao salvar pontuação.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['score-items', email] });
      queryClient.invalidateQueries({ queryKey: ['score-items-all'] });
      toast.success('Pontuação salva!');
    },
  });

  const getScoreItem = (category, ref_id) => scoreItems.find(s => s.category === category && s.ref_id === ref_id);

  const totalScore = scoreItems.filter(s => s.verified).reduce((sum, s) => sum + (s.score || 0), 0);

  const sections = [
    { key: 'lessons', label: 'Aulas', icon: BookOpen },
    { key: 'lives', label: 'Presenças', icon: Video },
    { key: 'tasks', label: 'Tarefas', icon: FileText },
    { key: 'forum', label: 'Fórum', icon: MessageSquare },
    { key: 'therapist', label: 'Terapeutas', icon: Heart },
  ];

  const myPairings = pairings.filter(p => p.therapist_email === email || p.patient_email === email);

  const sectionPending = {
    lessons: lessons.some(l => {
      const p = progresses.find(pr => pr.lesson_id === l.id);
      return p && (p.watched || p.comment || p.summary) && !scoreItems.find(s => s.category === 'lesson' && s.ref_id === l.id && s.verified);
    }),
    lives: liveSessions.some(sess => {
      const att = attendances.find(a => a.session_id === sess.id);
      return att && !scoreItems.find(s => s.category === 'live_attendance' && s.ref_id === sess.id && s.verified);
    }),
    tasks: tasks.some(task => {
      const sub = submissions.find(s => s.task_id === task.id);
      return sub && !scoreItems.find(s => (s.category === 'task' || s.category === 'quiz') && s.ref_id === task.id && s.verified);
    }),
    forum: [...forumPosts, ...forumReplies].some(item =>
      !scoreItems.find(s => s.category === 'forum' && s.ref_id === item.id && s.verified)
    ),
    therapist: myPairings.some(p =>
      !scoreItems.find(s => s.category === 'therapist' && s.ref_id === p.id && s.verified)
    ),
  };

  const uncorrectedTaskIds = new Set(
    submissions
      .filter(s => s.status === 'submitted' && !scoreItems.find(si => si.ref_id === s.task_id && si.student_email === email && si.verified))
      .map(s => s.task_id)
  );

  const ScoreRow = ({ category, ref_id, ref_title, max_score = 10, children }) => {
    const item = getScoreItem(category, ref_id);
    const key = `${category}_${ref_id}`;
    const currentScore = scores[key] !== undefined ? scores[key] : (item?.score ?? '');
    const currentNotes = notes[key] !== undefined ? notes[key] : (item?.notes ?? '');
    const needsCorrection = (category === 'task' || category === 'quiz') && uncorrectedTaskIds.has(ref_id);

    return (
      <div className={`p-4 rounded-xl border transition-all ${needsCorrection ? 'border-red-300 bg-red-50/40' : item?.verified ? 'border-green-200 bg-green-50/30' : 'border-border bg-card'}`}>
        <div className="flex items-start gap-3 mb-3">
          <div className={`p-1.5 rounded-lg shrink-0 ${CATEGORY_CONFIG[category].color}`}>
            {React.createElement(CATEGORY_CONFIG[category].icon, { size: 13 })}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-foreground leading-snug">{ref_title}</p>
              {needsCorrection && <AlertCircle size={13} className="text-red-500 shrink-0" />}
            </div>
            {children}
          </div>
          {item?.verified && <CheckCircle size={15} className="text-green-600 shrink-0 mt-0.5" />}
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-2">
          <Input
            type="number"
            min={0}
            max={max_score}
            step={0.1}
            placeholder={`0–${max_score}`}
            value={currentScore}
            onChange={e => setScores(prev => ({ ...prev, [key]: e.target.value }))}
            className="w-20 h-8 text-xs"
          />
          <span className="text-xs text-muted-foreground">/ {max_score}</span>
          <Input
            placeholder="Observação"
            value={currentNotes}
            onChange={e => setNotes(prev => ({ ...prev, [key]: e.target.value }))}
            className="flex-1 h-8 text-xs min-w-[120px]"
          />
          <Button
            size="sm"
            className="h-8 text-xs px-3"
            onClick={() => updateScoreMutation.mutate({ category, ref_id, ref_title, score: currentScore || 0, max_score, notes: currentNotes })}
            disabled={updateScoreMutation.isPending}
          >
            {item?.verified ? 'Atualizar' : 'Verificar'}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 lg:p-7 max-w-4xl mx-auto animate-fade-in-up">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={16} /> Voltar
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-foreground truncate">{displayName}</h2>
          <p className="text-xs text-muted-foreground">{email}</p>
        </div>
        <div className="bg-card border border-border rounded-xl px-4 py-2 text-center shrink-0">
          <p className="text-lg font-black text-primary">{totalScore.toFixed(1)}</p>
          <p className="text-[10px] text-muted-foreground">pts totais</p>
        </div>
      </div>

      <div className="flex gap-1 bg-secondary/50 rounded-xl p-1 mb-5 overflow-x-auto">
        {sections.map(s => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${activeSection === s.key ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {React.createElement(s.icon, { size: 13 })} {s.label}
            {sectionPending[s.key] && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500" />
            )}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {activeSection === 'lessons' && (
          <>
            {lessons.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma aula gravada.</p>}
            {lessons.map(lesson => {
              const progress = progresses.find(p => p.lesson_id === lesson.id);
              return (
                <ScoreRow key={lesson.id} category="lesson" ref_id={lesson.id} ref_title={lesson.title} max_score={10}>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${progress?.watched ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                      {progress?.watched ? '✅ Marcada como assistida' : '⏳ Não assistida'}
                    </span>
                    {progress?.comment && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">💬 Comentou</span>}
                    {progress?.summary && <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">📝 Resumo enviado</span>}
                  </div>
                  {progress?.comment && (
                    <div className="mt-1.5 bg-secondary/50 rounded-lg p-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Comentário: </span>{progress.comment}
                    </div>
                  )}
                  {progress?.summary && (
                    <div className="mt-1.5 bg-secondary/50 rounded-lg p-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Resumo: </span>{progress.summary}
                    </div>
                  )}
                </ScoreRow>
              );
            })}
          </>
        )}

        {activeSection === 'lives' && (
          <>
            {liveSessions.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma live registrada.</p>}
            {liveSessions.map(sess => {
              const att = attendances.find(a => a.session_id === sess.id);
              return (
                <ScoreRow key={sess.id} category="live_attendance" ref_id={sess.id} ref_title={sess.title} max_score={5}>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${att ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                      {att ? `✅ Presença confirmada — ${format(new Date(att.confirmed_at || att.created_date), 'dd/MM HH:mm')}` : '❌ Não confirmou presença'}
                    </span>
                  </div>
                </ScoreRow>
              );
            })}
          </>
        )}

        {activeSection === 'tasks' && (
          <>
            {tasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma tarefa/prova criada.</p>}
            {tasks.map(task => {
              const sub = submissions.find(s => s.task_id === task.id);
              return (
                <ScoreRow key={task.id} category={task.type === 'quiz' ? 'quiz' : 'task'} ref_id={task.id} ref_title={task.title} max_score={task.max_grade || 10}>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    <Badge variant="secondary" className="text-[10px]">{task.type === 'quiz' ? 'Prova' : 'Tarefa'}</Badge>
                    {sub ? (
                      <>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">✅ Entregue</span>
                        {sub.file_url && <a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline">📎 Ver arquivo</a>}
                        {sub.comment && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">💬 Com comentário</span>}
                      </>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">❌ Não entregue</span>
                    )}
                    {sub?.grade !== undefined && sub?.grade !== null && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-semibold">Nota prévia: {sub.grade}</span>
                    )}
                  </div>
                  {sub?.comment && (
                    <div className="mt-1.5 bg-secondary/50 rounded-lg p-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Comentário do aluno: </span>{sub.comment}
                    </div>
                  )}
                  {sub?.quiz_answers && task.quiz_questions && (
                    <div className="mt-1.5 space-y-1">
                      {task.quiz_questions.map((q, qi) => (
                        <div key={qi} className="bg-secondary/50 rounded-lg p-2 text-xs">
                          <p className="font-semibold text-foreground">{q.question}</p>
                          {q.answer_type === 'text' ? (
                            <p className="text-muted-foreground mt-0.5">Resposta: {sub.quiz_answers?.[qi]?.text || '—'}</p>
                          ) : (
                            <p className={`mt-0.5 ${sub.quiz_answers?.[qi] === q.correct_index ? 'text-green-600' : 'text-red-500'}`}>
                              Marcou: {q.options?.[sub.quiz_answers?.[qi]]} {sub.quiz_answers?.[qi] === q.correct_index ? '✅' : '❌'}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScoreRow>
              );
            })}
          </>
        )}

        {activeSection === 'forum' && (
          <>
            {forumPosts.length === 0 && forumReplies.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma participação no fórum.</p>
            )}
            {forumPosts.map(post => (
              <ScoreRow key={post.id} category="forum" ref_id={post.id} ref_title={`Pergunta no Fórum: ${post.content?.slice(0, 60)}...`} max_score={0.1}>
                <div className="mt-1.5 bg-secondary/50 rounded-lg p-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Publicação: </span>{post.content}
                </div>
              </ScoreRow>
            ))}
            {forumReplies.map(reply => (
              <ScoreRow key={reply.id} category="forum" ref_id={reply.id} ref_title="Resposta no Fórum" max_score={1}>
                <div className="mt-1.5 bg-secondary/50 rounded-lg p-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Resposta: </span>{reply.content}
                </div>
              </ScoreRow>
            ))}
          </>
        )}

        {activeSection === 'therapist' && (
          <>
            {myPairings.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma participação em Terapeuta da Semana.</p>
            )}
            {myPairings.map((p, i) => {
              const role = p.therapist_email === email ? 'Terapeuta' : 'Paciente';
              const partner = p.therapist_email === email ? p.patient_name || p.patient_email : p.therapist_name || p.therapist_email;
              const submitted = p.therapist_email === email ? p.therapist_submitted : p.patient_submitted;
              const partnerScore = p.therapist_email === email ? p.therapist_score : p.patient_score;
              const comment = p.therapist_email === email ? p.therapist_comment : p.patient_comment;
              return (
                <ScoreRow key={p.id} category="therapist" ref_id={p.id} ref_title={`Sessão ${i + 1} — ${role} de ${partner}`} max_score={10}>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${role === 'Terapeuta' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>{role}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${submitted ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                      {submitted ? '✅ Avaliação enviada' : '⏳ Sem avaliação'}
                    </span>
                    {partnerScore !== undefined && partnerScore !== null && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-semibold">Nota do par: {partnerScore}/10</span>
                    )}
                  </div>
                  {comment && (
                    <div className="mt-1.5 bg-secondary/50 rounded-lg p-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Relato: </span>{comment}
                    </div>
                  )}
                </ScoreRow>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

export default function ScoreControl() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [selectedCode, setSelectedCode] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('pending');
  const [filterCourse, setFilterCourse] = useState('all');
  const [retroLoading, setRetroLoading] = useState(false);

  const { data: codes = [], isLoading } = useQuery({
    queryKey: ['access-codes'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 200),
  });

  const { data: scoreItems = [] } = useQuery({
    queryKey: ['score-items-all'],
    queryFn: () => base44.entities.ScoreItem.list('-created_date', 2000),
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['all-submissions'],
    queryFn: () => base44.entities.TaskSubmission.list('-created_date', 500),
  });

  useEffect(() => {
    if (!location.search.includes('filter=pending')) return;
    if (selectedCode || codes.length === 0 || submissions.length === 0) return;
    const firstPending = codes.find(code =>
      submissions.some(s =>
        s.status === 'submitted' &&
        s.student_email === code.student_email &&
        !scoreItems.find(si => si.ref_id === s.task_id && si.student_email === code.student_email && si.verified)
      )
    );
    if (firstPending) setSelectedCode(firstPending);
  }, [codes, submissions, scoreItems, location.search]);

  const handleRetro = async () => {
    setRetroLoading(true);
    try {
      const res = await base44.functions.invoke('retroForumScores', {});
      await queryClient.invalidateQueries({ queryKey: ['score-items-all'] });
      toast.success(`Retroativo concluído! ${res.data?.created || 0} pontuações criadas.`);
    } catch (e) {
      toast.error('Erro: ' + (e?.message || 'tente novamente'));
    } finally {
      setRetroLoading(false);
    }
  };

  if (selectedCode) return <StudentScoreDetail code={selectedCode} onBack={() => setSelectedCode(null)} />;

  const COURSE_LABELS = { all: 'Todos os Cursos', tcc: 'TCC', psicanalise: 'Psicanálise', sexologia: 'Sexologia' };

  const filtered = codes.filter(c => {
    const matchSearch = !search ||
      (c.student_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.profile_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.student_email || '').toLowerCase().includes(search.toLowerCase());
    const matchCourse = filterCourse === 'all' || c.course === filterCourse;
    return matchSearch && matchCourse;
  });

  const pendingCount = submissions.filter(s => s.status === 'submitted' && !scoreItems.find(si => si.ref_id === s.task_id && si.student_email === s.student_email && si.verified)).length;

  return (
    <div className="p-4 lg:p-7 max-w-4xl mx-auto animate-fade-in-up">
      <div className="mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
            <Trophy size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl lg:text-2xl font-bold text-foreground">Controle de Pontuação</h2>
            <p className="text-muted-foreground text-sm mt-0.5">Verifique e pontue as atividades de cada aluno</p>
          </div>
        </div>
        {pendingCount > 0 && (
          <div className="mt-3 bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center gap-2">
            <Clock size={14} className="text-orange-500 shrink-0" />
            <p className="text-xs text-orange-800 font-semibold">{pendingCount} atividade(s) aguardando verificação e pontuação</p>
          </div>
        )}
        <div className="mt-3 flex justify-end">
          <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={handleRetro} disabled={retroLoading}>
            <RefreshCw size={13} className={retroLoading ? 'animate-spin' : ''} />
            {retroLoading ? 'Aplicando...' : 'Aplicar Pontos Retroativos do Fórum'}
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar aluno..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {Object.entries(COURSE_LABELS).map(([val, label]) => (
            <button key={val} onClick={() => setFilterCourse(val)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${filterCourse === val ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <ArrowUpDown size={13} className="text-muted-foreground" />
          {[['alpha','A–Z'],['points','Pontos'],['participations','Participações'],['pending','Pendências']].map(([val, label]) => (
            <button key={val} onClick={() => setSortBy(val)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${sortBy === val ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-2xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-semibold">Nenhum aluno encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered
            .map(code => {
              const hasPending = submissions.some(s =>
                s.status === 'submitted' &&
                s.student_email === code.student_email &&
                !scoreItems.find(si => si.ref_id === s.task_id && si.student_email === code.student_email && si.verified)
              );
              const studentScores = scoreItems.filter(s => s.student_email === code.student_email);
              const total = studentScores.filter(s => s.verified).reduce((sum, s) => sum + (s.score || 0), 0);
              const participations = studentScores.length;
              return { code, hasPending, total, participations };
            })
            .sort((a, b) => {
              if (sortBy === 'alpha') return (a.code.profile_name || a.code.student_name || '').localeCompare(b.code.profile_name || b.code.student_name || '');
              if (sortBy === 'points') return b.total - a.total;
              if (sortBy === 'participations') return b.participations - a.participations;
              return (b.hasPending ? 1 : 0) - (a.hasPending ? 1 : 0);
            })
            .map(({ code, hasPending, total, participations }) => {
              const displayName = code.profile_name || code.student_name || 'Sem nome';
              return (
                <div
                  key={code.id}
                  onClick={() => setSelectedCode(code)}
                  className={`bg-card rounded-2xl border p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all ${hasPending ? 'border-red-300 hover:border-red-400' : 'border-border hover:border-primary/30'}`}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0"
                    style={{ backgroundColor: code.profile_avatar_color || '#5b5ef4' }}
                  >
                    {displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-sm text-foreground truncate">{displayName}</p>
                      {hasPending && <AlertCircle size={14} className="text-red-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{code.student_email || '—'}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1 bg-blue-50 border border-blue-200 px-2.5 py-1.5 rounded-xl" title="Participações">
                      <Activity size={11} className="text-blue-500" />
                      <span className="text-xs font-bold text-blue-700">{participations}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-xl">
                      <Star size={11} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-black text-yellow-700">{total.toFixed(1)}</span>
                    </div>
                    <ChevronLeft size={14} className="text-muted-foreground rotate-180" />
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}