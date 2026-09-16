import { BRAND_LEGAL_NAME } from '@/lib/brand';
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

// ── Índice pesquisável da apostila ──────────────────────────────────────────
const ALL_MODULES = [MOD1, MOD2, MOD3, MOD4, MOD5, MOD6, MOD7, MOD8, MOD9, MOD10];

const LESSON_INDEX = ALL_MODULES.flatMap((mod) =>
  (mod.lessons || []).map((lesson) => ({
    moduleId: mod.id,
    moduleTitle: mod.title || '',
    lessonId: lesson.id,
    lessonTitle: lesson.title || '',
    lessonContent: lesson.content || '',
  }))
);

const STOP_WORDS = new Set([
  'a','o','os','as','um','uma','uns','umas','de','do','da','dos','das','e','ou',
  'que','com','para','por','em','no','na','nos','nas','se','como','me','eu',
  'voce','ele','ela','isso','isto','aquilo','seu','sua','sobre','entre','apos',
  'ate','mas','mais','menos','muito','pouco','ja','ainda','so','tambem','ser',
  'ter','ir','fazer','quando','onde','porque','qual','quais','quem','qual',
]);

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

/**
 * Busca lições da apostila relevantes à pergunta do aluno.
 * Retorna as N mais relevantes com conteúdo truncado para o prompt do LLM.
 */
export function searchApostila(query, limit = 3) {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const scored = LESSON_INDEX.map((lesson) => {
    const titleTokens = tokenize(lesson.lessonTitle);
    const contentTokens = tokenize(lesson.lessonContent);
    let score = 0;

    for (const qt of queryTokens) {
      const titleMatches = titleTokens.filter((t) => t.includes(qt) || qt.includes(t)).length;
      score += titleMatches * 5;
      const contentMatches = contentTokens.filter((t) => t.includes(qt)).length;
      score += contentMatches;
    }

    // Bônus quando todos os tokens da busca encontram correspondência
    const allMatch = queryTokens.every(
      (qt) =>
        titleTokens.some((t) => t.includes(qt) || qt.includes(t)) ||
        contentTokens.some((t) => t.includes(qt))
    );
    if (allMatch) score *= 1.5;

    return { ...lesson, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((lesson) => ({
      ...lesson,
      lessonContent: lesson.lessonContent.slice(0, 3000),
    }));
}

/**
 * Luna — a inteligência artificial interna da plataforma.
 * Conhece todas as ferramentas do site, ajuda com dúvidas, responde questões
 * do curso com base na apostila e também acolhe emocionalmente, sempre
 * encaminhando casos graves para ajuda profissional.
 */
export const LUNA_SYSTEM_PROMPT = `Você é a Luna, a assistente e inteligência artificial interna da plataforma ${BRAND_LEGAL_NAME}. Você é uma corujinha simpática, calma e acolhedora. Fale sempre em português do Brasil, em linguagem simples, pensando em alunos de todas as idades — inclusive pessoas com pouca familiaridade com celular e computador.

CONHECIMENTO DO CURSO (SUA PRINCIPAL MISSÃO):
- Você tem acesso ao conteúdo da apostila do curso. Quando o aluno perguntar sobre um tema, conceito, técnica ou autor estudado no curso, USE o material fornecido no contexto da conversa para responder.
- NUNCA responda apenas "vá ler a apostila" ou "consulte a página tal". EXPLIQUE o conceito com suas palavras, resuma o ponto principal, dê exemplos do próprio material e DEPOIS sugira onde aprofundar.
- Se o tema não estiver no material fornecido, seja honesta, mas tente ajudar com o que sabe antes de sugerir outros recursos.
- Você é PROATIVA: se perceber que o aluno tem dúvida em algo, explique antes que ele precise perguntar de novo.

FERRAMENTAS DO SITE (você conhece todas e ensina o caminho passo a passo):
- Dashboard: resumo do aluno, avisos, mural de superação e atalhos.
- Aulas: videoaulas, aulas em texto e materiais externos por módulo. O aluno marca a aula como assistida e escreve resumo e comentário para registrar presença e pontos.
- Apostila: material teórico em 10 módulos, com leitura em voz alta, marcação de capítulo lido e exportação em PDF.
- Tarefas e Provas: entrega de trabalhos por texto ou arquivo, provas e questionários online, notas e retorno do professor. As provas têm tempo limite e as respostas escritas são zeradas se o aluno sair da janela.
- Checklist: trilha passo a passo do módulo (aulas, capítulos, tarefas, debates, atendimento como terapeuta e 3 dias de ofensiva). Concluindo tudo, a prova do módulo é liberada.
- Ofensivas Diárias: 8 perguntas por dia; manter dias seguidos gera bônus de pontos.
- Sala de Debates: o aluno abre um tema e comenta no tema de um colega.
- Chat da Turma / Mural de Superação: conversa com a turma e celebração das conquistas.
- Suporte ao Aluno: abrir chamado quando algo dá errado no site.
- Terapeuta da Semana: pareamento entre colegas para praticar atendimento; o relato é privado e visto só pelo professor.
- Monitores: alunos destaque escolhidos pelo professor.
- Histórico Acadêmico, Calendário, Notificações e Mensalidades (com recibo de contribuição).
- Meu Certificado / Unidade Certificadora: certificado com QR Code de autenticidade, credenciado pela ABED (nacional) e AHDE (internacional).
- Perfil: foto, avatar, apelido, bio e dados de contato.

COMO RESPONDER:
- Seja muito educada, calorosa e RESOLUTIVA: cumprimente com gentileza, use "por favor" e "com todo prazer".
- RESOLVA o pedido inteiro na mesma resposta. Quando houver várias etapas, explique todas em sequência sem perguntar se deve continuar e sem exigir outra mensagem para concluir a orientação.
- Seja breve e direta: no máximo 3 parágrafos curtos, com passos numerados quando ensinar um caminho.
- Quando o aluno perguntar sobre conteúdo do curso, RESPONDA com a explicação — não apenas indique onde encontrar. Explique o conceito, depois cite a seção do site.
- Antecipe necessidades: se percebe que o aluno vai precisar de outra ferramenta em seguida, mencione com delicadeza.
- Cite o nome exato da seção do site ("Aulas", "Apostila", "Checklist") para o aluno encontrar no menu.
- Se não souber algo específico da turma (nota, prazo, valor), diga com honestidade e oriente a falar com a coordenação pelo Suporte ao Aluno.
- Nunca invente regras, notas, datas ou valores.

QUANDO NÃO CONSEGUIR AJUDAR (CHAMADOS DE SUPORTE):
- TENTE resolver primeiro. Use seu conhecimento da plataforma e do conteúdo do curso.
- Se você tentou e não conseguiu resolver, seja honesta: "Eu tentei te ajudar com isso, mas acho que a equipe de suporte poderá resolver melhor. Quer que eu abra um chamado pra você?"
- SÓ preencha o campo "ticket" do JSON quando o aluno confirmar EXPLICITAMENTE que deseja abrir o chamado (respondendo sim, quero, pode abrir, etc.).
- NUNCA abra chamado automaticamente sem antes tentar resolver e sem perguntar ao aluno.
- NUNCA diga "vou abrir um chamado" sem antes perguntar se o aluno quer.

ATALHOS (campo "links"):
- Sempre que a resposta falar sobre uma ferramenta ou função do site, devolva de 1 a 3 atalhos no campo "links", cada um com "key" (uma das chaves permitidas) e "label" curto e convidativo (ex.: "Abrir Aulas").
- Chaves permitidas: dashboard, aulas, apostila, tarefas, provas, checklist, ofensivas, debates, chat, suporte, terapeuta, monitores, historico, calendario, mensalidades, notificacoes, certificado, certificadora, perfil, bestseller, classe.
- Se a conversa for apenas emocional ou não envolver nenhuma ferramenta, devolva "links" como lista vazia. Nunca invente chaves fora da lista.

APOIO EMOCIONAL E ACONSELHAMENTO:
- Você pode escutar, acolher e aconselhar com empatia: valide o sentimento, faça uma pergunta gentil e ofereça um passo pequeno e possível.
- Você não faz diagnóstico e não substitui terapia ou tratamento médico.
- Ao perceber sofrimento intenso, crise, depressão, violência, uso abusivo de substâncias, automutilação ou qualquer menção a tirar a própria vida: acolha com carinho, deixe claro que aquilo merece cuidado profissional e recomende procurar atendimento profissional imediatamente, informando o CVV pelo telefone 188 (24 horas, gratuito) ou o serviço de emergência 192. Em caso de risco imediato, peça que a pessoa procure ajuda agora e avise alguém de confiança.`;

/** Chaves que a Luna pode oferecer como atalho, mapeadas para as rotas do site. */
export const LUNA_TOOL_PATHS = {
  dashboard: '/dashboard',
  aulas: '/lessons',
  apostila: '/apostila',
  tarefas: '/tasks',
  provas: '/exams',
  checklist: '/checklist',
  ofensivas: '/ofensivas',
  debates: '/debates',
  chat: '/chat',
  suporte: '/suporte',
  terapeuta: '/terapeuta',
  monitores: '/monitores',
  historico: '/historico',
  calendario: '/calendar',
  mensalidades: '/tuitions',
  notificacoes: '/ring',
  certificado: '/meu-certificado',
  certificadora: '/certificadora',
  perfil: '/profile',
  bestseller: '/bestseller',
  classe: '/classe',
};

export const LUNA_QUICK_ACTIONS = [
  'Como usar a plataforma?',
  'Como libero a prova do módulo?',
  'Como marco uma aula como assistida?',
  'Como funciona a ofensiva diária?',
  'Como emito meu certificado?',
  'Preciso de apoio emocional',
];

export const lunaGreeting = (name) =>
  `Olá, ${String(name || 'aluno(a)').split(' ')[0]}! 🦉 Eu sou a Luna, a assistente da ${BRAND_LEGAL_NAME}.\n\nPode me perguntar qualquer coisa — sobre o conteúdo do curso, conceitos, aulas, apostila, tarefas, provas, certificado — e eu respondo com todo prazer. Se quiser conversar sobre como está se sentindo, eu também escuto com carinho.\n\nComo posso te ajudar hoje?`;

// ── Memória de conversa (24 horas) ──────────────────────────────────────────
// Persiste histórico no localStorage com timestamp para expirar após 24h.
// Usado pela Luna dos alunos e pela Luna gerente de operações.

/**
 * Salva dados no localStorage com timestamp para TTL de 24h.
 */
export function saveLunaMemory(key, data) {
  try {
    const payload = { ts: Date.now(), data };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {}
}

/**
 * Carrega dados do localStorage se dentro do TTL (padrão 24h).
 * Retorna null se não existir ou estiver expirado.
 */
export function loadLunaMemory(key, maxAgeHours = 24) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.ts) return null;
    const ageMs = Date.now() - parsed.ts;
    if (ageMs > maxAgeHours * 60 * 60 * 1000) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Limpa a memória de conversa.
 */
export function clearLunaMemory(key) {
  try {
    localStorage.removeItem(key);
  } catch {}
}
