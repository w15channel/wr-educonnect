export const LUNA_SUPPORT_REASONS = ['technical', 'administrative', 'unanswered'];

export function getLunaSupportOffer(response, categories) {
  const offer = response?.support_offer;
  if (!offer || !LUNA_SUPPORT_REASONS.includes(offer.reason)) return null;
  if (['title', 'description', 'explanation'].some(key =>
    typeof offer[key] !== 'string' || !offer[key].trim()
  )) return null;

  return {
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
