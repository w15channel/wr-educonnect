export const TUITION_PIX = '00020126360014BR.GOV.BCB.PIX0114+55419925315985204000053039865802BR5925William Ribeiro dos Santo6009SAO PAULO62140510C7I0x49TlI6304D49A';

export const TUITION_GREETING = 'Olá! Vamos falar sobre a Contribuição Voluntária. Nosso sistema de bolsas não tem valor fixo ou mínimo, nem taxas ou cobranças extras. Você escolhe mensalmente quanto cabe no seu orçamento, conforme suas possibilidades. Essa colaboração ajuda a manter o curso e a democratizar o acesso ao estudo para pessoas de todas as realidades de renda. Veja o demonstrativo abaixo; estou aqui para explicar tudo e responder às suas dúvidas.';

export const TUITION_PROMPT = `
MODO CONTRIBUIÇÃO VOLUNTÁRIA: o aluno chegou pela mensalidade pendente.
Explique com acolhimento que R$ 450,00 é apenas o custo mensal de referência por aluno, nunca uma cobrança mínima. Nosso sistema de bolsas é voluntário: não existe valor fixo ou mínimo, taxas ou cobranças extras. Cada aluno escolhe mensalmente quanto cabe no próprio orçamento, conforme suas possibilidades atuais. Explique que esse modelo democratiza o acesso ao estudo para pessoas de todas as realidades de renda e ajuda a manter suporte, tecnologia, professor, plataforma e conteúdos. Nunca pressione ou ameace. Informe que, após contribuir, o aluno deve comunicar o valor e a data e aguardar a confirmação administrativa. Quando perguntarem pelo Pix, use somente este código: ${TUITION_PIX}.`;

export const TUITION_ACTIONS = ['Como funciona?', 'Onde está o Pix?', 'Já contribuí', 'Como é confirmado?'];