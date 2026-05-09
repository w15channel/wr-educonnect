import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MessageCircle, Trophy, Crown, Star, Search, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import useCourseFilteredEmails from '@/hooks/useCourseFilteredEmails';
import { startOfWeek, format } from 'date-fns';

function getBrTime() {
  // GMT-3
  const now = new Date();
  return new Date(now.getTime() - 3 * 60 * 60 * 1000);
}

function StudentAvatar({ name, photoUrl, avatarColor, avatarEmoji, size = 56 }) {
  const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';
  const bg = avatarColor || '#5b5ef4';

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className="rounded-full object-cover ring-4 ring-white/30"
        style={{ width: size, height: size, border: `3px solid ${bg}` }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white ring-4 ring-white/30"
      style={{ width: size, height: size, backgroundColor: bg, fontSize: size * 0.34, border: `3px solid ${bg}` }}
    >
      {avatarEmoji ? <span style={{ fontSize: size * 0.45 }}>{avatarEmoji}</span> : initials}
    </div>
  );
}

function StudentCard({ profile, code, rank, isMonitor, monitorRank, isTopTask, session, navigate }) {
  const name = profile?.full_name || code?.profile_name || code?.student_name || code?.student_email || 'Aluno';
  const nickname = profile?.nickname || '';
  const photoUrl = profile?.photo_url || code?.profile_photo_url || '';
  const avatarColor = profile?.avatar_color || code?.profile_avatar_color || '#5b5ef4';
  const avatarEmoji = profile?.avatar_emoji || '';
  const bio = profile?.bio || '';
  const whatsapp = profile?.whatsapp || '';
  const email = code?.student_email || '';
  const points = profile?.points || 0;

  const isMe = session?.email === email;

  const handleDM = (e) => {
    e.stopPropagation();
    if (email && !isMe) navigate(`/dm/${encodeURIComponent(email)}`);
  };

  const handleWhatsapp = (e) => {
    e.stopPropagation();
    if (whatsapp) {
      const num = whatsapp.replace(/\D/g, '');
      window.open(`https://wa.me/${num}`, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col items-center gap-3 text-center shadow-sm hover:shadow-lg hover:border-white/20 transition-all duration-200">
      {/* Destaques/badges */}
      <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
        {isMonitor && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-400 border border-yellow-400/30">
            <Crown size={9} /> Monitor
            {monitorRank && <span>#{monitorRank}</span>}
          </span>
        )}
        {isTopTask && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-400 border border-emerald-400/30">
            <Star size={9} /> Top Tarefas
          </span>
        )}
      </div>

      {/* Posição no ranking */}
      {rank && (
        <div className="absolute top-3 left-3">
          <span className="text-[10px] font-bold text-primary/70 bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-full">
            #{rank}
          </span>
        </div>
      )}

      {/* Avatar */}
      <StudentAvatar
        name={name}
        photoUrl={photoUrl}
        avatarColor={avatarColor}
        avatarEmoji={avatarEmoji}
        size={64}
      />

      {/* Info */}
      <div className="w-full min-w-0">
        <p className="font-bold text-foreground text-sm leading-tight truncate">{name}</p>
        {nickname && <p className="text-xs text-muted-foreground truncate">"{nickname}"</p>}
        {bio && <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-snug">{bio}</p>}
        {points > 0 && (
          <div className="flex items-center justify-center gap-1 mt-1.5">
            <Trophy size={11} className="text-yellow-500" />
            <span className="text-[11px] font-bold text-yellow-600">{points} pts</span>
          </div>
        )}
      </div>

      {/* Actions */}
      {!isMe && (
        <div className="flex gap-2 w-full mt-1">
          <button
            onClick={handleDM}
            className="flex-1 flex items-center justify-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl py-2 text-xs font-bold transition-colors"
          >
            <MessageCircle size={13} /> Mensagem
          </button>
          {whatsapp && (
            <button
              onClick={handleWhatsapp}
              className="flex-1 flex items-center justify-center gap-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-600 border border-green-500/20 rounded-xl py-2 text-xs font-bold transition-colors"
            >
              <Phone size={13} /> WhatsApp
            </button>
          )}
        </div>
      )}
      {isMe && (
        <span className="text-[10px] text-primary font-bold bg-primary/10 px-3 py-1 rounded-full border border-primary/20">Você</span>
      )}
    </div>
  );
}

export default function Classe() {
  const { user: session } = useOutletContext();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { emails: courseEmails, course: routeCourse, codePrefix } = useCourseFilteredEmails();
  const activeCourse = routeCourse || session?.course || 'tcc';

  const { data: codes = [], isLoading: loadingCodes } = useQuery({
    queryKey: ['access-codes'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 200),
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['student-profiles'],
    queryFn: () => base44.entities.StudentProfile.list('-created_date', 200),
  });

  const { data: scoreItems = [] } = useQuery({
    queryKey: ['score-items-classe'],
    queryFn: () => base44.entities.ScoreItem.list('-created_date', 2000),
  });

  const { data: monitorHistory = [] } = useQuery({
    queryKey: ['monitor-history'],
    queryFn: () => base44.entities.MonitorHistory.list('-period_start', 50),
  });

  // Current week monitors
  const today = new Date();
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const currentMonitors = monitorHistory.filter(m =>
    m.period_start === weekStart && (m.course === activeCourse || (!m.course && activeCourse === 'tcc'))
  );
  const monitorEmails = new Set(currentMonitors.map(m => m.student_email));

  // Filter emails by route course (/tcc => only EDU- students)
  const courseEmailSet = courseEmails || new Set(
    codes
      .filter(c => c.course === activeCourse && c.student_email && (!codePrefix || (c.code || '').startsWith(codePrefix)))
      .map(c => c.student_email)
  );

  // Ranking filtrado por curso
  const rankMap = {};
  scoreItems.filter(s => s.verified).forEach(s => {
    if (!s.student_email) return;
    if (courseEmailSet && !courseEmailSet.has(s.student_email)) return;
    if (!rankMap[s.student_email]) rankMap[s.student_email] = { total: 0, taskTotal: 0 };
    rankMap[s.student_email].total += (s.score || 0);
    if (s.category === 'task' || s.category === 'quiz') {
      rankMap[s.student_email].taskTotal += (s.score || 0);
    }
  });
  const rankingList = Object.entries(rankMap).sort((a, b) => b[1].total - a[1].total);
  const rankPosition = {};
  rankingList.forEach(([email], idx) => { rankPosition[email] = idx + 1; });

  // Top task scorer
  const topTaskEntry = Object.entries(rankMap).sort((a, b) => b[1].taskTotal - a[1].taskTotal)[0];
  const topTaskEmail = topTaskEntry?.[0];

  // Active students filtered by same course as logged-in student
  const activeStudents = codes.filter(c =>
    c.is_active !== false &&
    c.student_email &&
    (!codePrefix || (c.code || '').startsWith(codePrefix)) &&
    (!courseEmailSet || courseEmailSet.has(c.student_email))
  );

  // Merge profile data
  const students = activeStudents.map(code => {
    const profile = profiles.find(p => p.student_email === code.student_email);
    return { code, profile };
  });

  // Sort alphabetically
  const sorted = [...students].sort((a, b) => {
    const nameA = (a.profile?.full_name || a.code?.profile_name || a.code?.student_name || '').toLowerCase();
    const nameB = (b.profile?.full_name || b.code?.profile_name || b.code?.student_name || '').toLowerCase();
    return nameA.localeCompare(nameB, 'pt-BR');
  });

  // Filter by search
  const filtered = sorted.filter(({ code, profile }) => {
    const name = (profile?.full_name || code?.profile_name || code?.student_name || '').toLowerCase();
    const nick = (profile?.nickname || '').toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || nick.includes(q);
  });

  return (
    <div className="p-4 lg:p-7 max-w-6xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl lg:text-2xl font-bold text-foreground">Classe</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Conheça seus colegas de turma</p>
      </div>

      {/* Destaques da semana */}
      {(currentMonitors.length > 0 || topTaskEmail) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {currentMonitors.length > 0 && (
            <div className="bg-yellow-500/5 backdrop-blur-md border border-yellow-400/20 rounded-2xl p-4 flex items-center gap-3">
              <Crown size={28} className="text-yellow-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-yellow-600 uppercase tracking-wide">Monitores da Semana</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {currentMonitors.sort((a, b) => a.rank_position - b.rank_position).map(m => (
                    <span key={m.id} className="text-xs font-semibold text-foreground bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-full">
                      {m.rank_position === 1 ? '🥇' : m.rank_position === 2 ? '🥈' : '🥉'} {m.student_name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          {topTaskEmail && (
            <div className="bg-emerald-500/5 backdrop-blur-md border border-emerald-400/20 rounded-2xl p-4 flex items-center gap-3">
              <Star size={28} className="text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Maior Pontuador em Tarefas</p>
                <p className="text-sm font-bold text-foreground mt-0.5">
                  {(() => {
                    const c = codes.find(c => c.student_email === topTaskEmail);
                    const p = profiles.find(p => p.student_email === topTaskEmail);
                    return p?.full_name || c?.profile_name || c?.student_name || topTaskEmail;
                  })()}
                </p>
                <p className="text-xs text-muted-foreground">{rankMap[topTaskEmail]?.taskTotal || 0} pontos em tarefas</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar colega por nome ou apelido..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      {/* Grid */}
      {loadingCodes ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-card rounded-2xl border border-border animate-pulse h-52" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-semibold">Nenhum aluno encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(({ code, profile }) => (
            <StudentCard
              key={code.id}
              code={code}
              profile={profile}
              rank={rankPosition[code.student_email]}
              isMonitor={monitorEmails.has(code.student_email)}
              monitorRank={currentMonitors.find(m => m.student_email === code.student_email)?.rank_position}
              isTopTask={code.student_email === topTaskEmail}
              session={session}
              navigate={navigate}
            />
          ))}
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground mt-6">{filtered.length} aluno{filtered.length !== 1 ? 's' : ''} na turma</p>
    </div>
  );
}