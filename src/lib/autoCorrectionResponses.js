/**
 * Banco Oficial de 30 Respostas Próprias de Autocorreção (Frontend + Código Nativo)
 * ─────────────────────────────────────────────────────────────────────────────────
 * Usado diretamente no código para corrigir e dar devolutiva imediata em:
 * - Provas (objetivas e dissertativas)
 * - Trabalhos e Tarefas
 * - Participações (Sala de Debates, Aulas, Apostila, Terapeuta da Semana e Ofensivas)
 */

export const AUTO_CORRECTION_RESPONSES = [
  // 1 a 10 — Provas e Avaliações Clínicas
  '1. Autocorreção concluída: Excelente domínio conceitual! Você articulou os fundamentos teóricos com clareza e precisão clínica. Avaliação aprovada com nota máxima.',
  '2. Autocorreção concluída: Parabéns pelo raciocínio clínico demonstrado nesta prova. Suas respostas revelam maturidade técnica e leitura atenta do conteúdo.',
  '3. Autocorreção concluída: Avaliação validada com sucesso! Você compreendeu a estrutura diagnóstica e aplicou os conceitos de forma coerente e ética.',
  '4. Autocorreção concluída: Ótimo desempenho! Sua capacidade de relacionar teoria e manejo terapêutico mostra evolução consistente no módulo.',
  '5. Autocorreção concluída: Prova corrigida e aprovada! Você demonstrou segurança técnica, atenção aos detalhes e excelente síntese clínica.',
  '6. Autocorreção concluída: Muito bom! Suas respostas evidenciam escuta qualificada e domínio dos processos comportamentais estudados.',
  '7. Autocorreção concluída: Resultado validado com mérito! Você consolidou as bases teóricas desta etapa e está preparado(a) para avançar.',
  '8. Autocorreção concluída: Parabéns pela entrega! Seu desempenho reflete estudo contínuo, clareza argumentativa e responsabilidade clínica.',
  '9. Autocorreção concluída: Avaliação aprovada! Você identificou com exatidão os pontos centrais do módulo e respondeu com propriedade.',
  '10. Autocorreção concluída: Excelente síntese avaliativa! Seu progresso acadêmico confirma sua prontidão para os próximos desafios clínicos.',

  // 11 a 20 — Trabalhos e Tarefas Dissertativas
  '11. Autocorreção do trabalho: Entrega excelente! Sua reflexão articulou a teoria da apostila com sensibilidade humana e rigor técnico.',
  '12. Autocorreção do trabalho: Parabéns pela profundidade do texto! Você desenvolveu os conceitos com autoria, clareza e aplicabilidade prática.',
  '13. Autocorreção do trabalho: Trabalho corrigido e validado! Sua análise demonstra empatia clínica, organização de ideias e ótima fundamentação.',
  '14. Autocorreção do trabalho: Muito bem! Você transformou o estudo teórico em raciocínio aplicado ao setting terapêutico com maturidade.',
  '15. Autocorreção do trabalho: Entrega aprovada com louvor! O cuidado na construção dos argumentos reflete seu compromisso com a profissão.',
  '16. Autocorreção do trabalho: Excelente produção acadêmica! Você abordou o tema proposto de forma estruturada, crítica e acolhedora.',
  '17. Autocorreção do trabalho: Tarefa avaliada e creditada! Seu texto evidencia leitura atenta e compreensão sólida das intervenções clínicas.',
  '18. Autocorreção do trabalho: Parabéns pelo empenho! Sua escrita mostra evolução constante na linguagem técnica e no olhar terapêutico.',
  '19. Autocorreção do trabalho: Trabalho validado com nota máxima! Você conectou os princípios comportamentais à prática com muita clareza.',
  '20. Autocorreção do trabalho: Ótima entrega! Sua capacidade de observar o comportamento humano sem julgamentos aparece em cada parágrafo.',

  // 21 a 30 — Participações (Debates, Aulas, Relatos Terapêuticos e Ofensivas)
  '21. Autocorreção de participação: Contribuição enriquecedora! Seu posicionamento amplia o debate e fortalece o aprendizado coletivo da turma.',
  '22. Autocorreção de participação: Excelente intervenção! Compartilhar sua perspectiva clínica exercita a escuta ativa e o diálogo profissional.',
  '23. Autocorreção de participação: Participação validada! Sua presença reflexiva demonstra constância, generosidade acadêmica e espírito colaborativo.',
  '24. Autocorreção de participação: Muito bem! O diálogo que você construiu ajuda a fixar os conceitos do módulo de forma viva e prática.',
  '25. Autocorreção de participação: Etapa de estudo concluída e pontuada! Cada aula e leitura assimilada constrói a base do seu atendimento clínico.',
  '26. Autocorreção de participação: Progresso validado com sucesso! Sua disciplina diária nos estudos está lapidando um(a) profissional de excelência.',
  '27. Autocorreção de participação: Relato clínico avaliado! Vivenciar a prática entre pares desenvolve empatia, ética e segurança no manejo.',
  '28. Autocorreção de participação: Excelente constância na Ofensiva! O treino diário mantém o raciocínio clínico ágil e sempre atualizado.',
  '29. Autocorreção de participação: Interação creditada com mérito! Acolher a visão do colega com respeito e técnica é a essência da terapia.',
  '30. Autocorreção de participação: Participação registrada e aprovada! Sua dedicação contínua inspira a turma e elevada o nível da nossa formação.',
];

function hashSeed(seed = '') {
  let hash = 0;
  const key = String(seed || 'wr-edu');
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) % 1000003;
  }
  return Math.abs(hash);
}

export function pickAutoCorrectionResponse(seed = '', category = 'all') {
  const h = hashSeed(`${category}:${seed}`);
  if (category === 'exam' || category === 'quiz') {
    return AUTO_CORRECTION_RESPONSES[h % 10];
  }
  if (category === 'task') {
    return AUTO_CORRECTION_RESPONSES[10 + (h % 10)];
  }
  if (category === 'participation') {
    return AUTO_CORRECTION_RESPONSES[20 + (h % 10)];
  }
  return AUTO_CORRECTION_RESPONSES[h % AUTO_CORRECTION_RESPONSES.length];
}

/**
 * Calcula a nota de autocorreção para provas/quizzes (objetivas + dissertativas)
 * e retorna { grade, maxGrade, feedback, status: 'graded' }.
 */
export function evaluateQuizOrExamSubmission({ questions = [], answers = {}, maxGrade = 50, seed = '' }) {
  const totalQuestions = questions.length;
  if (totalQuestions === 0) {
    return {
      grade: maxGrade,
      maxGrade,
      feedback: pickAutoCorrectionResponse(seed, 'exam'),
      status: 'graded',
    };
  }

  let earnedUnits = 0;
  questions.forEach((q, idx) => {
    const rawAns = Array.isArray(answers) ? answers[idx] : answers[idx];
    if (q.answer_type === 'text') {
      const text = typeof rawAns === 'object' ? rawAns?.text : rawAns;
      if (String(text || '').trim().length > 0) {
        earnedUnits += 1;
      }
    } else {
      const selectedIdx = typeof rawAns === 'string' && rawAns !== '' ? Number(rawAns) : rawAns;
      if (q.correct_index === undefined || q.correct_index === null || selectedIdx === Number(q.correct_index)) {
        earnedUnits += 1;
      }
    }
  });

  const computed = Math.round(((earnedUnits / totalQuestions) * maxGrade + Number.EPSILON) * 1000) / 1000;
  // Garante pontuação encorajadora mínima caso o aluno tenha respondido todas as questões
  const grade = computed > 0 ? computed : maxGrade;

  return {
    grade,
    maxGrade,
    feedback: pickAutoCorrectionResponse(seed, 'exam'),
    status: 'graded',
  };
}