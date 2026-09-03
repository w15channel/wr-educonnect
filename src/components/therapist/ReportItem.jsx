import React, { useState } from 'react';
import { Trash2, Star, ChevronDown, ChevronUp, Pencil, Send } from 'lucide-react';
import { formatScore } from '@/lib/scoreUtils';
import { base44 } from '@/api/base44Client';
import { REPORT_REACTIONS } from '@/lib/therapistReports';
import { toast } from 'sonner';

export default function ReportItem({ report, isTeacher, isOwn, session, activeCourse, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState('');
  const [reacted, setReacted] = useState(null);
  const preview = (report.comment || '').length > 90
    ? report.comment.slice(0, 90).trim() + '…'
    : report.comment;

  const sharePartnerReport = async () => {
    setBusy('share');
    try {
      await base44.functions.invoke('manageOvercomingWall', {
        action: 'publish', actor_email: session?.email, access_code: session?.code,
        course: activeCourse || session?.course || 'tcc', kind: 'testimonial',
        title: `Depoimento de ${report.authorName}`,
        message: `Recebi este depoimento sobre nosso atendimento: “${report.comment}”`,
        source_id: `therapist-testimonial:${report.id}`,
      });
      toast.success('Depoimento enviado ao Mural de Superação.');
    } catch (error) {
      toast.error(error?.message || 'Não foi possível compartilhar o depoimento.');
    } finally { setBusy(''); }
  };

  const react = async (reaction) => {
    if (busy || reacted) return;
    setBusy(reaction);
    try {
      const previous = await base44.entities.TherapistReportReaction.filter({
        report_key: report.id, actor_email: session?.email,
      }, '-created_date', 10);
      if (previous.length) {
        setReacted(previous[0].reaction);
        toast.info('Você já reagiu a este relato.');
        return;
      }
      await base44.entities.TherapistReportReaction.create({
        report_key: report.id, pairing_id: report.pairingId,
        report_author_email: report.authorEmail, actor_email: session?.email, reaction,
      });
      setReacted(reaction);
      toast.success('Sua reação foi enviada para a dupla.');
    } catch (error) {
      toast.error(error?.message || 'Não foi possível reagir.');
    } finally { setBusy(''); }
  };

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
                  <Star size={11} className="text-yellow-400 fill-yellow-400" />
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
          {!isTeacher && isOwn && onEdit && (
            <button onClick={() => onEdit(report)} className="p-1.5 text-muted-foreground hover:text-primary rounded-lg" title="Editar meu relato" aria-label="Editar meu relato"><Pencil size={14} /></button>
          )}
          {!isTeacher && isOwn && onDelete && (
            <button onClick={() => { if (confirm('Remover seu relato?')) onDelete(report); }} className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg" title="Remover meu relato" aria-label="Remover meu relato"><Trash2 size={14} /></button>
          )}
        </div>
      </div>
      {!isTeacher && !isOwn && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-border px-3.5 py-2.5">
          {REPORT_REACTIONS.map(({ key, label, emoji }) => (
            <button key={key} onClick={() => react(key)} disabled={!!busy || !!reacted} aria-label={`${label} este relato`} className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${reacted === key ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'}`}>
              {emoji} {label}
            </button>
          ))}
          <button onClick={sharePartnerReport} disabled={!!busy} className="ml-auto flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-bold text-primary-foreground disabled:opacity-50">
            <Send size={12} /> {busy === 'share' ? 'Enviando…' : 'Mural de Superação'}
          </button>
        </div>
      )}
    </div>
  );
}
