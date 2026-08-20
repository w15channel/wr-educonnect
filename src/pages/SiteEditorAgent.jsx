import React, { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import OptimizationSuggestionCard from '@/components/admin/OptimizationSuggestionCard';
import { Bot, Wand2, Send, Sparkles, ShieldCheck, Settings2, ClipboardCheck, MousePointerClick, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { BRAND_LEGAL_NAME } from '@/lib/brand';

const SITE_TOOLS = [
  'Dashboard administrativo', 'Aulas gravadas', 'Apostila', 'Tarefas', 'Provas',
  'Chat da turma', 'Fórum de dúvidas', 'Terapeuta da Semana', 'Monitores',
  'Gestão de alunos', 'Códigos de acesso', 'Mensalidades', 'Controle de Pontuação',
  'Histórico Acadêmico', 'Avisos', 'Instagram Institucional', 'Tutor Digital',
  'Calendário', 'Certificação'
];

const SITE_ITEM_CATALOG = [
  { id: 'chat-poll', area: 'Chat da turma', label: 'Enquetes e votações', position: 'Cabeçalho do chat e ações rápidas da turma', behavior: 'Permite criar enquete, votar, encerrar e mostrar resultado em tempo real.' },
  { id: 'chat-reactions', area: 'Chat da turma', label: 'Reações com emoji', position: 'Rodapé de cada mensagem e menu contextual', behavior: 'Permite reagir, remover reação e visualizar total por emoji.' },
  { id: 'chat-topics', area: 'Chat da turma', label: 'Tópicos e busca histórica', position: 'Barra lateral de filtros e campo de busca', behavior: 'Organiza mensagens por tópico e facilita recuperação de conversas antigas.' },
  { id: 'chat-notifications', area: 'Chat da turma', label: 'Notificações personalizadas', position: 'Preferências do usuário e sino de notificações', behavior: 'Define alertas por tipo: nova mensagem, menção, resposta em tópico e avisos críticos.' },
  { id: 'forum-categories', area: 'Fórum de dúvidas', label: 'Categorização de dúvidas', position: 'Formulário de nova pergunta e filtros do fórum', behavior: 'Classifica perguntas por categoria e melhora triagem por monitoria.' },
  { id: 'forum-votes', area: 'Fórum de dúvidas', label: 'Votação de melhores respostas', position: 'Ações de cada resposta', behavior: 'Permite voto útil, destaca resposta mais útil e melhora ranqueamento interno.' },
  { id: 'forum-monitor-alerts', area: 'Fórum de dúvidas', label: 'Alertas para monitores/tutores', position: 'Painel administrativo e centro de notificações', behavior: 'Dispara alerta para pergunta nova, sem resposta e tópicos críticos.' },
  { id: 'admin-automation-agent', area: 'Administrativo', label: 'Agente de automação flutuante', position: 'Overlay global com seletor de elementos', behavior: 'Seleciona item visualmente, descreve função/comportamento e propõe melhorias em prompt executável externamente.' }
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

function buildPrompt(requestText, mode, courseName, selectedItem) {
  const selectedContext = selectedItem
    ? `\nItem selecionado: ${selectedItem.label}\nÁrea: ${selectedItem.area}\nPosição: ${selectedItem.position}\nComportamento: ${selectedItem.behavior}`
    : '\nNenhum item específico foi selecionado.';

  return `Você é o Agente Editor IA da ${BRAND_LEGAL_NAME}, uma plataforma educacional com áreas administrativas e estudantis.

Curso ativo: ${courseName || 'geral'}
Ferramentas existentes: ${SITE_TOOLS.join(', ')}.
Catálogo interno de itens mapeados: ${SITE_ITEM_CATALOG.map((item) => `${item.label} [${item.area}]`).join('; ')}.${selectedContext}

Modo: ${mode}.
Pedido do administrador: ${requestText || 'Faça uma análise profunda e sugira uma otimização coerente para uma ferramenta do site.'}

Tarefa obrigatória:
1) Diagnosticar falhas, riscos e oportunidades do item/fluxo.
2) Responder com proposta em formato de PROMPT para execução por editor externo.
3) Incluir: objetivo, escopo, regras técnicas, critérios de aceite e checklist de validação.
4) Não prometer alteração automática dentro do produto; você apenas orienta melhorias.

Responda em português do Brasil, de forma prática, segura e objetiva.`;
}

export default function SiteEditorAgent() {
  const { user: session } = useOutletContext();
  const queryClient = useQueryClient();
  const isTeacher = session?.role === 'admin';
  const [requestText, setRequestText] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('none');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Sou o Agente Editor IA. Posso mapear itens internos, apontar função/posição/comportamento e gerar prompts de melhoria para execução externa.' }
  ]);
  const [suggestion, setSuggestion] = useState(null);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const courseName = useMemo(() => ({ tcc: 'TCC', psicanalise: 'Psicanálise', sexologia: 'Sexologia' }[session?.course] || 'Geral'), [session?.course]);
  const selectedItem = useMemo(() => SITE_ITEM_CATALOG.find((item) => item.id === selectedItemId), [selectedItemId]);

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
      prompt: buildPrompt(requestText.trim(), 'pedido digitado', courseName, selectedItem),
    });
    setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
    setRequestText('');
    setLoading(false);
  };

  const inspectSelectedItem = async () => {
    if (!selectedItem) {
      toast.error('Selecione um item para inspeção.');
      return;
    }

    setLoading(true);
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: buildPrompt(`Inspecione o item selecionado e proponha melhorias detalhadas: ${selectedItem.label}`, 'inspeção guiada de item', courseName, selectedItem),
    });

    setMessages((prev) => ([
      ...prev,
      { role: 'assistant', content: `Item selecionado: ${selectedItem.label}\nÁrea: ${selectedItem.area}\nPosição: ${selectedItem.position}\nComportamento: ${selectedItem.behavior}` },
      { role: 'assistant', content: response }
    ]));
    setLoading(false);
  };

  const generateSuggestion = async () => {
    setLoading(true);
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: buildPrompt('', 'sugestão de otimização profunda', courseName, selectedItem),
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
            <Bot size={24} className="text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl lg:text-2xl font-bold text-foreground">Agente Editor IA</h2>
            <p className="text-sm text-muted-foreground">Agente flutuante para inspeção de itens, diagnóstico interno e geração de prompts para ajustes externos.</p>
          </div>
        </div>
        <Badge variant="secondary" className="hidden sm:inline-flex">Admin · {courseName}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              <h3 className="font-bold text-sm">Solicitações digitáveis</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={generateSuggestion} disabled={loading} className="gap-2">
                <Wand2 size={14} /> Sugestões de otimização
              </Button>
              <Button variant="outline" size="sm" onClick={inspectSelectedItem} disabled={loading || !selectedItem} className="gap-2">
                <MousePointerClick size={14} /> Inspecionar item
              </Button>
            </div>
          </div>

          <div className="p-4 border-b border-border bg-secondary/10 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Seletor de item (modo flutuante)</p>
            <Select value={selectedItemId} onValueChange={setSelectedItemId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um item interno do site" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum item selecionado</SelectItem>
                {SITE_ITEM_CATALOG.map((item) => (
                  <SelectItem key={item.id} value={item.id}>{item.area} · {item.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedItem && (
              <div className="text-xs text-muted-foreground bg-card border border-border rounded-xl p-3 leading-relaxed">
                <p><strong>Item:</strong> {selectedItem.label}</p>
                <p><strong>Posição:</strong> {selectedItem.position}</p>
                <p><strong>Comportamento:</strong> {selectedItem.behavior}</p>
              </div>
            )}
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
              placeholder="Pergunte o que melhorar e receba um prompt técnico pronto para execução externa..."
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
              <ShieldCheck size={16} className="text-primary" />
              <h3 className="font-bold text-sm">Liberdade assistida</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              O agente agora mapeia itens internos, avalia falhas e gera prompts de implementação. Mudanças reais continuam sendo aplicadas por editores externos.
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
          <div className="bg-accent border border-primary rounded-2xl p-3 flex items-start gap-2 text-xs text-primary">
            <AlertTriangle size={14} className="mt-0.5" />
            <p>Para diagnóstico completo do site, amplie gradualmente o catálogo interno de itens com posição e comportamento observado em produção.</p>
          </div>
          <OptimizationSuggestionCard
            suggestion={suggestion}
            onNext={nextIdea}
            onApply={applyIdea}
            onClose={() => setSuggestion(null)}
            applying={saveMutation.isPending}
          />
          {saveMutation.isSuccess && (
            <div className="bg-accent border border-primary rounded-2xl p-3 flex items-center gap-2 text-sm text-primary">
              <ClipboardCheck size={15} /> Ideia pronta para ser aplicada pelo desenvolvimento.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
