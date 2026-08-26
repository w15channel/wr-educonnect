import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Clock, CheckCircle2, Loader2 } from 'lucide-react';

const STATUS_META = {
  open: { label: 'Aguardando suporte', icon: Clock, className: 'text-amber-600 bg-amber-500/10 border-amber-500/20' },
  in_progress: { label: 'Em atendimento', icon: Loader2, className: 'text-blue-600 bg-blue-500/10 border-blue-500/20' },
  resolved: { label: 'Resolvido', icon: CheckCircle2, className: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' },
};

export default function SupportTicketCard({ ticket, isTeacher, onRespond, onChangeStatus }) {
  const [reply, setReply] = useState(ticket.support_response || '');
  const meta = STATUS_META[ticket.status] || STATUS_META.open;
  const Icon = meta.icon;

  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-sm text-foreground">{ticket.title}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {ticket.category || 'Outro assunto'}
            {isTeacher && ` · ${ticket.student_name || ticket.student_email}`}
            {ticket.created_date && ` · ${new Date(ticket.created_date).toLocaleString('pt-BR')}`}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1 shrink-0 text-[10px] font-bold px-2 py-1 rounded-full border ${meta.className}`}>
          <Icon size={10} /> {meta.label}
        </span>
      </div>

      <p className="text-sm text-foreground/80 mt-3 whitespace-pre-wrap">{ticket.description}</p>

      {ticket.support_response && (
        <div className="mt-3 rounded-xl bg-secondary/50 border border-border p-3">
          <p className="text-[10px] font-bold text-muted-foreground mb-1">Resposta do suporte</p>
          <p className="text-xs text-foreground/80 whitespace-pre-wrap">{ticket.support_response}</p>
        </div>
      )}

      {isTeacher && (
        <div className="mt-3 space-y-2">
          <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3} placeholder="Resposta para o aluno..." className="text-sm resize-none" />
          <div className="flex flex-wrap gap-2 justify-end">
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => onChangeStatus(ticket.id, 'in_progress')}>Em atendimento</Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => onChangeStatus(ticket.id, 'resolved')}>Marcar resolvido</Button>
            <Button size="sm" className="h-8 text-xs" disabled={!reply.trim()} onClick={() => onRespond(ticket.id, reply.trim())}>Enviar resposta</Button>
          </div>
        </div>
      )}
    </div>
  );
}