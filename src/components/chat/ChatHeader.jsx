import React from 'react';
import { Bell, Heart, Lock, Sparkles, MessageSquare } from 'lucide-react';

export default function ChatHeader({ courseLabel, activeTab, onTabChange, isAdmin, notificationsEnabled, onNotifications }) {
  const tabs = [{ id: 'geral', label: 'Mural de Superação', Icon: Heart }, { id: 'particular', label: 'Particular', Icon: Lock }, ...(!isAdmin ? [{ id: 'luna', label: 'Luna', Icon: Sparkles }] : [])];
  return <header className="shrink-0 border-b border-border bg-card">
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><MessageSquare size={20} /></div>
      <div className="min-w-0 flex-1"><h1 className="text-base font-semibold text-foreground">Chat da turma</h1><p className="text-xs text-muted-foreground">Comunidade · {courseLabel}</p></div>
      <button type="button" onClick={onNotifications} aria-label={notificationsEnabled ? 'Notificações ativas' : 'Ativar notificações'} title={notificationsEnabled ? 'Notificações ativas' : 'Ativar notificações neste aparelho'} className={`flex h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${notificationsEnabled ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-secondary'}`}><Bell size={16}/><span className="hidden sm:inline">{notificationsEnabled ? 'Notificações ativas' : 'Ativar notificações'}</span></button>
    </div>
    <nav aria-label="Conversas" className="flex gap-1 px-2 pb-2 sm:px-4">
      {tabs.map(({ id, label, Icon }) => <button key={id} type="button" onClick={() => onTabChange(id)} aria-current={activeTab === id ? 'page' : undefined} className={`flex min-h-10 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none sm:px-4 ${activeTab === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}><Icon size={14} className="shrink-0"/>{label}</button>)}
    </nav>
  </header>;
}