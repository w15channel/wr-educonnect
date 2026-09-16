import React, { useEffect, useRef, useState } from 'react';
import useOperationsConversation from '@/components/luna/useOperationsConversation';
import OperationsStatus from '@/components/luna/OperationsStatus';
import { Send, Plus, Briefcase, Volume2, VolumeX } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import VoiceDictationButton from '@/components/shared/VoiceDictationButton';
import OperationsMessage from '@/components/luna/OperationsMessage';
import useLunaVoice from '@/hooks/useLunaVoice';

const QUICK = [
  'Vamos conversar sobre melhorias na plataforma',
  'Ajude a planejar ajustes, sem aplicar mudanças',
  'Que melhorias você sugere com base nesta conversa?',
  'Liste os chamados de suporte abertos',
];

/** Sala de comando da Luna — a gerente de operações executa ordens do admin. */
export default function OperationsChat({ session }) {
  const operations = useOperationsConversation(session);
  const { conversation, messages, phase, busy, canSend, newConversation } = operations;
  const voice = useLunaVoice();
  const [input, setInput] = useState('');
  const endRef = useRef(null);
  const spokenRef = useRef({ conversationId: null, fingerprint: '' });
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, phase]);
  useEffect(() => {
    const assistants = messages.filter((message) => message.role === 'assistant' && message.content?.trim());
    const latest = assistants[assistants.length - 1];
    const fingerprint = latest ? `${latest.id || ''}:${latest.content}` : '';
    if (spokenRef.current.conversationId !== conversation?.id) {
      spokenRef.current = { conversationId: conversation?.id || null, fingerprint };
      return;
    }
    if (phase === 'ready' && fingerprint && spokenRef.current.fingerprint !== fingerprint) {
      spokenRef.current.fingerprint = fingerprint;
      voice.speak(latest.content);
    }
  }, [conversation?.id, messages, phase, voice.speak]);
  const send = async (content = input) => {
    const text = String(content || '').trim();
    if (!text || !canSend) return;
    setInput('');
    voice.stop();
    if (!await operations.send(text)) setInput(value => value || text);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-background dark:bg-black">
      <div className="flex shrink-0 items-center gap-2.5 border-b border-rose-100 bg-card dark:border-white/20 dark:bg-black px-3 py-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300"><Briefcase size={17} /></div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-black text-foreground dark:text-white">Luna · Gerente de Operações</p>
          <p className="truncate text-[11px] text-muted-foreground">Executa continuamente até concluir o pedido</p>
        </div>
        <button
          onClick={voice.toggle}
          title={voice.enabled ? 'Desligar voz da Luna' : 'Ligar voz da Luna'}
          className={`rounded-xl p-2 transition-colors ${voice.enabled ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300' : 'text-muted-foreground hover:bg-secondary'}`}
        >
          {voice.enabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
        </button>
        <button onClick={() => { voice.stop(); newConversation(); }} disabled={busy} title="Nova sessão" className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <Plus size={15} />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3 bg-gradient-to-b from-rose-50/40 to-secondary/20 dark:from-black dark:to-black">
        {conversation && messages.length === 0 && <p className="text-sm text-muted-foreground">Vamos conversar? Podemos debater ideias, escrever, planejar melhorias ou executar uma operação autorizada. Planejar não altera dados.</p>}
        {messages.map((message, index) => <OperationsMessage key={message.id || index} message={message} />)}
        <OperationsStatus {...operations} />
        <div ref={endRef} />
      </div>

      <div className="shrink-0 border-t border-rose-100 bg-rose-50/20 dark:border-white/20 dark:bg-black px-3 py-2">
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-invisible">
          {QUICK.map((q) => (
            <button key={q} onClick={() => send(q)} disabled={!canSend} className="shrink-0 whitespace-nowrap rounded-xl border border-rose-200 dark:border-white/20 bg-background dark:bg-black px-3 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-rose-50 dark:hover:bg-white/10 hover:text-foreground dark:hover:text-white disabled:opacity-50">
              {q}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex shrink-0 gap-2 border-t border-rose-100 bg-card dark:border-white/20 dark:bg-black p-3">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Converse, peça um plano ou solicite uma ação..." className="h-11 flex-1 border-rose-200 dark:border-white/20" disabled={!canSend} />
        <VoiceDictationButton value={input} onChange={setInput} className="h-11 w-11" />
        <Button type="submit" className="h-11 w-11 shrink-0 p-0 bg-rose-500 hover:bg-rose-600" disabled={!input.trim() || !canSend}><Send size={16} /></Button>
      </form>
      <p className="shrink-0 pb-2 text-center text-[10px] text-muted-foreground">
        A Luna segue todas as etapas autorizadas sem pausas. Ações destrutivas ainda exigem confirmação por segurança.
      </p>
    </div>
  );
}