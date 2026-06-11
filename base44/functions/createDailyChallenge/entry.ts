import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const COURSES = ['tcc', 'psicanalise', 'sexologia'];

// Apostila modules for rotation
const APOSTILA_MODULES = [
  { id: 'mod1', title: 'Módulo 1 — Fundamentos da Terapia Cognitivo-Comportamental' },
  { id: 'mod2', title: 'Módulo 2 — Estruturação da Sessão Terapêutica' },
  { id: 'mod3', title: 'Módulo 3 — Avaliação e Formulação de Casos' },
  { id: 'mod4', title: 'Módulo 4 — Intervenções Cognitivas' },
  { id: 'mod5', title: 'Módulo 5 — Intervenções Comportamentais' },
  { id: 'mod6', title: 'Módulo 6 — Prevenção de Recaída' },
  { id: 'mod7', title: 'Módulo 7 — Casos Clínicos Especiais' },
  { id: 'mod8', title: 'Módulo 8 — Ética e Prática Profissional' },
  { id: 'mod9', title: 'Módulo 9 — Supervisão e Desenvolvimento Profissional' },
  { id: 'mod10', title: 'Módulo 10 — Tópicos Avançados em TCC' },
];

function ymd(date) {
  return date.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const isAutomation = ['scheduled', 'entity'].includes(payload?.automation?.type);

    // Manual call with payload — preserve original behavior
    if (!isAutomation) {
      const { date, course, lesson_ref, lesson_id, questions } = payload;
      if (!date || !course || !questions || questions.length < 3) {
        return Response.json({ error: 'Dados inválidos' }, { status: 400 });
      }
      const record = await base44.asServiceRole.entities.DailyChallenge.create({
        date,
        course,
        lesson_ref: lesson_ref || null,
        lesson_id: lesson_id || null,
        questions: questions.slice(0, 5),
        created_by_admin: 'manual',
      });
      return Response.json({ success: true, id: record.id });
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

    // Select module based on day of year (rotates through 10 modules)
    const dayOfYear = Math.floor(
      (new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
    );
    const moduleIndex = (dayOfYear - 1) % APOSTILA_MODULES.length;
    const selectedModule = APOSTILA_MODULES[moduleIndex];

    // Generate questions using IA
    const prompt = `Você é professor especialista em Terapia Cognitivo-Comportamental.
Crie 5 perguntas de revisão sobre o seguinte módulo da apostila para a Ofensiva Diária de ${today}.

MÓDULO: ${selectedModule.title}

REGRAS:
1. Cada pergunta deve ser clara e direta, testando conhecimento prático do módulo.
2. Formato: apenas o texto da pergunta (sem alternativas, sem respostas).
3. As perguntas devem cobrir diferentes aspectos do módulo.
4. Retorne APENAS um JSON com a chave "questions" contendo um array de 5 strings.

Exemplo de resposta:
{
  "questions": [
    "Qual é a primeira etapa na estruturação de uma sessão de TCC?",
    "Como se formula um caso clínico segundo o modelo cognitivo?",
    ...
  ]
}`;

    const schema = {
      type: 'object',
      properties: {
        questions: {
          type: 'array',
          description: 'Array com exatamente 5 perguntas',
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
    const formattedQuestions = questions.slice(0, 5).map((q, i) => ({
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
        lesson_ref: selectedModule.title,
        lesson_id: selectedModule.id,
        questions: formattedQuestions,
        created_by_admin: 'automation',
      });
      created.push({ course, id: record.id });
    }

    return Response.json({
      success: true,
      message: 'Ofensivas geradas automaticamente',
      module: selectedModule.title,
      questions_count: formattedQuestions.length,
      created,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});