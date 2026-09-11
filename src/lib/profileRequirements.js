// Requisitos do cadastro do aluno — a assistente Corujinha pede um item por vez.
// A foto é opcional: todos os demais itens são obrigatórios.

export const PROFILE_STEPS = [
  {
    key: 'full_name',
    type: 'text',
    label: 'Nome completo',
    emoji: '🪪',
    placeholder: 'Ex.: Maria Aparecida da Silva',
    question: 'Vamos começar pelo seu nome completo, do jeito que está no seu documento. É esse nome que vai sair no seu certificado.',
    help: 'Escreva nome e sobrenome, como no RG ou CPF.',
    error: 'Escreva seu nome e o sobrenome (mínimo duas palavras).',
    validate: (value) => String(value || '').trim().split(/\s+/).filter(Boolean).length >= 2,
  },
  {
    key: 'nickname',
    type: 'text',
    label: 'Apelido',
    emoji: '😊',
    placeholder: 'Ex.: Cida',
    question: 'Agora me diga: como você gosta de ser chamado ou chamada pelos colegas?',
    help: 'Pode ser só o primeiro nome ou um apelido carinhoso.',
    error: 'Escreva pelo menos duas letras.',
    validate: (value) => String(value || '').trim().length >= 2,
  },
  {
    key: 'birth_date',
    type: 'date',
    label: 'Data de nascimento',
    emoji: '🎂',
    placeholder: '',
    question: 'Qual é a sua data de nascimento? Toque no campo e escolha o dia, o mês e o ano.',
    help: 'Serve para confirmar sua identificação acadêmica.',
    error: 'Escolha uma data de nascimento válida.',
    validate: (value) => {
      const year = Number(String(value || '').slice(0, 4));
      return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) && year >= 1900 && year <= new Date().getFullYear();
    },
  },
  {
    key: 'whatsapp',
    type: 'tel',
    label: 'WhatsApp',
    emoji: '📱',
    placeholder: '(41) 99999-9999',
    question: 'Digite o número do seu WhatsApp com o DDD da sua cidade. É por ele que a coordenação fala com você.',
    help: 'Somente números: DDD e o número.',
    error: 'Digite o DDD e o número completo.',
    validate: (value) => String(value || '').replace(/\D/g, '').length >= 10,
  },
  {
    key: 'email',
    type: 'email',
    label: 'Email',
    emoji: '✉️',
    placeholder: 'seu@email.com',
    question: 'Agora o seu email. É o canal oficial para avisos, documentos e o envio do seu certificado.',
    help: 'Se não tiver, use o email de um familiar de confiança.',
    error: 'Digite um email válido, com arroba e ponto.',
    validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || '').trim()),
  },
  {
    key: 'bio',
    type: 'textarea',
    label: 'Apresentação pessoal',
    emoji: '📖',
    placeholder: 'Ex.: Tenho 68 anos, sou de Curitiba, já criei três filhos e sempre sonhei em ajudar pessoas...',
    question: 'Agora conte um pouquinho de você: sua história, o que você faz e por que escolheu este curso. Escreva com suas palavras, sem pressa.',
    help: 'Escreva pelo menos algumas linhas — mínimo de 60 letras.',
    error: 'Escreva um pouco mais sobre você (mínimo 60 letras).',
    validate: (value) => String(value || '').trim().length >= 60,
  },
  {
    key: 'avatar_emoji',
    type: 'avatar',
    label: 'Avatar',
    emoji: '🎭',
    question: 'Escolha um desenho para ser a sua figurinha na turma. Toque naquele que você mais gostar.',
    help: 'Toque em um desenho da lista.',
    error: 'Toque em um dos desenhos para escolher.',
    validate: (value) => !!String(value || '').trim(),
  },
  {
    key: 'avatar_color',
    type: 'color',
    label: 'Cor favorita',
    emoji: '🎨',
    question: 'Por último, escolha a sua cor favorita. Ela vai aparecer no seu perfil e no ranking da turma.',
    help: 'Toque em uma bolinha de cor.',
    error: 'Toque em uma cor para escolher.',
    validate: (value) => /^#[0-9a-fA-F]{6}$/.test(String(value || '')),
  },
];

export const AVATAR_COLORS = [
  '#5b5ef4', '#7c3aed', '#db2777', '#dc2626',
  '#ea580c', '#ca8a04', '#16a34a', '#0d9488',
  '#2563eb', '#0891b2', '#9333ea', '#c2410c',
];

/** Valores iniciais: aproveita o que já existe no perfil e na sessão. */
export function buildInitialValues(profile, session) {
  return {
    full_name: profile?.full_name || session?.name || '',
    nickname: profile?.nickname || '',
    birth_date: profile?.birth_date || '',
    whatsapp: profile?.whatsapp || '',
    email: profile?.email || session?.email || '',
    bio: profile?.bio || session?.bio || '',
    avatar_emoji: profile?.avatar_emoji || session?.avatarEmoji || '',
    avatar_color: profile?.avatar_color || '',
  };
}

export const missingSteps = (values) => PROFILE_STEPS.filter((step) => !step.validate(values?.[step.key]));