import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Plus, Loader2, Briefcase } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import VoiceDictationButton from '@/components/shared/VoiceDictationButton';
import OperationsMessage from '@/components/luna/OperationsMessage';

const AGENT = 'luna_operations';
const QUICK = [
  'Corrija a tarefa pendente mais recente com nota máxima',
  'Mostre o ranking atual da turma',
  'Liste os chamados de suporte abertos',
  'Quais pedidos de liberação de módulo estão pendentes?',
];

/** Sala de comando da Luna — a gerente de operações executa ordens do admin. */
export default function OperationsChat({ session }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  const startConversation = async () => {
    const conv = await base44.agents.createConversation({
      agent_name: AGENT,
      metadata: { name: `Operações · ${new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`, description: 'Ordens do administrador para a Luna' },
    });
    setConversation(conv);
    setMessages([]);
    await base44.agents.addMessage(conv, {
      role: 'user',
      content: `Contexto: sou o administrador ${session?.name || ''} (e-mail ${session?.email || 'não informado'}), turma ativa "${session?.course || 'tcc'}". Use este e-mail como admin_email e reviewed_by. Apresente-se em uma frase e aguarde minhas ordens.`,
    });
  };

  useEffect(() => { startConversation(); }, []);

  useEffect(() => {
    if (!conversation?.id) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
      const last = data.messages?.[data.messages.length - 1];
      if (last?.role === 'assistant' && !last.tool_calls?.some((t) => ['pending', 'running', 'in_progress'].includes(t.status))) setSending(false);
    });
    return () => unsubscribe();
  }, [conversation?.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, sending]);

  const send = async (content = input) => {
    const text = String(content || '').trim();
    if (!text || !conversation || sending) return;
    setInput('');
    setSending(true);
    await base44.agents.addMessage(conversation, { role: 'user', content: text });
  };

  // Oculta a mensagem de contexto inicial — o admin só vê a apresentação da Luna.
  const visible = messages.slice(1);

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex shrink-0 items-center gap-2.5 border-b border-border bg-card px-3 py-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary"><Briefcase size={17} /></div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-black text-foreground">Luna · Gerente de Operações</p>
          <p className="truncate text-[11px] text-muted-foreground">Dê a ordem e ela executa na plataforma</p>
        </div>
        <button onClick={startConversation} title="Nova sessão" className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <Plus size={15} />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {!conversation && <p className="text-center text-xs text-muted-foreground">Abrindo sala de operações...</p>}
        {visible.map((message, index) => <OperationsMessage key={message.id || index} message={message} />)}
        {sending && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 size={13} className="animate-spin" /> Luna está trabalhando...</div>
        )}
        <div ref={endRef} />
      </div>

      <div className="shrink-0 border-t border-border bg-card/60 px-3 py-2">
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-invisible">
          {QUICK.map((q) => (
            <button key={q} onClick={() => send(q)} disabled={sending || !conversation} className="shrink-0 whitespace-nowrap rounded-xl border border-border bg-secondary px-3 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50">
              {q}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex shrink-0 gap-2 border-t border-border bg-card p-3">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ex.: corrija a tarefa do João com nota 5 e feedback..." className="h-11 flex-1" disabled={sending || !conversation} />
        <VoiceDictationButton value={input} onChange={setInput} className="h-11 w-11" />
        <Button type="submit" className="h-11 w-11 shrink-0 p-0" disabled={!input.trim() || sending || !conversation}><Send size={16} /></Button>
      </form>
      <p className="shrink-0 pb-2 text-center text-[10px] text-muted-foreground">
        Ações destrutivas ou em massa pedem sua confirmação antes de executar.
      </p>
    </div>
  );
}