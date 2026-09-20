import React, { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { Pencil, Trash2, Share2, Pin, PinOff } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { ClickableStudent } from '@/components/shared/StudentProfileCard';

const PIN_DURATIONS = [
  { label: '1 dia', value: 1 },
  { label: '3 dias', value: 3 },
  { label: '7 dias', value: 7 },
  { label: '15 dias', value: 15 },
  { label: '30 dias', value: 30 },
  { label: '90 dias', value: 90 },
];

export default function ChatMessageItem({ msg, isMe, isAdmin, name, email, time, onEdit, onDelete, onShare, onShareExternal, sharing, shared, reactions, isPinned, pinnedUntil }) {
  const [showPinMenu, setShowPinMenu] = useState(false);
  const queryClient = useQueryClient();
  const { user: session } = useOutletContext();
  const adminEmail = session?.email || '';
  const sessionId = msg.session_id || '';
  const content = (msg.content || '').replace('[MSN_ATTENTION]', '').replace('[MSN_ACTION]', '').trim();

  const invalidateWall = () => {
    if (sessionId) queryClient.invalidateQueries({ queryKey: ['overcoming-wall-messages', sessionId] });
    queryClient.invalidateQueries({ queryKey: ['overcoming-wall-bootstrap'] });
  };

  const adminPinMutation = useMutation({
    mutationFn: ({ messageId, durationDays }) => base44.functions.invoke('manageOvercomingWall', {
      action: 'adminPinMessage', admin_email: adminEmail, message_id: messageId, duration_days: durationDays,
    }),
    onSuccess: () => { invalidateWall(); toast.success('Publicação fixada no topo do mural.'); setShowPinMenu(false); },
    onError: (error) => toast.error(error?.message || 'Não foi possível fixar.'),
  });

  const adminUnpinMutation = useMutation({
    mutationFn: (messageId) => base44.functions.invoke('manageOvercomingWall', {
      action: 'adminUnpinMessage', admin_email: adminEmail, message_id: messageId,
    }),
    onSuccess: () => { invalidateWall(); toast.success('Publicação desafixada.'); setShowPinMenu(false); },
    onError: (error) => toast.error(error?.message || 'Não foi possível desafixar.'),
  });

  const adminDeleteMutation = useMutation({
    mutationFn: (messageId) => base44.functions.invoke('manageOvercomingWall', {
      action: 'adminDeleteMessage', admin_email: adminEmail, message_id: messageId,
    }),
    onSuccess: () => { invalidateWall(); toast.success('Mensagem excluída do mural.'); setShowPinMenu(false); },
    onError: (error) => toast.error(error?.message || 'Não foi possível excluir.'),
  });

  return <article className={`min-w-0 rounded-xl border p-3 sm:p-4 ${isPinned ? 'border-primary/40 bg-primary/5' : isMe ? 'border-rose-200 bg-rose-50/60 dark:border-white/20 dark:bg-black' : 'border-border/70 bg-background/85 dark:border-white/20 dark:bg-black'}`}>
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <ClickableStudent email={email} className="min-w-0 break-words text-sm font-semibold text-foreground">{name}</ClickableStudent>
      <span className="text-xs text-muted-foreground">{time}</span>
      {isPinned && <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary"><Pin size={10}/> Fixada{pinnedUntil ? ` até ${pinnedUntil.split('-').reverse().join('/')}` : ''}</span>}
      <div className="ml-auto flex items-center gap-1">
        {isAdmin && (
          <div className="relative">
            <button type="button" onClick={() => setShowPinMenu(v => !v)} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" title="Fixar ou gerenciar" aria-label="Fixar ou gerenciar"><Pin size={15}/></button>
            {showPinMenu && (
              <div className="absolute right-0 top-9 z-20 w-52 rounded-lg border border-border bg-card shadow-lg p-2 space-y-1">
                {!isPinned ? (
                  <>
                    <p className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Fixar no topo</p>
                    {PIN_DURATIONS.map(d => (
                      <button key={d.value} type="button" onClick={() => adminPinMutation.mutate({ messageId: msg.id, durationDays: d.value })} disabled={adminPinMutation.isPending} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors disabled:opacity-50"><Pin size={12}/> {d.label}</button>
                    ))}
                  </>
                ) : (
                  <button type="button" onClick={() => adminUnpinMutation.mutate(msg.id)} disabled={adminUnpinMutation.isPending} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors disabled:opacity-50"><PinOff size={12}/> Desafixar</button>
                )}
                <div className="my-1 border-t border-border"/>
                <button type="button" onClick={() => { if (confirm('Excluir esta publicação do mural?')) adminDeleteMutation.mutate(msg.id); }} disabled={adminDeleteMutation.isPending} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"><Trash2 size={12}/> Excluir</button>
              </div>
            )}
          </div>
        )}
        <button type="button" onClick={() => onShareExternal(msg)} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" title="Compartilhar em aplicativos externos" aria-label="Compartilhar em aplicativos externos"><Share2 size={15}/></button>
        {isMe && <button type="button" onClick={() => onEdit(msg)} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" title="Editar minha mensagem" aria-label="Editar minha mensagem"><Pencil size={15}/></button>}
      </div>
    </div>
    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground dark:text-white">{content}</p>
    {msg.updated_date && msg.updated_date !== msg.created_date && <span className="text-xs italic text-muted-foreground">editada</span>}
    {isAdmin && <button type="button" onClick={() => onShare(msg)} disabled={sharing || shared} className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary disabled:opacity-50" title="Encaminhar para o Mural de Superação da dashboard dos alunos"><Share2 size={13}/>{shared ? 'No mural' : sharing ? 'Enviando...' : 'Compartilhar no mural'}</button>}
    {reactions}
  </article>;
}