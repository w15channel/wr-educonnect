import React, { useState, useEffect } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { adminApi } from '@/lib/adminApi';
import useCourseFilteredEmails from '@/hooks/useCourseFilteredEmails';
import ScoreRow from '@/components/scores/ScoreRow';
import { Trophy, ChevronLeft, Clock, BookOpen, Video, FileText, MessageSquare, Star, Users, Search, AlertCircle, Heart, ArrowUpDown, Activity, GraduationCap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { formatScore, roundScore } from '@/lib/scoreUtils';
import { sortBySequence } from '@/lib/sequenceUtils';

const CATEGORY_CONFIG = {
  lesson: { label: 'Aula Gravada', icon: BookOpen, color: 'bg-purple-100 text-purple-700' },
  live_attendance: { label: 'Presença Live', icon: Video, color: 'bg-red-100 text-red-700' },
  task: { label: 'Tarefa', icon: FileText, color: 'bg-orange-100 text-orange-700' },
  quiz: { label: 'Prova', icon: Trophy, color: 'bg-blue-100 text-blue-700' },
  exam: { label: 'Prova do Módulo', icon: GraduationCap, color: 'bg-indigo-100 text-indigo-700' },
  forum: { label: 'Fórum', icon: MessageSquare, color: 'bg-green-100 text-green-700' },
  therapist: { label: 'Terapeuta da Semana', icon: Heart, color: 'bg-pink-100 text-pink-700' }
};

function StudentScoreDetail({ code, onBack, activeCourse, courseEmails, isTeacher }) {
  const queryClient = useQueryClient();
  const email = code.student_email || '';
  const displayName = code.profile_name || code.student_name || 'Sem nome';

  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons-score-detail', activeCourse],
    queryFn: () => base44.entities.RecordedLesson.filter({ course: activeCourse }, 'order', 100)
  });
  const { data: progresses = [] } = useQuery({ queryKey: ['lesson-progress', email], queryFn: () => base44.entities.LessonProgress.filter({ student_email: email }, '-created_date', 200) });
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-score-detail', activeCourse],
    queryFn: () => base44.entities.Task.filter({ course: activeCourse }, '-created_date', 100)
  });
  const { data: submissions = [] } = useQuery({ queryKey: ['submissions-student', email], queryFn: () => base44.entities.TaskSubmission.filter({ student_email: email }, '-created_date', 200) });
  const { data: examSubs = [] } = useQuery({ queryKey: ['exam-subs-student', email], queryFn: () => base44.entities.ExamSubmission.filter({ student_email: email, course: activeCourse }, '-submitted_at', 200) });
  const { data: exams = [] } = useQuery({ queryKey: ['exams-score-detail', activeCourse], queryFn: () => base44.entities.Exam.filter({ course: activeCourse }, '-created_date', 100) });
  const { data: attendances = [] } = useQuery({ queryKey: ['attendances', email], queryFn: () => base44.entities.LiveAttendance.filter({ student_email: email }, '-created_date', 100) });
  const { data: liveSessions = [] } = useQuery({
    queryKey: ['live-sessions-score-detail', activeCourse],
    queryFn: () => base44.entities.LiveSession.filter({ course: activeCourse }, '-scheduled_at', 50)
  });
  const { data: forumPosts = [] } = useQuery({
    queryKey: ['forum-posts-score-detail', email, activeCourse],
    queryFn: () => base44.entities.ForumPost.filter({ course: activeCourse }, '-created_date', 500)
  });
  const { data: forumReplies = [] } = useQuery({ queryKey: ['forum-replies', email], queryFn: () => base44.entities.ForumReply.filter({ author_email: email }, '-created_date', 100) });
  const { data: scoreItems = [] } = useQuery({ queryKey: ['score-items', email], queryFn: () => base44.entities.ScoreItem.filter({ student_email: email }, '-created_date', 500) });
  const { data: pairings = [] } = useQuery({ queryKey: ['therapist-pairings-score', email], queryFn: () => base44.entities.TherapistPairing.list('-pairing_date', 200) });
  const { data: studentProfiles = [] } = useQuery({
    queryKey: ['student-profile-score', email],
    queryFn: () => base44.entities.StudentProfile.filter({ student_email: email, dashboard_course: activeCourse }, '-updated_date', 1)
  });

  const [activeSection, setActiveSection] = useState('lessons');

  const updateScoreMutation = useMutation({
    mutationFn: async ({ category, ref_id, ref_title, score, max_score, notes: itemNotes }) => {
      const existing = scoreItems.find((s) => s.category === category && s.ref_id === ref_id);
      const data = { student_email: email, category, ref_id, ref_title, score: roundScore(String(score).replace(',', '.')), max_score: roundScore(max_score), verified: true, notes: itemNotes || '' };
      if (existing) return adminApi.update('ScoreItem', existing.id, data);
      return adminApi.create('ScoreItem', data);
    },
    onMutate: async ({ category, ref_id, ref_title, score, max_score, notes: itemNotes }) => {
      await queryClient.cancelQueries({ queryKey: ['score-items', email] });
      const previous = queryClient.getQueryData(['score-items', email]);
      queryClient.setQueryData(['score-items', email], (old = []) => {
        const existing = old.find((s) => s.category === category && s.ref_id === ref_id);
        const updated = { student_email: email, category, ref_id, ref_title, score: Number(score), max_score, verified: true, notes: itemNotes || '', id: existing?.id || `optimistic_${ref_id}` };
        if (existing) return old.map((s) => s.category === category && s.ref_id === ref_id ? updated : s);
        return [...old, updated];
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['score-items', email], ctx.previous);
      toast.error('Erro ao salvar pontuação.');
    },
    onSuccess: async () => {
      await base44.functions.invoke('populateScoreCache', { student_email: email });
      queryClient.invalidateQueries({ queryKey: ['score-items', email] });
      queryClient.invalidateQueries({ queryKey: ['score-items-all'] });
      queryClient.invalidateQueries({ queryKey: ['access-codes'] });
      queryClient.invalidateQueries({ queryKey: ['student-profiles-score-overview'] });
      toast.success('Pontuação salva e cache atualizado!');
    }
  });

  const getScoreItem = (category, ref_id) => scoreItems.find((s) => s.category === category && s.ref_id === ref_id);

  const isPairingFromActiveCourse = (pairing) => {
    if (!courseEmails || courseEmails.size === 0) return true;
    return courseEmails.has(pairing.therapist_email || '') && courseEmails.has(pairing.patient_email || '');
  };

  const myPairings = pairings.filter((p) =>
  (p.therapist_email === email || p.patient_email === email) && isPairingFromActiveCourse(p)
  );

  const lessonIds = new Set(lessons.map((l) => l.id));
  const taskIds = new Set(tasks.map((t) => t.id));
  const examIds = new Set(exams.map((e) => e.id));
  const liveSessionIds = new Set(liveSessions.map((l) => l.id));
  const studentForumPosts = forumPosts.filter((p) => p.author_email === email);
  const forumPostIds = new Set(studentForumPosts.map((p) => p.id));
  const forumParentById = new Map(forumPosts.map((p) => [p.id, p]));
  const scorableForumReplies = forumReplies.filter((r) => {
    const parentPost = forumParentById.get(r.post_id);
    return parentPost && parentPost.author_email !== email;
  });
  const forumReplyIds = new Set(scorableForumReplies.map((r) => r.id));
  const sequencedLessons = sortBySequence(lessons);
  const sequencedTasks = sortBySequence(tasks);
  const sequencedLiveSessions = sortBySequence(liveSessions);
  const sequencedForumPosts = sortBySequence(studentForumPosts);
  const sequencedForumReplies = sortBySequence(scorableForumReplies);
  const sequencedPairings = sortBySequence(myPairings);

  const totalScore = scoreItems.
  filter((s) => s.verified && (
  s.category === 'lesson' && lessonIds.has(s.ref_id) ||
  s.category === 'live_attendance' && liveSessionIds.has(s.ref_id) ||
  (s.category === 'task' || s.category === 'quiz') && taskIds.has(s.ref_id) ||
  s.category === 'exam' && examIds.has(s.ref_id) ||
  s.category === 'forum' && (forumPostIds.has(s.ref_id) || forumReplyIds.has(s.ref_id)) ||
  s.category === 'therapist' && myPairings.some((p) => p.id === s.ref_id))
  ).
  reduce((sum, s) => sum + (Number(s.score) || 0), 0);

  const sendTotalMutation = useMutation({
    mutationFn: async () => {
      const profile = studentProfiles[0];
      const data = { student_email: email, full_name: displayName, points: roundScore(totalScore), pontuacao_total: roundScore(totalScore), dashboard_course: activeCourse };
      if (profile) return adminApi.update('StudentProfile', profile.id, data);
      return adminApi.create('StudentProfile', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-profile-score', email] });
      queryClient.invalidateQueries({ queryKey: ['student-profiles-score-overview'] });
      toast.success('Pontuação enviada para o controle e Dashboard!');
    }
  });

  const sections = [
  { key: 'lessons', label: 'Aulas', icon: BookOpen },
  { key: 'lives', label: 'Presenças', icon: Video },
  { key: 'tasks', label: 'Tarefas', icon: FileText },
  { key: 'exams', label: 'Provas', icon: GraduationCap },
  { key: 'forum', label: 'Fórum', icon: MessageSquare },
  { key: 'therapist', label: 'Terapeutas', icon: Heart }];


  const sectionPending = {
    lessons: sequencedLessons.some((l) => {
      const p = progresses.find((pr) => pr.lesson_id === l.id);
      return p && (p.watched || p.comment || p.summary) && !scoreItems.find((s) => s.category === 'lesson' && s.ref_id === l.id && s.verified);
    }),
    lives: sequencedLiveSessions.some((sess) => {
      const att = attendances.find((a) => a.session_id === sess.id);
      return att && !scoreItems.find((s) => s.category === 'live_attendance' && s.ref_id === sess.id && s.verified);
    }),
    tasks: sequencedTasks.some((task) => {
      const sub = submissions.find((s) => s.task_id === task.id);
      return sub && !scoreItems.find((s) => (s.category === 'task' || s.category === 'quiz') && s.ref_id === task.id && s.verified);
    }),
    exams: examSubs.some((sub) => sub.status === 'submitted' && !scoreItems.find((s) => s.category === 'exam' && s.ref_id === exams.find(e => e.id === sub.exam_id)?.id && s.verified)),
    forum: [...studentForumPosts, ...scorableForumReplies].some((item) =>
    !scoreItems.find((s) => s.category === 'forum' && s.ref_id === item.id && s.verified)
    ),
    therapist: sequencedPairings.some((p) =>
    !scoreItems.find((s) => s.category === 'therapist' && s.ref_id === p.id && s.verified)
    )
  };

  const uncorrectedTaskIds = new Set(
    submissions.
    filter((s) => s.status === 'submitted' && !scoreItems.find((si) => si.ref_id === s.task_id && si.student_email === email && si.verified)).
    map((s) => s.task_id)
  );


  return (
    <div className="w-full max-w-[860px] mx-auto p-3 md:p-5 animate-fade-in-up overflow-x-hidden">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={16} /> Voltar
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-foreground truncate">{displayName}</h2>
          <p className="text-xs text-muted-foreground">{email}</p>
        </div>
        
      </div>

      <div className="flex gap-1 bg-secondary/50 rounded-xl p-1 mb-5 overflow-x-auto">
        {sections.map((s) =>
        <button
          key={s.key}
          onClick={() => setActiveSection(s.key)}
          className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${activeSection === s.key ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
          
            {React.createElement(s.icon, { size: 13 })} {s.label}
            {sectionPending[s.key] &&
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500" />
          }
          </button>
        )}
      </div>

      <div className="space-y-3">
        {activeSection === 'lessons' &&
        <>
            {sequencedLessons.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma aula gravada.</p>}
            {sequencedLessons.map((lesson) => {
            const progress = progresses.find((p) => p.lesson_id === lesson.id);
            return (
              <ScoreRow
                key={lesson.id}
                category="lesson"
                icon={CATEGORY_CONFIG.lesson.icon}
                refId={lesson.id}
                refTitle={lesson.title}
                maxScore={10}
                item={getScoreItem('lesson', lesson.id)}
                onSave={(data) => updateScoreMutation.mutate(data)}
                saving={updateScoreMutation.isPending}
                readOnly={!isTeacher}>
                
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${progress?.watched ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                      {progress?.watched ? '✅ Marcada como assistida' : '⏳ Não assistida'}
                    </span>
                    {progress?.comment && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">💬 Comentou</span>}
                    {progress?.summary && <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">📝 Resumo enviado</span>}
                  </div>
                  {progress?.comment &&
                <div className="mt-1.5 bg-secondary/50 rounded-lg p-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Comentário: </span>{progress.comment}
                    </div>
                }
                  {progress?.summary &&
                <div className="mt-1.5 bg-secondary/50 rounded-lg p-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Resumo: </span>{progress.summary}
                    </div>
                }
                </ScoreRow>);

          })}
          </>
        }

        {activeSection === 'lives' &&
        <>
            {sequencedLiveSessions.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma live registrada.</p>}
            {sequencedLiveSessions.map((sess) => {
            const att = attendances.find((a) => a.session_id === sess.id);
            return (
              <ScoreRow
                key={sess.id}
                category="live_attendance"
                icon={CATEGORY_CONFIG.live_attendance.icon}
                refId={sess.id}
                refTitle={sess.title}
                maxScore={1}
                item={getScoreItem('live_attendance', sess.id)}
                onSave={(data) => updateScoreMutation.mutate(data)}
                saving={updateScoreMutation.isPending}
                readOnly={!isTeacher}>
                
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${att ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                      {att ? `✅ Presença confirmada — ${format(new Date(att.confirmed_at || att.created_date), 'dd/MM HH:mm')}` : '❌ Não confirmou presença'}
                    </span>
                  </div>
                </ScoreRow>);

          })}
          </>
        }

        {activeSection === 'tasks' &&
        <>
            {sequencedTasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma tarefa/prova criada.</p>}
            {sequencedTasks.map((task) => {
            const sub = submissions.find((s) => s.task_id === task.id);
            return (
              <ScoreRow
                key={task.id}
                category={task.type === 'quiz' ? 'quiz' : 'task'}
                icon={task.type === 'quiz' ? CATEGORY_CONFIG.quiz.icon : CATEGORY_CONFIG.task.icon}
                refId={task.id}
                refTitle={task.title}
                maxScore={task.max_grade || 10}
                item={getScoreItem(task.type === 'quiz' ? 'quiz' : 'task', task.id)}
                needsCorrection={uncorrectedTaskIds.has(task.id)}
                onSave={(data) => updateScoreMutation.mutate(data)}
                saving={updateScoreMutation.isPending}
                readOnly={!isTeacher}>
                
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    <Badge variant="secondary" className="text-[10px]">{task.type === 'quiz' ? 'Prova' : 'Tarefa'}</Badge>
                    {sub ?
                  <>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">✅ Entregue</span>
                        {sub.file_url && <a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline">📎 Ver arquivo</a>}
                        {sub.comment && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">💬 Com comentário</span>}
                      </> :

                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">❌ Não entregue</span>
                  }
                    {sub?.grade !== undefined && sub?.grade !== null &&
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-semibold">Nota prévia: {formatScore(sub.grade)}</span>
                  }
                  </div>
                  {sub?.comment &&
                <div className="mt-1.5 bg-secondary/50 rounded-lg p-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Comentário do aluno: </span>{sub.comment}
                    </div>
                }
                  {sub?.quiz_answers && task.quiz_questions &&
                <div className="mt-1.5 space-y-1">
                      {task.quiz_questions.map((q, qi) =>
                  <div key={qi} className="bg-secondary/50 rounded-lg p-2 text-xs">
                          <p className="font-semibold text-foreground">{q.question}</p>
                          {q.answer_type === 'text' ?
                    <p className="text-muted-foreground mt-0.5">Resposta: {sub.quiz_answers?.[qi]?.text || '—'}</p> :

                    <p className={`mt-0.5 ${sub.quiz_answers?.[qi] === q.correct_index ? 'text-green-600' : 'text-red-500'}`}>
                              Marcou: {q.options?.[sub.quiz_answers?.[qi]]} {sub.quiz_answers?.[qi] === q.correct_index ? '✅' : '❌'}
                            </p>
                    }
                        </div>
                  )}
                    </div>
                }
                </ScoreRow>);

          })}
          </>
        }

        {activeSection === 'exams' &&
        <>
            {exams.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma prova do módulo criada.</p>}
            {exams.map((exam) => {
            const sub = examSubs.find((s) => s.exam_id === exam.id);
            const scoreItem = getScoreItem('exam', exam.id);
            return (
              <ScoreRow
                key={exam.id}
                category="exam"
                icon={CATEGORY_CONFIG.exam.icon}
                refId={exam.id}
                refTitle={exam.title}
                maxScore={exam.max_grade || 10}
                item={scoreItem}
                needsCorrection={sub && sub.status === 'submitted' && !scoreItem}
                onSave={(data) => updateScoreMutation.mutate(data)}
                saving={updateScoreMutation.isPending}
                readOnly={!isTeacher}>
                
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    <Badge variant="secondary" className="text-[10px] bg-indigo-100 text-indigo-700">Prova do Módulo</Badge>
                    {exam.module_ref && <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">{exam.module_ref}</span>}
                    {sub ?
                  <>
                        {sub.status === 'graded' ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">✅ Corrigida</span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">⏳ Aguardando correção</span>
                        )}
                        {sub.grade != null && <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-semibold">Nota: {formatScore(sub.grade)}</span>}
                      </> :

                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">❌ Não realizada</span>
                  }
                  </div>
                  {sub?.feedback &&
                <div className="mt-1.5 bg-secondary/50 rounded-lg p-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Feedback: </span>{sub.feedback}
                    </div>
                }
                </ScoreRow>);

          })}
          </>
        }

        {activeSection === 'forum' &&
        <>
            {studentForumPosts.length === 0 && scorableForumReplies.length === 0 &&
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma participação no fórum.</p>
          }
            {sequencedForumPosts.map((post) =>
          <ScoreRow
            key={post.id}
            category="forum"
            icon={CATEGORY_CONFIG.forum.icon}
            refId={post.id}
            refTitle={`Pergunta no Fórum: ${post.content?.slice(0, 60)}...`}
            maxScore={0.1}
            item={getScoreItem('forum', post.id)}
            onSave={(data) => updateScoreMutation.mutate(data)}
            saving={updateScoreMutation.isPending}
            readOnly={!isTeacher}>
            
                <div className="mt-1.5 bg-secondary/50 rounded-lg p-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Publicação: </span>{post.content}
                </div>
              </ScoreRow>
          )}
            {sequencedForumReplies.map((reply) =>
          <ScoreRow
            key={reply.id}
            category="forum"
            icon={CATEGORY_CONFIG.forum.icon}
            refId={reply.id}
            refTitle="Resposta em pergunta de colega"
            maxScore={0.5}
            item={getScoreItem('forum', reply.id)}
            onSave={(data) => updateScoreMutation.mutate(data)}
            saving={updateScoreMutation.isPending}
            readOnly={!isTeacher}>
            
                <div className="mt-1.5 bg-secondary/50 rounded-lg p-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Resposta: </span>{reply.content}
                </div>
              </ScoreRow>
          )}
          </>
        }

        {activeSection === 'therapist' &&
        <>
            {myPairings.length === 0 &&
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma participação em Terapeuta da Semana.</p>
          }
            {sequencedPairings.map((p, i) => {
            const role = p.therapist_email === email ? 'Terapeuta' : 'Paciente';
            const partner = p.therapist_email === email ? p.patient_name || p.patient_email : p.therapist_name || p.therapist_email;
            const submitted = p.therapist_email === email ? p.therapist_submitted : p.patient_submitted;
            const partnerScore = p.therapist_email === email ? p.therapist_score : p.patient_score;
            const comment = p.therapist_email === email ? p.therapist_comment : p.patient_comment;
            return (
              <ScoreRow
                key={p.id}
                category="therapist"
                icon={CATEGORY_CONFIG.therapist.icon}
                refId={p.id}
                refTitle={`Sessão ${i + 1} — ${role} de ${partner}`}
                maxScore={10}
                item={getScoreItem('therapist', p.id)}
                onSave={(data) => updateScoreMutation.mutate(data)}
                saving={updateScoreMutation.isPending}
                readOnly={!isTeacher}>
                
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${role === 'Terapeuta' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>{role}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${submitted ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                      {submitted ? '✅ Avaliação enviada' : '⏳ Sem avaliação'}
                    </span>
                    {partnerScore !== undefined && partnerScore !== null &&
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-semibold">Nota do par: {formatScore(partnerScore)}/10,000</span>
                  }
                  </div>
                  {comment &&
                <div className="mt-1.5 bg-secondary/50 rounded-lg p-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Relato: </span>{comment}
                    </div>
                }
                </ScoreRow>);

          })}
          </>
        }
      </div>
    </div>);

}

export default function ScoreControl() {
  const location = useLocation();
  const { user: session } = useOutletContext() || {};
  const queryClient = useQueryClient();
  const [selectedCode, setSelectedCode] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('points');
  const [retroLoading, setRetroLoading] = useState(false);
  const [draggedEmail, setDraggedEmail] = useState(null);
  const [customOrder, setCustomOrder] = useState([]);
  const { emails: courseEmails, course: routeCourse, codePrefix } = useCourseFilteredEmails();
  const activeCourse = routeCourse || session?.course || 'tcc';
  const isTeacher = session?.role === 'admin';

  const { data: codes = [], isLoading } = useQuery({
    queryKey: ['access-codes'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 200)
  });

  const { data: scoreItems = [] } = useQuery({
    queryKey: ['score-items-all'],
    queryFn: () => base44.entities.ScoreItem.list('-created_date', 10000)
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['all-submissions'],
    queryFn: () => base44.entities.TaskSubmission.list('-created_date', 1000)
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons-score-overview', activeCourse],
    queryFn: () => base44.entities.RecordedLesson.filter({ course: activeCourse }, 'order', 500)
  });

  const { data: lessonProgresses = [] } = useQuery({
    queryKey: ['lesson-progress-score-overview'],
    queryFn: () => base44.entities.LessonProgress.list('-created_date', 3000)
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-score-overview', activeCourse],
    queryFn: () => base44.entities.Task.filter({ course: activeCourse }, '-created_date', 500)
  });

  const { data: liveSessions = [] } = useQuery({
    queryKey: ['live-sessions-score-overview', activeCourse],
    queryFn: () => base44.entities.LiveSession.filter({ course: activeCourse }, '-scheduled_at', 500)
  });

  const { data: attendances = [] } = useQuery({
    queryKey: ['live-attendances-score-overview'],
    queryFn: () => base44.entities.LiveAttendance.list('-created_date', 3000)
  });

  const { data: forumPosts = [] } = useQuery({
    queryKey: ['forum-posts-score-overview', activeCourse],
    queryFn: () => base44.entities.ForumPost.filter({ course: activeCourse }, '-created_date', 2000)
  });

  const { data: forumReplies = [] } = useQuery({
    queryKey: ['forum-replies-score-overview'],
    queryFn: () => base44.entities.ForumReply.list('-created_date', 3000)
  });

  const { data: monitorHistory = [] } = useQuery({
    queryKey: ['monitor-history-score-overview', activeCourse],
    queryFn: () => base44.entities.MonitorHistory.filter({ course: activeCourse }, '-period_start', 500)
  });

  const { data: therapistPairings = [] } = useQuery({
    queryKey: ['therapist-pairings-score-overview'],
    queryFn: () => base44.entities.TherapistPairing.list('-pairing_date', 500)
  });

  const { data: studentProfiles = [] } = useQuery({
    queryKey: ['student-profiles-score-overview'],
    queryFn: () => base44.entities.StudentProfile.list('-updated_date', 10000)
  });

  useEffect(() => {
    if (!location.search.includes('filter=pending')) return;
    if (selectedCode || codes.length === 0 || submissions.length === 0) return;
    const firstPending = codes.find((code) =>
    submissions.some((s) =>
    s.status === 'submitted' &&
    s.student_email === code.student_email &&
    !scoreItems.find((si) => si.ref_id === s.task_id && si.student_email === code.student_email && si.verified)
    )
    );
    if (firstPending) setSelectedCode(firstPending);
  }, [codes, submissions, scoreItems, location.search]);

  const handleRetro = async () => {
    setRetroLoading(true);
    try {
      const res = await base44.functions.invoke('recalculateScores', {});
      await queryClient.invalidateQueries();
      toast.success(`Pontuação recalculada! ${res.data?.createdScores || 0} itens criados e ${res.data?.updatedScores || 0} atualizados.`);
    } catch (e) {
      toast.error('Erro: ' + (e?.message || 'tente novamente'));
    } finally {
      setRetroLoading(false);
    }
  };

  const filtered = codes.filter((c) => {
    if (codePrefix && !(c.code || '').startsWith(codePrefix)) return false;
    if (courseEmails && !courseEmails.has(c.student_email || '')) return false;
    const matchSearch = !search ||
    (c.student_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.profile_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.student_email || '').toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const lessonIds = new Set(lessons.map((l) => l.id));
  const taskIds = new Set(tasks.map((t) => t.id));
  const liveSessionIds = new Set(liveSessions.map((l) => l.id));
  const forumPostIds = new Set(forumPosts.map((p) => p.id));
  const allowedEmails = new Set(filtered.map((c) => c.student_email).filter(Boolean));
  const courseSubmissions = submissions.filter((s) => allowedEmails.has(s.student_email) && taskIds.has(s.task_id));
  const pendingCount = courseSubmissions.filter((s) => s.status === 'submitted' && !scoreItems.find((si) => si.ref_id === s.task_id && si.student_email === s.student_email && si.verified)).length;

  const coursePairingIds = new Set(
    therapistPairings.
    filter((p) => !courseEmails || courseEmails.size === 0 || courseEmails.has(p.therapist_email || '') && courseEmails.has(p.patient_email || '')).
    map((p) => p.id)
  );

  const getCourseScoreTotal = (email) => {
    const studentSpecificForumPosts = forumPosts.filter(
      (p) => p.author_email === email && p.course === activeCourse
    );
    const studentForumPostIds = new Set(studentSpecificForumPosts.map((p) => p.id));
    const forumParentById = new Map(forumPosts.map((p) => [p.id, p]));

    const studentSpecificForumReplies = forumReplies.filter((r) => r.author_email === email);
    const studentForumReplyIds = new Set(
      studentSpecificForumReplies.
      filter((r) => {
        const parentPost = forumParentById.get(r.post_id);
        return parentPost && parentPost.course === activeCourse && parentPost.author_email !== email;
      }).
      map((r) => r.id)
    );

    return scoreItems.
    filter((s) => s.student_email === email && s.verified && (
    s.category === 'lesson' && lessonIds.has(s.ref_id) ||
    s.category === 'live_attendance' && liveSessionIds.has(s.ref_id) ||
    (s.category === 'task' || s.category === 'quiz') && taskIds.has(s.ref_id) ||
    s.category === 'forum' && (studentForumPostIds.has(s.ref_id) || studentForumReplyIds.has(s.ref_id)) ||
    s.category === 'therapist' && coursePairingIds.has(s.ref_id))
    ).
    reduce((sum, s) => sum + (Number(s.score) || 0), 0);
  };

  const getParticipationStats = (email) => {
    const lessonCount = lessonProgresses.filter((p) => p.student_email === email && lessonIds.has(p.lesson_id) && p.watched).length;
    const liveCount = attendances.filter((a) => a.student_email === email && liveSessionIds.has(a.session_id)).length;
    const taskCount = submissions.filter((s) => s.student_email === email && taskIds.has(s.task_id)).length;
    const postCount = forumPosts.filter((p) => p.author_email === email && forumPostIds.has(p.id)).length;
    const forumParentById = new Map(forumPosts.map((p) => [p.id, p]));
    const replyCount = forumReplies.filter((r) => {
      const parentPost = forumParentById.get(r.post_id);
      return r.author_email === email && parentPost && parentPost.author_email !== email && forumPostIds.has(parentPost.id);
    }).length;
    const monitorCount = monitorHistory.filter((m) => m.student_email === email).length;
    const count = lessonCount + liveCount + taskCount + postCount + replyCount + monitorCount;
    return { count };
  };

  const sortedRows = filtered.
  map((code) => {
    const hasPending = courseSubmissions.some((s) =>
    s.status === 'submitted' &&
    s.student_email === code.student_email &&
    !scoreItems.find((si) => si.ref_id === s.task_id && si.student_email === code.student_email && si.verified)
    );
    const stats = getParticipationStats(code.student_email);
    const savedProfile = studentProfiles.find((p) => p.student_email === code.student_email && p.dashboard_course === activeCourse && typeof p.points === 'number');
    const totalScore = roundScore(code.pontuacao_total ?? savedProfile?.pontuacao_total ?? savedProfile?.points ?? 0);
    const participations = stats.count;
    return { code, hasPending, totalScore, participations };
  }).
  sort((a, b) => {
    if (sortBy === 'alpha') return (a.code.profile_name || a.code.student_name || '').localeCompare(b.code.profile_name || b.code.student_name || '');
    if (sortBy === 'points') return b.totalScore - a.totalScore;
    if (sortBy === 'participations') return b.participations - a.participations;
    return (b.hasPending ? 1 : 0) - (a.hasPending ? 1 : 0);
  });

  useEffect(() => {
    setCustomOrder(sortedRows);
  }, [sortedRows.map((r) => r.code.student_email).join('|')]);

  const sendRankingToDashboardMutation = useMutation({
    mutationFn: async () => {
      const rankedStudents = customOrder.length ? customOrder : sortedRows;

      for (const [index, item] of rankedStudents.entries()) {
        const code = item.code;
        const existing = studentProfiles.find((p) => p.student_email === code.student_email && p.dashboard_course === activeCourse);
        const data = {
          student_email: code.student_email,
          full_name: code.profile_name || code.student_name || code.student_email,
          points: roundScore(item.totalScore),
          pontuacao_total: roundScore(item.totalScore),
          dashboard_rank: index + 1,
          dashboard_course: activeCourse
        };
        if (existing) await adminApi.update('StudentProfile', existing.id, data);
        else await adminApi.create('StudentProfile', data);
      }
      return rankedStudents.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['student-profiles-score-overview'] });
      toast.success(`${count} pontuações enviadas para a Dashboard!`);
    }
  });

  const saveOrderMutation = useMutation({
    mutationFn: async () => {
      for (const [index, item] of customOrder.entries()) {
        const code = item.code;
        const existing = studentProfiles.find((p) => p.student_email === code.student_email && p.dashboard_course === activeCourse);
        const data = {
          student_email: code.student_email,
          full_name: code.profile_name || code.student_name || code.student_email,
          points: roundScore(item.totalScore),
          pontuacao_total: roundScore(item.totalScore),
          dashboard_rank: index + 1,
          dashboard_course: activeCourse
        };
        if (existing) await adminApi.update('StudentProfile', existing.id, data);
        else await adminApi.create('StudentProfile', data);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['student-profiles-score-overview'] });
      toast.success('Sequência salva com sucesso!');
    }
  });

  if (selectedCode && (isTeacher || selectedCode.student_email === session?.email)) return <StudentScoreDetail code={selectedCode} activeCourse={activeCourse} courseEmails={courseEmails} isTeacher={isTeacher} onBack={() => setSelectedCode(null)} />;

  const sortOptions = isTeacher ?
  [['alpha', 'A–Z'], ['points', 'Classificação'], ['participations', 'Participações'], ['pending', 'Pendências']] :
  [['alpha', 'A–Z'], ['points', 'Classificação']];

  return (
    <div className="w-full max-w-[860px] mx-auto p-3 md:p-5 animate-fade-in-up overflow-x-hidden">
      <div className="mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
            <Trophy size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl lg:text-2xl font-bold text-foreground">Controle de Pontuação</h2>
            <p className="text-muted-foreground text-sm mt-0.5">{isTeacher ? 'Verifique e pontue as atividades de cada aluno' : 'Classificação dos alunos por posição'}</p>
          </div>
        </div>
        {isTeacher && (courseSubmissions?.filter((s) => s.status === 'submitted' && !scoreItems.find((si) => si.ref_id === s.task_id && si.student_email === s.student_email && si.verified)).length || 0) > 0 &&
        <div className="mt-3 bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center gap-2">
            <Clock size={14} className="text-orange-500 shrink-0" />
            <p className="text-xs text-orange-800 font-semibold">{courseSubmissions?.filter((s) => s.status === 'submitted' && !scoreItems.find((si) => si.ref_id === s.task_id && si.student_email === s.student_email && si.verified)).length || 0} atividade(s) aguardando verificação e pontuação</p>
          </div>
        }
      </div>

      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar aluno..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        <div className="flex items-center gap-1 w-full sm:w-auto sm:ml-auto overflow-x-auto pb-1">
          <ArrowUpDown size={13} className="text-muted-foreground" />
          {[['alpha', 'A–Z'], ['points', 'Classificação'], ['participations', 'Participações'], ['pending', 'Pendências']].map(([val, label]) =>

          <button key={val} onClick={() => setSortBy(val)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${sortBy === val ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
              {label}
            </button>
          )}
          {isTeacher &&
          <Button size="sm" variant="outline" className="text-xs" onClick={() => saveOrderMutation.mutate()} disabled={saveOrderMutation.isPending || customOrder.length === 0}>
              {saveOrderMutation.isPending ? 'Salvando...' : 'Salvar sequência'}
            </Button>
          }
        </div>
      </div>

      {isLoading ?
      <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded-2xl animate-pulse" />)}</div> :
      filtered.length === 0 ?
      <div className="text-center py-16 text-muted-foreground">
          <Users size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-semibold">Nenhum aluno encontrado</p>
        </div> :

      <div className="space-y-2">
          {customOrder.map(({ code, hasPending, totalScore, participations }, index) => {
          const displayName = code.profile_name || code.student_name || 'Sem nome';
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
          return (
            <div
              key={code.id}
              draggable={isTeacher}
              onDragStart={() => setDraggedEmail(code.student_email)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (!draggedEmail || draggedEmail === code.student_email) return;
                const from = customOrder.findIndex((x) => x.code.student_email === draggedEmail);
                const to = customOrder.findIndex((x) => x.code.student_email === code.student_email);
                if (from < 0 || to < 0) return;
                const next = [...customOrder];
                const [moved] = next.splice(from, 1);
                next.splice(to, 0, moved);
                setCustomOrder(next);
              }}
              onClick={() => (isTeacher || code.student_email === session?.email) && setSelectedCode(code)}
              className={`bg-card rounded-2xl border p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${isTeacher || code.student_email === session?.email ? 'cursor-pointer hover:shadow-md' : 'cursor-default'} transition-all ${hasPending ? 'border-red-300 hover:border-red-400' : 'border-border hover:border-primary/30'}`}>
              
                  <div className="w-7 text-center shrink-0">
                    {medal || <span className="text-xs font-black text-muted-foreground">#{index + 1}</span>}
                  </div>
                  <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0"
                style={{ backgroundColor: code.profile_avatar_color || '#5b5ef4' }}>
                
                    {displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-sm text-foreground truncate">{displayName}</p>
                      {isTeacher && hasPending && <AlertCircle size={14} className="text-red-500 shrink-0" />}
                    </div>
                    {isTeacher && <p className="text-xs text-muted-foreground">{code.student_email || '—'}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
                    {isTeacher &&
                <div className="flex items-center gap-1 bg-blue-50 border border-blue-200 px-2.5 py-1.5 rounded-xl" title="Aulas assistidas + lives + entregas + fórum + monitoria">
                        <Activity size={11} className="text-blue-500" />
                        <span className="text-xs font-bold text-blue-700">{participations}</span>
                      </div>
                }
                    {isTeacher ?
                <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-xl">
                        <Star size={11} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-black text-yellow-700">{formatScore(totalScore)}</span>
                      </div> :

                <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-xl" title="Pontos publicados">
                          <Star size={11} className="text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-black text-yellow-700">{formatScore(totalScore)}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl" title="Posição na classificação">
                          <Trophy size={11} className="text-primary" />
                          <span className="text-sm font-black text-primary">#{index + 1}</span>
                        </div>
                      </div>
                }
                    {isTeacher && <ChevronLeft size={14} className="text-muted-foreground rotate-180" />}
                  </div>
                </div>);

        })}
        </div>
      }
    </div>);

}