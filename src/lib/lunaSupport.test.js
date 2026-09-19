import { describe, expect, it } from 'vitest';
import { getLunaSupportOffer, getLunaSupportDecision } from './lunaSupport';

const categories = ['Acesso e login', 'Outro assunto'];
const proposal = {
  reason: 'technical',
  explanation: 'O erro persiste após as orientações.',
  title: 'Falha no acesso',
  description: 'Não consigo entrar mesmo após redefinir a senha.',
  category: 'Acesso e login',
};

describe('propostas de suporte da Luna', () => {
  it.each([
    undefined,
    { answer: 'Olá! Como posso ajudar?' },
    { answer: 'Veja a explicação na apostila.', links: [] },
    { ticket: { title: 'Chamado automático', description: 'Indesejado' } },
    { support_offer: null },
    { support_offer: {} },
  ])('não transforma respostas comuns ou o antigo ticket em proposta: %j', response => {
    expect(getLunaSupportOffer(response, categories)).toBeNull();
  });

  it.each(['technical', 'administrative', 'unanswered'])('aceita proposta completa para %s', reason => {
    expect(getLunaSupportOffer({ support_offer: { ...proposal, reason } }, categories))
      .toEqual({
        reason,
        title: proposal.title,
        description: proposal.description,
        category: proposal.category,
        explanation: proposal.explanation,
      });
  });

  it.each(['greeting', 'emotional', '', null])('rejeita motivo não elegível: %s', reason => {
    expect(getLunaSupportOffer({ support_offer: { ...proposal, reason } }, categories)).toBeNull();
  });

  it.each(['title', 'description', 'explanation'])('exige %s válido', field => {
    for (const value of ['', '  ', null, 42, {}]) {
      expect(getLunaSupportOffer({ support_offer: { ...proposal, [field]: value } }, categories)).toBeNull();
    }
  });

  it('normaliza o resumo e restringe a categoria', () => {
    const offer = getLunaSupportOffer({
      support_offer: { ...proposal, title: ` ${'a'.repeat(100)} `, category: 'inventada' },
    }, categories);
    expect(offer.title).toHaveLength(80);
    expect(offer.category).toBe('Outro assunto');
  });

  it('preserva a proposta validada ao salvar e restaurar a conversa', () => {
    const offer = getLunaSupportOffer({ support_offer: proposal }, categories);
    const restored = JSON.parse(JSON.stringify({ role: 'assistant', support_offer: offer }));
    expect(getLunaSupportOffer(restored, categories)).toEqual(offer);
    expect(getLunaSupportDecision('Sim, abrir chamado', getLunaSupportOffer(restored, categories))).toBe('confirm');
  });
});

describe('resposta à proposta pendente', () => {
  it.each(['sim', 'SIM!', 'Sim, pode abrir.', 'quero', 'Pode abrir, por favor', 'Quero abrir o chamado', 'Sim, abrir chamado'])('reconhece confirmação inequívoca: %s', text => {
    expect(getLunaSupportDecision(text, proposal)).toBe('confirm');
  });

  it.each(['não', 'Não, obrigada!', 'agora não', 'Não quero abrir chamado', 'Não, continuar conversando'])('reconhece recusa: %s', text => {
    expect(getLunaSupportDecision(text, proposal)).toBe('decline');
  });

  it.each(['sim', 'quero', 'pode abrir', 'Sim, abrir chamado'])('não autoriza sem uma proposta pendente: %s', text => {
    expect(getLunaSupportDecision(text, null)).toBeNull();
    expect(getLunaSupportDecision(text)).toBeNull();
  });

  it.each([
    'sim, mas não abra chamado',
    'não quero que abra',
    'pode abrir a apostila?',
    'sim, entendi a explicação',
    'quero saber sobre a prova',
    'talvez',
    'se não funcionar pode abrir',
    'sim, resolvi o problema',
    '',
  ])('não interpreta ambiguidade ou mudança de assunto como autorização: %s', text => {
    expect(getLunaSupportDecision(text, proposal)).toBeNull();
  });
});
