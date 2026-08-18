import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatScore, roundScore } from '@/lib/scoreUtils';

const CATEGORY_CONFIG = {
  lesson: { iconColor: 'bg-purple-100 text-purple-700' },
  task: { iconColor: 'bg-orange-100 text-orange-700' },
  quiz: { iconColor: 'bg-blue-100 text-blue-700' },
  forum: { iconColor: 'bg-green-100 text-green-700' },
  therapist: { iconColor: 'bg-pink-100 text-pink-700' },
  ofensiva: { iconColor: 'bg-orange-100 text-red-600' },
};

export default function ScoreRow({ category, icon: Icon, refId, refTitle, maxScore = 10, item, needsCorrection, onSave, saving, readOnly = false, children }) {
  const [score, setScore] = useState(item?.score !== undefined && item?.score !== null ? formatScore(item.score) : '');
  const [notes, setNotes] = useState(item?.notes ?? '');

  useEffect(() => {
    setScore(item?.score !== undefined && item?.score !== null ? formatScore(item.score) : '');
    setNotes(item?.notes ?? '');
  }, [item?.id, item?.score, item?.notes]);

  const color = CATEGORY_CONFIG[category]?.iconColor || 'bg-secondary text-muted-foreground';
  const normalizedScore = roundScore(String(score || 0).replace(',', '.'));

  return (
    <div className={`p-3 sm:p-4 rounded-xl border transition-all max-w-full overflow-hidden ${needsCorrection ? 'border-red-300 bg-red-50/40' : item?.verified ? 'border-green-200 bg-green-50/30' : 'border-border bg-card'}`}>
      <div className="flex items-start gap-3 mb-3 min-w-0">
        <div className={`p-1.5 rounded-lg shrink-0 ${color}`}>
          <Icon size={13} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-foreground leading-snug break-words min-w-0">{refTitle}</p>
            {needsCorrection && <AlertCircle size={13} className="text-red-500 shrink-0" />}
          </div>
          {children}
        </div>
        {item?.verified && <CheckCircle size={15} className="text-green-600 shrink-0 mt-0.5" />}
      </div>
      {readOnly ? (
        <div className="flex items-center gap-2 flex-wrap mt-2 bg-secondary/50 rounded-xl px-3 py-2">
          <span className="text-xs font-semibold text-muted-foreground">Pontuação atribuída:</span>
          <span className="text-sm font-black text-primary">{item?.verified ? formatScore(item.score) : '—'}</span>
          <span className="text-xs text-muted-foreground">/ {formatScore(maxScore)}</span>
          {item?.notes && <span className="text-xs text-muted-foreground">• {item.notes}</span>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:flex sm:items-center gap-2 mt-2">
          <Input
            type="text"
            inputMode="decimal"
            placeholder={`0–${formatScore(maxScore)}`}
            value={score}
            onChange={e => setScore(e.target.value)}
            className="w-20 h-8 text-xs"
          />
          <span className="text-xs text-muted-foreground">/ {formatScore(maxScore)}</span>
          <Input
            placeholder="Observação"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="flex-1 h-8 text-xs min-w-[120px]"
          />
          <Button
            size="sm"
            className="h-8 text-xs px-3"
            onClick={() => onSave({ category, ref_id: refId, ref_title: refTitle || 'Item sem título', score: normalizedScore, max_score: roundScore(maxScore), notes })}
            disabled={saving}
          >
            {item?.verified ? 'Atualizar' : 'Verificar'}
          </Button>
        </div>
      )}
    </div>
  );
}