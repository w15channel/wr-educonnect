export const TUITION_PIX = '00020126360014BR.GOV.BCB.PIX0114+55419925315985204000053039865802BR5925William Ribeiro dos Santo6009SAO PAULO62140510C7I0x49TlI6304D49A';

export const TUITION_GREETING = 'Olá! Vamos conversar sobre a Contribuição Voluntária. Nosso curso tem custos mensais reais — tecnologia, plataforma, professor, suporte e produção de conteúdo. O demonstrativo ao lado mostra que o custo de referência é R$ 450 por aluno. Mas a nossa proposta é diferente de uma mensalidade comum: você tem liberdade total para escolher quanto pode colaborar este mês, conforme suas possibilidades. Não existe valor mínimo, nem taxas, nem cobranças. A pergunta é simples e sincera: hoje, com quanto você poderia colaborar? Não é sobre o valor da nota — é sobre participar e sustentar juntos o espaço de aprendizado que construímos. Mesmo uma contribuição pequena faz diferença e demonstra seu comprometimento com a turma. Estou aqui para esclarecer qualquer dúvida.';

export const TUITION_PROMPT = `
MODO CONTRIBUIÇÃO VOLUNTÁRIA: o aluno chegou pela mensalidade pendente.
Explique com acolhimento e transparência que o curso tem custos mensais reais (tecnologia, plataforma, professor, suporte e produção de conteúdo). R$ 450,00 é o custo de referência por aluno, mostrado no demonstrativo — nunca uma cobrança mínima obrigatória.
Nossa proposta é de autonomia e liberdade: não existe valor fixo, mínimo, máximo, taxas ou cobranças extras. Cada aluno escolhe mensalmente quanto pode colaborar conforme suas possibilidades atuais.
FAÇA A PERGUNTA DIRETA: "Hoje, com quanto você poderia colaborar?" — incentive o aluno a refletir e propor um valor com sinceridade, sem pressão.
Deixe claro que o que importa é a participação sincera na comunidade, não o valor numérico. Mesmo uma contribuição pequena faz diferença e demonstra comprometimento.
NUNCA pressione, ameace ou faça o aluno sentir vergonha. Também não minimize a importância da contribuição — seja equilibrado: mostre que o curso depende da colaboração de todos para seguir existindo, e que cada um faz a sua parte conforme pode.
Explique que após contribuir, o aluno deve comunicar o valor e a data e aguardar a confirmação administrativa. Quando perguntarem pelo Pix, use somente este código: ${TUITION_PIX}.`;

export const TUITION_ACTIONS = ['Como funciona?', 'Por que contribuir?', 'Onde está o Pix?', 'Já contribuí', 'Como é confirmado?'];