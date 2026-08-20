import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BRAND_LEGAL_NAME } from '@/lib/brand';

const STEPS = [
  {
    icon: '🎓',
    title: `Bem-vindo à ${BRAND_LEGAL_NAME}!`,
    subtitle: 'Sua jornada de formação começa aqui',
    color: 'from-[#5b5ef4] to-[#7c5ef4]',
    content: (
      <div className="space-y-3 text-sm text-foreground">
        <p>Olá! Esta é a plataforma completa de formação da <strong>{BRAND_LEGAL_NAME}</strong>.</p>
        <p>Antes de tudo, existem <strong>dois modelos de estudo</strong> — entenda qual é o seu:</p>
        <div className="bg-accent border border-primary rounded-xl p-3 text-xs text-primary space-y-1.5">
          <p><strong>📜 Somente Diploma (Distância):</strong> modelo resumido e individual. Você tem acesso apenas às <strong>aulas gravadas</strong>, à <strong>apostila</strong> e à <strong>entrega de trabalhos</strong>. Não há interação com a comunidade — você estuda sozinho, no seu próprio tempo, sem prazos rígidos.</p>
          <p><strong>🌟 Formação Completa:</strong> imersão total na prática terapêutica. Além de aulas, apostila e tarefas, você tem <strong>fórum</strong>, <strong>sala de debates</strong>, <strong>chat da turma</strong>, a experiência de ser <strong>Terapeuta da Semana</strong>, <strong>lives</strong> e diversas outras ferramentas de prática e comunidade.</p>
        </div>
        <div className="bg-muted border border-border rounded-xl p-3 text-xs text-muted-foreground">
          💡 Use o menu lateral (computador) ou o menu inferior (celular) para navegar entre as seções. Vamos conhecer cada ferramenta em detalhes!
        </div>
      </div>
    ),
  },
  {
    icon: '🎬',
    title: 'Aulas Gravadas',
    subtitle: 'Conteúdo em vídeo para estudar no seu ritmo',
    color: 'from-accent to-primary',
    content: (
      <div className="space-y-3 text-sm text-foreground">
        <p>Em <strong>Aulas</strong> você acessa todo o conteúdo gravado do curso, organizado em módulos:</p>
        <ul className="space-y-2">
          {[
            { icon: '▶️', text: 'Videoaulas, aulas em texto e materiais externos (artigos, PDFs, links)' },
            { icon: '✅', text: 'Marque cada aula como assistida e acompanhe seu progresso por módulo' },
            { icon: '📝', text: 'Escreva um resumo e um comentário de cada aula para confirmar presença' },
            { icon: '📎', text: 'Envie atividades práticas vinculadas diretamente às aulas' },
            { icon: '🏆', text: 'Ao concluir todas as aulas de um módulo, você recebe uma celebração especial' },
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-primary bg-accent border border-primary rounded-xl p-3">
          📖 <strong>Disponível para todos os alunos</strong>, incluindo a modalidade Somente Diploma.
        </p>
      </div>
    ),
  },
  {
    icon: '📚',
    title: 'Apostila Digital',
    subtitle: 'Material didático completo',
    color: 'from-accent to-primary',
    content: (
      <div className="space-y-3 text-sm text-foreground">
        <p>A <strong>Apostila</strong> reúne todo o material didático teórico do curso:</p>
        <ul className="space-y-2">
          {[
            { icon: '🗂️', text: '10 módulos temáticos com conteúdo aprofundado' },
            { icon: '🖨️', text: 'Imprima ou exporte cada aula da apostila em PDF/PNG' },
            { icon: '🔎', text: 'Consulte o material a qualquer momento, no seu ritmo' },
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-primary bg-accent border border-primary rounded-xl p-3">
          📖 <strong>Disponível para todos os alunos</strong>, incluindo a modalidade Somente Diploma.
        </p>
      </div>
    ),
  },
  {
    icon: '📋',
    title: 'Tarefas e Provas',
    subtitle: 'Atividades avaliativas do curso',
    color: 'from-accent to-primary',
    content: (
      <div className="space-y-3 text-sm text-foreground">
        <p>Em <strong>Tarefas e Provas</strong> você encontra todas as atividades avaliativas:</p>
        <ul className="space-y-2">
          {[
            { icon: '📤', text: 'Envie trabalhos e atividades em arquivo ou por texto' },
            { icon: '🧠', text: 'Responda provas e quizzes online diretamente na plataforma' },
            { icon: '⏰', text: 'Fique atento aos prazos de entrega de cada atividade' },
            { icon: '⭐', text: 'Acompanhe suas notas e o feedback do professor' },
            { icon: '🎉', text: 'Toda entrega gera uma celebração de parabéns na hora' },
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-primary bg-accent border border-primary rounded-xl p-3">
          📎 <strong>Disponível para todos os alunos</strong>, incluindo a modalidade Somente Diploma.
        </p>
      </div>
    ),
  },
  {
    icon: '📚',
    title: 'Apostila',
    subtitle: 'Estudo estruturado por módulos',
    color: 'from-accent to-primary',
    content: (
      <div className="space-y-3 text-sm text-foreground">
        <p>A <strong>Apostila</strong> organiza seu aprendizado com trilha completa de estudo:</p>
        <ul className="space-y-2">
          {[
            { icon: '📖', text: 'Acesse conteúdos divididos por módulos e aulas' },
            { icon: '🧠', text: 'Reforce conceitos com leitura guiada no seu ritmo' },
            { icon: '🔎', text: 'Revise capítulos sempre que precisar' },
            { icon: '✅', text: 'Use a apostila como apoio para tarefas e provas' },
            { icon: '🎯', text: 'Mantenha constância com um plano de estudo claro' },
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-primary bg-accent border border-primary rounded-xl p-3">
          🌟 Exclusivo da modalidade <strong>Formação Completa</strong>.
        </p>
      </div>
    ),
  },
  {
    icon: '💬',
    title: 'Comunidade',
    subtitle: 'Conecte-se com a turma',
    color: 'from-[#1db89e] to-primary',
    content: (
      <div className="space-y-3 text-sm text-foreground">
        <p>A <strong>Comunidade</strong> é o coração da imersão prática — conecte-se com seus colegas:</p>
        <ul className="space-y-2">
          {[
            { icon: '💬', text: 'Chat da Turma em tempo real — converse com seus colegas' },
            { icon: '❓', text: 'Fórum de Dúvidas — faça perguntas e ajude a turma, ganhando pontos' },
            { icon: '🗣️', text: 'Sala de Debates — discussões temáticas moderadas pelo professor' },
            { icon: '👑', text: 'Monitores — acompanhe os alunos destaque escolhidos pelo professor' },
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-primary bg-accent border border-primary rounded-xl p-3">
          🌟 Exclusivo da modalidade <strong>Formação Completa</strong>.
        </p>
      </div>
    ),
  },
  {
    icon: '💆',
    title: 'Terapeuta da Semana',
    subtitle: 'Prática terapêutica supervisionada',
    color: 'from-accent to-primary',
    content: (
      <div className="space-y-3 text-sm text-foreground">
        <p>A cada rodada, você é pareado com um colega para praticar a experiência terapêutica:</p>
        <ul className="space-y-2">
          {[
            { icon: '🔀', text: 'Pareamentos automáticos a cada ciclo de dias' },
            { icon: '🧑‍⚕️', text: 'Em uma sessão você é o terapeuta, em outra o paciente' },
            { icon: '📝', text: 'Envie um relato privado da sessão, visível apenas ao professor' },
            { icon: '🗒️', text: 'Mural de Relatos guarda o histórico permanente de todas as práticas' },
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-primary bg-accent border border-primary rounded-xl p-3">
          🌟 Exclusivo da modalidade <strong>Formação Completa</strong>.
        </p>
      </div>
    ),
  },
  {
    icon: '🔥',
    title: 'Ofensivas Diárias',
    subtitle: 'Desafios para manter sua sequência de estudos',
    color: 'from-primary to-destructive',
    content: (
      <div className="space-y-3 text-sm text-foreground">
        <p>As <strong>Ofensivas</strong> são desafios diários baseados no conteúdo do curso:</p>
        <ul className="space-y-2">
          {[
            { icon: '🎯', text: 'Responda 8 perguntas por dia, geradas a partir das aulas e da apostila' },
            { icon: '🗝️', text: 'Perguntas "Baú do Saber" valem mais pontos por serem mais desafiadoras' },
            { icon: '🔥', text: 'Mantenha sua sequência de dias consecutivos (streak)' },
            { icon: '💎', text: 'Sequências de 5, 10 e 20 dias garantem bônus extras de pontos' },
            { icon: '📅', text: 'Novo desafio todo dia — as perguntas mudam diariamente' },
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
        <div className="bg-accent border border-primary rounded-xl p-3 text-xs text-primary">
          💡 <strong>Dica:</strong> Responda todos os dias para manter sua ofensiva ativa e subir no ranking!
        </div>
      </div>
    ),
  },
  {
    icon: '🤖',
    title: 'Tutor Digital & Ferramentas',
    subtitle: 'Recursos inteligentes de apoio ao estudo',
    color: 'from-accent to-primary',
    content: (
      <div className="space-y-3 text-sm text-foreground">
        <p>A plataforma conta com ferramentas de apoio disponíveis para todos os alunos:</p>
        <ul className="space-y-2">
          {[
            { icon: '🤖', text: 'Tutor Digital — tire dúvidas sobre o conteúdo do curso com IA' },
            { icon: '📊', text: 'Histórico Acadêmico — visualize todas suas notas e aproveitamento' },
            { icon: '🗓️', text: 'Calendário — veja todos os eventos e prazos importantes do curso' },
            { icon: '🔔', text: 'Central de Notificações — acompanhe avisos e novidades da turma' },
            { icon: '💰', text: 'Mensalidades — visualize e acompanhe seus pagamentos' },
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    icon: '🏆',
    title: 'Gamificação',
    subtitle: 'Sua evolução em números',
    color: 'from-accent to-primary',
    content: (
      <div className="space-y-3 text-sm text-foreground">
        <p>Você acumula <strong>pontos</strong> por cada atividade concluída e compete no ranking!</p>
        <ul className="space-y-2">
          {[
            { icon: '👤', text: 'Configure seu perfil com foto, bio e avatar personalizado' },
            { icon: '⭐', text: 'Ganhe pontos por aulas, tarefas, provas, lives, ofensivas e participação' },
            { icon: '🏆', text: 'Suba no Ranking Geral e concorra a ser Monitor da Semana' },
            { icon: '🎉', text: 'Toda conquista — aula, tarefa, prova, fórum, debate ou relato — gera uma celebração' },
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    icon: '📜',
    title: 'Certificado',
    subtitle: 'Reconhecimento nacional e internacional',
    color: 'from-accent to-primary',
    content: (
      <div className="space-y-3 text-sm text-foreground">
        <p>Ao concluir o curso, você recebe seu certificado emitido pela <strong>nossa própria unidade certificadora</strong>.</p>
        <ul className="space-y-2">
          {[
            { icon: '🔳', text: 'Cada certificado possui um QR Code exclusivo para consulta pública de autenticidade' },
            { icon: '🇧🇷', text: 'Credenciados nacionalmente junto à ABED (Associação Brasileira de Ensino a Distância)' },
            { icon: '🌍', text: 'Credenciados internacionalmente pela AHDE (Association for Human Development and Evolution)' },
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
        <div className="bg-accent border border-primary rounded-xl p-3 text-xs text-primary">
          🎓 <strong>Disponível ao atingir os requisitos de conclusão do curso</strong>, para as duas modalidades de estudo.
        </div>
      </div>
    ),
  },
];

export default function TutorialModal({ onFinish }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[99] bg-foreground/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90dvh]">
        {/* Header */}
        <div className={`relative bg-gradient-to-br ${current.color} p-6 text-primary-foreground text-center shrink-0`}>
          <button
            onClick={onFinish}
            className="absolute top-3 right-3 flex items-center gap-1 text-primary-foreground/80 hover:text-primary-foreground text-xs font-semibold bg-card/10 hover:bg-card/20 rounded-full px-2.5 py-1 transition-colors"
          >
            Pular <X size={12} />
          </button>
          <div className="text-5xl mb-3">{current.icon}</div>
          <h2 className="font-black text-xl">{current.title}</h2>
          <p className="text-primary-foreground/70 text-sm mt-1">{current.subtitle}</p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pt-4 px-6 shrink-0">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-[#5b5ef4]' : 'w-1.5 bg-secondary'}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">{current.content}</div>

        {/* Navigation */}
        <div className="p-5 border-t border-border flex items-center gap-3 shrink-0">
          {step > 0 ? (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="gap-1.5 h-10">
              <ChevronLeft size={15} /> Anterior
            </Button>
          ) : <div />}
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground">{step + 1} / {STEPS.length}</span>
          {isLast ? (
            <Button onClick={onFinish} className="bg-gradient-to-r from-[#5b5ef4] to-[#1db89e] text-primary-foreground gap-1.5 h-10 px-6">
              Começar! 🚀
            </Button>
          ) : (
            <Button onClick={() => setStep(s => s + 1)} className="gap-1.5 h-10">
              Próximo <ChevronRight size={15} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}