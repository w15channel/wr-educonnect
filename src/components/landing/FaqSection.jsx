import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const G = '#d4b96a';
const BG3 = '#141418';

const FAQS = [
  {
    q: 'Preciso ter formação prévia em psicologia ou saúde para fazer o curso?',
    a: 'Não. Nossos cursos são profissionalizantes e voltados para quem deseja iniciar ou aprofundar uma atuação terapêutica. A metodologia foi desenvolvida para conduzir o aluno do zero até a prática clínica com segurança e ética profissional.'
  },
  {
    q: 'O certificado emitido tem validade nacional e internacional?',
    a: 'Sim. Os certificados são emitidos por instituições parceiras credenciadas e possuem registro verificável. O Curso de Terapia Comportamental conta ainda com credenciamento internacional pela AHDE (ID: 00403THE), reconhecida globalmente.'
  },
  {
    q: 'Como funciona o estudo na plataforma?',
    a: 'Você estuda com videoaulas, apostila digital, tarefas e provas dentro da própria plataforma. Todo o progresso fica registrado para facilitar sua rotina de estudos e revisão.'
  },
  {
    q: 'Qual é a carga horária e quanto tempo terei para concluir?',
    a: 'A carga horária é de 80h distribuídas ao longo de 4 meses. O ritmo é projetado para ser compatível com rotinas de trabalho — você estuda no seu tempo, com acesso à plataforma 24h por dia.'
  },
  {
    q: 'O desconto de 40% é realmente vitalício?',
    a: 'Sim. Alunos que se inscreverem durante o período de matrícula antecipada mantêm o desconto de 40% até o último mês do curso. Isso é um compromisso formal da instituição, e a condição não se aplica a inscrições após a abertura da turma.'
  },
  {
    q: 'Posso cancelar a qualquer momento?',
    a: 'Sim. Não existe fidelidade mínima obrigatória. Caso queira interromper, basta comunicar com até 5 dias de antecedência ao próximo ciclo de cobrança. O acesso ao material já pago é mantido até o final do período em curso.'
  },
  {
    q: 'Como funciona a iniciativa social do curso?',
    a: 'Alunos selecionados por grupos de encaminhamento e pelo projeto ABERTAMENTE podem participar com uma contribuição mensal pessoal, voluntária e sem valor mínimo, de acordo com suas possibilidades financeiras. Não há cobranças posteriores nem distinção financeira ou social entre participantes. Quem deseja apoiar a permanência do projeto também pode contribuir com doações mensais de valor livre.'
  },
  {
    q: 'O que é o Atendimento Terapêutico Social?',
    a: 'É uma iniciativa de responsabilidade social onde atendimentos clínicos são oferecidos por R$ 35,00 para pessoas em vulnerabilidade financeira. Faz parte da missão da instituição de tornar a saúde mental acessível, independentemente da renda do paciente.'
  },
  {
    q: 'Já sou terapeuta. O curso agrega algo para mim?',
    a: 'Com certeza. A formação integra Terapia Comportamental, Psicanálise e Sexologia em uma metodologia prática única. Terapeutas já formados frequentemente relatam que o curso aprofunda repertório clínico e amplia as ferramentas disponíveis para atendimento.'
  }
];

export default function FaqSection() {
  const [open, setOpen] = useState(null);

  return (
    <div className="space-y-2">
      {FAQS.map((faq, i) => (
        <div
          key={i}
          className="border overflow-hidden transition-all"
          style={{ borderColor: open === i ? `${G}25` : `${G}10` }}
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left transition-all"
            style={{ background: open === i ? `${G}06` : 'transparent' }}
          >
            <span className="text-primary-foreground/70 text-sm font-light leading-snug">{faq.q}</span>
            <ChevronDown
              size={15}
              className="shrink-0 transition-transform duration-300"
              style={{
                color: G,
                transform: open === i ? 'rotate(180deg)' : 'rotate(0deg)'
              }}
            />
          </button>
          {open === i && (
            <div className="px-5 pb-5 border-t" style={{ borderColor: `${G}10` }}>
              <p className="text-primary-foreground/40 text-sm leading-relaxed font-light pt-4">{faq.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}