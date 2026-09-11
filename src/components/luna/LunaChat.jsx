import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import useOwlVoice from '@/hooks/useOwlVoice';
import LunaBubble from '@/components/luna/LunaBubble';
import LunaShortcuts from '@/components/luna/LunaShortcuts';
import VoiceDictationButton from '@/components/shared/VoiceDictationButton';
import { LUNA_SYSTEM_PROMPT, LUNA_QUICK_ACTIONS, lunaGreeting } from '@/lib/lunaPersona';

/**
 * Conversa com a Luna em balões — usada na página dela e na sobreposição
 * aberta pelo botão ao lado da lâmpada de tema.
 */
export default function LunaChat({ session, onNavigated }) {
  const voice = useOwlVoice();
  const greeting = lunaGreeting(session?.name);
  const [messages, setMessages] = useState([{ role: 'assistant', content: greeting }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const send = async (content = input) => {
    const text = String(content || '').trim();
    if (!text || loading) return;
    const next = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);
    voice.stop();
    try {
      const history = next.map((m) => `${m.role === 'user' ? 'Aluno' : 'Luna'}: ${m.content}`).join('\n');
      const answer = await base44.integrations.Core.InvokeLLM({
        prompt: `${LUNA_SYSTEM_PROMPT}\n\nNome do aluno: ${session?.name || 'Aluno'}\n\nConversa:\n${history}\n\nLuna:`,
        response_json_schema: {
          type: 'object',
          properties: {
            answer: { type: 'string' },
            links: {
              type: 'array',
              items: {
                type: 'object',
                properties: { key: { type: 'string' }, label: { type: 'string' } },
              },
            },
          },
        },
      });
      const reply = answer?.answer || 'Desculpe, não consegui responder agora. Poderia tentar novamente, por favor?';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply, links: answer?.links || [] }]);
      voice.speak(reply);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Tive um problema para responder agora. Verifique sua internet e tente de novo, por favor.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex shrink-0 items-center gap-2.5 border-b border-border bg-card px-3 py-2.5">
        <div className="ofensiva-owl text-3xl" role="img" aria-label="Luna, assistente do site">🦉</div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-black text-foreground">Luna · Assistente do site</p>
          <p className="truncate text-[11px] text-muted-foreground">Dúvidas da plataforma, estudos e apoio emocional</p>
        </div>
        <button
          onClick={voice.toggle}
          title={voice.enabled ? 'Desligar voz da Luna' : 'Ligar voz da Luna'}
          className={`rounded-xl p-2 transition-colors ${voice.enabled ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300' : 'text-muted-foreground hover:bg-secondary'}`}
        >
          {voice.enabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
        </button>
        <button
          onClick={() => { voice.stop(); setMessages([{ role: 'assistant', content: greeting }]); }}
          title="Reiniciar conversa"
          className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.map((message, index) => (
          <div key={index} className="space-y-2">
            <LunaBubble role={message.role}>{message.content}</LunaBubble>
            {message.role === 'assistant' && (
              <LunaShortcuts links={message.links} onNavigate={() => { voice.stop(); onNavigated?.(); }} />
            )}
          </div>
        ))}
        {loading && (
          <LunaBubble role="assistant">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              {[0, 0.15, 0.3].map((delay) => (
                <span key={delay} className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${delay}s` }} />
              ))}
              Luna está pensando...
            </span>
          </LunaBubble>
        )}
        <div ref={endRef} />
      </div>

      <div className="shrink-0 border-t border-border bg-card/60 px-3 py-2">
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-invisible">
          {LUNA_QUICK_ACTIONS.map((action) => (
            <button
              key={action}
              onClick={() => send(action)}
              disabled={loading}
              className="shrink-0 whitespace-nowrap rounded-xl border border-border bg-secondary px-3 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="flex shrink-0 gap-2 border-t border-border bg-card p-3"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escreva sua dúvida para a Luna..."
          className="h-11 flex-1"
          disabled={loading}
        />
        <VoiceDictationButton value={input} onChange={setInput} className="h-11 w-11" />
        <Button type="submit" className="h-11 w-11 shrink-0 p-0" disabled={!input.trim() || loading}>
          <Send size={16} />
        </Button>
      </form>
      <p className="shrink-0 pb-2 text-center text-[10px] text-muted-foreground">
        A Luna acolhe e orienta, mas não substitui atendimento profissional. Em crise, ligue 188 (CVV).
      </p>
    </div>
  );
}