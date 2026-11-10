/**
 * notebookLmPackager.js
 * Utilitário para formatação de fontes ricas e prompts mestres para o Google NotebookLM,
 * cobrindo Podcast (Audio Overview), Roteiro de Videoaula e Estrutura de Slides PowerPoint.
 */

const stripHtml = (html = '') => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Extrai seções ou tópicos principais do texto da aula
 */
function extractKeySections(content = '') {
  const plain = stripHtml(content);
  const lines = plain.split(/\n+/).map(l => l.trim()).filter(Boolean);
  const numberedSections = lines.filter(l => /^[0-9]+[\.\)]\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(l));
  if (numberedSections.length > 0) {
    return numberedSections.slice(0, 8);
  }
  // Fallback: divide em blocos
  return [
    'Conceito Central e Modelo Cognitivo',
    'Análise Funcional e Identificação de Padrões',
    'Intervenções Práticas e Manejo Clínico',
    'Estudos de Caso e Aplicação Terapêutica',
    'Desafios e Recomendações Éticas',
  ];
}

/**
 * Gera a fonte completa estruturada para upload no Google NotebookLM
 */
export function generateStructuredSource(moduleData, lessonData) {
  const title = lessonData?.title || 'Aula sem título';
  const moduleTitle = moduleData?.title || 'Módulo Geral';
  const rawContent = lessonData?.content || '';
  const plainContent = stripHtml(rawContent);
  const sections = extractKeySections(rawContent);

  return `# ${title.toUpperCase()}
Módulo: ${moduleTitle}
Autor: Prof. William Ribeiro | WR-EDU® | Instituto de Desenvolvimento Humano
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## RESUMO E OBJETIVOS DE APRENDIZAGEM
- Compreender a fundamentação teórica e clínica aplicada ao tema.
- Mapear os antecedentes, comportamentos-alvo e consequências funcionais.
- Desenvolver raciocínio clínico para intervenções baseadas em evidências.

## TÓPICOS CENTRAIS ABORDADOS
${sections.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## CONTEÚDO INTEGRAL DA AULA

${plainContent}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PERGUNTAS REFLEXIVAS PARA DISCUSSÃO CLÍNICA
1. Qual é a função primária que mantém o padrão comportamental descrito neste capítulo?
2. Como o terapeuta pode identificar os reforçadores sutis presentes no ambiente do paciente?
3. Quais são as principais armadilhas em que terapeutas iniciantes costumam cair ao aplicar estas técnicas?
4. Que analogia prática pode ser compartilhada em sessão para facilitar a psicoeducação do paciente?
`;
}

/**
 * Gera o Prompt Mestre para o Podcast (Audio Overview) do NotebookLM
 */
export function generatePodcastPrompt(moduleData, lessonData) {
  const title = lessonData?.title || 'Aula';
  const moduleTitle = moduleData?.title || 'Módulo';

  return `Você é o diretor e roteirista de um podcast aprofundado de Psicologia Clínica e Terapia Cognitivo-Comportamental (TCC) para o Instituto WR-EDU.

TEMA: "${title}" (${moduleTitle})
FONTE DE REFERÊNCIA: Utilize exclusivamente os textos, conceitos e termos do material fonte fornecido.

INSTRUÇÕES PARA O AUDIO OVERVIEW (PODCAST DE 10 A 15 MINUTOS):
1. **Personas dos Apresentadores:**
   - Host 1 (Especialista em Fundamentos Clínicos): Didático, acolhedor, apaixonado por análise funcional e história de aprendizagem. Faz perguntas provocativas e traz metáforas vívidas do cotidiano.
   - Host 2 (Terapeuta Sênior de Campo): Traz a vivência do consultório, relata dilemas reais de pacientes, aponta sutilezas comportamentais e conecta a teoria diretamente à prática clínica.

2. **Tom e Linguagem:**
   - Português brasileiro natural, fluido, inteligente e acolhedor (evite jargões mecânicos; privilegie clareza conceitual com calor humano).
   - Conversa orgânica: concordâncias, pequenos risos acolhedores, momentos de surpresa e reflexões sinceras.

3. **Estrutura da Conversa:**
   - **Abertura (0:00 - 1:30):** Comece com um gancho instigante do capítulo (ex.: uma fala típica de paciente ou uma situação desafiadora de consultório).
   - **Desconstrução Teórica (1:30 - 6:00):** Expliquem o cerne do tema (${title}), destacando a função oculta dos comportamentos e por que as pessoas repetem padrões de sofrimento.
   - **Manejo Clínico e Caso Prático (6:00 - 10:00):** Demonstrem como o terapeuta atua na prática para ajudar o paciente a enxergar suas próprias contingências.
   - **Conclusão Inspiradora (10:00 - 12:00):** Uma síntese acolhedora reforçando a importância do olhar empático e técnico do terapeuta em formação.`;
}

/**
 * Gera o Roteiro Pedagógico de Videoaula
 */
export function generateVideoLessonScript(moduleData, lessonData) {
  const title = lessonData?.title || 'Aula';
  const moduleTitle = moduleData?.title || 'Módulo';
  const sections = extractKeySections(lessonData?.content || '');

  return `# ROTEIRO DE GRAVAÇÃO DE VIDEOAULA
Tema: ${title}
Módulo: ${moduleTitle}
Apresentador: Prof. William Ribeiro
Duração Sugerida: 25 a 35 minutos
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## [BLOCO 0: GANCHO INICIAL - 00:00 às 02:00]
- **Enquadramento:** Plano médio, postura acolhedora e confiante.
- **Frase de Impacto:** "Quantas vezes você já atendeu alguém que desejava mudar desesperadamente, mas continuava fazendo exatamente a mesma coisa? Hoje você vai entender a engrenagem oculta por trás disso."
- **Objetivo da Aula:** Apresentar a lente funcional de ${title}.

## [BLOCO 1: FUNDAMENTAÇÃO E CONCEITO - 02:00 às 10:00]
- **Tópico Central:** ${sections[0] || 'Conceito Central'}
- **Visual:** Apresentação de diagrama com Antecedente -> Comportamento -> Consequência.
- **Explicação:** Desmistificar o conceito teórico, traduzindo para a linguagem viva do consultório.

## [BLOCO 2: ANÁLISE CLÍNICA E DEMONSTRAÇÃO - 10:00 às 20:00]
- **Tópico Central:** ${sections[1] || 'Manejo Clínico'}
- **Estudo de Caso:** Apresentar a história de um paciente emblemático.
- **Diálogo Socrático:** Exemplificar as perguntas exatas que o terapeuta deve fazer na sessão.

## [BLOCO 3: ARMADILHAS COMUNS E COMO EVITAR - 20:00 às 28:00]
- **Tópico Central:** ${sections[2] || 'Armadilhas e Soluções'}
- O que nunca fazer diante dessa queixa.
- Como manter a aliança terapêutica sólida mesmo em momentos de resistência.

## [BLOCO 4: DESAFIO PRÁTICO E ENCERRAMENTO - 28:00 às 30:00]
- **Tarefa para o Aluno:** Mapear um caso próprio ou formular uma hipótese clínica com base na aula.
- **Chamada:** "Nos vemos na próxima aula. Pratique com consciência e acolhimento."`;
}

/**
 * Gera a Estrutura de Slides (PowerPoint)
 */
export function generateSlideDeckOutline(moduleData, lessonData) {
  const title = lessonData?.title || 'Aula';
  const moduleTitle = moduleData?.title || 'Módulo';
  const sections = extractKeySections(lessonData?.content || '');

  return `# ESTRUTURA DE SLIDES DE APRESENTAÇÃO (POWERPOINT / GOOGLE SLIDES)
Tema: ${title}
Módulo: ${moduleTitle}
Total de Slides: 10
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### SLIDE 1: Capa Oficial
- **Título:** ${title}
- **Subtítulo:** ${moduleTitle} | Formação em Terapia Cognitivo-Comportamental
- **Assinatura:** Prof. William Ribeiro | WR-EDU® Instituto de Desenvolvimento Humano
- *Notas do Orador:* Boas-vindas calorosas e alinhamento do propósito do encontro.

### SLIDE 2: O Desafio Clínico
- **Título:** Por Que Este Tema Importa na Prática?
- **Bullets:**
  • O sofrimento real que chega até o consultório
  • A diferença entre o sintoma aparente e a função subjacente
  • O papel do terapeuta como investigador compassivo
- *Notas do Orador:* Conectar com a vivência prática dos alunos terapeutas.

### SLIDE 3: O Mapa Conceitual
- **Título:** Pilares de ${title.replace(/^Aula\s+\d+\s*[-—]\s*/i, '')}
- **Bullets:**
  • Definição rigorosa e operacional
  • Como se manifesta em pensamentos, emoções e fisiologia
  • Relação direta com crenças nucleares e esquemas
- *Notas do Orador:* Enfatizar que técnica sem entendimento conceitual vira protocolo vazio.

### SLIDE 4: Análise Funcional Aplicada
- **Título:** O Modelo A-B-C do Comportamento
- **Bullets:**
  • **A (Antecedentes):** Gatilhos ambientais e internos
  • **B (Comportamentos):** Ações abertas e encobertas
  • **C (Consequências):** Ganhos de curto prazo vs. custos de longo prazo
- *Notas do Orador:* Detalhar a armadilha do reforçamento a curto prazo.

### SLIDE 5: Estudo de Caso Clínico
- **Título:** Da Queixa à Formulação
- **Bullets:**
  • Apresentação do caso representativo
  • Identificação das distorções cognitivas predominantes
  • O momento da virada na sessão
- *Notas do Orador:* Narrar o caso com emoção e precisão técnica.

### SLIDE 6: Ferramentas e Intervenções
- **Título:** Técnicas de Intervenção em Sessão
- **Bullets:**
  • Questionamento Socrático e Descoberta Guiada
  • Experimentos Comportamentais
  • Registro de Pensamentos Disfuncionais adaptado
- *Notas do Orador:* Dicas de como formular perguntas abertas e não julgadoras.

### SLIDE 7: Dificuldades no Manejo
- **Título:** O Que Fazer Quando o Paciente Resiste?
- **Bullets:**
  • Validação emocional antes de qualquer reestruturação
  • Identificação de ganhos secundários da esquiva
  • Recontratação de metas colaborativas
- *Notas do Orador:* A resistência quase sempre é sinal de que o terapeuta acelerou demais.

### SLIDE 8: Exercícios e Prescrição Terapêutica
- **Título:** Construindo a Ponte Para a Vida Real
- **Bullets:**
  • Como prescrever tarefas de casa alcançáveis
  • Prevenção de recaídas em momentos de estresse
  • Automonitoramento com métricas simples
- *Notas do Orador:* Uma boa tarefa de casa é aquela que o paciente sai da sessão animado para testar.

### SLIDE 9: Resumo Executivo
- **Título:** As 3 Grandes Lições Desta Aula
- **Bullets:**
  • 1. Todo comportamento tem uma função protetiva ou adaptativa.
  • 2. A intervenção eficaz modifica as contingências, não apenas os sintomas.
  • 3. O vínculo terapêutico é o solo fértil de toda mudança duradoura.

### SLIDE 10: Fechamento e Próximos Passos
- **Título:** Próxima Aula & Material Complementar
- **Bullets:**
  • Ouça o Podcast Oficial do Capítulo na sua Apostila
  • Baixe o Roteiro de Apoio e a Ficha Clínica
  • WR-EDU® | Transformando Conhecimento em Cuidado Real
- *Notas do Orador:* Agradecimento caloroso e incentivo para a continuidade dos estudos.`;
}
