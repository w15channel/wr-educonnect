import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const COURSES = ['tcc', 'psicanalise', 'sexologia'];

const WEEKLY_THEMES = [
  {
    id: 'introducao-terapia-comportamental',
    title: 'Introdução à Terapia Comportamental',
    lesson_id: 'mod1-a1',
    lesson_ref: 'Aula 1 — Introdução à Terapia Comportamental: o Olhar que Transforma Vidas',
    approaches: ['conceito central', 'função do comportamento', 'ambiente e aprendizagem', 'olhar clínico', 'pertencimento à formação'],
  },
  {
    id: 'vinculo-terapeutico',
    title: 'Vínculo Terapêutico',
    lesson_id: 'weekly-vinculo',
    lesson_ref: 'Tema da semana — Vínculo Terapêutico',
    approaches: ['conceito central', 'aplicação em sessão', 'sinais do paciente', 'intervenção prática', 'ética e limites'],
  },
  {
    id: 'formulacao-de-caso',
    title: 'Formulação de Caso',
    lesson_id: 'weekly-formulacao',
    lesson_ref: 'Tema da semana — Formulação de Caso',
    approaches: ['conceito central', 'levantamento de hipóteses', 'padrões cognitivo-comportamentais', 'plano de intervenção', 'revisão clínica'],
  },
  {
    id: 'escuta-clinica',
    title: 'Escuta Clínica',
    lesson_id: 'weekly-escuta',
    lesson_ref: 'Tema da semana — Escuta Clínica',
    approaches: ['conceito central', 'escuta verbal', 'leitura emocional', 'perguntas terapêuticas', 'postura profissional'],
  },
  {
    id: 'intervencoes-comportamentais',
    title: 'Intervenções Comportamentais',
    lesson_id: 'weekly-intervencoes',
    lesson_ref: 'Tema da semana — Intervenções Comportamentais',
    approaches: ['conceito central', 'planejamento de tarefa', 'monitoramento de comportamento', 'manejo de resistência', 'generalização para a vida real'],
  },
];

function ymd(date) {
  return date.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    
    // Check if this is a scheduled automation call
    const isScheduledAutomation = payload?.automation?.type === 'scheduled';

    // Manual save with explicit questions
    if (!isScheduledAutomation) {
      const { date, course, lesson_ref, lesson_id, questions, force = false } = payload;
      if (date && course && questions && questions.length >= 3) {
        const record = await base44.asServiceRole.entities.DailyChallenge.create({
          date,
          course,
          lesson_ref: lesson_ref || null,
          lesson_id: lesson_id || null,
          questions: questions.slice(0, 8),
          created_by_admin: 'manual',
        });
        return Response.json({ success: true, id: record.id });
      }

      // Admin generation from the app sends { course, force, theme_id }.
      if (!course || !COURSES.includes(course)) {
        return Response.json({ error: 'Curso inválido' }, { status: 400 });
      }
      return await generateChallengeForCourse(base44, course, force, payload?.theme_id);
    }

    // Scheduled automation — generate automatically for today
    const today = ymd(new Date());
    const existing = await base44.asServiceRole.entities.DailyChallenge.filter({ date: today });
    if (existing && existing.length > 0) {
      return Response.json({ 
        success: true, 
        message: 'Ofensiva já gerada para hoje',
        existing_count: existing.length 
      });
    }

    // Select theme based on day of year (rotates through weekly themes)
    const dayOfYear = Math.floor(
      (new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
    );
    const themeIndex = Math.floor((dayOfYear - 1) / 7) % WEEKLY_THEMES.length;
    const selectedTheme = WEEKLY_THEMES[themeIndex];

    // Generate questions using IA
    const prompt = `Você é professor especialista em Terapia Cognitivo-Comportamental.
Crie 8 perguntas de revisão para a Ofensiva Diária de ${today}.

TEMA DA SEMANA: ${selectedTheme.title}
REFERÊNCIA: ${selectedTheme.lesson_ref}
5 ABORDAGENS DO TEMA: ${selectedTheme.approaches.join('; ')}

REGRAS:
1. Cada pergunta deve ser clara, direta e conectada ao tema da semana.
2. Formato: apenas o texto da pergunta (sem alternativas, sem respostas).
3. Distribua as perguntas entre as 5 abordagens listadas.
4. Retorne APENAS um JSON com a chave "questions" contendo um array de 8 strings.

Exemplo de resposta:
{
  "questions": [
    "Como a Ofensiva ajuda a criar ritmo de estudo desde a primeira semana?",
    "Por que perguntas curtas podem fortalecer o raciocínio clínico?",
    ...
  ]
}`;

    const schema = {
      type: 'object',
      properties: {
        questions: {
          type: 'array',
          description: 'Array com exatamente 8 perguntas',
          items: { type: 'string' },
        },
      },
      required: ['questions'],
    };

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: schema,
      model: 'claude_sonnet_4_6',
    });

    // Extract questions from LLM response
    let questions = null;
    if (Array.isArray(result)) {
      questions = result;
    } else if (result && Array.isArray(result.questions)) {
      questions = result.questions;
    } else if (result?.response && Array.isArray(result.response.questions)) {
      questions = result.response.questions;
    } else if (result?.response && typeof result.response === 'object') {
      const firstArray = Object.values(result.response).find(v => Array.isArray(v));
      if (firstArray) questions = firstArray;
    }

    if (!questions || questions.length === 0) {
      return Response.json({ 
        error: 'IA não gerou perguntas',
        received: JSON.stringify(result).slice(0, 200)
      }, { status: 500 });
    }

    // Format questions with IDs
    const formattedQuestions = questions.slice(0, 8).map((q, i) => ({
      id: `q${i + 1}`,
      text: typeof q === 'string' ? q : (q.text || q.question || JSON.stringify(q)),
      hint: 'Dica: revise o conteúdo do módulo antes de responder.',
    }));

    // Create DailyChallenge for all courses
    const created = [];
    for (const course of COURSES) {
      const record = await base44.asServiceRole.entities.DailyChallenge.create({
        date: today,
        course,
        lesson_ref: selectedTheme.lesson_ref,
        lesson_id: selectedTheme.lesson_id,
        questions: formattedQuestions,
        created_by_admin: 'automation',
      });
      created.push({ course, id: record.id });
    }

    return Response.json({
      success: true,
      message: 'Ofensivas geradas automaticamente',
      theme: selectedTheme.title,
      questions_count: formattedQuestions.length,
      created,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function generateChallengeForCourse(base44, course, force = false, themeId = null) {
  const today = ymd(new Date());
  const existing = await base44.asServiceRole.entities.DailyChallenge.filter({ course, date: today });
  if (existing?.length && !force) {
    return Response.json({ success: true, message: 'Ofensiva já existe para hoje', id: existing[0].id });
  }

  const selectedTheme = WEEKLY_THEMES.find(t => t.id === themeId) || WEEKLY_THEMES[0];
  const prompt = `Você é professor especialista em Terapia Cognitivo-Comportamental.
Crie EXATAMENTE 8 perguntas discursivas para uma Ofensiva Diária.

TEMA DA SEMANA: ${selectedTheme.title}
REFERÊNCIA: ${selectedTheme.lesson_ref}
5 ABORDAGENS DISPONÍVEIS: ${selectedTheme.approaches.join('; ')}

REGRAS:
1. Baseie todas as perguntas no tema da semana.
2. Cubra as 5 abordagens disponíveis, repetindo abordagens quando necessário para completar 8 perguntas.
3. As perguntas 3 e 6 devem ser mais reflexivas/desafiadoras, pois serão "Baú do Saber".
4. Não inclua alternativas nem respostas.
5. Retorne APENAS um JSON com a chave "questions" contendo um array de 8 strings.`;

  const schema = {
    type: 'object',
    properties: {
      questions: {
        type: 'array',
        description: 'Array com exatamente 8 perguntas',
        items: { type: 'string' },
      },
    },
    required: ['questions'],
  };

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: schema,
    model: 'claude_sonnet_4_6',
  });

  let questions = null;
  if (Array.isArray(result)) questions = result;
  else if (result && Array.isArray(result.questions)) questions = result.questions;
  else if (result?.response && Array.isArray(result.response.questions)) questions = result.response.questions;
  else if (result?.response && typeof result.response === 'object') questions = Object.values(result.response).find(v => Array.isArray(v));

  if (!questions?.length) {
    return Response.json({ error: 'IA não gerou perguntas', received: JSON.stringify(result).slice(0, 200) }, { status: 500 });
  }

  const formattedQuestions = questions.slice(0, 8).map((q, i) => ({
    id: `q${i + 1}`,
    text: typeof q === 'string' ? q : (q.text || q.question || JSON.stringify(q)),
    hint: `Tema: ${selectedTheme.title}. Abordagens: ${selectedTheme.approaches.join(', ')}.`,
  }));

  const data = {
    date: today,
    course,
    lesson_ref: selectedTheme.lesson_ref,
    lesson_id: selectedTheme.lesson_id,
    questions: formattedQuestions,
    created_by_admin: 'manual',
  };

  if (existing?.length && force) {
    await base44.asServiceRole.entities.DailyChallenge.update(existing[0].id, data);
    return Response.json({ success: true, id: existing[0].id, updated: true, theme: selectedTheme.title });
  }

  const record = await base44.asServiceRole.entities.DailyChallenge.create(data);
  return Response.json({ success: true, id: record.id, theme: selectedTheme.title });
}
