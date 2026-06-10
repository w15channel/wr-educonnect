import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trophy, Star, BookOpen, Video, FileText, MessageSquare, X, CheckCircle, RefreshCw } from 'lucide-react';
import { ClickableStudent } from '@/components/shared/StudentProfileCard';
import { formatScore, roundScore } from '@/lib/scoreUtils';

// ─── Config ──────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG = {
  lesson:          { label: 'Aula Gravada',  icon: BookOpen,       color: 'bg-purple-100 text-purple-700' },
  live_attendance: { label: 'Presença Live', icon: Video,          color: 'bg-red-100 text-red-700' },
  task:            { label: 'Tarefa',        icon: FileText,       color: 'bg-orange-100 text-orange-700' },
  quiz:            { label: 'Prova',         icon: Trophy,         color: 'bg-blue-100 text-blue-700' },
  forum:           { label: 'Fórum',         icon: MessageSquare,  color: 'bg-green-100 text-green-700' },
};

// For each AccessCode, which course field values map to it
const COURSE_VALID = {
  tcc:        (c) => !c.course || c.course === 'tcc',
  psicanalise: (c) => c.course === 'psicanalise',
  sexologia:  (c) => c.course === 'sexologia',
};

// ─── Modal ────────────────────────────────────────────────────────────────────

function StudentProfileModal({ code, scoreItems, onClose }) {
  const email = code.student_email || '';
  const displayName = code.profile_name || code.student_name || email;
  const photoUrl = code.profile_photo_url || '';
  const avatarColor = code.profile_avatar_color || '#5b5ef4';

  // Only verified items for this student — deduplicated by (category|ref_id)
  const myItems = useMemo(() => {
    const seen = new Map();
    for (const s of scoreItems) {
      if (s.student_email !== email || !s.verified || !s.category || !s.ref_id) continue;
      const key = `${s.category}|${s.ref_id}`;
      const prev = seen.get(key);
      if (!prev) { seen.set(key, s); continue; }
      const prevWins = (Number(prev.score) || 0) >= (Number(s.score) || 0);
      if (!prevWins) seen.set(key, s);
    }
    return [...seen.values()];
  }, [scoreItems, email]);

  // Show live sum — never rely on stale cache here
  const liveTotal = roundScore(myItems.reduce((sum, s) => roundScore(sum + roundScore(s.score)), 0));

  const byCategory = {};
  myItems.forEach(item => {
    if (!byCategory[item.category]) byCategory[item.category] = [];
    byCategory[item.category].push(item);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center gap-4">
          {photoUrl ? (
            <img src={photoUrl} alt={displayName} className="w-16 h-16 rounded-full object-cover border-2 border-primary/20" />
          ) : (
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-black text-white shrink-0" style={{ backgroundColor: avatarColor }}>
              {displayName?.charAt(0)?.toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-foreground truncate">{displayName}</h3>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
              <span className="text-base font-black text-yellow-600">{formatScore(liveTotal)} pts</span>
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
            const catTotal = items.reduce((sum, item) => roundScore(sum + roundScore(item.score)), 0);
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-lg ${cfg.color}`}>
                    {React.createElement(cfg.icon, { size: 12 })}
                  </div>
                  <span className="text-xs font-bold text-foreground">{cfg.label}</span>
                  <span className="ml-auto text-xs font-bold text-yellow-600 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full">
                    {formatScore(catTotal)} pts
                  </span>
                </div>
                <div className="space-y-1.5">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-2 bg-secondary/40 rounded-xl px-3 py-2">
                      <CheckCircle size={12} className="text-green-500 shrink-0" />
                      <span className="text-xs text-foreground flex-1 truncate">{item.ref_title}</span>
                      <span className="text-xs font-bold text-foreground shrink-0">{formatScore(item.score)}/{formatScore(item.max_score)}</span>
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
  const { data: allScoreItems = [], isLoading: loadingScores, refetch: refetchScores } = useQuery({
    queryKey: ['ranking-score-items'],
    queryFn: () => base44.entities.ScoreItem.list('-created_date', 5000),
    staleTime: 0,   // always fresh on mount
  });

  const { data: accessCodes = [], isLoading: loadingCodes, refetch: refetchCodes } = useQuery({
    queryKey: ['ranking-access-codes'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 500),
    staleTime: 0,
  });

  // ── Determine which course to show ──
  // Student: always their session course
  // Admin with session.course: that course
  // Admin without session.course: use adminCourseFilter picker
  const activeCourse = useMemo(() => {
    if (session?.course) return session.course;
    if (session?.role === 'admin') return adminCourseFilter;
    return 'tcc';
  }, [session, adminCourseFilter]);

  // ── Filter access codes for this course ──
  const courseCodes = useMemo(() => {
    return accessCodes.filter(c => {
      if (!c.student_email) return false;
      if (!activeCourse) return true; // admin with no course scope: show all
      const validator = COURSE_VALID[activeCourse];
      return validator ? validator(c) : c.course === activeCourse;
    });
  }, [accessCodes, activeCourse]);

  // Build a set of valid emails for this course (used to isolate ScoreItems)
  const courseEmailSet = useMemo(() => new Set(courseCodes.map(c => c.student_email)), [courseCodes]);

  // ── Deduplicate ScoreItems defensively before aggregating ──
  // Guard against race-condition duplicates: keep best item per (email|category|ref_id)
  const deduplicatedScoreItems = useMemo(() => {
    const seen = new Map(); // key → best ScoreItem
    for (const s of allScoreItems) {
      if (!s.student_email || !s.category || !s.ref_id) continue;
      const key = `${s.student_email}|${s.category}|${s.ref_id}`;
      const prev = seen.get(key);
      if (!prev) { seen.set(key, s); continue; }
      // Keep verified over unverified; higher score; more recent
      const prevWins =
        (prev.verified && !s.verified) ||
        (prev.verified === s.verified && (Number(prev.score) || 0) >= (Number(s.score) || 0));
      if (!prevWins) seen.set(key, s);
    }
    return [...seen.values()];
  }, [allScoreItems]);

  // ── Aggregate scores — only verified, only from course students ──
  const { scoreMap, participationMap } = useMemo(() => {
    const scoreMap = {};
    const participationMap = {};
    deduplicatedScoreItems.forEach(s => {
      if (!s.student_email) return;
      if (!courseEmailSet.has(s.student_email)) return; // isolate by course
      participationMap[s.student_email] = (participationMap[s.student_email] || 0) + 1;
      if (!s.verified) return;
      scoreMap[s.student_email] = roundScore((scoreMap[s.student_email] || 0) + roundScore(s.score));
    });
    return { scoreMap, participationMap };
  }, [deduplicatedScoreItems, courseEmailSet]);

  // ── Build and sort ranking ──
  const ranking = useMemo(() => {
    return courseCodes
      .map(c => {
        // Always use the live deduplicated sum — never the stale cache
        const liveSum = scoreMap[c.student_email] || 0;
        const total = roundScore(liveSum);
        return {
          email: c.student_email,
          total,
          count: participationMap[c.student_email] || 0,
          enrolledAt: c.created_date ? new Date(c.created_date).getTime() : Number.MAX_SAFE_INTEGER,
          name: (c.profile_name || c.student_name || c.student_email || '').toLowerCase(),
          code: c,
        };
      })
      .sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total;
        if (b.count !== a.count) return b.count - a.count;
        if (a.enrolledAt !== b.enrolledAt) return a.enrolledAt - b.enrolledAt;
        return a.name.localeCompare(b.name);
      });
  }, [courseCodes, scoreMap, participationMap]);

  const myPos = ranking.findIndex(r => r.email === session?.email) + 1;
  const isLoading = loadingScores || loadingCodes;

  const handleRefresh = () => {
    refetchScores();
    refetchCodes();
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-4 lg:p-7 max-w-3xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shrink-0">
          <Trophy size={22} className="text-white" />
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
                    ? 'bg-card border-yellow-200 hover:border-yellow-300'
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
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0"
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
                <div className="flex items-center gap-1.5 shrink-0 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-xl">
                  <Star size={12} className="text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-black text-yellow-700">{formatScore(r.total)}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Student modal */}
      {selected && (
        <StudentProfileModal
          code={selected}
          scoreItems={allScoreItems}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}