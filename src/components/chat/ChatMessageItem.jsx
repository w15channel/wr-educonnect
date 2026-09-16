import React from 'react';
import { Pencil, Trash2, Share2 } from 'lucide-react';
import { ClickableStudent } from '@/components/shared/StudentProfileCard';

export default function ChatMessageItem({ msg, isMe, isAdmin, name, email, time, onEdit, onDelete, onShare, onShareExternal, sharing, shared, reactions }) {
  const content = (msg.content || '').replace('[MSN_ATTENTION]', '').replace('[MSN_ACTION]', '').trim();
  return <article className={`min-w-0 rounded-xl border p-3 sm:p-4 ${isMe ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'}`}>
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <ClickableStudent email={email} className="min-w-0 break-words text-sm font-semibold text-foreground">{name}</ClickableStudent>
      <span className="text-xs text-muted-foreground">{time}</span>
      <div className="ml-auto flex items-center gap-1">
        <button type="button" onClick={() => onShareExternal(msg)} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" title="Compartilhar em aplicativos externos" aria-label="Compartilhar em aplicativos externos"><Share2 size={15}/></button>
        {isMe && <button type="button" onClick={() => onEdit(msg)} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" title="Editar minha mensagem" aria-label="Editar minha mensagem"><Pencil size={15}/></button>}
        {isAdmin && <button type="button" onClick={() => onDelete(msg)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Excluir permanentemente" aria-label="Excluir permanentemente"><Trash2 size={15}/></button>}
      </div>
    </div>
    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">{content}</p>
    {msg.updated_date && msg.updated_date !== msg.created_date && <span className="text-xs italic text-muted-foreground">editada</span>}
    {isAdmin && <button type="button" onClick={() => onShare(msg)} disabled={sharing || shared} className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary disabled:opacity-50" title="Encaminhar para o Mural de Superação da dashboard"><Share2 size={13}/>{shared ? 'No mural' : sharing ? 'Enviando...' : 'Compartilhar no mural'}</button>}
    {reactions}
  </article>;
}