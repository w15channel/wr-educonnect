import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import useOvercomingWall from '@/hooks/useOvercomingWall';

function WallEntry({ item, session, getStudentName }) {
  const isAchievement = item.feedType === 'achievement';
  const isNotice = ['institutional', 'personal', 'notification'].includes(item.feedType);
  const author = item.author_email === session?.email
    ? 'Você'
    : (item.author_name || getStudentName(item.author_email));

  return (
    <article className={`rounded-xl border p-3 ${
      isAchievement
        ? 'border-amber-200 bg-amber-50/70 dark:border-amber-500/25 dark:bg-amber-500/10'
        : isNotice
          ? 'border-violet-200 bg-violet-50/70 dark:border-violet-500/25 dark:bg-violet-500/10'
          : 'border-border bg-background/80'
    }`}>
      <div className="flex items-start gap-2">
        <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${isAchievement ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
          {isAchievement ? <Sparkles size={14} /> : <Heart size={13} />}
        </span>
        <div className="min-w-0 text-xs leading-relaxed">
          {isAchievement ? (
            <p><strong className="text-foreground">{item.studentName || 'Um aluno da turma'}</strong> <span className="text-muted-foreground">{item.content}</span></p>
          ) : isNotice ? (
            <><p className="font-semibold text-foreground">{item.title || 'Recado para a turma'}</p><p className="whitespace-pre-wrap break-words text-muted-foreground">{item.message || item.content}</p></>
          ) : (
            <><p className="font-semibold text-foreground">{author || 'Aluno da turma'}</p><p className="whitespace-pre-wrap break-words text-muted-foreground">{item.content}</p></>
          )}
        </div>
      </div>
    </article>
  );
}

export default function SimplifiedOvercomingWall({ course, session }) {
  const [message, setMessage] = useState('');
  const wall = useOvercomingWall({ course, session });
  const visibleFeed = wall.feed.slice(0, 8);
  const chatPath = '/degree/student/chat';

  const submit = async (event) => {
    event.preventDefault();
    const content = message.trim();
    if (!content || wall.sendMessageMutation.isPending) return;
    try {
      await wall.sendMessageMutation.mutateAsync(/** @type {never} */ (content));
      setMessage('');
      toast.success('Sua mensagem foi publicada no mural!');
    } catch (error) {
      toast.error(error?.message || 'Não foi possível publicar sua mensagem.');
    }
  };

  return (
    <section aria-labelledby="simplified-wall-title" className="overflow-hidden rounded-2xl border border-rose-200/70 bg-card shadow-sm dark:border-rose-500/20">
      <header className="flex flex-col gap-3 border-b border-rose-100 bg-gradient-to-r from-rose-50 via-fuchsia-50/60 to-violet-50 px-4 py-4 dark:border-rose-500/20 dark:from-rose-950/30 dark:via-fuchsia-950/20 dark:to-violet-950/30 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500 text-white shadow-sm"><Heart size={19} fill="currentColor" /></span>
          <div>
            <h2 id="simplified-wall-title" className="font-bold text-foreground">Mural de superação</h2>
            <p className="text-xs text-muted-foreground">Converse, celebre conquistas e inspire seus colegas.</p>
          </div>
        </div>
        <Link to={chatPath} className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white/80 px-3 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-white dark:border-rose-500/30 dark:bg-white/5 dark:text-rose-300">
          <MessageCircle size={15} /> Abrir chat da turma
        </Link>
      </header>

      <div className="max-h-80 space-y-2 overflow-y-auto bg-secondary/20 p-3 sm:p-4" aria-live="polite">
        {visibleFeed.length ? visibleFeed.map((item) => (
          <WallEntry key={`${item.feedType}-${item.id}`} item={item} session={session} getStudentName={wall.getStudentName} />
        )) : (
          <div className="py-8 text-center">
            <MessageCircle className="mx-auto mb-2 text-rose-300" size={28} />
            <p className="text-sm font-semibold text-foreground">Comece uma corrente de apoio</p>
            <p className="mt-1 text-xs text-muted-foreground">Seja a primeira pessoa a compartilhar uma palavra de força.</p>
          </div>
        )}
      </div>

      <form onSubmit={submit} className="flex items-center gap-2 border-t border-border bg-card p-3 sm:p-4">
        <label htmlFor="simplified-wall-message" className="sr-only">Mensagem para o mural de superação</label>
        <input
          id="simplified-wall-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          maxLength={1000}
          placeholder="Compartilhe uma palavra de força..."
          className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-rose-400/40"
        />
        <button type="submit" disabled={!message.trim() || wall.sendMessageMutation.isPending} className="inline-flex h-10 items-center gap-2 rounded-xl bg-rose-500 px-4 text-sm font-bold text-white transition-colors hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50">
          <Send size={15} /> <span className="hidden sm:inline">{wall.sendMessageMutation.isPending ? 'Enviando…' : 'Publicar'}</span>
        </button>
      </form>
    </section>
  );
}
