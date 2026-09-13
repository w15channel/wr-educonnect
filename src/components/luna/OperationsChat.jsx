import React, { useEffect, useRef, useState } from 'react';
import useOperationsConversation from '@/components/luna/useOperationsConversation';
import OperationsStatus from '@/components/luna/OperationsStatus';
import { Send, Plus, Briefcase } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import VoiceDictationButton from '@/components/shared/VoiceDictationButton';
import OperationsMessage from '@/components/luna/OperationsMessage';

const QUICK = [
  'Corrija a tarefa pendente mais recente com nota máxima',
  'Mostre o ranking atual da turma',
  'Liste os chamados de suporte abertos',
  'Quais pedidos de liberação de módulo estão pendentes?',
];

/** Sala de comando da Luna — a gerente de operações executa ordens do admin. */
export default function OperationsChat({ session }) {
  const operations = useOperationsConversation(session);
  const { conversation, messages, busy, canSend, newConversation } = operations;
  const [input, setInput] = useState('');
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, operations.phase]);
  const send = async (content = input) => {
    const text = String(content || '').trim();
    if (!text || !canSend) return;
    setInput('');
    if (!await operations.send(text)) setInput(value => value || text);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex shrink-0 items-center gap-2.5 border-b border-border bg-card px-3 py-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary"><Briefcase size={17} /></div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-black text-foreground">Luna · Gerente de Operações</p>
          <p className="truncate text-[11px] text-muted-foreground">Dê a ordem e ela executa na plataforma</p>
        </div>
        <button onClick={newConversation} disabled={busy} title="Nova sessão" className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <Plus size={15} />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {conversation && messages.length === 0 && <p className="text-sm text-muted-foreground">Conexão pronta. Envie um pedido para acompanhar as consultas, ações e resultados aqui.</p>}
        {messages.map((message, index) => <OperationsMessage key={message.id || index} message={message} />)}
        <OperationsStatus {...operations} />
        <div ref={endRef} />
      </div>

      <div className="shrink-0 border-t border-border bg-card/60 px-3 py-2">
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-invisible">
          {QUICK.map((q) => (
            <button key={q} onClick={() => send(q)} disabled={!canSend} className="shrink-0 whitespace-nowrap rounded-xl border border-border bg-secondary px-3 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50">
              {q}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex shrink-0 gap-2 border-t border-border bg-card p-3">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ex.: corrija a tarefa do João com nota 5 e feedback..." className="h-11 flex-1" disabled={!canSend} />
        <VoiceDictationButton value={input} onChange={setInput} className="h-11 w-11" />
        <Button type="submit" className="h-11 w-11 shrink-0 p-0" disabled={!input.trim() || !canSend}><Send size={16} /></Button>
      </form>
      <p className="shrink-0 pb-2 text-center text-[10px] text-muted-foreground">
        Ações destrutivas ou em massa pedem sua confirmação antes de executar.
      </p>
    </div>
  );
}