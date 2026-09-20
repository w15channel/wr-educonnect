import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Navigate, useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Search, ArrowLeft, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import LunaChat from '@/components/luna/LunaChat';
import OperationsChat from '@/components/luna/OperationsChat';
import { getDMSessionId, LUNA_DM_EMAIL, LUNA_DM_NAME } from '@/lib/lunaDM';
import { resolveDisplayNameFromMaps, buildProfileMap } from '@/lib/avatarUtils';
import { toast } from 'sonner';

function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/**
 * LunaAdminConversations — Painel administrativo de conversas da Luna.
 * O admin vê todas as conversas dos alunos com a Luna e pode responder como Luna.
 * Não há identificação de quem está respondendo (IA ou admin = mesma identidade).
 */
function LunaAdminConversations({ session }) {
  const queryClient = useQueryClient();
  const [selectedStudentEmail, setSelectedStudentEmail] = useState(null);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const bottomRef = useRef(null);

  const { data: accessCodes = [] } = useQuery({
    queryKey: ['access-codes-luna-conv'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 5000),
    staleTime: 60000,
  });
  const { data: studentProfiles = [] } = useQuery({
    queryKey: ['student-profiles-luna-conv'],
    queryFn: () => base44.entities.StudentProfile.list('-updated_date', 5000),
    staleTime: 60000,
  });
  const profileMap = useMemo(() => buildProfileMap(studentProfiles), [studentProfiles]);

  const { data: allLunaMessages = [], refetch } = useQuery({
    queryKey: ['luna-admin-conversations'],
    queryFn: async () => {
      const all = await base44.entities.ChatMessage.list('-created_date', 5000);
      return all.filter((msg) =>
        msg.session_id?.includes('luna@wr-edu.internal') &&
        !msg.is_luna_distribution
      );
    },
    refetchInterval: 10000,
    staleTime: 5000,
  });

  const conversations = useMemo(() => {
    const groups = new Map();
    for (const msg of allLunaMessages) {
      if (!groups.has(msg.session_id)) groups.set(msg.session_id, []);
      groups.get(msg.session_id).push(msg);
    }
    const result = [];
    for (const [sid, msgs] of groups) {
      const sorted = msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      const parts = sid.replace(/^dm_/, '').split('_');
      const studentEmail = parts.find((p) => p !== 'luna@wr-edu.internal') || '';
      const studentName = resolveDisplayNameFromMaps(studentEmail, profileMap, accessCodes);
      const lastMsg = sorted[sorted.length - 1];
      const recentCount = sorted.filter(m =>
        m.author_email !== LUNA_DM_EMAIL &&
        new Date(m.created_date) > new Date(Date.now() - 10 * 60 * 1000)
      ).length;
      result.push({ sessionId: sid, studentEmail, studentName, messages: sorted, lastMessage: lastMsg, messageCount: sorted.length, recentCount });
    }
    return result.sort((a, b) => new Date(b.lastMessage.created_date) - new Date(a.lastMessage.created_date));
  }, [allLunaMessages, profileMap, accessCodes]);

  const filteredConversations = conversations.filter(c => {
    const name = c.studentName || c.studentEmail || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const selectedConversation = conversations.find(c => c.sessionId === getDMSessionId(LUNA_DM_EMAIL, selectedStudentEmail));

  useEffect(() => {
    if (selectedConversation) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation?.messages.length]);

  const sendMessageMutation = useMutation({
    mutationFn: async ({ studentEmail, content }) => {
      const sessionId = getDMSessionId(LUNA_DM_EMAIL, studentEmail);
      return base44.entities.ChatMessage.create({
        session_id: sessionId,
        author_name: LUNA_DM_NAME,
        author_email: LUNA_DM_EMAIL,
        content,
        is_hand_raised: false,
        is_luna_distribution: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['luna-admin-conversations'] });
      setText('');
      toast.success('Mensagem enviada como Luna.');
    },
    onError: (error) => toast.error(error?.message || 'Não foi possível enviar.'),
  });

  const handleSend = () => {
    const content = text.trim();
    if (!content || !selectedStudentEmail) return;
    sendMessageMutation.mutate({ studentEmail: selectedStudentEmail, content });
  };

  if (selectedStudentEmail && selectedConversation) {
    const msgs = selectedConversation.messages;
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="shrink-0 border-b border-rose-100 bg-card dark:border-white/20 dark:bg-black px-3 py-2.5 flex items-center gap-2">
          <button onClick={() => setSelectedStudentEmail(null)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground" title="Voltar"><ArrowLeft size={16} /></button>
          <div className="text-3xl" role="img">🦉</div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground truncate">{selectedConversation.studentName || selectedStudentEmail}</p>
            <p className="text-[11px] text-muted-foreground truncate">Conversa com a Luna · {msgs.length} mensagem(ns)</p>
          </div>
          <button onClick={() => refetch()} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" title="Atualizar"><RefreshCw size={15} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-gradient-to-b from-rose-50/40 to-secondary/20 dark:from-black dark:to-black">
          {msgs.map(msg => {
            const isLuna = msg.author_email === LUNA_DM_EMAIL;
            return (
              <div key={msg.id} className={`text-[13px] leading-relaxed ${isLuna ? '' : 'text-right'}`}>
                {!isLuna && (<span className="block text-[11px] text-muted-foreground mb-0.5">[{formatTime(msg.created_date)}] <span className="font-bold text-foreground">{msg.author_name || 'Aluno'}</span></span>)}
                <span className={`inline-block rounded-lg px-3 py-1.5 max-w-[80%] whitespace-pre-wrap ${isLuna ? 'bg-rose-500 text-white' : 'bg-secondary text-foreground'}`}>{msg.content}</span>
                {isLuna && (<span className="block text-[11px] text-muted-foreground mt-0.5">[{formatTime(msg.created_date)}] 🦉 Luna</span>)}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <div className="shrink-0 border-t border-rose-100 bg-rose-50/20 dark:border-white/20 dark:bg-black p-3">
          <div className="flex gap-2 items-center">
            <Input className="flex-1 h-10 px-3 text-sm border-rose-200 dark:border-white/20 rounded-xl bg-input text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-300" placeholder="Responder como Luna..." value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} />
            <Button onClick={handleSend} disabled={!text.trim() || sendMessageMutation.isPending} className="h-10 px-4 rounded-xl bg-rose-500 hover:bg-rose-600"><Send size={14} /> Enviar</Button>
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground">🦉 A mensagem será entregue como Luna. O aluno verá como se fosse a Luna respondendo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-rose-100 bg-card dark:border-white/20 dark:bg-black px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="text-2xl" role="img">🦉</div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Conversas com a Luna</h2>
            <p className="text-xs text-muted-foreground">Assuma o controle e responda como Luna · {conversations.length} conversa(s)</p>
          </div>
          <button onClick={() => refetch()} className="ml-auto rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" title="Atualizar"><RefreshCw size={15} /></button>
        </div>
        <div className="relative mt-3">
          <Search size={16} className="absolute left-3 top-2.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-full rounded-xl border-rose-200 dark:border-white/20 bg-input pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" placeholder="Buscar aluno..." />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1">
        {filteredConversations.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center text-muted-foreground">
            <div className="text-4xl">🦉</div>
            <p className="font-bold text-foreground">Nenhuma conversa ainda</p>
            <p className="text-sm">Quando os alunos conversarem com a Luna, as conversas aparecerão aqui.</p>
          </div>
        )}
        {filteredConversations.map(c => (
          <button key={c.sessionId} onClick={() => setSelectedStudentEmail(c.studentEmail)} className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors hover:bg-rose-50 dark:hover:bg-white/5 ${c.recentCount > 0 ? 'border-rose-200 dark:border-rose-500/30 bg-rose-50/40 dark:bg-rose-500/5' : 'border-rose-100 dark:border-white/10 bg-card'}`}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 text-sm font-bold">{c.studentName?.charAt(0)?.toUpperCase() || '?'}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium text-foreground">{c.studentName || c.studentEmail}</p>
                <span className="shrink-0 text-[10px] text-muted-foreground">{formatTime(c.lastMessage.created_date)}</span>
              </div>
              <p className="truncate text-xs text-muted-foreground">{c.lastMessage.author_email === LUNA_DM_EMAIL ? '🦉 ' : ''}{c.lastMessage.content?.slice(0, 60)}</p>
            </div>
            {c.recentCount > 0 && (<span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center"><span className="h-3 w-3 rounded-full bg-red-500" title={`${c.recentCount} mensagem(ns) recente(s)`} /></span>)}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Ferramenta da Luna — assistente do site e, para o admin, gerente de operações + conversas. */
export default function TutorDigital() {
  const { user: session } = useOutletContext();
  const isAdmin = session?.role === 'admin';
  const [mode, setMode] = useState(isAdmin ? 'operations' : 'assistant');

  if (!isAdmin) return <Navigate to="/student/chat?tab=luna" replace />;

  const tabs = [
    { id: 'operations', label: 'Gerente de Operações' },
    { id: 'conversations', label: 'Conversas da Luna' },
    { id: 'assistant', label: 'Assistente' },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {isAdmin && (
        <div className="flex shrink-0 gap-1 border-b border-border bg-card px-3 py-2">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setMode(tab.id)} className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${mode === tab.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>{tab.label}</button>
          ))}
        </div>
      )}
      {mode === 'conversations' ? <LunaAdminConversations session={session} /> : mode === 'operations' ? <OperationsChat session={session} /> : <LunaChat session={session} />}
    </div>
  );
}