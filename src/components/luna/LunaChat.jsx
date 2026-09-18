import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import useLunaVoice from '@/hooks/useLunaVoice';
import LunaBubble from '@/components/luna/LunaBubble';
import LunaShortcuts from '@/components/luna/LunaShortcuts';
import LunaTuitionIntro from '@/components/luna/LunaTuitionIntro';
import VoiceDictationButton from '@/components/shared/VoiceDictationButton';
import { LUNA_SYSTEM_PROMPT, LUNA_QUICK_ACTIONS, lunaGreeting, searchApostila, saveLunaMemory, loadLunaMemory, clearLunaMemory } from '@/lib/lunaPersona';
import { SUPPORT_CATEGORIES } from '@/components/support/SupportTicketForm';
import { TUITION_ACTIONS, TUITION_GREETING, TUITION_PROMPT } from '@/lib/lunaTuition';
import { toast } from 'sonner';

const LUNA_SUPPORT_PROMPT_SUFFIX = `

MODO DE SUPORTE ATIVO: O aluno chegou até você através do atalho de suporte. Nesta conversa:
1. Pergunte o que o aluno precisa ou qual problema está enfrentando na plataforma.
2. TENTE RESOLVER o problema primeiro — use seu conhecimento da plataforma e do conteúdo do curso para ajudar de verdade.
3. Se você conseguiu resolver, ótimo! Pergunte se precisa de mais alguma coisa.
4. Se você NÃO conseguiu resolver após tentar, seja honesta: "Eu tentei te ajudar com isso, mas acho que isso precisa da equipe de suporte. Quer que eu abra um chamado formal pra você?"
5. Só preencha o campo "ticket" do JSON QUANDO o aluno confirmar explicitamente que deseja abrir o chamado (respondendo sim, quero, pode abrir, etc.):
   - title: um resumo curto do problema (máximo 80 caracteres)
   - description: a descrição completa do problema relatado pelo aluno, em primeira pessoa
   - category: escolha a categoria mais adequada entre: ${SUPPORT_CATEGORIES.join(', ')}
6. NÃO preencha o campo "ticket" se o aluno ainda não confirmou que deseja abrir o chamado.
7. Após preencher o campo "ticket", confirme ao aluno que o chamado foi registrado e que a equipe entrará em contato.`;

/**
 * Conversa com a Luna em balões — usada na página dela e na sobreposição
 * aberta pelo botão ao lado da lâmpada de tema.
 */
export default function LunaChat({ session, onNavigated, isActive = true, supportMode = false, tuitionMode = false }) {
  const voice = useLunaVoice();
  const supportGreeting = `Olá, ${String(session?.name || 'aluno(a)').split(' ')[0]}! 🦉 Vi que você precisa de ajuda com algo. Pode me contar o que está acontecendo? Vou tentar resolver pra você aqui mesmo — e se eu não conseguir, aí a gente vê sobre abrir um chamado pra equipe de suporte.`;
  const greeting = tuitionMode ? TUITION_GREETING : supportMode ? supportGreeting : lunaGreeting(session?.name);

  // ── Memória de 24h: restaura conversa anterior se existir ──
  const memoryKey = `luna_chat_${tuitionMode ? 'tuition_' : ''}${session?.email || session?.code || 'anon'}`;
  const savedMessages = loadLunaMemory(memoryKey);
  const [messages, setMessages] = useState(
    savedMessages && savedMessages.length > 0
      ? [...savedMessages, { role: 'assistant', content: '🦉 Continuando nossa conversa de hoje. Como posso te ajudar agora?' }]
      : [{ role: 'assistant', content: greeting }]
  );

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ticketCreating, setTicketCreating] = useState(false);
  const endRef = useRef(null);
  const activeRef = useRef(isActive);
  activeRef.current = isActive;
  const supportRef = useRef(supportMode);
  supportRef.current = supportMode;
  const initialSpokenRef = useRef(false);
  const initialVoiceTextRef = useRef(messages[messages.length - 1]?.content || greeting);

  useEffect(() => {
    if (isActive && !initialSpokenRef.current) {
      initialSpokenRef.current = true;
      voice.speak(initialVoiceTextRef.current);
    }
  }, [isActive, voice.speak]);
  useEffect(() => { if (!isActive) voice.stop(); }, [isActive]);
  useEffect(() => { if (isActive) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [messages, loading, isActive]);

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

      // Buscar conteúdo da apostila relevante à pergunta do aluno
      const apostilaResults = searchApostila(text, 3);
      const apostilaContext = apostilaResults.length > 0
        ? '\n\nCONTEÚDO DA APOSTILA RELACIONADO À PERGUNTA DO ALUNO (use para responder com base no material do curso):\n' +
          apostilaResults.map((l) =>
            `--- ${l.moduleTitle} > ${l.lessonTitle} ---\n${l.lessonContent}`
          ).join('\n\n')
        : '';

      const basePrompt = tuitionMode ? LUNA_SYSTEM_PROMPT + TUITION_PROMPT : supportRef.current ? LUNA_SYSTEM_PROMPT + LUNA_SUPPORT_PROMPT_SUFFIX : LUNA_SYSTEM_PROMPT;
      const systemPrompt = basePrompt + apostilaContext;

      const answer = await base44.integrations.Core.InvokeLLM({
        prompt: `${systemPrompt}\n\nNome do aluno: ${session?.name || 'Aluno'}\n\nConversa:\n${history}\n\nLuna:`,
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
            ticket: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                category: { type: 'string' },
              },
            },
          },
        },
      });
      const reply = answer?.answer || 'Desculpe, não consegui responder agora. Poderia tentar novamente, por favor?';
      const updatedMessages = [...next, { role: 'assistant', content: reply, links: answer?.links || [] }];

      // Se a Luna retornou um ticket, criar o SupportTicket
      if (answer?.ticket?.title && answer?.ticket?.description) {
        setTicketCreating(true);
        try {
          const userCourse = session?.course || 'tcc';
          const ticketData = {
            title: String(answer.ticket.title).slice(0, 200),
            description: String(answer.ticket.description),
            category: SUPPORT_CATEGORIES.includes(answer.ticket.category) ? answer.ticket.category : 'Outro assunto',
            student_email: session?.email || session?.code || '',
            student_name: session?.name || '',
            course: userCourse,
            status: 'open',
          };
          await base44.entities.SupportTicket.create(ticketData);
          updatedMessages.push({
            role: 'assistant',
            content: `✅ Chamado registrado com sucesso!\n\n📋 Assunto: ${ticketData.title}\n🏷️ Categoria: ${ticketData.category}\n\nSua solicitação foi encaminhada para a equipe de suporte. Eles entrarão em contato com você em breve. Você pode acompanhar o status na página "Suporte" no menu.`,
          });
          toast.success('Chamado registrado com sucesso!');
        } catch (err) {
          updatedMessages.push({
            role: 'assistant',
            content: 'Tive um problema para registrar o chamado agora, mas tente novamente ou acesse a página "Suporte" no menu para abrir manualmente.',
          });
          toast.error('Não foi possível registrar o chamado.');
        } finally {
          setTicketCreating(false);
        }
      }

      setMessages(updatedMessages);
      saveLunaMemory(memoryKey, updatedMessages);
      const spokenReply = updatedMessages.slice(next.length).map((message) => message.content).join(' ');
      if (activeRef.current) await voice.speak(spokenReply);
    } catch {
      const errorReply = 'Tive um problema para responder agora. Verifique sua internet e tente de novo, por favor.';
      setMessages((prev) => [...prev, { role: 'assistant', content: errorReply }]);
      if (activeRef.current) await voice.speak(errorReply);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-background dark:bg-black">
      <div className="flex shrink-0 items-center gap-2.5 border-b border-rose-100 bg-card dark:border-white/20 dark:bg-black px-3 py-2.5">
        <div className="ofensiva-owl text-3xl" role="img" aria-label="Luna, assistente do site">🦉</div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-black text-foreground dark:text-white">Luna · Assistente do site</p>
          <p className="truncate text-[11px] text-muted-foreground">{tuitionMode ? 'Contribuição Voluntária · sem valor mínimo' : supportMode ? 'Suporte — conte o que precisa' : 'Dúvidas do curso, plataforma e apoio emocional'}</p>
        </div>
        <button
          onClick={voice.toggle}
          title={voice.enabled ? 'Desligar voz da Luna' : 'Ligar voz da Luna'}
          className={`rounded-xl p-2 transition-colors ${voice.enabled ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300' : 'text-muted-foreground hover:bg-secondary'}`}
        >
          {voice.enabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
        </button>
        <button
          onClick={() => { voice.stop(); clearLunaMemory(memoryKey); setMessages([{ role: 'assistant', content: greeting }]); voice.speak(greeting); }}
          title="Reiniciar conversa"
          className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3 bg-gradient-to-b from-rose-50/40 to-secondary/20 dark:from-black dark:to-black">
        {tuitionMode && <LunaTuitionIntro />}
        {messages.map((message, index) => (
          <div key={index} className="space-y-2">
            <LunaBubble role={message.role}>{message.content}</LunaBubble>
            {message.role === 'assistant' && message.links && message.links.length > 0 && (
              <LunaShortcuts links={message.links} onNavigate={() => { voice.stop(); onNavigated?.(); }} />
            )}
          </div>
        ))}
        {(loading || ticketCreating) && (
          <LunaBubble role="assistant">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              {[0, 0.15, 0.3].map((delay) => (
                <span key={delay} className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${delay}s` }} />
              ))}
              {ticketCreating ? 'Registrando chamado...' : 'Luna está pensando...'}
            </span>
          </LunaBubble>
        )}
        <div ref={endRef} />
      </div>

      <div className="shrink-0 border-t border-rose-100 bg-rose-50/20 dark:border-white/20 dark:bg-black px-3 py-2">
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-invisible">
          {(tuitionMode ? TUITION_ACTIONS : supportMode
            ? ['Não consigo acessar minha conta', 'Problema com aulas ou vídeos', 'Problema com tarefa ou prova', 'Problema com mensalidade', 'Outro assunto']
            : LUNA_QUICK_ACTIONS
          ).map((action) => (
            <button
              key={action}
              onClick={() => send(action)}
              disabled={loading || ticketCreating}
              className="shrink-0 whitespace-nowrap rounded-xl border border-rose-200 dark:border-white/20 bg-background dark:bg-black px-3 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-rose-50 dark:hover:bg-white/10 hover:text-foreground dark:hover:text-white"
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="flex shrink-0 gap-2 border-t border-rose-100 bg-card dark:border-white/20 dark:bg-black p-3"
      >
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Converse com a Luna..." className="h-11 flex-1 border-rose-200 dark:border-white/20" disabled={loading} />
        <VoiceDictationButton value={input} onChange={setInput} className="h-11 w-11" />
        <Button type="submit" className="h-11 w-11 shrink-0 p-0 bg-rose-500 hover:bg-rose-600" disabled={!input.trim() || loading || ticketCreating}>
          <Send size={16} />
        </Button>
      </form>
      <p className="shrink-0 pb-2 text-center text-[10px] text-muted-foreground">
        A Luna acolhe e orienta, mas não substitui atendimento profissional. Em crise, ligue 188 (CVV).
      </p>
    </div>
  );
}