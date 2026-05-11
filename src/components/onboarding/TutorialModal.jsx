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
        <p>Olá! Esta é a plataforma de formação da <strong>{BRAND_LEGAL_NAME}</strong>.</p>
        <p>Aqui você encontrará tudo que precisa para sua formação como terapeuta. Vamos conhecer as principais seções!</p>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
          💡 <strong>Dica:</strong> Use o menu lateral (no computador) ou o menu inferior (no celular) para navegar entre as seções.
        </div>
      </div>
    ),
  },
  {
    icon: '🎬',
    title: 'Aulas',
    subtitle: 'Aprenda no seu ritmo',
    color: 'from-purple-500 to-purple-700',
    content: (
      <div className="space-y-3 text-sm text-gray-600">
        <p>Na seção <strong>Aulas</strong> você encontra todo o conteúdo gravado do curso:</p>
        <ul className="space-y-2">
          {[
            { icon: '▶️', text: 'Videoaulas e aulas em texto para estudar quando quiser' },
            { icon: '✅', text: 'Marque aulas como assistidas para registrar seu progresso' },
            { icon: '📝', text: 'Escreva resumos e comentários de cada aula' },
            { icon: '📎', text: 'Envie atividades relacionadas às aulas' },
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
    icon: '📡',
    title: 'Sala ao Vivo',
    subtitle: 'Participe das aulas em tempo real',
    color: 'from-red-500 to-red-700',
    content: (
      <div className="space-y-3 text-sm text-gray-600">
        <p>A <strong>Sala ao Vivo</strong> é onde acontecem as mentorias e práticas em tempo real:</p>
        <ul className="space-y-2">
          {[
            { icon: '📺', text: 'Assista às transmissões ao vivo pelo link disponibilizado' },
            { icon: '💬', text: 'Participe do chat durante a aula ao vivo' },
            { icon: '✋', text: 'Levante a mão para fazer perguntas' },
            { icon: '📋', text: 'Confirme presença para ganhar pontos' },
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
    subtitle: 'Demonstre seu aprendizado',
    color: 'from-orange-500 to-orange-600',
    content: (
      <div className="space-y-3 text-sm text-gray-600">
        <p>Em <strong>Tarefas e Provas</strong> você encontra as atividades avaliativas:</p>
        <ul className="space-y-2">
          {[
            { icon: '📤', text: 'Envie trabalhos e atividades em arquivo ou texto' },
            { icon: '🧠', text: 'Responda quizzes e provas online diretamente na plataforma' },
            { icon: '⏰', text: 'Fique atento aos prazos de entrega' },
            { icon: '⭐', text: 'Acompanhe suas notas e feedback do professor' },
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
        <p>A <strong>Comunidade</strong> é o coração da plataforma:</p>
        <ul className="space-y-2">
          {[
            { icon: '💬', text: 'Chat da Turma em tempo real — converse com seus colegas!' },
            { icon: '❓', text: 'Fórum de Dúvidas — faça perguntas e ajude colegas' },
            { icon: '💆', text: 'Terapeuta da Semana — prática terapêutica entre alunos' },
            { icon: '👑', text: 'Monitores — acompanhe os alunos destaque da semana' },
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
    title: 'Gamificação & Perfil',
    subtitle: 'Acompanhe sua evolução',
    color: 'from-yellow-500 to-amber-600',
    content: (
      <div className="space-y-3 text-sm text-gray-600">
        <p>Você acumula <strong>pontos</strong> por cada atividade concluída!</p>
        <ul className="space-y-2">
          {[
            { icon: '👤', text: 'Configure seu perfil com foto, bio e avatar personalizado' },
            { icon: '⭐', text: 'Ganhe pontos por aulas, tarefas, lives e participação' },
            { icon: '🏆', text: 'Suba no ranking geral da turma' },
            { icon: '📜', text: 'Gere seu Histórico Acadêmico a qualquer momento' },
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
        <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-xs text-green-700">
          🎓 <strong>Certificado:</strong> Disponível ao atingir 90% de conclusão do curso!
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
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`bg-gradient-to-br ${current.color} p-6 text-white text-center`}>
          <div className="text-5xl mb-3">{current.icon}</div>
          <h2 className="font-black text-xl">{current.title}</h2>
          <p className="text-white/70 text-sm mt-1">{current.subtitle}</p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pt-4 px-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-[#5b5ef4]' : 'w-1.5 bg-gray-200'}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-6 flex-1">{current.content}</div>

        {/* Navigation */}
        <div className="p-5 border-t border-gray-100 flex items-center gap-3">
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
