import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { adminApi } from '@/lib/adminApi';
import useCourseFilteredEmails from '@/hooks/useCourseFilteredEmails';
import ScoreRow from '@/components/scores/ScoreRow';
import ModuleUnlockPanel from '@/components/scores/ModuleUnlockPanel';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Trophy, ChevronLeft, Clock, BookOpen, FileText, MessageSquare, Star, Users, Search, AlertCircle, Heart, HandHeart, ArrowUpDown, Activity, GraduationCap, Flame, Pencil, Check, X, Layers, RefreshCw, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { capScore, formatScore, isOfensivaScoreItem, isTherapistScoreItem, rankingScoreValue, roundScore, SCORE_RULES, parseUtcDate } from '@/lib/scoreUtils';
import { sortBySequence } from '@/lib/sequenceUtils';
import { groupUnlocksByEmail, resolveItemModule } from '@/lib/moduleAttribution';
import { buildStudentScoreSummary } from '@/lib/buildStudentAcademicData';

const CATEGORY_CONFIG = {
  lesson: { label: 'Aula Gravada', icon: BookOpen, color: 'bg-purple-100 text-purple-700' },
  task: { label: 'Tarefa', icon: FileText, color: 'bg-orange-100 text-orange-700' },
  quiz: { label: 'Prova', icon: Trophy, color: 'bg-blue-100 text-blue-700' },
  exam: { label: 'Prova do Módulo', icon: GraduationCap, color: 'bg-indigo-100 text-indigo-700' },
  forum: { label: 'Fórum', icon: MessageSquare, color: 'bg-green-100 text-green-700' },
  mentorship: { label: 'Mentoria', icon: HandHeart, color: 'bg-rose-100 text-rose-700' },
  therapist: { label: 'Terapeuta da Semana', icon: Heart, color: 'bg-pink-100 text-pink-700' },
  ofensiva: { label: 'Ofensiva Diária', icon: Flame, color: 'bg-orange-100 text-red-600' }
};

// ── Filtro por módulo ────────────────────────────────────────────────────────
// Aulas e tarefas guardam o módulo em `module_number`; provas guardam em
// `module_ref` como texto ('mod1'). Já fórum, terapeutas, ofensivas e monitoria
// sem módulo próprio permanecem no total geral e não são atribuídas artificialmente
// a uma janela de datas.
const parseModuleNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const digits = String(value).match(/\d+/);
  const parsed = digits ? Number(digits[0]) : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

// Sem data conhecida não descartamos o registro: é melhor contar a mais do que
// sumir com pontuação já lançada.
const withinWindow = (dateLike, start, end) => {
  const date = parseUtcDate(dateLike);
  if (!date) return true;
  if (start && date <= start) return false;
  if (end && date > end) return false;
  return true;
};

function StudentScoreDetail({ code, onBack, activeCourse, courseEmails, isTeacher, moduleFilter }) {
  const queryClient = useQueryClient();
  const email = code.student_email || '';
  const displayName = code.profile_name || code.student_name || 'Sem nome';
  const selectedModule = moduleFilter?.module || null;
  const matchesModule = (value) => !selectedModule || parseModuleNumber(value) === selectedModule;
  const inModuleWindow = (dateLike) => !selectedModule || withinWindow(dateLike, moduleFilter?.start, moduleFilter?.end);

  const { data: allLessons = [] } = useQuery({
    queryKey: ['lessons-score-detail', activeCourse],
    queryFn: () => base44.entities.RecordedLesson.filter({ course: activeCourse }, 'order', 100)
  });
  const { data: progresses = [] } = useQuery({ queryKey: ['lesson-progress', email], queryFn: () => base44.entities.LessonProgress.filter({ student_email: email }, '-created_date', 200) });
  const { data: allTasks = [] } = useQuery({
    queryKey: ['tasks-score-detail', activeCourse],
    queryFn: () => base44.entities.Task.filter({ course: activeCourse }, '-created_date', 100)
  });
  const { data: submissions = [] } = useQuery({ queryKey: ['submissions-student', email], queryFn: () => base44.entities.TaskSubmission.filter({ student_email: email }, '-created_date', 200) });
  const { data: examSubs = [] } = useQuery({ queryKey: ['exam-subs-student', email], queryFn: () => base44.entities.ExamSubmission.filter({ student_email: email, course: activeCourse }, '-submitted_at', 200) });
  const { data: allExams = [] } = useQuery({ queryKey: ['exams-score-detail', activeCourse], queryFn: () => base44.entities.Exam.filter({ course: activeCourse }, '-created_date', 100) });
  const { data: forumPosts = [] } = useQuery({
    queryKey: ['forum-posts-score-detail', email, activeCourse],
    queryFn: () => base44.entities.ForumPost.filter({ course: activeCourse }, '-created_date', 500)
  });
  const { data: forumReplies = [] } = useQuery({ queryKey: ['forum-replies', email], queryFn: () => base44.entities.ForumReply.filter({ author_email: email }, '-created_date', 100) });
  const { data: scoreItems = [] } = useQuery({ queryKey: ['score-items', email], queryFn: () => base44.entities.ScoreItem.filter({ student_email: email }, '-created_date', 500) });
  const { data: mentorships = [] } = useQuery({
    queryKey: ['mentorships-score-detail', activeCourse],
    queryFn: () => base44.entities.Mentorship.filter({ course: activeCourse }, '-date', 500)
  });
  const { data: pairings = [] } = useQuery({ queryKey: ['therapist-pairings-score', email], queryFn: () => base44.entities.TherapistPairing.list('-pairing_date', 200) });
  const { data: studentProfiles = [] } = useQuery({
    queryKey: ['student-profile-score', email],
    queryFn: () => base44.entities.StudentProfile.filter({ student_email: email, dashboard_course: activeCourse }, '-updated_date', 1)
  });
  const { data: ofensivaResponses = [] } = useQuery({
    queryKey: ['ofensiva-responses-score-detail', email, activeCourse],
    queryFn: () => base44.entities.DailyChallengeResponse.filter({ student_email: email, course: activeCourse }, '-date', 200)
  });
  const { data: dailyChallenges = [] } = useQuery({
    queryKey: ['daily-challenges-score-detail', activeCourse],
    queryFn: () => base44.entities.DailyChallenge.filter({ course: activeCourse }, '-date', 200)
  });

  const [activeSection, setActiveSection] = useState('lessons');

  // Quando um módulo está selecionado no Controle de Pontuação, o detalhe do
  // aluno mostra (e soma) apenas as atividades daquele módulo/período.
  const lessons = allLessons.filter((l) => matchesModule(l.module_number));
  const tasks = allTasks.filter((t) => matchesModule(t.module_number));
  const exams = allExams.filter((e) => matchesModule(e.module_ref));

  const updateScoreMutation = useMutation({
    mutationFn: async ({ category, ref_id, ref_title, score, max_score, notes: itemNotes }) => {
      const existing = scoreItems.find((s) => {
        if (category === 'exam') return s.category === 'exam' && (s.ref_id === ref_id || s.ref_id === `exam:${ref_id}`);
        // Ofensivas legadas foram gravadas com category 'forum'; casamos apenas pelo ref_id.
        if (category === 'ofensiva') return s.ref_id === ref_id;
        return s.category === category && s.ref_id === ref_id;
      });
      const normalizedScore = roundScore(String(score).replace(',', '.'));
      const scoreRefId = category === 'exam' ? `exam:${ref_id}` : ref_id;
      const data = { student_email: email, category, ref_id: scoreRefId, ref_title, score: normalizedScore, max_score: roundScore(max_score), verified: true, notes: itemNotes || '', ...(selectedModule ? { module_number: selectedModule } : {}) };
      const result = existing ? await adminApi.update('ScoreItem', existing.id, data) : await adminApi.create('ScoreItem', data);

      if (category === 'exam') {
        const submission = examSubs.find((sub) => sub.exam_id === ref_id);
        if (submission?.id) {
          await adminApi.update('ExamSubmission', submission.id, {
            grade: normalizedScore,
            feedback: itemNotes || submission.feedback || '',
            status: 'graded',
            graded_at: new Date().toISOString()
          });
        }
      }

      return result;
    },
    onMutate: async ({ category, ref_id, ref_title, score, max_score, notes: itemNotes }) => {
      await queryClient.cancelQueries({ queryKey: ['score-items', email] });
      const previous = queryClient.getQueryData(['score-items', email]);
      queryClient.setQueryData(['score-items', email], (old = []) => {
        const existing = old.find((s) => {
          if (category === 'exam') return s.category === 'exam' && (s.ref_id === ref_id || s.ref_id === `exam:${ref_id}`);
          if (category === 'ofensiva') return s.ref_id === ref_id;
          return s.category === category && s.ref_id === ref_id;
        });
        const normalizedScore = roundScore(String(score).replace(',', '.'));
        const scoreRefId = category === 'exam' ? `exam:${ref_id}` : ref_id;
        const updated = { student_email: email, category, ref_id: scoreRefId, ref_title, score: normalizedScore, max_score, verified: true, notes: itemNotes || '', ...(selectedModule ? { module_number: selectedModule } : {}), id: existing?.id || `optimistic_${ref_id}` };
        if (existing) return old.map((s) => s.id === existing.id ? updated : s);
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
      queryClient.invalidateQueries({ queryKey: ['exam-subs-student', email] });
      queryClient.invalidateQueries({ queryKey: ['access-codes'] });
      queryClient.invalidateQueries({ queryKey: ['student-profiles-score-overview'] });
      toast.success('Pontuação salva e cache atualizado!');
    }
  });

  const getScoreItem = (category, ref_id, role) => scoreItems.find((s) => {
    if (category === 'exam') return s.category === 'exam' && (s.ref_id === ref_id || s.ref_id === `exam:${ref_id}`);
    // Ofensivas legadas ficaram salvas com category 'forum' — casamos pelo ref_id.
    if (category === 'ofensiva') return s.ref_id === ref_id;
    if (category === 'therapist') {
      return (s.category === 'therapist' && s.ref_id === ref_id) ||
        (s.category === 'task' && s.ref_id === `therapist_pairing:${ref_id}:${role}`);
    }
    return s.category === category && s.ref_id === ref_id;
  });

  const isPairingFromActiveCourse = (pairing) => {
    if (!courseEmails || courseEmails.size === 0) return true;
    return courseEmails.has(pairing.therapist_email || '') && courseEmails.has(pairing.patient_email || '');
  };

  const myPairings = pairings.filter((p) =>
  (p.therapist_email === email || p.patient_email === email) && isPairingFromActiveCourse(p) &&
  (selectedModule && Number(p.module_number) ? Number(p.module_number) === selectedModule : inModuleWindow(p.pairing_date || p.created_date))
  );

  const lessonIds = new Set(lessons.map((l) => l.id));
  const taskIds = new Set(tasks.map((t) => t.id));
  const examIds = new Set(exams.map((e) => e.id));
  const studentForumPosts = forumPosts.filter((p) => p.author_email === email && inModuleWindow(p.created_date));
  const forumPostIds = new Set(studentForumPosts.map((p) => p.id));
  const forumParentById = new Map(forumPosts.map((p) => [p.id, p]));
  const scorableForumReplies = forumReplies.filter((r) => {
    const parentPost = forumParentById.get(r.post_id);
    return parentPost && parentPost.author_email !== email && inModuleWindow(r.created_date);
  });
  const forumReplyIds = new Set(scorableForumReplies.map((r) => r.id));
  const sequencedLessons = sortBySequence(lessons);
  const sequencedTasks = sortBySequence(tasks);
  const sequencedForumPosts = sortBySequence(studentForumPosts);
  const sequencedForumReplies = sortBySequence(scorableForumReplies);
  const studentMentorships = mentorships
    .filter((mentorship) => (mentorship.participant_emails || []).includes(email) && (selectedModule && Number(mentorship.module_number) ? Number(mentorship.module_number) === selectedModule : inModuleWindow(mentorship.date || mentorship.created_date)))
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  const mentorshipIds = new Set(studentMentorships.map((mentorship) => mentorship.id));
  const sequencedPairings = sortBySequence(myPairings);
  const therapistScoreRefIds = new Set(myPairings.flatMap((p) => {
    const ids = [];
    if (p.therapist_email === email) ids.push(`therapist_pairing:${p.id}:therapist`);
    if (p.patient_email === email) ids.push(`therapist_pairing:${p.id}:patient`);
    return ids;
  }));
  const ofensivaRefIdByResponse = (response) => `ofensiva:${response.challenge_id}:${email}`;
  const sortedOfensivaResponses = [...ofensivaResponses].
  filter((r) => inModuleWindow(r.date || r.created_date)).
  sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  const ofensivaScoreRefIds = new Set(sortedOfensivaResponses.map(ofensivaRefIdByResponse));
  const challengeById = new Map(dailyChallenges.map((c) => [c.id, c]));

  const totalScore = capScore(scoreItems.
  filter((s) => s.verified && (
  s.category === 'lesson' && lessonIds.has(s.ref_id) ||
(s.category === 'task' || s.category === 'quiz') && taskIds.has(s.ref_id) ||
  s.category === 'exam' && (examIds.has(s.ref_id) || examIds.has(String(s.ref_id || '').replace(/^exam:/, ''))) ||
  isOfensivaScoreItem(s) && ofensivaScoreRefIds.has(s.ref_id) ||
  s.category === 'forum' && !isOfensivaScoreItem(s) && (forumPostIds.has(s.ref_id) || forumReplyIds.has(s.ref_id)) ||
  s.category === 'mentorship' && mentorshipIds.has(s.ref_id) ||
  s.category === 'therapist' && myPairings.some((p) => p.id === s.ref_id) ||
  isTherapistScoreItem(s) && therapistScoreRefIds.has(s.ref_id))
  ).
  reduce((sum, s) => roundScore(sum + rankingScoreValue(s)), 0));

  const studyScore = scoreItems.
  filter((s) => s.verified && (
  s.category === 'lesson' && lessonIds.has(s.ref_id) ||
  (s.category === 'task' || s.category === 'quiz') && taskIds.has(s.ref_id) ||
  s.category === 'exam' && (examIds.has(s.ref_id) || String(s.ref_id || '').startsWith('exam:')))
  && !String(s.ref_id || '').startsWith('therapist_pairing:')).
  reduce((sum, s) => roundScore(sum + rankingScoreValue(s)), 0);

  const sendTotalMutation = useMutation({
    mutationFn: async () => {
      const profile = studentProfiles[0];
      const data = { student_email: email, full_name: displayName, points: capScore(totalScore), pontuacao_total: capScore(totalScore), pontuacao_estudos: roundScore(studyScore), dashboard_course: activeCourse };
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
  { key: 'tasks', label: 'Tarefas', icon: FileText },
  { key: 'exams', label: 'Provas', icon: GraduationCap },
  { key: 'forum', label: 'Fórum', icon: MessageSquare },
  { key: 'mentorship', label: 'Mentoria', icon: HandHeart },
  { key: 'therapist', label: 'Terapeutas', icon: Heart },
  { key: 'ofensivas', label: 'Ofensivas', icon: Flame }];


  const sectionPending = {
    lessons: sequencedLessons.some((l) => {
      const p = progresses.find((pr) => pr.lesson_id === l.id);
      return p && (p.watched || p.comment || p.summary) && !scoreItems.find((s) => s.category === 'lesson' && s.ref_id === l.id && s.verified);
    }),
    tasks: sequencedTasks.some((task) => {
      const sub = submissions.find((s) => s.task_id === task.id);
      return sub && !scoreItems.find((s) => (s.category === 'task' || s.category === 'quiz') && s.ref_id === task.id && s.verified);
    }),
    exams: examSubs.some((sub) => {
      const examId = exams.find(e => e.id === sub.exam_id)?.id;
      return sub.status === 'submitted' && examId && !scoreItems.find((s) => s.category === 'exam' && (s.ref_id === examId || s.ref_id === `exam:${examId}`) && s.verified);
    }),
    forum: [...studentForumPosts, ...scorableForumReplies].some((item) =>
    !scoreItems.find((s) => s.category === 'forum' && s.ref_id === item.id && s.verified)
    ),
    mentorship: studentMentorships.some((mentorship) =>
      !scoreItems.find((s) => s.category === 'mentorship' && s.ref_id === mentorship.id && s.verified)
    ),
    therapist: sequencedPairings.some((p) => {
      const role = p.therapist_email === email ? 'therapist' : 'patient';
      return !scoreItems.find((s) => s.verified && ((s.category === 'therapist' && s.ref_id === p.id) || (s.category === 'task' && s.ref_id === `therapist_pairing:${p.id}:${role}`)));
    }),
    ofensivas: sortedOfensivaResponses.some((response) =>
    !scoreItems.find((s) => s.verified && s.ref_id === ofensivaRefIdByResponse(response))
    )
  };

  const uncorrectedTaskIds = new Set(
    submissions.
    filter((s) => s.status === 'submitted' && !scoreItems.find((si) => si.ref_id === s.task_id && si.student_email === email && si.verified)).
    map((s) => s.task_id)
  );


  return (
    <div className="w-full max-w-[860px] mx-auto app-page animate-fade-in-up overflow-x-hidden">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={16} /> Voltar
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-foreground truncate">{displayName}</h2>
          <p className="text-xs text-muted-foreground">{email}</p>
        </div>
        {selectedModule &&
        <Badge variant="outline" className="shrink-0 border-primary/40 bg-primary/10 text-[10px] font-bold text-primary">
          {moduleFilter?.label || `Módulo ${selectedModule}`}
        </Badge>
        }
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
                maxScore={SCORE_RULES.lesson}
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

        {activeSection === 'tasks' &&
        <>
            {sequencedTasks.filter(t => t.type !== 'quiz').length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma tarefa criada.</p>}
            {sequencedTasks.filter(t => t.type !== 'quiz').map((task) => {
            const sub = submissions.find((s) => s.task_id === task.id);
            return (
              <ScoreRow
                key={task.id}
                category={task.type === 'quiz' ? 'quiz' : 'task'}
                icon={task.type === 'quiz' ? CATEGORY_CONFIG.quiz.icon : CATEGORY_CONFIG.task.icon}
                refId={task.id}
                refTitle={task.title}
                maxScore={task.type === 'quiz' ? SCORE_RULES.quiz : SCORE_RULES.task}
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
                maxScore={SCORE_RULES.exam}
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

        {activeSection === 'mentorship' &&
        <>
            {studentMentorships.length === 0 &&
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma participação em mentoria.</p>
          }
            {studentMentorships.map((mentorship) =>
          <ScoreRow
            key={mentorship.id}
            category="mentorship"
            icon={CATEGORY_CONFIG.mentorship.icon}
            refId={mentorship.id}
            refTitle={`Mentoria: ${mentorship.theme}`}
            maxScore={10}
            item={getScoreItem('mentorship', mentorship.id)}
            onSave={(data) => updateScoreMutation.mutate(data)}
            saving={updateScoreMutation.isPending}
            readOnly={!isTeacher}>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {mentorship.date && <Badge variant="secondary" className="text-[10px] bg-rose-100 text-rose-700">Realizada em {mentorship.date}</Badge>}
                {mentorship.facilitator && <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-semibold">Mentor(a): {mentorship.facilitator}</span>}
              </div>
              {mentorship.objective &&
              <div className="mt-1.5 bg-secondary/50 rounded-lg p-2 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Objetivo: </span>{mentorship.objective}
              </div>
              }
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
                maxScore={SCORE_RULES.therapist}
                item={getScoreItem('therapist', p.id, p.therapist_email === email ? 'therapist' : 'patient')}
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

        {activeSection === 'ofensivas' &&
        <>
            {sortedOfensivaResponses.length === 0 &&
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma participação nas Ofensivas Diárias.</p>
          }
            {sortedOfensivaResponses.map((response) => {
            const challenge = challengeById.get(response.challenge_id);
            const refId = ofensivaRefIdByResponse(response);
            const lessonRef = challenge?.lesson_ref ? ` (${challenge.lesson_ref})` : '';
            return (
              <ScoreRow
                key={response.id || refId}
                category="ofensiva"
                icon={CATEGORY_CONFIG.ofensiva.icon}
                refId={refId}
                refTitle={`Ofensiva Diária — ${response.date || 'sem data'}${lessonRef}`}
                maxScore={SCORE_RULES.ofensiva}
                item={getScoreItem('ofensiva', refId)}
                onSave={(data) => updateScoreMutation.mutate(data)}
                saving={updateScoreMutation.isPending}
                readOnly={!isTeacher}>
                
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold">
                      🔥 {response.questions_answered || 0}/8 perguntas
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-semibold">
                      Pontos apurados: {formatScore(response.points_earned || 0, 3)}
                    </span>
                    {challenge?.lesson_ref &&
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">{challenge.lesson_ref}</span>
                  }
                  </div>
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
  const autoStudentEmail = new URLSearchParams(location.search).get('student') || null;
  const [retroLoading, setRetroLoading] = useState(false);
  const [forumBotLoading, setForumBotLoading] = useState(false);
  const [automaticSyncComplete, setAutomaticSyncComplete] = useState(false);
  const [draggedEmail, setDraggedEmail] = useState(null);
  const [customOrder, setCustomOrder] = useState([]);
  const [editingScore, setEditingScore] = useState(null);
  const [editingParticipations, setEditingParticipations] = useState(null);
  // Não existe ranking "Todos": a pontuação sempre pertence ao módulo em que
  // cada aluno estava liberado quando a atividade foi registrada.
  const [selectedModule, setSelectedModule] = useState('1');
  const { emails: courseEmails, course: routeCourse, codePrefix } = useCourseFilteredEmails();
  const activeCourse = routeCourse || session?.course || 'tcc';
  const isTeacher = session?.role === 'admin';
  const isPontuacaoGeralRoute = location.pathname.includes('/pontuacao-geral');

  const { data: codes = [], isLoading } = useQuery({
    queryKey: ['access-codes'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 200)
  });

  const { data: scoreItems = [] } = useQuery({
    queryKey: ['score-items-all'],
    queryFn: () => base44.entities.ScoreItem.list('-created_date', 10000)
  });

  const { data: moduleUnlocks = [] } = useQuery({
    queryKey: ['ranking-module-unlocks'],
    queryFn: () => base44.entities.StudentModuleUnlock.list('-unlocked_at', 2000)
  });
  const unlocksByEmail = useMemo(() => groupUnlocksByEmail(moduleUnlocks), [moduleUnlocks]);

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

  const { data: exams = [] } = useQuery({
    queryKey: ['exams-score-overview', activeCourse],
    queryFn: () => base44.entities.Exam.filter({ course: activeCourse }, '-created_date', 500)
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

  const { data: mentorships = [] } = useQuery({
    queryKey: ['mentorships-score-overview', activeCourse],
    queryFn: () => base44.entities.Mentorship.filter({ course: activeCourse }, '-date', 500)
  });

  const { data: studentProfiles = [] } = useQuery({
    queryKey: ['student-profiles-score-overview'],
    queryFn: () => base44.entities.StudentProfile.list('-updated_date', 10000)
  });

  const { data: examSubmissions = [] } = useQuery({
    queryKey: ['exam-subs-score-overview', activeCourse],
    queryFn: () => base44.entities.ExamSubmission.filter({ course: activeCourse }, '-submitted_at', 3000)
  });

  const { data: challengeResponses = [] } = useQuery({
    queryKey: ['ofensiva-responses-score-overview', activeCourse],
    queryFn: () => base44.entities.DailyChallengeResponse.filter({ course: activeCourse }, '-date', 5000)
  });
  const { data: dailyChallenges = [] } = useQuery({
    queryKey: ['daily-challenges-score-overview', activeCourse],
    queryFn: () => base44.entities.DailyChallenge.filter({ course: activeCourse }, '-date', 2000)
  });
  const { data: moduleClosures = [] } = useQuery({
    queryKey: ['module-closures-score-overview'],
    queryFn: () => base44.entities.ModuleClosure.list('-closed_at', 100)
  });

  // Reconstitui ScoreItems e observações a partir das atividades reais ao abrir
  // o controle. Isso também cobre instalações em que a automação de entidade
  // deixou de disparar, sem exigir que o administrador clique em recalcular.
  // A sincronização automática só é permitida para administradores — alunos e
  // professores visualizam os dados já calculados, sem disparar o recálculo.
  useEffect(() => {
    if (automaticSyncComplete || !isTeacher) return;
    setAutomaticSyncComplete(true);
    base44.functions.invoke('recalculateScores', {})
      .then(() => queryClient.invalidateQueries())
      .catch((error) => {
        // Falha eventual (concorrência/limite de requisições): os dados exibidos
        // continuam válidos; o admin pode usar "Recalcular Pontuações" se quiser.
        console.error('Falha ao sincronizar automaticamente as pontuações:', error);
      });
  }, [automaticSyncComplete, isTeacher, queryClient]);

  const moduleOptions = useMemo(() => {
    // Os 10 módulos ficam sempre disponíveis: o admin pode atribuir a pontuação
    // a qualquer módulo, mesmo antes de existirem aulas cadastradas nele.
    const numbers = new Set(Array.from({ length: 10 }, (_, i) => i + 1));
    for (const lesson of lessons) { const n = parseModuleNumber(lesson.module_number); if (n) numbers.add(n); }
    for (const task of tasks) { const n = parseModuleNumber(task.module_number); if (n) numbers.add(n); }
    for (const exam of exams) { const n = parseModuleNumber(exam.module_ref); if (n) numbers.add(n); }
    return [...numbers].sort((a, b) => a - b);
  }, [lessons, tasks, exams]);

  const activeModule = Number(selectedModule) || 1;
  const activeModuleWindow = { start: null, end: null };
  const activeModuleLabel = `Módulo ${activeModule}`;
  const moduleFilter = { module: activeModule, start: null, end: null, label: activeModuleLabel };

  // Um ScoreItem pertence ao módulo selecionado quando a atividade de origem é
  // daquele módulo (aula/tarefa/prova) ou, para atividades sem módulo, quando
  // aconteceu dentro da janela de datas do período.
  const scoreItemInSelectedModule = (item) => {
    // Registros antigos, inclusive conteúdos cadastrados como Módulo 2+, são
    // Módulo 1 até existir uma liberação individual. A data de ingresso não
    // interfere nessa atribuição.
    return resolveItemModule(item, unlocksByEmail.get(item.student_email) || []) === activeModule;
  };

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

  // Fallback manual do agente de pontuação: caso a automação disparada por
  // entidade (TaskSubmission/ExamSubmission) falhe ou atrase, o admin pode
  // forçar o recálculo/atribuição de notas por aqui, sem depender do agendador.
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

  // Fallback manual do agente de respostas do fórum: caso a automação
  // agendada do forumBot falhe ou não esteja ativa, o admin pode disparar as
  // respostas automáticas pendentes por aqui.
  const handleRunForumBot = async () => {
    setForumBotLoading(true);
    try {
      const res = await base44.functions.invoke('forumBot', {});
      await queryClient.invalidateQueries();
      toast.success(`Respostas do fórum processadas! ${res.data?.processed || 0} de ${res.data?.eligible || 0} publicação(ões) pendente(s).`);
    } catch (e) {
      toast.error('Erro: ' + (e?.message || 'tente novamente'));
    } finally {
      setForumBotLoading(false);
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
  const examIds = new Set(exams.map((e) => e.id));
  const forumPostIds = new Set(forumPosts.map((p) => p.id));
  const allowedEmails = new Set(filtered.map((c) => c.student_email).filter(Boolean));
  const courseSubmissions = submissions.filter((s) => allowedEmails.has(s.student_email) && taskIds.has(s.task_id));
  const pendingCount = courseSubmissions.filter((s) => s.status === 'submitted' && !scoreItems.find((si) => si.ref_id === s.task_id && si.student_email === s.student_email && si.verified)).length;

  const coursePairingIds = new Set(
    therapistPairings.
    filter((p) => !courseEmails || courseEmails.size === 0 || courseEmails.has(p.therapist_email || '') && courseEmails.has(p.patient_email || '')).
    map((p) => p.id)
  );
  const courseMentorshipIdsByEmail = new Map();
  mentorships.forEach((mentorship) => {
    (mentorship.participant_emails || []).forEach((studentEmail) => {
      if (!courseMentorshipIdsByEmail.has(studentEmail)) courseMentorshipIdsByEmail.set(studentEmail, new Set());
      courseMentorshipIdsByEmail.get(studentEmail).add(mentorship.id);
    });
  });

  // Itens de pontuação do aluno que pertencem ao curso ativo. Com
  // applyModuleFilter=false devolve todos (usado para atribuir um módulo).
  const getCourseScoreItems = (email, { applyModuleFilter = true } = {}) => {
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
    const studentMentorshipIds = courseMentorshipIdsByEmail.get(email) || new Set();

    return scoreItems.
    filter((s) => s.student_email === email && s.verified && (!applyModuleFilter || scoreItemInSelectedModule(s)) && (
    s.category === 'lesson' && lessonIds.has(s.ref_id) ||
    (s.category === 'task' || s.category === 'quiz') && taskIds.has(s.ref_id) ||
    s.category === 'exam' ||
    isOfensivaScoreItem(s) ||
    s.category === 'forum' && !isOfensivaScoreItem(s) && (studentForumPostIds.has(s.ref_id) || studentForumReplyIds.has(s.ref_id)) ||
    s.category === 'mentorship' && studentMentorshipIds.has(s.ref_id) ||
    s.category === 'therapist' && coursePairingIds.has(s.ref_id) ||
    isTherapistScoreItem(s) && coursePairingIds.has(String(s.ref_id || '').split(':')[1]))
    );
  };

  const academicSummaryByEmail = useMemo(() => {
    const summaries = new Map();
    for (const code of codes) {
      const email = code.student_email;
      if (!email || summaries.has(email)) continue;
      summaries.set(email, buildStudentScoreSummary({
        studentEmail: email,
        scoreItems: getCourseScoreItems(email, { applyModuleFilter: false }),
        lessons,
        tasks,
        exams,
        examSubs: examSubmissions,
        pairings: therapistPairings,
        challengeResponses,
        lessonProgress: lessonProgresses,
        taskSubmissions: submissions,
        forumPosts,
        forumReplies,
        mentorships,
        challenges: dailyChallenges,
        moduleClosures,
      }, {
        studentUnlocks: unlocksByEmail.get(email) || [],
        moduleNumber: activeModule,
      }));
    }
    return summaries;
  }, [codes, scoreItems, lessons, tasks, exams, examSubmissions, therapistPairings, challengeResponses,
    lessonProgresses, submissions, forumPosts, forumReplies, mentorships, dailyChallenges, moduleClosures,
    moduleUnlocks, activeModule, activeCourse]);

  // Atividades = entregas atuais do aluno (aulas assistidas, tarefas, provas,
  // fórum, mentorias, Terapeuta da Semana e ofensivas). Módulos removidos e
  // históricos apagados não entram, pois contamos só os registros existentes.
  const getParticipationStats = (email) => {
    const centralized = academicSummaryByEmail.get(email);
    if (centralized) return { count: centralized.activityCount };
    // Com um módulo selecionado, o recorte é o próprio módulo (aula/tarefa) ou a
    // janela de datas do período (fórum e monitoria). Sem módulo, vale o corte do
    // total geral atemporal.
    const start = activeModuleWindow?.start || null;
    const end = activeModuleWindow?.end || null;
    const inScope = (record, moduleNumber) => {
      if (!activeModule) return true;
      if (moduleNumber !== undefined) return moduleNumber === activeModule;
      return withinWindow(record?.created_date, start, end);
    };

    const lessonCount = lessonProgresses.filter((p) => p.student_email === email && lessonIds.has(p.lesson_id) && p.watched && inScope(p, activeModule ? lessonModuleById.get(p.lesson_id) : undefined)).length;
    // Lives não geram pontuação e não entram mais na área de pontuação do aluno.
    const taskCount = submissions.filter((s) => s.student_email === email && taskIds.has(s.task_id) && inScope(s, activeModule ? taskModuleById.get(s.task_id) : undefined)).length;
    const postCount = forumPosts.filter((p) => p.author_email === email && forumPostIds.has(p.id) && inScope(p)).length;
    const forumParentById = new Map(forumPosts.map((p) => [p.id, p]));
    const replyCount = forumReplies.filter((r) => {
      const parentPost = forumParentById.get(r.post_id);
      return r.author_email === email && parentPost && parentPost.author_email !== email && forumPostIds.has(parentPost.id) && inScope(r);
    }).length;
    const examCount = examSubmissions.filter((s) => s.student_email === email && examIds.has(s.exam_id) && inScope(s, activeModule ? examModuleById.get(s.exam_id) : undefined)).length;
    const mentorshipCount = mentorships.filter((m) =>
      (m.participant_emails || []).includes(email) &&
      inScope(m, activeModule ? mentorshipModuleById.get(m.id) : undefined)
    ).length;
    const therapistCount = therapistPairings.filter((p) => {
      const isTherapist = p.therapist_email === email && p.therapist_submitted;
      const isPatient = p.patient_email === email && p.patient_submitted;
      if (!isTherapist && !isPatient) return false;
      if (!coursePairingIds.has(p.id)) return false;
      return inScope(p, activeModule ? pairingModuleById.get(p.id) : undefined);
    }).length;
    const ofensivaCount = challengeResponses.filter((r) => r.student_email === email && inScope(r)).length;
    const count = lessonCount + taskCount + examCount + postCount + replyCount + mentorshipCount + therapistCount + ofensivaCount;
    return { count };
  };

  // O total automático é caro de calcular por aluno; memorizamos por e-mail para não
  // recalcular a cada digitação na busca ou a cada tecla nos campos de edição inline.
  const courseScoreTotalByEmail = useMemo(() => {
    const totals = new Map();
    for (const code of codes) {
      const studentEmail = code.student_email;
      if (!studentEmail || totals.has(studentEmail)) continue;
      totals.set(studentEmail, capScore(academicSummaryByEmail.get(studentEmail)?.totalScore || 0));
    }
    return totals;
  }, [codes, academicSummaryByEmail]);

  const sortedRows = filtered.
  map((code) => {
    const hasPending = courseSubmissions.some((s) =>
    s.status === 'submitted' &&
    s.student_email === code.student_email &&
    !scoreItems.find((si) => si.ref_id === s.task_id && si.student_email === code.student_email && si.verified)
    );
    const stats = getParticipationStats(code.student_email);
    const profile = studentProfiles.find((p) => p.student_email === code.student_email && p.dashboard_course === activeCourse);
    const savedProfile = studentProfiles.find((p) => p.student_email === code.student_email && p.dashboard_course === activeCourse && typeof p.points === 'number');
    const pontuacaoCalculada = capScore(code.pontuacao_total ?? savedProfile?.pontuacao_total ?? savedProfile?.points ?? 0);
    // Recalculada a partir dos ScoreItems — é para ela que o botão "Auto" volta,
    // já que pontuacao_total é sobrescrito enquanto o override manual estiver ativo.
    const pontuacaoAutomatica = courseScoreTotalByEmail.get(code.student_email) ?? 0;
    const manualScoreActive = !activeModule && profile?.pontuacao_total_manual_ativa === true && Number.isFinite(Number(profile?.pontuacao_total_manual));
    // Com um módulo selecionado mostramos sempre o valor recalculado do período:
    // os overrides manuais são do total geral, não de um módulo específico.
    const totalScore = manualScoreActive ? capScore(profile.pontuacao_total_manual) : activeModule ? pontuacaoAutomatica : pontuacaoCalculada;
    const participacoesCalculadas = stats.count;
    const manualParticipationsActive = !activeModule && profile?.participacoes_manual_ativa === true && Number.isFinite(Number(profile?.participacoes_manual));
    const participations = manualParticipationsActive ? Math.max(0, Math.round(Number(profile.participacoes_manual))) : participacoesCalculadas;
    return { code, hasPending, totalScore, participations, pontuacaoCalculada, pontuacaoAutomatica, participacoesCalculadas, manualScoreActive, manualParticipationsActive };
  }).
  sort((a, b) => {
    if (sortBy === 'alpha') return (a.code.profile_name || a.code.student_name || '').localeCompare(b.code.profile_name || b.code.student_name || '');
    if (sortBy === 'points') {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      if (a.totalScore >= 100 && b.totalScore >= 100 && b.participations !== a.participations) return b.participations - a.participations;
      return 0;
    }
    if (sortBy === 'participations') return b.participations - a.participations;
    return (b.hasPending ? 1 : 0) - (a.hasPending ? 1 : 0);
  });

  // A ordem manual (drag & drop) é preservada em customOrder, mas os valores de cada linha
  // precisam refletir sempre os dados mais recentes — por isso resolvemos pelo e-mail.
  const rowByEmail = new Map(sortedRows.map((row) => [row.code.student_email, row]));
  const resolveRow = (row) => rowByEmail.get(row?.code?.student_email) || row;

  useEffect(() => {
    setCustomOrder(sortedRows);
  }, [sortedRows.map((r) => r.code.student_email).join('|')]);

  // Auto-select student when arriving from a notification link (?student=email)
  useEffect(() => {
    if (!autoStudentEmail || selectedCode || codes.length === 0) return;
    const match = codes.find((c) => c.student_email === autoStudentEmail);
    if (match) setSelectedCode(match);
  }, [autoStudentEmail, codes.length]);

  const upsertProfileData = async (code, data) => {
    const existing = studentProfiles.find((p) => p.student_email === code.student_email && p.dashboard_course === activeCourse);
    const payload = {
      student_email: code.student_email,
      full_name: code.profile_name || code.student_name || code.student_email,
      dashboard_course: activeCourse,
      ...data
    };
    if (existing) return adminApi.update('StudentProfile', existing.id, payload);
    return adminApi.create('StudentProfile', payload);
  };

  const saveManualScoreMutation = useMutation({
    mutationFn: async ({ code, value, active, calculada }) => {
      const effective = capScore(active ? value : calculada);
      await upsertProfileData(code, {
        // Ao desativar o override preservamos o último valor manual gravado.
        ...(active ? { pontuacao_total_manual: effective } : {}),
        pontuacao_total_manual_ativa: active,
        points: effective,
        pontuacao_total: effective
      });
      if (code.id) await adminApi.update('AccessCode', code.id, { pontuacao_total: effective });
      return effective;
    },
    onSuccess: () => {
      setEditingScore(null);
      queryClient.invalidateQueries({ queryKey: ['student-profiles-score-overview'] });
      queryClient.invalidateQueries({ queryKey: ['access-codes'] });
      toast.success('Pontuação total atualizada!');
    },
    onError: (error) => toast.error('Erro ao salvar pontuação: ' + (error?.message || 'tente novamente'))
  });

  const saveManualParticipationsMutation = useMutation({
    mutationFn: async ({ code, value, active }) => {
      const effective = Math.max(0, Math.round(Number(value) || 0));
      await upsertProfileData(code, {
        ...(active ? { participacoes_manual: effective } : {}),
        participacoes_manual_ativa: active
      });
      return effective;
    },
    onSuccess: () => {
      setEditingParticipations(null);
      queryClient.invalidateQueries({ queryKey: ['student-profiles-score-overview'] });
      queryClient.invalidateQueries({ queryKey: ['access-codes'] });
      toast.success('Atividades atualizadas!');
    },
    onError: (error) => toast.error('Erro ao salvar atividades: ' + (error?.message || 'tente novamente'))
  });

  const sendRankingToDashboardMutation = useMutation({
    mutationFn: async () => {
      const rankedStudents = (customOrder.length ? customOrder : sortedRows).map(resolveRow);

      for (const [index, item] of rankedStudents.entries()) {
        const code = item.code;
        const existing = studentProfiles.find((p) => p.student_email === code.student_email && p.dashboard_course === activeCourse);
        const data = {
          student_email: code.student_email,
          full_name: code.profile_name || code.student_name || code.student_email,
          points: capScore(item.totalScore),
          pontuacao_total: capScore(item.totalScore),
          pontuacao_estudos: roundScore(code.pontuacao_estudos || 0),
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
      // Com um módulo selecionado, salvar a sequência também registra que aquela
      // pontuação pertence ao módulo escolhido — é isso que torna os pontos
      // visíveis no ranking por módulo do aluno.
      if (activeModule) {
        const idsToStamp = [];
        for (const item of customOrder.map(resolveRow)) {
          const studentEmail = item.code?.student_email;
          if (!studentEmail) continue;
          for (const scoreItem of getCourseScoreItems(studentEmail, { applyModuleFilter: false })) {
            const current = Number(scoreItem.module_number);
            if (!current || current === activeModule) idsToStamp.push(scoreItem.id);
          }
        }
        if (idsToStamp.length > 0) {
          await base44.functions.invoke('stampScoreModule', {
            admin_email: session?.email,
            module_number: activeModule,
            score_item_ids: idsToStamp
          });
        }
      }

      for (const [index, item] of customOrder.map(resolveRow).entries()) {
        const code = item.code;
        const existing = studentProfiles.find((p) => p.student_email === code.student_email && p.dashboard_course === activeCourse);
        const effectiveTotal = capScore(item.totalScore);
        const data = {
          student_email: code.student_email,
          full_name: code.profile_name || code.student_name || code.student_email,
          points: effectiveTotal,
          pontuacao_total: effectiveTotal,
          pontuacao_estudos: roundScore(code.pontuacao_estudos || 0),
          dashboard_rank: index + 1,
          dashboard_course: activeCourse
        };
        if (existing) await adminApi.update('StudentProfile', existing.id, data);
        else await adminApi.create('StudentProfile', data);
        // AccessCode.pontuacao_total é a fonte principal lida pelo Ranking e pela
        // Dashboard do aluno — sem isso, a sequência do módulo selecionado não
        // aparece para os alunos, pois o valor antigo do AccessCode prevalece.
        if (code.id) await adminApi.update('AccessCode', code.id, { pontuacao_total: effectiveTotal });
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['student-profiles-score-overview'] });
      await queryClient.invalidateQueries({ queryKey: ['score-items-all'] });
      await queryClient.invalidateQueries({ queryKey: ['access-codes'] });
      toast.success(activeModule
        ? `Sequência salva e pontos vinculados ao ${activeModuleLabel} — já visíveis para os alunos.`
        : 'Sequência salva com sucesso!');
    }
  });

  if (selectedCode && (isTeacher || selectedCode.student_email === session?.email)) return <StudentScoreDetail code={selectedCode} activeCourse={activeCourse} courseEmails={courseEmails} isTeacher={isTeacher} moduleFilter={moduleFilter} onBack={() => setSelectedCode(null)} />;

  const changeSelectedModule = (value) => {
    setSelectedModule(value);
    setEditingScore(null);
    setEditingParticipations(null);
  };

  const sortOptions = isTeacher ?
  [['alpha', 'A–Z'], ['points', 'Classificação'], ['participations', 'Atividades'], ['pending', 'Pendências']] :
  [['alpha', 'A–Z'], ['points', 'Classificação']];

  return (
    <div className="w-full max-w-[860px] mx-auto app-page animate-fade-in-up overflow-x-hidden">
      <div className="mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
            <Trophy size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl lg:text-2xl font-bold text-foreground">{isPontuacaoGeralRoute ? 'Pontuação Geral' : 'Controle de Pontuação'}</h2>
            <p className="text-muted-foreground text-sm mt-0.5">{isTeacher ? 'Verifique e pontue as atividades de cada aluno' : 'Classificação dos alunos por posição'}</p>
          </div>
        </div>
        {isTeacher && (courseSubmissions?.filter((s) => s.status === 'submitted' && !scoreItems.find((si) => si.ref_id === s.task_id && si.student_email === s.student_email && si.verified)).length || 0) > 0 &&
        <div className="mt-3 bg-orange-50 border border-orange-200 rounded-xl p-3 flex flex-wrap items-center gap-2">
            <Clock size={14} className="text-orange-500 shrink-0" />
            <p className="text-xs text-orange-800 font-semibold">{courseSubmissions?.filter((s) => s.status === 'submitted' && !scoreItems.find((si) => si.ref_id === s.task_id && si.student_email === s.student_email && si.verified)).length || 0} atividade(s) aguardando verificação e pontuação</p>
            <Button size="sm" variant="outline" className="text-xs h-7 ml-auto" onClick={handleRetro} disabled={retroLoading}
            title="Força o agente de pontuação a rodar agora, caso a automação automática tenha falhado">
              {retroLoading ? <Loader2 size={13} className="animate-spin mr-1" /> : <RefreshCw size={13} className="mr-1" />}
              {retroLoading ? 'Recalculando...' : 'Recalcular pontuações agora'}
            </Button>
          </div>
        }
        {isTeacher &&
        <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3 flex flex-wrap items-center gap-2">
            <MessageSquare size={14} className="text-blue-500 shrink-0" />
            <p className="text-xs text-blue-800 font-semibold">Agente de respostas do fórum (auto-reply) pode ser executado manualmente</p>
            <Button size="sm" variant="outline" className="text-xs h-7 ml-auto" onClick={handleRunForumBot} disabled={forumBotLoading}
            title="Força o agente de respostas do fórum a responder publicações pendentes agora, caso a automação agendada tenha falhado">
              {forumBotLoading ? <Loader2 size={13} className="animate-spin mr-1" /> : <RefreshCw size={13} className="mr-1" />}
              {forumBotLoading ? 'Respondendo...' : 'Responder fórum agora'}
            </Button>
          </div>
        }
      </div>

      {isTeacher && <ModuleUnlockPanel course={activeCourse} adminEmail={session?.email || ''} />}

      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar aluno..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        <div className="flex items-center gap-1 w-full sm:w-auto sm:ml-auto overflow-x-auto pb-1">
          <ArrowUpDown size={13} className="text-muted-foreground" />
          {[['alpha', 'A–Z'], ['points', 'Classificação'], ['participations', 'Atividades'], ['pending', 'Pendências']].map(([val, label]) =>

          <button key={val} onClick={() => setSortBy(val)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${sortBy === val ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
              {label}
            </button>
          )}
          {isTeacher &&
          <Button size="sm" variant="outline" className="text-xs" onClick={() => saveOrderMutation.mutate()} disabled={saveOrderMutation.isPending || customOrder.length === 0}
            title={activeModule ? `Salva a sequência e registra estes pontos no ${activeModuleLabel}` : 'Salva a sequência do total geral'}>
            {saveOrderMutation.isPending ? 'Salvando...' : activeModule ? `Salvar sequência no ${activeModuleLabel}` : 'Salvar sequência'}
          </Button>
          }
        </div>
      </div>

      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <Layers size={13} className="text-muted-foreground shrink-0" />
          <span className="text-[11px] font-semibold text-muted-foreground shrink-0 mr-1">Módulo:</span>
          {moduleOptions.map((moduleNumber) =>
          <button
            key={moduleNumber}
            onClick={() => changeSelectedModule(String(moduleNumber))}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${Number(selectedModule) === moduleNumber ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
              Módulo {moduleNumber}
            </button>
          )}
        </div>
      </div>

      <Accordion type="multiple" defaultValue={['current']} className="space-y-3">
        <AccordionItem value="current" className="bg-card border border-border rounded-2xl px-4 border-b-0">
          <AccordionTrigger className="hover:no-underline py-3.5">
            <div className="flex items-center gap-2.5">
              <Trophy size={16} className="text-yellow-500" />
              <span className="font-bold text-sm text-foreground">Ranking Atual</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
      {isLoading ?
      <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded-2xl animate-pulse" />)}</div> :
      filtered.length === 0 ?
      <div className="text-center py-16 text-muted-foreground">
          <Users size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-semibold">Nenhum aluno encontrado</p>
        </div> :

      <div className="space-y-2">
          {customOrder.map((orderedRow, index) => {
          const { code, hasPending, totalScore, participations, pontuacaoAutomatica, participacoesCalculadas, manualScoreActive, manualParticipationsActive } = resolveRow(orderedRow);
          const displayName = code.profile_name || code.student_name || 'Sem nome';
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
          const isEditingScoreRow = editingScore?.email === code.student_email;
          const isEditingParticipationsRow = editingParticipations?.email === code.student_email;
          // Os valores manuais são do total geral; com um módulo selecionado só exibimos o recalculado.
          const canEditManual = isTeacher && !activeModule;
          return (
            <div
              key={code.id}
              draggable={isTeacher && !isEditingScoreRow && !isEditingParticipationsRow}
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
                    {isTeacher && (
                canEditManual && isEditingParticipationsRow ?
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    value={editingParticipations.value}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setEditingParticipations({ email: code.student_email, value: e.target.value })}
                    className="w-16 h-8 text-xs" />
                        <Button
                    size="sm"
                    className="h-8 px-2"
                    title="Salvar atividades"
                    disabled={saveManualParticipationsMutation.isPending}
                    onClick={(e) => {
                      e.stopPropagation();
                      saveManualParticipationsMutation.mutate({ code, value: editingParticipations.value, active: true });
                    }}>
                          <Check size={13} />
                        </Button>
                        <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2"
                    title="Cancelar"
                    onClick={(e) => { e.stopPropagation(); setEditingParticipations(null); }}>
                          <X size={13} />
                        </Button>
                        <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-[10px] font-bold"
                    title="Voltar ao número calculado automaticamente"
                    disabled={saveManualParticipationsMutation.isPending}
                    onClick={(e) => {
                      e.stopPropagation();
                      saveManualParticipationsMutation.mutate({ code, value: participacoesCalculadas, active: false });
                    }}>
                          Auto
                        </Button>
                      </div> :

                <button
                  type="button"
                  disabled={!canEditManual}
                  title={activeModule ? `Atividades no ${activeModuleLabel}` : manualParticipationsActive ? 'Atividades definidas manualmente — clique para editar' : 'Aulas, tarefas, provas, fórum, mentorias, Terapeuta da Semana e ofensivas entregues — clique para editar'}
                  onClick={(e) => { e.stopPropagation(); if (!canEditManual) return; setEditingParticipations({ email: code.student_email, value: String(participations) }); }}
                  className={`flex items-center gap-1 bg-blue-50 border px-2.5 py-1.5 rounded-xl transition-colors ${canEditManual ? 'hover:border-blue-400' : 'cursor-default'} ${manualParticipationsActive ? 'border-blue-500 border-dashed' : 'border-blue-200'}`}>
                        <Activity size={11} className="text-blue-500" />
                        <span className="text-xs font-bold text-blue-700">{participations}</span>
                        {manualParticipationsActive && <span className="text-[9px] font-bold uppercase text-blue-600">manual</span>}
                        {canEditManual && <Pencil size={10} className="text-blue-500" />}
                      </button>
                )}
                    {isTeacher ? (
                canEditManual && isEditingScoreRow ?
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Input
                    type="text"
                    inputMode="decimal"
                    autoFocus
                    value={editingScore.value}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setEditingScore({ email: code.student_email, value: e.target.value })}
                    className="w-20 h-8 text-xs" />
                        <Button
                    size="sm"
                    className="h-8 px-2"
                    title="Salvar pontuação"
                    disabled={saveManualScoreMutation.isPending}
                    onClick={(e) => {
                      e.stopPropagation();
                      saveManualScoreMutation.mutate({
                        code,
                        value: roundScore(String(editingScore.value || 0).replace(',', '.')),
                        active: true,
                        calculada: pontuacaoAutomatica
                      });
                    }}>
                          <Check size={13} />
                        </Button>
                        <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2"
                    title="Cancelar"
                    onClick={(e) => { e.stopPropagation(); setEditingScore(null); }}>
                          <X size={13} />
                        </Button>
                        <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-[10px] font-bold"
                    title="Voltar à pontuação calculada automaticamente"
                    disabled={saveManualScoreMutation.isPending}
                    onClick={(e) => {
                      e.stopPropagation();
                      saveManualScoreMutation.mutate({ code, value: pontuacaoAutomatica, active: false, calculada: pontuacaoAutomatica });
                    }}>
                          Auto
                        </Button>
                      </div> :

                <button
                  type="button"
                  disabled={!canEditManual}
                  title={activeModule ? `Pontuação do ${activeModuleLabel}` : manualScoreActive ? `Pontuação manual (cálculo automático: ${formatScore(pontuacaoAutomatica)}) — clique para editar` : 'Pontos publicados — clique para editar'}
                  onClick={(e) => { e.stopPropagation(); if (!canEditManual) return; setEditingScore({ email: code.student_email, value: formatScore(totalScore) }); }}
                  className={`flex items-center gap-1 bg-yellow-50 border px-3 py-1.5 rounded-xl transition-colors ${canEditManual ? 'hover:border-yellow-400' : 'cursor-default'} ${manualScoreActive ? 'border-yellow-500 border-dashed' : 'border-yellow-200'}`}>
                        <Star size={11} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-black text-yellow-700">{formatScore(totalScore)}</span>
                        {manualScoreActive && <span className="text-[9px] font-bold uppercase text-yellow-600">manual</span>}
                        {canEditManual && <Pencil size={10} className="text-yellow-600" />}
                      </button>
                ) :

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
          </AccordionContent>
        </AccordionItem>

      </Accordion>
    </div>);

}
