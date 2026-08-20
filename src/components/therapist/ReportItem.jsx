import React, { useState } from 'react';
import { Trash2, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { formatScore } from '@/lib/scoreUtils';

export default function ReportItem({ report, isTeacher, onDelete }) {
  const [open, setOpen] = useState(false);
  const preview = (report.comment || '').length > 90
    ? report.comment.slice(0, 90).trim() + '…'
    : report.comment;

  return (
    <div className="border border-border rounded-xl bg-secondary/20 overflow-hidden">
      <div className="flex items-start justify-between gap-3 p-3.5">
        <button onClick={() => setOpen(o => !o)} className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-bold text-foreground">{report.authorName}</span>
            <span className={`text-[10px] font-semibold ${report.roleColor}`}>{report.roleLabel}</span>
            <span className="text-[10px] text-muted-foreground">· sobre {report.targetName}</span>
          </div>
          {!open && <p className="text-xs text-muted-foreground leading-relaxed">{preview}</p>}
          {open && (
            <>
              <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">{report.comment}</p>
              {typeof report.score === 'number' && (
                <div className="flex items-center gap-1 mt-2">
                  <Star size={11} className="text-primary fill-yellow-400" />
                  <span className="text-xs font-bold">{formatScore(report.score)}/10,000</span>
                </div>
              )}
            </>
          )}
        </button>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setOpen(o => !o)} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors" title={open ? 'Recolher' : 'Expandir'}>
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {isTeacher && onDelete && (
            <button
              onClick={() => {
                if (confirm('Excluir este relato permanentemente? Esta ação não pode ser desfeita.')) onDelete(report);
              }}
              className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
              title="Excluir relato"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}