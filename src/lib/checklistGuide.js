// Roteiro didático da trilha do Checklist.
// Cada etapa tem uma explicação simples (passo a passo) e um texto de voz que a
// corujinha lê em voz alta — pensado para alunos que nunca usaram celular.

export const STEP_GUIDE = {
  lessons: {
    emoji: '🎬',
    short: 'Videoaulas',
    what: 'Assistir as videoaulas do módulo',
    steps: [
      'Toque no botão azul abaixo: "Me leve até lá".',
      'Escolha a primeira aula da lista e toque nela.',
      'Assista ao vídeo até o final.',
      'Escreva o resumo pedido e toque em salvar.',
    ],
  },
  apostila: {
    emoji: '📖',
    short: 'Apostila',
    what: 'Ler os capítulos da apostila e marcar como lidos',
    steps: [
      'Toque no botão abaixo para abrir a apostila do seu módulo.',
      'Leia o capítulo com calma (você pode ouvir o texto se preferir).',
      'No fim da página, toque em "Marcar como lida".',
      'Repita com o próximo capítulo.',
    ],
  },
  tasks: {
    emoji: '📝',
    short: 'Tarefas',
    what: 'Entregar as tarefas do módulo',
    steps: [
      'Toque no botão abaixo para ver suas tarefas.',
      'Abra a tarefa do seu módulo.',
      'Escreva sua resposta no campo de texto.',
      'Toque em enviar. Pronto: a etapa é marcada sozinha.',
    ],
  },
  debate_topic: {
    emoji: '💬',
    short: 'Abrir debate',
    what: 'Abrir um tema na Sala de Debates',
    steps: [
      'Toque no botão abaixo para entrar na Sala de Debates.',
      'Toque em "Novo tema".',
      'Escolha um assunto do seu módulo e escreva sua opinião.',
      'Toque em publicar.',
    ],
  },
  debate_comment: {
    emoji: '🗣️',
    short: 'Comentar',
    what: 'Comentar no debate de um colega',
    steps: [
      'Toque no botão abaixo para entrar na Sala de Debates.',
      'Escolha um tema aberto por outro colega.',
      'Escreva o seu comentário no campo de resposta.',
      'Toque em enviar.',
    ],
  },
  therapist: {
    emoji: '🤝',
    short: 'Atendimento',
    what: 'Fazer um atendimento como Terapeuta da Semana',
    steps: [
      'Toque no botão abaixo para ver o seu par da semana.',
      'Combine e realize o atendimento com o colega.',
      'Volte na página e toque em "Enviar relato".',
      'Conte como foi o atendimento e envie.',
    ],
  },
  ofensiva: {
    emoji: '🔥',
    short: 'Ofensiva',
    what: 'Cumprir 3 dias de ofensiva',
    steps: [
      'Toque no botão abaixo para abrir a Ofensiva do dia.',
      'Responda as 8 perguntas da trilha, uma por vez.',
      'Volte em outro dia e faça de novo.',
      'São 3 dias diferentes, não precisam ser seguidos.',
    ],
  },
};

export const getStepGuide = (key) => STEP_GUIDE[key] || { emoji: '✅', short: 'Etapa', what: 'Cumprir a etapa', steps: [] };

/** Texto que a corujinha fala em voz alta nesta etapa. */
export function buildVoiceScript({ item, index, total, moduleNumber, firstName }) {
  const guide = getStepGuide(item.key);
  const falta = Math.max(0, (item.target || 0) - (item.current || 0));
  const intro = index === 0
    ? `Olá ${firstName}! Eu sou a Corujinha e vou te guiar no módulo ${moduleNumber}.`
    : `Muito bem, ${firstName}!`;
  const situacao = falta > 0
    ? `Nesta etapa ${index + 1} de ${total}, você precisa ${guide.what.toLowerCase()}. Ainda falta ${falta} de ${item.target}.`
    : `A etapa ${index + 1} de ${total} já está concluída. Parabéns!`;
  const passos = falta > 0 && guide.steps.length
    ? ` Vou te explicar: ${guide.steps.join(' Depois, ')}`
    : '';
  const pergunta = falta > 0 ? ' Deseja que eu te leve até lá agora?' : ' Quer seguir para a próxima etapa da trilha?';
  return `${intro} ${situacao}${passos}${pergunta}`;
}

export function buildFinishScript({ firstName, moduleNumber }) {
  return `Parabéns, ${firstName}! Você concluiu todas as etapas do módulo ${moduleNumber}. Sua prova está liberada. Toque no botão roxo para começar a prova.`;
}