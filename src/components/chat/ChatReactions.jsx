import React from 'react';
import { Heart, PartyPopper, Hand, Send } from 'lucide-react';
import VoiceDictationButton from '@/components/shared/VoiceDictationButton';

const REACTION_STYLES = [
  ['love', 'Amar', Heart, 'text-rose-600 bg-rose-50'],
  ['celebrate', 'Celebrar', PartyPopper, 'text-amber-700 bg-amber-50'],
  ['applaud', 'Aplaudir', Hand, 'text-sky-700 bg-sky-50'],
];

export default function ChatReactions({ item, targetType, ownerEmail, mentionedEmails = [], session, wallReactions, reactMutation, replyTarget, setReplyTarget, replyText, setReplyText }) {
  const normalizedSessionEmail = String(session?.email || '').trim().toLowerCase();
  const normalizedMentions = mentionedEmails.map((email) => String(email || '').trim().toLowerCase());
  const interactionOwner = normalizedMentions[0] || ownerEmail;
  const isOwnContent = String(ownerEmail || '').trim().toLowerCase() === normalizedSessionEmail || normalizedMentions.includes(normalizedSessionEmail);
  return <>
    <div className="mt-3 flex flex-wrap gap-1.5 border-t border-current/10 pt-2" aria-label="Reações à publicação">
      {REACTION_STYLES.map(([key, label, Icon, activeClass]) => {
        const count = wallReactions.filter((reaction) => reaction.target_id === item.id && reaction.reaction === key).length;
        const reacted = wallReactions.some((reaction) => reaction.target_id === item.id && reaction.reaction === key && reaction.actor_email === session?.email);
        return <button key={key} type="button" disabled={isOwnContent || reactMutation.isPending} onClick={() => reactMutation.mutate({ target_id: item.id, target_type: targetType, target_owner_email: interactionOwner, reaction: key })} aria-pressed={reacted} title={isOwnContent ? 'Você não pode reagir à própria publicação' : label} className={`inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${reacted ? activeClass : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}><Icon size={13} fill={key === 'love' && reacted ? 'currentColor' : 'none'} />{label}{count > 0 && <span>{count}</span>}</button>;
      })}
      <button type="button" disabled={isOwnContent} onClick={() => { setReplyTarget({ id: item.id, targetType, ownerEmail: interactionOwner }); setReplyText(''); }} title={isOwnContent ? 'Você não pode responder ao próprio conteúdo' : 'Responder em privado'} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"><Send size={13}/>Responder</button>
    </div>
    {replyTarget?.id === item.id && <form className="mt-2 flex flex-wrap items-center gap-2" onSubmit={(event) => { event.preventDefault(); const content = replyText.trim(); if (!content || replyMutation.isPending) return; replyMutation.mutate({ target_id: replyTarget.id, target_type: replyTarget.targetType, target_owner_email: replyTarget.ownerEmail, reply_text: content }, { onSuccess: () => { setReplyTarget(null); setReplyText(''); } }); }}>
      <input autoFocus maxLength={500} value={replyText} onChange={(event) => setReplyText(event.target.value)} placeholder="Resposta privada..." aria-label="Resposta privada" className="h-10 min-w-0 flex-1 rounded-lg border border-rose-200 bg-input px-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
      <VoiceDictationButton value={replyText} onChange={setReplyText} />
      <button type="submit" disabled={!replyText.trim() || replyMutation.isPending} className="h-10 rounded-lg bg-rose-500 px-3 text-xs font-semibold text-white disabled:opacity-50">{replyMutation.isPending ? 'Enviando...' : 'Enviar'}</button>
      <button type="button" onClick={() => { setReplyTarget(null); setReplyText(''); }} className="h-9 rounded-lg px-2 text-xs text-muted-foreground hover:bg-secondary">Cancelar</button>
    </form>}
  </>;
}