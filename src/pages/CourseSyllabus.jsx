import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Brain,
  CheckCircle,
  ChevronRight,
  Clock,
  Heart,
  MessageCircle,
  Shield,
  Sparkles,
  Star,
  Target,
  Users,
  Zap
} from 'lucide-react';
import { BRAND_LEGAL_NAME, WR_PRIMARY_LOGO } from '@/lib/brand';

const courses = [
  {
    id: 'tc',
    title: 'TERAPEUTA TC',
    subtitle: 'Curso Profissionalizante em Terapia Comportamental',
    accent: '#5b5ef4',
    promise: 'Aprenda a conduzir atendimentos com leitura comportamental, estrutura prática e segurança desde as primeiras aulas.',
    modules: [
      'Fundamentos da Terapia Comportamental e ética do atendimento',
      'Análise funcional do comportamento e identificação de padrões',
      'Escuta terapêutica, acolhimento e postura profissional',
      'Técnicas de intervenção comportamental aplicadas à prática',
      'Construção de plano terapêutico e acompanhamento de evolução',
      'Estudos de caso, supervisão e simulações de atendimento'
    ]
  },
  {
    id: 'psicanalise',
    title: 'PSICANALISTA FREUDIANO',
    subtitle: 'Curso Profissionalizante em Métodos Psicanalíticos',
    accent: '#1db89e',
    promise: 'Entre na profundidade do método freudiano com linguagem acessível, prática orientada e aplicação clínica responsável.',
    modules: [
      'Introdução à psicanálise freudiana e seus conceitos centrais',
      'Inconsciente, mecanismos de defesa, transferência e resistência',
      'Escuta psicanalítica e construção do vínculo terapêutico',
      'Interpretação, associação livre e manejo clínico inicial',
      'Sexualidade, desenvolvimento psíquico e conflitos emocionais',
      'Discussão de casos e aplicação do método em situações reais'
    ]
  },
  {
    id: 'sexologia',
    title: 'SEXÓLOGO(A)',
    subtitle: 'Curso Profissionalizante em Sexualidade Humana',
    accent: '#a855f7',
    promise: 'Desenvolva uma atuação madura, ética e acolhedora para lidar com temas sensíveis da sexualidade humana.',
    modules: [
      'Fundamentos da sexualidade humana e diversidade afetivo-sexual',
      'Ética, sigilo, limites de atuação e acolhimento sem julgamento',
      'Desejo, prazer, vínculos, comunicação e conflitos conjugais',
      'Queixas sexuais frequentes e encaminhamentos responsáveis',
      'Infidelidade, vícios, bloqueios emocionais e sofrimento relacional',
      'Estudos de caso e prática de condução terapêutica integrativa'
    ]
  }
];

const methodology = [
  { icon: Zap, title: 'Você pratica cedo', text: 'A formação não fica presa à teoria: o aluno aprende com exemplos, simulações e estudos de caso desde o início.' },
  { icon: Users, title: 'Acompanhamento real', text: 'As aulas ao vivo criam proximidade com o professor, correção de rota e troca com colegas da mesma jornada.' },
  { icon: Target, title: 'Método direto', text: 'O conteúdo é organizado para formar postura, raciocínio clínico e segurança prática — sem excesso de academicismo vazio.' },
  { icon: Shield, title: 'Ética e responsabilidade', text: 'Cada curso reforça limites profissionais, sigilo, acolhimento e encaminhamento adequado quando necessário.' }
];

export default function CourseSyllabus() {
  const whatsappText = encodeURIComponent('Olá! Vi a ementa dos cursos e quero garantir a matrícula antecipada com bolsa de 30%.');

  return (
    <div className="min-h-screen bg-[#080b14] text-white overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(91,94,244,0.25),transparent_35%),radial-gradient(circle_at_top_right,rgba(29,184,158,0.18),transparent_30%)] pointer-events-none" />

      <header className="relative z-10 px-6 lg:px-20 py-6 border-b border-white/8 bg-[#080b14]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <img src={WR_PRIMARY_LOGO} alt="WR" className="w-11 h-11 object-contain" />
            <div className="min-w-0">
              <p className="font-black text-sm sm:text-base truncate">{BRAND_LEGAL_NAME}</p>
              <p className="text-white/35 text-[10px] uppercase tracking-widest">Ementa dos cursos</p>
            </div>
          </Link>
          <Link to="/" className="hidden sm:inline-flex items-center gap-2 text-white/55 hover:text-white text-sm font-semibold transition-colors">
            <ArrowLeft size={15} /> Voltar
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        <section className="px-6 lg:px-20 py-20 lg:py-28">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#1db89e]/10 border border-[#1db89e]/25 rounded-full px-4 py-2 mb-6">
                <Sparkles size={14} className="text-[#1db89e]" />
                <span className="text-xs font-black text-[#1db89e] uppercase tracking-widest">Bolsa de 30% por tempo limitado</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black leading-[0.95] tracking-tight mb-6">
                Conheça a ementa antes de escolher sua formação.
              </h1>
              <p className="text-white/65 text-lg leading-relaxed max-w-2xl mb-8">
                Estes são valores de matrícula antecipada com bolsa de 30% aplicada em todos os cursos. As vagas são limitadas para preservar acompanhamento próximo, prática orientada e qualidade real de formação.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href="#ementas" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#5b5ef4] to-[#1db89e] text-white font-black px-7 py-4 rounded-2xl shadow-2xl shadow-[#5b5ef4]/30 hover:opacity-95 transition-all">
                  Ver conteúdos abordados <ChevronRight size={18} />
                </a>
                <a href={`https://wa.me/5541992531598?text=${whatsappText}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-white/8 border border-white/12 text-white font-bold px-7 py-4 rounded-2xl hover:bg-white/12 transition-all">
                  <MessageCircle size={17} /> Quero minha bolsa
                </a>
              </div>
            </div>

            <div className="bg-white/[0.06] border border-white/10 rounded-[2rem] p-6 lg:p-8 shadow-2xl shadow-black/25">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#5b5ef4] to-[#1db89e] flex items-center justify-center">
                  <Star size={20} className="fill-white text-white" />
                </div>
                <div>
                  <p className="font-black text-lg">Por que decidir agora?</p>
                  <p className="text-white/40 text-sm">A matrícula antecipada reduz o investimento inicial.</p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  'Bolsa de 30% disponível para todos os cursos nesta fase.',
                  'Condições especiais podem encerrar com o preenchimento das vagas.',
                  'Turmas pensadas para acompanhamento mais próximo do professor.',
                  'Formação com prática, comunidade e direção profissional.'
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 bg-black/18 rounded-2xl p-4 border border-white/6">
                    <CheckCircle size={17} className="text-[#1db89e] shrink-0 mt-0.5" />
                    <p className="text-white/70 text-sm leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 lg:px-20 py-16 bg-[#0a0d1a] border-y border-white/8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <div className="inline-flex items-center gap-2 bg-[#5b5ef4]/10 border border-[#5b5ef4]/25 rounded-full px-4 py-2 mb-5">
                <Brain size={14} className="text-[#5b5ef4]" />
                <span className="text-xs font-black text-[#5b5ef4] uppercase tracking-widest">Metodologia única</span>
              </div>
              <h2 className="text-3xl lg:text-5xl font-black mb-4">Não é só assistir aula. É aprender a pensar como terapeuta.</h2>
              <p className="text-white/55 leading-relaxed">
                Nossa metodologia une conteúdo técnico, vivência prática, estudo de casos, comunidade e orientação ao vivo. O objetivo é formar alguém capaz de conduzir uma escuta responsável — não apenas decorar conceitos.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {methodology.map(({ icon: Icon, title, text }) => (
                <div key={title} className="bg-white/[0.045] border border-white/8 rounded-3xl p-5 hover:border-[#1db89e]/30 transition-all">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#5b5ef4]/20 to-[#1db89e]/20 flex items-center justify-center mb-4">
                    <Icon size={18} className="text-[#1db89e]" />
                  </div>
                  <h3 className="font-black text-white mb-2">{title}</h3>
                  <p className="text-white/48 text-sm leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="ementas" className="px-6 lg:px-20 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
              <div>
                <p className="text-[#1db89e] text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2"><BookOpen size={14} /> Conteúdos abordados</p>
                <h2 className="text-3xl lg:text-5xl font-black">Ementa dos cursos</h2>
              </div>
              <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-400/20 text-orange-200 rounded-2xl px-4 py-3 text-sm font-semibold max-w-md">
                <Clock size={16} className="shrink-0" /> Matrícula antecipada com bolsa de 30% enquanto houver disponibilidade.
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <article key={course.id} id={course.id} className="bg-[#0d1120] border border-white/10 rounded-[2rem] overflow-hidden hover:-translate-y-1 hover:border-white/20 transition-all duration-300">
                  <div className="h-2" style={{ backgroundColor: course.accent }} />
                  <div className="p-6 flex flex-col min-h-full">
                    <h3 className="text-2xl font-black mb-2">{course.title}</h3>
                    <p className="text-white/50 text-sm leading-relaxed mb-5">{course.subtitle}</p>
                    <p className="text-white/75 text-sm leading-relaxed bg-white/[0.045] border border-white/8 rounded-2xl p-4 mb-5">{course.promise}</p>
                    <div className="space-y-3 flex-1">
                      {course.modules.map((module) => (
                        <div key={module} className="flex items-start gap-3">
                          <span className="w-2 h-2 rounded-full shrink-0 mt-2" style={{ backgroundColor: course.accent }} />
                          <p className="text-white/58 text-sm leading-relaxed">{module}</p>
                        </div>
                      ))}
                    </div>
                    <a href={`https://wa.me/5541992531598?text=${encodeURIComponent(`Olá! Quero saber mais sobre o curso ${course.title} e a matrícula antecipada com bolsa de 30%.`)}`} target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-black text-sm text-white bg-gradient-to-r from-[#5b5ef4] to-[#1db89e] hover:opacity-95 transition-all">
                      Reservar oportunidade <ChevronRight size={16} />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 lg:px-20 py-20 bg-gradient-to-br from-[#5b5ef4]/18 via-[#080b14] to-[#1db89e]/14">
          <div className="max-w-4xl mx-auto text-center">
            <Heart size={34} className="text-[#1db89e] mx-auto mb-5" />
            <h2 className="text-3xl lg:text-5xl font-black mb-5">Se você sente que essa é sua área, não deixe a decisão para depois.</h2>
            <p className="text-white/60 text-lg leading-relaxed mb-8">
              A bolsa de matrícula antecipada existe para quem decide se posicionar agora. Garanta sua vaga, conheça a turma e comece sua jornada com direção, prática e acompanhamento.
            </p>
            <a href={`https://wa.me/5541992531598?text=${whatsappText}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#5b5ef4] to-[#1db89e] text-white font-black px-9 py-4 rounded-2xl shadow-2xl shadow-[#5b5ef4]/35 hover:opacity-95 transition-all">
              Quero garantir minha matrícula antecipada <MessageCircle size={18} />
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}