import React, { useState } from 'react';
import { Pin, PinOff, Trash2, Share2, Trophy, Lock, Megaphone, Bell, BookOpen, Sparkles, ChevronDown } from 'lucide-react';
import { ClickableStudent } from '@/components/shared/StudentProfileCard';

const PIN_DURATIONS = [
  { label: '1 dia', value: 1 },
  { label: '3 dias', value: 3 },
  { label: '7 dias', value: 7 },
  { label: '15 dias', value: 15 },
  { label: '30 dias', value: 30 },
];

export default function ChatFeedNotice({ msg, isPinned, pinnedUntil, readButton, isAdmin, shared, sharing, onShare, monitorMention, reactions, onPin, onUnpin, onDelete, pinLoading, deleteLoading }) {
  const [showPinMenu, setShowPinMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const privateNotice = msg.feedType === 'personal' || msg.feedType === 'notification';
  const achievement = msg.feedType === 'achievement';
  const institutional = msg.feedType === 'institutional';
  const isEncouragement = msg.feedType === 'encouragement';
  const canAdminControl = isAdmin && isEncouragement && (onPin || onUnpin || onDelete);

  const Icon = privateNotice ? Bell : achievement ? Sparkles : institutional ? (msg.icon === 'event' ? Bell : msg.icon === 'content' ? BookOpen : Megaphone) : Megaphone;
  const title = msg.feedType === 'personal' ? msg.title || 'Aviso para você' : msg.feedType === 'notification' ? (msg.type === 'wall_reply' ? 'Resposta privada' : 'Interação na sua conquista') : msg.feedType === 'institutional' ? msg.title || 'Destaque para a turma' : 'Conquista da turma';

  const wrapperClass = isPinned
    ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
    : privateNotice
    ? 'border-violet-200 bg-violet-50 text-violet-950'
    : achievement
    ? 'border-amber-200 bg-amber-50/80 dark:border-white dark:bg-white dark:text-black'
    : institutional
    ? 'border-sky-200 bg-gradient-to-r from-sky-50 to-indigo-50 text-slate-900 dark:border-sky-800 dark:from-sky-950/50 dark:to-indigo-950/50 dark:text-white'
    : 'border-border/70 bg-background/85 dark:border-white/20 dark:bg-black dark:text-white';

  const iconClass = privateNotice
    ? 'text-violet-600'
    : achievement
    ? 'text-amber-500'
    : institutional
    ? (msg.icon === 'event' ? 'text-indigo-600' : msg.icon === 'content' ? 'text-sky-600' : 'text-rose-600')
    : 'text-primary';

  const handlePin = (days) => {
    setShowPinMenu(false);
    onPin?.(days);
  };

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete?.();
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 4000);
    }
  };

  return <article className={`min-w-0 rounded-xl border p-3 text-sm leading-relaxed sm:p-4 ${wrapperClass}`}>
    <div className="mb-2 flex items-start gap-2">
      <Icon size={16} className={`mt-0.5 shrink-0 ${iconClass}`}/>
      <h2 className="min-w-0 flex-1 font-semibold text-foreground">{title}</h2>
      {isPinned && <span className="inline-flex items-center gap-1 shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
        <Pin size={10} /> Fixado{pinnedUntil ? ` até ${new Date(pinnedUntil + 'T23:59:59').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}` : ''}
      </span>}
    </div>

    {achievement ? <p className="whitespace-pre-wrap break-words text-foreground"><strong className="font-semibold">{msg.isCollective ? 'Monitores da semana!' : msg.studentName || 'Um colega da turma'}</strong> {msg.content}</p> : <p className="whitespace-pre-wrap break-words text-foreground">{privateNotice ? msg.message : msg.content}</p>}
    {msg.feedType === 'personal' && msg.related_email && <p className="mt-2 text-xs text-muted-foreground">Contato: <ClickableStudent email={msg.related_email} className="font-medium text-foreground">{msg.related_name || msg.related_email}</ClickableStudent></p>}
    {msg.feedType === 'notification' && msg.reply_text && <blockquote className="mt-2 rounded-lg border-l-2 border-primary bg-secondary/50 p-2 text-foreground">“{msg.reply_text}”</blockquote>}
    {privateNotice && <span className="mt-2 block text-xs text-muted-foreground">Visível somente para você</span>}
    {msg.feedType === 'institutional' && msg.author_name && <span className="mt-2 block text-xs text-muted-foreground">Compartilhado por {msg.author_name}</span>}
    {achievement && msg.isCollective && <div className="mt-3 grid gap-2 sm:grid-cols-3">{(msg.mentionedEmails || []).map((email) => monitorMention(email, msg.occurredAt))}</div>}

    {(readButton || (achievement && isAdmin) || canAdminControl) && (
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {readButton}
        {achievement && isAdmin && <button type="button" onClick={() => onShare(msg, 'achievement')} disabled={sharing || shared} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary disabled:opacity-50" title="Compartilhar conquista na dashboard dos alunos"><Share2 size={13}/>{shared ? 'No mural' : sharing ? 'Enviando...' : 'Compartilhar'}</button>}

        {/* ── Admin controls: pin / unpin / delete ── */}
        {canAdminControl && (
          <>
            {/* Pin / Unpin */}
            {isPinned ? (
              <button
                type="button"
                onClick={() => onUnpin?.()}
                disabled={pinLoading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
                title="Desafixar publicação"
              >
                <PinOff size={13} /> Desafixar
              </button>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPinMenu(v => !v)}
                  disabled={pinLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary disabled:opacity-50"
                  title="Fixar publicação no topo"
                >
                  <Pin size={13} /> Fixar <ChevronDown size={11} />
                </button>
                {showPinMenu && (
                  <div className="absolute top-full left-0 z-20 mt-1 rounded-lg border border-border bg-popover shadow-lg p-1 min-w-[120px]">
                    {PIN_DURATIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handlePin(opt.value)}
                        className="block w-full text-left rounded-md px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Delete */}
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteLoading}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium disabled:opacity-50 ${confirmDelete ? 'border-red-500 bg-red-500/10 text-red-600 hover:bg-red-500/20' : 'border-border text-muted-foreground hover:bg-secondary'}`}
              title={confirmDelete ? 'Clique novamente para confirmar' : 'Excluir publicação'}
            >
              <Trash2 size={13} /> {confirmDelete ? 'Confirmar?' : 'Excluir'}
            </button>
          </>
        )}
      </div>
    )}

    {achievement && reactions}
  </article>;
}