// Auto-generated knowledge bank from apostila content.
// Used by the ofensiva generator to create theme-exclusive questions.

export type TechniqueDetail = { label: string; detail: string };
export type FocusPoint = { concept: string; point: string };
export type LessonKnowledge = {
  id: string;
  title: string;
  theme: string;
  moduleTitle: string;
  concepts: string[];
  techniques: string[];
  techniqueDetails: TechniqueDetail[];
  insights: string[];
  focuses: FocusPoint[];
};
export type ModuleKnowledge = {
  id: string;
  title: string;
  lessons: LessonKnowledge[];
};

export const LESSON_KNOWLEDGE: ModuleKnowledge[] = [
  {
    "id": "mod1",
    "title": "Módulo 1 — Fundamentos da Terapia Comportamental",
    "lessons": [
      {
        "id": "mod1-a1",
        "title": "Aula 1 — Introdução à Terapia Comportamental: o Olhar que Transforma Vidas",
        "theme": "Introdução à Terapia Comportamental: o Olhar que Transforma Vidas",
        "moduleTitle": "Módulo 1 — Fundamentos da Terapia Comportamental",
        "concepts": [
          "Bem — Vindo ao Início de uma Nova Forma de Enxergar o Ser Humano",
          "O Que É Terapia Comportamental de Verdade",
          "A Primeira Curiosidade Que Encanta: Todo Comportamento Conta uma História",
          "Os Conceitos Que Você Vai Levar para a Vida",
          "Por Que Essa Formação Pode Mudar Você Também, Senso de Pertencimento",
          "Hora de Colocar em Prática e Iniciar Sua Jornada"
        ],
        "techniques": [],
        "techniqueDetails": [],
        "insights": [
          "Bem‑vindo ao ponto de partida de uma nova maneira de enxergar o ser humano.",
          "Antes de mergulhar em técnicas, protocolos ou perguntas clínicas, você receberá algo mais profundo: uma lente que transforma a percepção.",
          "A terapia comportamental parte de uma pergunta simples, porém poderosa: “O que faz esse comportamento continuar existindo?”.",
          "Essa indagação substitui o julgamento por curiosidade funcional, direcionando a atenção para as contingências que mantêm o padrão.",
          "Para que a prática clínica seja coerente e eficaz, é imprescindível dominar alguns conceitos‑chave que constituem a linguagem da Terapia Comportamental.",
          "Esses termos funcionam como alicerces de raciocínio: ao usá‑los, o profissional transforma uma narrativa subjetiva em descrição observável, mensurável e, sobretudo, intervenível.",
          "Quem estuda comportamento humano com seriedade não aprende apenas sobre pacientes; aprende sobre si mesmo.",
          "Essa descoberta não deve assustar, mas entusiasmar, pois todo terapeuta mais consciente se torna também uma pessoa mais responsável com a própria presença no mundo.",
          "Há diferença entre assistir a uma aula e participar de uma formação.",
          "Assistir equivale a consumir conteúdo; participar significa deixar que o conteúdo organize sua postura, sua linguagem e sua prática.",
          "Iniciar a prática do olhar clínico não requer horas de teoria avançada; começa com um pequeno exercício de atenção plena ao comportamento ao seu redor.",
          "Ao observar alguém reagindo a um evento cotidiano, segure a curiosidade e evite julgamentos."
        ],
        "focuses": [
          {
            "concept": "Bem — Vindo ao Início de uma Nova Forma de Enxergar o Ser Humano",
            "point": "Bem‑vindo ao ponto de partida de uma nova maneira de enxergar o ser humano."
          },
          {
            "concept": "O Que É Terapia Comportamental de Verdade",
            "point": "A terapia comportamental parte de uma pergunta simples, porém poderosa: “O que faz esse comportamento continuar existindo?”."
          },
          {
            "concept": "A Primeira Curiosidade Que Encanta: Todo Comportamento Conta uma História",
            "point": "Para que a prática clínica seja coerente e eficaz, é imprescindível dominar alguns conceitos‑chave que constituem a linguagem da Terapia Comportamental."
          },
          {
            "concept": "Os Conceitos Que Você Vai Levar para a Vida",
            "point": "Quem estuda comportamento humano com seriedade não aprende apenas sobre pacientes; aprende sobre si mesmo."
          },
          {
            "concept": "Por Que Essa Formação Pode Mudar Você Também, Senso de Pertencimento",
            "point": "Há diferença entre assistir a uma aula e participar de uma formação."
          },
          {
            "concept": "Hora de Colocar em Prática e Iniciar Sua Jornada",
            "point": "Iniciar a prática do olhar clínico não requer horas de teoria avançada; começa com um pequeno exercício de atenção plena ao comportamento ao seu redor."
          }
        ]
      },
      {
        "id": "mod1-a2",
        "title": "Aula 2 — Autoimagem e Motivação para Ser Terapeuta",
        "theme": "Autoimagem e Motivação para Ser Terapeuta",
        "moduleTitle": "Módulo 1 — Fundamentos da Terapia Comportamental",
        "concepts": [
          "A Consciência do Próprio Instrumento",
          "A Motivação Que Sustenta a Escuta",
          "A Independência da Aprovação Como Alicerce",
          "A Prática Reflexiva Como Manutenção do Instrumento",
          "A Autenticidade Como Presença Terapêutica",
          "A Manutenção da Vida Própria Como Parte da Clínica"
        ],
        "techniques": [],
        "techniqueDetails": [],
        "insights": [
          "A autoimagem do terapeuta é o filtro que atua antes de qualquer intervenção, definindo a qualidade do espaço oferecido ao paciente.",
          "Quando não há clareza sobre a própria identidade profissional, o risco de projetar necessidades pessoais se multiplica de forma silenciosa.",
          "A decisão de ser terapeuta quase nunca é neutra; ela carrega uma história pessoal que, se não for conhecida, pode direcionar a escuta de forma enviesada.",
          "Muitos profissionais aprenderam cedo a cuidar dos outros, a ler emoções alheias ou a sobreviver em ambientes onde a sensibilidade era proteção.",
          "Depender da aprovação do paciente para sentir-se competente é uma armadilha que compromete a direção clínica desde os primeiros encontros.",
          "O terapeuta que precisa ser visto como bom evita confrontos necessários, adia o fim de processos e cede à tentação de concordar com narrativas distorcidas.",
          "A autoimagem profissional não se conserta em um único evento ou curso; ela se mantém através de uma prática reflexiva contínua.",
          "Reservar alguns minutos após cada sessão para registrar o que foi sentido e quais gatilhos foram ativados é um hábito simples e transformador.",
          "A presença autêntica do terapeuta é o fator que mais impacta a profundidade do vínculo, mesmo antes de qualquer técnica.",
          "Quando o profissional está em paz com sua história, o paciente sente um espaço seguro onde pode explorar suas sombras sem medo.",
          "O terapeuta que só existe enquanto cuidador perde progressivamente a si mesmo e, paradoxalmente, sua capacidade de cuidar.",
          "Manter interesses, relações e prazeres fora do consultório não é luxo, mas necessidade clínica."
        ],
        "focuses": [
          {
            "concept": "A Consciência do Próprio Instrumento",
            "point": "A autoimagem do terapeuta é o filtro que atua antes de qualquer intervenção, definindo a qualidade do espaço oferecido ao paciente."
          },
          {
            "concept": "A Motivação Que Sustenta a Escuta",
            "point": "A decisão de ser terapeuta quase nunca é neutra; ela carrega uma história pessoal que, se não for conhecida, pode direcionar a escuta de forma enviesada."
          },
          {
            "concept": "A Independência da Aprovação Como Alicerce",
            "point": "Depender da aprovação do paciente para sentir-se competente é uma armadilha que compromete a direção clínica desde os primeiros encontros."
          },
          {
            "concept": "A Prática Reflexiva Como Manutenção do Instrumento",
            "point": "A autoimagem profissional não se conserta em um único evento ou curso; ela se mantém através de uma prática reflexiva contínua."
          },
          {
            "concept": "A Autenticidade Como Presença Terapêutica",
            "point": "A presença autêntica do terapeuta é o fator que mais impacta a profundidade do vínculo, mesmo antes de qualquer técnica."
          },
          {
            "concept": "A Manutenção da Vida Própria Como Parte da Clínica",
            "point": "O terapeuta que só existe enquanto cuidador perde progressivamente a si mesmo e, paradoxalmente, sua capacidade de cuidar."
          }
        ]
      },
      {
        "id": "mod1-a3",
        "title": "Aula 3 — Modelo Cognitivo: Pensamentos, Emoções e Comportamento no Consultório",
        "theme": "Modelo Cognitivo: Pensamentos, Emoções e Comportamento no Consultório",
        "moduleTitle": "Módulo 1 — Fundamentos da Terapia Comportamental",
        "concepts": [
          "O Ciclo Que Mantém o Sofrimento",
          "A Arte de Rastrear Pensamentos Automáticos",
          "A Emoção Como Sinal, Não Como Problema",
          "A Neuroplasticidade Como Aliada da Mudança",
          "O Comportamento Como Resposta ao Campo Percebido",
          "Aplicando o Modelo em Três Movimentos Essenciais"
        ],
        "techniques": [],
        "techniqueDetails": [],
        "insights": [
          "O modelo cognitivo revela que pensamentos, emoções e comportamentos não são eventos isolados, mas engrenagens de um ciclo que pode aprisionar ou libertar.",
          "Um pensamento automático negativo gera uma emoção dolorosa, que impulsiona um comportamento de esquiva ou ataque, que confirma a crença original e fecha o ciclo.",
          "O pensamento automático raramente se apresenta com nitidez; ele é rápido, esquivo e frequentemente mascarado por justificativas racionais.",
          "O paciente diz “simplesmente fiquei mal” ou “não sei por que reagi assim”.",
          "Um equívoco comum na prática inicial é tratar a emoção como um incômodo a ser eliminado.",
          "Cada estado emocional carrega uma mensagem sobre o sistema de crenças do paciente.",
          "A descoberta da neuroplasticidade oferece ao terapeuta um argumento poderoso baseado em evidências.",
          "Cada nova interpretação repetida fortalece circuitos neurais que substituem padrões disfuncionais.",
          "Todo comportamento, por mais disfuncional que pareça, é uma tentativa de adaptação ao campo percebido pelo paciente.",
          "A pessoa que evita situações sociais não é preguiçosa; ela responde a um mundo onde a exposição é humilhação.",
          "A aplicação prática do modelo cognitivo pode ser resumida em três movimentos: identificar o comportamento-problema, rastrear a emoção associada e encontrar o pensamento gerador.",
          "O primeiro movimento é descritivo e usa as palavras do paciente."
        ],
        "focuses": [
          {
            "concept": "O Ciclo Que Mantém o Sofrimento",
            "point": "O modelo cognitivo revela que pensamentos, emoções e comportamentos não são eventos isolados, mas engrenagens de um ciclo que pode aprisionar ou libertar."
          },
          {
            "concept": "A Arte de Rastrear Pensamentos Automáticos",
            "point": "O pensamento automático raramente se apresenta com nitidez; ele é rápido, esquivo e frequentemente mascarado por justificativas racionais."
          },
          {
            "concept": "A Emoção Como Sinal, Não Como Problema",
            "point": "Um equívoco comum na prática inicial é tratar a emoção como um incômodo a ser eliminado."
          },
          {
            "concept": "A Neuroplasticidade Como Aliada da Mudança",
            "point": "A descoberta da neuroplasticidade oferece ao terapeuta um argumento poderoso baseado em evidências."
          },
          {
            "concept": "O Comportamento Como Resposta ao Campo Percebido",
            "point": "Todo comportamento, por mais disfuncional que pareça, é uma tentativa de adaptação ao campo percebido pelo paciente."
          },
          {
            "concept": "Aplicando o Modelo em Três Movimentos Essenciais",
            "point": "A aplicação prática do modelo cognitivo pode ser resumida em três movimentos: identificar o comportamento-problema, rastrear a emoção associada e encontrar o pensamento gerador."
          }
        ]
      },
      {
        "id": "mod1-a4",
        "title": "Aula 4 — O Domínio do Self e as Características Exclusivas do Paciente",
        "theme": "O Domínio do Self e as Características Exclusivas do Paciente",
        "moduleTitle": "Módulo 1 — Fundamentos da Terapia Comportamental",
        "concepts": [
          "O Self Como Núcleo Inegociável",
          "As Pequenas Manias Como Fronteiras do Eu",
          "A Lição do Alzheimer Sobre a Dissolução do Self",
          "A Insubstituibilidade Como Fonte de Sentido",
          "Mapeando o Self em Sessão",
          "O Terapeuta Como Testemunha do Retorno a Si Mesmo"
        ],
        "techniques": [
          "Frankl é diferente",
          "Uma voz que diz"
        ],
        "techniqueDetails": [
          {
            "label": "Frankl é diferente",
            "detail": "o valor está em ser diferente"
          },
          {
            "label": "Uma voz que diz",
            "detail": "Você é valioso do jeito que é"
          }
        ],
        "insights": [
          "O self não é uma abstração filosófica, mas o conjunto de características que tornam uma pessoa insubstituível: valores, manias, jeitos de amar e se indignar.",
          "Quando essas singularidades se apagam por pressão do ambiente ou adaptação excessiva, surge um vazio que não se explica só por sintomas depressivos.",
          "O que chamamos de manias são, na verdade, as fronteiras visíveis do self.",
          "O jeito de dobrar a roupa, a necessidade de silêncio, os rituais matinais são pontos onde a pessoa declara “até aqui posso ceder”.",
          "Nas fases avançadas do Alzheimer, desaparecem não apenas memórias, mas preferências e reações que tornavam a pessoa única.",
          "A família diz “ele não é mais ele”, frase que encapsula uma verdade clínica profunda.",
          "Frankl demonstrou que o sentido da vida se ancora no que nos torna insubstituíveis.",
          "Ninguém viveu as mesmas experiências ou ama exatamente da mesma forma.",
          "Antes de reestruturar crenças ou trabalhar autoestima, é essencial mapear o que restou do self genuíno.",
          "Perguntas como “cite três coisas que te definem e das quais não abriria mão” acessam o núcleo identitário.",
          "O papel mais nobre do terapeuta, em muitos momentos, não é interpretar, mas testemunhar.",
          "Testemunhar o paciente reconhecer que tinha preferências, que sentia raiva legítima, que amava algo abandonado."
        ],
        "focuses": [
          {
            "concept": "O Self Como Núcleo Inegociável",
            "point": "O self não é uma abstração filosófica, mas o conjunto de características que tornam uma pessoa insubstituível: valores, manias, jeitos de amar e se indignar."
          },
          {
            "concept": "As Pequenas Manias Como Fronteiras do Eu",
            "point": "O que chamamos de manias são, na verdade, as fronteiras visíveis do self."
          },
          {
            "concept": "A Lição do Alzheimer Sobre a Dissolução do Self",
            "point": "Nas fases avançadas do Alzheimer, desaparecem não apenas memórias, mas preferências e reações que tornavam a pessoa única."
          },
          {
            "concept": "A Insubstituibilidade Como Fonte de Sentido",
            "point": "Frankl demonstrou que o sentido da vida se ancora no que nos torna insubstituíveis."
          },
          {
            "concept": "Mapeando o Self em Sessão",
            "point": "Antes de reestruturar crenças ou trabalhar autoestima, é essencial mapear o que restou do self genuíno."
          },
          {
            "concept": "O Terapeuta Como Testemunha do Retorno a Si Mesmo",
            "point": "O papel mais nobre do terapeuta, em muitos momentos, não é interpretar, mas testemunhar."
          }
        ]
      },
      {
        "id": "mod1-a5",
        "title": "Aula 5 — Lendo o Paciente no Campo: Os Primeiros 15 Minutos de Sessão",
        "theme": "Lendo o Paciente no Campo: Os Primeiros 15 Minutos de Sessão",
        "moduleTitle": "Módulo 1 — Fundamentos da Terapia Comportamental",
        "concepts": [
          "A Sessão Começa no Primeiro Olhar",
          "As Três Perguntas Que Abrem o Mapa",
          "O Silêncio e as Ausências no Discurso",
          "A Formulação da Hipótese Inicial",
          "Testando a Hipótese com uma Intervenção Sutil",
          "Encerrando os Primeiros Minutos com uma Direção Clara"
        ],
        "techniques": [],
        "techniqueDetails": [],
        "insights": [
          "O campo terapêutico se estabelece antes da primeira palavra, no instante em que o paciente cruza a porta e o terapeuta capta uma onda de informações não verbais que orientarão a postura e o tom de voz mais adequados para aquele encontro.",
          "A forma de entrar, o modo de ocupar o espaço, a direção do olhar e o tipo de cumprimento são dados que revelam padrões de vinculação, níveis de ansiedade e expectativas implícitas que o discurso verbal pode demorar a revelar.",
          "A segunda pergunta avalia a capacidade de acessar e nomear estados emocionais, competência que falta em muitos pacientes porque ninguém os ensinou a olhar para dentro.",
          "A ordem também importa: começar pelo motivo manifesto acolhe a queixa imediata, aprofundar a experiência interna em seguida e alinhar expectativas ao final cria uma condução suave.",
          "O terapeuta experiente anota mentalmente esses pontos de fuga e os guarda como sinalizadores para o futuro.",
          "Algumas pessoas nessa situação sentiriam raiva.",
          "Esse paciente tende a controlar tudo ao redor para evitar a imprevisibilidade?",
          "Ele se anula sistematicamente para manter os vínculos a qualquer custo?",
          "Ainda na primeira sessão é possível testar a hipótese clínica com uma pequena intervenção que vá na contramão do padrão suspeitado, oferecendo ao paciente uma experiência diferente daquela que seu script interno espera.",
          "Para um paciente que parece hipercontrolador, uma pergunta completamente aberta sobre seus sentimentos pode revelar o desconforto intenso diante do que não pode ser controlado ou previsto.",
          "Essas respostas não precisam ser definitivas, mas sua simples formulação já orienta toda a condução posterior e impede que o terapeuta navegue sem rumo.",
          "Essa devolutiva não precisa ser uma interpretação profunda ou uma revelação bombástica, mas uma síntese que valida a experiência do paciente, mostra que o terapeuta estava realmente ouvindo com atenção plena e abre espaço para correções."
        ],
        "focuses": [
          {
            "concept": "A Sessão Começa no Primeiro Olhar",
            "point": "O campo terapêutico se estabelece antes da primeira palavra, no instante em que o paciente cruza a porta e o terapeuta capta uma onda de informações não verbais que orientarão a postura e o tom de voz mais adequados para aquele encontro."
          },
          {
            "concept": "As Três Perguntas Que Abrem o Mapa",
            "point": "A segunda pergunta avalia a capacidade de acessar e nomear estados emocionais, competência que falta em muitos pacientes porque ninguém os ensinou a olhar para dentro."
          },
          {
            "concept": "O Silêncio e as Ausências no Discurso",
            "point": "O terapeuta experiente anota mentalmente esses pontos de fuga e os guarda como sinalizadores para o futuro."
          },
          {
            "concept": "A Formulação da Hipótese Inicial",
            "point": "Esse paciente tende a controlar tudo ao redor para evitar a imprevisibilidade?"
          },
          {
            "concept": "Testando a Hipótese com uma Intervenção Sutil",
            "point": "Ainda na primeira sessão é possível testar a hipótese clínica com uma pequena intervenção que vá na contramão do padrão suspeitado, oferecendo ao paciente uma experiência diferente daquela que seu script interno espera."
          },
          {
            "concept": "Encerrando os Primeiros Minutos com uma Direção Clara",
            "point": "Essas respostas não precisam ser definitivas, mas sua simples formulação já orienta toda a condução posterior e impede que o terapeuta navegue sem rumo."
          }
        ]
      }
    ]
  },
  {
    "id": "mod2",
    "title": "Módulo 2 — O Terapeuta em Ação",
    "lessons": [
      {
        "id": "mod2-a1",
        "title": "Aula 1 — Escuta Ativa: O Que Fazer Quando o Silêncio é Resistência",
        "theme": "Escuta Ativa: O Que Fazer Quando o Silêncio é Resistência",
        "moduleTitle": "Módulo 2 — O Terapeuta em Ação",
        "concepts": [
          "Escutar É uma Habilidade — Não um Dom Natural",
          "Os Tipos de Silêncio e o Que Cada um Pede",
          "Ferramentas Concretas de Escuta Ativa",
          "Quando o Paciente Fala Muito sem Dizer Nada",
          "A Presença do Terapeuta Como Campo",
          "Exercício Prático para Desenvolver a Escuta"
        ],
        "techniques": [
          "Silêncio de processamento",
          "Silêncio de resistência",
          "Silêncio de vergonha",
          "Reflexo emocional",
          "Escuta do corpo"
        ],
        "techniqueDetails": [
          {
            "label": "Silêncio de processamento",
            "detail": "o paciente está pensando — não preencha, aguarde"
          },
          {
            "label": "Silêncio de resistência",
            "detail": "ele trava porque o assunto ameaça algo — nomeie com suavidade:"
          },
          {
            "label": "Silêncio de vergonha",
            "detail": "ele para porque sente que irá se expor demais — valide antes de continuar"
          },
          {
            "label": "Reflexo emocional",
            "detail": "nomeie a emoção que percebe ("
          },
          {
            "label": "Escuta do corpo",
            "detail": "observe tensão nos ombros, respiração presa, postura fechada — o corpo conta o que as palavras evitam"
          }
        ],
        "insights": [
          "Ficar quieto enquanto o paciente fala é o ponto de partida, não a chegada.",
          "Escuta ativa é uma postura intencional: você ouve o que é dito, o que não é dito, o que o corpo comunica e o que o silêncio carrega.",
          "Silêncio de processamento: o paciente está pensando — não preencha, aguarde.",
          "Silêncio de resistência: ele trava porque o assunto ameaça algo — nomeie com suavidade: \"Percebo que ficou mais difícil falar aqui.\" Silêncio de vergonha: ele para porque sente que irá se expor demais — valide antes de continuar.",
          "Parafraseamento: devolva o que o paciente disse com suas próprias palavras — isso mostra que você realmente ouviu.",
          "Reflexo emocional: nomeie a emoção que percebe (\"você fala disso com raiva\").",
          "O paciente que fala de forma circular e acelerada está, em geral, evitando o ponto real.",
          "Não interrompa para fazer perguntas — observe o padrão.",
          "Lewin nos ensinou que o estado interno do terapeuta não é neutro — ele é parte da sessão.",
          "Um terapeuta ansioso produz um campo ansioso.",
          "Antes de cada sessão, reserve 2 minutos: sente, respire, esvazie a agenda mental.",
          "Durante a sessão, conte mentalmente até 5 antes de responder qualquer coisa."
        ],
        "focuses": [
          {
            "concept": "Escutar É uma Habilidade — Não um Dom Natural",
            "point": "Ficar quieto enquanto o paciente fala é o ponto de partida, não a chegada."
          },
          {
            "concept": "Os Tipos de Silêncio e o Que Cada um Pede",
            "point": "Silêncio de processamento: o paciente está pensando — não preencha, aguarde."
          },
          {
            "concept": "Ferramentas Concretas de Escuta Ativa",
            "point": "Parafraseamento: devolva o que o paciente disse com suas próprias palavras — isso mostra que você realmente ouviu."
          },
          {
            "concept": "Quando o Paciente Fala Muito sem Dizer Nada",
            "point": "O paciente que fala de forma circular e acelerada está, em geral, evitando o ponto real."
          },
          {
            "concept": "A Presença do Terapeuta Como Campo",
            "point": "Lewin nos ensinou que o estado interno do terapeuta não é neutro — ele é parte da sessão."
          },
          {
            "concept": "Exercício Prático para Desenvolver a Escuta",
            "point": "Antes de cada sessão, reserve 2 minutos: sente, respire, esvazie a agenda mental."
          }
        ]
      },
      {
        "id": "mod2-a2",
        "title": "Aula 2 — Gestão da Sua Própria Ansiedade Frente ao Paciente",
        "theme": "Gestão da Sua Própria Ansiedade Frente ao Paciente",
        "moduleTitle": "Módulo 2 — O Terapeuta em Ação",
        "concepts": [
          "A Ansiedade do Terapeuta É Parte da Sessão",
          "De Onde Vem a Ansiedade do Terapeuta — na Prática",
          "Sinais de Que Você Está Ansioso em Sessão",
          "Como Se Regular Durante a Sessão sem Que o Paciente Note",
          "Contratransferência: o Que o Seu Desconforto Está Dizendo",
          "Supervisão É Regulação Estrutural — Não É Opcional"
        ],
        "techniques": [
          "Medo de errar",
          "Ressonância com o conteúdo",
          "Pacientes desafiadores",
          "Âncora corporal",
          "Respiração discreta",
          "Postura de abertura",
          "Frankl diria"
        ],
        "techniqueDetails": [
          {
            "label": "Medo de errar",
            "detail": "pressão interna por ter sempre a resposta certa"
          },
          {
            "label": "Ressonância com o conteúdo",
            "detail": "o material do paciente ativa algo da sua própria história"
          },
          {
            "label": "Pacientes desafiadores",
            "detail": "transferências intensas, comportamentos imprevisíveis, ameaças ao vínculo"
          },
          {
            "label": "Âncora corporal",
            "detail": "coloque os dois pés no chão e sinta o peso da cadeira — isso ativa o sistema nervoso parassimpático em segundos"
          },
          {
            "label": "Respiração discreta",
            "detail": "inspire lentamente pelo nariz, expire com calma"
          },
          {
            "label": "Postura de abertura",
            "detail": "ombros relaxados, levemente inclinado para frente"
          },
          {
            "label": "Frankl diria",
            "detail": "sem autoconhecimento, o terapeuta atende a si mesmo através do paciente — e isso é o contrário da cura"
          }
        ],
        "insights": [
          "O campo do terapeuta influencia o campo do paciente — sempre.",
          "Um terapeuta ansioso produz um campo ansioso sem dizer uma palavra.",
          "Medo de errar: pressão interna por ter sempre a resposta certa.",
          "Ressonância com o conteúdo: o material do paciente ativa algo da sua própria história.",
          "Oferece interpretações apressadas para fechar o desconforto.",
          "Sente urgência de \"ajudar\" antes de compreender.",
          "Âncora corporal: coloque os dois pés no chão e sinta o peso da cadeira — isso ativa o sistema nervoso parassimpático em segundos.",
          "Respiração discreta: inspire lentamente pelo nariz, expire com calma.",
          "A ansiedade que você sente diante de um paciente específico é informação clínica.",
          "O paciente que te deixa com urgência de resolver provavelmente pressiona todos ao seu redor da mesma forma.",
          "Nenhuma técnica substitui supervisão regular.",
          "Casos que te perturbam de forma crônica precisam de espaço de elaboração fora da sessão."
        ],
        "focuses": [
          {
            "concept": "A Ansiedade do Terapeuta É Parte da Sessão",
            "point": "O campo do terapeuta influencia o campo do paciente — sempre."
          },
          {
            "concept": "De Onde Vem a Ansiedade do Terapeuta — na Prática",
            "point": "Medo de errar: pressão interna por ter sempre a resposta certa."
          },
          {
            "concept": "Sinais de Que Você Está Ansioso em Sessão",
            "point": "Oferece interpretações apressadas para fechar o desconforto."
          },
          {
            "concept": "Como Se Regular Durante a Sessão sem Que o Paciente Note",
            "point": "Âncora corporal: coloque os dois pés no chão e sinta o peso da cadeira — isso ativa o sistema nervoso parassimpático em segundos."
          },
          {
            "concept": "Contratransferência: o Que o Seu Desconforto Está Dizendo",
            "point": "A ansiedade que você sente diante de um paciente específico é informação clínica."
          },
          {
            "concept": "Supervisão É Regulação Estrutural — Não É Opcional",
            "point": "Nenhuma técnica substitui supervisão regular."
          }
        ]
      },
      {
        "id": "mod2-a3",
        "title": "Aula 3 — Como Criar Segurança Desde a Primeira Frase",
        "theme": "Como Criar Segurança Desde a Primeira Frase",
        "moduleTitle": "Módulo 2 — O Terapeuta em Ação",
        "concepts": [
          "O Ambiente Terapêutico Começa Antes da Primeira Técnica",
          "A Primeira Frase Que Acolhe sem Diminuir",
          "Validação Como Ferramenta de Segurança Imediata",
          "Combinados Que Criam Previsibilidade",
          "Como Manejar o Paciente Que Não Confia de Imediato",
          "O Que Nunca Fazer na Primeira Sessão"
        ],
        "techniques": [
          "Prefira",
          "Explique como funcionam as sessões",
          "Nomeie"
        ],
        "techniqueDetails": [
          {
            "label": "Prefira",
            "detail": "O que te trouxe aqui?"
          },
          {
            "label": "Explique como funcionam as sessões",
            "detail": "tempo, frequência, sigilo, o que você espera do processo e o que o paciente pode esperar de você"
          },
          {
            "label": "Nomeie",
            "detail": "Percebo que pode ser difícil falar com alguém que você acabou de conhecer — isso é completamente compreensível"
          }
        ],
        "insights": [
          "Winnicott chamou de \"holding environment\" — o conjunto de condições que permite ao paciente existir e se expressar sem risco.",
          "Isso começa antes de qualquer palavra técnica: como você recebe o paciente, o tom da sua voz, a organização do espaço, a previsibilidade do setting.",
          "Evite aberturas que já colocam o paciente na posição de \"caso\": \"Então, me conta o que está errado com você?\" Prefira: \"O que te trouxe aqui?\" ou \"Como posso te ajudar?\" — e depois ouça sem interromper os primeiros minutos.",
          "Essa escuta inicial comunica mais do que qualquer técnica: \"você tem espaço aqui.",
          "Validar não é concordar — é reconhecer que a experiência do paciente faz sentido dado o que ele viveu.",
          "Faz todo sentido você estar assim\" ou \"É compreensível que isso doa tanto\" reduz a meta-ansiedade — a ansiedade sobre ter ansiedade — imediatamente.",
          "Explique como funcionam as sessões: tempo, frequência, sigilo, o que você espera do processo e o que o paciente pode esperar de você.",
          "Previsibilidade é segurança — especialmente para pacientes com histórico de ambientes caóticos ou imprevisíveis.",
          "Alguns pacientes chegam fechados — monossilábicos, desconfiados, testando você.",
          "Nomeie: \"Percebo que pode ser difícil falar com alguém que você acabou de conhecer — isso é completamente compreensível.\" Validar a desconfiança é, paradoxalmente, o que começa a dissolvê-la.",
          "Não dê interpretações profundas antes de aliança estabelecida.",
          "Não demonstre pressa para chegar a conclusões."
        ],
        "focuses": [
          {
            "concept": "O Ambiente Terapêutico Começa Antes da Primeira Técnica",
            "point": "Winnicott chamou de \"holding environment\" — o conjunto de condições que permite ao paciente existir e se expressar sem risco."
          },
          {
            "concept": "A Primeira Frase Que Acolhe sem Diminuir",
            "point": "Evite aberturas que já colocam o paciente na posição de \"caso\": \"Então, me conta o que está errado com você?\" Prefira: \"O que te trouxe aqui?\" ou \"Como posso te ajudar?\" — e depois ouça sem interromper os primeiros minutos."
          },
          {
            "concept": "Validação Como Ferramenta de Segurança Imediata",
            "point": "Validar não é concordar — é reconhecer que a experiência do paciente faz sentido dado o que ele viveu."
          },
          {
            "concept": "Combinados Que Criam Previsibilidade",
            "point": "Explique como funcionam as sessões: tempo, frequência, sigilo, o que você espera do processo e o que o paciente pode esperar de você."
          },
          {
            "concept": "Como Manejar o Paciente Que Não Confia de Imediato",
            "point": "Alguns pacientes chegam fechados — monossilábicos, desconfiados, testando você."
          },
          {
            "concept": "O Que Nunca Fazer na Primeira Sessão",
            "point": "Não dê interpretações profundas antes de aliança estabelecida."
          }
        ]
      },
      {
        "id": "mod2-a4",
        "title": "Aula 4 — Rupturas na Aliança: Reconhecer o Sinal Invisível e Reparar",
        "theme": "Rupturas na Aliança: Reconhecer o Sinal Invisível e Reparar",
        "moduleTitle": "Módulo 2 — O Terapeuta em Ação",
        "concepts": [
          "Rupturas São Inevitáveis — o Perigo É Não Percebê — Las",
          "Os Sinais Invisíveis de Ruptura",
          "Como Nomear a Ruptura sem Criar Mais Tensão",
          "Quando o Erro Foi Seu — o Que Fazer",
          "O Reparo Como Experiência Emocional Corretiva",
          "Prevenção: Como Cuidar da Aliança Antes da Ruptura"
        ],
        "techniques": [
          "Abra você",
          "Pergunte periodicamente"
        ],
        "techniqueDetails": [
          {
            "label": "Abra você",
            "detail": "Percebo que algo mudou entre nós nas últimas sessões — me ajuda a entender o que aconteceu?"
          },
          {
            "label": "Pergunte periodicamente",
            "detail": "Como você está se sentindo nesse processo? Tem algo que eu poderia fazer diferente?"
          }
        ],
        "insights": [
          "Toda aliança terapêutica real passa por rupturas — momentos em que o paciente se sente não compreendido, julgado ou decepcionado.",
          "Kohut identificou-os como as oportunidades mais poderosas de cura — porque a maioria dos pacientes nunca viveu um conflito que foi reparado com honestidade e cuidado.",
          "Responde \"tudo bem\" em tom de quem não está bem.",
          "Esses são sinais de afastamento — e a responsabilidade de perceber é sua, não do paciente.",
          "Abra você: \"Percebo que algo mudou entre nós nas últimas sessões — me ajuda a entender o que aconteceu?\" Dito sem defensividade e com genuíno interesse, essa frase libera o que estava represado.",
          "A maioria dos pacientes fica aliviada de poder falar sobre isso — porque nunca imaginou que seria possível.",
          "Se você disse algo insensível, interpretou de forma equivocada ou simplesmente não esteve presente: reconheça diretamente.",
          "Acho que fui insensível naquele momento — lamento.\" Sem rodeios, sem justificativas longas.",
          "O terapeuta que repara com honestidade oferece ao paciente algo que muitos nunca tiveram: a experiência de que um conflito não precisa terminar em abandono ou punição.",
          "Isso não é só técnica — é uma nova referência relacional que o paciente vai carregar para todos os seus vínculos.",
          "Não espere a ruptura para trabalhar o vínculo.",
          "Pergunte periodicamente: \"Como você está se sentindo nesse processo?"
        ],
        "focuses": [
          {
            "concept": "Rupturas São Inevitáveis — o Perigo É Não Percebê — Las",
            "point": "Toda aliança terapêutica real passa por rupturas — momentos em que o paciente se sente não compreendido, julgado ou decepcionado."
          },
          {
            "concept": "Os Sinais Invisíveis de Ruptura",
            "point": "Responde \"tudo bem\" em tom de quem não está bem."
          },
          {
            "concept": "Como Nomear a Ruptura sem Criar Mais Tensão",
            "point": "Abra você: \"Percebo que algo mudou entre nós nas últimas sessões — me ajuda a entender o que aconteceu?\" Dito sem defensividade e com genuíno interesse, essa frase libera o que estava represado."
          },
          {
            "concept": "Quando o Erro Foi Seu — o Que Fazer",
            "point": "Se você disse algo insensível, interpretou de forma equivocada ou simplesmente não esteve presente: reconheça diretamente."
          },
          {
            "concept": "O Reparo Como Experiência Emocional Corretiva",
            "point": "O terapeuta que repara com honestidade oferece ao paciente algo que muitos nunca tiveram: a experiência de que um conflito não precisa terminar em abandono ou punição."
          },
          {
            "concept": "Prevenção: Como Cuidar da Aliança Antes da Ruptura",
            "point": "Não espere a ruptura para trabalhar o vínculo."
          }
        ]
      },
      {
        "id": "mod2-a5",
        "title": "Aula 5 — Encerramento de Sessão e de Processo: Como Terminar Bem",
        "theme": "Encerramento de Sessão e de Processo: Como Terminar Bem",
        "moduleTitle": "Módulo 2 — O Terapeuta em Ação",
        "concepts": [
          "O Encerramento de Sessão É uma Intervenção — Não uma Formalidade",
          "Estrutura Prática dos Últimos 5 Minutos",
          "Como Saber Se o Processo Está Pronto para Encerrar",
          "Como Conduzir o Encerramento do Processo",
          "A Tristeza do Encerramento É Saudável — Não a Apresse",
          "Deixe a Porta Aberta sem Criar Dependência"
        ],
        "techniques": [
          "Sinalização",
          "Consolidação",
          "Tarefa experiencial quando pertinente",
          "Cuidado na saída",
          "Kohut diria",
          "Frankl completaria"
        ],
        "techniqueDetails": [
          {
            "label": "Sinalização",
            "detail": "Vamos ter mais uns 5 minutos"
          },
          {
            "label": "Consolidação",
            "detail": "Do que conversamos hoje, o que ficou mais com você?"
          },
          {
            "label": "Tarefa experiencial quando pertinente",
            "detail": "não lição de casa teórica, mas uma pequena observação da vida real para a semana"
          },
          {
            "label": "Cuidado na saída",
            "detail": "se o paciente abriu algo muito pesado, não o deixe sair sem ancoragem"
          },
          {
            "label": "Kohut diria",
            "detail": "a elaboração saudável dessa perda é parte do trabalho, não um inconveniente do fim"
          },
          {
            "label": "Frankl completaria",
            "detail": "o paciente que sai com recursos internos consolidados não precisa voltar, mas sabe que pode"
          }
        ],
        "insights": [
          "Um encerramento bem feito consolida tudo que foi trabalhado.",
          "Um encerramento abrupto pode desfazer boa parte do que foi construído nos 50 minutos anteriores.",
          "Sinalização: \"Vamos ter mais uns 5 minutos\" — prepare o paciente, não corte abruptamente.",
          "Consolidação: \"Do que conversamos hoje, o que ficou mais com você?\" — isso ancora o processamento e revela o que realmente tocou.",
          "Funciona bem no cotidiano sem depender das sessões para se regular.",
          "Consegue identificar e usar seus próprios recursos.",
          "Planeje de 4 a 8 semanas de encerramento consciente.",
          "Revise o percurso com o paciente: \"Lembra como você estava quando começou?",
          "Encerrar algo significativo dói um pouco — e isso é correto.",
          "O paciente que sente a perda do processo está sentindo que o que aconteceu aqui teve valor.",
          "Se você precisar voltar em algum momento, estarei aqui.\" Essa frase simples é o holding de Winnicott em sua forma mais pura — suporte que não aprisiona.",
          "Frankl completaria: o paciente que sai com recursos internos consolidados não precisa voltar, mas sabe que pode."
        ],
        "focuses": [
          {
            "concept": "O Encerramento de Sessão É uma Intervenção — Não uma Formalidade",
            "point": "Um encerramento bem feito consolida tudo que foi trabalhado."
          },
          {
            "concept": "Estrutura Prática dos Últimos 5 Minutos",
            "point": "Sinalização: \"Vamos ter mais uns 5 minutos\" — prepare o paciente, não corte abruptamente."
          },
          {
            "concept": "Como Saber Se o Processo Está Pronto para Encerrar",
            "point": "Funciona bem no cotidiano sem depender das sessões para se regular."
          },
          {
            "concept": "Como Conduzir o Encerramento do Processo",
            "point": "Planeje de 4 a 8 semanas de encerramento consciente."
          },
          {
            "concept": "A Tristeza do Encerramento É Saudável — Não a Apresse",
            "point": "Encerrar algo significativo dói um pouco — e isso é correto."
          },
          {
            "concept": "Deixe a Porta Aberta sem Criar Dependência",
            "point": "Se você precisar voltar em algum momento, estarei aqui.\" Essa frase simples é o holding de Winnicott em sua forma mais pura — suporte que não aprisiona."
          }
        ]
      }
    ]
  },
  {
    "id": "mod3",
    "title": "Módulo 3 — Intervenções Práticas I",
    "lessons": [
      {
        "id": "mod3-a1",
        "title": "Aula 1 — Como Confrontar Comportamentos Destrutivos Sem Criar Resistência",
        "theme": "Como Confrontar Comportamentos Destrutivos Sem Criar Resistência",
        "moduleTitle": "Módulo 3 — Intervenções Práticas I",
        "concepts": [
          "Por Que a Confrontação Direta Quase Sempre Falha",
          "Entenda a Função do Comportamento Antes de Qualquer Coisa",
          "A Confrontação Empática: Como Fazer na Prática",
          "O Timing Certo: Só Confronte Quando a Aliança Sustenta",
          "Confrontar o Padrão É Mais Poderoso do Que Confrontar o Episódio",
          "Quando o Paciente Fecha Após a Confrontação"
        ],
        "techniques": [
          "Estrutura concreta",
          "Regra prática"
        ],
        "techniqueDetails": [
          {
            "label": "Estrutura concreta",
            "detail": "Percebo que quando [situação], você tende a [comportamento] — e ao mesmo tempo vejo que isso está custando [consequência real] na sua vida"
          },
          {
            "label": "Regra prática",
            "detail": "só confronte quando você sente que o paciente conseguiria ouvir isso de você"
          }
        ],
        "insights": [
          "Quando você confronta um comportamento destrutivo de frente — \"você está sendo agressivo\", \"você está se sabotando\" — o paciente ativa suas defesas imediatamente.",
          "Mas porque aquele comportamento, por mais destrutivo que pareça externamente, faz sentido internamente.",
          "Todo comportamento destrutivo serve a algo: alivia ansiedade, mantém controle, evita uma dor maior, protege o self de uma ameaça percebida.",
          "Antes de confrontar, pergunte-se: o que esse comportamento está fazendo para esse paciente?",
          "Estrutura concreta: \"Percebo que quando [situação], você tende a [comportamento] — e ao mesmo tempo vejo que isso está custando [consequência real] na sua vida.",
          "Me ajuda a entender o que acontece em você nesses momentos?\" Isso convida à reflexão sem acusação.",
          "Uma confrontação prematura — antes de aliança sólida — aumenta a resistência e pode romper o vínculo.",
          "Regra prática: só confronte quando você sente que o paciente conseguiria ouvir isso de você.",
          "O paciente começa a se observar, não a se defender.",
          "Parece que isso foi difícil de ouvir — o que chegou mais forte?\" Isso repara o campo sem abandonar o conteúdo.",
          "A ruptura gerada por uma confrontação mal-recebida pode ser mais terapêutica do que a confrontação em si — se você souber manejá-la."
        ],
        "focuses": [
          {
            "concept": "Por Que a Confrontação Direta Quase Sempre Falha",
            "point": "Quando você confronta um comportamento destrutivo de frente — \"você está sendo agressivo\", \"você está se sabotando\" — o paciente ativa suas defesas imediatamente."
          },
          {
            "concept": "Entenda a Função do Comportamento Antes de Qualquer Coisa",
            "point": "Todo comportamento destrutivo serve a algo: alivia ansiedade, mantém controle, evita uma dor maior, protege o self de uma ameaça percebida."
          },
          {
            "concept": "A Confrontação Empática: Como Fazer na Prática",
            "point": "Estrutura concreta: \"Percebo que quando [situação], você tende a [comportamento] — e ao mesmo tempo vejo que isso está custando [consequência real] na sua vida."
          },
          {
            "concept": "O Timing Certo: Só Confronte Quando a Aliança Sustenta",
            "point": "Uma confrontação prematura — antes de aliança sólida — aumenta a resistência e pode romper o vínculo."
          },
          {
            "concept": "Confrontar o Padrão É Mais Poderoso do Que Confrontar o Episódio",
            "point": "O paciente começa a se observar, não a se defender."
          },
          {
            "concept": "Quando o Paciente Fecha Após a Confrontação",
            "point": "Parece que isso foi difícil de ouvir — o que chegou mais forte?\" Isso repara o campo sem abandonar o conteúdo."
          }
        ]
      },
      {
        "id": "mod3-a2",
        "title": "Aula 2 — Intenção Paradoxal: Quebrando Ciclos que se Autoperpetua",
        "theme": "Intenção Paradoxal: Quebrando Ciclos que se Autoperpetua",
        "moduleTitle": "Módulo 3 — Intervenções Práticas I",
        "concepts": [
          "O Que É um Ciclo Que Se Autoperpetua",
          "Como Identificar o Ciclo em Sessão",
          "Como Aplicar na Prática",
          "Por Que Isso Funciona",
          "Limites da Técnica: Quando Não Usar",
          "Como Apresentar sem Perder o Paciente"
        ],
        "techniques": [
          "Exemplo concreto",
          "Instrução",
          "Apresente como experimento"
        ],
        "techniqueDetails": [
          {
            "label": "Exemplo concreto",
            "detail": "paciente ansioso em situações sociais que tenta esconder a ansiedade"
          },
          {
            "label": "Instrução",
            "detail": "Na próxima situação, em vez de esconder, observe sua ansiedade com curiosidade"
          },
          {
            "label": "Apresente como experimento",
            "detail": "Quero te propor uma prática diferente esta semana — e estou genuinamente curioso para ver o que acontece"
          }
        ],
        "insights": [
          "Existe uma categoria de sofrimento clínico onde o paciente está preso num loop: quanto mais ele tenta resolver o problema, mais o problema se intensifica.",
          "O paciente que tenta controlar a ansiedade fica mais ansioso.",
          "O sinal claro é quando o paciente descreve o mesmo padrão em contextos diferentes — e a tentativa de solução faz parte do problema.",
          "Quanto mais eu tento não me preocupar, mais me preocupo.\" \"Quanto mais eu tento me aproximar, mais ele se afasta.\" Antes de oferecer a técnica, ajude o paciente a ver o ciclo.",
          "A instrução paradoxal orienta o paciente a fazer intencionalmente o que teme — não para sofrer mais, mas para desativar o ciclo de antecipação que mantém o problema vivo.",
          "Exemplo concreto: paciente ansioso em situações sociais que tenta esconder a ansiedade.",
          "Quando o paciente para de lutar contra o sintoma, o sintoma perde sua principal fonte de energia.",
          "É o mesmo princípio de afastar o fogo do oxigênio.",
          "Não use antes de aliança estabelecida — sem confiança, a proposta soa como descaso ou provocação.",
          "A técnica exige que o paciente acredite que você sabe o que está fazendo e que se importa com ele."
        ],
        "focuses": [
          {
            "concept": "O Que É um Ciclo Que Se Autoperpetua",
            "point": "Existe uma categoria de sofrimento clínico onde o paciente está preso num loop: quanto mais ele tenta resolver o problema, mais o problema se intensifica."
          },
          {
            "concept": "Como Identificar o Ciclo em Sessão",
            "point": "O sinal claro é quando o paciente descreve o mesmo padrão em contextos diferentes — e a tentativa de solução faz parte do problema."
          },
          {
            "concept": "Como Aplicar na Prática",
            "point": "A instrução paradoxal orienta o paciente a fazer intencionalmente o que teme — não para sofrer mais, mas para desativar o ciclo de antecipação que mantém o problema vivo."
          },
          {
            "concept": "Por Que Isso Funciona",
            "point": "Quando o paciente para de lutar contra o sintoma, o sintoma perde sua principal fonte de energia."
          },
          {
            "concept": "Limites da Técnica: Quando Não Usar",
            "point": "Não use antes de aliança estabelecida — sem confiança, a proposta soa como descaso ou provocação."
          }
        ]
      },
      {
        "id": "mod3-a3",
        "title": "Aula 3 — O Uso Estratégico do Silêncio para Provocar Autorregulação",
        "theme": "O Uso Estratégico do Silêncio para Provocar Autorregulação",
        "moduleTitle": "Módulo 3 — Intervenções Práticas I",
        "concepts": [
          "O Terapeuta Que Preenche Todo Silêncio Está Trabalhando Pelo Paciente",
          "Quando o Silêncio É uma Intervenção Ativa",
          "Como Sustentar o Silêncio sem Gerar Ansiedade Excessiva",
          "Silêncio Produtivo Vs. Silêncio Punitivo",
          "O Silêncio Como Espelho do Campo Interno",
          "Prescrição de Silêncio para Entre as Sessões"
        ],
        "techniques": [
          "Silêncio produtivo",
          "Silêncio punitivo"
        ],
        "techniqueDetails": [
          {
            "label": "Silêncio produtivo",
            "detail": "você está presente, com contato visual suave, postura aberta — comunicando"
          },
          {
            "label": "Silêncio punitivo",
            "detail": "você se retira emocionalmente, olha para baixo, fecha a postura — comunicando julgamento ou desinteresse"
          }
        ],
        "insights": [
          "Quando você responde imediatamente a tudo que o paciente diz, você está fazendo o trabalho que deveria ser dele.",
          "O silêncio estratégico é o espaço onde o paciente aprende a se autorregular na presença de outro — talvez pela primeira vez na vida.",
          "Use silêncio estratégico após uma intervenção importante — para que o paciente processe antes de você avançar.",
          "Use quando o paciente está em loop verbal e precisa desacelerar.",
          "O problema do silêncio não é o silêncio — é a sua ansiedade sobre ele.",
          "Se você estiver presente e calmo, o paciente geralmente tolera e usa o espaço.",
          "Fique atento ao que seu corpo está dizendo durante a pausa.",
          "O que o paciente faz com o silêncio revela muito sobre como ele funciona.",
          "O paciente que preenche o silêncio imediatamente está desconfortável com não controlar."
        ],
        "focuses": [
          {
            "concept": "O Terapeuta Que Preenche Todo Silêncio Está Trabalhando Pelo Paciente",
            "point": "Quando você responde imediatamente a tudo que o paciente diz, você está fazendo o trabalho que deveria ser dele."
          },
          {
            "concept": "Quando o Silêncio É uma Intervenção Ativa",
            "point": "Use silêncio estratégico após uma intervenção importante — para que o paciente processe antes de você avançar."
          },
          {
            "concept": "Como Sustentar o Silêncio sem Gerar Ansiedade Excessiva",
            "point": "O problema do silêncio não é o silêncio — é a sua ansiedade sobre ele."
          },
          {
            "concept": "Silêncio Produtivo Vs. Silêncio Punitivo",
            "point": "Fique atento ao que seu corpo está dizendo durante a pausa."
          },
          {
            "concept": "O Silêncio Como Espelho do Campo Interno",
            "point": "O que o paciente faz com o silêncio revela muito sobre como ele funciona."
          }
        ]
      },
      {
        "id": "mod3-a4",
        "title": "Aula 4 — Manejo do Paciente Hipercontrolador: Protocolo Prático",
        "theme": "Manejo do Paciente Hipercontrolador: Protocolo Prático",
        "moduleTitle": "Módulo 3 — Intervenções Práticas I",
        "concepts": [
          "Como Reconhecer o Paciente Hipercontrolador em Sessão",
          "O Que Não Fazer com Esse Paciente",
          "Use o Próprio Eixo do Controle a Favor do Processo",
          "A Pergunta Que Abre o Que Ele Mais Guarda",
          "Exercícios Práticos para Modular o Controle",
          "A Dor por Trás do Controle — o Que Kohut nos Ensina"
        ],
        "techniques": [
          "Dê isso deliberadamente",
          "Proposta gradual"
        ],
        "techniqueDetails": [
          {
            "label": "Dê isso deliberadamente",
            "detail": "O que você acha que seria mais útil trabalhar hoje?"
          },
          {
            "label": "Proposta gradual",
            "detail": "peça que o paciente deixe uma conversa sem"
          }
        ],
        "insights": [
          "Discorda das intervenções antes de processá-las.",
          "Traz soluções prontas para os próprios problemas.",
          "Qualquer reação defensiva ou autoritária confirma para esse paciente que o mundo é um campo de batalha — e você acaba de se tornar mais um adversário que precisa ser controlado.",
          "O paciente hipercontrolador precisa sentir que tem agência.",
          "Após aliança estabelecida, use: \"Existe alguma área da sua vida onde você sente que não tem controle — e isso te incomoda mais do que você deixa aparecer?\" Essa pergunta acessa exatamente o que o hipercontrolador guarda com mais cuidado.",
          "E é exatamente esse o território terapêutico mais fértil do caso.",
          "Proposta gradual: peça que o paciente deixe uma conversa sem \"fechar\" o assunto e observe o desconforto que surge.",
          "Ou que peça ajuda em algo pequeno sem oferecer contrapartida imediata.",
          "O controle hipertrofiado quase sempre protege um self que foi profundamente ameaçado em algum momento.",
          "Por trás da rigidez está uma crença não-verbalizada: \"Se eu perder o controle, algo ruim vai acontecer.\" Quando você encontra isso com empatia genuína — não com técnica — o campo começa a mudar."
        ],
        "focuses": [
          {
            "concept": "Como Reconhecer o Paciente Hipercontrolador em Sessão",
            "point": "Discorda das intervenções antes de processá-las."
          },
          {
            "concept": "O Que Não Fazer com Esse Paciente",
            "point": "Qualquer reação defensiva ou autoritária confirma para esse paciente que o mundo é um campo de batalha — e você acaba de se tornar mais um adversário que precisa ser controlado."
          },
          {
            "concept": "Use o Próprio Eixo do Controle a Favor do Processo",
            "point": "O paciente hipercontrolador precisa sentir que tem agência."
          },
          {
            "concept": "A Pergunta Que Abre o Que Ele Mais Guarda",
            "point": "Após aliança estabelecida, use: \"Existe alguma área da sua vida onde você sente que não tem controle — e isso te incomoda mais do que você deixa aparecer?\" Essa pergunta acessa exatamente o que o hipercontrolador guarda com mais cuidado."
          },
          {
            "concept": "Exercícios Práticos para Modular o Controle",
            "point": "Proposta gradual: peça que o paciente deixe uma conversa sem \"fechar\" o assunto e observe o desconforto que surge."
          },
          {
            "concept": "A Dor por Trás do Controle — o Que Kohut nos Ensina",
            "point": "O controle hipertrofiado quase sempre protege um self que foi profundamente ameaçado em algum momento."
          }
        ]
      },
      {
        "id": "mod3-a5",
        "title": "Aula 5 — Como Transformar Dependência Em Autossuficiência: Da Limitação à Autonomia",
        "theme": "Como Transformar Dependência Em Autossuficiência: Da Limitação à Autonomia",
        "moduleTitle": "Módulo 3 — Intervenções Práticas I",
        "concepts": [
          "A Diferença Prática Entre Bravura e Assertividade",
          "Como Identificar Quando o Paciente Usa Bravura em Vez de Assertividade",
          "O Mapa da Assertividade: Três Perguntas Antes de Falar",
          "Exercício Clínico: Reescrevendo a Cena",
          "A Crença Que Precisa Ser Trabalhada",
          "Consolidando a Mudança: Prática Fora da Sessão"
        ],
        "techniques": [
          "Assertividade é bravura com precisão",
          "Analise juntos",
          "Frankl diria",
          "Estabeleça uma prática semanal concreta"
        ],
        "techniqueDetails": [
          {
            "label": "Assertividade é bravura com precisão",
            "detail": "a capacidade de dizer o que precisa ser dito, da forma que pode ser ouvida, no momento certo"
          },
          {
            "label": "Analise juntos",
            "detail": "o que você queria comunicar? O que a outra pessoa recebeu? Agora reescreva a frase com o mesmo conteúdo mas com uma forma que preserva o vínculo"
          },
          {
            "label": "Frankl diria",
            "detail": "a assertividade madura não é fraqueza — é o maior ato de coragem, porque exige que você se importe com o impacto que causa, não apenas com o direito d"
          },
          {
            "label": "Estabeleça uma prática semanal concreta",
            "detail": "o paciente escolhe uma situação onde vai praticar a forma assertiva — não apenas o conteúdo direto"
          }
        ],
        "insights": [
          "Bravura é a energia de enfrentamento — real e valiosa.",
          "Assertividade é bravura com precisão: a capacidade de dizer o que precisa ser dito, da forma que pode ser ouvida, no momento certo.",
          "O paciente que \"fala a verdade\" de uma forma que os outros se sentem atacados.",
          "O que \"não aceita injustiça\" de uma forma que gera conflitos desnecessários.",
          "Como pode ser dito para ser recebido — a forma que respeita o campo do outro.",
          "Quando o outro está em condição de ouvir — o timing.",
          "Peça que o paciente descreva uma situação onde foi direto mas gerou conflito.",
          "Agora reescreva a frase com o mesmo conteúdo mas com uma forma que preserva o vínculo.",
          "Se eu suavizar a forma, vou parecer fraco.\" Essa crença é muito comum e precisa ser confrontada diretamente.",
          "Frankl diria: a assertividade madura não é fraqueza — é o maior ato de coragem, porque exige que você se importe com o impacto que causa, não apenas com o direito de dizer.",
          "Estabeleça uma prática semanal concreta: o paciente escolhe uma situação onde vai praticar a forma assertiva — não apenas o conteúdo direto.",
          "Você analisa juntos o que funcionou e o que ajustar."
        ],
        "focuses": [
          {
            "concept": "A Diferença Prática Entre Bravura e Assertividade",
            "point": "Bravura é a energia de enfrentamento — real e valiosa."
          },
          {
            "concept": "Como Identificar Quando o Paciente Usa Bravura em Vez de Assertividade",
            "point": "O paciente que \"fala a verdade\" de uma forma que os outros se sentem atacados."
          },
          {
            "concept": "O Mapa da Assertividade: Três Perguntas Antes de Falar",
            "point": "Como pode ser dito para ser recebido — a forma que respeita o campo do outro."
          },
          {
            "concept": "Exercício Clínico: Reescrevendo a Cena",
            "point": "Peça que o paciente descreva uma situação onde foi direto mas gerou conflito."
          },
          {
            "concept": "A Crença Que Precisa Ser Trabalhada",
            "point": "Se eu suavizar a forma, vou parecer fraco.\" Essa crença é muito comum e precisa ser confrontada diretamente."
          },
          {
            "concept": "Consolidando a Mudança: Prática Fora da Sessão",
            "point": "Estabeleça uma prática semanal concreta: o paciente escolhe uma situação onde vai praticar a forma assertiva — não apenas o conteúdo direto."
          }
        ]
      }
    ]
  },
  {
    "id": "mod4",
    "title": "Módulo 4 — Intervenções Práticas II",
    "lessons": [
      {
        "id": "mod4-a1",
        "title": "Aula 1 — Manejo da Simbiose Patológica: O Paciente Que Quer Ser Você",
        "theme": "Manejo da Simbiose Patológica: O Paciente Que Quer Ser Você",
        "moduleTitle": "Módulo 4 — Intervenções Práticas II",
        "concepts": [
          "O Que É Simbiose Patológica e Como Ela Aparece na Clínica",
          "A Raiz do Padrão: o Que Kohut nos Ensina",
          "Como o Terapeuta Pode Alimentar a Simbiose sem Perceber",
          "Como Intervir sem Romper o Vínculo",
          "Exercício Clínico: Devolvendo a Autoria",
          "O Objetivo Final: Autonomia sem Abandono"
        ],
        "techniques": [
          "Use"
        ],
        "techniqueDetails": [
          {
            "label": "Use",
            "detail": "Essa é uma pergunta importante — o que você faria no seu lugar se não estivesse com medo de errar?"
          }
        ],
        "insights": [
          "O paciente simbiótico não quer só ser compreendido — quer se tornar você.",
          "Adota sua linguagem, começa a ver o mundo com seus olhos, questiona seus valores anteriores em função do que percebe que você valorizaria.",
          "Pacientes simbióticos usam o terapeuta como \"selfobject\" — uma extensão de si mesmos necessária para se sentirem inteiros.",
          "Isso não é manipulação consciente — é uma estratégia de sobrevivência construída quando o ambiente não ofereceu suporte suficiente para que o self se desenvolvesse como estrutura autônoma.",
          "Compartilhar opiniões pessoais com frequência.",
          "Responder a toda demanda emocional do paciente com disponibilidade imediata.",
          "Não confronte a idealização diretamente — isso gera colapso ou fuga.",
          "Em vez disso, comece a devolver ao paciente a autoria de suas percepções: \"O que você acha sobre isso?\" em vez de opinar.",
          "Quando o paciente perguntar \"o que você faria no meu lugar?\", não responda.",
          "O terapeuta suficientemente bom de Winnicott não é o que o paciente nunca deixa ir — é o que o prepara para não precisar de você."
        ],
        "focuses": [
          {
            "concept": "O Que É Simbiose Patológica e Como Ela Aparece na Clínica",
            "point": "O paciente simbiótico não quer só ser compreendido — quer se tornar você."
          },
          {
            "concept": "A Raiz do Padrão: o Que Kohut nos Ensina",
            "point": "Pacientes simbióticos usam o terapeuta como \"selfobject\" — uma extensão de si mesmos necessária para se sentirem inteiros."
          },
          {
            "concept": "Como o Terapeuta Pode Alimentar a Simbiose sem Perceber",
            "point": "Compartilhar opiniões pessoais com frequência."
          },
          {
            "concept": "Como Intervir sem Romper o Vínculo",
            "point": "Não confronte a idealização diretamente — isso gera colapso ou fuga."
          },
          {
            "concept": "Exercício Clínico: Devolvendo a Autoria",
            "point": "Quando o paciente perguntar \"o que você faria no meu lugar?\", não responda."
          },
          {
            "concept": "O Objetivo Final: Autonomia sem Abandono",
            "point": "O terapeuta suficientemente bom de Winnicott não é o que o paciente nunca deixa ir — é o que o prepara para não precisar de você."
          }
        ]
      },
      {
        "id": "mod4-a2",
        "title": "Aula 2 — Técnicas de Diferenciação: Ensinando o Paciente a Dizer Não",
        "theme": "Técnicas de Diferenciação: Ensinando o Paciente a Dizer Não",
        "moduleTitle": "Módulo 4 — Intervenções Práticas II",
        "concepts": [
          "Por Que Dizer Não É Tão Difícil para Esse Paciente",
          "O Padrão Que Você Vê em Sessão",
          "O Primeiro Passo: Nomear o Padrão sem Julgamento",
          "A Escala do Não: Começando Pelo Mais Seguro",
          "Como Trabalhar a Crença Que Está por Trás",
          "Diferenciação Não É Egoísmo — É Presença Real"
        ],
        "techniques": [
          "Pergunte",
          "Frankl nos diz"
        ],
        "techniqueDetails": [
          {
            "label": "Pergunte",
            "detail": "Você já disse não para alguém importante e a relação sobreviveu?"
          },
          {
            "label": "Frankl nos diz",
            "detail": "uma pessoa que não tem fronteiras não pode ser realmente presente em nenhuma relação — porque ela não existe como sujeito distinto"
          }
        ],
        "insights": [
          "O paciente que não consegue dizer não aprendeu, em algum momento, que sua existência dependia da aprovação dos outros.",
          "Com o tempo, dizer sim para tudo virou uma estratégia de sobrevivência tão automática que o paciente nem percebe mais que está fazendo isso — ele sente apenas uma vaga sensação de exaustão e ressentimento que não consegue explicar.",
          "Esse paciente concorda com tudo que você diz.",
          "Traz situações onde cedeu algo importante e racionaliza o porquê foi \"a coisa certa a fazer.\" Tem dificuldade de falar sobre o que quer para si mesmo sem antes considerar o que os outros precisam.",
          "Antes de qualquer técnica de assertividade, ajude o paciente a enxergar o padrão: \"Percebo que em várias situações que você descreveu, você abriu mão do que queria.",
          "Como você se sentiu depois?\" Muitas vezes o paciente nunca se perguntou isso.",
          "Mapeie com o paciente: em que contextos é mais fácil discordar?",
          "Em que relações a recusa seria menos ameaçadora?",
          "A crença central é quase sempre uma variação de: \"Se eu disser não, vou perder essa pessoa\" ou \"Se eu discordar, serei rejeitado.\" Essa crença precisa ser testada na realidade — não combatida com argumentos.",
          "Pergunte: \"Você já disse não para alguém importante e a relação sobreviveu?\" Se sim, explore.",
          "Frankl nos diz: uma pessoa que não tem fronteiras não pode ser realmente presente em nenhuma relação — porque ela não existe como sujeito distinto.",
          "O paciente precisa ouvir isso: aprender a dizer não não é se tornar frio ou egoísta."
        ],
        "focuses": [
          {
            "concept": "Por Que Dizer Não É Tão Difícil para Esse Paciente",
            "point": "O paciente que não consegue dizer não aprendeu, em algum momento, que sua existência dependia da aprovação dos outros."
          },
          {
            "concept": "O Padrão Que Você Vê em Sessão",
            "point": "Esse paciente concorda com tudo que você diz."
          },
          {
            "concept": "O Primeiro Passo: Nomear o Padrão sem Julgamento",
            "point": "Antes de qualquer técnica de assertividade, ajude o paciente a enxergar o padrão: \"Percebo que em várias situações que você descreveu, você abriu mão do que queria."
          },
          {
            "concept": "A Escala do Não: Começando Pelo Mais Seguro",
            "point": "Mapeie com o paciente: em que contextos é mais fácil discordar?"
          },
          {
            "concept": "Como Trabalhar a Crença Que Está por Trás",
            "point": "A crença central é quase sempre uma variação de: \"Se eu disser não, vou perder essa pessoa\" ou \"Se eu discordar, serei rejeitado.\" Essa crença precisa ser testada na realidade — não combatida com argumentos."
          },
          {
            "concept": "Diferenciação Não É Egoísmo — É Presença Real",
            "point": "Frankl nos diz: uma pessoa que não tem fronteiras não pode ser realmente presente em nenhuma relação — porque ela não existe como sujeito distinto."
          }
        ]
      },
      {
        "id": "mod4-a3",
        "title": "Aula 3 — Como Usar a Vulnerabilidade Como Recurso de Força",
        "theme": "Como Usar a Vulnerabilidade Como Recurso de Força",
        "moduleTitle": "Módulo 4 — Intervenções Práticas II",
        "concepts": [
          "A Vulnerabilidade Que a Maioria dos Pacientes Teme",
          "O Custo de Não Se Permitir Ser Vulnerável",
          "Como Trabalhar Isso em Sessão — Passo a Passo",
          "Vulnerabilidade Como Potência, Não Como Déficit",
          "O Terapeuta Como Modelo de Vulnerabilidade Calibrada",
          "Exercício Prático: a Prática da Exposição Gradual Emocional"
        ],
        "techniques": [
          "Primeiro",
          "Segundo",
          "Terceiro"
        ],
        "techniqueDetails": [
          {
            "label": "Primeiro",
            "detail": "crie o campo seguro"
          },
          {
            "label": "Segundo",
            "detail": "reconheça os pequenos momentos de abertura"
          },
          {
            "label": "Terceiro",
            "detail": "nomeie o que você observou:"
          }
        ],
        "insights": [
          "Para muitos pacientes, mostrar vulnerabilidade é sinônimo de fraqueza — e fraqueza é perigosa.",
          "Esse aprendizado veio de ambientes onde a exposição foi usada contra eles, onde mostrar dor resultou em rejeição ou manipulação.",
          "O paciente que nunca mostra vulnerabilidade não consegue criar vínculos reais — porque vínculos reais requerem que ambos os lados sejam vistos.",
          "Ele mantém conexões funcionais, nunca íntimas.",
          "O paciente só arrisca a vulnerabilidade quando o ambiente oferece holding real — ele não vai se abrir por vontade, mas porque o espaço ficou seguro o suficiente.",
          "Segundo: reconheça os pequenos momentos de abertura.",
          "Winnicott nos ensinou que o \"verdadeiro self\" emerge apenas quando o ambiente é seguro o suficiente.",
          "A vulnerabilidade não é a ausência de força — é a expressão do self real.",
          "Não é sobre se abrir excessivamente — é sobre demonstrar que é possível reconhecer limitações, dizer \"não sei\", nomear uma emoção, sem que o mundo desmorone.",
          "Esse modelo, observado ao longo do processo, vai sendo internalizado pelo paciente como referência de que vulnerabilidade e competência coexistem.",
          "Estabeleça como prática entre as sessões: o paciente escolhe uma situação de baixo risco onde vai compartilhar algo real sobre si mesmo — uma opinião genuína, uma preferência, um sentimento honesto — e observa o que acontece.",
          "A repetição desse ciclo vai recalibrando a percepção de risco associada à abertura emocional."
        ],
        "focuses": [
          {
            "concept": "A Vulnerabilidade Que a Maioria dos Pacientes Teme",
            "point": "Para muitos pacientes, mostrar vulnerabilidade é sinônimo de fraqueza — e fraqueza é perigosa."
          },
          {
            "concept": "O Custo de Não Se Permitir Ser Vulnerável",
            "point": "O paciente que nunca mostra vulnerabilidade não consegue criar vínculos reais — porque vínculos reais requerem que ambos os lados sejam vistos."
          },
          {
            "concept": "Como Trabalhar Isso em Sessão — Passo a Passo",
            "point": "O paciente só arrisca a vulnerabilidade quando o ambiente oferece holding real — ele não vai se abrir por vontade, mas porque o espaço ficou seguro o suficiente."
          },
          {
            "concept": "Vulnerabilidade Como Potência, Não Como Déficit",
            "point": "Winnicott nos ensinou que o \"verdadeiro self\" emerge apenas quando o ambiente é seguro o suficiente."
          },
          {
            "concept": "O Terapeuta Como Modelo de Vulnerabilidade Calibrada",
            "point": "Não é sobre se abrir excessivamente — é sobre demonstrar que é possível reconhecer limitações, dizer \"não sei\", nomear uma emoção, sem que o mundo desmorone."
          },
          {
            "concept": "Exercício Prático: a Prática da Exposição Gradual Emocional",
            "point": "Estabeleça como prática entre as sessões: o paciente escolhe uma situação de baixo risco onde vai compartilhar algo real sobre si mesmo — uma opinião genuína, uma preferência, um sentimento honesto — e observa o que acontece."
          }
        ]
      },
      {
        "id": "mod4-a4",
        "title": "Aula 4 — Manejo do Luto e da Perda em Pacientes com Apego Intenso",
        "theme": "Manejo do Luto e da Perda em Pacientes com Apego Intenso",
        "moduleTitle": "Módulo 4 — Intervenções Práticas II",
        "concepts": [
          "O Que o Luto Realmente É — e por Que Ele Trava",
          "A Armadilha do Otimismo Prematuro",
          "As Fases do Luto Que Você Vai Acompanhar",
          "Como Manejar as Ondas de Luto em Sessão",
          "O Corpo no Luto — o Que Engel nos Ensina",
          "Quando o Luto Está Pronto para Dar Lugar a Algo Novo"
        ],
        "techniques": [
          "Em vez disso",
          "Acolhimento da dor",
          "Validação da perda",
          "Exploração do vínculo",
          "Identificação do que permanece",
          "Abertura gradual para novos investimentos",
          "Normalize isso explicitamente",
          "Frankl nos orienta"
        ],
        "techniqueDetails": [
          {
            "label": "Em vez disso",
            "detail": "O que você perdeu que ainda não teve espaço para chorar de verdade?"
          },
          {
            "label": "Acolhimento da dor",
            "detail": "não corrija, não anime, não explique"
          },
          {
            "label": "Validação da perda",
            "detail": "o que foi perdido importa — nomeie isso juntos"
          },
          {
            "label": "Exploração do vínculo",
            "detail": "o que essa pessoa ou situação significava? O luto é proporcional ao amor"
          },
          {
            "label": "Identificação do que permanece",
            "detail": "não como consolo, mas como reconhecimento genuíno"
          },
          {
            "label": "Abertura gradual para novos investimentos",
            "detail": "Frankl chama de abertura para novos valores experienciais"
          },
          {
            "label": "Normalize isso explicitamente",
            "detail": "O luto não tem prazo e não segue linha reta"
          },
          {
            "label": "Frankl nos orienta",
            "detail": "o paciente está pronto para avançar quando começa a encontrar, espontaneamente, razões para estar presente no mundo — não como obrigação, mas como des"
          }
        ],
        "insights": [
          "O luto é o processo natural de adaptação à perda — de uma pessoa, de um sonho, de uma fase da vida, de uma identidade.",
          "O problema clínico não é o luto em si, é o luto que travou: reprimido, apressado, negado, ou complicado por apego intenso que não tinha espaço de expressão.",
          "Frases como \"mas você tem tantos motivos para ser grato\" ou \"o tempo vai curar\" são, na prática, invalidantes.",
          "Elas comunicam ao paciente que a dor dele é excessiva — e aumentam a vergonha.",
          "Acolhimento da dor: não corrija, não anime, não explique.",
          "Validação da perda: o que foi perdido importa — nomeie isso juntos.",
          "O luto não é linear — e em pacientes com apego intenso ele vem em ondas.",
          "O paciente que \"já estava bem\" e de repente chora novamente não regrediu — está processando em camadas.",
          "O luto tem dimensão biológica real: exaustão, imunidade reduzida, alterações do sono e do apetite, dores físicas sem causa orgânica.",
          "Esse cuidado integral — nomear que o corpo também está sofrendo — valida a experiência de forma que o trabalho puramente verbal não consegue.",
          "Frankl nos orienta: o paciente está pronto para avançar quando começa a encontrar, espontaneamente, razões para estar presente no mundo — não como obrigação, mas como desejo genuíno.",
          "Seu papel nesse momento não é empurrar — é reconhecer e celebrar cada pequeno movimento em direção à vida."
        ],
        "focuses": [
          {
            "concept": "O Que o Luto Realmente É — e por Que Ele Trava",
            "point": "O luto é o processo natural de adaptação à perda — de uma pessoa, de um sonho, de uma fase da vida, de uma identidade."
          },
          {
            "concept": "A Armadilha do Otimismo Prematuro",
            "point": "Frases como \"mas você tem tantos motivos para ser grato\" ou \"o tempo vai curar\" são, na prática, invalidantes."
          },
          {
            "concept": "As Fases do Luto Que Você Vai Acompanhar",
            "point": "Acolhimento da dor: não corrija, não anime, não explique."
          },
          {
            "concept": "Como Manejar as Ondas de Luto em Sessão",
            "point": "O luto não é linear — e em pacientes com apego intenso ele vem em ondas."
          },
          {
            "concept": "O Corpo no Luto — o Que Engel nos Ensina",
            "point": "O luto tem dimensão biológica real: exaustão, imunidade reduzida, alterações do sono e do apetite, dores físicas sem causa orgânica."
          },
          {
            "concept": "Quando o Luto Está Pronto para Dar Lugar a Algo Novo",
            "point": "Frankl nos orienta: o paciente está pronto para avançar quando começa a encontrar, espontaneamente, razões para estar presente no mundo — não como obrigação, mas como desejo genuíno."
          }
        ]
      },
      {
        "id": "mod4-a5",
        "title": "Aula 5 — Regulação para o Paciente com Apego Ansioso: Ferramentas Diretas",
        "theme": "Regulação para o Paciente com Apego Ansioso: Ferramentas Diretas",
        "moduleTitle": "Módulo 4 — Intervenções Práticas II",
        "concepts": [
          "O Perfil do Paciente com Apego Ansioso em Sessão",
          "O Que Esse Paciente Mais Precisa de Você",
          "Ferramentas de Regulação para Uso em Sessão",
          "Trabalhando a Crença Central do Apego Ansioso",
          "Como Trabalhar os Episódios de Crise Entre Sessões",
          "O Objetivo: de Regulação Externa para Autorregulação"
        ],
        "techniques": [
          "Traga atenção para o corpo",
          "Ele comunica",
          "Kohut"
        ],
        "techniqueDetails": [
          {
            "label": "Traga atenção para o corpo",
            "detail": "Respira comigo por um momento"
          },
          {
            "label": "Ele comunica",
            "detail": "Você não está sozinho, e eu confio que você tem recursos para atravessar isso"
          },
          {
            "label": "Kohut",
            "detail": "dar estrutura é dar suporte ao self sem criar dependência"
          }
        ],
        "insights": [
          "Testa o vínculo constantemente — muitas vezes de formas que não percebe.",
          "Tem dificuldade de tolerar espaço entre as sessões.",
          "Não carisma, não técnicas sofisticadas, não respostas brilhantes — consistência.",
          "Limites mantidos com calma, não com rigidez punitiva.",
          "Quando o paciente entra em hiperativação ansiosa — fala rápido, pula de assunto, chora sem conseguir parar — desacelere o ritmo da sua voz.",
          "Traga atenção para o corpo: \"Respira comigo por um momento.\" Isso ativa o sistema nervoso parassimpático em segundos e traz o paciente de volta para a janela de tolerância, onde o trabalho clínico é possível.",
          "A crença nuclear quase sempre é: \"Se eu não me certificar constantemente de que você ainda está aqui, você vai embora.\" Essa crença precisa ser testada na relação terapêutica — não combatida com argumentos.",
          "Quando você é consistente ao longo do tempo, você está oferecendo uma experiência contrária à crença — e é a experiência, não o argumento, que muda o sistema nervoso.",
          "Estabeleça um protocolo claro para momentos de crise: com quem o paciente pode falar, o que pode fazer sozinho, quando buscar você.",
          "Ele comunica: \"Você não está sozinho, e eu confio que você tem recursos para atravessar isso.\" Kohut: dar estrutura é dar suporte ao self sem criar dependência.",
          "O paciente que chega incapaz de se regular sozinho precisa, gradualmente, internalizar a função regulatória que você ofereceu."
        ],
        "focuses": [
          {
            "concept": "O Perfil do Paciente com Apego Ansioso em Sessão",
            "point": "Testa o vínculo constantemente — muitas vezes de formas que não percebe."
          },
          {
            "concept": "O Que Esse Paciente Mais Precisa de Você",
            "point": "Não carisma, não técnicas sofisticadas, não respostas brilhantes — consistência."
          },
          {
            "concept": "Ferramentas de Regulação para Uso em Sessão",
            "point": "Quando o paciente entra em hiperativação ansiosa — fala rápido, pula de assunto, chora sem conseguir parar — desacelere o ritmo da sua voz."
          },
          {
            "concept": "Trabalhando a Crença Central do Apego Ansioso",
            "point": "A crença nuclear quase sempre é: \"Se eu não me certificar constantemente de que você ainda está aqui, você vai embora.\" Essa crença precisa ser testada na relação terapêutica — não combatida com argumentos."
          },
          {
            "concept": "Como Trabalhar os Episódios de Crise Entre Sessões",
            "point": "Estabeleça um protocolo claro para momentos de crise: com quem o paciente pode falar, o que pode fazer sozinho, quando buscar você."
          },
          {
            "concept": "O Objetivo: de Regulação Externa para Autorregulação",
            "point": "O paciente que chega incapaz de se regular sozinho precisa, gradualmente, internalizar a função regulatória que você ofereceu."
          }
        ]
      }
    ]
  },
  {
    "id": "mod5",
    "title": "Módulo 5 — Luto: Clínica do Que Não Se Fala",
    "lessons": [
      {
        "id": "mod5-a1",
        "title": "Aula 1 — O Que É Luto de Verdade — Além da Morte",
        "theme": "O Que É Luto de Verdade — Além da Morte",
        "moduleTitle": "Módulo 5 — Luto: Clínica do Que Não Se Fala",
        "concepts": [
          "Luto Não É Só Morte — e Essa Confusão Atrasa o Tratamento",
          "Os Lutos Invisíveis Que Você Vai Encontrar na Clínica",
          "A Pergunta Que Abre o Luto Invisível",
          "Por Que o Luto Trava — as Três Causas Principais",
          "Como Criar Permissão para o Luto em Sessão",
          "Técnica: a Carta Que Nunca Será Enviada"
        ],
        "techniques": [
          "Luto de relacionamento",
          "Luto de identidade",
          "Luto de possibilidade",
          "Luto de infância",
          "Vergonha da intensidade",
          "Pressão do ambiente",
          "Confusão sobre o objeto",
          "Valide sem comparar",
          "Frankl nos orienta"
        ],
        "techniqueDetails": [
          {
            "label": "Luto de relacionamento",
            "detail": "fim de um vínculo que estruturava a identidade do paciente"
          },
          {
            "label": "Luto de identidade",
            "detail": "perda de quem ele era antes de uma doença, acidente, fracasso ou mudança de vida"
          },
          {
            "label": "Luto de possibilidade",
            "detail": "a dor de um futuro que não vai acontecer — o filho que não nasceu, a carreira que não foi, o amor que não voltou"
          },
          {
            "label": "Luto de infância",
            "detail": "adultos que choram o que nunca tiveram — e nunca tiveram permissão de sentir falta"
          },
          {
            "label": "Vergonha da intensidade",
            "detail": "Não deveria sentir tanto por isso"
          },
          {
            "label": "Pressão do ambiente",
            "detail": "Já passou, segue em frente"
          },
          {
            "label": "Confusão sobre o objeto",
            "detail": "Mas eu nem gostava tanto assim"
          },
          {
            "label": "Valide sem comparar",
            "detail": "Perder isso dói de verdade"
          },
          {
            "label": "Frankl nos orienta",
            "detail": "cada perda é única no campo subjetivo de quem a vive"
          }
        ],
        "insights": [
          "O paciente que perdeu um emprego, um relacionamento, um sonho, uma fase da vida, uma identidade — está em luto.",
          "Mas raramente chega ao consultório usando essa palavra.",
          "Luto de relacionamento: fim de um vínculo que estruturava a identidade do paciente.",
          "Luto de identidade: perda de quem ele era antes de uma doença, acidente, fracasso ou mudança de vida.",
          "O que você perdeu que ainda não teve espaço para sentir de verdade?\" Dita com calma, após aliança estabelecida, essa pergunta produz um silêncio diferente dos outros.",
          "Muitos pacientes nunca foram perguntados isso.",
          "Vergonha da intensidade: \"Não deveria sentir tanto por isso.\" Pressão do ambiente: \"Já passou, segue em frente.\" Confusão sobre o objeto: \"Mas eu nem gostava tanto assim\" — quando na verdade gostava, e a negação é parte da defesa.",
          "Identificar qual dessas causas está operando no paciente específico direciona como você vai trabalhar.",
          "Não ofereça perspectiva antes da dor ter espaço.",
          "Valide sem comparar: \"Perder isso dói de verdade\" — sem escala, sem \"imagina quem perdeu mais.\" Frankl nos orienta: cada perda é única no campo subjetivo de quem a vive.",
          "Peça ao paciente que escreva uma carta para o que foi perdido — pessoa, fase, versão de si mesmo — sem intenção de enviar.",
          "Que escreva o que nunca disse, o que sentiu, o que gostaria que tivesse sido diferente."
        ],
        "focuses": [
          {
            "concept": "Luto Não É Só Morte — e Essa Confusão Atrasa o Tratamento",
            "point": "O paciente que perdeu um emprego, um relacionamento, um sonho, uma fase da vida, uma identidade — está em luto."
          },
          {
            "concept": "Os Lutos Invisíveis Que Você Vai Encontrar na Clínica",
            "point": "Luto de relacionamento: fim de um vínculo que estruturava a identidade do paciente."
          },
          {
            "concept": "A Pergunta Que Abre o Luto Invisível",
            "point": "O que você perdeu que ainda não teve espaço para sentir de verdade?\" Dita com calma, após aliança estabelecida, essa pergunta produz um silêncio diferente dos outros."
          },
          {
            "concept": "Por Que o Luto Trava — as Três Causas Principais",
            "point": "Vergonha da intensidade: \"Não deveria sentir tanto por isso.\" Pressão do ambiente: \"Já passou, segue em frente.\" Confusão sobre o objeto: \"Mas eu nem gostava tanto assim\" — quando na verdade gostava, e a negação é parte da defesa."
          },
          {
            "concept": "Como Criar Permissão para o Luto em Sessão",
            "point": "Não ofereça perspectiva antes da dor ter espaço."
          },
          {
            "concept": "Técnica: a Carta Que Nunca Será Enviada",
            "point": "Peça ao paciente que escreva uma carta para o que foi perdido — pessoa, fase, versão de si mesmo — sem intenção de enviar."
          }
        ]
      },
      {
        "id": "mod5-a2",
        "title": "Aula 2 — As Fases do Luto na Prática: O Que Fazer em Cada Uma",
        "theme": "As Fases do Luto na Prática: O Que Fazer em Cada Uma",
        "moduleTitle": "Módulo 5 — Luto: Clínica do Que Não Se Fala",
        "concepts": [
          "Use as Fases Como Mapa, Não Como Trilho",
          "Negação: o Que o Terapeuta Faz",
          "Raiva: Como Conter sem Suprimir",
          "Barganha e Culpa: a Armadilha do \"se Eu Tivesse...",
          "Depressão do Luto: Como Distinguir do Transtorno Depressivo",
          "Aceitação: o Que É e o Que Não É"
        ],
        "techniques": [
          "Trabalhe lateralmente",
          "Valide primeiro",
          "Frankl dizia"
        ],
        "techniqueDetails": [
          {
            "label": "Trabalhe lateralmente",
            "detail": "Como você tem passado?"
          },
          {
            "label": "Valide primeiro",
            "detail": "Faz sentido estar com raiva — você perdeu algo que importava muito"
          },
          {
            "label": "Frankl dizia",
            "detail": "o luto aceito transforma-se em gratidão pelo que existiu — e abre espaço para novos investimentos de sentido"
          }
        ],
        "insights": [
          "As fases de Kübler-Ross — negação, raiva, barganha, depressão, aceitação — são uma orientação clínica, não uma sequência obrigatória.",
          "O paciente pode oscilar entre elas, revisitar uma fase que parecia superada, ou apresentar várias ao mesmo tempo.",
          "Não confronte a negação diretamente — isso aumenta a resistência.",
          "A negação é proteção necessária enquanto o sistema nervoso absorve o impacto.",
          "A raiva no luto é frequentemente deslocada — o paciente sente raiva do médico que não salvou, do amigo que sumiu, de Deus, de si mesmo.",
          "Não tente racionalizar a raiva prematuramente.",
          "Se eu tivesse ligado antes.\" \"Se eu não tivesse feito isso.\" A barganha é a tentativa do psiquismo de recuperar controle sobre algo que foi irreversível.",
          "Não refute os \"ses\" — explore a função: \"Parece que você está tentando encontrar um ponto onde poderia ter mudado o resultado.",
          "A depressão do luto é contextualizada, flutuante, proporcional à perda e diretamente ligada ao que foi perdido.",
          "O paciente consegue identificar o porquê do sofrimento.",
          "É encontrar um lugar para ela na vida que não paralisa.",
          "O paciente em aceitação consegue lembrar sem ser destruído, pode integrar o que foi perdido como parte da sua história sem que isso roube o presente."
        ],
        "focuses": [
          {
            "concept": "Use as Fases Como Mapa, Não Como Trilho",
            "point": "As fases de Kübler-Ross — negação, raiva, barganha, depressão, aceitação — são uma orientação clínica, não uma sequência obrigatória."
          },
          {
            "concept": "Negação: o Que o Terapeuta Faz",
            "point": "Não confronte a negação diretamente — isso aumenta a resistência."
          },
          {
            "concept": "Raiva: Como Conter sem Suprimir",
            "point": "A raiva no luto é frequentemente deslocada — o paciente sente raiva do médico que não salvou, do amigo que sumiu, de Deus, de si mesmo."
          },
          {
            "concept": "Barganha e Culpa: a Armadilha do \"se Eu Tivesse...",
            "point": "Se eu tivesse ligado antes.\" \"Se eu não tivesse feito isso.\" A barganha é a tentativa do psiquismo de recuperar controle sobre algo que foi irreversível."
          },
          {
            "concept": "Depressão do Luto: Como Distinguir do Transtorno Depressivo",
            "point": "A depressão do luto é contextualizada, flutuante, proporcional à perda e diretamente ligada ao que foi perdido."
          },
          {
            "concept": "Aceitação: o Que É e o Que Não É",
            "point": "É encontrar um lugar para ela na vida que não paralisa."
          }
        ]
      },
      {
        "id": "mod5-a3",
        "title": "Aula 3 — Luto Complicado: Quando o Processo Travou",
        "theme": "Luto Complicado: Quando o Processo Travou",
        "moduleTitle": "Módulo 5 — Luto: Clínica do Que Não Se Fala",
        "concepts": [
          "Como Identificar o Luto Complicado",
          "Os Fatores Que Complicam o Luto",
          "Técnica: Reconstrução da Narrativa",
          "Técnica: Cadeira Vazia (adaptada)",
          "Quando Encaminhar para Avaliação Psiquiátrica",
          "O Marco da Virada: o Que Você Vê Quando Começa a Mover"
        ],
        "techniques": [
          "Perda traumática",
          "Vínculo ambivalente",
          "Luto não validado pelo ambiente",
          "Acúmulo de perdas",
          "Nomeie-os"
        ],
        "techniqueDetails": [
          {
            "label": "Perda traumática",
            "detail": "morte violenta, suicídio, acidente repentino — sem tempo de preparo ou despedida"
          },
          {
            "label": "Vínculo ambivalente",
            "detail": "o paciente tinha uma relação conflituosa com o que perdeu — a culpa e a raiva não resolvidas travam o processo"
          },
          {
            "label": "Luto não validado pelo ambiente",
            "detail": "Mas vocês já estavam separados"
          },
          {
            "label": "Acúmulo de perdas",
            "detail": "várias perdas simultâneas ou próximas sem tempo de processar cada uma"
          },
          {
            "label": "Nomeie-os",
            "detail": "Percebo que você está começando a retomar algumas coisas — como está sendo isso?"
          }
        ],
        "insights": [
          "O luto normal tem movimento — mesmo que lento e doloroso, avança.",
          "O luto complicado está estacionado: o paciente revive a perda com a mesma intensidade de quando aconteceu, meses ou anos depois.",
          "Perda traumática: morte violenta, suicídio, acidente repentino — sem tempo de preparo ou despedida.",
          "Vínculo ambivalente: o paciente tinha uma relação conflituosa com o que perdeu — a culpa e a raiva não resolvidas travam o processo.",
          "Peça que o paciente conte a história completa do que perdeu — desde o início.",
          "Essa reconstrução narrativa — trabalhada ao longo de várias sessões — permite que o paciente integre a perda dentro de uma história maior, em vez de manter apenas a cena do fim em loop.",
          "Com pacientes suficientemente estáveis, use a técnica da cadeira vazia: o paciente \"fala\" com o que foi perdido — diz o que nunca disse, o que precisava que fosse diferente, o que quer agradecer, o que ainda dói.",
          "Essa externalização emocional libera o que estava represado de forma que o discurso verbal não alcança.",
          "Luto complicado com mais de 12 meses de intensidade sem atenuação.",
          "Comprometimento grave do funcionamento (não consegue trabalhar, cuidar de si, manter relações básicas).",
          "O paciente começa a falar da perda sem chorar em cada frase.",
          "Consegue lembrar momentos bons sem culpa imediata."
        ],
        "focuses": [
          {
            "concept": "Como Identificar o Luto Complicado",
            "point": "O luto normal tem movimento — mesmo que lento e doloroso, avança."
          },
          {
            "concept": "Os Fatores Que Complicam o Luto",
            "point": "Perda traumática: morte violenta, suicídio, acidente repentino — sem tempo de preparo ou despedida."
          },
          {
            "concept": "Técnica: Reconstrução da Narrativa",
            "point": "Peça que o paciente conte a história completa do que perdeu — desde o início."
          },
          {
            "concept": "Técnica: Cadeira Vazia (adaptada)",
            "point": "Com pacientes suficientemente estáveis, use a técnica da cadeira vazia: o paciente \"fala\" com o que foi perdido — diz o que nunca disse, o que precisava que fosse diferente, o que quer agradecer, o que ainda dói."
          },
          {
            "concept": "Quando Encaminhar para Avaliação Psiquiátrica",
            "point": "Luto complicado com mais de 12 meses de intensidade sem atenuação."
          },
          {
            "concept": "O Marco da Virada: o Que Você Vê Quando Começa a Mover",
            "point": "O paciente começa a falar da perda sem chorar em cada frase."
          }
        ]
      },
      {
        "id": "mod5-a4",
        "title": "Aula 4 — Luto por Morte por Suicídio: Clínica Específica",
        "theme": "Luto por Morte por Suicídio: Clínica Específica",
        "moduleTitle": "Módulo 5 — Luto: Clínica do Que Não Se Fala",
        "concepts": [
          "Por Que Esse Luto É Diferente — e Exige Abordagem Própria",
          "A Culpa dos Sobreviventes — Como Trabalhar",
          "A Raiva do Que Partiu — Liberando o Que Não Se Pode Dizer",
          "O Estigma e o Isolamento — Trabalhando o Campo Social",
          "O Risco do Terapeuta: Contágio Traumático",
          "O Que Esse Paciente Mais Precisa do Terapeuta"
        ],
        "techniques": [],
        "techniqueDetails": [],
        "insights": [
          "Eu deveria ter percebido.\" \"Por que não liguei naquele dia?\" Não refute diretamente.",
          "Valide primeiro a dor por trás da culpa: \"Parece que você está carregando uma responsabilidade enorme por algo que estava além do seu controle.\" Depois, gradualmente: \"O que você sabia naquele momento?",
          "Muitos sobreviventes sentem raiva — e não podem dizer isso em lugar nenhum.",
          "Em sessão, crie o espaço: \"Às vezes quando alguém que amamos parte dessa forma, surgem sentimentos que parecem contraditórios — raiva, incompreensão.",
          "O paciente que não pode falar sobre a morte com ninguém ao redor carrega um luto em silêncio total — o que aumenta o risco de complicação.",
          "Quando possível, trabalhe também a ampliação da rede de suporte: grupos de sobreviventes de suicídio, se disponíveis, têm impacto clínico que o trabalho individual não consegue replicar.",
          "Esse luto tem potencial alto de traumatização vicária do terapeuta.",
          "Você vai absorver detalhes, imagens e narrativas de alto impacto.",
          "Presença sem urgência de \"resolver.\" Espaço para falar o que não pode falar em lugar nenhum.",
          "Permissão para todos os sentimentos — incluindo os contraditórios e os \"errados.\" Normalização do caos interno."
        ],
        "focuses": [
          {
            "concept": "A Culpa dos Sobreviventes — Como Trabalhar",
            "point": "Eu deveria ter percebido.\" \"Por que não liguei naquele dia?\" Não refute diretamente."
          },
          {
            "concept": "A Raiva do Que Partiu — Liberando o Que Não Se Pode Dizer",
            "point": "Muitos sobreviventes sentem raiva — e não podem dizer isso em lugar nenhum."
          },
          {
            "concept": "O Estigma e o Isolamento — Trabalhando o Campo Social",
            "point": "O paciente que não pode falar sobre a morte com ninguém ao redor carrega um luto em silêncio total — o que aumenta o risco de complicação."
          },
          {
            "concept": "O Risco do Terapeuta: Contágio Traumático",
            "point": "Esse luto tem potencial alto de traumatização vicária do terapeuta."
          },
          {
            "concept": "O Que Esse Paciente Mais Precisa do Terapeuta",
            "point": "Presença sem urgência de \"resolver.\" Espaço para falar o que não pode falar em lugar nenhum."
          }
        ]
      },
      {
        "id": "mod5-a5",
        "title": "Aula 5 — Regulação do Terapeuta Diante de Pacientes em Luto Intenso",
        "theme": "Regulação do Terapeuta Diante de Pacientes em Luto Intenso",
        "moduleTitle": "Módulo 5 — Luto: Clínica do Que Não Se Fala",
        "concepts": [
          "O Luto do Paciente Ativa o Luto do Terapeuta",
          "Como Reconhecer Que Você Está Sendo Afetado Demais",
          "Técnica de Descompressão Após Sessões Pesadas",
          "A Distinção Entre Compaixão e Fusão",
          "Seu Próprio Luto Não Resolvido Como Dado Clínico",
          "A Potência do Terapeuta Que Já Viveu Perdas"
        ],
        "techniques": [
          "Compaixão",
          "Fusão"
        ],
        "techniqueDetails": [
          {
            "label": "Compaixão",
            "detail": "você é afetado pela dor do paciente, permanecendo como sujeito distinto que pode ajudar"
          },
          {
            "label": "Fusão",
            "detail": "você se torna tão imerso no sofrimento que perde a perspectiva clínica e a capacidade de conter"
          }
        ],
        "insights": [
          "Acompanhar pacientes em luto intenso acessa invariavelmente as perdas do próprio terapeuta — as elaboradas, as que estão em processo e as que nunca foram completamente processadas.",
          "Isso não é fraqueza profissional — é o efeito inevitável da empatia genuína.",
          "Você pensa no paciente com frequência entre as sessões.",
          "As histórias que ele traz ficam com você depois do dia de trabalho.",
          "Após sessões de alto conteúdo emocional, não vá diretamente para a próxima.",
          "Crie um ritual de transição — mesmo que de 5 minutos: lave as mãos (âncora física de encerramento), faça três respirações longas, anote mentalmente uma coisa que ficou.",
          "Compaixão: você é afetado pela dor do paciente, permanecendo como sujeito distinto que pode ajudar.",
          "Fusão: você se torna tão imerso no sofrimento que perde a perspectiva clínica e a capacidade de conter.",
          "Se um tipo específico de luto — morte, separação, perda de identidade — te afeta consistentemente mais do que outros, esse é um dado que precisa ser levado para terapia pessoal e supervisão.",
          "Não é demérito — é informação sobre onde o seu campo interno precisa de cuidado.",
          "Quem conhece a dor do luto por dentro — e a elaborou suficientemente — tem uma qualidade de presença que não se ensina em nenhum manual.",
          "O paciente em luto percebe a diferença entre quem entende conceptualmente e quem sabe no corpo o que é perder algo que importa."
        ],
        "focuses": [
          {
            "concept": "O Luto do Paciente Ativa o Luto do Terapeuta",
            "point": "Acompanhar pacientes em luto intenso acessa invariavelmente as perdas do próprio terapeuta — as elaboradas, as que estão em processo e as que nunca foram completamente processadas."
          },
          {
            "concept": "Como Reconhecer Que Você Está Sendo Afetado Demais",
            "point": "Você pensa no paciente com frequência entre as sessões."
          },
          {
            "concept": "Técnica de Descompressão Após Sessões Pesadas",
            "point": "Após sessões de alto conteúdo emocional, não vá diretamente para a próxima."
          },
          {
            "concept": "A Distinção Entre Compaixão e Fusão",
            "point": "Compaixão: você é afetado pela dor do paciente, permanecendo como sujeito distinto que pode ajudar."
          },
          {
            "concept": "Seu Próprio Luto Não Resolvido Como Dado Clínico",
            "point": "Se um tipo específico de luto — morte, separação, perda de identidade — te afeta consistentemente mais do que outros, esse é um dado que precisa ser levado para terapia pessoal e supervisão."
          },
          {
            "concept": "A Potência do Terapeuta Que Já Viveu Perdas",
            "point": "Quem conhece a dor do luto por dentro — e a elaborou suficientemente — tem uma qualidade de presença que não se ensina em nenhum manual."
          }
        ]
      }
    ]
  },
  {
    "id": "mod6",
    "title": "Módulo 6 — Vícios e Compulsões",
    "lessons": [
      {
        "id": "mod6-a1",
        "title": "Aula 1 — O Que Sustenta o Vício: A Lógica por Trás da Repetição",
        "theme": "O Que Sustenta o Vício: A Lógica por Trás da Repetição",
        "moduleTitle": "Módulo 6 — Vícios e Compulsões",
        "concepts": [
          "O Vício Não É Fraqueza de Caráter — É Solução para uma Dor",
          "O Ciclo do Vício em Quatro Momentos",
          "A Pergunta Que Muda o Campo",
          "Os Vícios Relacionais: Amor e Apego Compulsivo",
          "Como o Terapeuta Pode Inadvertidamente Alimentar o Ciclo",
          "Redução de Danos Como Estratégia Clínica"
        ],
        "techniques": [
          "Gatilho",
          "Urgência",
          "Comportamento",
          "Alívio seguido de culpa",
          "Frankl nos orienta"
        ],
        "techniqueDetails": [
          {
            "label": "Gatilho",
            "detail": "situação interna (solidão, ansiedade, vergonha, tédio) ou externa (pessoas, lugares, horários)"
          },
          {
            "label": "Urgência",
            "detail": "a pressão crescente que pede o comportamento"
          },
          {
            "label": "Comportamento",
            "detail": "o uso ou a compulsão"
          },
          {
            "label": "Alívio seguido de culpa",
            "detail": "o ciclo reinicia, frequentemente com a culpa se tornando o próximo gatilho"
          },
          {
            "label": "Frankl nos orienta",
            "detail": "cada pequena escolha consciente no ciclo — mesmo que não seja abstinência — é um exercício da liberdade humana sobre os condicionamentos"
          }
        ],
        "insights": [
          "O paciente que usa substância, jogo, pornografia, compras ou qualquer outra compulsão não é irresponsável.",
          "Ele encontrou algo que funciona — temporariamente — para aliviar uma dor que não sabe como carregar de outra forma.",
          "Gatilho: situação interna (solidão, ansiedade, vergonha, tédio) ou externa (pessoas, lugares, horários).",
          "Urgência: a pressão crescente que pede o comportamento.",
          "Em vez de \"por que você não para?\", pergunte: \"O que acontece em você nos momentos antes de [comportamento]?",
          "O que você está sentindo?\" Essa inversão direciona o trabalho para a causa, não para a consequência — e o paciente para de se sentir julgado e começa a se sentir compreendido.",
          "O paciente que volta para relacionamentos destrutivos repetidamente, que não consegue encerrar vínculos que causam dano, que usa o outro como regulador emocional constante — está num padrão compulsivo relacional.",
          "A abordagem é a mesma: qual dor esse vínculo está aliviando?",
          "Focar excessivamente nos comportamentos de uso em vez do sistema emocional por trás.",
          "Criar expectativas de abstinência prematura que, quando quebradas, aumentam a vergonha — que alimenta o ciclo.",
          "Abstinência imediata não é sempre possível nem sempre o objetivo inicial.",
          "Redução de danos significa trabalhar para que o comportamento cause menos prejuízo enquanto o trabalho de fundo avança."
        ],
        "focuses": [
          {
            "concept": "O Vício Não É Fraqueza de Caráter — É Solução para uma Dor",
            "point": "O paciente que usa substância, jogo, pornografia, compras ou qualquer outra compulsão não é irresponsável."
          },
          {
            "concept": "O Ciclo do Vício em Quatro Momentos",
            "point": "Gatilho: situação interna (solidão, ansiedade, vergonha, tédio) ou externa (pessoas, lugares, horários)."
          },
          {
            "concept": "A Pergunta Que Muda o Campo",
            "point": "Em vez de \"por que você não para?\", pergunte: \"O que acontece em você nos momentos antes de [comportamento]?"
          },
          {
            "concept": "Os Vícios Relacionais: Amor e Apego Compulsivo",
            "point": "O paciente que volta para relacionamentos destrutivos repetidamente, que não consegue encerrar vínculos que causam dano, que usa o outro como regulador emocional constante — está num padrão compulsivo relacional."
          },
          {
            "concept": "Como o Terapeuta Pode Inadvertidamente Alimentar o Ciclo",
            "point": "Focar excessivamente nos comportamentos de uso em vez do sistema emocional por trás."
          },
          {
            "concept": "Redução de Danos Como Estratégia Clínica",
            "point": "Abstinência imediata não é sempre possível nem sempre o objetivo inicial."
          }
        ]
      },
      {
        "id": "mod6-a2",
        "title": "Aula 2 — Mapeando Gatilhos: O Protocolo que Você Usa na Segunda Sessão",
        "theme": "Mapeando Gatilhos: O Protocolo que Você Usa na Segunda Sessão",
        "moduleTitle": "Módulo 6 — Vícios e Compulsões",
        "concepts": [
          "Por Que Mapear Gatilhos É o Primeiro Trabalho Concreto",
          "Categorias de Gatilhos para Explorar em Sessão",
          "Ferramenta Prática: o Diário de Gatilhos",
          "A Janela de Oportunidade: o Espaço Entre o Gatilho e o Comportamento",
          "Como Usar o Mapa de Gatilhos para Planejar Intervenções",
          "O Gatilho Mais Perigoso: a Crença de Que Está Curado"
        ],
        "techniques": [
          "Emocionais",
          "Situacionais",
          "Registra",
          "Trabalhe isso explicitamente"
        ],
        "techniqueDetails": [
          {
            "label": "Emocionais",
            "detail": "quais estados internos precedem o comportamento? (Solidão, tédio, ansiedade, vergonha, raiva, sensação de fracasso)"
          },
          {
            "label": "Situacionais",
            "detail": "quais ambientes, horários, dias da semana estão associados? Sociais: quais pessoas ou tipos de interação disparam o ciclo? Cognitivos: quais pensament"
          },
          {
            "label": "Registra",
            "detail": "o horário, o estado emocional, o que estava acontecendo, o que pensou, o que fez"
          },
          {
            "label": "Trabalhe isso explicitamente",
            "detail": "a ausência de urgência não significa ausência de vulnerabilidade"
          }
        ],
        "insights": [
          "O paciente que quer parar de usar, mas não conhece seus gatilhos, está navegando sem mapa.",
          "Ele vai falhar não por falta de vontade — mas porque o ciclo avançou até o comportamento antes que ele percebesse que havia começado.",
          "Emocionais: quais estados internos precedem o comportamento? (Solidão, tédio, ansiedade, vergonha, raiva, sensação de fracasso).",
          "Situacionais: quais ambientes, horários, dias da semana estão associados?",
          "Peça que o paciente registre, durante uma semana, toda vez que sentir urgência — mesmo que não aja.",
          "Registra: o horário, o estado emocional, o que estava acontecendo, o que pensou, o que fez.",
          "No início do processo, essa janela pode ser de segundos.",
          "O objetivo não é eliminar o gatilho — é ampliar o espaço entre ele e o comportamento o suficiente para que uma escolha seja possível.",
          "Uma vez que os gatilhos estão mapeados, planeje com o paciente: para cada categoria de gatilho, qual estratégia de resposta alternativa?",
          "Para solidão: qual recurso social pode ser ativado?",
          "Pacientes com histórico de vício frequentemente relaxam os cuidados quando estão bem por um período.",
          "Já estou diferente, consigo controlar.\" Esse é o momento de maior risco — não de menor."
        ],
        "focuses": [
          {
            "concept": "Por Que Mapear Gatilhos É o Primeiro Trabalho Concreto",
            "point": "O paciente que quer parar de usar, mas não conhece seus gatilhos, está navegando sem mapa."
          },
          {
            "concept": "Categorias de Gatilhos para Explorar em Sessão",
            "point": "Emocionais: quais estados internos precedem o comportamento? (Solidão, tédio, ansiedade, vergonha, raiva, sensação de fracasso)."
          },
          {
            "concept": "Ferramenta Prática: o Diário de Gatilhos",
            "point": "Peça que o paciente registre, durante uma semana, toda vez que sentir urgência — mesmo que não aja."
          },
          {
            "concept": "A Janela de Oportunidade: o Espaço Entre o Gatilho e o Comportamento",
            "point": "No início do processo, essa janela pode ser de segundos."
          },
          {
            "concept": "Como Usar o Mapa de Gatilhos para Planejar Intervenções",
            "point": "Uma vez que os gatilhos estão mapeados, planeje com o paciente: para cada categoria de gatilho, qual estratégia de resposta alternativa?"
          },
          {
            "concept": "O Gatilho Mais Perigoso: a Crença de Que Está Curado",
            "point": "Pacientes com histórico de vício frequentemente relaxam os cuidados quando estão bem por um período."
          }
        ]
      },
      {
        "id": "mod6-a3",
        "title": "Aula 3 — Recaída Não É Fracasso — Como Usar Como Dado Clínico",
        "theme": "Recaída Não É Fracasso — Como Usar Como Dado Clínico",
        "moduleTitle": "Módulo 6 — Vícios e Compulsões",
        "concepts": [
          "A Recaída Como Parte do Processo — Não Como Fim",
          "Como Receber a Notícia da Recaída em Sessão",
          "Análise Funcional da Recaída — Passo a Passo",
          "O Efeito Violação da Abstinência — Nomeie Antes Que Aconteça",
          "Quando a Recaída Sinaliza Que o Trabalho Precisa Mudar",
          "A Conversa Que o Paciente Precisa Ouvir"
        ],
        "techniques": [
          "Nomeie esse efeito preventivamente"
        ],
        "techniqueDetails": [
          {
            "label": "Nomeie esse efeito preventivamente",
            "detail": "Se em algum momento você ceder e usar, o que você vai fazer logo depois?"
          }
        ],
        "insights": [
          "A recaída é estatisticamente parte da maioria dos processos de mudança de comportamento compulsivo.",
          "Tratá-la como fracasso — pelo terapeuta ou pelo paciente — aumenta a vergonha, que é frequentemente o maior gatilho de todas.",
          "Não normalize de forma que pareça que não importa.",
          "O que o paciente estava sentindo nas horas antes?",
          "Qual foi o pensamento imediatamente antes de ceder?",
          "Muitos pacientes, ao recair, pensam: \"Já que estraguei tudo, tanto faz continuar.\" Isso transforma uma recaída isolada em espiral.",
          "Nomeie esse efeito preventivamente: \"Se em algum momento você ceder e usar, o que você vai fazer logo depois?\" Planejar a resposta à recaída antes que ela aconteça é uma das intervenções mais eficazes da clínica de vícios.",
          "Recaídas frequentes no mesmo gatilho indicam que aquele gatilho específico não está sendo suficientemente trabalhado.",
          "Recaídas após períodos de estresse intenso indicam que o trabalho de regulação emocional precisa ser aprofundado.",
          "Você não falhou — o processo está acontecendo.",
          "O que aconteceu ontem nos diz onde o trabalho precisa ir agora."
        ],
        "focuses": [
          {
            "concept": "A Recaída Como Parte do Processo — Não Como Fim",
            "point": "A recaída é estatisticamente parte da maioria dos processos de mudança de comportamento compulsivo."
          },
          {
            "concept": "Como Receber a Notícia da Recaída em Sessão",
            "point": "Não normalize de forma que pareça que não importa."
          },
          {
            "concept": "Análise Funcional da Recaída — Passo a Passo",
            "point": "O que o paciente estava sentindo nas horas antes?"
          },
          {
            "concept": "O Efeito Violação da Abstinência — Nomeie Antes Que Aconteça",
            "point": "Muitos pacientes, ao recair, pensam: \"Já que estraguei tudo, tanto faz continuar.\" Isso transforma uma recaída isolada em espiral."
          },
          {
            "concept": "Quando a Recaída Sinaliza Que o Trabalho Precisa Mudar",
            "point": "Recaídas frequentes no mesmo gatilho indicam que aquele gatilho específico não está sendo suficientemente trabalhado."
          },
          {
            "concept": "A Conversa Que o Paciente Precisa Ouvir",
            "point": "Você não falhou — o processo está acontecendo."
          }
        ]
      },
      {
        "id": "mod6-a4",
        "title": "Aula 4 — Compulsão Alimentar e Corpo: Trabalho Integrado",
        "theme": "Compulsão Alimentar e Corpo: Trabalho Integrado",
        "moduleTitle": "Módulo 6 — Vícios e Compulsões",
        "concepts": [
          "Comida Como Linguagem Emocional",
          "A Relação Corpo — Emoção no Comportamento Compulsivo",
          "Como Distinguir Fome Real de Fome Emocional em Sessão",
          "O Papel da Vergonha no Ciclo Compulsivo Alimentar",
          "Quando Encaminhar para Avaliação Especializada",
          "A Técnica da Pausa Intencional Antes de Comer"
        ],
        "techniques": [
          "Engel nos orienta",
          "Estabeleça como prática"
        ],
        "techniqueDetails": [
          {
            "label": "Engel nos orienta",
            "detail": "o corpo é parte do campo, não apenas um veículo do psiquismo"
          },
          {
            "label": "Estabeleça como prática",
            "detail": "antes de qualquer episódio de comer fora de horário de refeição, o paciente para por 5 minutos e pergunta:"
          }
        ],
        "insights": [
          "A compulsão alimentar raramente é sobre fome.",
          "É sobre regulação emocional: o paciente come quando está ansioso, entediado, sozinho, ou quando precisa de conforto que não sabe como buscar de outra forma.",
          "Engel nos orienta: o corpo é parte do campo, não apenas um veículo do psiquismo.",
          "O paciente com compulsão alimentar frequentemente tem uma relação dissociada com o próprio corpo — come sem sentir, come sem fome, come sem prazer.",
          "Trabalhe com o paciente a distinção prática: fome física aparece gradualmente, pode esperar, é satisfeita com qualquer alimento.",
          "Fome emocional aparece de repente, é urgente, pede alimentos específicos (geralmente os de maior conforto associado) e não é satisfeita — o paciente come e continua querendo.",
          "A vergonha sobre o corpo e sobre o comportamento alimentar é muitas vezes o maior obstáculo do tratamento — e também um gatilho importante do ciclo.",
          "O paciente se olha no espelho, sente vergonha, e essa vergonha dispara o comportamento que causa mais vergonha.",
          "Perda ou ganho de peso significativo em curto período.",
          "Comportamentos purgativos — vômito, laxantes, exercício compulsivo.",
          "Estabeleça como prática: antes de qualquer episódio de comer fora de horário de refeição, o paciente para por 5 minutos e pergunta: \"O que estou sentindo agora?",
          "Estou com fome física ou com alguma coisa que precisa de atenção?\" Essa pausa não impede o comportamento — mas cria consciência onde havia automatismo."
        ],
        "focuses": [
          {
            "concept": "Comida Como Linguagem Emocional",
            "point": "A compulsão alimentar raramente é sobre fome."
          },
          {
            "concept": "A Relação Corpo — Emoção no Comportamento Compulsivo",
            "point": "Engel nos orienta: o corpo é parte do campo, não apenas um veículo do psiquismo."
          },
          {
            "concept": "Como Distinguir Fome Real de Fome Emocional em Sessão",
            "point": "Trabalhe com o paciente a distinção prática: fome física aparece gradualmente, pode esperar, é satisfeita com qualquer alimento."
          },
          {
            "concept": "O Papel da Vergonha no Ciclo Compulsivo Alimentar",
            "point": "A vergonha sobre o corpo e sobre o comportamento alimentar é muitas vezes o maior obstáculo do tratamento — e também um gatilho importante do ciclo."
          },
          {
            "concept": "Quando Encaminhar para Avaliação Especializada",
            "point": "Perda ou ganho de peso significativo em curto período."
          },
          {
            "concept": "A Técnica da Pausa Intencional Antes de Comer",
            "point": "Estabeleça como prática: antes de qualquer episódio de comer fora de horário de refeição, o paciente para por 5 minutos e pergunta: \"O que estou sentindo agora?"
          }
        ]
      },
      {
        "id": "mod6-a5",
        "title": "Aula 5 — Construindo a Vida que Compete com o Vício",
        "theme": "Construindo a Vida que Compete com o Vício",
        "moduleTitle": "Módulo 6 — Vícios e Compulsões",
        "concepts": [
          "O Vazio Que o Vício Preenchia Precisa de Outra Coisa",
          "Frankl Como Bússola: Sentido Como Antídoto",
          "Mapeando o Que Foi Abandonado por Causa do Vício",
          "Construindo a Rede de Suporte Real",
          "Pequenas Vitórias Como Estrutura de Reforço",
          "O Objetivo Final: uma Vida Que Não Precisa de Escape"
        ],
        "techniques": [
          "Pergunte"
        ],
        "techniqueDetails": [
          {
            "label": "Pergunte",
            "detail": "O que você deixou de fazer por causa disso? O que você era antes que gostava e foi parando?"
          }
        ],
        "insights": [
          "A abstinência sem substituição cria um vácuo.",
          "O paciente que para de usar, jogo, ou comprar sem construir algo que ofereça regulação, conexão e sentido vai encontrar esse vácuo intolerável — e o vício vai parecer a única saída disponível.",
          "Frankl observou em situações extremas o que a clínica do vício confirma cotidianamente: o ser humano com sentido e propósito real tem resistência ao comportamento compulsivo que não pode ser replicada por nenhuma técnica comportamental.",
          "Parte do trabalho de longo prazo é ajudar o paciente a construir uma vida que ele não queira escapar — uma vida que valha a pena estar presente nela.",
          "Pergunte: \"O que você deixou de fazer por causa disso?",
          "O que você era antes que gostava e foi parando?\" Relacionamentos que foram deteriorando.",
          "A recuperação exige conexão — não necessariamente grupo de apoio formal, mas vínculos reais onde o paciente pode ser visto sem a máscara da vergonha.",
          "Trabalhe com o paciente: quem na sua vida sabe o que você está passando?",
          "O sistema de recompensa do paciente com histórico de vício foi calibrado para recompensas imediatas e intensas.",
          "Vitórias pequenas parecem insignificantes comparadas a esse padrão.",
          "A recuperação completa não é a ausência permanente de urgência — é a construção de uma vida suficientemente rica, conectada e com sentido para que a urgência, quando aparecer, não seja a única opção disponível.",
          "Winnicott chamaria de \"vida valendo a pena ser vivida.\" Frankl chamaria de \"vontade de sentido ativa.\" Na prática, é o paciente que acorda de manhã com razões para estar presente."
        ],
        "focuses": [
          {
            "concept": "O Vazio Que o Vício Preenchia Precisa de Outra Coisa",
            "point": "A abstinência sem substituição cria um vácuo."
          },
          {
            "concept": "Frankl Como Bússola: Sentido Como Antídoto",
            "point": "Frankl observou em situações extremas o que a clínica do vício confirma cotidianamente: o ser humano com sentido e propósito real tem resistência ao comportamento compulsivo que não pode ser replicada por nenhuma técnica comportamental."
          },
          {
            "concept": "Mapeando o Que Foi Abandonado por Causa do Vício",
            "point": "Pergunte: \"O que você deixou de fazer por causa disso?"
          },
          {
            "concept": "Construindo a Rede de Suporte Real",
            "point": "A recuperação exige conexão — não necessariamente grupo de apoio formal, mas vínculos reais onde o paciente pode ser visto sem a máscara da vergonha."
          },
          {
            "concept": "Pequenas Vitórias Como Estrutura de Reforço",
            "point": "O sistema de recompensa do paciente com histórico de vício foi calibrado para recompensas imediatas e intensas."
          },
          {
            "concept": "O Objetivo Final: uma Vida Que Não Precisa de Escape",
            "point": "A recuperação completa não é a ausência permanente de urgência — é a construção de uma vida suficientemente rica, conectada e com sentido para que a urgência, quando aparecer, não seja a única opção disponível."
          }
        ]
      }
    ]
  },
  {
    "id": "mod7",
    "title": "Módulo 7 — Depressão: Clínica da Ausência",
    "lessons": [
      {
        "id": "mod7-a1",
        "title": "Aula 1 — Reconhecer Depressão Antes do Diagnóstico Formal",
        "theme": "Reconhecer Depressão Antes do Diagnóstico Formal",
        "moduleTitle": "Módulo 7 — Depressão: Clínica da Ausência",
        "concepts": [
          "Depressão Nem Sempre Parece Tristeza",
          "Os Sinais Que Você Observa — Não o Que o Paciente Declara",
          "A Pergunta Direta Sobre Ideação — e Como Fazê — La sem Criar Crise",
          "Depressão Reativa Vs. Depressão Endógena — a Distinção Prática",
          "O Que Nunca Dizer ao Paciente Deprimido",
          "O Que o Paciente Deprimido Mais Precisa do Terapeuta"
        ],
        "techniques": [
          "Observe",
          "Use diretamente",
          "Depressão reativa",
          "Depressão endógena",
          "Winnicott"
        ],
        "techniqueDetails": [
          {
            "label": "Observe",
            "detail": "redução do prazer em coisas que antes agradavam (anedonia)"
          },
          {
            "label": "Use diretamente",
            "detail": "Quando as coisas ficam muito pesadas, você tem tido pensamentos de que não quer mais estar aqui?"
          },
          {
            "label": "Depressão reativa",
            "detail": "há um evento ou conjunto de eventos identificáveis que a precipitaram"
          },
          {
            "label": "Depressão endógena",
            "detail": "surge"
          },
          {
            "label": "Winnicott",
            "detail": "o ambiente que simplesmente sustenta — sem cobrar, sem animar artificialmente — é muitas vezes o que começa a restaurar a capacidade do paciente de se"
          }
        ],
        "insights": [
          "O paciente deprimido frequentemente não chora em sessão.",
          "Pode chegar irritado, entorpecido, funcionando bem no trabalho mas completamente vazio em casa.",
          "Observe: redução do prazer em coisas que antes agradavam (anedonia).",
          "Lentidão no processamento — respostas mais lentas, menos energia verbal.",
          "Perguntar sobre ideação suicida não planta a ideia — alivia o isolamento de quem já está pensando nisso.",
          "Use diretamente: \"Quando as coisas ficam muito pesadas, você tem tido pensamentos de que não quer mais estar aqui?\" Dito com calma, sem alarme, essa pergunta cria espaço para uma resposta honesta.",
          "Depressão reativa: há um evento ou conjunto de eventos identificáveis que a precipitaram.",
          "Depressão endógena: surge \"do nada\", sem desencadeante claro, com componente biológico importante.",
          "Não precisa de soluções — precisa de presença.",
          "Não precisa de otimismo — precisa de honestidade."
        ],
        "focuses": [
          {
            "concept": "Depressão Nem Sempre Parece Tristeza",
            "point": "O paciente deprimido frequentemente não chora em sessão."
          },
          {
            "concept": "Os Sinais Que Você Observa — Não o Que o Paciente Declara",
            "point": "Observe: redução do prazer em coisas que antes agradavam (anedonia)."
          },
          {
            "concept": "A Pergunta Direta Sobre Ideação — e Como Fazê — La sem Criar Crise",
            "point": "Perguntar sobre ideação suicida não planta a ideia — alivia o isolamento de quem já está pensando nisso."
          },
          {
            "concept": "Depressão Reativa Vs. Depressão Endógena — a Distinção Prática",
            "point": "Depressão reativa: há um evento ou conjunto de eventos identificáveis que a precipitaram."
          },
          {
            "concept": "O Que o Paciente Deprimido Mais Precisa do Terapeuta",
            "point": "Não precisa de soluções — precisa de presença."
          }
        ]
      },
      {
        "id": "mod7-a2",
        "title": "Aula 2 — Ativação Comportamental: A Técnica Principal na Depressão",
        "theme": "Ativação Comportamental: A Técnica Principal na Depressão",
        "moduleTitle": "Módulo 7 — Depressão: Clínica da Ausência",
        "concepts": [
          "Por Que a Ativação Comportamental É Tão Eficaz",
          "Como Implementar Gradualmente — sem Sobrecarregar",
          "A Hierarquia de Ativação: do Mais Fácil ao Mais Significativo",
          "O Registro de Humor e Atividade — por Que Funciona",
          "Quando o Paciente Dizque \"não Adianta Tentar",
          "O Ritmo do Terapeuta em Sessões de Depressão"
        ],
        "techniques": [
          "Proponha como experimento"
        ],
        "techniqueDetails": [
          {
            "label": "Proponha como experimento",
            "detail": "Você talvez tenha razão"
          }
        ],
        "insights": [
          "A depressão cria um ciclo de retirada: o paciente não tem energia para fazer coisas, para de fazer coisas, fica ainda mais sem energia e ainda mais isolado.",
          "A ativação comportamental interrompe esse ciclo pelo comportamento — não pela emoção.",
          "Comece com uma única ação, pequena, que o paciente considera possível — não fácil, possível.",
          "Não precisa ser prazerosa de imediato — só precisa ser feita.",
          "Construa com o paciente uma lista de atividades em três níveis: atividades de baixo esforço e baixo prazer — mas factíveis (tomar banho, sair de casa por 15 minutos).",
          "Atividades de prazer moderado que ele abandonou (música, conversa com alguém específico).",
          "Peça que o paciente registre, durante duas semanas: o que fez em cada período do dia e qual era seu nível de energia e humor (escala de 1 a 10).",
          "Isso revela padrões que o paciente geralmente não percebe: certos horários onde a energia é maior, certas atividades que sempre levam a uma leve melhora de humor.",
          "Essa crença — o pessimismo antecipatório — é um sintoma da depressão, não uma observação objetiva.",
          "Proponha como experimento: \"Você talvez tenha razão.",
          "Deprimidos precisam de ritmo mais lento — pausas maiores, menos perguntas por sessão, mais espaço para processar.",
          "Se você está acelerando a sessão porque o silêncio te desconforta, você está respondendo à sua própria ansiedade, não às necessidades do paciente."
        ],
        "focuses": [
          {
            "concept": "Por Que a Ativação Comportamental É Tão Eficaz",
            "point": "A depressão cria um ciclo de retirada: o paciente não tem energia para fazer coisas, para de fazer coisas, fica ainda mais sem energia e ainda mais isolado."
          },
          {
            "concept": "Como Implementar Gradualmente — sem Sobrecarregar",
            "point": "Comece com uma única ação, pequena, que o paciente considera possível — não fácil, possível."
          },
          {
            "concept": "A Hierarquia de Ativação: do Mais Fácil ao Mais Significativo",
            "point": "Construa com o paciente uma lista de atividades em três níveis: atividades de baixo esforço e baixo prazer — mas factíveis (tomar banho, sair de casa por 15 minutos)."
          },
          {
            "concept": "O Registro de Humor e Atividade — por Que Funciona",
            "point": "Peça que o paciente registre, durante duas semanas: o que fez em cada período do dia e qual era seu nível de energia e humor (escala de 1 a 10)."
          },
          {
            "concept": "Quando o Paciente Dizque \"não Adianta Tentar",
            "point": "Essa crença — o pessimismo antecipatório — é um sintoma da depressão, não uma observação objetiva."
          },
          {
            "concept": "O Ritmo do Terapeuta em Sessões de Depressão",
            "point": "Deprimidos precisam de ritmo mais lento — pausas maiores, menos perguntas por sessão, mais espaço para processar."
          }
        ]
      },
      {
        "id": "mod7-a3",
        "title": "Aula 3 — Crenças Centrais na Depressão: Como Acessar e Trabalhar",
        "theme": "Crenças Centrais na Depressão: Como Acessar e Trabalhar",
        "moduleTitle": "Módulo 7 — Depressão: Clínica da Ausência",
        "concepts": [
          "As Três Crenças Centrais Que Sustentam a Depressão",
          "Como Acessar a Crença Central — sem Teorizar em Sessão",
          "A Técnica da Seta Descendente",
          "Testando a Crença na Realidade — o Experimento Comportamental",
          "Como Manejar a Resistência ao Questionamento das Crenças",
          "O Papel de Frankl: Sentido Como Recurso Cognitivo"
        ],
        "techniques": [
          "Aaron Beck identificou clinicamente",
          "Use"
        ],
        "techniqueDetails": [
          {
            "label": "Aaron Beck identificou clinicamente",
            "detail": "o paciente deprimido tem visão negativa de si mesmo ("
          },
          {
            "label": "Use",
            "detail": "Não estou dizendo que você está errado — estou curioso se essa é a história completa, ou se existe alguma exceção que não cabe nela"
          }
        ],
        "insights": [
          "Aaron Beck identificou clinicamente: o paciente deprimido tem visão negativa de si mesmo (\"sou inadequado, sem valor\"), do mundo (\"o ambiente é hostil e sem recursos\") e do futuro (\"nada vai melhorar\").",
          "Essa tríade cognitiva não é pensamento consciente — é a lente através da qual toda experiência é filtrada.",
          "Não pergunte \"qual é sua crença central sobre si mesmo?\" — isso soa acadêmico e o paciente não sabe responder.",
          "A partir daqui o trabalho cognitivo pode começar de verdade.",
          "A crença \"sou um fardo para todos ao meu redor\" precisa ser testada — não argumentada.",
          "Construa com o paciente um experimento simples: entre em contato com uma pessoa específica e observe a resposta real.",
          "O paciente deprimido frequentemente resiste ao questionamento de suas crenças negativas — porque essas crenças se tornaram sua identidade.",
          "Mas é assim que eu sou.\" Não confronte essa identidade diretamente.",
          "Frankl nos oferece uma intervenção específica para a crença \"nada vai melhorar\": ajudar o paciente a encontrar uma razão — por menor que seja — para que amanhã seja diferente.",
          "Não otimismo genérico — um sentido específico."
        ],
        "focuses": [
          {
            "concept": "As Três Crenças Centrais Que Sustentam a Depressão",
            "point": "Aaron Beck identificou clinicamente: o paciente deprimido tem visão negativa de si mesmo (\"sou inadequado, sem valor\"), do mundo (\"o ambiente é hostil e sem recursos\") e do futuro (\"nada vai melhorar\")."
          },
          {
            "concept": "Como Acessar a Crença Central — sem Teorizar em Sessão",
            "point": "Não pergunte \"qual é sua crença central sobre si mesmo?\" — isso soa acadêmico e o paciente não sabe responder."
          },
          {
            "concept": "A Técnica da Seta Descendente",
            "point": "A partir daqui o trabalho cognitivo pode começar de verdade."
          },
          {
            "concept": "Testando a Crença na Realidade — o Experimento Comportamental",
            "point": "A crença \"sou um fardo para todos ao meu redor\" precisa ser testada — não argumentada."
          },
          {
            "concept": "Como Manejar a Resistência ao Questionamento das Crenças",
            "point": "O paciente deprimido frequentemente resiste ao questionamento de suas crenças negativas — porque essas crenças se tornaram sua identidade."
          },
          {
            "concept": "O Papel de Frankl: Sentido Como Recurso Cognitivo",
            "point": "Frankl nos oferece uma intervenção específica para a crença \"nada vai melhorar\": ajudar o paciente a encontrar uma razão — por menor que seja — para que amanhã seja diferente."
          }
        ]
      },
      {
        "id": "mod7-a4",
        "title": "Aula 4 — Depressão e Corpo: O Que a Biologia Pede",
        "theme": "Depressão e Corpo: O Que a Biologia Pede",
        "moduleTitle": "Módulo 7 — Depressão: Clínica da Ausência",
        "concepts": [
          "A Depressão Vive no Corpo — Não Só na Mente",
          "O Sono Como Prioridade Biológica",
          "Exercício Como Intervenção — a Evidência É Forte",
          "Quando a Psicoterapia Sozinha Não Basta",
          "Como Falar Sobre Medicação sem Criar Resistência Ou Dependência",
          "Retomada do Corpo Como Aliado — Não Como Inimigo"
        ],
        "techniques": [
          "Engel nos ensina"
        ],
        "techniqueDetails": [
          {
            "label": "Engel nos ensina",
            "detail": "tratar a depressão ignorando o corpo é tratar metade do problema"
          }
        ],
        "insights": [
          "O corpo deprimido é lento, pesado, com sono desequilibrado, apetite alterado, dores físicas sem causa orgânica.",
          "Engel nos ensina: tratar a depressão ignorando o corpo é tratar metade do problema.",
          "A privação de sono intensifica todos os sintomas depressivos.",
          "Pacientes deprimidos frequentemente dormem muito e mal ao mesmo tempo — muito tempo na cama, baixa qualidade do sono.",
          "Meta-análises consistentemente mostram que exercício aeróbico regular tem efeito comparável a antidepressivos leves em quadros moderados.",
          "Não porque resolve as causas — mas porque regula neuroquímica, interrompe o ciclo de retirada, devolve senso de eficácia e oferece um campo de regulação emocional.",
          "Depressão moderada a grave com componente biológico forte — especialmente com anedonia persistente, alterações de sono e apetite severas, ideação suicida — precisa de avaliação psiquiátrica.",
          "Isso não é admissão de derrota — é avaliação correta do campo.",
          "Muitos pacientes chegam com medo de medicação (\"vou ficar dependente\", \"vou mudar quem sou\").",
          "Outros chegam querendo só o remédio, sem trabalho psicológico.",
          "O paciente deprimido frequentemente tem uma relação hostil com o próprio corpo — o corpo que está pesado, que não quer sair da cama, que parece trair.",
          "Parte do trabalho é reintroduzir o corpo como recurso, não como obstáculo."
        ],
        "focuses": [
          {
            "concept": "A Depressão Vive no Corpo — Não Só na Mente",
            "point": "O corpo deprimido é lento, pesado, com sono desequilibrado, apetite alterado, dores físicas sem causa orgânica."
          },
          {
            "concept": "O Sono Como Prioridade Biológica",
            "point": "A privação de sono intensifica todos os sintomas depressivos."
          },
          {
            "concept": "Exercício Como Intervenção — a Evidência É Forte",
            "point": "Meta-análises consistentemente mostram que exercício aeróbico regular tem efeito comparável a antidepressivos leves em quadros moderados."
          },
          {
            "concept": "Quando a Psicoterapia Sozinha Não Basta",
            "point": "Depressão moderada a grave com componente biológico forte — especialmente com anedonia persistente, alterações de sono e apetite severas, ideação suicida — precisa de avaliação psiquiátrica."
          },
          {
            "concept": "Como Falar Sobre Medicação sem Criar Resistência Ou Dependência",
            "point": "Muitos pacientes chegam com medo de medicação (\"vou ficar dependente\", \"vou mudar quem sou\")."
          },
          {
            "concept": "Retomada do Corpo Como Aliado — Não Como Inimigo",
            "point": "O paciente deprimido frequentemente tem uma relação hostil com o próprio corpo — o corpo que está pesado, que não quer sair da cama, que parece trair."
          }
        ]
      },
      {
        "id": "mod7-a5",
        "title": "Aula 5 — Prevenção de Recaída Depressiva: O Protocolo de Manutenção",
        "theme": "Prevenção de Recaída Depressiva: O Protocolo de Manutenção",
        "moduleTitle": "Módulo 7 — Depressão: Clínica da Ausência",
        "concepts": [
          "A Depressão Tem Tendência à Recorrência — Prepare o Paciente",
          "Mapeando os Sinais Precoces Individuais",
          "O Plano de ação para os Sinais Precoces",
          "A Manutenção do Campo Entre Episódios",
          "Como Falar Sobre Término do Processo e Manutenção",
          "O Paciente Como Especialista na Própria Depressão"
        ],
        "techniques": [
          "Frankl"
        ],
        "techniqueDetails": [
          {
            "label": "Frankl",
            "detail": "o sentido não é um destino que se alcança uma vez — é uma prática diária que precisa ser cultivada continuamente"
          }
        ],
        "insights": [
          "O episódio depressivo tratado com sucesso não elimina a vulnerabilidade para episódios futuros — especialmente em pacientes com dois ou mais episódios anteriores.",
          "Preparar o paciente para essa possibilidade não é pessimismo — é cuidado real.",
          "Cada paciente tem um padrão específico de como a depressão começa — antes que esteja plenamente instalada.",
          "Trabalhe com o paciente para identificar seus 3 primeiros sinais específicos — o \"painel de instrumentos\" que avisa quando o sistema está entrando em risco.",
          "Quando os sinais precoces aparecerem, o paciente precisa saber exatamente o que fazer — sem depender de ter energia ou motivação para decidir, porque esses são os primeiros recursos que a depressão retira.",
          "O plano precisa incluir: com quem falar, que atividades manter como prioridade absoluta, quando retornar à terapia, quando buscar avaliação psiquiátrica.",
          "O maior erro é parar todos os recursos quando a depressão recua.",
          "A manutenção ativa — terapia em frequência reduzida, rotinas de sono e movimento, vínculos de suporte sustentados — é o que aumenta o intervalo entre episódios e reduz sua intensidade.",
          "Ao encerrar o processo intensivo, seja claro: \"Encerramos essa fase — mas você tem um sistema que conhece agora.",
          "Se precisar voltar, não é regressão — é inteligência.\" Essa frase remove o estigma do retorno e posiciona o uso da terapia como cuidado de saúde adulto, não como dependência ou fraqueza.",
          "O objetivo final do tratamento depressivo não é que o terapeuta entenda a depressão do paciente — é que o próprio paciente se torne o maior especialista nela.",
          "Que ele conheça seus gatilhos, seus sinais, seus recursos, seus limites."
        ],
        "focuses": [
          {
            "concept": "A Depressão Tem Tendência à Recorrência — Prepare o Paciente",
            "point": "O episódio depressivo tratado com sucesso não elimina a vulnerabilidade para episódios futuros — especialmente em pacientes com dois ou mais episódios anteriores."
          },
          {
            "concept": "Mapeando os Sinais Precoces Individuais",
            "point": "Cada paciente tem um padrão específico de como a depressão começa — antes que esteja plenamente instalada."
          },
          {
            "concept": "O Plano de ação para os Sinais Precoces",
            "point": "Quando os sinais precoces aparecerem, o paciente precisa saber exatamente o que fazer — sem depender de ter energia ou motivação para decidir, porque esses são os primeiros recursos que a depressão retira."
          },
          {
            "concept": "A Manutenção do Campo Entre Episódios",
            "point": "O maior erro é parar todos os recursos quando a depressão recua."
          },
          {
            "concept": "Como Falar Sobre Término do Processo e Manutenção",
            "point": "Ao encerrar o processo intensivo, seja claro: \"Encerramos essa fase — mas você tem um sistema que conhece agora."
          },
          {
            "concept": "O Paciente Como Especialista na Própria Depressão",
            "point": "O objetivo final do tratamento depressivo não é que o terapeuta entenda a depressão do paciente — é que o próprio paciente se torne o maior especialista nela."
          }
        ]
      }
    ]
  },
  {
    "id": "mod8",
    "title": "Módulo 8 — Sexualidade na Clínica",
    "lessons": [
      {
        "id": "mod8-a1",
        "title": "Aula 1 — Como Falar de Sexualidade em Sessão Sem Criar Constrangimento",
        "theme": "Como Falar de Sexualidade em Sessão Sem Criar Constrangimento",
        "moduleTitle": "Módulo 8 — Sexualidade na Clínica",
        "concepts": [
          "O Terapeuta Que Não Pergunta Está Comunicando Que Não É Seguro",
          "Como Introduzir o Tema Naturalmente",
          "Regulando Seu Próprio Desconforto Antes da Sessão",
          "Linguagem: Técnica Ou Coloquial?",
          "Confidencialidade e Sexualidade — Reforce Quando Necessário",
          "Quando o Paciente Traz Sexualidade Como Teste"
        ],
        "techniques": [],
        "techniqueDetails": [],
        "insights": [
          "Muitos terapeutas evitam o tema da sexualidade — e essa evitação comunica ao paciente que esse território não pode ser trazido.",
          "O paciente percebe o desconforto do terapeuta e arquiva o assunto.",
          "Na anamnese inicial ou quando o contexto permite, introduza como parte da vida total: \"Como está a vida afetiva e sexual nesse período?\" Essa pergunta, feita com o mesmo tom de voz que você usa para qualquer outra, normaliza o tema.",
          "O que não estiver pronto vai passar por cima — e isso também é dado clínico.",
          "Se você percebe que tem mais dificuldade com certos temas sexuais do que com outros — orientações específicas, práticas que te surpreendem, relatos de trauma sexual — esse é um dado para levar para supervisão.",
          "Não é julgamento sobre você — é o campo avisando onde seu sistema precisa de mais trabalho.",
          "Com alguns, linguagem técnica cria distância segura para um assunto delicado.",
          "Com outros, soa clínica e fria — o coloquial é o que permite a conversa real.",
          "Antes de explorar temas sexuais mais profundos, reforce o sigilo.",
          "Muitos pacientes não têm certeza se o que dizem sobre sexualidade fica realmente só entre vocês.",
          "Às vezes o paciente menciona o tema abruptamente para testar sua reação.",
          "Não reaja com surpresa, não mude de assunto, não demonstre desconforto."
        ],
        "focuses": [
          {
            "concept": "O Terapeuta Que Não Pergunta Está Comunicando Que Não É Seguro",
            "point": "Muitos terapeutas evitam o tema da sexualidade — e essa evitação comunica ao paciente que esse território não pode ser trazido."
          },
          {
            "concept": "Como Introduzir o Tema Naturalmente",
            "point": "Na anamnese inicial ou quando o contexto permite, introduza como parte da vida total: \"Como está a vida afetiva e sexual nesse período?\" Essa pergunta, feita com o mesmo tom de voz que você usa para qualquer outra, normaliza o tema."
          },
          {
            "concept": "Regulando Seu Próprio Desconforto Antes da Sessão",
            "point": "Se você percebe que tem mais dificuldade com certos temas sexuais do que com outros — orientações específicas, práticas que te surpreendem, relatos de trauma sexual — esse é um dado para levar para supervisão."
          },
          {
            "concept": "Linguagem: Técnica Ou Coloquial?",
            "point": "Com alguns, linguagem técnica cria distância segura para um assunto delicado."
          },
          {
            "concept": "Confidencialidade e Sexualidade — Reforce Quando Necessário",
            "point": "Antes de explorar temas sexuais mais profundos, reforce o sigilo."
          },
          {
            "concept": "Quando o Paciente Traz Sexualidade Como Teste",
            "point": "Às vezes o paciente menciona o tema abruptamente para testar sua reação."
          }
        ]
      },
      {
        "id": "mod8-a2",
        "title": "Aula 2 — Disfunções Sexuais: O Que o Terapeuta Precisa Saber",
        "theme": "Disfunções Sexuais: O Que o Terapeuta Precisa Saber",
        "moduleTitle": "Módulo 8 — Sexualidade na Clínica",
        "concepts": [
          "As Disfunções Mais Comuns Que Chegam ao Consultório",
          "Componente Psicológico Vs. Orgânico — Como Diferenciar",
          "A Ansiedade de Desempenho: o Ciclo Que Precisa Ser Rompido",
          "Técnicas de Foco Sensorial (masters e Johnson) para Uso Clínico",
          "Baixo Desejo: Não Medicalizar Antes de Entender o Contexto",
          "Quando Encaminhar para Sexólogo Ou Sexterapeuta"
        ],
        "techniques": [],
        "techniqueDetails": [],
        "insights": [
          "Disfunção erétil e ejaculação precoce nos homens.",
          "Vaginismo, dispareunia e anorgasmia nas mulheres.",
          "Disfunção erétil em homens jovens sem condição médica identificada é predominantemente psicogênica — ansiedade de desempenho, medo de rejeição, conflitos relacionais.",
          "Em homens acima de 50 com fatores de risco cardiovasculares, o componente orgânico é significativo e encaminhamento para urologista é necessário.",
          "A disfunção gera ansiedade sobre o próximo encontro — que gera mais disfunção.",
          "O paciente começa a evitar situações íntimas para evitar o fracasso antecipado.",
          "O protocolo de foco sensorial começa removendo a expectativa de desempenho: o casal é orientado a ter contato físico sem qualquer objetivo de relação sexual por um período.",
          "Apenas toque, presença, exploração sem destino.",
          "Baixo desejo é frequentemente relacional (há conflito não resolvido com o parceiro), situacional (estresse, esgotamento, fase de vida) ou intrapsíquico (depressão, ansiedade, trauma não elaborado).",
          "Antes de qualquer intervenção direta sobre o desejo, mapeie esses contextos.",
          "Casos com disfunções funcionais persistentes que não respondem ao trabalho psicoterápico geral.",
          "Incompatibilidade sexual de longa data entre parceiros."
        ],
        "focuses": [
          {
            "concept": "As Disfunções Mais Comuns Que Chegam ao Consultório",
            "point": "Disfunção erétil e ejaculação precoce nos homens."
          },
          {
            "concept": "Componente Psicológico Vs. Orgânico — Como Diferenciar",
            "point": "Disfunção erétil em homens jovens sem condição médica identificada é predominantemente psicogênica — ansiedade de desempenho, medo de rejeição, conflitos relacionais."
          },
          {
            "concept": "A Ansiedade de Desempenho: o Ciclo Que Precisa Ser Rompido",
            "point": "A disfunção gera ansiedade sobre o próximo encontro — que gera mais disfunção."
          },
          {
            "concept": "Técnicas de Foco Sensorial (masters e Johnson) para Uso Clínico",
            "point": "O protocolo de foco sensorial começa removendo a expectativa de desempenho: o casal é orientado a ter contato físico sem qualquer objetivo de relação sexual por um período."
          },
          {
            "concept": "Baixo Desejo: Não Medicalizar Antes de Entender o Contexto",
            "point": "Baixo desejo é frequentemente relacional (há conflito não resolvido com o parceiro), situacional (estresse, esgotamento, fase de vida) ou intrapsíquico (depressão, ansiedade, trauma não elaborado)."
          },
          {
            "concept": "Quando Encaminhar para Sexólogo Ou Sexterapeuta",
            "point": "Casos com disfunções funcionais persistentes que não respondem ao trabalho psicoterápico geral."
          }
        ]
      },
      {
        "id": "mod8-a3",
        "title": "Aula 3 — Trauma Sexual: Como Abordar Sem Re-traumatizar",
        "theme": "Trauma Sexual: Como Abordar Sem Re-traumatizar",
        "moduleTitle": "Módulo 8 — Sexualidade na Clínica",
        "concepts": [
          "Trauma Sexual Está Mais Presente do Que Você Imagina",
          "Como o Trauma Sexual Aparece na Clínica — sem Ser Nomeado",
          "O Princípio Fundamental: Nunca Force a Narrativa",
          "Técnica: a Janela de Tolerância",
          "O Corpo no Trauma Sexual — Trabalhar o Fisiológico",
          "Limites da Competência e Encaminhamento"
        ],
        "techniques": [
          "Kolk demonstraram"
        ],
        "techniqueDetails": [
          {
            "label": "Kolk demonstraram",
            "detail": "o trauma vive no corpo — não só na narrativa"
          }
        ],
        "insights": [
          "Estatísticas consistentes indicam que uma proporção significativa de pacientes adultos — especialmente mulheres — carregam alguma forma de violência ou abuso sexual no histórico.",
          "Muitas vezes não nomeado como trauma, não identificado pelo próprio paciente como causa dos sintomas presentes, fragmentado em memórias difusas que chegam via corpo, relacionamentos ou comportamentos sexuais problemáticos.",
          "Dificuldade com intimidade física inexplicável.",
          "Reações de pânico ou nojo em contextos sexuais sem causa aparente.",
          "O maior erro com trauma sexual é pressionar para que o paciente relate em detalhes antes de estar pronto.",
          "O sistema nervoso traumatizado não precisa de mais exposição — precisa de segurança.",
          "O trabalho terapêutico com trauma sexual deve acontecer dentro da janela de tolerância — o estado onde o paciente pode processar sem hiperestimular ou dissocias.",
          "Se o paciente começa a se dissocia ou a hiperestiular durante a sessão: pause, traga de volta ao presente.",
          "Peter Levine e van der Kolk demonstraram: o trauma vive no corpo — não só na narrativa.",
          "O paciente com trauma sexual pode ter reações corporais intensas que precedem qualquer pensamento consciente.",
          "Trauma sexual grave — especialmente abuso infantil prolongado, estupro com violência — exige formação especializada em trauma.",
          "Se você não tem essa formação: estabilize, valide, construa aliança e encaminhe para profissional com treinamento específico em EMDR, Somatic Experiencing ou abordagens traumatológicas."
        ],
        "focuses": [
          {
            "concept": "Trauma Sexual Está Mais Presente do Que Você Imagina",
            "point": "Estatísticas consistentes indicam que uma proporção significativa de pacientes adultos — especialmente mulheres — carregam alguma forma de violência ou abuso sexual no histórico."
          },
          {
            "concept": "Como o Trauma Sexual Aparece na Clínica — sem Ser Nomeado",
            "point": "Dificuldade com intimidade física inexplicável."
          },
          {
            "concept": "O Princípio Fundamental: Nunca Force a Narrativa",
            "point": "O maior erro com trauma sexual é pressionar para que o paciente relate em detalhes antes de estar pronto."
          },
          {
            "concept": "Técnica: a Janela de Tolerância",
            "point": "O trabalho terapêutico com trauma sexual deve acontecer dentro da janela de tolerância — o estado onde o paciente pode processar sem hiperestimular ou dissocias."
          },
          {
            "concept": "O Corpo no Trauma Sexual — Trabalhar o Fisiológico",
            "point": "Peter Levine e van der Kolk demonstraram: o trauma vive no corpo — não só na narrativa."
          },
          {
            "concept": "Limites da Competência e Encaminhamento",
            "point": "Trauma sexual grave — especialmente abuso infantil prolongado, estupro com violência — exige formação especializada em trauma."
          }
        ]
      },
      {
        "id": "mod8-a4",
        "title": "Aula 4 — Identidade Sexual e Orientação: Clínica Afirmativa",
        "theme": "Identidade Sexual e Orientação: Clínica Afirmativa",
        "moduleTitle": "Módulo 8 — Sexualidade na Clínica",
        "concepts": [
          "O Que É Clínica Afirmativa e por Que Importa",
          "O Terapeuta Precisa Examinar Seus Próprios Preconceitos",
          "Como Criar Campo Seguro para Questões de Identidade",
          "Conflito de Identidade e Saúde Mental",
          "Família e Ambiente: Trabalhando o Campo Social",
          "O Que Frankl nos Oferece para Esse Campo"
        ],
        "techniques": [
          "Use linguagem neutra"
        ],
        "techniqueDetails": [
          {
            "label": "Use linguagem neutra",
            "detail": "Você tem algum relacionamento?"
          }
        ],
        "insights": [
          "Clínica afirmativa não é concordar com tudo que o paciente traz — é não tratar a orientação sexual ou identidade de gênero do paciente como o problema a ser tratado.",
          "A homossexualidade, bissexualidade, transexualidade e outras expressões de identidade sexual não são patologias — são parte da diversidade humana.",
          "Antes de qualquer técnica, examine o que você realmente pensa sobre orientação sexual e identidade de gênero.",
          "Preconceitos não examinados aparecem em detalhes — o tom de uma pergunta, uma hesitação antes de responder, uma frase que soa mais como julgamento do que como curiosidade.",
          "Use linguagem neutra: \"Você tem algum relacionamento?\" em vez de \"tem namorado/namorada?\" Pergunte sobre identidade de forma aberta: \"Como você se identifica?\" e use os pronomes que o paciente usar.",
          "Essas práticas simples comunicam que aqui é um campo seguro para ser quem se é — e abre o espaço para o trabalho real.",
          "Pacientes que vivem em conflito com sua própria orientação ou identidade — especialmente quando há pressão familiar ou religiosa intensa — têm risco aumentado de depressão, ansiedade, uso de substâncias e ideação suicida.",
          "O trabalho terapêutico não é resolver o conflito no sentido de escolher um lado — é ajudar o paciente a conhecer a si mesmo com honestidade e a construir uma vida que seja autenticamente sua.",
          "A coming out — o processo de assumir a identidade para si mesmo e para outros — tem impacto direto no campo social do paciente.",
          "Trabalhe o processo de coming out com cuidado: quando? com quem? em que ordem?",
          "Frankl nos diz que o ser humano tem liberdade de encontrar sentido mesmo nas condições mais adversas — mas essa liberdade precisa de um self forte o suficiente para exercê-la."
        ],
        "focuses": [
          {
            "concept": "O Que É Clínica Afirmativa e por Que Importa",
            "point": "Clínica afirmativa não é concordar com tudo que o paciente traz — é não tratar a orientação sexual ou identidade de gênero do paciente como o problema a ser tratado."
          },
          {
            "concept": "O Terapeuta Precisa Examinar Seus Próprios Preconceitos",
            "point": "Antes de qualquer técnica, examine o que você realmente pensa sobre orientação sexual e identidade de gênero."
          },
          {
            "concept": "Como Criar Campo Seguro para Questões de Identidade",
            "point": "Use linguagem neutra: \"Você tem algum relacionamento?\" em vez de \"tem namorado/namorada?\" Pergunte sobre identidade de forma aberta: \"Como você se identifica?\" e use os pronomes que o paciente usar."
          },
          {
            "concept": "Conflito de Identidade e Saúde Mental",
            "point": "Pacientes que vivem em conflito com sua própria orientação ou identidade — especialmente quando há pressão familiar ou religiosa intensa — têm risco aumentado de depressão, ansiedade, uso de substâncias e ideação suicida."
          },
          {
            "concept": "Família e Ambiente: Trabalhando o Campo Social",
            "point": "A coming out — o processo de assumir a identidade para si mesmo e para outros — tem impacto direto no campo social do paciente."
          },
          {
            "concept": "O Que Frankl nos Oferece para Esse Campo",
            "point": "Frankl nos diz que o ser humano tem liberdade de encontrar sentido mesmo nas condições mais adversas — mas essa liberdade precisa de um self forte o suficiente para exercê-la."
          }
        ]
      },
      {
        "id": "mod8-a5",
        "title": "Aula 5 — Sexualidade no Casal: Quando o Problema Individual Vira Campo Relacional",
        "theme": "Sexualidade no Casal: Quando o Problema Individual Vira Campo Relacional",
        "moduleTitle": "Módulo 8 — Sexualidade na Clínica",
        "concepts": [
          "O Problema Sexual Raramente É Só do Indivíduo",
          "Como Avaliar Se o Trabalho Precisa Incluir o Casal",
          "O Mapa de Lewin no Casal: as Forças Que Movem e as Que Bloqueiam",
          "Comunicação Sexual: o Tema Que Ninguém Ensina Mas Todos Precisam",
          "Traição e Reestabelecimento da Intimidade Sexual",
          "Quando Sexualidade e Poder Estão Misturados"
        ],
        "techniques": [
          "Pergunte"
        ],
        "techniqueDetails": [
          {
            "label": "Pergunte",
            "detail": "Como era antes desse relacionamento?"
          }
        ],
        "insights": [
          "Quando um paciente chega com queixa de disfunção sexual ou insatisfação, a causa frequentemente está no sistema — no casal — mais do que no indivíduo.",
          "A disfunção erétil que aparece só com a parceira atual.",
          "Lewin nos ensina que o campo relacional tem forças que favorecem a aproximação e forças que geram afastamento — e que essas forças operam ao mesmo tempo.",
          "No casal, mapear o que ainda conecta, o que está gerando distância e o que cada parte deseja mas não consegue pedir é mais útil do que focar só no sintoma sexual.",
          "A maioria dos casais nunca teve uma conversa direta sobre o que cada um quer, o que sente prazer, o que não gosta, o que tem medo de pedir.",
          "Trabalhar a comunicação sexual em terapia — criando um espaço seguro para que essas conversas aconteçam — frequentemente resolve queixas sexuais que pareciam intratáveis.",
          "A intimidade sexual após uma traição é um dos trabalhos mais complexos da clínica de casal.",
          "O parceiro traído frequentemente dissociou a intimidade do vínculo de confiança — e a reconexão sexual precede, em geral, a reconstrução completa da confiança.",
          "Em alguns casais, sexo é campo de batalha — onde poder, controle, rejeição e punição se expressam via recusa ou demanda sexual.",
          "Quando isso está presente, trabalhar a sexualidade diretamente é trabalhar o sintoma."
        ],
        "focuses": [
          {
            "concept": "O Problema Sexual Raramente É Só do Indivíduo",
            "point": "Quando um paciente chega com queixa de disfunção sexual ou insatisfação, a causa frequentemente está no sistema — no casal — mais do que no indivíduo."
          },
          {
            "concept": "O Mapa de Lewin no Casal: as Forças Que Movem e as Que Bloqueiam",
            "point": "Lewin nos ensina que o campo relacional tem forças que favorecem a aproximação e forças que geram afastamento — e que essas forças operam ao mesmo tempo."
          },
          {
            "concept": "Comunicação Sexual: o Tema Que Ninguém Ensina Mas Todos Precisam",
            "point": "A maioria dos casais nunca teve uma conversa direta sobre o que cada um quer, o que sente prazer, o que não gosta, o que tem medo de pedir."
          },
          {
            "concept": "Traição e Reestabelecimento da Intimidade Sexual",
            "point": "A intimidade sexual após uma traição é um dos trabalhos mais complexos da clínica de casal."
          },
          {
            "concept": "Quando Sexualidade e Poder Estão Misturados",
            "point": "Em alguns casais, sexo é campo de batalha — onde poder, controle, rejeição e punição se expressam via recusa ou demanda sexual."
          }
        ]
      }
    ]
  },
  {
    "id": "mod9",
    "title": "Módulo 9 — Ferramentas de Consultório I",
    "lessons": [
      {
        "id": "mod9-a1",
        "title": "Aula 1 — Comunicação Terapêutica: O Que Você Diz, Como Diz e o Que Não Diz",
        "theme": "Comunicação Terapêutica: O Que Você Diz, Como Diz e o Que Não Diz",
        "moduleTitle": "Módulo 9 — Ferramentas de Consultório I",
        "concepts": [
          "A Comunicação Terapêutica Começa Antes da Primeira Palavra",
          "Perguntas Abertas Vs. Fechadas — Quando Usar Cada uma",
          "Reflexo e Paráfrase — as Duas Ferramentas Que Mais Aprofundam",
          "Como Calibrar o Nível de Linguagem ao Paciente",
          "O Silêncio Como Comunicação Ativa",
          "O Que Nunca Dizer — Frases Que Fecham o Campo"
        ],
        "techniques": [
          "Reflexo emocional",
          "Paráfrase"
        ],
        "techniqueDetails": [
          {
            "label": "Reflexo emocional",
            "detail": "Você está falando com raiva sobre isso"
          },
          {
            "label": "Paráfrase",
            "detail": "Se entendi bem, você está dizendo que"
          }
        ],
        "insights": [
          "Antes de você falar qualquer coisa, o paciente já leu seu tom corporal, a expressão do seu rosto, a qualidade da sua presença.",
          "Mehrabian demonstrou que a maior parte do impacto de uma mensagem interpessoal vem do não-verbal.",
          "Perguntas abertas (\"Como foi essa semana para você?\") abrem campo, convidam narrativa, revelam o que o paciente prioriza espontaneamente.",
          "Perguntas fechadas (\"Você dormiu bem?\") são úteis para confirmar hipóteses ou coletar dados específicos.",
          "Reflexo emocional: \"Você está falando com raiva sobre isso.\" — nomeia o que o paciente sente sem interpretação.",
          "Paráfrase: \"Se entendi bem, você está dizendo que...\" — demonstra escuta ativa e oferece ao paciente a chance de corrigir ou aprofundar.",
          "Com pacientes mais técnicos, você pode usar termos psicológicos com precisão.",
          "Com pacientes que falam de forma mais concreta e coloquial, termos técnicos criam distância — e o paciente começa a sentir que está sendo \"analisado\", não compreendido.",
          "Responder tudo imediatamente comunica ao paciente que suas palavras não precisam de tempo para ser processadas.",
          "O terapeuta que pausa antes de responder — mesmo que brevemente — comunica que o que foi dito teve peso.",
          "Identifique quais são as suas e trabalhe para substituí-las."
        ],
        "focuses": [
          {
            "concept": "A Comunicação Terapêutica Começa Antes da Primeira Palavra",
            "point": "Antes de você falar qualquer coisa, o paciente já leu seu tom corporal, a expressão do seu rosto, a qualidade da sua presença."
          },
          {
            "concept": "Perguntas Abertas Vs. Fechadas — Quando Usar Cada uma",
            "point": "Perguntas abertas (\"Como foi essa semana para você?\") abrem campo, convidam narrativa, revelam o que o paciente prioriza espontaneamente."
          },
          {
            "concept": "Reflexo e Paráfrase — as Duas Ferramentas Que Mais Aprofundam",
            "point": "Reflexo emocional: \"Você está falando com raiva sobre isso.\" — nomeia o que o paciente sente sem interpretação."
          },
          {
            "concept": "Como Calibrar o Nível de Linguagem ao Paciente",
            "point": "Com pacientes mais técnicos, você pode usar termos psicológicos com precisão."
          },
          {
            "concept": "O Silêncio Como Comunicação Ativa",
            "point": "Responder tudo imediatamente comunica ao paciente que suas palavras não precisam de tempo para ser processadas."
          },
          {
            "concept": "O Que Nunca Dizer — Frases Que Fecham o Campo",
            "point": "Identifique quais são as suas e trabalhe para substituí-las."
          }
        ]
      },
      {
        "id": "mod9-a2",
        "title": "Aula 2 — Anamnese Clínica: Construindo o Método Avaliativo desde a Primeira Sessão",
        "theme": "Anamnese Clínica: Construindo o Método Avaliativo desde a Primeira Sessão",
        "moduleTitle": "Módulo 9 — Ferramentas de Consultório I",
        "concepts": [
          "Anamnese Não É Formulário — É Conversa Estruturada com Propósito",
          "Os Domínios Que a Anamnese Precisa Cobrir",
          "A Pergunta Que Muitos Terapeutas Esquecem",
          "Como Registrar sem Perder a Presença",
          "Estrutura Prática da Primeira Sessão em Três Fases",
          "A Devolutiva da Anamnese — Como Fazer Bem"
        ],
        "techniques": [
          "Queixa principal",
          "História do problema",
          "Histórico de saúde mental",
          "Histórico familiar",
          "Vida atual",
          "Objetivos",
          "Pergunte"
        ],
        "techniqueDetails": [
          {
            "label": "Queixa principal",
            "detail": "o que trouxe o paciente agora — não o histórico todo, mas o que motivou a busca nesse momento"
          },
          {
            "label": "História do problema",
            "detail": "quando começou, o que desencadeou, o que aliviou, o que piorou"
          },
          {
            "label": "Histórico de saúde mental",
            "detail": "atendimentos anteriores, uso de medicação, internações"
          },
          {
            "label": "Histórico familiar",
            "detail": "padrões de saúde mental, dinâmicas relacionais de origem, perdas significativas"
          },
          {
            "label": "Vida atual",
            "detail": "trabalho, relacionamentos, sono, uso de substâncias, rede de suporte"
          },
          {
            "label": "Objetivos",
            "detail": "o que o paciente espera da terapia"
          },
          {
            "label": "Pergunte",
            "detail": "Isso faz sentido para você? Tem algo importante que você sente que não ficou?"
          }
        ],
        "insights": [
          "O maior erro na anamnese é transformá-la em questionário.",
          "O paciente sente que está preenchendo ficha, não sendo recebido.",
          "Queixa principal: o que trouxe o paciente agora — não o histórico todo, mas o que motivou a busca nesse momento.",
          "História do problema: quando começou, o que desencadeou, o que aliviou, o que piorou.",
          "Como foi?\" Essa pergunta revela muito: o que o paciente espera, quais modelos de relação terapêutica ele já viveu, quais experiências foram positivas ou negativas, o que funcionou e o que não funcionou.",
          "É o mapa da aliança que você vai precisar construir — e você pode obtê-lo gratuitamente na primeira sessão.",
          "Tomar notas durante a sessão cria distância — mas não tomar notas nenhuma abre risco de perder dados importantes.",
          "A solução prática: anote brevemente palavras-chave durante a sessão (não frases completas), e complete o registro logo após o paciente sair.",
          "Fase 1 (0–15 min): Acolhimento e queixa principal.",
          "Deixe o paciente falar livremente — observe o padrão de apresentação.",
          "No final da primeira sessão, ofereça uma síntese curta do que você compreendeu: a queixa principal, o contexto e o que você propõe como direção de trabalho.",
          "Tem algo importante que você sente que não ficou?\" Essa devolutiva demonstra que você ouviu, cria alinhamento de expectativas e encerra a primeira sessão com o paciente sentindo que o processo já começou."
        ],
        "focuses": [
          {
            "concept": "Anamnese Não É Formulário — É Conversa Estruturada com Propósito",
            "point": "O maior erro na anamnese é transformá-la em questionário."
          },
          {
            "concept": "Os Domínios Que a Anamnese Precisa Cobrir",
            "point": "Queixa principal: o que trouxe o paciente agora — não o histórico todo, mas o que motivou a busca nesse momento."
          },
          {
            "concept": "A Pergunta Que Muitos Terapeutas Esquecem",
            "point": "Como foi?\" Essa pergunta revela muito: o que o paciente espera, quais modelos de relação terapêutica ele já viveu, quais experiências foram positivas ou negativas, o que funcionou e o que não funcionou."
          },
          {
            "concept": "Como Registrar sem Perder a Presença",
            "point": "Tomar notas durante a sessão cria distância — mas não tomar notas nenhuma abre risco de perder dados importantes."
          },
          {
            "concept": "Estrutura Prática da Primeira Sessão em Três Fases",
            "point": "Fase 1 (0–15 min): Acolhimento e queixa principal."
          },
          {
            "concept": "A Devolutiva da Anamnese — Como Fazer Bem",
            "point": "No final da primeira sessão, ofereça uma síntese curta do que você compreendeu: a queixa principal, o contexto e o que você propõe como direção de trabalho."
          }
        ]
      },
      {
        "id": "mod9-a3",
        "title": "Aula 3 — Construção de Perfil Comportamental: Da Observação ao Mapa Clínico",
        "theme": "Construção de Perfil Comportamental: Da Observação ao Mapa Clínico",
        "moduleTitle": "Módulo 9 — Ferramentas de Consultório I",
        "concepts": [
          "O Que É um Perfil Comportamental na Clínica",
          "As Quatro Dimensões do Perfil Que Você Constrói nas Primeiras Sessões",
          "Como Coletar os Dados do Perfil sem Interrogar o Paciente",
          "Os Recursos do Paciente — o Que o Perfil Deve Incluir",
          "Perfil Comportamental e Plano de Tratamento — a Conexão Direta",
          "Como Atualizar o Perfil ao Longo do Processo"
        ],
        "techniques": [
          "Dimensão emocional",
          "Dimensão cognitiva",
          "Frankl nos orienta"
        ],
        "techniqueDetails": [
          {
            "label": "Dimensão emocional",
            "detail": "como o paciente experimenta e expressa emoções — suprime, exagera, intelectualiza? Dimensão relacional: padrão de vínculos — evitante, ansioso, depend"
          },
          {
            "label": "Dimensão cognitiva",
            "detail": "estilo de pensamento — rígido, flexível, catastrofizante, negador? Dimensão comportamental: respostas padrão sob estresse — fuga, enfrentamento, paral"
          },
          {
            "label": "Frankl nos orienta",
            "detail": "o tratamento que ignora os recursos do paciente trabalha contra ele"
          }
        ],
        "insights": [
          "Perfil comportamental não é diagnóstico — é o mapa dinâmico do padrão de funcionamento do paciente: como ele processa emoções, como reage sob pressão, como se relaciona, quais são suas defesas dominantes, quais são seus recursos genuínos.",
          "Esse mapa orienta todas as intervenções subsequentes — porque o que funciona para um perfil específico pode ser contraproducente para outro.",
          "Dimensão emocional: como o paciente experimenta e expressa emoções — suprime, exagera, intelectualiza?",
          "Dimensão relacional: padrão de vínculos — evitante, ansioso, dependente, controlador?",
          "Observe como ele apresenta o problema — quem tem culpa na narrativa?",
          "Observe o que ele exclui espontaneamente da história.",
          "O perfil não é só mapa de problemas — é também mapa de potências.",
          "Quais são os recursos genuínos desse paciente?",
          "Com o perfil construído, o plano de tratamento deixa de ser genérico e passa a ser personalizado: que abordagem se encaixa nesse perfil específico?",
          "Que tipo de intervenção vai encontrar resistência?",
          "O perfil não é estático — é uma hipótese de trabalho que você revisa a cada sessão.",
          "Quando o paciente surpreende você com uma reação que não esperava, é dado para atualizar o mapa."
        ],
        "focuses": [
          {
            "concept": "O Que É um Perfil Comportamental na Clínica",
            "point": "Perfil comportamental não é diagnóstico — é o mapa dinâmico do padrão de funcionamento do paciente: como ele processa emoções, como reage sob pressão, como se relaciona, quais são suas defesas dominantes, quais são seus recursos genuínos."
          },
          {
            "concept": "As Quatro Dimensões do Perfil Que Você Constrói nas Primeiras Sessões",
            "point": "Dimensão emocional: como o paciente experimenta e expressa emoções — suprime, exagera, intelectualiza?"
          },
          {
            "concept": "Como Coletar os Dados do Perfil sem Interrogar o Paciente",
            "point": "Observe como ele apresenta o problema — quem tem culpa na narrativa?"
          },
          {
            "concept": "Os Recursos do Paciente — o Que o Perfil Deve Incluir",
            "point": "O perfil não é só mapa de problemas — é também mapa de potências."
          },
          {
            "concept": "Perfil Comportamental e Plano de Tratamento — a Conexão Direta",
            "point": "Com o perfil construído, o plano de tratamento deixa de ser genérico e passa a ser personalizado: que abordagem se encaixa nesse perfil específico?"
          },
          {
            "concept": "Como Atualizar o Perfil ao Longo do Processo",
            "point": "O perfil não é estático — é uma hipótese de trabalho que você revisa a cada sessão."
          }
        ]
      },
      {
        "id": "mod9-a4",
        "title": "Aula 4 — Formulação de Caso: Transformando Dados em Direção Clínica",
        "theme": "Formulação de Caso: Transformando Dados em Direção Clínica",
        "moduleTitle": "Módulo 9 — Ferramentas de Consultório I",
        "concepts": [
          "O Que É uma Formulação de Caso e por Que Você Precisa de uma",
          "A Estrutura da Formulação em Quatro Perguntas",
          "Como Construir a Formulação nas Primeiras Três Sessões",
          "Compartilhar a Formulação com o Paciente — por Que É Poderoso",
          "Formulação Vs. Diagnóstico — a Diferença Importa",
          "Revendo a Formulação Quando o Processo Estagna"
        ],
        "techniques": [],
        "techniqueDetails": [],
        "insights": [
          "Formulação de caso é a narrativa clínica que integra a queixa do paciente, sua história, seu perfil comportamental e as hipóteses sobre os mecanismos que mantêm o sofrimento — resultando numa direção clara de trabalho.",
          "Sem formulação, você atende sessão a sessão sem fio condutor.",
          "Compartilhar parte da formulação com o paciente não é revelar seus \"diagnósticos\" — é oferecer uma narrativa compreensível sobre o que está acontecendo.",
          "O paciente com diagnóstico de TAG pode ter formulações completamente diferentes dependendo da história específica — e isso muda totalmente o que você vai fazer.",
          "Dois pacientes com o mesmo diagnóstico podem precisar de abordagens opostas.",
          "Se o processo travou — sessões que circulam sem avançar, intervenções que não produzem movimento — a primeira pergunta é: a formulação ainda está correta?",
          "Muitas vezes o que parecia o problema central era a porta de entrada, não o núcleo real."
        ],
        "focuses": [
          {
            "concept": "O Que É uma Formulação de Caso e por Que Você Precisa de uma",
            "point": "Formulação de caso é a narrativa clínica que integra a queixa do paciente, sua história, seu perfil comportamental e as hipóteses sobre os mecanismos que mantêm o sofrimento — resultando numa direção clara de trabalho."
          },
          {
            "concept": "Compartilhar a Formulação com o Paciente — por Que É Poderoso",
            "point": "Compartilhar parte da formulação com o paciente não é revelar seus \"diagnósticos\" — é oferecer uma narrativa compreensível sobre o que está acontecendo."
          },
          {
            "concept": "Formulação Vs. Diagnóstico — a Diferença Importa",
            "point": "O paciente com diagnóstico de TAG pode ter formulações completamente diferentes dependendo da história específica — e isso muda totalmente o que você vai fazer."
          },
          {
            "concept": "Revendo a Formulação Quando o Processo Estagna",
            "point": "Se o processo travou — sessões que circulam sem avançar, intervenções que não produzem movimento — a primeira pergunta é: a formulação ainda está correta?"
          }
        ]
      },
      {
        "id": "mod9-a5",
        "title": "Aula 5 — Avaliação de Progresso: Como Saber Se o Trabalho Está Funcionando",
        "theme": "Avaliação de Progresso: Como Saber Se o Trabalho Está Funcionando",
        "moduleTitle": "Módulo 9 — Ferramentas de Consultório I",
        "concepts": [
          "Sem Avaliação, Você Está Navegando sem Instrumento",
          "Os Três Níveis de Avaliação de Progresso",
          "Ferramentas Simples de Avaliação para Uso em Sessão",
          "Quando o Paciente Acha Que Não Melhorou — e Ele Pode Estar Certo",
          "O Paradoxo do Progresso: por Que Melhorar Pode Assustar",
          "Avaliação Como Ato de Respeito com o Tempo do Paciente"
        ],
        "techniques": [
          "Nível sintomático",
          "Nível estrutural",
          "Revisão periódica de objetivos",
          "Frankl diria"
        ],
        "techniqueDetails": [
          {
            "label": "Nível sintomático",
            "detail": "os sintomas que trouxeram o paciente estão reduzindo em frequência ou intensidade? Nível funcional: o paciente está funcionando melhor nas áreas que i"
          },
          {
            "label": "Nível estrutural",
            "detail": "os padrões centrais estão mudando — não só o comportamento de superfície, mas os mecanismos que o geravam? O progresso verdadeiro acontece nos três ní"
          },
          {
            "label": "Revisão periódica de objetivos",
            "detail": "a cada dois meses, revisitar os objetivos iniciais — o que mudou, o que ainda está em aberto? Pergunta de comparação direta:"
          },
          {
            "label": "Frankl diria",
            "detail": "o terapeuta que não avalia está, em alguma medida, usando o paciente para sustentar o processo — em vez de trabalhar com clareza para que esse process"
          }
        ],
        "insights": [
          "Muitos terapeutas avaliam progresso intuitivamente — \"parece que está melhor.\" Isso é insuficiente.",
          "Pacientes podem parecer melhor em sessão por razões que não refletem mudança real — aprenderam a performar melhora para agradar o terapeuta, ou estão num período de alívio temporário.",
          "Nível sintomático: os sintomas que trouxeram o paciente estão reduzindo em frequência ou intensidade?",
          "Nível funcional: o paciente está funcionando melhor nas áreas que importam para ele — trabalho, relações, cuidado de si?",
          "Escala subjetiva de 0 a 10: \"Onde você estava quando começamos?",
          "Onde você está hoje nessa questão?\" Revisão periódica de objetivos: a cada dois meses, revisitar os objetivos iniciais — o que mudou, o que ainda está em aberto?",
          "O trabalho pode não estar produzindo mudança — por formulação errada, por abordagem inadequada ao perfil, por resistência não trabalhada ou por fatores externos que anulam o progresso clínico.",
          "Ouvir isso sem defensividade — \"me ajuda a entender o que você esperava que estivesse diferente\" — é mais útil do que defender o processo.",
          "Alguns pacientes sabotam o progresso quando ele começa a aparecer — porque a mudança ameaça uma identidade construída em torno do sofrimento, ou porque melhora significa que o processo pode encerrar e o vínculo terapêutico se perder.",
          "Quando você percebe esse padrão, nomeie gentilmente: \"Percebo que quando as coisas começam a melhorar, algo parece recuar.",
          "O paciente que investe tempo, dinheiro e energia num processo merece saber como esse processo está evoluindo.",
          "A avaliação regular não é burocrática — é ética."
        ],
        "focuses": [
          {
            "concept": "Sem Avaliação, Você Está Navegando sem Instrumento",
            "point": "Muitos terapeutas avaliam progresso intuitivamente — \"parece que está melhor.\" Isso é insuficiente."
          },
          {
            "concept": "Os Três Níveis de Avaliação de Progresso",
            "point": "Nível sintomático: os sintomas que trouxeram o paciente estão reduzindo em frequência ou intensidade?"
          },
          {
            "concept": "Ferramentas Simples de Avaliação para Uso em Sessão",
            "point": "Escala subjetiva de 0 a 10: \"Onde você estava quando começamos?"
          },
          {
            "concept": "Quando o Paciente Acha Que Não Melhorou — e Ele Pode Estar Certo",
            "point": "O trabalho pode não estar produzindo mudança — por formulação errada, por abordagem inadequada ao perfil, por resistência não trabalhada ou por fatores externos que anulam o progresso clínico."
          },
          {
            "concept": "O Paradoxo do Progresso: por Que Melhorar Pode Assustar",
            "point": "Alguns pacientes sabotam o progresso quando ele começa a aparecer — porque a mudança ameaça uma identidade construída em torno do sofrimento, ou porque melhora significa que o processo pode encerrar e o vínculo terapêutico se perder."
          },
          {
            "concept": "Avaliação Como Ato de Respeito com o Tempo do Paciente",
            "point": "O paciente que investe tempo, dinheiro e energia num processo merece saber como esse processo está evoluindo."
          }
        ]
      }
    ]
  },
  {
    "id": "mod10",
    "title": "Módulo 10 — Atendimentos Especializados",
    "lessons": [
      {
        "id": "mod10-a1",
        "title": "Aula 1 — Terapia de Casal: Estrutura, Setting e as Primeiras Três Sessões",
        "theme": "Terapia de Casal: Estrutura, Setting e as Primeiras Três Sessões",
        "moduleTitle": "Módulo 10 — Atendimentos Especializados",
        "concepts": [
          "O Casal Como Campo — Não Como Dois Indivíduos",
          "Setting Específico do Atendimento de Casal",
          "A Estrutura das Três Primeiras Sessões",
          "Como Manejar a Sessão Quando um Fala e o Outro Reage",
          "Aliança com o Casal — Como Manter a Neutralidade Sob Pressão",
          "Quando a Terapia de Casal Não É Indicada"
        ],
        "techniques": [
          "Lewin nos orienta",
          "Posicionamento físico",
          "Contrato inicial explícito"
        ],
        "techniqueDetails": [
          {
            "label": "Lewin nos orienta",
            "detail": "o casal é um campo com dinâmicas próprias que não podem ser compreendidas observando cada parte isoladamente"
          },
          {
            "label": "Posicionamento físico",
            "detail": "ambos devem estar na mesma altura visual, nem um mais próximo de você do que o outro — sinaliza neutralidade"
          },
          {
            "label": "Contrato inicial explícito",
            "detail": "você não é advogado de nenhum dos dois, não guarda segredos de um para o outro (exceto risco de vida), e o objetivo é a relação — não a vitória de nen"
          }
        ],
        "insights": [
          "O maior erro na terapia de casal é tratar cada membro como um paciente individual numa sessão compartilhada.",
          "Lewin nos orienta: o casal é um campo com dinâmicas próprias que não podem ser compreendidas observando cada parte isoladamente.",
          "Posicionamento físico: ambos devem estar na mesma altura visual, nem um mais próximo de você do que o outro — sinaliza neutralidade.",
          "Contrato inicial explícito: você não é advogado de nenhum dos dois, não guarda segredos de um para o outro (exceto risco de vida), e o objetivo é a relação — não a vitória de nenhum.",
          "Sessão 1 (conjunta): escuta da narrativa do casal — o que cada um diz que está acontecendo, o que cada um quer do processo.",
          "Sessão 2 e 3 (individuais, uma com cada): o que cada um não pode dizer na frente do outro — a queixa real, as expectativas ocultas, a avaliação individual do relacionamento.",
          "O padrão mais comum na sessão de casal: um fala, o outro reage defensivamente antes de o primeiro terminar.",
          "Ambos vão, em algum momento, pressionar você a concordar com sua versão.",
          "O parceiro A vai contar algo que parece irrefutável — e esperar que você valide.",
          "Violência doméstica ativa: a terapia de casal em contexto de violência pode aumentar o risco para a parte mais vulnerável.",
          "Quando um dos parceiros já decidiu encerrar o relacionamento mas não informou o outro."
        ],
        "focuses": [
          {
            "concept": "O Casal Como Campo — Não Como Dois Indivíduos",
            "point": "O maior erro na terapia de casal é tratar cada membro como um paciente individual numa sessão compartilhada."
          },
          {
            "concept": "Setting Específico do Atendimento de Casal",
            "point": "Posicionamento físico: ambos devem estar na mesma altura visual, nem um mais próximo de você do que o outro — sinaliza neutralidade."
          },
          {
            "concept": "A Estrutura das Três Primeiras Sessões",
            "point": "Sessão 1 (conjunta): escuta da narrativa do casal — o que cada um diz que está acontecendo, o que cada um quer do processo."
          },
          {
            "concept": "Como Manejar a Sessão Quando um Fala e o Outro Reage",
            "point": "O padrão mais comum na sessão de casal: um fala, o outro reage defensivamente antes de o primeiro terminar."
          },
          {
            "concept": "Aliança com o Casal — Como Manter a Neutralidade Sob Pressão",
            "point": "Ambos vão, em algum momento, pressionar você a concordar com sua versão."
          },
          {
            "concept": "Quando a Terapia de Casal Não É Indicada",
            "point": "Violência doméstica ativa: a terapia de casal em contexto de violência pode aumentar o risco para a parte mais vulnerável."
          }
        ]
      },
      {
        "id": "mod10-a2",
        "title": "Aula 2 — Conflito de Casal: Mapeando o Ciclo e Intervindo no Padrão",
        "theme": "Conflito de Casal: Mapeando o Ciclo e Intervindo no Padrão",
        "moduleTitle": "Módulo 10 — Atendimentos Especializados",
        "concepts": [
          "Todo Conflito de Casal Tem um Ciclo — e o Ciclo É o Problema, Não o Episódio",
          "Os Quatro Cavaleiros de Gottman — o Que Eles Dizem Sobre o Relacionamento",
          "Como Mapear o Ciclo em Sessão — Ferramenta Prática",
          "Intervenção no Nível do Ciclo — Não no Nível do Conteúdo",
          "A Necessidade por Trás da Posição",
          "Técnica: a Conversa Estruturada para Casa"
        ],
        "techniques": [],
        "techniqueDetails": [],
        "insights": [
          "O casal que briga sobre dinheiro, sobre filhos, sobre sexo, sobre sogros — está brigando sobre temas diferentes com o mesmo ciclo.",
          "Identificar esse ciclo — quem dispara, quem reage, como cada um escala, como termina — é mais valioso do que analisar qualquer conflito específico.",
          "Identificar qual desses padrões é dominante naquele casal direciona as intervenções com precisão.",
          "Peça que o casal descreva o último conflito relevante em detalhes sequenciais: o que aconteceu, o que cada um sentiu, o que cada um pensou, o que fez.",
          "Qual foi o primeiro movimento de distância ou ataque?",
          "Quando o casal começa a debater o conteúdo do conflito em sessão — \"mas ele disse que...\" \"mas ela fez...\" — intervenha no nível do ciclo: \"Percebo que estamos repetindo aqui exatamente o que aconteceu naquele momento.",
          "O que está acontecendo em você agora, antes de responder?\" Essa intervenção move o trabalho do conteúdo para o processo — que é onde a mudança acontece.",
          "Cada posição de conflito tem uma necessidade não-expressa por trás.",
          "O parceiro que critica excessivamente geralmente precisa de mais proximidade — mas a crítica produz o afastamento oposto ao que precisa.",
          "Sem solução obrigatória, sem discussão — apenas prática de ser ouvido e ouvir.",
          "Esse exercício simples, repetido, muda o padrão de comunicação mais do que qualquer interpretação em sessão."
        ],
        "focuses": [
          {
            "concept": "Todo Conflito de Casal Tem um Ciclo — e o Ciclo É o Problema, Não o Episódio",
            "point": "O casal que briga sobre dinheiro, sobre filhos, sobre sexo, sobre sogros — está brigando sobre temas diferentes com o mesmo ciclo."
          },
          {
            "concept": "Os Quatro Cavaleiros de Gottman — o Que Eles Dizem Sobre o Relacionamento",
            "point": "Identificar qual desses padrões é dominante naquele casal direciona as intervenções com precisão."
          },
          {
            "concept": "Como Mapear o Ciclo em Sessão — Ferramenta Prática",
            "point": "Peça que o casal descreva o último conflito relevante em detalhes sequenciais: o que aconteceu, o que cada um sentiu, o que cada um pensou, o que fez."
          },
          {
            "concept": "Intervenção no Nível do Ciclo — Não no Nível do Conteúdo",
            "point": "Quando o casal começa a debater o conteúdo do conflito em sessão — \"mas ele disse que...\" \"mas ela fez...\" — intervenha no nível do ciclo: \"Percebo que estamos repetindo aqui exatamente o que aconteceu naquele momento."
          },
          {
            "concept": "A Necessidade por Trás da Posição",
            "point": "Cada posição de conflito tem uma necessidade não-expressa por trás."
          },
          {
            "concept": "Técnica: a Conversa Estruturada para Casa",
            "point": "Sem solução obrigatória, sem discussão — apenas prática de ser ouvido e ouvir."
          }
        ]
      },
      {
        "id": "mod10-a3",
        "title": "Aula 3 — Atendimento de Idosos: Especificidades Clínicas e Técnicas de Abordagem",
        "theme": "Atendimento de Idosos: Especificidades Clínicas e Técnicas de Abordagem",
        "moduleTitle": "Módulo 10 — Atendimentos Especializados",
        "concepts": [
          "O Idoso Que Chega ao Consultório Venceu uma Barreira Cultural",
          "As Queixas Mais Comuns do Idoso em Consultório — e o Que Está por Trás",
          "Como Adaptar a Comunicação Terapêutica para o Idoso",
          "Revisão de Vida — a Técnica Central com Idosos",
          "Como Trabalhar o Medo da Morte sem Falsas Esperanças",
          "Rede Familiar e Sistema de Cuidado — o Campo Ampliado"
        ],
        "techniques": [
          "Solidão e isolamento",
          "Ansiedade sobre saúde e morte",
          "Conflitos familiares",
          "Luto múltiplo",
          "Ritmo mais lento",
          "Linguagem concreta",
          "Reconhecimento da experiência acumulada",
          "Perguntas como"
        ],
        "techniqueDetails": [
          {
            "label": "Solidão e isolamento",
            "detail": "muitas vezes após perdas de cônjuge, amigos, mobilidade ou papéis sociais (aposentadoria)"
          },
          {
            "label": "Ansiedade sobre saúde e morte",
            "detail": "o confronto real com a finitude, não como conceito filosófico mas como experiência cotidiana"
          },
          {
            "label": "Conflitos familiares",
            "detail": "sentir-se fardo, perda de autoridade, conflito de gerações"
          },
          {
            "label": "Luto múltiplo",
            "detail": "idosos frequentemente carregam perdas acumuladas que nunca tiveram espaço de elaboração"
          },
          {
            "label": "Ritmo mais lento",
            "detail": "processamento cognitivo pode ser mais lento — não por déficit, mas por estilo"
          },
          {
            "label": "Linguagem concreta",
            "detail": "metáforas abstratas ou jargões psicológicos contemporâneos criam estranhamento"
          },
          {
            "label": "Reconhecimento da experiência acumulada",
            "detail": "o idoso tem décadas de vivência — a postura do terapeuta deve ser de parceiro que aprende com essa história, não de especialista que explica a vida"
          },
          {
            "label": "Perguntas como",
            "detail": "O que você mais se orgulha quando olha para sua vida?"
          }
        ],
        "insights": [
          "Esse reconhecimento cria aliança imediata — o paciente sente que você entende de onde ele veio antes de entender o que ele traz.",
          "Solidão e isolamento: muitas vezes após perdas de cônjuge, amigos, mobilidade ou papéis sociais (aposentadoria).",
          "Ansiedade sobre saúde e morte: o confronto real com a finitude, não como conceito filosófico mas como experiência cotidiana.",
          "Ritmo mais lento: processamento cognitivo pode ser mais lento — não por déficit, mas por estilo.",
          "Linguagem concreta: metáforas abstratas ou jargões psicológicos contemporâneos criam estranhamento.",
          "Robert Butler identificou a \"Revisão de Vida\" como processo natural e saudável na velhice: olhar para trás, integrar, dar sentido ao percurso.",
          "Facilitar isso em terapia é uma das intervenções mais poderosas nessa faixa etária.",
          "O terapeuta que desvia do tema da morte com idosos está falhando com eles.",
          "A morte não é tabu clínico — é o contexto existencial do atendimento.",
          "No atendimento de idosos, frequentemente a família é parte do campo clínico — às vezes de forma positiva (suporte real), às vezes de forma complicada (superproteção que infantiliza, ou negligência).",
          "Avalie a rede de suporte com cuidado: quem está presente?"
        ],
        "focuses": [
          {
            "concept": "O Idoso Que Chega ao Consultório Venceu uma Barreira Cultural",
            "point": "Esse reconhecimento cria aliança imediata — o paciente sente que você entende de onde ele veio antes de entender o que ele traz."
          },
          {
            "concept": "As Queixas Mais Comuns do Idoso em Consultório — e o Que Está por Trás",
            "point": "Solidão e isolamento: muitas vezes após perdas de cônjuge, amigos, mobilidade ou papéis sociais (aposentadoria)."
          },
          {
            "concept": "Como Adaptar a Comunicação Terapêutica para o Idoso",
            "point": "Ritmo mais lento: processamento cognitivo pode ser mais lento — não por déficit, mas por estilo."
          },
          {
            "concept": "Revisão de Vida — a Técnica Central com Idosos",
            "point": "Robert Butler identificou a \"Revisão de Vida\" como processo natural e saudável na velhice: olhar para trás, integrar, dar sentido ao percurso."
          },
          {
            "concept": "Como Trabalhar o Medo da Morte sem Falsas Esperanças",
            "point": "O terapeuta que desvia do tema da morte com idosos está falhando com eles."
          },
          {
            "concept": "Rede Familiar e Sistema de Cuidado — o Campo Ampliado",
            "point": "No atendimento de idosos, frequentemente a família é parte do campo clínico — às vezes de forma positiva (suporte real), às vezes de forma complicada (superproteção que infantiliza, ou negligência)."
          }
        ]
      },
      {
        "id": "mod10-a4",
        "title": "Aula 4 — Atendimento de Adolescentes: Aliança, Limites e o Que Não Dizer",
        "theme": "Atendimento de Adolescentes: Aliança, Limites e o Que Não Dizer",
        "moduleTitle": "Módulo 10 — Atendimentos Especializados",
        "concepts": [
          "O Adolescente Não Quer Estar na Sua Sala — e Isso É Dado Clínico",
          "A Aliança com o Adolescente — o Que Funciona",
          "O Contrato de Confidencialidade com os Pais — Deixe Claro Desde o Início",
          "Como Trabalhar com Adolescente Que Não Fala",
          "As Questões Centrais da Adolescência Que Aparecem na Clínica",
          "Quando o Problema É o Sistema Familiar — Não o Adolescente"
        ],
        "techniques": [
          "Autenticidade",
          "Interesse real",
          "Humildade sobre o mundo dele",
          "Identidade",
          "Corpo",
          "Pertencimento"
        ],
        "techniqueDetails": [
          {
            "label": "Autenticidade",
            "detail": "adolescentes detectam falsidade com precisão extraordinária"
          },
          {
            "label": "Interesse real",
            "detail": "pergunte sobre o que importa para ele — música, jogos, esporte, amigos — sem performar interesse"
          },
          {
            "label": "Humildade sobre o mundo dele",
            "detail": "você não conhece os detalhes da sua cultura, seus códigos, suas referências — e está tudo bem não saber"
          },
          {
            "label": "Identidade",
            "detail": "quem sou? a que grupo pertenço? o que quero? Autonomia vs"
          },
          {
            "label": "Corpo",
            "detail": "mudanças físicas, sexualidade emergente, comparação social"
          },
          {
            "label": "Pertencimento",
            "detail": "medo de exclusão, dinâmicas de grupo, redes sociais como campo de validação e ameaça"
          }
        ],
        "insights": [
          "A maioria dos adolescentes chega ao consultório porque alguém mandou: pais, escola, pediatra.",
          "Ele não pediu para estar ali — e frequentemente está defensivo, fechado ou performaticamente indiferente.",
          "Autenticidade: adolescentes detectam falsidade com precisão extraordinária.",
          "Interesse real: pergunte sobre o que importa para ele — música, jogos, esporte, amigos — sem performar interesse.",
          "Na primeira sessão, com os pais presentes, estabeleça o contrato: \"O que seu filho ou filha disser aqui é confidencial.",
          "Vou informar vocês apenas se houver risco à segurança dele.",
          "Identidade: quem sou? a que grupo pertenço? o que quero?",
          "Autonomia vs. dependência: quero liberdade mas preciso de suporte — e essa tensão gera conflitos internos e externos que o adolescente raramente consegue nomear.",
          "Em muitos casos o adolescente \"sintomático\" é o porta-voz de um sistema familiar disfuncional.",
          "Ele apresenta o problema, mas o campo que o produz é familiar."
        ],
        "focuses": [
          {
            "concept": "O Adolescente Não Quer Estar na Sua Sala — e Isso É Dado Clínico",
            "point": "A maioria dos adolescentes chega ao consultório porque alguém mandou: pais, escola, pediatra."
          },
          {
            "concept": "A Aliança com o Adolescente — o Que Funciona",
            "point": "Autenticidade: adolescentes detectam falsidade com precisão extraordinária."
          },
          {
            "concept": "O Contrato de Confidencialidade com os Pais — Deixe Claro Desde o Início",
            "point": "Na primeira sessão, com os pais presentes, estabeleça o contrato: \"O que seu filho ou filha disser aqui é confidencial."
          },
          {
            "concept": "As Questões Centrais da Adolescência Que Aparecem na Clínica",
            "point": "Identidade: quem sou? a que grupo pertenço? o que quero?"
          },
          {
            "concept": "Quando o Problema É o Sistema Familiar — Não o Adolescente",
            "point": "Em muitos casos o adolescente \"sintomático\" é o porta-voz de um sistema familiar disfuncional."
          }
        ]
      },
      {
        "id": "mod10-a5",
        "title": "Aula 5 — Casos Complexos: Quando Múltiplos Contextos se Sobrepõem",
        "theme": "Casos Complexos: Quando Múltiplos Contextos se Sobrepõem",
        "moduleTitle": "Módulo 10 — Atendimentos Especializados",
        "concepts": [
          "O Caso Complexo Não É uma Exceção — É a Regra",
          "Como Estabelecer Prioridade de Foco em Caso Complexo",
          "Trabalho em Rede: Quando Integrar Outros Profissionais",
          "Documentação em Casos Complexos — o Que Registrar e por Quê",
          "O Terapeuta Diante do Caso Que Não Avança",
          "A Ética do Encerramento em Casos Complexos"
        ],
        "techniques": [
          "Registre",
          "Frankl nos lembra"
        ],
        "techniqueDetails": [
          {
            "label": "Registre",
            "detail": "hipóteses de trabalho, intervenções relevantes, reações significativas do paciente, acordos e combinados, encaminhamentos realizados"
          },
          {
            "label": "Frankl nos lembra",
            "detail": "autonomia é o objetivo, não a perfeição"
          }
        ],
        "insights": [
          "Raramente o paciente chega com um único problema bem-delimitado.",
          "O paciente real chega com depressão E conflito de casal E questões de identidade E histórico de trauma.",
          "Critério de urgência: há risco imediato à segurança?",
          "Critério de bloqueio: qual problema está impedindo que todos os outros sejam trabalhados? (ex: depressão grave que impede qualquer trabalho cognitivo ou relacional).",
          "Casos com componente psiquiátrico, médico, nutricional, jurídico ou social precisam de rede.",
          "O terapeuta que trabalha em isolamento em casos complexos frequentemente trabalha contra o campo que outros profissionais precisam construir junto.",
          "Em casos complexos, registros clínicos não são burocracia — são segurança clínica e ética.",
          "Registre: hipóteses de trabalho, intervenções relevantes, reações significativas do paciente, acordos e combinados, encaminhamentos realizados.",
          "Todo terapeuta vai ter casos que não se movem por meses.",
          "Antes de concluir que \"esse paciente não tem condição de mudar\", revise: a formulação está correta?",
          "Casos complexos raramente têm um encerramento limpo.",
          "O terapeuta que espera que tudo esteja resolvido para encerrar pode manter um processo por tempo indefinido."
        ],
        "focuses": [
          {
            "concept": "O Caso Complexo Não É uma Exceção — É a Regra",
            "point": "Raramente o paciente chega com um único problema bem-delimitado."
          },
          {
            "concept": "Como Estabelecer Prioridade de Foco em Caso Complexo",
            "point": "Critério de urgência: há risco imediato à segurança?"
          },
          {
            "concept": "Trabalho em Rede: Quando Integrar Outros Profissionais",
            "point": "Casos com componente psiquiátrico, médico, nutricional, jurídico ou social precisam de rede."
          },
          {
            "concept": "Documentação em Casos Complexos — o Que Registrar e por Quê",
            "point": "Em casos complexos, registros clínicos não são burocracia — são segurança clínica e ética."
          },
          {
            "concept": "O Terapeuta Diante do Caso Que Não Avança",
            "point": "Todo terapeuta vai ter casos que não se movem por meses."
          },
          {
            "concept": "A Ética do Encerramento em Casos Complexos",
            "point": "Casos complexos raramente têm um encerramento limpo."
          }
        ]
      }
    ]
  }
];

export function findLessonKnowledge(moduleId?: string | null, lessonId?: string | null): LessonKnowledge {
  const mod = LESSON_KNOWLEDGE.find(m => m.id === moduleId) || LESSON_KNOWLEDGE[0];
  const lesson = mod.lessons.find(l => l.id === lessonId) || mod.lessons[0];
  return lesson;
}

export function flattenLessons(): LessonKnowledge[] {
  return LESSON_KNOWLEDGE.flatMap(m => m.lessons);
}
