// Tutorial guiado da Luna — a assistente do site.
// Cada etapa tem o texto na tela e o roteiro que a Luna lê em voz alta.

export const LUNA_NAME = 'Luna';

export const LUNA_TUTORIAL_STEPS = [
  {
    emoji: '🎓',
    title: 'Boas-vindas!',
    subtitle: 'Existem dois modelos de estudo',
    bullets: [
      { icon: '📜', text: 'Somente Diploma: aulas gravadas, apostila e entrega de trabalhos, no seu tempo e sem comunidade.' },
      { icon: '🌟', text: 'Formação Completa: tudo isso mais fórum, sala de debates, chat da turma, Terapeuta da Semana e lives.' },
      { icon: '🧭', text: 'A navegação fica no menu lateral (computador) ou no menu de baixo (celular).' },
    ],
    speech: 'Eu sou a Luna, sua assistente aqui na plataforma, e vou te apresentar tudo com calma. Primeiro, saiba que existem dois modelos de estudo. No modelo Somente Diploma você estuda sozinho, com as aulas gravadas, a apostila e a entrega de trabalhos. Na Formação Completa você tem tudo isso e ainda participa do fórum, da sala de debates, do chat da turma, das lives e da experiência de ser Terapeuta da Semana. Para caminhar pelo site, use o menu lateral no computador ou o menu de baixo no celular.',
  },
  {
    emoji: '🎬',
    title: 'Aulas gravadas',
    subtitle: 'Conteúdo em vídeo no seu ritmo',
    bullets: [
      { icon: '▶️', text: 'Videoaulas, aulas em texto e materiais externos organizados por módulo.' },
      { icon: '✅', text: 'Marque cada aula como assistida para registrar o seu progresso.' },
      { icon: '📝', text: 'Escreva o resumo e o comentário da aula para confirmar presença.' },
    ],
    speech: 'Na área de Aulas está todo o conteúdo gravado, separado por módulos. Assista com calma, marque a aula como assistida e depois escreva um resumo e um comentário sobre ela. É assim que a sua presença é registrada e a sua pontuação começa a crescer.',
  },
  {
    emoji: '📚',
    title: 'Apostila digital',
    subtitle: 'Todo o material teórico',
    bullets: [
      { icon: '🗂️', text: 'Dez módulos com o conteúdo completo do curso.' },
      { icon: '🔊', text: 'Leitura guiada com voz, para acompanhar sem cansar a vista.' },
      { icon: '🖨️', text: 'Imprima ou salve cada capítulo em PDF quando quiser.' },
    ],
    speech: 'A Apostila reúne todo o material teórico do curso, em dez módulos. Você pode ler na tela, ouvir a leitura em voz alta e também imprimir ou salvar cada capítulo em PDF. Ao terminar um capítulo, toque em marcar como lido.',
  },
  {
    emoji: '📋',
    title: 'Tarefas e provas',
    subtitle: 'As atividades avaliativas',
    bullets: [
      { icon: '📤', text: 'Envie os trabalhos por texto ou por arquivo.' },
      { icon: '🧠', text: 'Responda provas e questionários direto na plataforma.' },
      { icon: '⭐', text: 'Acompanhe as suas notas e o retorno do professor.' },
    ],
    speech: 'Em Tarefas e Provas ficam as atividades avaliativas. Você envia os trabalhos por texto ou por arquivo, responde as provas dentro da própria plataforma e depois acompanha as suas notas e o retorno do professor. Cada entrega já vem com uma comemoração de parabéns.',
  },
  {
    emoji: '✅',
    title: 'Checklist do módulo',
    subtitle: 'O seu caminho até a prova',
    bullets: [
      { icon: '🚶', text: 'Uma trilha mostra, um passo por vez, o que ainda falta no módulo.' },
      { icon: '🔓', text: 'Ao concluir todos os passos, a prova do módulo é liberada.' },
      { icon: '🦉', text: 'Eu, a Luna, te acompanho em cada passo com explicação falada.' },
    ],
    speech: 'O Checklist é o seu caminho até a prova. Ele mostra, um passo por vez, o que ainda falta fazer no módulo: as aulas, os capítulos da apostila, as tarefas, os debates, o atendimento como terapeuta e as ofensivas. Quando você completa todos os passos, a prova do módulo é liberada. Eu fico com você em cada passo, explicando em voz alta.',
  },
  {
    emoji: '💬',
    title: 'Comunidade',
    subtitle: 'Conviver com a turma',
    bullets: [
      { icon: '💬', text: 'Chat da turma em tempo real com os seus colegas.' },
      { icon: '🗣️', text: 'Sala de Debates: abra um tema e comente no tema de um colega.' },
      { icon: '❓', text: 'Suporte ao Aluno: abra um chamado quando algo der errado.' },
    ],
    speech: 'A Comunidade é o coração da formação completa. No chat da turma você conversa com os colegas. Na Sala de Debates você abre um tema e comenta no tema de outra pessoa. E, se algo der errado no site, abra um chamado no Suporte ao Aluno: a equipe responde por lá.',
  },
  {
    emoji: '💆',
    title: 'Terapeuta da Semana',
    subtitle: 'Prática terapêutica acompanhada',
    bullets: [
      { icon: '🔀', text: 'A cada rodada você é pareado com um colega.' },
      { icon: '🧑‍⚕️', text: 'Em uma sessão você é o terapeuta, em outra o paciente.' },
      { icon: '📝', text: 'O relato da sessão é privado, visto apenas pelo professor.' },
    ],
    speech: 'No Terapeuta da Semana você é pareado com um colega para praticar de verdade. Em uma rodada você atende como terapeuta e em outra você é o paciente. Ao final, escreva o relato da sessão: ele é privado e só o professor lê.',
  },
  {
    emoji: '🔥',
    title: 'Ofensivas diárias',
    subtitle: 'Um pouquinho todos os dias',
    bullets: [
      { icon: '🎯', text: 'Oito perguntas por dia, tiradas das aulas e da apostila.' },
      { icon: '🔥', text: 'Responder todos os dias mantém a sua sequência ativa.' },
      { icon: '💎', text: 'Sequências de 5, 10 e 20 dias rendem pontos extras.' },
    ],
    speech: 'As Ofensivas são o desafio de cada dia: oito perguntas tiradas das aulas e da apostila. Responder todos os dias mantém a sua sequência ativa, e sequências de cinco, dez e vinte dias rendem pontos extras. É pouco tempo por dia e faz muita diferença no final.',
  },
  {
    emoji: '🤖',
    title: 'Ferramentas de apoio',
    subtitle: 'Ajuda sempre por perto',
    bullets: [
      { icon: '🤖', text: 'Tutor Digital: tire dúvidas do conteúdo a qualquer hora.' },
      { icon: '📊', text: 'Histórico Acadêmico, Calendário e Notificações da turma.' },
      { icon: '💰', text: 'Mensalidades: acompanhe as suas contribuições e recibos.' },
    ],
    speech: 'Você também tem ferramentas de apoio: o Tutor Digital, para tirar dúvidas do conteúdo a qualquer hora; o Histórico Acadêmico, com todas as suas notas; o Calendário, com os prazos; as notificações da turma; e a área de mensalidades, para acompanhar as suas contribuições e recibos.',
  },
  {
    emoji: '📜',
    title: 'Seu certificado',
    subtitle: 'Reconhecimento nacional e internacional',
    bullets: [
      { icon: '🔳', text: 'Cada certificado tem QR Code para consulta pública.' },
      { icon: '🇧🇷', text: 'Credenciamento nacional junto à ABED.' },
      { icon: '🌍', text: 'Credenciamento internacional pela AHDE.' },
    ],
    speech: 'Ao concluir o curso, você recebe o seu certificado com um QR Code exclusivo, que qualquer pessoa pode conferir. Ele tem credenciamento nacional junto à ABED e internacional pela AHDE. Pronto! Sempre que precisar de ajuda, me chame: eu sou a Luna e estou aqui com você. Bons estudos!',
  },
];