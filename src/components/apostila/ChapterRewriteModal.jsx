/**
 * ChapterRewriteModal — ferramenta admin de reescrita de capítulos da apostila.
 * Usa a mesma base de IA do portal (base44.integrations.Core.InvokeLLM, também
 * utilizada no gerador de provas e no Tutor EDU) para reescrever o conteúdo de
 * uma aula seguindo a estrutura padronizada: cabeçalho, 6 tópicos numerados e
 * 6 parágrafos uniformes (~60–65 palavras) por tópico.
 */
import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2, X, Wand2, Save, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const PROFESSOR_LINE = 'Prof. William Ribeiro | WR-EDU® | Instituto de Desenvolvimento Humano';
const DIVIDER_LINE = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

const stripHtml = (value = '') => value
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, '\n\n')
  .replace(/<[^>]*>/g, '')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

const buildRewritePrompt = (lessonTitle, sourceText) => `Você é professor especialista em terapia comportamental e redator didático do Instituto WR-EDU®.
Reescreva integralmente o conteúdo da aula abaixo, preservando o tema central e os conceitos, mas seguindo RIGOROSAMENTE a estrutura exigida.

FORMATO DO CONTEÚDO (obrigatório):
1. Cabeçalho com exatamente 3 linhas:
${lessonTitle.toUpperCase()}
${PROFESSOR_LINE}
${DIVIDER_LINE}
2. Em seguida, EXATAMENTE 6 tópicos numerados (1 a 6), cada um iniciado por uma linha com o número e o título do tópico em MAIÚSCULAS (ex.: "1. TÍTULO DO TÓPICO").
3. Cada tópico deve conter EXATAMENTE 6 parágrafos.
4. Cada parágrafo deve ter aproximadamente 65 palavras, com no mínimo 60 e no máximo 65 palavras. Conte as palavras de cada parágrafo antes de finalizar.
5. Parágrafos são blocos contínuos de texto, SEM quebras de linha internas.
6. Separe cada parágrafo (e cada título de tópico) com UMA linha em branco.

REGRAS DE CONSTÂNCIA (obrigatórias):
- Todos os 36 parágrafos devem ter extensão uniforme, do primeiro ao último.
- NÃO reduza o tamanho dos parágrafos nos tópicos finais nem nos parágrafos de conclusão.
- Mantenha a mesma densidade textual em todo o conteúdo.
- Linguagem técnico-profissional, didática e acessível.
- Cada tópico desenvolve um aspecto do tema central com começo, meio e fechamento.
- O último parágrafo de cada tópico sintetiza ou conclui a ideia apresentada.

Retorne APENAS o texto final da aula, sem comentários, sem markdown e sem explicações adicionais.

CONTEÚDO ORIGINAL DA AULA — ${lessonTitle}:
${sourceText}`;

const extractLlmText = (result) => {
  if (typeof result === 'string') return result;
  if (result && typeof result === 'object') {
    if (typeof result.response === 'string') return result.response;
    if (typeof result.content === 'string') return result.content;
    if (typeof result.text === 'string') return result.text;
  }
  return '';
};

const analyzeStructure = (text = '') => {
  const blocks = text.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  const topicCount = blocks.filter((block) => /^[1-6][.)]\s/.test(block) && block === block.toUpperCase()).length;
  const paragraphs = blocks.filter((block) => !/^[1-6][.)]\s/.test(block) && !block.includes(DIVIDER_LINE.slice(0, 5)) && !block.includes('Prof.') && block.split(/\s+/).length > 20);
  const wordCounts = paragraphs.map((paragraph) => paragraph.split(/\s+/).filter(Boolean).length);
  const outOfRange = wordCounts.filter((count) => count < 60 || count > 65).length;
  return { topicCount, paragraphCount: paragraphs.length, outOfRange };
};

export default function ChapterRewriteModal({ chapters, onClose, onSave, saving }) {
  const [chapterId, setChapterId] = useState(chapters[0]?.id || '');
  const [lessonId, setLessonId] = useState(chapters[0]?.lessons?.[0]?.id || '');
  const [generating, setGenerating] = useState(false);
  const [rewritten, setRewritten] = useState('');

  const chapter = useMemo(() => chapters.find((item) => item.id === chapterId) || null, [chapters, chapterId]);
  const lesson = useMemo(() => chapter?.lessons.find((item) => item.id === lessonId) || null, [chapter, lessonId]);
  const structure = useMemo(() => (rewritten ? analyzeStructure(rewritten) : null), [rewritten]);

  const handleChapterChange = (nextChapterId) => {
    setChapterId(nextChapterId);
    const nextChapter = chapters.find((item) => item.id === nextChapterId);
    setLessonId(nextChapter?.lessons?.[0]?.id || '');
    setRewritten('');
  };

  const handleGenerate = async () => {
    if (!lesson) return;
    setGenerating(true);
    setRewritten('');
    try {
      const sourceText = stripHtml(lesson.content || '');
      if (!sourceText) {
        toast.error('Esta aula ainda não possui conteúdo para reescrever.');
        return;
      }
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: buildRewritePrompt(lesson.title || 'Aula da apostila', sourceText),
        model: 'claude_sonnet_4_6',
      });
      const text = extractLlmText(result).trim();
      if (!text) {
        toast.error('A IA não retornou conteúdo. Tente novamente.');
        return;
      }
      setRewritten(text);
      toast.success('Capítulo reescrito! Revise o resultado antes de salvar.');
    } catch (error) {
      toast.error(`Erro ao reescrever com a IA: ${error?.message || 'tente novamente.'}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = () => {
    if (!chapter || !lesson || !rewritten.trim()) return;
    onSave({ chapterId: chapter.id, lessonId: lesson.id, content: rewritten.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-violet-500/30 bg-card shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-700">
              <Wand2 size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Reescrever capítulo com IA</h2>
              <p className="text-xs text-muted-foreground">6 tópicos em maiúsculas · 6 parágrafos uniformes por tópico (60–65 palavras)</p>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose} aria-label="Fechar">
            <X size={16} />
          </Button>
        </div>

        <div className="space-y-4 p-5">
          {/* Seleção de capítulo e aula */}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs font-semibold text-muted-foreground">
              Capítulo (módulo)
              <select
                value={chapterId}
                onChange={(event) => handleChapterChange(event.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal text-foreground"
              >
                {chapters.map((item) => (
                  <option key={item.id} value={item.id}>{item.title}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-muted-foreground">
              Aula
              <select
                value={lessonId}
                onChange={(event) => { setLessonId(event.target.value); setRewritten(''); }}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal text-foreground"
              >
                {(chapter?.lessons || []).map((item) => (
                  <option key={item.id} value={item.id}>{item.title}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 text-xs leading-relaxed text-muted-foreground">
            A IA reescreve o conteúdo atual da aula preservando o tema e aplicando a estrutura padrão: cabeçalho com
            título em maiúsculas, nome do professor e linha divisória; 6 tópicos numerados com títulos em maiúsculas;
            36 parágrafos contínuos e uniformes (60–65 palavras cada), separados por linha em branco, com linguagem
            técnico-profissional e fechamento conclusivo em cada tópico.
          </div>

          <Button onClick={handleGenerate} disabled={generating || !lesson} className="gap-2">
            {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {generating ? 'Reescrevendo com IA...' : rewritten ? 'Reescrever novamente' : 'Reescrever com IA'}
          </Button>

          {/* Preview */}
          {rewritten && (
            <div className="space-y-3">
              {structure && (
                <div className={`flex flex-wrap items-center gap-2 rounded-xl border p-3 text-xs font-medium ${structure.topicCount === 6 && structure.paragraphCount === 36 && structure.outOfRange === 0
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-400'}`}
                >
                  {structure.topicCount === 6 && structure.paragraphCount === 36 && structure.outOfRange === 0
                    ? <CheckCircle size={14} />
                    : <AlertCircle size={14} />}
                  <span>{structure.topicCount}/6 tópicos</span>
                  <span>·</span>
                  <span>{structure.paragraphCount}/36 parágrafos</span>
                  <span>·</span>
                  <span>{structure.outOfRange} fora da faixa de 60–65 palavras</span>
                </div>
              )}
              <div className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-xl border border-border bg-secondary/20 p-4 text-sm leading-relaxed text-foreground/90">
                {rewritten}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  {saving ? 'Salvando...' : 'Salvar na apostila'}
                </Button>
                <Button size="sm" variant="outline" onClick={handleGenerate} disabled={generating} className="gap-1.5">
                  <RefreshCw size={13} /> Gerar outra versão
                </Button>
                <Button size="sm" variant="ghost" onClick={onClose}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
