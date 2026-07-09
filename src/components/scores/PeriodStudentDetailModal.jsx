import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Star, BookOpen, Heart, Trophy, MessageSquare, CheckCircle, CircleHelp } from 'lucide-react';
import { formatScore, rankingScoreValue, sumRoundedScores, parseUtcDate } from '@/lib/scoreUtils';

const CATEGORY_CONFIG = {
  lesson:          { label: 'Aula Gravada',              icon: BookOpen,      color: 'bg-purple-100 text-purple-700' },
  task:            { label: 'Atividade Complementar',    icon: Heart,         color: 'bg-pink-100 text-pink-700' },
  exam:            { label: 'Prova / Avaliação',          icon: Trophy,        color: 'bg-blue-100 text-blue-700' },
  forum:           { label: 'Fórum / Debates / Ofensiva', icon: MessageSquare, color: 'bg-green-100 text-green-700' },
  live_attendance: { label: 'Presença em Live',           icon: CheckCircle,   color: 'bg-sky-100 text-sky-700' },
  therapist:       { label: 'Atividade Complementar',    icon: Heart,         color: 'bg-pink-100 text-pink-700' },
  other:           { label: 'Outras Pontuações',          icon: CircleHelp,    color: 'bg-slate-100 text-slate-700' },
};

// Mostra o detalhamento por categoria das atividades de um aluno dentro da janela
// de um período já encerrado (entre o corte anterior e o corte deste período).
export default function PeriodStudentDetailModal({ email, name, points, periodStart, periodEnd, onClose }) {
  const { data: allScoreItems = [] } = useQuery({
    queryKey: ['period-detail-score-items', email],
    queryFn: () => base44.entities.ScoreItem.filter({ student_email: email }, '-created_date', 2000),
  });

  const byCategory = useMemo(() => {
    const seen = new Map();
    for (const s of allScoreItems) {
      if (!s.verified || !s.category || !s.ref_id) continue;
      const created = parseUtcDate(s.created_date);
      if (!created) continue;
      if (periodStart && created <= periodStart) continue;
      if (periodEnd && created > periodEnd) continue;
      const key = `${s.category}|${s.ref_id}`;
      const prev = seen.get(key);
      if (!prev || (Number(prev.score) || 0) < (Number(s.score) || 0)) seen.set(key, s);
    }
    const grouped = {};
    for (const item of seen.values()) {
      const normalized = item.category === 'quiz' ? 'exam' : item.category;
      const category = CATEGORY_CONFIG[normalized] ? normalized : 'other';
      grouped[category] = grouped[category] || [];
      grouped[category].push(item);
    }
    return grouped;
  }, [allScoreItems, periodStart, periodEnd]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-border flex items-center gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-black text-white shrink-0 bg-primary">
            {name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-foreground truncate">{name}</h3>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
              <span className="text-base font-black text-yellow-600">{formatScore(points)} pts</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-colors shrink-0">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {Object.keys(CATEGORY_CONFIG).map((cat) => {
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
                  <span className="ml-auto text-xs font-bold text-yellow-600 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full">
                    {formatScore(catTotal)} pts
                  </span>
                </div>
                <div className="space-y-1.5">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 bg-secondary/40 rounded-xl px-3 py-2">
                      <CheckCircle size={12} className="text-green-500 shrink-0" />
                      <span className="text-xs text-foreground flex-1 truncate">{item.ref_title}</span>
                      <span className="text-xs font-bold text-foreground shrink-0">{formatScore(item.score)} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {Object.keys(byCategory).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma atividade registrada neste período.</p>
          )}
        </div>
      </div>
    </div>
  );
}