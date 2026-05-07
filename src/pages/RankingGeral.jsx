import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trophy, Star, ChevronLeft, BookOpen, Video, FileText, MessageSquare, X, CheckCircle } from 'lucide-react';
import { ClickableStudent } from '@/components/shared/StudentProfileCard';
import { format } from 'date-fns';

const CATEGORY_CONFIG = {
  lesson: { label: 'Aula Gravada', icon: BookOpen, color: 'bg-purple-100 text-purple-700' },
  live_attendance: { label: 'Presença Live', icon: Video, color: 'bg-red-100 text-red-700' },
  task: { label: 'Tarefa', icon: FileText, color: 'bg-orange-100 text-orange-700' },
  quiz: { label: 'Prova', icon: Trophy, color: 'bg-blue-100 text-blue-700' },
  forum: { label: 'Fórum', icon: MessageSquare, color: 'bg-green-100 text-green-700' },
};

function StudentProfileModal({ code, scoreItems, onClose }) {
  const email = code.student_email || '';
  const displayName = code.profile_name || code.student_name || email;
  const photoUrl = code.profile_photo_url || '';
  const avatarColor = code.profile_avatar_color || '#5b5ef4';
  const myItems = scoreItems.filter(s => s.student_email === email && s.verified);
  const total = myItems.reduce((sum, s) => sum + (s.score || 0), 0);

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
              <span className="text-base font-black text-yellow-600">{total} pts</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-colors shrink-0">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        {/* Activities */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {Object.keys(CATEGORY_CONFIG).map(cat => {
            const items = byCategory[cat] || [];
            if (items.length === 0) return null;
            const cfg = CATEGORY_CONFIG[cat];
            const catTotal = items.reduce((sum, s) => sum + (s.score || 0), 0);
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-lg ${cfg.color}`}>
                    {React.createElement(cfg.icon, { size: 12 })}
                  </div>
                  <span className="text-xs font-bold text-foreground">{cfg.label}</span>
                  <span className="ml-auto text-xs font-bold text-yellow-600 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full">
                    {catTotal} pts
                  </span>
                </div>
                <div className="space-y-1.5">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-2 bg-secondary/40 rounded-xl px-3 py-2">
                      <CheckCircle size={12} className="text-green-500 shrink-0" />
                      <span className="text-xs text-foreground flex-1 truncate">{item.ref_title}</span>
                      <span className="text-xs font-bold text-foreground shrink-0">{item.score}/{item.max_score}</span>
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

export default function RankingGeral() {
  const { user: session } = useOutletContext();
  const [selected, setSelected] = useState(null);

  const { data: allScoreItems = [] } = useQuery({
    queryKey: ['all-score-items-rank'],
    queryFn: () => base44.entities.ScoreItem.list('-created_date', 2000),
  });

  const { data: accessCodes = [] } = useQuery({
    queryKey: ['access-codes'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 200),
  });

  // Build ranking from verified ScoreItems
  const rankMap = {};
  allScoreItems.filter(s => s.verified).forEach(s => {
    if (!s.student_email) return;
    if (!rankMap[s.student_email]) rankMap[s.student_email] = { email: s.student_email, total: 0, count: 0 };
    rankMap[s.student_email].total += (s.score || 0);
    rankMap[s.student_email].count += 1;
  });

  const ranking = Object.values(rankMap).sort((a, b) => b.total - a.total);
  const myPos = ranking.findIndex(r => r.email === session?.email) + 1;

  return (
    <div className="p-4 lg:p-7 max-w-3xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
          <Trophy size={22} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-foreground">Ranking Geral</h2>
          <p className="text-sm text-muted-foreground">Pontuação acumulada — clique para ver o perfil</p>
        </div>
        {myPos > 0 && (
          <span className="ml-auto text-sm font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-full border border-primary/20">
            Você está em #{myPos}
          </span>
        )}
      </div>

      {ranking.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Trophy size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-semibold">O ranking estará disponível após as primeiras notas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {ranking.map((r, i) => {
            const code = accessCodes.find(c => c.student_email === r.email);
            const displayName = code?.profile_name || code?.student_name || r.email;
            const avatarColor = code?.profile_avatar_color || '#5b5ef4';
            const photoUrl = code?.profile_photo_url || '';
            const isMe = r.email === session?.email;
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;

            return (
              <button
                key={r.email}
                onClick={() => code && setSelected(code)}
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

                {/* Name */}
                <div className="flex-1 min-w-0">
                 <p className={`text-sm font-bold truncate ${isMe ? 'text-primary' : 'text-foreground'}`}>
                   <ClickableStudent email={r.email}>{displayName}</ClickableStudent>
                   {isMe && <span className="text-xs font-normal text-primary/70 ml-1">(você)</span>}
                 </p>
                  <p className="text-xs text-muted-foreground">{r.count} atividade(s) pontuada(s)</p>
                </div>

                {/* Score */}
                <div className="flex items-center gap-1.5 shrink-0 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-xl">
                  <Star size={12} className="text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-black text-yellow-700">{r.total}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

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