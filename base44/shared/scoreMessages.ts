/**
 * scoreMessages & Banco Oficial de 30 Respostas Próprias de Autocorreção
 * ──────────────────────────────────────────────────────────────────────
 * Sistema 100% em código (sem pontos e sem consumo de créditos) para
 * autocorreção imediata de provas, trabalhos e participações.
 */

export const AUTO_CORRECTION_RESPONSES: string[] = [
  // 1 a 10 — Provas e Avaliações Clínicas
  '1. Autocorreção concluída: Excelente domínio conceitual! Você articulou os fundamentos teóricos com clareza e precisão clínica. Avaliação aprovada.',
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
  '17. Autocorreção do trabalho: Tarefa avaliada e registrada! Seu texto evidencia leitura atenta e compreensão sólida das intervenções clínicas.',
  '18. Autocorreção do trabalho: Parabéns pelo empenho! Sua escrita mostra evolução constante na linguagem técnica e no olhar terapêutico.',
  '19. Autocorreção do trabalho: Trabalho concluído e aprovado! Você conectou os princípios comportamentais à prática com muita clareza.',
  '20. Autocorreção do trabalho: Ótima entrega! Sua capacidade de observar o comportamento humano sem julgamentos aparece em cada parágrafo.',

  // 21 a 30 — Participações (Debates, Aulas, Relatos Terapêuticos e Ofensivas)
  '21. Autocorreção de participação: Contribuição enriquecedora! Seu posicionamento amplia o debate e fortalece o aprendizado coletivo da turma.',
  '22. Autocorreção de participação: Excelente intervenção! Compartilhar sua perspectiva clínica exercita a escuta ativa e o diálogo profissional.',
  '23. Autocorreção de participação: Participação validada! Sua presença reflexiva demonstra constância, generosidade acadêmica e espírito colaborativo.',
  '24. Autocorreção de participação: Muito bem! O diálogo que você construiu ajuda a fixar os conceitos do módulo de forma viva e prática.',
  '25. Autocorreção de participação: Etapa de estudo concluída e registrada! Cada aula e leitura assimilada constrói a base do seu atendimento clínico.',
  '26. Autocorreção de participação: Progresso validado com sucesso! Sua disciplina diária nos estudos está lapidando um(a) profissional de excelência.',
  '27. Autocorreção de participação: Relato clínico avaliado! Vivenciar a prática entre pares desenvolve empatia, ética e segurança no manejo.',
  '28. Autocorreção de participação: Excelente constância na Ofensiva! O treino diário mantém o raciocínio clínico ágil e sempre atualizado.',
  '29. Autocorreção de participação: Interação registrada com mérito! Acolher a visão do colega com respeito e técnica é a essência da terapia.',
  '30. Autocorreção de participação: Participação registrada e aprovada! Sua dedicação contínua inspira a turma e eleva o nível da nossa formação.',
];

function hashSeed(seed: string): number {
  let hash = 0;
  const key = String(seed || 'wr-edu');
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) % 1000003;
  }
  return Math.abs(hash);
}

function pick(list: string[], seed: string): string {
  return list[hashSeed(seed) % list.length];
}

export function pickAutoCorrectionResponse(
  seed = '',
  category: 'exam' | 'quiz' | 'task' | 'participation' | 'all' = 'all',
): string {
  if (category === 'exam' || category === 'quiz') {
    return pick(AUTO_CORRECTION_RESPONSES.slice(0, 10), `exam:${seed}`);
  }
  if (category === 'task') {
    return pick(AUTO_CORRECTION_RESPONSES.slice(10, 20), `task:${seed}`);
  }
  if (category === 'participation') {
    return pick(AUTO_CORRECTION_RESPONSES.slice(20, 30), `part:${seed}`);
  }
  return pick(AUTO_CORRECTION_RESPONSES, `all:${seed}`);
}

export function preserveOrGenerateFeedback(
  submissionFeedback: unknown,
  scoreNotes: unknown,
  automaticFeedback: string,
): string {
  return String(submissionFeedback || scoreNotes || '').trim() || automaticFeedback;
}

export function lessonScoreNote(refId = '') {
  return pickAutoCorrectionResponse(`lesson:${refId}`, 'participation');
}

export function taskScoreNote(refId = '', _points = 0, isQuiz = false) {
  return pickAutoCorrectionResponse(
    `${isQuiz ? 'quiz' : 'task'}:${refId}`,
    isQuiz ? 'quiz' : 'task',
  );
}

export function examScoreNote(refId = '', _points = 0) {
  return pickAutoCorrectionResponse(`exam:${refId}`, 'exam');
}

export function forumScoreNote(refId = '', _points = 0, _space = 'Sala de Debates', isReply = false) {
  return pickAutoCorrectionResponse(`${isReply ? 'reply' : 'post'}:${refId}`, 'participation');
}

export function ofensivaScoreNote(refId = '', _points = 0, _answered = 0) {
  return pickAutoCorrectionResponse(`ofensiva:${refId}`, 'participation');
}

export function therapistScoreNote(refId = '', role = 'terapeuta') {
  return `${pickAutoCorrectionResponse(`therapist:${refId}:${role}`, 'participation')} (Papel de ${role} concluído)`;
}

export const LIVE_ATTENDANCE_NOTE = 'Presença registrada na live — obrigado por estar com a gente!';