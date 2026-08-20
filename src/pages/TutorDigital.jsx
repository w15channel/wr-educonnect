import React, { useState, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Send, Brain, Sparkles, RefreshCw, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useCourseFilteredEmails from '@/hooks/useCourseFilteredEmails';
import { Input } from '@/components/ui/input';
import { BRAND_LEGAL_NAME } from '@/lib/brand';

const QUICK_ACTIONS = [
  'Como usar a plataforma?',
  'Quais tarefas estão pendentes?',
  'Como funciona o ranking?',
  'Preciso de apoio emocional',
  'Como acesso a apostila?',
  'Como acesso a Unidade Certificadora?',
];

const SYSTEM_CONTEXT = `Você é EDU, o tutor digital da plataforma ${BRAND_LEGAL_NAME}.
Você ajuda alunos a:
- Navegar e usar a plataforma (videoaulas, apostila, tarefas, fórum, calendário, mensalidades, perfil)
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
  const chatEndRef = useRef(null);
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildContext = () => {
    const pendingTasks = tasks.filter(t => !t.is_hidden && !submissions.find(s => s.task_id === t.id));
    return `
Contexto do aluno:
- Nome: ${session?.name || 'Aluno'}
- Tarefas pendentes: ${pendingTasks.length} (${pendingTasks.slice(0, 3).map(t => t.title).join(', ')})
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

  return (
    <div className="flex flex-col h-full max-h-screen bg-background">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-card flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-md shadow-purple-500/30">
          <Brain size={20} className="text-primary-foreground" />
        </div>
        <div>
          <h2 className="font-bold text-sm text-foreground flex items-center gap-1.5">
            EDU — Tutor Digital <Sparkles size={13} className="text-primary fill-yellow-400" />
          </h2>
          <p className="text-xs text-muted-foreground">Seu assistente de aprendizado e bem-estar</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={() => setMessages([messages[0]])}
            className="text-muted-foreground hover:text-foreground hover:bg-secondary p-2 rounded-xl transition-colors"
            title="Reiniciar conversa"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center shrink-0 shadow-sm">
                <Brain size={14} className="text-primary-foreground" />
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
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center shrink-0 shadow-sm">
              <Brain size={14} className="text-primary-foreground" />
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
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Pergunte ao EDU..."
            className="flex-1 h-11"
            disabled={loading}
          />
          <Button type="submit" className="h-11 w-11 p-0 shrink-0 bg-gradient-to-br from-accent to-primary border-0 hover:opacity-90" disabled={!input.trim() || loading}>
            <Send size={16} />
          </Button>
        </form>
        <p className="text-[10px] text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
          <Heart size={9} className="text-primary fill-pink-400" /> EDU oferece suporte com empatia e cuidado
        </p>
      </div>
    </div>
  );
}