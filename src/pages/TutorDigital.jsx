import React, { useState, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Send, Brain, Sparkles, RefreshCw, Heart, Mic, MicOff, Volume2, PhoneCall, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useCourseFilteredEmails from '@/hooks/useCourseFilteredEmails';
import { Input } from '@/components/ui/input';
import { BRAND_LEGAL_NAME } from '@/lib/brand';

const QUICK_ACTIONS = [
  'Como usar a plataforma?',
  'Quais tarefas estão pendentes?',
  'Como funciona o ranking?',
  'Preciso de apoio emocional',
  'Como entro na sala ao vivo?',
  'Como acesso a Unidade Certificadora?',
];

const SYSTEM_CONTEXT = `Você é EDU, o tutor digital da plataforma ${BRAND_LEGAL_NAME}.
Você ajuda alunos a:
- Navegar e usar a plataforma (videoaulas, sala ao vivo, tarefas, fórum, calendário, mensalidades, perfil)
- Entender dinâmicas como datas, prazos, ranking e presença
- Oferecer apoio emocional como um terapeuta virtual gentil e empático
- Responder perguntas sobre a formação em terapia
- Encorajar o aluno em sua jornada de aprendizado

UNIDADE CERTIFICADORA (portal VENES):
Quando o aluno perguntar sobre a certificadora, diploma ou sobre como estudar a apostila, explique:
1. Acesse a Unidade Certificadora pelo menu lateral da plataforma ${BRAND_LEGAL_NAME} (ícone de medalha).
2. Faça login no portal VENES com seu e-mail e senha. Você pode salvar a senha no navegador para facilitar.
3. No menu superior esquerdo, clique em "Meus Cursos".
4. Abra o curso: "Psicoterapia E Terapia Cognitivo Comportamental".
5. Clique em "Acessar Sala de Aula" → "Materiais de Estudo" para estudar a apostila livremente.
6. Quando se sentir preparado(a), clique em "Avaliação Diagnóstica" no portal VENES para solicitar a avaliação.
7. Após realizar a avaliação, comunique ao professor — ele irá te auxiliar pessoalmente para obter o diploma.

Seja caloroso, encorajador, empático e profissional. Use linguagem simples e acessível.
Quando o aluno precisar de apoio emocional, seja um espaço seguro e acolhedor como um terapeuta.
Máximo de 3 parágrafos por resposta. Use emojis com moderação.`;

export default function TutorDigital() {
  const { user: session } = useOutletContext();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Olá, ${session?.name?.split(' ')[0] || 'aluno(a)'}! 😊 Sou o EDU, seu tutor digital da ${BRAND_LEGAL_NAME}.\n\nEstou aqui para te ajudar a navegar pela plataforma, tirar dúvidas sobre a formação em terapia, e também oferecer apoio emocional quando precisar.\n\nComo posso te ajudar hoje?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [listening, setListening] = useState(false);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const { course: routeCourse } = useCourseFilteredEmails();
  const activeCourse = routeCourse || session?.course || 'tcc';

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-tutor', activeCourse],
    queryFn: () => base44.entities.Task.filter({ course: activeCourse }, '-created_date', 20),
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['submissions-mine-tutor'],
    queryFn: () => base44.entities.TaskSubmission.filter({ student_email: session?.email || '' }, '-created_date', 50),
    enabled: !!session?.email,
  });

  const { data: liveSessions = [] } = useQuery({
    queryKey: ['live-sessions-tutor', activeCourse],
    queryFn: () => base44.entities.LiveSession.filter({ course: activeCourse }, '-scheduled_at', 5),
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!voiceMode || messages[messages.length - 1]?.role !== 'assistant') return;
    const speech = window.speechSynthesis;
    if (!speech) return;
    speech.cancel();
    const utterance = new SpeechSynthesisUtterance(messages[messages.length - 1].content.replace(/[😊📚🎉]/g, ''));
    utterance.lang = 'pt-BR';
    utterance.rate = 0.98;
    speech.speak(utterance);
  }, [messages, voiceMode]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop?.();
      window.speechSynthesis?.cancel?.();
    };
  }, []);

  const buildContext = () => {
    const pendingTasks = tasks.filter(t => !submissions.find(s => s.task_id === t.id));
    const nextLive = liveSessions.find(s => s.status === 'live' || s.status === 'scheduled');
    return `
Contexto do aluno:
- Nome: ${session?.name || 'Aluno'}
- Tarefas pendentes: ${pendingTasks.length} (${pendingTasks.slice(0, 3).map(t => t.title).join(', ')})
- Próxima aula ao vivo: ${nextLive ? `${nextLive.title} - ${nextLive.scheduled_at ? new Date(nextLive.scheduled_at).toLocaleString('pt-BR') : 'sem data'}` : 'nenhuma agendada'}
`;
  };

  const sendMessage = async (content = input) => {
    if (!content.trim() || loading) return;
    const userMsg = { role: 'user', content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    const context = buildContext();
    const prompt = `${SYSTEM_CONTEXT}\n\n${context}\n\nConversa:\n${newMessages.map(m => `${m.role === 'user' ? 'Aluno' : 'EDU'}: ${m.content}`).join('\n')}\n\nEDU:`;

    const response = await base44.integrations.Core.InvokeLLM({ prompt });
    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setLoading(false);
  };

  const toggleVoiceMode = () => {
    const next = !voiceMode;
    setVoiceMode(next);
    if (!next) {
      recognitionRef.current?.stop?.();
      window.speechSynthesis?.cancel?.();
      setListening(false);
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition || loading) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript) sendMessage(transcript);
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <div className="flex flex-col h-full max-h-screen bg-background">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-card flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-md shadow-purple-500/30">
          <Brain size={20} className="text-white" />
        </div>
        <div>
          <h2 className="font-bold text-sm text-foreground flex items-center gap-1.5">
            EDU — Tutor Digital <Sparkles size={13} className="text-yellow-400 fill-yellow-400" />
          </h2>
          <p className="text-xs text-muted-foreground">Seu assistente de aprendizado e bem-estar</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={toggleVoiceMode}
            className={`p-2 rounded-xl transition-colors ${voiceMode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
            title={voiceMode ? 'Encerrar chamada com EDU' : 'Iniciar chamada com EDU'}
          >
            {voiceMode ? <PhoneOff size={15} /> : <PhoneCall size={15} />}
          </button>
          <button
            onClick={() => setMessages([messages[0]])}
            className="text-muted-foreground hover:text-foreground hover:bg-secondary p-2 rounded-xl transition-colors"
            title="Reiniciar conversa"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {voiceMode && (
        <div className="mx-4 mt-3 rounded-2xl border border-primary/20 bg-primary/8 p-3 flex items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground animate-pulse">
            <Volume2 size={17} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">Chamada com o EDU ativa</p>
            <p className="text-xs text-muted-foreground">Toque no microfone e converse por voz.</p>
          </div>
          <button
            onClick={startListening}
            disabled={loading || listening}
            className={`w-11 h-11 rounded-full flex items-center justify-center text-white transition-all ${listening ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-br from-pink-500 to-purple-600'} disabled:opacity-50`}
          >
            {listening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
                <Brain size={14} className="text-white" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-tr-sm'
                  : 'bg-card border border-border text-foreground rounded-tl-sm'
              }`}
            >
              {msg.content.split('\n').map((line, li) => (
                <span key={li}>{line}{li < msg.content.split('\n').length - 1 && <br />}</span>
              ))}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
              <Brain size={14} className="text-white" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1">
                {[0, 0.2, 0.4].map((d, i) => (
                  <div key={i} className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">EDU está pensando...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick actions */}
      <div className="px-4 py-2 border-t border-border bg-card/50">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {QUICK_ACTIONS.map(action => (
            <button
              key={action}
              onClick={() => sendMessage(action)}
              disabled={loading}
              className="shrink-0 text-xs bg-secondary hover:bg-secondary/70 text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-xl transition-colors font-medium whitespace-nowrap border border-border"
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card shrink-0">
        <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
          <button
            type="button"
            onClick={startListening}
            disabled={loading || listening}
            className={`h-11 w-11 rounded-xl flex items-center justify-center text-white shrink-0 transition-all ${listening ? 'bg-red-500 animate-pulse' : 'bg-secondary text-foreground border border-border'} disabled:opacity-50`}
            title="Falar com o EDU"
          >
            {listening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Pergunte ao EDU..."
            className="flex-1 h-11"
            disabled={loading}
          />
          <Button type="submit" className="h-11 w-11 p-0 shrink-0 bg-gradient-to-br from-pink-500 to-purple-600 border-0 hover:opacity-90" disabled={!input.trim() || loading}>
            <Send size={16} />
          </Button>
        </form>
        <p className="text-[10px] text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
          <Heart size={9} className="text-pink-400 fill-pink-400" /> EDU oferece suporte com empatia e cuidado
        </p>
      </div>
    </div>
  );
}