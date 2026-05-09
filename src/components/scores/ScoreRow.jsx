import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const CATEGORY_CONFIG = {
  lesson: { iconColor: 'bg-purple-100 text-purple-700' },
  live_attendance: { iconColor: 'bg-red-100 text-red-700' },
  task: { iconColor: 'bg-orange-100 text-orange-700' },
  quiz: { iconColor: 'bg-blue-100 text-blue-700' },
  forum: { iconColor: 'bg-green-100 text-green-700' },
  therapist: { iconColor: 'bg-pink-100 text-pink-700' },
};

export default function ScoreRow({ category, icon: Icon, refId, refTitle, maxScore = 10, item, needsCorrection, onSave, saving, children }) {
  const [score, setScore] = useState(item?.score ?? '');
  const [notes, setNotes] = useState(item?.notes ?? '');

  useEffect(() => {
    setScore(item?.score ?? '');
    setNotes(item?.notes ?? '');
  }, [item?.id, item?.score, item?.notes]);

  const color = CATEGORY_CONFIG[category]?.iconColor || 'bg-secondary text-muted-foreground';

  return (
    <div className={`p-4 rounded-xl border transition-all ${needsCorrection ? 'border-red-300 bg-red-50/40' : item?.verified ? 'border-green-200 bg-green-50/30' : 'border-border bg-card'}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className={`p-1.5 rounded-lg shrink-0 ${color}`}>
          <Icon size={13} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-foreground leading-snug">{refTitle}</p>
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
          max={maxScore}
          step={0.1}
          placeholder={`0–${maxScore}`}
          value={score}
          onChange={e => setScore(e.target.value)}
          className="w-20 h-8 text-xs"
        />
        <span className="text-xs text-muted-foreground">/ {maxScore}</span>
        <Input
          placeholder="Observação"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="flex-1 h-8 text-xs min-w-[120px]"
        />
        <Button
          size="sm"
          className="h-8 text-xs px-3"
          onClick={() => onSave({ category, ref_id: refId, ref_title: refTitle, score: score || 0, max_score: maxScore, notes })}
          disabled={saving}
        >
          {item?.verified ? 'Atualizar' : 'Verificar'}
        </Button>
      </div>
    </div>
  );
}