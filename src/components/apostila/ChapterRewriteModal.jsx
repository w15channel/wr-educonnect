/**
 * ChapterRewriteModal — gerador estruturado de aulas para a apostila.
 * Divide o trabalho por tópico para evitar truncamento e valida localmente
 * cada requisito antes de salvar o texto final.
 */
import { invokePollinations } from '@/lib/pollinationsAI';
import React, { useMemo, useState } from 'react';
import { Sparkles, Loader2, X, Wand2, Save, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { parseLesson, buildLessonText, analyzeLesson, countWords, TOPIC_COUNT, PARAGRAPHS_PER_TOPIC, MIN_WORDS, MAX_WORDS } from '@/lib/apostilaStructure';

const stripHtml = (value = '') => {
  if (!/<[^>]+>/.test(value)) return value.trim();
  if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(value, 'text/html');
    const blocks = Array.from(doc.body.querySelectorAll('p, li, h1, h2, h3, h4, blockquote'));
    const parts = (blocks.length ? blocks : [doc.body])
      .map((node) => node.textContent?.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    return parts.join('\n\n');
  }
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
};

const outlineSchema = {
  type: 'object',
  properties: {
    topics: {
      type: 'array', minItems: TOPIC_COUNT, maxItems: TOPIC_COUNT,
      items: {
        type: 'object',
        properties: { title: { type: 'string' }, focus: { type: 'string' } },
        required: ['title', 'focus'], additionalProperties: false,
      },
    },
  },
  required: ['topics'], additionalProperties: false,
};

const topicSchema = {
  type: 'object',
  properties: {
    paragraphs: {
      type: 'array', minItems: PARAGRAPHS_PER_TOPIC, maxItems: PARAGRAPHS_PER_TOPIC,
      items: { type: 'string' },
    },
  },
  required: ['paragraphs'], additionalProperties: false,
};

const normalizeParagraph = (value) => String(value || '').replace(/\s+/g, ' ').trim();

function validateTopicParagraphs(paragraphs) {
  const issues = [];
  if (!Array.isArray(paragraphs) || paragraphs.length !== PARAGRAPHS_PER_TOPIC) {
    issues.push(`O tópico deve conter exatamente ${PARAGRAPHS_PER_TOPIC} parágrafos.`);
    return issues;
  }
  paragraphs.forEach((paragraph, index) => {
    const words = countWords(paragraph);
    if (words < MIN_WORDS || words > MAX_WORDS) {
      issues.push(`Parágrafo ${index + 1}: ${words} palavras; exigidas ${MIN_WORDS}–${MAX_WORDS}.`);
    }
  });
  return issues;
}

function validateOutline(result) {
  const topics = Array.isArray(result?.topics) ? result.topics : [];
  if (topics.length !== TOPIC_COUNT) throw new Error(`A IA não definiu exatamente ${TOPIC_COUNT} tópicos. Gere novamente.`);
  const normalized = topics.map((topic) => ({
    title: String(topic?.title || '').replace(/^\d+[.)]\s*/, '').trim().toLocaleUpperCase('pt-BR'),
    focus: String(topic?.focus || '').trim(),
  }));
  if (normalized.some((topic) => !topic.title || !topic.focus)) throw new Error('A estrutura temática veio incompleta. Gere novamente.');
  if (new Set(normalized.map((topic) => topic.title)).size !== TOPIC_COUNT) throw new Error('A IA repetiu títulos de tópico. Gere novamente.');
  return normalized;
}

async function generateTopic({ outline, lessonTitle, sourceText, courseTitle, index, onStage }) {
  const context = courseTitle ? `Área de formação: ${courseTitle}.` : 'Área: terapia comportamental.';
  const prompt = `Você é redator didático técnico-profissional do Instituto WR-EDU®. ${context}
Escreva SOMENTE o conteúdo do tópico ${index + 1} de ${TOPIC_COUNT} da aula "${lessonTitle}".
Título planejado: ${outline.title}
Foco obrigatório deste tópico: ${outline.focus}

REGRAS INEGOCIÁVEIS:
- Devolva exatamente ${PARAGRAPHS_PER_TOPIC} parágrafos em JSON, sem título e sem qualquer comentário.
- Cada parágrafo deve conter entre ${MIN_WORDS} e ${MAX_WORDS} palavras. Conte as palavras antes de responder.
- Cada parágrafo deve ser um bloco contínuo, sem quebras de linha internas.
- Use linguagem técnico-profissional, didática e acessível, em português do Brasil.
- Preserve o sentido e os conceitos presentes na aula-base; não invente citações, autores, dados, diagnósticos ou recomendações que não estejam sustentados pelo material.
- Desenvolva uma sequência coerente com começo, aprofundamento e fechamento; o sexto parágrafo sintetiza o tópico.
- Não repita conteúdo de forma artificial para atingir a extensão.

AULA-BASE:
${sourceText}`;

  onStage?.(`Escrevendo tópico ${index + 1}/${TOPIC_COUNT}...`);
  const first = await invokePollinations({ prompt, response_json_schema: topicSchema, temperature: 0.2 });
  let paragraphs = Array.isArray(first?.paragraphs) ? first.paragraphs.map(normalizeParagraph) : [];
  let issues = validateTopicParagraphs(paragraphs);
  if (!issues.length) return { title: outline.title, paragraphs };

  onStage?.(`Ajustando tópico ${index + 1}/${TOPIC_COUNT}...`);
  const repair = await invokePollinations({
    temperature: 0.1,
    response_json_schema: topicSchema,
    prompt: `Faça uma única correção pontual do tópico "${outline.title}". Mantenha o foco e os conceitos da aula-base. Retorne exatamente ${PARAGRAPHS_PER_TOPIC} parágrafos, cada um com ${MIN_WORDS}–${MAX_WORDS} palavras. Revise as contagens antes de responder. Não inclua título nem comentários.

PROBLEMAS DETECTADOS: ${issues.join(' ')}
RASCUNHO A CORRIGIR: ${JSON.stringify(paragraphs)}

AULA-BASE:
${sourceText}`,
  });
  paragraphs = Array.isArray(repair?.paragraphs) ? repair.paragraphs.map(normalizeParagraph) : [];
  issues = validateTopicParagraphs(paragraphs);
  if (issues.length) throw new Error(`Não foi possível validar o tópico ${index + 1}: ${issues.join(' ')}`);
  return { title: outline.title, paragraphs };
}

export default function ChapterRewriteModal({ chapters, courseTitle, onClose, onSave, saving }) {
  const [chapterId, setChapterId] = useState(chapters[0]?.id || '');
  const [lessonId, setLessonId] = useState(chapters[0]?.lessons?.[0]?.id || '');
  const [generating, setGenerating] = useState(false);
  const [rewritten, setRewritten] = useState('');
  const [stage, setStage] = useState('');
  const [autoSaveFailed, setAutoSaveFailed] = useState(false);

  const chapter = useMemo(() => chapters.find((item) => item.id === chapterId) || null, [chapters, chapterId]);
  const lesson = useMemo(() => chapter?.lessons.find((item) => item.id === lessonId) || null, [chapter, lessonId]);
  const structure = useMemo(() => (rewritten ? analyzeLesson(parseLesson(rewritten)) : null), [rewritten]);
  const lessonTitle = lesson?.title || 'Aula da apostila';

  const clearDraft = () => {
    setRewritten('');
    setAutoSaveFailed(false);
  };

  const handleChapterChange = (nextChapterId) => {
    setChapterId(nextChapterId);
    const nextChapter = chapters.find((item) => item.id === nextChapterId);
    setLessonId(nextChapter?.lessons?.[0]?.id || '');
    clearDraft();
  };

  const handleGenerate = async () => {
    if (!lesson || generating || saving) return;
    setGenerating(true);
    clearDraft();
    try {
      const sourceText = stripHtml(lesson.content || '');
      if (!sourceText) throw new Error('Esta aula ainda não possui conteúdo para reescrever.');

      setStage('Planejando os seis tópicos...');
      const outlineResult = await invokePollinations({
        temperature: 0.2,
        response_json_schema: outlineSchema,
        prompt: `Analise a aula-base e planeje exatamente ${TOPIC_COUNT} tópicos distintos, progressivos e complementares para uma aula técnica do curso ${courseTitle || 'de terapia comportamental'}. Cada item deve ter um título conciso em maiúsculas e uma descrição de foco que delimite o que será desenvolvido. Não escreva os parágrafos ainda. Evite redundância entre tópicos e não introduza conceitos ausentes no material. Responda exclusivamente no JSON solicitado.\n\nTÍTULO DA AULA: ${lessonTitle}\n\nAULA-BASE:\n${sourceText}`,
      });
      const outline = validateOutline(outlineResult);
      const topics = [];
      for (let index = 0; index < outline.length; index += 1) {
        topics.push(await generateTopic({ outline: outline[index], lessonTitle, sourceText, courseTitle, index, onStage: setStage }));
      }

      const validation = analyzeLesson(topics);
      if (!validation.valid) throw new Error(`A revisão estrutural final encontrou problemas: ${validation.issues.join(' ')}`);
      const finalText = buildLessonText(lessonTitle, topics);
      setRewritten(finalText);
      setStage('Texto validado. Salvando automaticamente...');
      try {
        await onSave({ chapterId: chapter.id, lessonId: lesson.id, content: finalText });
      } catch (error) {
        setAutoSaveFailed(true);
        throw new Error(`O texto foi gerado e validado, mas o salvamento automático falhou${error?.message ? `: ${error.message}` : '.'}`);
      }
    } catch (error) {
      toast.error(error?.message || 'Não foi possível gerar o texto. Tente novamente.');
    } finally {
      setGenerating(false);
      setStage('');
    }
  };

  const handleSave = async () => {
    if (!chapter || !lesson || !rewritten.trim() || !structure?.valid || saving) return;
    try {
      await onSave({ chapterId: chapter.id, lessonId: lesson.id, content: rewritten.trim() });
      setAutoSaveFailed(false);
    } catch (error) {
      setAutoSaveFailed(true);
      toast.error(error?.message || 'Não foi possível salvar o texto na apostila.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-violet-500/30 bg-card shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-700">
              <Wand2 size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Gerar aula da apostila com IA</h2>
              <p className="text-xs text-muted-foreground">6 tópicos · 6 parágrafos de 60–65 palavras por tópico · validação e salvamento automático</p>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose} disabled={generating || saving} aria-label="Fechar">
            <X size={16} />
          </Button>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs font-semibold text-muted-foreground">
              Capítulo (módulo)
              <select disabled={generating || saving} value={chapterId} onChange={(event) => handleChapterChange(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal text-foreground">
                {chapters.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-muted-foreground">
              Aula
              <select disabled={generating || saving} value={lessonId} onChange={(event) => { setLessonId(event.target.value); clearDraft(); }} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal text-foreground">
                {(chapter?.lessons || []).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
            </label>
          </div>

          <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 text-xs leading-relaxed text-muted-foreground">
            A geração é dividida em planejamento e produção de um tópico por vez para reduzir truncamentos. Cada tópico passa por contagem local de palavras; somente o que falhar recebe um ajuste pontual. O texto só é salvo após a validação completa da estrutura.
          </div>

          <Button onClick={handleGenerate} disabled={generating || saving || !lesson} className="gap-2">
            {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {generating ? (stage || 'Gerando...') : rewritten ? 'Gerar outra versão' : 'Gerar e salvar automaticamente'}
          </Button>

          {rewritten && (
            <div className="space-y-3">
              {structure && (
                <div className={`space-y-2 rounded-xl border p-3 text-xs font-medium ${structure.valid
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-400'}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    {structure.valid ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                    <span>{structure.topicCount}/{TOPIC_COUNT} tópicos</span>
                    <span>·</span>
                    <span>{structure.paragraphCount}/{TOPIC_COUNT * PARAGRAPHS_PER_TOPIC} parágrafos</span>
                    <span>·</span>
                    <span>{structure.outOfRange} fora da faixa de {MIN_WORDS}–{MAX_WORDS} palavras</span>
                  </div>
                  {structure.valid && <p className="font-normal">Contagem por tópico: {structure.topicWordTotals.join(' · ')} palavras no corpo (sem contar os títulos).</p>}
                  {!structure.valid && (
                    <ul className="list-disc space-y-0.5 pl-5 font-normal">
                      {structure.issues.map((issue) => <li key={issue}>{issue}</li>)}
                    </ul>
                  )}
                </div>
              )}
              {autoSaveFailed && <p role="alert" className="text-xs text-amber-500">O rascunho validado continua disponível nesta janela. Use “Salvar na apostila” para tentar novamente.</p>}
              <div className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-xl border border-border bg-secondary/20 p-4 text-sm leading-relaxed text-foreground/90">
                {rewritten}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={handleSave} disabled={saving || generating || !structure?.valid} className="gap-1.5">
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  {saving ? 'Salvando...' : autoSaveFailed ? 'Tentar salvar novamente' : 'Salvar na apostila'}
                </Button>
                <Button size="sm" variant="outline" onClick={handleGenerate} disabled={generating || saving} className="gap-1.5">
                  <RefreshCw size={13} /> Gerar outra versão
                </Button>
                <Button size="sm" variant="ghost" onClick={onClose} disabled={saving || generating}>Cancelar</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
