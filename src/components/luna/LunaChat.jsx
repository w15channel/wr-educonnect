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
import { countLunaStudentInteractions, getLunaSupportOffer, getLunaSupportDecision, LUNA_SUPPORT_REASONS, MIN_LUNA_SUPPORT_INTERACTIONS } from '@/lib/lunaSupport';
import { getDMSessionId, LUNA_DM_EMAIL, LUNA_DM_NAME } from '@/lib/lunaDM';
import { toast } from 'sonner';
import useSocialIdentity from '@/hooks/useSocialIdentity';

const LUNA_SUPPORT_PROMPT_SUFFIX = `

MODO DE SUPORTE ATIVO: O aluno chegou até você através do atalho de suporte. Nesta conversa:
1. Pergunte o que o aluno precisa ou qual problema está enfrentando na plataforma.
2. TENTE RESOLVER o problema primeiro — use seu conhecimento da plataforma, o conteúdo da apostila fornecido e sua inteligência para ajudar de verdade. Seja minuciosa: explore alternativas, sugira passos práticos, explique caminhos, valide o resultado de cada tentativa e ajuste a orientação com o relato do aluno.
3. Se você conseguiu resolver, ótimo! Pergunte se precisa de mais alguma coisa e continue conversando.
4. NÃO proponha chamado antes de completar pelo menos ${MIN_LUNA_SUPPORT_INTERACTIONS} interações do aluno sobre o caso. Durante essas interações, continue investigando e tentando resolver junto com ele; nunca use a contagem como desculpa para deixar de ajudar.
5. Depois desse mínimo, somente se você realmente esgotou alternativas úteis e o problema persistir, seja honesta e natural: "Sou uma inteligência artificial programada para ajudar e tenho limitações para acessar ou alterar alguns casos. Tentei resolver isso com você de várias formas, mas esta situação precisa da equipe técnica. Você deseja abrir um chamado para que ela analise este caso?"
6. Entrar pelo atalho de suporte NÃO autoriza a abertura de um chamado. Siga as mesmas regras de diálogo e confirmação dos demais modos.
7. O chamado deve ser oferecido NO MÁXIMO UMA VEZ por conversa. Se já ofereceu e o aluno recusou ou continuou conversando, não ofereça novamente.`;

const SUPPORT_OFFER_PROMPT = `
FORMATO DA PROPOSTA DE SUPORTE:
Somente quando identificar necessidade de intervenção humana E ainda não tiver oferecido suporte nesta conversa, inclua "support_offer" com:
- reason: "technical" (problema técnico), "administrative" (demanda administrativa) ou "unanswered" (dúvida não sanada pela base e pelo seu conhecimento).
- explanation: por que a equipe é necessária, com base no relato.
- title: resumo do problema, até 80 caracteres.
- description: descrição fiel do relato e das tentativas de solução, sem inventar dados.
- category: uma destas categorias: ${SUPPORT_CATEGORIES.join(', ')}.
REGRA CRÍTICA: inclua "support_offer" somente depois de pelo menos ${MIN_LUNA_SUPPORT_INTERACTIONS} interações do aluno sobre o caso, no MÁXIMO UMA VEZ por conversa. Se já incluiu antes (o contexto indicará "SUPORTE_JÁ_OFERECIDO"), NÃO inclua novamente — mesmo que o aluno insista no tema, continue tentando ajudar na conversa.
Caso contrário, omita "support_offer". A proposta não cria chamado. O aplicativo mostrará o resumo e pedirá confirmação; oriente o aluno a escolher "Sim, abrir chamado" ou "Não, continuar conversando".`;

function buildConversationTranscript(messages, studentName) {
  const lines = [];
  lines.push('════════════════════════════════════════');
  lines.push('📋 HISTÓRICO DA CONVERSA COM A LUNA');
  lines.push('════════════════════════════════════════');
  lines.push('');
  for (const msg of messages) {
    const speaker = msg.role === 'user' ? (studentName || 'Aluno') : 'Luna';
    const content = String(msg.content || '').trim();
    if (!content) continue;
    lines.push(`【${speaker}】: ${content}`);
    lines.push('');
  }
  lines.push('════════════════════════════════════════');
  lines.push('Fim do histórico.');
  return lines.join('\n');
}

async function saveLunaMessageToServer(role, content, studentEmail, studentName) {
  if (!studentEmail || !content) return;
  try {
    const sessionId = getDMSessionId(LUNA_DM_EMAIL, studentEmail);
    const isLuna = role === 'assistant';
    await base44.entities.ChatMessage.create({
      session_id: sessionId,
      author_email: isLuna ? LUNA_DM_EMAIL : studentEmail,
      author_name: isLuna ? LUNA_DM_NAME : (studentName || 'Aluno'),
      content,
      is_hand_raised: false,
      is_luna_distribution: false,
    });
  } catch {}
}

async function loadLunaMessagesFromServer(studentEmail) {
  if (!studentEmail) return [];
  try {
    const sessionId = getDMSessionId(LUNA_DM_EMAIL, studentEmail);
    const messages = await base44.entities.ChatMessage.filter({ session_id: sessionId }, 'created_date', 500);
    return messages
      .filter(m => !m.is_luna_distribution)
      .map(msg => ({
        role: msg.author_email === LUNA_DM_EMAIL ? 'assistant' : 'user',
        content: msg.content,
      }));
  } catch { return []; }
}

export default function LunaChat({ session, onNavigated, isActive = true, supportMode = false, tuitionMode = false }) {
  const voice = useLunaVoice();
  const { socialName, firstName, isLoading: isSocialIdentityLoading } = useSocialIdentity(session);
  const supportGreeting = `Olá, ${firstName}! 🦉 Eu sou a Luna, uma inteligência artificial programada para ajudar você. Posso orientar e buscar uma solução junto com você, mas tenho limitações: alguns casos precisam ser analisados pela equipe técnica. Pode me contar o que está acontecendo? Vamos tentar resolver por aqui antes de pensar em um chamado.`;
  const greeting = tuitionMode ? TUITION_GREETING : supportMode ? supportGreeting : lunaGreeting(socialName);

  const memoryKey = `luna_chat_${tuitionMode ? 'tuition_' : ''}${session?.email || session?.code || 'anon'}`;
  const savedMessages = loadLunaMemory(memoryKey);
  const hasSavedConversation = Boolean(savedMessages?.length);
  const lastSavedMessage = savedMessages?.[savedMessages.length - 1];
  const savedInteractionCount = countLunaStudentInteractions(savedMessages);
  const savedOffer = lastSavedMessage?.role === 'assistant'
    ? getLunaSupportOffer(lastSavedMessage, SUPPORT_CATEGORIES, savedInteractionCount)
    : null;
  const hadSavedSupportOffer = savedMessages?.some(message =>
    message?.role === 'assistant' && getLunaSupportOffer(message, SUPPORT_CATEGORIES, savedInteractionCount)
  );
  const [messages, setMessages] = useState(
    savedMessages && savedMessages.length > 0
      ? savedOffer ? savedMessages : [...savedMessages, { role: 'assistant', content: '🦉 Continuando nossa conversa de hoje. Como posso te ajudar agora?' }]
      : [{ role: 'assistant', content: greeting }]
  );

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ticketCreating, setTicketCreating] = useState(false);
  const [supportOffer, setSupportOffer] = useState(savedOffer);
  const supportOfferRef = useRef(savedOffer);
  const supportAlreadyOfferedRef = useRef(Boolean(savedOffer || hadSavedSupportOffer));
  const busyRef = useRef(false);
  const endRef = useRef(null);
  const activeRef = useRef(isActive);
  activeRef.current = isActive;
  const supportRef = useRef(supportMode);
  supportRef.current = supportMode;
  const initialSpokenRef = useRef(false);
  const initialVoiceTextRef = useRef(messages[messages.length - 1]?.content || greeting);

  useEffect(() => {
    if (!hasSavedConversation) {
      setMessages([{ role: 'assistant', content: greeting }]);
      initialVoiceTextRef.current = greeting;
    }
  }, [greeting, hasSavedConversation]);

  useEffect(() => {
    if (isActive && !isSocialIdentityLoading && !initialSpokenRef.current) {
      initialSpokenRef.current = true;
      voice.speak(initialVoiceTextRef.current);
    }
  }, [isActive, isSocialIdentityLoading, voice.speak]);
  useEffect(() => { if (!isActive) voice.stop(); }, [isActive]);
  useEffect(() => { if (isActive) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [messages, loading, isActive]);

  useEffect(() => {
    const studentEmail = session?.email || '';
    if (!studentEmail) return;
    loadLunaMessagesFromServer(studentEmail).then(serverMessages => {
      if (serverMessages.length > 0) {
        setMessages(prev => serverMessages.length >= prev.length ? serverMessages : prev);
      }
    });
  }, [session?.email]);

  const respondToSupportOffer = async (confirmed, text) => {
    const offer = supportOfferRef.current;
    if (!offer || busyRef.current) return;
    busyRef.current = true;
    supportOfferRef.current = null;
    setSupportOffer(null);
    voice.stop();
    const userText = text || (confirmed ? 'Sim, abrir chamado.' : 'Não, continuar conversando.');
    const next = [...messages, { role: 'user', content: userText }];
    setMessages(next);
    saveLunaMemory(memoryKey, next);
    saveLunaMessageToServer('user', userText, session?.email, socialName);
    setInput('');
    let reply = 'Tudo bem, não abri nenhum chamado. Vamos continuar conversando: como posso ajudar?';
    try {
      if (confirmed) {
        setTicketCreating(true);
        const studentEmail = session?.email || session?.code || '';
        const studentName = socialName;
        const course = session?.course || 'tcc';
        await base44.entities.SupportTicket.create({
          title: offer.title, description: offer.description, category: offer.category,
          student_email: studentEmail, student_name: studentName, course, status: 'open',
        });
        const dmSessionId = getDMSessionId(LUNA_DM_EMAIL, studentEmail);
        const transcript = buildConversationTranscript(next, studentName);
        const adminMessage = `🎫 CHAMADO DE SUPORTE ABERTO\n\n📋 Assunto: ${offer.title}\n🏷️ Categoria: ${offer.category}\n👤 Aluno: ${studentName} (${studentEmail})\n📝 Descrição: ${offer.description}\n\n${transcript}`;
        await base44.entities.ChatMessage.create({
          session_id: dmSessionId, author_name: LUNA_DM_NAME, author_email: LUNA_DM_EMAIL,
          content: adminMessage, is_hand_raised: false, is_luna_distribution: true,
        });
        reply = `✅ Chamado registrado com sucesso!\n\n📋 Assunto: ${offer.title}\n🏷️ Categoria: ${offer.category}\n\nSua solicitação foi encaminhada para a equipe de suporte. Você pode acompanhar o status na página "Suporte" no menu.`;
        toast.success('Chamado registrado com sucesso!');
      }
    } catch {
      reply = 'Não consegui confirmar o registro do chamado. Confira a página "Suporte" antes de tentar novamente, para evitar duplicidade. Posso continuar ajudando por aqui.';
      toast.error('Não foi possível confirmar o registro do chamado.');
    } finally {
      const updated = [...next, { role: 'assistant', content: reply }];
      setMessages(updated);
      saveLunaMemory(memoryKey, updated);
      saveLunaMessageToServer('assistant', reply, session?.email, socialName);
      setTicketCreating(false);
      busyRef.current = false;
    }
    if (activeRef.current) await voice.speak(reply);
  };

  const send = async (content = input) => {
    const text = String(content || '').trim();
    if (!text || busyRef.current) return;
    const decision = getLunaSupportDecision(text, supportOfferRef.current);
    if (decision) {
      await respondToSupportOffer(decision === 'confirm', text);
      return;
    }
    busyRef.current = true;
    supportOfferRef.current = null;
    setSupportOffer(null);
    const next = [...messages, { role: 'user', content: text }];
    setMessages(next);
    saveLunaMemory(memoryKey, next);
    saveLunaMessageToServer('user', text, session?.email, socialName);
    setInput('');
    setLoading(true);
    voice.stop();
    try {
      const history = next.map((m) => `${m.role === 'user' ? 'Aluno' : 'Luna'}: ${m.content}`).join('\n');
      const apostilaResults = searchApostila(text, 3);
      const apostilaContext = apostilaResults.length > 0
        ? '\n\nCONTEÚDO DA APOSTILA RELACIONADO À PERGUNTA DO ALUNO (use para responder com base no material do curso):\n' +
          apostilaResults.map((l) => `--- ${l.moduleTitle} > ${l.lessonTitle} ---\n${l.lessonContent}`).join('\n\n')
        : '';
      const supportFlag = supportAlreadyOfferedRef.current
        ? '\n\n⚠️ SUPORTE_JÁ_OFERECIDO: Você já ofereceu um chamado de suporte nesta conversa. NÃO inclua "support_offer" novamente. Continue ajudando o aluno normalmente na conversa.'
        : `\n\nINTERAÇÕES DO ALUNO SOBRE O CASO: ${countLunaStudentInteractions(next)}/${MIN_LUNA_SUPPORT_INTERACTIONS}. ${countLunaStudentInteractions(next) < MIN_LUNA_SUPPORT_INTERACTIONS ? 'Ainda não é permitido incluir "support_offer"; continue investigando e orientando.' : 'O mínimo foi atingido, mas só inclua "support_offer" se todas as alternativas úteis tiverem sido esgotadas.'}`;
      const basePrompt = tuitionMode ? LUNA_SYSTEM_PROMPT + TUITION_PROMPT : supportRef.current ? LUNA_SYSTEM_PROMPT + LUNA_SUPPORT_PROMPT_SUFFIX : LUNA_SYSTEM_PROMPT;
      const systemPrompt = basePrompt + SUPPORT_OFFER_PROMPT + apostilaContext + supportFlag;
      const answer = await base44.integrations.Core.InvokeLLM({
        prompt: `${systemPrompt}\n\nNome social do aluno: ${socialName}\n\nConversa:\n${history}\n\nLuna:`,
        response_json_schema: {
          type: 'object',
          properties: {
            answer: { type: 'string' },
            links: { type: 'array', items: { type: 'object', properties: { key: { type: 'string' }, label: { type: 'string' } } } },
            support_offer: {
              type: 'object', description: 'Proposta opcional, nunca uma autorização de abertura. Omitir quando puder ajudar no chat ou quando já tiver oferecido suporte antes nesta conversa.',
              required: ['reason', 'explanation', 'title', 'description', 'category'],
              properties: {
                reason: { type: 'string', enum: LUNA_SUPPORT_REASONS },
                explanation: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                category: { type: 'string', enum: SUPPORT_CATEGORIES },
              },
            },
          },
        },
      });
      const reply = answer?.answer || 'Desculpe, não consegui responder agora. Poderia tentar novamente, por favor?';
      const updatedMessages = [...next, { role: 'assistant', content: reply, links: answer?.links || [] }];
      const offer = getLunaSupportOffer(answer, SUPPORT_CATEGORIES, countLunaStudentInteractions(next));
      if (offer && !supportAlreadyOfferedRef.current) {
        supportAlreadyOfferedRef.current = true;
        supportOfferRef.current = offer;
        setSupportOffer(offer);
        updatedMessages.push({
          role: 'assistant', support_offer: offer,
          content: `Sou uma inteligência artificial programada para ajudar, mas tenho limitações: este caso precisa ser analisado pela equipe técnica.\n\n${offer.explanation}\n\n📋 Assunto: ${offer.title}\n🏷️ Categoria: ${offer.category}\n${offer.description}\n\nVocê deseja abrir um chamado para a equipe atender essa demanda? Nada foi registrado ainda. Escolha "Sim, abrir chamado" ou "Não, continuar conversando".`,
        });
      }
      setMessages(updatedMessages);
      saveLunaMemory(memoryKey, updatedMessages);
      saveLunaMessageToServer('assistant', reply, session?.email, socialName);
      const spokenReply = updatedMessages.slice(next.length).map((message) => message.content).join(' ');
      if (activeRef.current) await voice.speak(spokenReply);
    } catch {
      const errorReply = 'Tive um problema para responder agora. Verifique sua internet e tente de novo, por favor.';
      setMessages((prev) => [...prev, { role: 'assistant', content: errorReply }]);
      saveLunaMessageToServer('assistant', errorReply, session?.email, socialName);
      if (activeRef.current) await voice.speak(errorReply);
    } finally {
      busyRef.current = false;
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
        <button onClick={voice.toggle} title={voice.enabled ? 'Desligar voz da Luna' : 'Ligar voz da Luna'} className={`rounded-xl p-2 transition-colors ${voice.enabled ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300' : 'text-muted-foreground hover:bg-secondary'}`}>{voice.enabled ? <Volume2 size={15} /> : <VolumeX size={15} />}</button>
        <button onClick={() => { if (busyRef.current) return; voice.stop(); clearLunaMemory(memoryKey); supportOfferRef.current = null; setSupportOffer(null); supportAlreadyOfferedRef.current = false; setMessages([{ role: 'assistant', content: greeting }]); voice.speak(greeting); }} disabled={loading || ticketCreating} title="Reiniciar conversa" className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"><RefreshCw size={15} /></button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-3 bg-gradient-to-b from-rose-50/40 to-secondary/20 dark:from-black dark:to-black">
        {tuitionMode && <LunaTuitionIntro />}
        {messages.map((message, index) => (
          <div key={index} className="space-y-2">
            <LunaBubble role={message.role}>{message.content}</LunaBubble>
            {message.role === 'assistant' && message.links && message.links.length > 0 && (<LunaShortcuts links={message.links} onNavigate={() => { voice.stop(); onNavigated?.(); }} />)}
          </div>
        ))}
        {supportOffer && (<div className="flex flex-wrap gap-2" role="group" aria-label="Confirmar abertura de chamado"><Button onClick={() => respondToSupportOffer(true)} disabled={loading || ticketCreating}>Sim, abrir chamado</Button><Button variant="outline" onClick={() => respondToSupportOffer(false)} disabled={loading || ticketCreating}>Não, continuar conversando</Button></div>)}
        {(loading || ticketCreating) && (<LunaBubble role="assistant"><span className="flex items-center gap-1.5 text-muted-foreground">{[0, 0.15, 0.3].map((delay) => (<span key={delay} className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${delay}s` }} />))}{ticketCreating ? 'Registrando chamado...' : 'Luna está pensando...'}</span></LunaBubble>)}
        <div ref={endRef} />
      </div>
      <div className="shrink-0 border-t border-rose-100 bg-rose-50/20 dark:border-white/20 dark:bg-black px-3 py-2">
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-invisible">
          {(tuitionMode ? TUITION_ACTIONS : supportMode ? ['Não consigo acessar minha conta', 'Problema com aulas ou vídeos', 'Problema com tarefa ou prova', 'Problema com mensalidade', 'Outro assunto'] : LUNA_QUICK_ACTIONS).map((action) => (<button key={action} onClick={() => send(action)} disabled={loading || ticketCreating} className="shrink-0 whitespace-nowrap rounded-xl border border-rose-200 dark:border-white/20 bg-background dark:bg-black px-3 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-rose-50 dark:hover:bg-white/10 hover:text-foreground dark:hover:text-white">{action}</button>))}
        </div>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex shrink-0 gap-2 border-t border-rose-100 bg-card dark:border-white/20 dark:bg-black p-3">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Converse com a Luna..." className="h-11 flex-1 border-rose-200 dark:border-white/20" disabled={loading || ticketCreating} />
        <VoiceDictationButton value={input} onChange={setInput} className="h-11 w-11" />
        <Button type="submit" className="h-11 w-11 shrink-0 p-0 bg-rose-500 hover:bg-rose-600" disabled={!input.trim() || loading || ticketCreating}><Send size={16} /></Button>
      </form>
      <p className="shrink-0 pb-2 text-center text-[10px] text-muted-foreground">A Luna é uma inteligência artificial programada para orientar; ela tem limitações e alguns casos precisam da equipe técnica. Em crise, ligue 188 (CVV).</p>
    </div>
  );
}
