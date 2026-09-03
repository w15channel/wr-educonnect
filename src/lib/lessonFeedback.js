export const LESSON_FEEDBACK_OPTIONS = [
  'Parabéns pela excelente resposta! Continue aprendendo e se superando a cada desafio.',
  'Muito bem! Seu esforço está dando resultados; continue estudando e avançando.',
  'Parabéns! Você demonstrou uma ótima compreensão. Siga sempre buscando novos conhecimentos.',
  'Excelente trabalho! Continue curioso e dedicado, pois aprender é uma conquista diária.',
  'Parabéns pela resposta! Continue se esforçando e ampliando seus conhecimentos.',
  'Muito bom! Você está no caminho certo. Continue aprendendo com dedicação e confiança.',
  'Parabéns pelo seu desempenho! Mantenha o interesse e continue evoluindo nos estudos.',
  'Ótima resposta! Continue participando e aproveitando cada oportunidade para aprender mais.',
  'Parabéns! Seu aprendizado está avançando. Continue se dedicando e enfrentando novos desafios.',
  'Excelente! Continue com esse empenho e faça de cada atividade uma oportunidade de aprender.',
];

export function randomLessonFeedback(random = Math.random) {
  const index = Math.floor(random() * LESSON_FEEDBACK_OPTIONS.length);
  return LESSON_FEEDBACK_OPTIONS[Math.max(0, Math.min(index, LESSON_FEEDBACK_OPTIONS.length - 1))];
}
