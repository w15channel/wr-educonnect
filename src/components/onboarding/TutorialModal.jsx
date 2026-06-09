import React, { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BRAND_LEGAL_NAME } from '@/lib/brand';

const STEPS = [
  {
    icon: '🎓',
    title: `Bem-vindo à ${BRAND_LEGAL_NAME}!`,
    subtitle: 'Sua jornada de formação começa aqui',
    color: 'from-[#5b5ef4] to-[#7c5ef4]',
    content: (
      <div className="space-y-3 text-sm text-gray-600">
        <p>Olá! Esta é a plataforma completa de formação da <strong>{BRAND_LEGAL_NAME}</strong>.</p>
        <p>Aqui você encontra tudo para sua formação como terapeuta — aulas, tarefas, comunidade, ferramentas práticas e muito mais. Vamos conhecer cada seção!</p>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
          💡 <strong>Dica:</strong> Use o menu lateral (no computador) ou o menu inferior (no celular) para navegar entre as seções.
        </div>
      </div>
    ),
  },
  {
    icon: '🎬',
    title: 'Aulas & Apostila',
    subtitle: 'Conteúdo gravado para estudar no seu ritmo',
    color: 'from-purple-500 to-purple-700',
    content: (
      <div className="space-y-3 text-sm text-gray-600">
        <p>Em <strong>Aulas</strong> você acessa todo o conteúdo gravado do curso:</p>
        <ul className="space-y-2">
          {[
            { icon: '▶️', text: 'Videoaulas, aulas em texto e materiais externos' },
            { icon: '✅', text: 'Marque aulas como assistidas e registre seu progresso' },
            { icon: '📝', text: 'Escreva resumos e comentários de cada aula' },
            { icon: '📎', text: 'Envie atividades vinculadas às aulas' },
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-purple-700 bg-purple-50 border border-purple-100 rounded-xl p-3">
          📖 <strong>Apostila TCC:</strong> Material didático completo com 10 módulos temáticos. Você pode imprimir ou exportar como PNG cada aula da apostila!
        </p>
      </div>
    ),
  },
  {
    icon: '📡',
    title: 'Sala ao Vivo',
    subtitle: 'Mentorias e práticas em tempo real',
    color: 'from-red-500 to-red-700',
    content: (
      <div className="space-y-3 text-sm text-gray-600">
        <p>A <strong>Sala ao Vivo</strong> é onde acontecem as mentorias todas as segundas-feiras:</p>
        <ul className="space-y-2">
          {[
            { icon: '📺', text: 'Acesse o link da transmissão ao vivo diretamente pela plataforma' },
            { icon: '✋', text: 'Confirme sua presença para ganhar pontos de participação' },
            { icon: '📋', text: 'Histórico de sessões anteriores disponível para revisão' },
            { icon: '🗓️', text: 'Veja as sessões agendadas com data e horário no calendário' },
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
    icon: '📋',
    title: 'Tarefas e Provas',
    subtitle: 'Atividades avaliativas do curso',
    color: 'from-orange-500 to-orange-600',
    content: (
      <div className="space-y-3 text-sm text-gray-600">
        <p>Em <strong>Tarefas e Provas</strong> você encontra todas as atividades avaliativas:</p>
        <ul className="space-y-2">
          {[
            { icon: '📤', text: 'Envie trabalhos e atividades em arquivo ou texto' },
            { icon: '🧠', text: 'Responda provas e quizzes online diretamente na plataforma' },
            { icon: '⏰', text: 'Fique atento aos prazos de entrega de cada atividade' },
            { icon: '⭐', text: 'Acompanhe suas notas e o feedback do professor' },
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
    icon: '💬',
    title: 'Comunidade',
    subtitle: 'Conecte-se com a turma',
    color: 'from-[#1db89e] to-teal-700',
    content: (
      <div className="space-y-3 text-sm text-gray-600">
        <p>A <strong>Comunidade</strong> é o coração da plataforma — conecte-se com seus colegas:</p>
        <ul className="space-y-2">
          {[
            { icon: '💬', text: 'Chat da Turma em tempo real — converse com seus colegas' },
            { icon: '❓', text: 'Fórum de Dúvidas — faça perguntas e ajude a turma' },
            { icon: '🗣️', text: 'Sala de Debates — discussões temáticas moderadas pelo professor' },
            { icon: '💆', text: 'Terapeuta da Semana — prática terapêutica supervisionada entre alunos' },
            { icon: '👑', text: 'Monitores — acompanhe os alunos destaque escolhidos pelo professor' },
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
    icon: '🔥',
    title: 'Ofensivas Diárias',
    subtitle: 'Desafios para manter sua sequência de estudos',
    color: 'from-orange-400 to-red-600',
    content: (
      <div className="space-y-3 text-sm text-gray-600">
        <p>As <strong>Ofensivas</strong> são atividades diárias baseadas no conteúdo do curso:</p>
        <ul className="space-y-2">
          {[
            { icon: '🎯', text: 'Responda até 5 perguntas por dia geradas a partir das aulas' },
            { icon: '🔥', text: 'Mantenha sua sequência de dias consecutivos (streak)' },
            { icon: '⭐', text: 'Cada resposta vale pontos extras no ranking geral' },
            { icon: '📅', text: 'Novo desafio todo dia — as perguntas mudam diariamente' },
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-xs text-orange-700">
          💡 <strong>Dica:</strong> Responda todos os dias para manter sua ofensiva ativa e subir no ranking!
        </div>
      </div>
    ),
  },
  {
    icon: '🤖',
    title: 'Tutor Digital & Ferramentas',
    subtitle: 'Recursos inteligentes de apoio ao estudo',
    color: 'from-violet-500 to-indigo-600',
    content: (
      <div className="space-y-3 text-sm text-gray-600">
        <p>A plataforma conta com ferramentas avançadas para apoiar seu aprendizado:</p>
        <ul className="space-y-2">
          {[
            { icon: '🤖', text: 'Tutor Digital — tire dúvidas sobre o conteúdo do curso com IA' },
            { icon: '📚', text: 'Apostila TCC — material didático em 10 módulos, exportável em PDF/PNG' },
            { icon: '📊', text: 'Histórico Acadêmico — visualize todas suas notas e aproveitamento' },
            { icon: '📖', text: 'Biblioteca — artigos e livros recomendados para aprofundamento' },
            { icon: '🗓️', text: 'Calendário — veja todos os eventos e prazos importantes do curso' },
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
    title: 'Gamificação & Certificado',
    subtitle: 'Sua evolução em números',
    color: 'from-yellow-500 to-amber-600',
    content: (
      <div className="space-y-3 text-sm text-gray-600">
        <p>Você acumula <strong>pontos</strong> por cada atividade concluída e compete no ranking!</p>
        <ul className="space-y-2">
          {[
            { icon: '👤', text: 'Configure seu perfil com foto, bio e avatar personalizado' },
            { icon: '⭐', text: 'Ganhe pontos por aulas, tarefas, lives, ofensivas e participação' },
            { icon: '🏆', text: 'Suba no Ranking Geral e concorra a ser Monitor da Semana' },
            { icon: '📜', text: 'Gere seu Histórico Acadêmico e acompanhe mensalidades' },
            { icon: '💰', text: 'Mensalidades — visualize e gerencie seus pagamentos' },
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
        <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-xs text-green-700">
          🎓 <strong>Certificado:</strong> Disponível ao atingir 90% de conclusão do curso — emitido pela Escola Venes e credenciado pela AHDE!
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
    <div className="fixed inset-0 z-[99] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90dvh]">
        {/* Header */}
        <div className={`bg-gradient-to-br ${current.color} p-6 text-white text-center shrink-0`}>
          <div className="text-5xl mb-3">{current.icon}</div>
          <h2 className="font-black text-xl">{current.title}</h2>
          <p className="text-white/70 text-sm mt-1">{current.subtitle}</p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pt-4 px-6 shrink-0">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-[#5b5ef4]' : 'w-1.5 bg-gray-200'}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">{current.content}</div>

        {/* Navigation */}
        <div className="p-5 border-t border-gray-100 flex items-center gap-3 shrink-0">
          {step > 0 ? (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="gap-1.5 h-10">
              <ChevronLeft size={15} /> Anterior
            </Button>
          ) : <div />}
          <div className="flex-1" />
          <span className="text-xs text-gray-400">{step + 1} / {STEPS.length}</span>
          {isLast ? (
            <Button onClick={onFinish} className="bg-gradient-to-r from-[#5b5ef4] to-[#1db89e] text-white gap-1.5 h-10 px-6">
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