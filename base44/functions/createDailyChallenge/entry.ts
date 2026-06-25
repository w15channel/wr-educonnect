import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const COURSES = ['tcc', 'psicanalise', 'sexologia'];

const MODULE_BANK = [
  {
    id: 'mod1',
    title: 'Módulo 1 — Fundamentos da Terapia Comportamental',
    lessons: [
      ['mod1-a1', 'Aula 1 — Introdução à Terapia Comportamental: o Olhar que Transforma Vidas'],
      ['mod1-a2', 'Aula 2 — Autoimagem e Motivação para Ser Terapeuta'],
      ['mod1-a3', 'Aula 3 — Modelo Cognitivo: Pensamentos, Emoções e Comportamento no Consultório'],
      ['mod1-a4', 'Aula 4 — O Domínio do Self e as Características Exclusivas do Paciente'],
      ['mod1-a5', 'Aula 5 — Lendo o Paciente no Campo: Os Primeiros 15 Minutos de Sessão'],
    ],
  },
  {
    id: 'mod2',
    title: 'Módulo 2 — O Terapeuta em Ação',
    lessons: [
      ['mod2-a1', 'Aula 1 — Escuta Ativa: O Que Fazer Quando o Silêncio é Resistência'],
      ['mod2-a2', 'Aula 2 — Gestão da Sua Própria Ansiedade Frente ao Paciente'],
      ['mod2-a3', 'Aula 3 — Como Criar Segurança Desde a Primeira Frase'],
      ['mod2-a4', 'Aula 4 — Rupturas na Aliança: Reconhecer o Sinal Invisível e Reparar'],
      ['mod2-a5', 'Aula 5 — Encerramento de Sessão e de Processo: Como Terminar Bem'],
    ],
  },
  {
    id: 'mod3',
    title: 'Módulo 3 — Intervenções Práticas I',
    lessons: [
      ['mod3-a1', 'Aula 1 — Como Confrontar Comportamentos Destrutivos Sem Criar Resistência'],
      ['mod3-a2', 'Aula 2 — Intenção Paradoxal: Quebrando Ciclos que se Autoperpetua'],
      ['mod3-a3', 'Aula 3 — O Uso Estratégico do Silêncio para Provocar Autorregulação'],
      ['mod3-a4', 'Aula 4 — Manejo do Paciente Hipercontrolador: Protocolo Prático'],
      ['mod3-a5', 'Aula 5 — Como Transformar Bravura em Assertividade: Da Agressão à Precisão'],
    ],
  },
  {
    id: 'mod4',
    title: 'Módulo 4 — Intervenções Práticas II',
    lessons: [
      ['mod4-a1', 'Aula 1 — Manejo da Simbiose Patológica: O Paciente Que Quer Ser Você'],
      ['mod4-a2', 'Aula 2 — Técnicas de Diferenciação: Ensinando o Paciente a Dizer Não'],
      ['mod4-a3', 'Aula 3 — Como Usar a Vulnerabilidade Como Recurso de Força'],
      ['mod4-a4', 'Aula 4 — Manejo do Luto e da Perda em Pacientes com Apego Intenso'],
      ['mod4-a5', 'Aula 5 — Regulação para o Paciente com Apego Ansioso: Ferramentas Diretas'],
    ],
  },
  {
    id: 'mod5',
    title: 'Módulo 5 — Luto: Clínica do Que Não Se Fala',
    lessons: [
      ['mod5-a1', 'Aula 1 — O Que É Luto de Verdade — Além da Morte'],
      ['mod5-a2', 'Aula 2 — As Fases do Luto na Prática: O Que Fazer em Cada Uma'],
      ['mod5-a3', 'Aula 3 — Luto Complicado: Quando o Processo Travou'],
      ['mod5-a4', 'Aula 4 — Luto por Morte por Suicídio: Clínica Específica'],
      ['mod5-a5', 'Aula 5 — Regulação do Terapeuta Diante de Pacientes em Luto Intenso'],
    ],
  },
  {
    id: 'mod6',
    title: 'Módulo 6 — Vícios e Compulsões',
    lessons: [
      ['mod6-a1', 'Aula 1 — O Que Sustenta o Vício: A Lógica por Trás da Repetição'],
      ['mod6-a2', 'Aula 2 — Mapeando Gatilhos: O Protocolo que Você Usa na Segunda Sessão'],
      ['mod6-a3', 'Aula 3 — Recaída Não É Fracasso — Como Usar Como Dado Clínico'],
      ['mod6-a4', 'Aula 4 — Compulsão Alimentar e Corpo: Trabalho Integrado'],
      ['mod6-a5', 'Aula 5 — Construindo a Vida que Compete com o Vício'],
    ],
  },
  {
    id: 'mod7',
    title: 'Módulo 7 — Depressão: Clínica da Ausência',
    lessons: [
      ['mod7-a1', 'Aula 1 — Reconhecer Depressão Antes do Diagnóstico Formal'],
      ['mod7-a2', 'Aula 2 — Ativação Comportamental: A Técnica Principal na Depressão'],
      ['mod7-a3', 'Aula 3 — Crenças Centrais na Depressão: Como Acessar e Trabalhar'],
      ['mod7-a4', 'Aula 4 — Depressão e Corpo: O Que a Biologia Pede'],
      ['mod7-a5', 'Aula 5 — Prevenção de Recaída Depressiva: O Protocolo de Manutenção'],
    ],
  },
  {
    id: 'mod8',
    title: 'Módulo 8 — Sexualidade na Clínica',
    lessons: [
      ['mod8-a1', 'Aula 1 — Como Falar de Sexualidade em Sessão Sem Criar Constrangimento'],
      ['mod8-a2', 'Aula 2 — Disfunções Sexuais: O Que o Terapeuta Precisa Saber'],
      ['mod8-a3', 'Aula 3 — Trauma Sexual: Como Abordar Sem Re-traumatizar'],
      ['mod8-a4', 'Aula 4 — Identidade Sexual e Orientação: Clínica Afirmativa'],
      ['mod8-a5', 'Aula 5 — Sexualidade no Casal: Quando o Problema Individual Vira Campo Relacional'],
    ],
  },
  {
    id: 'mod9',
    title: 'Módulo 9 — Ferramentas de Consultório I',
    lessons: [
      ['mod9-a1', 'Aula 1 — Comunicação Terapêutica: O Que Você Diz, Como Diz e o Que Não Diz'],
      ['mod9-a2', 'Aula 2 — Anamnese Clínica: Construindo o Método Avaliativo desde a Primeira Sessão'],
      ['mod9-a3', 'Aula 3 — Construção de Perfil Comportamental: Da Observação ao Mapa Clínico'],
      ['mod9-a4', 'Aula 4 — Formulação de Caso: Transformando Dados em Direção Clínica'],
      ['mod9-a5', 'Aula 5 — Avaliação de Progresso: Como Saber Se o Trabalho Está Funcionando'],
    ],
  },
  {
    id: 'mod10',
    title: 'Módulo 10 — Atendimentos Especializados',
    lessons: [
      ['mod10-a1', 'Aula 1 — Terapia de Casal: Estrutura, Setting e as Primeiras Três Sessões'],
      ['mod10-a2', 'Aula 2 — Conflito de Casal: Mapeando o Ciclo e Intervindo no Padrão'],
      ['mod10-a3', 'Aula 3 — Atendimento de Idosos: Especificidades Clínicas e Técnicas de Abordagem'],
      ['mod10-a4', 'Aula 4 — Atendimento de Adolescentes: Aliança, Limites e o Que Não Dizer'],
      ['mod10-a5', 'Aula 5 — Casos Complexos: Quando Múltiplos Contextos se Sobrepõem'],
    ],
  },
];

const QUESTION_TEMPLATES = [
  topic => `Qual é a ideia central de "${topic}" e por que ela importa para a prática terapêutica?`,
  topic => `Como "${topic}" pode aparecer no comportamento real de um paciente em sessão?`,
  topic => `Que sinais verbais, emocionais ou corporais ajudariam você a reconhecer "${topic}" no atendimento?`,
  topic => `Qual pergunta terapêutica você faria para investigar "${topic}" sem julgar o paciente?`,
  topic => `Que cuidado ético o terapeuta precisa ter ao trabalhar "${topic}"?`,
  topic => `Descreva uma situação clínica em que "${topic}" poderia mudar a direção do atendimento.`,
  topic => `Como o ambiente, a história de vida ou os vínculos podem manter padrões ligados a "${topic}"?`,
  topic => `Que intervenção simples e segura poderia ajudar o paciente a observar "${topic}" na própria vida?`,
  topic => `O que um terapeuta iniciante costuma ignorar quando encontra um caso relacionado a "${topic}"?`,
  topic => `Como você explicaria "${topic}" para um paciente em linguagem acolhedora e acessível?`,
  topic => `Qual comportamento de evitação pode surgir quando o paciente se aproxima de "${topic}"?`,
  topic => `Como transformar a compreensão de "${topic}" em uma tarefa terapêutica entre sessões?`,
  topic => `Que risco existe em interpretar "${topic}" rápido demais, antes de compreender a função do comportamento?`,
  topic => `Como "${topic}" se conecta com vínculo terapêutico, segurança e adesão ao processo?`,
  topic => `Que hipótese clínica inicial você levantaria ao perceber "${topic}" se repetindo?`,
  topic => `O que o terapeuta deve observar em si mesmo ao conduzir um atendimento sobre "${topic}"?`,
];

function ymd(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(dateStr, offset) {
  const date = new Date(`${dateStr}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return ymd(date);
}

function clampDuration(value) {
  const duration = Number(value || 1);
  if (![1, 3, 5, 7].includes(duration)) return 1;
  return duration;
}

function findModule(moduleId) {
  return MODULE_BANK.find(module => module.id === moduleId) || MODULE_BANK[0];
}

function findLesson(module, lessonId) {
  return module.lessons.find(([id]) => id === lessonId) || module.lessons[0];
}

function buildQuestions(topic, dayOffset = 0) {
  const start = dayOffset * 8;
  return Array.from({ length: 8 }, (_, i) => {
    const template = QUESTION_TEMPLATES[(start + i) % QUESTION_TEMPLATES.length];
    return {
      id: `q${i + 1}`,
      text: template(topic),
      hint: `Tema selecionado: ${topic}. Responda com conceito, exemplo clínico e postura profissional.`,
    };
  });
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

      // Admin generation from the app sends { course, force, module_id, lesson_id, duration_days }.
      if (!course || !COURSES.includes(course)) {
        return Response.json({ error: 'Curso inválido' }, { status: 400 });
      }
      return await generateChallengeForCourse(base44, course, force, payload?.module_id, payload?.lesson_id, payload?.duration_days);
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

    // Select theme based on day of year (rotates through apostila lessons)
    const dayOfYear = Math.floor(
      (new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
    );
    const flattenedLessons = MODULE_BANK.flatMap(module => module.lessons.map(lesson => ({ module, lesson })));
    const selected = flattenedLessons[Math.floor((dayOfYear - 1) / 7) % flattenedLessons.length];
    const [lessonId, lessonTitle] = selected.lesson;
    const formattedQuestions = buildQuestions(lessonTitle, dayOfYear);

    // Create DailyChallenge for all courses
    const created = [];
    for (const course of COURSES) {
      const record = await base44.asServiceRole.entities.DailyChallenge.create({
        date: today,
        course,
        lesson_ref: `${selected.module.title} • ${lessonTitle}`,
        lesson_id: lessonId,
        questions: formattedQuestions,
        created_by_admin: 'automation-preset',
      });
      created.push({ course, id: record.id });
    }

    return Response.json({
      success: true,
      message: 'Ofensivas geradas automaticamente',
      theme: lessonTitle,
      questions_count: formattedQuestions.length,
      created,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function generateChallengeForCourse(base44, course, force = false, moduleId = 'mod1', lessonId = 'mod1-a1', durationDays = 1) {
  const today = ymd(new Date());
  const safeDuration = clampDuration(durationDays);
  const selectedModule = findModule(moduleId);
  const [selectedLessonId, selectedLessonTitle] = findLesson(selectedModule, lessonId);
  const lessonRef = `${selectedModule.title} • ${selectedLessonTitle}`;
  const results = [];

  for (let offset = 0; offset < safeDuration; offset += 1) {
    const date = addDays(today, offset);
    const existing = await base44.asServiceRole.entities.DailyChallenge.filter({ course, date });
    const data = {
      date,
      course,
      lesson_ref: lessonRef,
      lesson_id: selectedLessonId,
      questions: buildQuestions(selectedLessonTitle, offset),
      created_by_admin: 'manual-preset',
    };

    if (existing?.length && force) {
      await base44.asServiceRole.entities.DailyChallenge.update(existing[0].id, data);
      results.push({ date, id: existing[0].id, action: 'updated' });
    } else if (existing?.length) {
      results.push({ date, id: existing[0].id, action: 'skipped' });
    } else {
      const record = await base44.asServiceRole.entities.DailyChallenge.create(data);
      results.push({ date, id: record.id, action: 'created' });
    }
  }

  return Response.json({
    success: true,
    module: selectedModule.title,
    theme: selectedLessonTitle,
    duration_days: safeDuration,
    results,
    created: results.filter(r => r.action === 'created').length,
    updated: results.filter(r => r.action === 'updated').length,
    skipped: results.filter(r => r.action === 'skipped').length,
  });
}
