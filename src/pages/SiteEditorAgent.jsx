import React, { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import OptimizationSuggestionCard from '@/components/admin/OptimizationSuggestionCard';
import { Bot, Wand2, Send, Sparkles, ShieldCheck, Settings2, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const SITE_TOOLS = [
  'Dashboard administrativo', 'Aulas gravadas', 'Sala ao vivo', 'Tarefas', 'Provas',
  'Chat da turma', 'Fórum de dúvidas', 'Terapeuta da Semana', 'Monitores',
  'Gestão de alunos', 'Códigos de acesso', 'Mensalidades', 'Controle de Pontuação',
  'Histórico Acadêmico', 'Avisos', 'Instagram Institucional', 'Tutor Digital',
  'Calendário', 'Certificação'
];

const FALLBACK_SUGGESTIONS = [
  {
    title: 'Criar painel de prioridade operacional',
    area: 'Dashboard administrativo',
    summary: 'Organizar pendências críticas em uma visão única para reduzir cliques e decisões repetidas.',
    problem: 'Hoje o administrador precisa navegar por várias áreas para entender o que exige ação imediata.',
    solution: 'Adicionar um bloco de prioridade com correções pendentes, alunos sem atividade, mensalidades atrasadas e lives sem presença.'
  },
  {
    title: 'Padronizar alertas de pendência',
    area: 'Controle de Pontuação',
    summary: 'Deixar claro o que ainda precisa ser corrigido e qual impacto isso tem no ranking.',
    problem: 'Algumas pendências podem passar despercebidas quando existem muitos alunos e tarefas.',
    solution: 'Criar etiquetas por gravidade e um filtro rápido para “mais urgente”, “sem nota” e “ranking afetado”.'
  },
  {
    title: 'Melhorar chamada para participação',
    area: 'Fórum de dúvidas',
    summary: 'Aumentar engajamento com sugestões de perguntas e destaques de boas participações.',
    problem: 'Alunos podem ficar inseguros sobre o que postar ou como participar melhor.',
    solution: 'Exibir prompts semanais de discussão e destacar comentários úteis para virar conteúdo institucional.'
  }
];

function buildPrompt(requestText, mode, courseName) {
  return `Você é o Agente Editor IA do WR-EDU, uma plataforma educacional com áreas administrativas e estudantis.\n\nCurso ativo: ${courseName || 'geral'}\nFerramentas existentes: ${SITE_TOOLS.join(', ')}.\n\nModo: ${mode}.\nPedido do administrador: ${requestText || 'Faça uma análise profunda e sugira uma otimização coerente para uma ferramenta do site.'}\n\nResponda em português do Brasil, de forma prática, segura e objetiva. Se for uma solicitação de mudança, transforme em um plano de implementação claro. Se for sugestão, identifique uma falha ou problema real e proponha um ajuste específico. Não prometa editar código automaticamente.`;
}

export default function SiteEditorAgent() {
  const { user: session } = useOutletContext();
  const queryClient = useQueryClient();
  const isTeacher = session?.role === 'admin';
  const [requestText, setRequestText] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Sou o Agente Editor IA. Descreva uma mudança interna, peça uma análise ou clique em “Sugestões de otimização”.' }
  ]);
  const [suggestion, setSuggestion] = useState(null);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const courseName = useMemo(() => ({ tcc: 'TCC', psicanalise: 'Psicanálise', sexologia: 'Sexologia' }[session?.course] || 'Geral'), [session?.course]);

  const saveMutation = useMutation({
    mutationFn: (payload) => base44.entities.SiteImprovementRequest.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-improvement-requests'] });
      toast.success('Ideia registrada para implementação.');
    },
  });

  const askAgent = async () => {
    if (!requestText.trim()) return;
    const userMessage = { role: 'user', content: requestText.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: buildPrompt(requestText.trim(), 'pedido digitado', courseName),
    });
    setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
    setRequestText('');
    setLoading(false);
  };

  const generateSuggestion = async () => {
    setLoading(true);
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: buildPrompt('', 'sugestão de otimização profunda', courseName),
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          area: { type: 'string' },
          summary: { type: 'string' },
          problem: { type: 'string' },
          solution: { type: 'string' }
        },
        required: ['title', 'area', 'summary', 'problem', 'solution']
      }
    });
    setSuggestion(response);
    setMessages((prev) => [...prev, { role: 'assistant', content: `Sugestão gerada: ${response.title}\n\n${response.summary}` }]);
    setLoading(false);
  };

  const nextIdea = () => {
    const next = FALLBACK_SUGGESTIONS[suggestionIndex % FALLBACK_SUGGESTIONS.length];
    setSuggestion(next);
    setSuggestionIndex((prev) => prev + 1);
  };

  const applyIdea = () => {
    if (!suggestion) return;
    saveMutation.mutate({
      title: suggestion.title,
      area: suggestion.area,
      request_text: suggestion.problem,
      ai_response: `${suggestion.summary}\n\nSolução: ${suggestion.solution}`,
      status: 'approved'
    });
  };

  if (!isTeacher) {
    return (
      <div className="p-4 lg:p-7 max-w-3xl mx-auto">
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <Bot size={42} className="mx-auto text-muted-foreground mb-3" />
          <p className="font-bold text-foreground">Ferramenta disponível apenas no administrativo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-7 max-w-6xl mx-auto space-y-5 animate-fade-in-up">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
            <Bot size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl lg:text-2xl font-bold text-foreground">Agente Editor IA</h2>
            <p className="text-sm text-muted-foreground">Planeje mudanças internas e gere propostas de otimização para o próprio site.</p>
          </div>
        </div>
        <Badge variant="secondary" className="hidden sm:inline-flex">Admin · {courseName}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              <h3 className="font-bold text-sm">Solicitações digitáveis</h3>
            </div>
            <Button variant="outline" size="sm" onClick={generateSuggestion} disabled={loading} className="gap-2">
              <Wand2 size={14} /> Sugestões de otimização
            </Button>
          </div>

          <div className="p-4 space-y-3 min-h-[380px] max-h-[520px] overflow-y-auto bg-secondary/20">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-foreground'}`}>
                  {message.content}
                </div>
              </div>
            ))}
            {loading && <div className="text-xs text-muted-foreground animate-pulse">Analisando profundamente...</div>}
          </div>

          <div className="p-4 border-t border-border space-y-3">
            <Textarea
              value={requestText}
              onChange={(e) => setRequestText(e.target.value)}
              placeholder="Digite o que deseja mudar, revisar ou melhorar no site..."
              className="min-h-24"
            />
            <div className="flex justify-end">
              <Button onClick={askAgent} disabled={loading || !requestText.trim()} className="gap-2">
                <Send size={14} /> Enviar solicitação
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:sticky lg:top-5">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-green-600" />
              <h3 className="font-bold text-sm">Liberdade assistida</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              O agente prepara planos e registra ideias aprovadas. Mudanças reais no código continuam passando pelo assistente de desenvolvimento para manter segurança e controle.
            </p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Settings2 size={16} className="text-primary" />
              <h3 className="font-bold text-sm">Áreas avaliadas</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SITE_TOOLS.slice(0, 12).map((tool) => <Badge key={tool} variant="secondary" className="text-[10px]">{tool}</Badge>)}
            </div>
          </div>
          <OptimizationSuggestionCard
            suggestion={suggestion}
            onNext={nextIdea}
            onApply={applyIdea}
            onClose={() => setSuggestion(null)}
            applying={saveMutation.isPending}
          />
          {saveMutation.isSuccess && (
            <div className="bg-green-50 border border-green-100 rounded-2xl p-3 flex items-center gap-2 text-sm text-green-800">
              <ClipboardCheck size={15} /> Ideia pronta para ser aplicada pelo desenvolvimento.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}