import React, { useState } from 'react';
import { Pin, PinOff, Trash2, Share2, Megaphone, Bell, BookOpen, Sparkles, Gem } from 'lucide-react';
import { isContributionWallHighlight } from '@/lib/contributionAwards';
import { ClickableStudent } from '@/components/shared/StudentProfileCard';

const PIN_DURATIONS = [
  { label: '1 dia', value: 1 },
  { label: '3 dias', value: 3 },
  { label: '7 dias', value: 7 },
  { label: '15 dias', value: 15 },
  { label: '30 dias', value: 30 },
  { label: '90 dias', value: 90 },
];

export default function ChatFeedNotice({ msg, isPinned, pinnedUntil, readButton, isAdmin, shared, sharing, onShare, monitorMention, reactions, onPin, onUnpin, onDelete }) {
  const [showPinMenu, setShowPinMenu] = useState(false);
  const privateNotice = msg.feedType === 'personal' || msg.feedType === 'notification';
  const achievement = msg.feedType === 'achievement';
  const institutional = msg.feedType === 'institutional';
  const canAdminManage = isAdmin && msg.feedType === 'encouragement';
  const contributionAward = achievement && msg.kind === 'tuition';
  const contributionHighlight = isContributionWallHighlight(msg);

  const Icon = privateNotice ? Bell : contributionAward ? Gem : achievement ? Sparkles : institutional ? (msg.icon === 'event' ? Bell : msg.icon === 'content' ? BookOpen : Megaphone) : Megaphone;
  const title = msg.feedType === 'personal' ? msg.title || 'Aviso para você' : msg.feedType === 'notification' ? (msg.type === 'wall_reply' ? 'Resposta privada' : 'Interação na sua conquista') : msg.feedType === 'institutional' ? msg.title || 'Destaque para a turma' : contributionAward ? 'Diamante da Contribuição' : 'Conquista da turma';

  const wrapperClass = isPinned
    ? 'border-primary/40 bg-primary/5'
    : privateNotice
    ? 'border-violet-200 bg-violet-50 text-violet-950'
    : contributionAward
    ? 'border-cyan-300 bg-gradient-to-r from-cyan-50 via-sky-50 to-violet-50 shadow-sm shadow-cyan-200/60 dark:border-cyan-500/70 dark:from-cyan-950 dark:via-slate-950 dark:to-indigo-950 dark:shadow-cyan-950/50 dark:text-cyan-50'
    : achievement
    ? 'border-amber-200 bg-amber-50/80 dark:border-white dark:bg-white dark:text-black'
    : institutional
    ? 'border-sky-200 bg-gradient-to-r from-sky-50 to-indigo-50 text-slate-900 dark:border-sky-800 dark:from-sky-950/50 dark:to-indigo-950/50 dark:text-white'
    : 'border-border/70 bg-background/85 dark:border-white/20 dark:bg-black dark:text-white';

  const iconClass = privateNotice
    ? 'text-violet-600'
    : contributionAward
    ? 'text-cyan-700 dark:text-cyan-300'
    : achievement
    ? 'text-amber-500'
    : institutional
    ? (msg.icon === 'event' ? 'text-indigo-600' : msg.icon === 'content' ? 'text-sky-600' : 'text-rose-600')
    : 'text-primary';

  return <article className={`min-w-0 rounded-xl border p-3 text-sm leading-relaxed sm:p-4 ${wrapperClass}`}>
    <div className="mb-2 flex items-start gap-2">
      <Icon size={16} className={`mt-0.5 shrink-0 ${iconClass}`}/>
      <h2 className="min-w-0 flex-1 font-semibold text-foreground">{title}</h2>
      {(isPinned || contributionHighlight) && <Pin size={14} className="shrink-0 text-primary" aria-label={contributionHighlight ? 'Em destaque por 7 dias' : 'Fixado'}/>}
      {canAdminManage && (
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowPinMenu(v => !v)}
            className="rounded-lg p-1 text-muted-foreground hover:bg-secondary transition-colors"
            title="Gerenciar publicação"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
          </button>
          {showPinMenu && (
            <div className="absolute right-0 top-7 z-20 w-52 rounded-lg border border-border bg-card shadow-lg p-2 space-y-1">
              {!isPinned ? (
                <>
                  <p className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Fixar no topo</p>
                  {PIN_DURATIONS.map(d => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => { onPin?.(msg.id, d.value); setShowPinMenu(false); }}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors"
                    >
                      <Pin size={12} /> {d.label}
                    </button>
                  ))}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => { onUnpin?.(msg.id); setShowPinMenu(false); }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors"
                >
                  <PinOff size={12} /> Desafixar
                  {pinnedUntil && <span className="ml-auto text-[10px] text-muted-foreground">até {pinnedUntil.split('-').reverse().join('/')}</span>}
                </button>
              )}
              <div className="my-1 border-t border-border"/>
              <button
                type="button"
                onClick={() => { if (confirm('Excluir esta publicação do mural?')) { onDelete?.(msg.id); setShowPinMenu(false); } }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 size={12} /> Excluir
              </button>
            </div>
          )}
        </div>
      )}
    </div>
    {achievement ? <p className="whitespace-pre-wrap break-words text-foreground"><strong className="font-semibold">{msg.isCollective ? 'Monitores da semana!' : msg.studentName || 'Um colega da turma'}</strong> {msg.content}</p> : <p className="whitespace-pre-wrap break-words text-foreground">{privateNotice ? msg.message : msg.content}</p>}
    {contributionHighlight && <span className="mt-2 inline-flex rounded-full bg-cyan-600/10 px-2 py-1 text-[11px] font-bold text-cyan-700 dark:text-cyan-300">💎 Destaque da semana</span>}
    {msg.feedType === 'personal' && msg.related_email && <p className="mt-2 text-xs text-muted-foreground">Contato: <ClickableStudent email={msg.related_email} className="font-medium text-foreground">{msg.related_name || msg.related_email}</ClickableStudent></p>}
    {msg.feedType === 'notification' && msg.reply_text && <blockquote className="mt-2 rounded-lg border-l-2 border-primary bg-secondary/50 p-2 text-foreground">“{msg.reply_text}”</blockquote>}
    {privateNotice && <span className="mt-2 block text-xs text-muted-foreground">Visível somente para você</span>}
    {msg.feedType === 'institutional' && msg.author_name && <span className="mt-2 block text-xs text-muted-foreground">Compartilhado por {msg.author_name}</span>}
    {achievement && msg.isCollective && <div className="mt-3 grid gap-2 sm:grid-cols-3">{(msg.mentionedEmails || []).map((email) => monitorMention(email, msg.occurredAt))}</div>}
    {(readButton || (achievement && isAdmin)) && <div className="mt-3 flex flex-wrap gap-2">{readButton}{achievement && isAdmin && <button type="button" onClick={() => onShare(msg, 'achievement')} disabled={sharing || shared} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary disabled:opacity-50" title="Compartilhar conquista na dashboard dos alunos"><Share2 size={13}/>{shared ? 'No mural' : sharing ? 'Enviando...' : 'Compartilhar'}</button>}</div>}
    {achievement && reactions}
  </article>;
}
