import { invokePollinations } from '@/lib/pollinationsAI';
import React, { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/adminApi';
import { ChevronLeft, CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import { MOD1 } from '@/lib/apostila/mod1';
import { MOD2 } from '@/lib/apostila/mod2';
import { MOD3 } from '@/lib/apostila/mod3';
import { MOD4 } from '@/lib/apostila/mod4';
import { MOD5 } from '@/lib/apostila/mod5';
import { MOD6 } from '@/lib/apostila/mod6';
import { MOD7 } from '@/lib/apostila/mod7';
import { MOD8 } from '@/lib/apostila/mod8';
import { MOD9 } from '@/lib/apostila/mod9';
import { MOD10 } from '@/lib/apostila/mod10';

export const ANNUAL_MODULES = [MOD1, MOD2, MOD3, MOD4, MOD5, MOD6, MOD7, MOD8, MOD9, MOD10];

function moduleContent(module) {
  return module.lessons
    .map((lesson) => `=== ${lesson.title} ===\n${lesson.content.slice(0, 3000)}`)
    .join('\n\n---\n\n');
}

function extractQuestions(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.questions)) return result.questions;
  if (Array.isArray(result?.response?.questions)) return result.response.questions;
  return [];
}

function normalizeQuestions(questions) {
  const normalized = questions.map((question) => ({
    question: question.question || question.text || question.enunciado || '',
    answer_type: question.answer_type || (question.options?.length ? 'choice' : 'text'),
    options: Array.isArray(question.options) ? question.options : [],
    ...(question.correct_index != null ? { correct_index: question.correct_index } : {}),
  }));
  const choices = normalized.filter((question) => question.answer_type === 'choice');
  const texts = normalized.filter((question) => question.answer_type === 'text');
  if (choices.length !== 5 || texts.length !== 5) {
    throw new Error('A IA não retornou exatamente 5 questões objetivas e 5 discursivas.');
  }
  return [...choices.slice(0, 5), ...texts.slice(0, 5)].map((question) => {
    if (question.answer_type === 'choice' && (
      question.options.length !== 4
      || !Number.isInteger(question.correct_index)
      || question.correct_index < 0
      || question.correct_index > 3
    )) {
      throw new Error('Uma questão objetiva retornou alternativas inválidas.');
    }
    return question;
  });
}

async function generateQuestions(module) {
  const prompt = `Você é professor especialista em terapia comportamental. Crie EXATAMENTE 10 questões de prova exclusivamente com base no conteúdo do ${module.title} abaixo.

REGRAS OBRIGATÓRIAS:
1. As 5 primeiras questões devem ser de múltipla escolha, com exatamente 4 alternativas (A, B, C, D) e uma única resposta correta.
2. As 5 últimas questões devem ser discursivas, sem alternativas.
3. Não use conteúdo de outros módulos nem conhecimento externo.
4. Para múltipla escolha, informe correct_index usando 0, 1, 2 ou 3. Para discursiva, use answer_type "text", options [] e correct_index null.
5. Retorne somente JSON no formato {"questions":[...]}, com os campos question, answer_type, options e correct_index.

CONTEÚDO DO MÓDULO:
${moduleContent(module)}`;
  const schema = {
    type: 'object',
    properties: {
      questions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            question: { type: 'string' },
            answer_type: { type: 'string', enum: ['choice', 'text'] },
            options: { type: 'array', items: { type: 'string' } },
            correct_index: { type: 'number', nullable: true },
          },
          required: ['question', 'answer_type', 'options'],
        },
      },
    },
    required: ['questions'],
  };
  const result = await invokePollinations({
    prompt,
    response_json_schema: schema,
    model: 'claude_sonnet_4_6',
  });
  return normalizeQuestions(extractQuestions(result));
}

export default function AnnualExamGenerator({ onBack, course, exams = [], templateExam }) {
  const queryClient = useQueryClient();
  const [completed, setCompleted] = useState([]);
  const [current, setCurrent] = useState(null);
  const missingModules = useMemo(
    () => ANNUAL_MODULES.slice(1).filter((module) => !exams.some(
      (exam) => exam.course === course && exam.module_ref === module.id,
    )),
    [course, exams],
  );

  const generateMutation = useMutation({
    mutationFn: async () => {
      const created = [];
      for (const module of missingModules) {
        setCurrent(module.id);
        const questions = await generateQuestions(module);
        const moduleNumber = ANNUAL_MODULES.indexOf(module) + 1;
        const suffix = module.title.replace(/^Módulo \d+ —\s*/, '');
        await adminApi.create('Exam', {
          title: `Prova ${moduleNumber} — ${suffix}`,
          description: templateExam?.description
            || `Avaliação do Módulo ${moduleNumber}. Responda às 10 questões com atenção.`,
          max_grade: 40,
          course: course || 'tcc',
          quiz_questions: questions,
          module_ref: module.id,
          generated_by_ai: true,
          is_published: true,
        });
        created.push(module.id);
        setCompleted((items) => [...items, module.id]);
      }
      return created;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast.success(`${created.length} prova${created.length === 1 ? '' : 's'} criada${created.length === 1 ? '' : 's'} com sucesso.`);
    },
    onError: (error) => toast.error(error.message || 'Não foi possível gerar as provas.'),
    onSettled: () => setCurrent(null),
  });

  return (
    <div className="app-page max-w-3xl mx-auto animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft size={16} /> Voltar
        </button>
        <div>
          <h2 className="text-xl font-black text-foreground">Provas anuais</h2>
          <p className="text-xs text-muted-foreground">Módulos 2 a 10 · 40 pontos · 5 objetivas e 5 discursivas</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <p className="text-sm text-muted-foreground">
          Cada prova será criada com conteúdo exclusivo do seu módulo e publicada para os alunos.
          {templateExam ? ' O formato e as instruções da Prova 1 serão usados como referência.' : ''}
        </p>
        <div className="space-y-2">
          {ANNUAL_MODULES.slice(1).map((module) => {
            const done = !missingModules.includes(module) || completed.includes(module.id);
            return (
              <div key={module.id} className="flex items-center gap-2 text-sm">
                {done ? <CheckCircle size={15} className="text-emerald-500" /> : <Sparkles size={15} className="text-violet-500" />}
                <span className={done ? 'text-muted-foreground line-through' : 'font-semibold'}>{module.title}</span>
                {current === module.id && <Loader2 size={13} className="animate-spin text-primary" />}
              </div>
            );
          })}
        </div>
        {missingModules.length === 0 ? (
          <p className="text-sm font-bold text-emerald-600">As provas dos módulos 2 a 10 já estão cadastradas.</p>
        ) : (
          <Button
            className="w-full gap-2 font-black"
            disabled={generateMutation.isPending}
            onClick={() => generateMutation.mutate()}
          >
            {generateMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {generateMutation.isPending ? 'Gerando provas...' : `Gerar ${missingModules.length} prova${missingModules.length === 1 ? '' : 's'}`}
          </Button>
        )}
      </div>
    </div>
  );
}
