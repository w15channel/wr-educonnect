import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trophy, Star, BookOpen, MessageSquare, X, RefreshCw, CircleHelp, Heart, HandHeart, Archive, CheckCircle } from 'lucide-react';
import { ClickableStudent } from '@/components/shared/StudentProfileCard';
import { capScore, formatScore, rankingScoreValue, roundScore, sumRoundedScores, parseUtcDate } from '@/lib/scoreUtils';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import ModuleHistoryPanel from '@/components/scores/ModuleHistoryPanel';

// ─── Config ──────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG = {
  lesson:          { label: 'Aula Gravada',              icon: BookOpen,       color: 'bg-accent text-primary' },
  task:            { label: 'Atividade Complementar',    icon: Heart,          color: 'bg-accent text-primary' },
  exam:            { label: 'Prova / Avaliação',          icon: Trophy,         color: 'bg-accent text-primary' },
  forum:           { label: 'Fórum / Debates / Ofensiva', icon: MessageSquare, color: 'bg-accent text-primary' },
  mentorship:      { label: 'Mentoria',                    icon: HandHeart,     color: 'bg-accent text-primary' },
  therapist:       { label: 'Atividade Complementar',    icon: Heart,          color: 'bg-accent text-primary' },
  other:           { label: 'Outras Pontuações',          icon: CircleHelp,    color: 'bg-muted text-foreground' },
};

// For each AccessCode, which course field values map to it
const COURSE_VALID = {
  tcc:        (c) => !c.course || c.course === 'tcc',
  psicanalise: (c) => c.course === 'psicanalise',
  sexologia:  (c) => c.course === 'sexologia',
};

// ─── Modal ────────────────────────────────────────────────────────────────────

// courseItems: already-filtered ScoreItems for this student's course (passed from parent)
// publishedTotal: the pontuacao_total from AccessCode — single source of truth, same as outer list
function StudentProfileModal({ code, scoreItems, courseItemRefIds, publishedTotal, periodCutoff, onClose }) {
  const email = code.student_email || '';
  const displayName = code.profile_name || code.student_name || email;
  const photoUrl = code.profile_photo_url || '';
  const avatarColor = code.profile_avatar_color || '#5b5ef4';

  // All verified items for this student, deduplicated by (category|ref_id).
  // No courseItemRefIds filter here — we show everything so the sum is transparent.
  const myItems = useMemo(() => {
    const seen = new Map();
    for (const s of scoreItems) {
      if (s.student_email !== email || !s.verified || !s.category || !s.ref_id) continue;
      // Only include items that belong to the student's course
      if (courseItemRefIds && courseItemRefIds.size > 0 && !courseItemRefIds.has(s.ref_id)) continue;
      // Após o encerramento de período, só contam atividades registradas depois do corte
      if (periodCutoff) {
        const created = parseUtcDate(s.created_date);
        if (!created || created <= periodCutoff) continue;
      }
      const key = `${s.category}|${s.ref_id}`;
      const prev = seen.get(key);
      if (!prev) { seen.set(key, s); continue; }
      const prevWins = (Number(prev.score) || 0) >= (Number(s.score) || 0);
      if (!prevWins) seen.set(key, s);
    }
    return [...seen.values()];
  }, [scoreItems, email, courseItemRefIds, periodCutoff]);

  // Soma transparente dos itens verificados exibidos no modal.
  // Se houver total publicado maior que a soma dos itens, mostramos o ajuste para fechar a conta.
  const liveSum = sumRoundedScores(myItems.map(rankingScoreValue));
  const publishedAdjustment = roundScore(Math.max(0, roundScore(publishedTotal ?? 0) - liveSum));
  const liveTotal = roundScore(liveSum + publishedAdjustment);

  // Build exam bucket: prefer teacher-graded 'exam' items (ref_id = 'exam:{id}') over
  // auto-graded 'quiz' items for the same underlying exam. If a teacher-graded entry
  // exists for an exam, the quiz entry for that same exam is suppressed.
  const teacherGradedExamIds = new Set(
    myItems
      .filter(i => i.category === 'exam' && String(i.ref_id).startsWith('exam:'))
      .map(i => String(i.ref_id).replace('exam:', ''))
  );

  const byCategory = {};
  myItems.forEach(item => {
    // Suppress the generic 'quiz' entry if a teacher-graded 'exam' entry already covers this exam
    if (item.category === 'quiz' && teacherGradedExamIds.has(item.ref_id)) return;
    // Merge remaining 'quiz' into 'exam' bucket for display
    const normalized = item.category === 'quiz' ? 'exam' : item.category;
    const category = CATEGORY_CONFIG[normalized] ? normalized : 'other';
    if (!byCategory[category]) byCategory[category] = [];
    byCategory[category].push(item);
  });
  if (publishedAdjustment > 0) {
    byCategory.other = byCategory.other || [];
    byCategory.other.push({ id: 'published-adjustment', ref_title: 'Ajuste de pontuação publicada/cache', score: publishedAdjustment, max_score: publishedAdjustment });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4" onClick={onClose}>
      <div
        className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center gap-4">
          {photoUrl ? (
            <img src={photoUrl} alt={displayName} className="w-16 h-16 rounded-full object-cover border-2 border-primary/20" />
          ) : (
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-black text-primary-foreground shrink-0" style={{ backgroundColor: avatarColor }}>
              {displayName?.charAt(0)?.toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-foreground truncate">{displayName}</h3>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Star size={14} className="text-primary fill-yellow-400" />
              <span className="text-base font-black text-primary">{formatScore(liveTotal)} pts</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-colors shrink-0">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        {/* Activities by category */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {Object.keys(CATEGORY_CONFIG).map(cat => {
            const items = byCategory[cat] || [];
            if (items.length === 0) return null;
            const cfg = CATEGORY_CONFIG[cat];
            const catTotal = sumRoundedScores(items.map(rankingScoreValue));
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-lg ${cfg.color}`}>
                    {React.createElement(cfg.icon, { size: 12 })}
                  </div>
                  <span className="text-xs font-bold text-foreground">{cfg.label}</span>
                  <span className="ml-auto text-xs font-bold text-primary bg-accent border border-primary px-2 py-0.5 rounded-full">
                    {formatScore(catTotal)} pts
                  </span>
                </div>
                <div className="space-y-1.5">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-2 bg-secondary/40 rounded-xl px-3 py-2">
                      <CheckCircle size={12} className="text-primary shrink-0" />
                      <span className="text-xs text-foreground flex-1 truncate">{item.ref_title}</span>
                      <span className="text-xs font-bold text-foreground shrink-0">{formatScore(item.score)} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {myItems.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma atividade pontuada ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const COURSE_LABELS = {
  tcc: 'Terapia Cognitivo-Comportamental',
  psicanalise: 'Psicanalista Freudiano',
  sexologia: 'Sexólogo(a)',
};

export default function RankingGeral() {
  const { user: session } = useOutletContext();
  const [selected, setSelected] = useState(null);
  // Admin without a course in session gets a course picker
  const [adminCourseFilter, setAdminCourseFilter] = useState('tcc');

  // ── Fetch all data ──
  // Source of truth: pontuacao_total from AccessCode (set by admin via ScoreControl/Dashboard)
  // Same model as Dashboard ranking widget
  const { data: allScoreItems = [], isLoading: loadingScores, refetch: refetchScores } = useQuery({
    queryKey: ['ranking-score-items'],
    queryFn: () => base44.entities.ScoreItem.list('-created_date', 5000),
    staleTime: 0,
  });

  const { data: accessCodes = [], isLoading: loadingCodes, refetch: refetchCodes } = useQuery({
    queryKey: ['ranking-access-codes'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 500),
    staleTime: 0,
  });

  const { data: publishedProfiles = [], isLoading: loadingProfiles, refetch: refetchProfiles } = useQuery({
    queryKey: ['ranking-published-profiles'],
    queryFn: () => base44.entities.StudentProfile.list('-updated_date', 500),
    staleTime: 0,
  });

  // ── Course entity ref sets — used to isolate ScoreItems by course in the modal ──
  // These are the ref_ids that are valid for the active course.
  const activeCourseForQuery = useMemo(() => {
    if (session?.course) return session.course;
    return adminCourseFilter || 'tcc';
  }, [session, adminCourseFilter]);

  const { data: courseLessons = [] } = useQuery({
    queryKey: ['ranking-lessons', activeCourseForQuery],
    queryFn: () => base44.entities.RecordedLesson.filter({ course: activeCourseForQuery }, 'order', 500),
  });
  const { data: courseTasks = [] } = useQuery({
    queryKey: ['ranking-tasks', activeCourseForQuery],
    queryFn: () => base44.entities.Task.filter({ course: activeCourseForQuery }, '-created_date', 500),
  });
  const { data: courseExams = [] } = useQuery({
    queryKey: ['ranking-exams', activeCourseForQuery],
    queryFn: () => base44.entities.Exam.filter({ course: activeCourseForQuery }, '-created_date', 500),
  });
  const { data: courseForumPosts = [] } = useQuery({
    queryKey: ['ranking-forum', activeCourseForQuery],
    queryFn: () => base44.entities.ForumPost.filter({ course: activeCourseForQuery }, '-created_date', 2000),
  });
  const { data: allForumReplies = [] } = useQuery({
    queryKey: ['ranking-forum-replies'],
    queryFn: () => base44.entities.ForumReply.list('-created_date', 5000),
  });
  const { data: courseMentorships = [] } = useQuery({
    queryKey: ['ranking-mentorships', activeCourseForQuery],
    queryFn: () => base44.entities.Mentorship.filter({ course: activeCourseForQuery }, '-date', 1000),
  });

  // Fontes originais das atividades — usadas para o corte de período com a MESMA
  // lógica do painel admin (data do registro de origem, não do ScoreItem)
  const { data: allLessonProgress = [] } = useQuery({
    queryKey: ['ranking-lesson-progress'],
    queryFn: () => base44.entities.LessonProgress.list('-created_date', 5000),
  });
  const { data: allSubmissions = [] } = useQuery({
    queryKey: ['ranking-submissions'],
    queryFn: () => base44.entities.TaskSubmission.list('-created_date', 2000),
  });
  const { data: allMonitorHistory = [] } = useQuery({
    queryKey: ['ranking-monitor-history', activeCourseForQuery],
    queryFn: () => base44.entities.MonitorHistory.filter({ course: activeCourseForQuery }, '-period_start', 500),
  });

  // Terapeuta da Semana & Ofensivas — for courseItemRefIds
  const { data: allPairings = [] } = useQuery({
    queryKey: ['ranking-pairings'],
    queryFn: () => base44.entities.TherapistPairing.list('-pairing_date', 2000),
  });
  const { data: allChallengeResponses = [] } = useQuery({
    queryKey: ['ranking-challenge-responses', activeCourseForQuery],
    queryFn: () => base44.entities.DailyChallengeResponse.filter({ course: activeCourseForQuery }, '-created_date', 5000),
  });

  // Encerramentos de período — quando existe um, o ranking atual só conta
  // atividade registrada DEPOIS do corte, igualando alunos novos e antigos.
  const { data: moduleClosures = [] } = useQuery({
    queryKey: ['ranking-module-closures', activeCourseForQuery],
    queryFn: () => base44.entities.ModuleClosure.filter({ course: activeCourseForQuery }, '-module_number', 100),
  });
  const periodCutoff = useMemo(() => {
    return moduleClosures.reduce((latest, c) => {
      if (!c.closed_at) return latest;
      const d = new Date(c.closed_at);
      return !latest || d > latest ? d : latest;
    }, null);
  }, [moduleClosures]);
  const isAfterCutoff = (record) => {
    if (!periodCutoff) return true;
    const created = parseUtcDate(record?.created_date);
    return !created || created > periodCutoff;
  };

  // Build the set of all ref_ids valid for this course
  // This must mirror every ref_id pattern used in recalculateScores.
  const courseItemRefIds = useMemo(() => {
    const set = new Set();
    // Standard entities
    courseLessons.forEach(l => set.add(l.id));
    courseTasks.forEach(t => set.add(t.id));
    courseExams.forEach(e => { set.add(`exam:${e.id}`); set.add(e.id); });
    courseForumPosts.forEach(p => set.add(p.id));
    allForumReplies.forEach(r => set.add(r.id));
    courseMentorships.forEach(mentorship => set.add(mentorship.id));
    // Terapeuta da Semana: ref_id = `therapist_pairing:{id}:{role}`
    const courseEmailSet = new Set(
      accessCodes
        .filter(c => {
          if (!c.student_email) return false;
          const v = COURSE_VALID[activeCourseForQuery];
          return v ? v(c) : c.course === activeCourseForQuery;
        })
        .map(c => c.student_email)
    );
    allPairings.forEach(p => {
      if (courseEmailSet.has(p.therapist_email)) { set.add(`therapist_pairing:${p.id}:therapist`); set.add(p.id); }
      if (courseEmailSet.has(p.patient_email))   { set.add(`therapist_pairing:${p.id}:patient`); set.add(p.id); }
    });
    // Ofensivas: ref_id = `ofensiva:{challengeId}:{studentEmail}`
    allChallengeResponses.forEach(r => {
      set.add(`ofensiva:${r.challenge_id}:${r.student_email}`);
    });
    return set;
  }, [courseLessons, courseTasks, courseExams, courseForumPosts, allForumReplies, courseMentorships,
      allPairings, allChallengeResponses, accessCodes, activeCourseForQuery]);

  // ── Determine which course to show (same as activeCourseForQuery above) ──
  const activeCourse = activeCourseForQuery;

  // ── Filter access codes for this course ──
  const courseCodes = useMemo(() => {
    return accessCodes.filter(c => {
      if (!c.student_email) return false;
      if (!activeCourse) return true;
      const validator = COURSE_VALID[activeCourse];
      return validator ? validator(c) : c.course === activeCourse;
    });
  }, [accessCodes, activeCourse]);

  // ── Published score & rank maps (from StudentProfile — same as Dashboard) ──
  const { publishedScoreMap, publishedRankMap } = useMemo(() => {
    const publishedScoreMap = {};
    const publishedRankMap = {};
    publishedProfiles.forEach(p => {
      const isSameCourse = !p.dashboard_course || p.dashboard_course === activeCourse;
      if (!isSameCourse || !p.student_email) return;
      if (typeof p.points === 'number' && publishedScoreMap[p.student_email] === undefined) {
        publishedScoreMap[p.student_email] = p.points;
      }
      if (typeof p.dashboard_rank === 'number' && publishedRankMap[p.student_email] === undefined) {
        publishedRankMap[p.student_email] = p.dashboard_rank;
      }
    });
    return { publishedScoreMap, publishedRankMap };
  }, [publishedProfiles, activeCourse]);

  // ── Deduplicated score items (for participation count & modal detail) ──
  const deduplicatedScoreItems = useMemo(() => {
    const seen = new Map();
    for (const s of allScoreItems) {
      if (s.category === 'live_attendance') continue;
      if (!s.student_email || !s.category || !s.ref_id) continue;
      const key = `${s.student_email}|${s.category}|${s.ref_id}`;
      const prev = seen.get(key);
      if (!prev) { seen.set(key, s); continue; }
      const prevWins =
        (prev.verified && !s.verified) ||
        (prev.verified === s.verified && (Number(prev.score) || 0) >= (Number(s.score) || 0));
      if (!prevWins) seen.set(key, s);
    }
    return [...seen.values()];
  }, [allScoreItems]);

  const courseEmailSet = useMemo(() => new Set(courseCodes.map(c => c.student_email)), [courseCodes]);

  // Participation count: mesma lógica do painel admin (ScoreControl) — usa a data do
  // registro de ORIGEM (aula assistida, entrega, post, monitoria) para aplicar o corte
  // de período, evitando que um recálculo retroativo do ScoreItem "vaze" para o novo período.
  const lessonRefIds = useMemo(() => new Set(courseLessons.map(l => l.id)), [courseLessons]);
  const taskRefIds = useMemo(() => new Set(courseTasks.map(t => t.id)), [courseTasks]);
  const forumPostRefIds = useMemo(() => new Set(courseForumPosts.map(p => p.id)), [courseForumPosts]);
  const forumParentById = useMemo(() => new Map(courseForumPosts.map(p => [p.id, p])), [courseForumPosts]);

  const participationMap = useMemo(() => {
    const map = {};
    courseEmailSet.forEach(email => {
      const lessonCount = allLessonProgress.filter(p => p.student_email === email && lessonRefIds.has(p.lesson_id) && p.watched && isAfterCutoff(p)).length;
      const taskCount = allSubmissions.filter(s => s.student_email === email && taskRefIds.has(s.task_id) && isAfterCutoff(s)).length;
      const postCount = courseForumPosts.filter(p => p.author_email === email && isAfterCutoff(p)).length;
      const replyCount = allForumReplies.filter(r => {
        const parentPost = forumParentById.get(r.post_id);
        return r.author_email === email && parentPost && parentPost.author_email !== email && forumPostRefIds.has(parentPost.id) && isAfterCutoff(r);
      }).length;
      const monitorCount = allMonitorHistory.filter(m => m.student_email === email && isAfterCutoff(m)).length;
      const mentorshipCount = courseMentorships.filter(mentorship =>
        (mentorship.participant_emails || []).includes(email) && isAfterCutoff(mentorship)
      ).length;
      map[email] = lessonCount + taskCount + postCount + replyCount + monitorCount + mentorshipCount;
    });
    return map;
  }, [courseEmailSet, allLessonProgress, allSubmissions, courseForumPosts, allForumReplies, allMonitorHistory, courseMentorships, lessonRefIds, taskRefIds, forumPostRefIds, forumParentById, periodCutoff]);

  // ── Build and sort ranking — pontuação publicada é a fonte única da verdade,
  // igual ao painel admin (evita divergência quando o período foi encerrado) ──
  const ranking = useMemo(() => {
    return courseCodes
      .map(c => {
        const total = capScore(c.pontuacao_total ?? publishedScoreMap[c.student_email] ?? 0);
        const publishedRank = publishedRankMap[c.student_email] ?? Number.MAX_SAFE_INTEGER;
        return {
          email: c.student_email,
          total,
          publishedRank,
          count: participationMap[c.student_email] || 0,
          enrolledAt: c.created_date ? new Date(c.created_date).getTime() : Number.MAX_SAFE_INTEGER,
          name: (c.profile_name || c.student_name || c.student_email || '').toLowerCase(),
          code: c,
        };
      })
      .sort((a, b) => {
        if (a.total >= 100 && b.total >= 100 && b.count !== a.count) return b.count - a.count;
        // Respect admin-published rank order first (same as Dashboard)
        if (a.publishedRank !== b.publishedRank) return a.publishedRank - b.publishedRank;
        // Then by points
        if (b.total !== a.total) return b.total - a.total;
        // Then participation count
        if (b.count !== a.count) return b.count - a.count;
        // Then enrollment date (earlier = higher)
        if (a.enrolledAt !== b.enrolledAt) return a.enrolledAt - b.enrolledAt;
        return a.name.localeCompare(b.name);
      });
  }, [courseCodes, publishedScoreMap, publishedRankMap, participationMap]);

  const myPos = ranking.findIndex(r => r.email === session?.email) + 1;
  const isLoading = loadingScores || loadingCodes || loadingProfiles;

  const handleRefresh = () => {
    refetchScores();
    refetchCodes();
    refetchProfiles();
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-4 lg:p-7 max-w-3xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shrink-0">
          <Trophy size={22} className="text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl lg:text-2xl font-bold text-foreground">Ranking Geral</h2>
          <p className="text-sm text-muted-foreground">Classificação por somatória de pontos verificados</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {myPos > 0 && (
            <span className="text-sm font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-full border border-primary/20">
              #{myPos}
            </span>
          )}
          <button
            onClick={handleRefresh}
            className="p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            title="Atualizar ranking"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Admin course picker — only shown when admin has no scoped course */}
      {session?.role === 'admin' && !session?.course && (
        <div className="flex gap-2 mb-5 flex-wrap">
          {Object.entries(COURSE_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setAdminCourseFilter(key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                adminCourseFilter === key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border hover:border-primary/40'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Body */}
      <Accordion type="multiple" defaultValue={['current']} className="space-y-3">
        <AccordionItem value="current" className="bg-card border border-border rounded-2xl px-4 border-b-0">
          <AccordionTrigger className="hover:no-underline py-3.5">
            <div className="flex items-center gap-2.5">
              <Trophy size={16} className="text-primary" />
              <span className="font-bold text-sm text-foreground">Ranking Atual</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-16 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : ranking.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Trophy size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-semibold">O ranking estará disponível após as primeiras notas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {ranking.map((r, i) => {
            const displayName = r.code?.profile_name || r.code?.student_name || r.email;
            const avatarColor = r.code?.profile_avatar_color || '#5b5ef4';
            const photoUrl = r.code?.profile_photo_url || '';
            const isMe = r.email === session?.email;
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;

            return (
              <button
                key={r.email}
                onClick={() => r.code && setSelected(r.code)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all hover:shadow-md text-left ${
                  isMe
                    ? 'bg-primary/5 border-primary/25 hover:border-primary/40'
                    : i < 3
                    ? 'bg-card border-primary hover:border-primary'
                    : 'bg-card border-border hover:border-primary/20'
                }`}
              >
                {/* Position */}
                <span className="w-8 text-center shrink-0">
                  {medal ? (
                    <span className="text-xl">{medal}</span>
                  ) : (
                    <span className="text-sm font-bold text-muted-foreground">{i + 1}</span>
                  )}
                </span>

                {/* Avatar */}
                {photoUrl ? (
                  <img src={photoUrl} alt={displayName} className="w-10 h-10 rounded-full object-cover shrink-0 border border-border" />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-primary-foreground shrink-0"
                    style={{ backgroundColor: avatarColor }}
                  >
                    {displayName?.charAt(0)?.toUpperCase()}
                  </div>
                )}

                {/* Name + count */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${isMe ? 'text-primary' : 'text-foreground'}`}>
                    <ClickableStudent email={r.email}>{displayName}</ClickableStudent>
                    {isMe && <span className="text-xs font-normal text-primary/70 ml-1">(você)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{r.count} atividade(s)</p>
                </div>

                {/* Score badge */}
                <div className="flex items-center gap-1.5 shrink-0 bg-accent border border-primary px-3 py-1.5 rounded-xl">
                  <Star size={12} className="text-primary fill-yellow-500" />
                  <span className="text-sm font-black text-primary">{formatScore(r.total)}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="periods" className="bg-card border border-border rounded-2xl px-4 border-b-0">
          <AccordionTrigger className="hover:no-underline py-3.5">
            <div className="flex items-center gap-2.5">
              <Archive size={16} className="text-primary" />
              <span className="font-bold text-sm text-foreground">Ranking por Período</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <ModuleHistoryPanel course={activeCourse} filterEmail={session?.role === 'admin' ? null : session?.email} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Student modal */}
      {selected && (
        <StudentProfileModal
          code={selected}
          scoreItems={allScoreItems}
          courseItemRefIds={courseItemRefIds}
          publishedTotal={capScore(selected.pontuacao_total ?? publishedScoreMap[selected.student_email] ?? 0)}
          periodCutoff={periodCutoff}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
