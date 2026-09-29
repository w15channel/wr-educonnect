import React from 'react';
import { Search, MessageSquare } from 'lucide-react';
import { getAvatarPrefixedName } from '@/lib/avatarUtils';

export default function ChatContacts({ students, onlineStudents, awayStudents, isOnline, formatLastSeen, onContact, search, onSearch, compact = false }) {
  const groups = compact ? [{ label: `Online (${onlineStudents.length})`, items: onlineStudents }, { label: `Offline (${awayStudents.length})`, items: awayStudents }] : [{ items: students }];
  return <div className="h-full min-h-0 overflow-y-auto p-3 sm:p-4">
    <h2 className="text-sm font-semibold text-foreground">{compact ? 'Pessoas da turma' : 'Conversas particulares'}</h2>
    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Selecione um contato para conversar.</p>
    <div className="relative mt-4"><Search size={16} className="absolute left-3 top-3 text-muted-foreground"/><input value={search} onChange={(event) => onSearch(event.target.value)} aria-label="Buscar contato" className="h-10 w-full rounded-xl border border-rose-200 bg-input pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" placeholder="Buscar colega por nome ou apelido..."/></div>
    {groups.map((group, index) => <section key={index} className="mt-4">
      {group.label && <h3 className="mb-2 border-b border-rose-100 pb-2 text-xs font-medium text-muted-foreground">{group.label}</h3>}
      <div className={compact ? 'space-y-1' : 'grid gap-2 md:grid-cols-2'}>
        {group.items.map((contact) => {
          const online = isOnline(contact);
          const name = getAvatarPrefixedName(contact.profile_name || contact.student_name || contact.student_email, contact.profile_avatar_emoji);
          return <button key={contact.id} type="button" onClick={() => onContact(contact.student_email)} className={`flex w-full min-w-0 items-center gap-2 rounded-xl px-3 py-3 text-left transition-colors hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 ${compact ? '' : 'border border-rose-100 bg-card'}`}>
            <span className={`h-2 w-2 shrink-0 rounded-full ${online ? 'bg-green-500' : 'bg-muted-foreground/40'}`} aria-label={online ? 'Online' : 'Ausente'} />
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-foreground">{name}</span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{online ? 'Online agora' : `Última visita: ${formatLastSeen(contact.last_seen_at)}`}</span></span>
            {!compact && <MessageSquare size={15} className="shrink-0 text-muted-foreground"/>}
          </button>;
        })}
      </div>
      {!group.items.length && <p className="py-4 text-xs text-muted-foreground">{compact ? 'Nenhum contato neste momento.' : 'Nenhum contato encontrado.'}</p>}
    </section>)}
  </div>;
}
