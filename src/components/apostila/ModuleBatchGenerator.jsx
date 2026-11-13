import React, { useMemo, useState } from 'react';
import { invokeLunaAI } from '@/lib/pollinationsAI';
import { analyzeLesson, buildLessonText, countWords, MIN_WORDS, MAX_WORDS, TOPIC_COUNT, PARAGRAPHS_PER_TOPIC } from '@/lib/apostilaStructure';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { X, Sparkles, Loader2, CheckCircle2, AlertTriangle, Save, RefreshCw } from 'lucide-react';

const MODULE_SIZE = 5;
const moduleSchema = {
  type: 'object',
  properties: {
    topics: {
      type: 'array', minItems: TOPIC_COUNT, maxItems: TOPIC_COUNT,
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          paragraphs: { type: 'array', minItems: PARAGRAPHS_PER_TOPIC, maxItems: PARAGRAPHS_PER_TOPIC, items: { type: 'string' } },
        },
        required: ['title', 'paragraphs'],
        additionalProperties: false,
      },
    },
  },
  required: ['topics'],
  additionalProperties: false,
};

const reviewSchema = {
  type: 'object',
  properties: {
    approved: { type: 'boolean' },
    summary: { type: 'string' },
    findings: { type: 'array', items: { type: 'string' } },
  },
  required: ['approved', 'summary', 'findings'],
  additionalProperties: false,
};

const cleanText = (value = '') => String(value)
  .replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

function validateGeneratedTopics(topics) {
  const issues = [];
  if (!Array.isArray(topics) || topics.length !== TOPIC_COUNT) {
    return ['A aula precisa conter exatamente seis tópicos.'];
  }
  topics.forEach((topic, topicIndex) => {
    if (!String(topic?.title || '').trim()) issues.push(`Tópico ${topicIndex + 1}: título ausente.`);
    if (!Array.isArray(topic?.paragraphs) || topic.paragraphs.length !== PARAGRAPHS_PER_TOPIC) {
      issues.push(`Tópico ${topicIndex + 1}: precisa conter seis parágrafos.`);
      return;
    }
    topic.paragraphs.forEach((paragraph, paragraphIndex) => {
      const words = countWords(paragraph);
      if (words < MIN_WORDS || words > MAX_WORDS) {
        issues.push(`Tópico ${topicIndex + 1}, parágrafo ${paragraphIndex + 1}: ${words} palavras (exigidas ${MIN_WORDS}–${MAX_WORDS}).`);
      }
    });
  });
  return issues;
}


export default function ModuleBatchGenerator({ chapters, courseTitle, onClose, onPublish, saving = false }) {
  const eligibleModules = useMemo(() => chapters.filter((chapter) => chapter.lessons?.length === MODULE_SIZE), [chapters]);
  const [moduleId, setModuleId] = useState(eligibleModules[0]?.id || '');
  const [drafts, setDrafts] = useState([]);
  const [stage, setStage] = useState('');
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const selectedModule = eligibleModules.find((item) => item.id === moduleId) || null;
  const completed = drafts.length === MODULE_SIZE;
  const allValid = completed && drafts.every((draft) => draft.issues.length === 0);
  const publishable = allValid && review?.approved === true && confirmed;

  const generateModule = async () => {
    if (!selectedModule || busy || saving) return;
    setBusy(true);
    setDrafts([]);
    setReview(null);
    setConfirmed(false);
    const nextDrafts = [];
    try {
      for (let index = 0; index < selectedModule.lessons.length; index += 1) {
        const lesson = selectedModule.lessons[index];
        const source = cleanText(lesson.content);
        if (!source) throw new Error(`A aula "${lesson.title}" não possui texto-base.`);
        setStage(`Redigindo aula ${index + 1}/${MODULE_SIZE}: ${lesson.title}`);
        const previousContext = nextDrafts.map((draft, previousIndex) =>
          `AULA ${previousIndex + 1} — ${draft.title}\n${draft.topics.map((topic) => topic.title + ': ' + topic.paragraphs.join(' ')).join('\n')}`
        ).join('\n\n').slice(-18000);

        const result = await invokeLunaAI({
          response_json_schema: moduleSchema,
          prompt: `Você é redator didático técnico-profissional do Instituto WR-EDU®. Produza o conteúdo integral da aula "${lesson.title}" do módulo "${selectedModule.title}" do curso "${courseTitle || 'Formação Profissional'}".

CONTEXTO PEDAGÓGICO DO MÓDULO:
As aulas anteriores já redigidas aparecem abaixo. Use-as para manter continuidade, avançar o aprendizado e evitar repetir explicações. Não copie trechos. A aula atual deve ter identidade própria.
${previousContext || 'Esta é a primeira aula do módulo.'}

REGRAS EDITORIAIS OBRIGATÓRIAS:
- Planeje exatamente seis tópicos progressivos, complementares e sem sobreposição.
- Cada tópico terá exatamente seis parágrafos.
- Cada parágrafo terá entre ${MIN_WORDS} e ${MAX_WORDS} palavras. Conte e revise antes de responder.
- Cada parágrafo deve desenvolver uma ideia completa e acrescentar conteúdo novo.
- Use português brasileiro, linguagem didática, técnica, clara e profissional.
- Inclua conceitos, contextualização, explicações e exemplos pertinentes; não use frases genéricas para preencher espaço.
- Não invente citações, referências bibliográficas, leis, dados ou recomendações clínicas.
- Respeite os limites profissionais do tema e sinalize encaminhamentos quando pertinentes.
- Não inclua cabeçalho institucional, introdução fora dos tópicos, conclusão externa ou comentários sobre a tarefa.
- Retorne somente o JSON solicitado.

TEXTO-BASE DA AULA (referência de conteúdo):
${source}`,
        });

        const topics = (result?.topics || []).map((topic) => ({
          title: String(topic?.title || '').trim().toLocaleUpperCase('pt-BR'),
          paragraphs: Array.isArray(topic?.paragraphs) ? topic.paragraphs.map((paragraph) => String(paragraph || '').replace(/\s+/g, ' ').trim()) : [],
        }));
        const issues = validateGeneratedTopics(topics);
        const content = buildLessonText(lesson.title, topics);
        const structural = analyzeLesson(topics);
        const draft = {
          chapterId: selectedModule.id,
          lessonId: lesson.id,
          title: lesson.title,
          topics,
          content,
          issues: [...issues, ...(structural.valid ? [] : structural.issues)],
          status: issues.length || !structural.valid ? 'needs-fix' : 'ready',
        };
        nextDrafts.push(draft);
        setDrafts([...nextDrafts]);
      }

      setStage('Revisando a coerência do módulo completo...');
      const reviewResult = await invokeLunaAI({
        response_json_schema: reviewSchema,
        prompt: `Atue como editor pedagógico. Faça uma revisão cruzada das cinco aulas abaixo. Avalie progressão de aprendizagem, coerência entre aulas, repetição de conceitos, contradições, lacunas e adequação da linguagem. Não reescreva os textos. Aprove somente se o conjunto estiver pedagogicamente consistente. Se encontrar problemas, seja específico em findings e marque approved=false. Responda no JSON solicitado.

MÓDULO: ${selectedModule.title}
CURSO: ${courseTitle || 'Formação Profissional'}

${nextDrafts.map((draft, index) => `AULA ${index + 1}: ${draft.title}\n${draft.topics.map((topic, topicIndex) => `${topicIndex + 1}. ${topic.title}\n${topic.paragraphs.join('\n')}`).join('\n\n')}`).join('\n\n---\n\n')}`,
      });
      setReview({
        approved: reviewResult?.approved === true,
        summary: String(reviewResult?.summary || ''),
        findings: Array.isArray(reviewResult?.findings) ? reviewResult.findings.map(String) : [],
      });
      setStage('');
      if (nextDrafts.some((draft) => draft.issues.length)) {
        toast.warning('O lote foi gerado, mas há aulas que precisam de correção estrutural antes da publicação.');
      } else if (reviewResult?.approved !== true) {
        toast.warning('A revisão cruzada encontrou pontos que precisam de avaliação antes da publicação.');
      } else {
        toast.success('As cinco aulas foram redigidas e passaram pela revisão estrutural e cruzada.');
      }
    } catch (error) {
      setStage('');
      toast.error(error?.message || 'Não foi possível concluir a geração do módulo.');
    } finally {
      setBusy(false);
    }
  };

  const publishModule = async () => {
    if (!publishable || busy || saving) return;
    setBusy(true);
    try {
      await onPublish(drafts.map(({ chapterId, lessonId, content }) => ({ chapterId, lessonId, content })));
      toast.success('As cinco aulas foram publicadas na apostila.');
      onClose();
    } catch (error) {
      toast.error(error?.message || 'Falha ao publicar o módulo. Os rascunhos continuam nesta janela.');
    } finally {
      setBusy(false);
    }
  };

  if (!eligibleModules.length) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
        <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold">Gerador de módulo completo</h2>
          <p className="mt-2 text-sm text-muted-foreground">Não há módulos com exatamente cinco aulas nesta apostila. O gerador em lote não altera módulos com outra quantidade de aulas.</p>
          <Button className="mt-4" onClick={onClose}>Fechar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl border border-violet-500/30 bg-card shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card p-5">
          <div>
            <h2 className="text-lg font-bold text-foreground">Gerador de módulo completo</h2>
            <p className="text-xs text-muted-foreground">5 aulas em sequência · GPT Luna 6 · revisão cruzada · publicação em lote</p>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose} disabled={busy || saving} aria-label="Fechar"><X size={16} /></Button>
        </div>

        <div className="space-y-4 p-5">
          <label className="block space-y-1.5 text-xs font-semibold text-muted-foreground">
            Módulo com cinco aulas
            <select value={moduleId} disabled={busy || saving} onChange={(event) => { setModuleId(event.target.value); setDrafts([]); setReview(null); setConfirmed(false); }} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal text-foreground">
              {eligibleModules.map((module) => <option key={module.id} value={module.id}>{module.title}</option>)}
            </select>
          </label>

          <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 text-xs leading-relaxed text-muted-foreground">
            Mantém o padrão atual da apostila: seis tópicos por aula, seis parágrafos por tópico e 60–65 palavras por parágrafo. A geração é sequencial: cada aula seguinte recebe o conteúdo das anteriores como contexto. Nada é publicado automaticamente.
          </div>

          <Button onClick={generateModule} disabled={busy || saving || !selectedModule} className="gap-2">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {busy ? (stage || 'Processando módulo...') : drafts.length ? 'Gerar o módulo novamente' : 'Gerar e revisar as cinco aulas'}
          </Button>

          {drafts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>Progresso do lote</span>
                <span>{drafts.length}/{MODULE_SIZE} aulas</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${(drafts.length / MODULE_SIZE) * 100}%` }} /></div>
              {drafts.map((draft, index) => (
                <div key={draft.lessonId} className="rounded-xl border border-border p-3">
                  <div className="flex items-start gap-2">
                    {draft.issues.length ? <AlertTriangle size={16} className="mt-0.5 text-amber-500" /> : <CheckCircle2 size={16} className="mt-0.5 text-emerald-500" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{index + 1}. {draft.title}</p>
                      <p className="text-xs text-muted-foreground">{draft.topics.length} tópicos · {draft.topics.reduce((sum, topic) => sum + topic.paragraphs.length, 0)} parágrafos · {draft.issues.length ? `${draft.issues.length} alerta(s)` : 'estrutura aprovada'}</p>
                      {draft.issues.length > 0 && <ul className="mt-2 list-disc pl-4 text-xs text-amber-500">{draft.issues.slice(0, 8).map((issue, issueIndex) => <li key={issueIndex}>{issue}</li>)}</ul>}
                    </div>
                  </div>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs font-medium text-violet-400">Pré-visualizar conteúdo da aula</summary>
                    <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-secondary/30 p-3 text-xs leading-relaxed">{draft.content}</pre>
                  </details>
                </div>
              ))}
            </div>
          )}

          {review && (
            <div className={`rounded-xl border p-4 ${review.approved ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
              <div className="flex items-center gap-2 text-sm font-semibold">
                {review.approved ? <CheckCircle2 size={16} className="text-emerald-500" /> : <AlertTriangle size={16} className="text-amber-500" />}
                Revisão pedagógica do módulo: {review.approved ? 'aprovada' : 'requer avaliação'}
              </div>
              <p className="mt-2 text-sm">{review.summary}</p>
              {review.findings.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">{review.findings.map((finding, index) => <li key={index}>{finding}</li>)}</ul>}
            </div>
          )}

          {completed && allValid && review?.approved && (
            <label className="flex items-start gap-2 rounded-xl border border-border p-3 text-xs text-muted-foreground">
              <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-0.5" />
              Revisei a prévia das cinco aulas e autorizo a publicação conjunta na apostila.
            </label>
          )}

          {completed && !allValid && <p className="text-xs text-amber-500">A publicação está bloqueada porque uma ou mais aulas não cumpriram a estrutura obrigatória. Gere o módulo novamente para tentar corrigir.</p>}
          {completed && review && !review.approved && <p className="text-xs text-amber-500">A revisão cruzada não aprovou o conjunto. Não é possível publicar este lote até gerar uma versão revisada.</p>}

          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <Button onClick={publishModule} disabled={!publishable || busy || saving} className="gap-2">
              {saving || busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Publicar as cinco aulas
            </Button>
            <Button variant="outline" onClick={generateModule} disabled={busy || saving} className="gap-2"><RefreshCw size={14} /> Refazer módulo</Button>
            <Button variant="ghost" onClick={onClose} disabled={busy || saving}>Fechar</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
