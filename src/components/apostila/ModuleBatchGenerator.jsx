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

const lessonReviewSchema = {
  type: 'object',
  properties: {
    approved: { type: 'boolean' },
    summary: { type: 'string' },
    findings: { type: 'array', items: { type: 'string' } },
  },
  required: ['approved', 'summary', 'findings'],
  additionalProperties: false,
};

const moduleReviewSchema = {
  type: 'object',
  properties: {
    approved: { type: 'boolean' },
    summary: { type: 'string' },
    lessonFindings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          lessonIndex: { type: 'integer', minimum: 1, maximum: MODULE_SIZE },
          findings: { type: 'array', items: { type: 'string' } },
        },
        required: ['lessonIndex', 'findings'],
        additionalProperties: false,
      },
    },
    findings: { type: 'array', items: { type: 'string' } },
  },
  required: ['approved', 'summary', 'lessonFindings', 'findings'],
  additionalProperties: false,
};

const MAX_LESSON_REPAIRS = 4;
const MAX_MODULE_REPAIRS = 2;

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
  const completed = drafts.length === MODULE_SIZE && drafts.every(Boolean);
  const allValid = completed && drafts.every((draft) => draft.status === 'ready' && draft.issues.length === 0);
  const publishable = allValid && review?.approved === true && confirmed;

  const generateModule = async () => {
    if (!selectedModule || busy || saving) return;
    setBusy(true);
    setReview(null);
    setConfirmed(false);
    const nextDrafts = [...drafts];
    const setDraftAt = (index, draft) => {
      nextDrafts[index] = draft;
      setDrafts([...nextDrafts]);
    };

    const buildContext = (beforeIndex) => nextDrafts
      .slice(0, beforeIndex)
      .filter(Boolean)
      .map((draft, previousIndex) =>
        `AULA ${previousIndex + 1} — ${draft.title}\n${draft.topics.map((topic) => topic.title + ': ' + topic.paragraphs.join(' ')).join('\n')}`
      ).join('\n\n').slice(-18000);

    const requestTopics = async ({ lesson, source, previousContext, repairIssues = [], previousTopics = [] }) => {
      const isRepair = repairIssues.length > 0;
      const result = await invokeLunaAI({
        response_json_schema: moduleSchema,
        prompt: `Você é um redator e revisor pedagógico sênior do Instituto WR-EDU®. Sua tarefa é produzir uma aula pronta para publicação, não um rascunho.

CURSO: ${courseTitle || 'Formação Profissional'}
MÓDULO: ${selectedModule.title}
AULA: ${lesson.title}

CONTEXTO DAS AULAS ANTERIORES:
${previousContext || 'Esta é a primeira aula do módulo.'}

CRITÉRIOS OBRIGATÓRIOS — TODOS DEVEM SER CUMPRIDOS:
1. Exatamente seis tópicos, em progressão didática lógica, sem repetição artificial.
2. Exatamente seis parágrafos completos em cada tópico: 36 parágrafos no total.
3. Cada parágrafo deve conter entre ${MIN_WORDS} e ${MAX_WORDS} palavras, inclusive. Faça a contagem individual antes de responder.
4. Cada tópico deve somar entre 360 e 390 palavras no corpo, sem contar o título.
5. A diferença entre a quantidade de palavras dos tópicos não pode ultrapassar 30 palavras.
6. Títulos dos tópicos em português brasileiro e em LETRAS MAIÚSCULAS.
7. Cada parágrafo deve desenvolver uma ideia completa, com explicação, fundamentação e aplicação ou exemplo quando pertinente. Não fragmentar frases, repetir ideias, criar enchimento ou usar paráfrases para atingir a contagem.
8. Linguagem profissional, clara, precisa, didática e gramaticalmente correta. Revise ortografia, concordância, regência, pontuação, coesão e coerência.
9. Não inventar autores, citações, referências, dados, leis ou evidências. Diferencie fatos, hipóteses e interpretações.
10. Não extrapolar competências profissionais nem apresentar diagnóstico ou prescrição indevida.
11. Não inclua cabeçalho institucional, introdução fora dos tópicos, conclusão externa ou comentários sobre a tarefa.
12. Não omita conteúdo essencial do texto-base. Desenvolva-o com profundidade, sem copiar literalmente.

${isRepair ? `CORREÇÃO OBRIGATÓRIA DA VERSÃO ANTERIOR:
Os seguintes problemas foram identificados. Corrija todos eles, preservando o que já estiver correto e reescrevendo somente o necessário. Não responda com justificativas.
${repairIssues.map((issue) => '- ' + issue).join('\n')}

VERSÃO ANTERIOR PARA CORREÇÃO:
${JSON.stringify(previousTopics)}` : ''}

TEXTO-BASE:
${source}

Antes de responder, faça uma revisão silenciosa de cada parágrafo e confira todos os números. Se algum critério falhar, corrija antes de entregar. Retorne exclusivamente o JSON solicitado.`,
      });
      return (result?.topics || []).map((topic) => ({
        title: String(topic?.title || '').trim().toLocaleUpperCase('pt-BR'),
        paragraphs: Array.isArray(topic?.paragraphs)
          ? topic.paragraphs.map((paragraph) => String(paragraph || '').replace(/\s+/g, ' ').trim())
          : [],
      }));
    };

    const validateTopics = (topics) => {
      const detailed = analyzeLesson(topics);
      const custom = validateGeneratedTopics(topics);
      return [...new Set([...custom, ...detailed.issues])];
    };

    const reviewLesson = async (lesson, topics) => invokeLunaAI({
      response_json_schema: lessonReviewSchema,
      prompt: `Atue como revisor editorial independente de uma apostila profissional. Faça uma auditoria rigorosa do texto abaixo. Não aprove por cortesia. Verifique correção gramatical, clareza, coesão, coerência, precisão conceitual, profundidade didática, redundâncias, exemplos, progressão dos seis tópicos e respeito aos limites profissionais. A estrutura numérica também precisa cumprir: seis tópicos, seis parágrafos por tópico, 60–65 palavras por parágrafo e 360–390 palavras por tópico. Se houver qualquer falha relevante, approved deve ser false e findings deve apontar precisamente o tópico/parágrafo e a correção necessária. Só aprove quando o texto estiver realmente pronto para publicação.

AULA: ${lesson.title}
${topics.map((topic, index) => `${index + 1}. ${topic.title}\n${topic.paragraphs.join('\n\n')}`).join('\n\n')}`,
    });

    const generateAndApproveLesson = async (lesson, index) => {
      const source = cleanText(lesson.content);
      if (!source) throw new Error(`A aula "${lesson.title}" não possui texto-base.`);
      let topics = nextDrafts[index]?.topics || [];
      let issues = nextDrafts[index]?.issues || [];
      let editorialFindings = nextDrafts[index]?.editorialFindings || [];
      const alreadyApproved = nextDrafts[index]?.status === 'ready';
      if (alreadyApproved) return nextDrafts[index];

      for (let attempt = 0; attempt <= MAX_LESSON_REPAIRS; attempt += 1) {
        setStage(`Aula ${index + 1}/${MODULE_SIZE}: ${attempt === 0 && !topics.length ? 'redação' : `correção ${attempt}/${MAX_LESSON_REPAIRS}`}`);
        topics = await requestTopics({
          lesson,
          source,
          previousContext: buildContext(index),
          repairIssues: issues,
          previousTopics: topics,
        });
        issues = validateTopics(topics);
        if (issues.length) {
          editorialFindings = [];
          setDraftAt(index, {
            chapterId: selectedModule.id, lessonId: lesson.id, title: lesson.title,
            topics, content: buildLessonText(lesson.title, topics),
            issues, editorialFindings, status: 'needs-fix', attempts: attempt + 1,
          });
          continue;
        }

        setStage(`Auditoria editorial da aula ${index + 1}/${MODULE_SIZE}...`);
        const editorial = await reviewLesson(lesson, topics);
        editorialFindings = Array.isArray(editorial?.findings) ? editorial.findings.map(String) : [];
        if (editorial?.approved === true && editorialFindings.length === 0) {
          const approvedDraft = {
            chapterId: selectedModule.id, lessonId: lesson.id, title: lesson.title,
            topics, content: buildLessonText(lesson.title, topics),
            issues: [], editorialFindings: [], status: 'ready', attempts: attempt + 1,
          };
          setDraftAt(index, approvedDraft);
          return approvedDraft;
        }

        issues = editorialFindings.length
          ? editorialFindings.map((finding) => `Revisão editorial: ${finding}`)
          : ['A auditoria editorial não aprovou o conteúdo. Revise integralmente gramática, coesão, precisão e desenvolvimento didático.'];
        setDraftAt(index, {
          chapterId: selectedModule.id, lessonId: lesson.id, title: lesson.title,
          topics, content: buildLessonText(lesson.title, topics),
          issues, editorialFindings, status: 'needs-fix', attempts: attempt + 1,
        });
      }

      throw new Error(`A aula "${lesson.title}" não atingiu todos os critérios após ${MAX_LESSON_REPAIRS} tentativas de correção. O restante do lote foi preservado; corrija somente esta aula.`);
    };

    try {
      for (let index = 0; index < selectedModule.lessons.length; index += 1) {
        const lesson = selectedModule.lessons[index];
        if (nextDrafts[index]?.status === 'ready' && nextDrafts[index]?.issues?.length === 0) continue;
        await generateAndApproveLesson(lesson, index);
      }

      let moduleResult = null;
      for (let moduleAttempt = 0; moduleAttempt <= MAX_MODULE_REPAIRS; moduleAttempt += 1) {
        setStage(moduleAttempt === 0 ? 'Revisão cruzada do módulo...' : `Ajustando apontamentos do módulo (${moduleAttempt}/${MAX_MODULE_REPAIRS})...`);
        moduleResult = await invokeLunaAI({
          response_json_schema: moduleReviewSchema,
          prompt: `Atue como coordenador pedagógico e auditor final. Revise as cinco aulas em conjunto. Verifique progressão, cobertura do conteúdo programático, coerência, redundância entre aulas, contradições e continuidade didática. Não aprove se houver falha. Quando encontrar problemas, associe-os à aula correta em lessonFindings (lessonIndex de 1 a 5) e descreva a correção específica. Se o problema for transversal, associe-o a todas as aulas afetadas. Se não for possível localizar a aula, use findings e não aprove. approved=true somente se o módulo inteiro estiver consistente e pronto para publicação.

MÓDULO: ${selectedModule.title}
CURSO: ${courseTitle || 'Formação Profissional'}
${nextDrafts.map((draft, index) => `AULA ${index + 1}: ${draft.title}\n${draft.topics.map((topic, topicIndex) => `${topicIndex + 1}. ${topic.title}\n${topic.paragraphs.join('\n\n')}`).join('\n\n')}`).join('\n\n---\n\n')}`,
        });

        const lessonFindings = Array.isArray(moduleResult?.lessonFindings) ? moduleResult.lessonFindings : [];
        if (moduleResult?.approved === true && lessonFindings.length === 0 && !(moduleResult?.findings || []).length) break;
        if (moduleAttempt === MAX_MODULE_REPAIRS) break;

        const affected = [...new Set(lessonFindings.map((item) => Number(item.lessonIndex) - 1).filter((idx) => idx >= 0 && idx < MODULE_SIZE))];
        if (!affected.length) break;
        for (const index of affected) {
          const lesson = selectedModule.lessons[index];
          const targetedIssues = lessonFindings
            .filter((item) => Number(item.lessonIndex) === index + 1)
            .flatMap((item) => Array.isArray(item.findings) ? item.findings : []);
          if (!targetedIssues.length) continue;
          const draft = nextDrafts[index];
          const source = cleanText(lesson.content);
          setStage(`Correção direcionada da aula ${index + 1}/${MODULE_SIZE}...`);
          let repaired = false;
          for (let attempt = 1; attempt <= MAX_LESSON_REPAIRS; attempt += 1) {
            const topics = await requestTopics({
              lesson, source, previousContext: buildContext(index),
              repairIssues: targetedIssues, previousTopics: draft.topics,
            });
            const structuralIssues = validateTopics(topics);
            if (structuralIssues.length) {
              targetedIssues.push(...structuralIssues);
              continue;
            }
            const editorial = await reviewLesson(lesson, topics);
            if (editorial?.approved === true && !(editorial?.findings || []).length) {
              setDraftAt(index, {
                ...draft, topics, content: buildLessonText(lesson.title, topics),
                issues: [], editorialFindings: [], status: 'ready',
                attempts: (draft.attempts || 0) + attempt,
              });
              repaired = true;
              break;
            }
            targetedIssues.push(...(editorial?.findings || ['A auditoria editorial não aprovou a correção.']));
          }
          if (!repaired) {
            setDraftAt(index, { ...draft, issues: targetedIssues, status: 'needs-fix' });
            throw new Error(`A revisão cruzada identificou problemas na aula "${lesson.title}" que não foram resolvidos automaticamente. As demais aulas aprovadas foram preservadas.`);
          }
        }
      }

      const finalReviewApproved = moduleResult?.approved === true
        && !(moduleResult?.lessonFindings || []).length
        && !(moduleResult?.findings || []).length;
      setReview({
        approved: finalReviewApproved,
        summary: String(moduleResult?.summary || ''),
        findings: [
          ...(Array.isArray(moduleResult?.findings) ? moduleResult.findings.map(String) : []),
          ...(Array.isArray(moduleResult?.lessonFindings) ? moduleResult.lessonFindings.flatMap((item) =>
            (item.findings || []).map((finding) => `Aula ${item.lessonIndex}: ${finding}`)
          ) : []),
        ],
      });
      setStage('');
      if (!finalReviewApproved) {
        toast.warning('As aulas individuais foram preservadas, mas a revisão cruzada ainda não aprovou o módulo.');
      } else {
        toast.success('As cinco aulas passaram pela validação estrutural, auditoria editorial e revisão cruzada.');
      }
    } catch (error) {
      setStage('');
      toast.error(error?.message || 'Não foi possível concluir a revisão do módulo.');
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
            {busy ? (stage || 'Processando módulo...') : drafts.length ? 'Continuar / corrigir somente pendências' : 'Gerar e revisar as cinco aulas'}
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
                    {draft.status !== 'ready' || draft.issues.length ? <AlertTriangle size={16} className="mt-0.5 text-amber-500" /> : <CheckCircle2 size={16} className="mt-0.5 text-emerald-500" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{index + 1}. {draft.title}</p>
                      <p className="text-xs text-muted-foreground">{draft.topics.length} tópicos · {draft.topics.reduce((sum, topic) => sum + topic.paragraphs.length, 0)} parágrafos · {draft.status === 'ready' && !draft.issues.length ? `aprovada · ${draft.attempts || 1} tentativa(s)` : `${draft.issues.length} pendência(s) · ${draft.attempts || 0} tentativa(s)`}</p>
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

          {completed && !allValid && <p className="text-xs text-amber-500">A publicação está bloqueada. Use “Continuar / corrigir somente pendências”: as aulas aprovadas serão mantidas e somente as aulas reprovadas serão corrigidas.</p>}
          {completed && review && !review.approved && <p className="text-xs text-amber-500">A revisão cruzada não aprovou o conjunto. O sistema tentará corrigir somente as aulas apontadas, preservando as demais.</p>}

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
