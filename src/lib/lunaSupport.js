export const LUNA_SUPPORT_REASONS = ['technical', 'administrative', 'unanswered'];
export const MIN_LUNA_SUPPORT_INTERACTIONS = 10;

/**
 * Conta as tentativas do aluno de solucionar o caso na conversa atual.
 * Uma interação é uma mensagem enviada pelo aluno; respostas da Luna não
 * contam como uma nova tentativa.
 */
export function countLunaStudentInteractions(messages = []) {
  return messages.filter(message => message?.role === 'user' && String(message.content || '').trim()).length;
}

export function getLunaSupportOffer(response, categories, interactionCount = MIN_LUNA_SUPPORT_INTERACTIONS) {
  if (interactionCount < MIN_LUNA_SUPPORT_INTERACTIONS) return null;
  const offer = response?.support_offer;
  if (!offer || !LUNA_SUPPORT_REASONS.includes(offer.reason)) return null;
  if (['title', 'description', 'explanation'].some(key =>
    typeof offer[key] !== 'string' || !offer[key].trim()
  )) return null;

  return {
    reason: offer.reason,
    title: offer.title.trim().slice(0, 80),
    description: offer.description.trim(),
    category: categories.includes(offer.category) ? offer.category : 'Outro assunto',
    explanation: offer.explanation.trim(),
  };
}

export function getLunaSupportDecision(text, pendingOffer) {
  if (!pendingOffer) return null;
  const normalized = String(text || '').trim().toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[.!?,]/g, '').replace(/\s+/g, ' ');
  if (/^(sim|quero|pode abrir|sim pode abrir|quero abrir o chamado|sim quero|abrir chamado|sim abrir chamado)( por favor)?$/.test(normalized)) return 'confirm';
  if (/^(nao|nao obrigado|nao obrigada|agora nao|nao quero|nao quero abrir chamado|continuar conversando|nao continuar conversando)$/.test(normalized)) return 'decline';
  return null;
}
