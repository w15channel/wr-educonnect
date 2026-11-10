import React, { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { Pencil, Trash2, Share2, Pin, PinOff, Megaphone } from 'lucide-react';
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

const PIN_MARKER_RE = /^📌\[PIN:(\d{4}-\d{2}-\d{2})\]\s*/;
const ANNOUNCEMENT_REGEX = /^📢\[COMUNICADO:([^|\]]+)(?:\|([^\]]*))?\]\s*\n?([\s\S]*)$/;

const CATEGORY_MAP = {
  geral: { label: 'Aviso Geral', color: 'text-blue-600 dark:text-blue-400' },
  ao_vivo: { label: 'Aula ao Vivo', color: 'text-emerald-600 dark:text-emerald-400' },
  prazos: { label: 'Prazo Acadêmico', color: 'text-amber-600 dark:text-amber-400' },
  dica: { label: 'Dica Pedagógica', color: 'text-indigo-600 dark:text-indigo-400' },
  superacao: { label: 'Palavra de Força', color: 'text-rose-600 dark:text-rose-400' },
};

export default function ChatMessageItem({
  msg,
  isMe,
  isAdmin,
  name,
  email,
  time,
  onEdit,
  onDelete,
  onShare,
  onShareExternal,
  sharing,
  shared,
  reactions,
  isPinned,
  pinnedUntil,
}) {
  const [showPinMenu, setShowPinMenu] = useState(false);
  const queryClient = useQueryClient();
  const { user: session } = useOutletContext();
  const adminEmail = session?.email || '';
  const sessionId = msg.session_id || '';

  const rawContent = (msg.content || '')
    .replace(PIN_MARKER_RE, '')
    .replace('[MSN_ATTENTION]', '')
    .replace('[MSN_ACTION]', '')
    .trim();

  const announcementMatch = rawContent.match(ANNOUNCEMENT_REGEX);
  const isAnnouncement = Boolean(announcementMatch);
  const announcementCategory = announcementMatch ? announcementMatch[1] : null;
  const announcementTitle = announcementMatch ? announcementMatch[2] : null;
  const displayContent = announcementMatch ? announcementMatch[3] : rawContent;

  const effectivePinned = isPinned || Boolean(pinnedUntil);

  const invalidateWall = () => {
    if (sessionId) queryClient.invalidateQueries({ queryKey: ['overcoming-wall-messages', sessionId] });
    queryClient.invalidateQueries({ queryKey: ['overcoming-wall-bootstrap'] });
  };

  const adminPinMutation = useMutation({
    mutationFn: ({ messageId, durationDays }) =>
      base44.functions.invoke('manageOvercomingWall', {
        action: 'adminPinMessage',
        admin_email: adminEmail,
        message_id: messageId,
        duration_days: durationDays,
      }),
    onSuccess: () => {
      invalidateWall();
      toast.success('Publicação fixada no topo do mural.');
      setShowPinMenu(false);
    },
    onError: (error) => toast.error(error?.message || 'Não foi possível fixar.'),
  });

  const adminUnpinMutation = useMutation({
    mutationFn: (messageId) =>
      base44.functions.invoke('manageOvercomingWall', {
        action: 'adminUnpinMessage',
        admin_email: adminEmail,
        message_id: messageId,
      }),
    onSuccess: () => {
      invalidateWall();
      toast.success('Publicação desafixada.');
      setShowPinMenu(false);
    },
    onError: (error) => toast.error(error?.message || 'Não foi possível desafixar.'),
  });

  const adminDeleteMutation = useMutation({
    mutationFn: (messageId) =>
      base44.functions.invoke('manageOvercomingWall', {
        action: 'adminDeleteMessage',
        admin_email: adminEmail,
        message_id: messageId,
      }),
    onSuccess: () => {
      invalidateWall();
      toast.success('Mensagem excluída do mural.');
      setShowPinMenu(false);
    },
    onError: (error) => toast.error(error?.message || 'Não foi possível excluir.'),
  });

  // Estilização do card dependendo se é comunicado oficial, fixado ou mensagem regular
  const cardBorderClass = isAnnouncement
    ? effectivePinned
      ? 'border-rose-400/60 bg-gradient-to-br from-rose-500/10 via-card to-card dark:from-rose-950/30 ring-1 ring-rose-400/30'
      : 'border-rose-300/70 bg-rose-50/40 dark:border-rose-900/50 dark:bg-rose-950/20'
    : effectivePinned
    ? 'border-primary/40 bg-primary/5'
    : isMe
    ? 'border-rose-200 bg-rose-50/60 dark:border-white/20 dark:bg-black'
    : 'border-border/70 bg-background/85 dark:border-white/20 dark:bg-black';

  return (
    <article className={`min-w-0 rounded-xl border p-3 sm:p-4 transition-shadow ${cardBorderClass}`}>
      {/* Kicker institucional para Comunicados Oficiais */}
      {isAnnouncement && (
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-rose-200/50 dark:border-rose-900/40 pb-2">
          <div className="flex items-center gap-1.5">
            <Megaphone size={13} className="text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Comunicado Oficial
            </span>
            <span className="text-muted-foreground/60 text-xs">·</span>
            <span className={`text-[11px] font-semibold ${CATEGORY_MAP[announcementCategory]?.color || 'text-foreground'}`}>
              {CATEGORY_MAP[announcementCategory]?.label || 'Aviso'}
            </span>
          </div>

          {effectivePinned && (
            <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
              <Pin size={10} />
              Fixado{pinnedUntil ? ` até ${pinnedUntil.split('-').reverse().join('/')}` : ''}
            </span>
          )}
        </div>
      )}

      {/* Título de destaque do comunicado */}
      {isAnnouncement && announcementTitle && (
        <h3 className="mb-2 text-base sm:text-lg font-bold tracking-tight text-foreground">
          {announcementTitle}
        </h3>
      )}

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <ClickableStudent email={email} className="min-w-0 break-words text-sm font-semibold text-foreground">
          {name}
        </ClickableStudent>
        <span className="text-xs text-muted-foreground">{time}</span>

        {!isAnnouncement && effectivePinned && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
            <Pin size={10} /> Fixada{pinnedUntil ? ` até ${pinnedUntil.split('-').reverse().join('/')}` : ''}
          </span>
        )}

        <div className="ml-auto flex items-center gap-1">
          {isAdmin && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPinMenu((v) => !v)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                title="Fixar ou gerenciar"
                aria-label="Fixar ou gerenciar"
              >
                <Pin size={15} />
              </button>
              {showPinMenu && (
                <div className="absolute right-0 top-9 z-20 w-52 rounded-lg border border-border bg-card shadow-lg p-2 space-y-1">
                  {!effectivePinned ? (
                    <>
                      <p className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                        Fixar no topo
                      </p>
                      {PIN_DURATIONS.map((d) => (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => adminPinMutation.mutate({ messageId: msg.id, durationDays: d.value })}
                          disabled={adminPinMutation.isPending}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
                        >
                          <Pin size={12} /> {d.label}
                        </button>
                      ))}
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => adminUnpinMutation.mutate(msg.id)}
                      disabled={adminUnpinMutation.isPending}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
                    >
                      <PinOff size={12} /> Desafixar
                    </button>
                  )}
                  <div className="my-1 border-t border-border" />
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Excluir esta publicação do mural?')) adminDeleteMutation.mutate(msg.id);
                    }}
                    disabled={adminDeleteMutation.isPending}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={12} /> Excluir
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => onShareExternal(msg)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
            title="Compartilhar em aplicativos externos"
            aria-label="Compartilhar em aplicativos externos"
          >
            <Share2 size={15} />
          </button>

          {isMe && (
            <button
              type="button"
              onClick={() => onEdit(msg)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
              title="Editar minha mensagem"
              aria-label="Editar minha mensagem"
            >
              <Pencil size={15} />
            </button>
          )}
        </div>
      </div>

      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground dark:text-white">
        {displayContent}
      </p>

      {msg.updated_date && msg.updated_date !== msg.created_date && (
        <span className="text-xs italic text-muted-foreground block mt-1">editada</span>
      )}

      {isAdmin && (
        <button
          type="button"
          onClick={() => onShare(msg)}
          disabled={sharing || shared}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary disabled:opacity-50"
          title="Encaminhar para o Mural de Superação da dashboard dos alunos"
        >
          <Share2 size={13} />
          {shared ? 'No mural' : sharing ? 'Enviando...' : 'Compartilhar no mural'}
        </button>
      )}

      {reactions}
    </article>
  );
}