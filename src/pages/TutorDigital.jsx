import React, { useState, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Send, Bot, User, Sparkles, RefreshCw, BookOpen, Brain, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ReactMarkdown from 'react-markdown';

const SYSTEM_PROMPT = `Você é o Tutor Digital, um assistente educacional empático e acolhedor da plataforma EduConnect.

Seu papel combina o de um tutor acadêmico com o de um terapeuta de aprendizagem. Você:

1. **Responde dúvidas teóricas** de qualquer disciplina com clareza, exemplos e linguagem acessível.
2. **Acolhe emocionalmente** alunos que estão com dificuldades, ansiedade ou desmotivação — respondendo com empatia como um terapeuta faria.
3. **Orienta o uso da plataforma** EduConnect: videoaulas, tarefas, sala ao vivo, fórum, calendário, mensalidades, perfil e todos os recursos disponíveis.
4. **Motiva** os alunos, celebra pequenas conquistas e ajuda a criar estratégias de estudo.
5. **Nunca faz diagnósticos médicos** — quando percebe situação de crise, encoraja buscar apoio profissional.

Plataforma EduConnect — guia rápido para você informar alunos:
- 📹 Videoaulas: assista no seu ritmo, marque como assistida, escreva resumos e comentários
- ✅ Tarefas e Provas: envie arquivos ou responda quizzes dentro da plataforma
- 🔴 Sala ao Vivo: acompanhe as lives do canal YouTube, Zoom, Meet ou Instagram
- 💬 Fórum: tire dúvidas por tema com professores e colegas
- 📅 Calendário: veja datas de provas, aulas e eventos
- 💰 Mensalidades: acompanhe seu status financeiro
- 👤 Perfil: atualize seus dados, foto e cor do avatar
- 🏆 Dashboard: veja seu ranking, notas e progresso nas aulas

Responda sempre em português brasileiro. Seja cálido, encorajador e objetivo. Use markdown quando ajudar na clareza.`;

const WELCOME_MSG = {
  role: 'assistant',
  content: `Olá! 👋 Sou o **Tutor Digital** da EduConnect.

Estou aqui para ajudar você de várias formas:

- 🎓 **Dúvidas acadêmicas** — explico qualquer tema das suas aulas
- 💙 **Suporte emocional** — se estiver ansioso, desmotivado ou sobrecarregado, pode falar comigo
- 🛠️ **Usar a plataforma** — te guio em qualquer funcionalidade do EduConnect

Como posso te ajudar hoje?`,
};

const SUGGESTIONS = [
  'Como faço para enviar uma tarefa?',
  'Estou me sentindo sobrecarregado com os estudos',
  'Explica o que é fotossíntese',
  'Como funciona a sala ao vivo?',
  'Não estou conseguindo me concentrar',
  'Como ver minhas notas?',
];

export default function TutorDigital() {
  const { user: session } = useOutletContext();
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: userText };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setLoading(true);

    // Build prompt with conversation context (last 10 messages)
    const historyContext = newHistory.slice(-10)
      .map(m => `${m.role === 'user' ? 'Aluno' : 'Tutor'}: ${m.content}`)
      .join('\n\n');

    const fullPrompt = `${SYSTEM_PROMPT}

--- HISTÓRICO DA CONVERSA ---
${historyContext}

--- RESPONDA AGORA COMO TUTOR ---`;

    const response = await base44.integrations.Core.InvokeLLM({ prompt: fullPrompt });
    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetChat = () => {
    setMessages([WELCOME_MSG]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-h-[900px] p-4 lg:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Brain size={22} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              Tutor Digital <Sparkles size={16} className="text-violet-500" />
            </h2>
            <p className="text-xs text-muted-foreground">IA educacional e de apoio emocional</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={resetChat} className="gap-1.5 text-muted-foreground text-xs">
          <RefreshCw size={14} /> Nova conversa
        </Button>
      </div>

      {/* Info pills */}
      <div className="flex gap-2 flex-wrap mb-4 shrink-0">
        {[
          { icon: BookOpen, label: 'Dúvidas acadêmicas', color: 'text-blue-500 bg-blue-50 border-blue-100' },
          { icon: Heart, label: 'Suporte emocional', color: 'text-pink-500 bg-pink-50 border-pink-100' },
          { icon: Bot, label: 'Guia da plataforma', color: 'text-violet-500 bg-violet-50 border-violet-100' },
        ].map(({ icon: Icon, label, color }) => (
          <span key={label} className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${color}`}>
            <Icon size={12} /> {label}
          </span>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
              msg.role === 'user'
                ? 'text-white text-xs font-bold'
                : 'bg-gradient-to-br from-violet-500 to-purple-600'
            }`} style={msg.role === 'user' ? { backgroundColor: session?.avatarColor || '#6366f1' } : {}}>
              {msg.role === 'user'
                ? (session?.name?.charAt(0)?.toUpperCase() || <User size={14} />)
                : <Brain size={15} className="text-white" />
              }
            </div>

            {/* Bubble */}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-tr-sm'
                : 'bg-card border border-border text-foreground rounded-tl-sm shadow-sm'
            }`}>
              {msg.role === 'assistant' ? (
                <ReactMarkdown
                  className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 prose-p:my-1 prose-ul:my-1 prose-li:my-0"
                  components={{
                    p: ({ children }) => <p className="my-1">{children}</p>,
                    ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                    ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
                    li: ({ children }) => <li className="my-0.5">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {/* Loading */}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
              <Brain size={15} className="text-white" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestions (show only at beginning) */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 my-3 shrink-0">
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="text-xs border border-border bg-card hover:bg-secondary rounded-full px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 mt-3 shrink-0">
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escreva sua dúvida ou como está se sentindo... (Enter para enviar)"
          rows={2}
          className="flex-1 resize-none text-sm"
          disabled={loading}
        />
        <Button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="h-full px-4 bg-gradient-to-b from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
        >
          <Send size={18} />
        </Button>
      </div>
      <p className="text-center text-[10px] text-muted-foreground mt-2 shrink-0">
        Tutor Digital usa IA — não substitui atendimento médico ou psicológico profissional.
      </p>
    </div>
  );
}