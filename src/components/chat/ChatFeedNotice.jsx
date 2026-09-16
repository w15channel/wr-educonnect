import React from 'react';
import { Pin, Share2, Trophy, Lock, Megaphone } from 'lucide-react';
import { ClickableStudent } from '@/components/shared/StudentProfileCard';

export default function ChatFeedNotice({ msg, isPinned, readButton, isAdmin, shared, sharing, onShare, monitorMention, reactions }) {
  const privateNotice = msg.feedType === 'personal' || msg.feedType === 'notification';
  const achievement = msg.feedType === 'achievement';
  const Icon = privateNotice ? Lock : achievement ? Trophy : Megaphone;
  const title = msg.feedType === 'personal' ? msg.title || 'Aviso para você' : msg.feedType === 'notification' ? (msg.type === 'wall_reply' ? 'Resposta privada' : 'Interação na sua conquista') : msg.feedType === 'institutional' ? msg.title || 'Destaque para a turma' : 'Conquista da turma';
  return <article className={`min-w-0 rounded-xl border p-3 text-sm leading-relaxed sm:p-4 ${isPinned ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'}`}>
    <div className="mb-2 flex items-start gap-2"><Icon size={16} className="mt-0.5 shrink-0 text-primary"/><h2 className="min-w-0 flex-1 font-semibold text-foreground">{title}</h2>{isPinned && <Pin size={14} className="shrink-0 text-primary"/>}</div>
    {achievement ? <p className="whitespace-pre-wrap break-words text-foreground"><strong className="font-semibold">{msg.isCollective ? 'Monitores da semana!' : msg.studentName || 'Um colega da turma'}</strong> {msg.content}</p> : <p className="whitespace-pre-wrap break-words text-foreground">{privateNotice ? msg.message : msg.content}</p>}
    {msg.feedType === 'personal' && msg.related_email && <p className="mt-2 text-xs text-muted-foreground">Contato: <ClickableStudent email={msg.related_email} className="font-medium text-foreground">{msg.related_name || msg.related_email}</ClickableStudent></p>}
    {msg.feedType === 'notification' && msg.reply_text && <blockquote className="mt-2 rounded-lg border-l-2 border-primary bg-secondary/50 p-2 text-foreground">“{msg.reply_text}”</blockquote>}
    {privateNotice && <span className="mt-2 block text-xs text-muted-foreground">Visível somente para você</span>}
    {msg.feedType === 'institutional' && msg.author_name && <span className="mt-2 block text-xs text-muted-foreground">Compartilhado por {msg.author_name}</span>}
    {achievement && msg.isCollective && <div className="mt-3 grid gap-2 sm:grid-cols-3">{(msg.mentionedEmails || []).map((email) => monitorMention(email, msg.occurredAt))}</div>}
    {(readButton || (achievement && isAdmin)) && <div className="mt-3 flex flex-wrap gap-2">{readButton}{achievement && isAdmin && <button type="button" onClick={() => onShare(msg, 'achievement')} disabled={sharing || shared} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary disabled:opacity-50" title="Compartilhar conquista na dashboard dos alunos"><Share2 size={13}/>{shared ? 'No mural' : sharing ? 'Enviando...' : 'Compartilhar'}</button>}</div>}
    {achievement && reactions}
  </article>;
}