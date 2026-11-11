import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOutletContext, useLocation, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  Trophy, Activity, Search, ArrowLeft, BookOpen, FileText, GraduationCap,
  MessageSquare, Users, HeartHandshake, Flame, CheckCircle, RotateCcw,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { buildParticipationRanking } from '@/lib/participationUtils';
import { isExamPassed, resolveExamAccuracy } from '@/lib/autoCorrectionResponses';
import { getAvatarPrefixedName, getInitials, resolveAvatarEmoji } from '@/lib/avatarUtils';
import ModuleUnlockPanel from '@/components/scores/ModuleUnlockPanel';

const COURSE_LABELS = {
  tcc: 'TCC',
  psicanalise: 'Psicanálise',
  sexologia: 'Sexologia',
};

const normEmail = (v = '') => String(v || '').trim().toLowerCase();

function StudentParticipationDetail({ entry, data, onBack }) {
  const email = normEmail(entry.email);

  const watchedLessons = useMemo(() => {
    const lessonMap = new Map((data.lessons || []).map((l) => [l.id, l]));
    return (data.lessonProgresses || [])
      .filter((p) => p.watched && normEmail(p.student_email) === email && !String(p.lesson_id || '').startsWith('checklist:'))
      .map((p) => {
        const lid = String(p.lesson_id || '');
        if (lid.startsWith('apostila:')) return { id: p.id, title: `Apostila · ${lid.replace('apostila:', '').toUpperCase()}` };
        if (lid.startsWith('podcast:')) return { id: p.id, title: 'Episódio de Podcast concluído' };
        return { id: p.id, title: lessonMap.get(lid)?.title || 'Aula concluída' };
      });
  }, [data.lessons, data.lessonProgresses, email]);

  const submittedTasks = useMemo(() => {
    const taskMap = new Map((data.tasks || []).map((t) => [t.id, t]));
    return (data.taskSubmissions || [])
      .filter((s) => normEmail(s.student_email) === email)
      .map((s) => ({
        id: s.id,
        title: taskMap.get(s.task_id)?.title || 'Tarefa entregue',
        feedback: s.feedback,
      }));
  }, [data.tasks, data.taskSubmissions, email]);

  const studentExams = useMemo(() => {
    const examMap = new Map((data.exams || []).map((e) => [e.id, e]));
    return (data.examSubmissions || [])
      .filter((s) => normEmail(s.student_email) === email)
      .map((s) => ({
        id: s.id,
        title: examMap.get(s.exam_id)?.title || 'Prova',
        passed: isExamPassed(s),
        accuracy: resolveExamAccuracy(s),
        feedback: s.feedback,
      }));
  }, [data.exams, data.examSubmissions, email]);

  const forumItems = useMemo(() => {
    const posts = (data.forumPosts || [])
      .filter((p) => normEmail(p.author_email) === email && p.author_role !== 'teacher')
      .map((p) => ({ id: p.id, title: p.title || 'Tópico na Sala de Debates', kind: 'Tópico' }));
    const replies = (data.forumReplies || [])
      .filter((r) => normEmail(r.author_email) === email && r.author_role !== 'teacher')
      .map((r) => ({ id: r.id, title: String(r.content || '').slice(0, 80) || 'Comentário em debate', kind: 'Comentário' }));
    return [...posts, ...replies];
  }, [data.forumPosts, data.forumReplies, email]);

  const therapistItems = useMemo(() => {
    const items = [];
    (data.therapistPairings || []).forEach((p) => {
      if (normEmail(p.therapist_email) === email && p.therapist_submitted) {
        items.push({ id: `${p.id}-t`, title: `Relato como Terapeuta (${p.patient_name || p.patient_email})` });
      }
      if (normEmail(p.patient_email) === email && p.patient_submitted) {
        items.push({ id: `${p.id}-p`, title: `Relato como Paciente (${p.therapist_name || p.therapist_email})` });
      }
    });
    return items;
  }, [data.therapistPairings, email]);

  const mentorshipItems = useMemo(
    () =>
      (data.mentorships || [])
        .filter((m) => m.status !== 'cancelada' && (m.participant_emails || []).map(normEmail).includes(email))
        .map((m) => ({ id: m.id, title: m.title || 'Mentoria coletiva' })),
    [data.mentorships, email]
  );

  const ofensivaItems = useMemo(
    () =>
      (data.challengeResponses || [])
        .filter((r) => normEmail(r.student_email) === email && ((Number(r.questions_answered) || (r.answers || []).length) > 0))
        .map((r) => ({ id: r.id, title: `Ofensiva Diária · ${r.date || 'Concluída'}` })),
    [data.challengeResponses, email]
  );

  const summaryBoxes = [
    { label: 'Total Geral', value: entry.total, icon: Trophy },
    { label: 'Aulas / Apostila', value: entry.stats.lessons, icon: BookOpen },
    { label: 'Tarefas', value: entry.stats.tasks, icon: FileText },
    { label: 'Provas Aprovadas', value: entry.stats.exams, icon: GraduationCap },
    { label: 'Debates', value: entry.stats.forum, icon: MessageSquare },
    { label: 'Terapeuta Sem.', value: entry.stats.therapist, icon: HeartHandshake },
    { label: 'Mentorias', value: entry.stats.mentorships, icon: Users },
    { label: 'Ofensivas', value: entry.stats.ofensivas, icon: Flame },
  ];

  return (
    <div className="app-page max-w-4xl mx-auto animate-fade-in-up space-y-5">
      <Button variant="ghost" className="gap-2 -ml-2" onClick={onBack}>
        <ArrowLeft size={16} /> Voltar ao Ranking de Participações
      </Button>

      <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 flex-wrap">
        {entry.photoUrl ? (
          <img src={entry.photoUrl} alt={entry.name} className="w-14 h-14 rounded-full object-cover shrink-0" />
        ) : (
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-base font-bold text-white shrink-0"
            style={{ backgroundColor: entry.avatarColor }}
          >
            {entry.avatarEmoji || getInitials(entry.name)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-foreground truncate">{entry.name}</h2>
          <p className="text-xs text-muted-foreground truncate">{entry.email}</p>
        </div>
        <div className="text-right bg-primary/10 border border-primary/20 rounded-xl px-4 py-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Total de Atividades</p>
          <p className="text-2xl font-black text-primary">{entry.total}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {summaryBoxes.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-semibold">
              <Icon size={13} className="text-primary" />
              <span>{label}</span>
            </div>
            <p className="text-xl font-black text-foreground mt-1">{value}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="lessons" className="space-y-3">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="lessons" className="text-xs">Aulas ({watchedLessons.length})</TabsTrigger>
          <TabsTrigger value="tasks" className="text-xs">Tarefas ({submittedTasks.length})</TabsTrigger>
          <TabsTrigger value="exams" className="text-xs">Provas ({studentExams.length})</TabsTrigger>
          <TabsTrigger value="forum" className="text-xs">Debates ({forumItems.length})</TabsTrigger>
          <TabsTrigger value="other" className="text-xs">Práticas & Ofensivas ({therapistItems.length + mentorshipItems.length + ofensivaItems.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="lessons" className="space-y-2">
          {watchedLessons.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma aula concluída até o momento.</p>
          ) : (
            watchedLessons.map((item) => (
              <div key={item.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-foreground">{item.title}</span>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 shrink-0">
                  <CheckCircle size={13} /> Concluída
                </span>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-2">
          {submittedTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma tarefa entregue até o momento.</p>
          ) : (
            submittedTasks.map((item) => (
              <div key={item.id} className="bg-card border border-border rounded-xl px-4 py-3 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">{item.title}</span>
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 shrink-0">
                    <CheckCircle size={13} /> Participação registrada
                  </span>
                </div>
                {item.feedback && <p className="text-xs text-muted-foreground leading-relaxed">{item.feedback}</p>}
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="exams" className="space-y-2">
          {studentExams.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma prova realizada até o momento.</p>
          ) : (
            studentExams.map((item) => (
              <div key={item.id} className="bg-card border border-border rounded-xl px-4 py-3 space-y-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground">{item.title}</span>
                  {item.passed ? (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle size={13} /> Aprovado(a){item.accuracy !== null ? ` (${item.accuracy}%)` : ''}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                      <RotateCcw size={13} /> Repetir prova{item.accuracy !== null ? ` (${item.accuracy}%)` : ''}
                    </span>
                  )}
                </div>
                {item.feedback && <p className="text-xs text-muted-foreground leading-relaxed">{item.feedback}</p>}
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="forum" className="space-y-2">
          {forumItems.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma participação em debates registrada.</p>
          ) : (
            forumItems.map((item) => (
              <div key={item.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                <span className="text-sm text-foreground truncate">{item.title}</span>
                <span className="text-[11px] font-bold text-primary shrink-0">{item.kind}</span>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="other" className="space-y-2">
          {[...therapistItems, ...mentorshipItems, ...ofensivaItems].length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma prática complementar ou ofensiva registrada.</p>
          ) : (
            [...therapistItems, ...mentorshipItems, ...ofensivaItems].map((item) => (
              <div key={item.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                <span className="text-sm text-foreground">{item.title}</span>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 shrink-0">
                  <CheckCircle size={13} /> Realizada
                </span>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ScoreControl() {
  const { user: session } = useOutletContext();
  const isTeacher = session?.role === 'admin';
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedCourse, setSelectedCourse] = useState(session?.course || 'tcc');
  const [selectedModule, setSelectedModule] = useState('all');
  const [search, setSearch] = useState('');

  const activeCourse = isTeacher ? selectedCourse : (session?.course || 'tcc');

  const urlParams = new URLSearchParams(location.search);
  const detailEmail = urlParams.get('student');

  const { data: codes = [], isLoading: loadingCodes } = useQuery({
    queryKey: ['participation-codes'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 2000),
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['participation-profiles'],
    queryFn: () => base44.entities.StudentProfile.list('-updated_date', 5000),
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ['participation-lessons', activeCourse],
    queryFn: () => base44.entities.RecordedLesson.filter({ course: activeCourse }, 'order', 300),
  });

  const { data: lessonProgresses = [] } = useQuery({
    queryKey: ['participation-lesson-progress'],
    queryFn: () => base44.entities.LessonProgress.list('-created_date', 5000),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['participation-tasks', activeCourse],
    queryFn: () => base44.entities.Task.filter({ course: activeCourse }, '-created_date', 300),
  });

  const { data: taskSubmissions = [] } = useQuery({
    queryKey: ['participation-task-subs'],
    queryFn: () => base44.entities.TaskSubmission.list('-created_date', 3000),
  });

  const { data: exams = [] } = useQuery({
    queryKey: ['participation-exams', activeCourse],
    queryFn: () => base44.entities.Exam.filter({ course: activeCourse }, '-created_date', 300),
  });

  const { data: examSubmissions = [] } = useQuery({
    queryKey: ['participation-exam-subs', activeCourse],
    queryFn: () => base44.entities.ExamSubmission.filter({ course: activeCourse }, '-submitted_at', 2000),
  });

  const { data: forumPosts = [] } = useQuery({
    queryKey: ['participation-forum-posts', activeCourse],
    queryFn: () => base44.entities.ForumPost.filter({ course: activeCourse }, '-created_date', 1500),
  });

  const { data: forumReplies = [] } = useQuery({
    queryKey: ['participation-forum-replies'],
    queryFn: () => base44.entities.ForumReply.list('-created_date', 2000),
  });

  const { data: mentorships = [] } = useQuery({
    queryKey: ['participation-mentorships', activeCourse],
    queryFn: () => base44.entities.Mentorship.filter({ course: activeCourse }, '-date', 500),
  });

  const { data: therapistPairings = [] } = useQuery({
    queryKey: ['participation-pairings'],
    queryFn: () => base44.entities.TherapistPairing.list('-pairing_date', 500),
  });

  const { data: challengeResponses = [] } = useQuery({
    queryKey: ['participation-challenges', activeCourse],
    queryFn: () => base44.entities.DailyChallengeResponse.filter({ course: activeCourse }, '-date', 3000),
  });

  const { data: dailyChallenges = [] } = useQuery({
    queryKey: ['participation-daily-challenges', activeCourse],
    queryFn: () => base44.entities.DailyChallenge.filter({ course: activeCourse }, '-date', 500),
  });

  const activityData = useMemo(
    () => ({
      lessons,
      lessonProgresses,
      tasks,
      taskSubmissions,
      exams,
      examSubmissions,
      forumPosts,
      forumReplies,
      mentorships,
      therapistPairings,
      challengeResponses,
      dailyChallenges,
    }),
    [
      lessons,
      lessonProgresses,
      tasks,
      taskSubmissions,
      exams,
      examSubmissions,
      forumPosts,
      forumReplies,
      mentorships,
      therapistPairings,
      challengeResponses,
      dailyChallenges,
    ]
  );

  const ranking = useMemo(
    () =>
      buildParticipationRanking(codes, profiles, activityData, {
        course: activeCourse,
        moduleNumber: selectedModule === 'all' ? null : Number(selectedModule),
      }),
    [codes, profiles, activityData, activeCourse, selectedModule]
  );

  const filteredRanking = useMemo(() => {
    if (!search.trim()) return ranking;
    const q = search.trim().toLowerCase();
    return ranking.filter(
      (item) => item.name.toLowerCase().includes(q) || String(item.email || '').toLowerCase().includes(q)
    );
  }, [ranking, search]);

  const baseRoute = location.pathname.includes('/pontuacao-geral')
    ? location.pathname.replace(/\/detail$/, '')
    : (isTeacher ? '/adm/scorecontrol' : '/student/pontuacao-geral');

  if (detailEmail) {
    const selectedEntry = ranking.find((r) => normEmail(r.email) === normEmail(detailEmail));
    if (selectedEntry) {
      return (
        <StudentParticipationDetail
          entry={selectedEntry}
          data={activityData}
          onBack={() => navigate(baseRoute)}
        />
      );
    }
  }

  return (
    <div className="app-page max-w-4xl mx-auto animate-fade-in-up space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-foreground flex items-center gap-2">
            <Trophy size={22} className="text-yellow-500" />
            {isTeacher ? 'Controle de Participações' : 'Ranking Geral de Participações'}
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Classificação ordenada pela somatória total de atividades realizadas
          </p>
        </div>

        {isTeacher && (
          <div className="flex gap-1 bg-secondary p-1 rounded-xl self-start">
            {Object.entries(COURSE_LABELS).map(([slug, label]) => (
              <button
                key={slug}
                type="button"
                onClick={() => setSelectedCourse(slug)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedCourse === slug ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {isTeacher && <ModuleUnlockPanel course={activeCourse} adminEmail={session?.email || ''} />}

      {/* Filtro de escopo (Total Geral vs Módulo) + Busca */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar aluno por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <select
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
          className="h-9 rounded-lg border border-border bg-background px-3 text-xs font-bold text-foreground"
        >
          <option value="all">Somatória Geral (Todos os módulos)</option>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((modNum) => (
            <option key={modNum} value={String(modNum)}>
              Apenas Módulo {modNum}
            </option>
          ))}
        </select>
      </div>

      {/* Lista de Ranking */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loadingCodes ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Carregando participações...</div>
        ) : filteredRanking.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Nenhum aluno encontrado.</div>
        ) : (
          <div className="divide-y divide-border">
            {filteredRanking.map((item) => {
              const rankIdx = ranking.findIndex((r) => r.email === item.email);
              const pos = rankIdx + 1;
              const isMe = normEmail(item.email) === normEmail(session?.email);
              const displayWithEmoji = getAvatarPrefixedName(
                item.name,
                item.profile?.avatar_emoji || item.code?.profile_avatar_emoji
              );

              return (
                <div
                  key={item.email}
                  onClick={() => navigate(`${baseRoute}/detail?student=${encodeURIComponent(item.email)}`)}
                  className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-secondary/40 ${
                    isMe ? 'bg-primary/5' : ''
                  }`}
                >
                  <span className="w-8 text-center font-black text-sm shrink-0">
                    {pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : <span className="text-xs text-muted-foreground">#{pos}</span>}
                  </span>

                  {item.photoUrl ? (
                    <img src={item.photoUrl} alt={item.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: item.avatarColor }}
                    >
                      {resolveAvatarEmoji(item.profile?.avatar_emoji || item.code?.profile_avatar_emoji) || getInitials(item.name)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm truncate ${isMe ? 'font-bold text-primary' : 'font-semibold text-foreground'}`}>
                        {displayWithEmoji}
                        {isMe ? ' (você)' : ''}
                      </p>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {item.stats.lessons} aulas · {item.stats.tasks} tarefas · {item.stats.exams} provas · {item.stats.forum} debates · {item.stats.ofensivas} ofensivas
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full shrink-0">
                    <Activity size={13} className="text-primary" />
                    <span className="text-xs font-black text-primary">
                      {item.total} {item.total === 1 ? 'atividade' : 'atividades'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}