import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import { setSession, getSession } from '@/lib/customAuth';
import { GraduationCap, Lock, ChevronRight, LogOut, Brain, Heart, Sparkles, MessageCircle, Send } from 'lucide-react';
import ServiceTermsModal from '@/components/onboarding/ServiceTermsModal';
import { base44 } from '@/api/base44Client';
import { BRAND_LEGAL_NAME, BRAND_SHORT_NAME, WR_PRIMARY_LOGO } from '@/lib/brand';

const MAX_RESERVATION_AI_QUESTIONS = 5;
const RESERVATION_FINAL_MESSAGE = 'Obrigado! Já tenho as informações principais. Agora selecione a opção de enviar a reserva para o WhatsApp oficial. A mensagem será enviada pelo aplicativo WhatsApp; caso aconteça qualquer problema no envio, entre em contato com a equipe pelo WhatsApp 4199253-1598.';

const LOBBY_MUSIC_KEY = 'wr_lobby_music_enabled';

const COURSES = [
  {
    id: 'tcc',
    title: 'Terapeuta em TC',
    subtitle: 'Terapia Comportamental',
    desc: 'Técnicas de Terapia Comportamental aplicadas à prática clínica, com suporte em tempo real e mentoria ao vivo todas as segundas-feiras.',
    icon: Brain,
    color: '#5b5ef4',
    video: 'https://media.base44.com/videos/public/69f55577840a3c93cee191be/9adbe6196_generated_video.mp4',
    tag: 'Turma Ativa',
  },
  {
    id: 'psicanalise',
    title: 'Psicanalista Freudiano',
    subtitle: 'Método Psicanalítico',
    desc: 'Profundidade do método psicanalítico freudiano com casos clínicos supervisionados, credenciamento internacional e plataforma exclusiva.',
    icon: Sparkles,
    color: '#1db89e',
    video: 'https://media.base44.com/videos/public/69f55577840a3c93cee191be/220a59761_generated_video.mp4',
    tag: 'Em breve · Set/2026',
  },
  {
    id: 'sexologia',
    title: 'Sexólogo(a)',
    subtitle: 'Sexualidade Humana Integrativa',
    desc: '80h de conteúdo especializado em sexualidade humana, com abordagem integrativa, multidisciplinar e credenciamento como terapeuta.',
    icon: Heart,
    color: '#a855f7',
    video: 'https://media.base44.com/videos/public/69f55577840a3c93cee191be/d4e6af21f_generated_video.mp4',
    tag: 'Em breve · Set/2026',
  },
];

function CourseVideoCard({ course, isActive, isAdmin, onAdminSelect, onReserve, onStudentEnter }) {
  const videoRef = useRef(null);
  const Icon = course.icon;

  const handleMouseEnter = () => videoRef.current?.play();

  return (
    <div
      className={`relative bg-[#0d1120] border rounded-3xl overflow-hidden flex flex-col transition-all ${
        isActive
          ? 'border-[#5b5ef4]/50 ring-2 ring-[#5b5ef4]/20 shadow-2xl shadow-[#5b5ef4]/10'
          : 'border-white/10 opacity-70'
      }`}
      onMouseEnter={handleMouseEnter}
    >
      {/* Video / thumbnail area */}
      <div className="relative h-48 overflow-hidden bg-black">
        <video
          ref={videoRef}
          src={course.video}
          className={`w-full h-full object-cover transition-all ${!isActive ? 'grayscale brightness-40' : ''}`}
          muted
          loop
          playsInline
          preload="metadata"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1120] via-transparent to-transparent" />

        {/* Tag badge */}
        <div
          className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black text-white"
          style={{ backgroundColor: isActive ? course.color : '#444' }}
        >
          {isActive ? `✓ ${course.tag}` : course.tag}
        </div>

        {/* Lock overlay */}
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/70 rounded-full p-4 border border-white/10">
              <Lock size={26} className="text-white/50" />
            </div>
          </div>
        )}

      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: course.color + '20' }}>
            <Icon size={13} style={{ color: course.color }} />
          </div>
          <h3 className={`font-black text-lg ${!isActive ? 'text-white/40' : 'text-white'}`}>{course.title}</h3>
        </div>
        <p className="text-white/30 text-xs mb-3">{course.subtitle}</p>
        <p className={`text-sm leading-relaxed flex-1 mb-5 ${!isActive ? 'text-white/25' : 'text-white/55'}`}>{course.desc}</p>

        {isAdmin ? (
          <button
            onClick={() => onAdminSelect(course.id)}
            className="w-full py-3.5 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 shadow-lg transition-all hover:opacity-90 hover:scale-[1.02] active:scale-95"
            style={{ background: `linear-gradient(135deg, ${course.color}, #1db89e)` }}
          >
            Gerenciar esta Turma <ChevronRight size={16} />
          </button>
        ) : isActive ? (
          <button
            onClick={onStudentEnter}
            className="w-full py-3.5 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 shadow-lg transition-all hover:opacity-90 hover:scale-[1.02] active:scale-95"
            style={{ background: `linear-gradient(135deg, ${course.color}, #1db89e)` }}
          >
            Entrar na Plataforma <ChevronRight size={16} />
          </button>
        ) : (
          <div className="space-y-2">
            <button
              onClick={() => onReserve(course)}
              className="w-full py-3 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-emerald-500 to-cyan-500 border border-white/10 flex items-center justify-center gap-2"
            >
              Reserva Antecipada em Chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CourseLobby() {
  const navigate = useNavigate();
  const { session, logout, login, isAdmin } = useCustomAuth();
  const userCourse = session?.course || 'tcc';

  const COURSE_TO_SLUG = { tcc: 'tcc', psicanalise: 'psi', sexologia: 'sex' };
  const [termsAccepted, setTermsAccepted] = useState(localStorage.getItem('wr_terms_lobby_accepted') === 'yes');
  const [reserveOpen, setReserveOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [leadMessages, setLeadMessages] = useState([]);
  const [leadInput, setLeadInput] = useState('');
  const [leadLoading, setLeadLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LOBBY_MUSIC_KEY, 'off');
  }, []);


  const handleAdminSelectCourse = (courseId) => {
    const current = getSession();
    setSession({ ...current, course: courseId });
    login(); // refresh context
    const slug = COURSE_TO_SLUG[courseId] || 'tcc';
    navigate(`/adm/${slug}/dashboard`);
  };

  const handleTermsAccept = () => {
    localStorage.setItem('wr_terms_lobby_accepted', 'yes');
    setTermsAccepted(true);
  };

  const handleStudentEnter = () => {
    if (!termsAccepted) return;
    const slug = COURSE_TO_SLUG[userCourse] || 'tcc';
    navigate(`/student/${slug}/dashboard`);
  };

  const openReserve = (course) => {
    setSelectedCourse(course);
    setLeadMessages([{ role: 'assistant', content: `Olá! Sou a IA da ${BRAND_LEGAL_NAME} 😊 Vamos fazer sua reserva antecipada para ${course.title}. Qual é seu nome completo e melhor WhatsApp?` }]);
    setLeadInput('');
    setReserveOpen(true);
  };

  const sendLeadMessage = async () => {
    if (!leadInput.trim() || leadLoading || leadMessages.filter(m => m.role === 'user').length >= MAX_RESERVATION_AI_QUESTIONS) return;
    const userMessage = { role: 'user', content: leadInput.trim() };
    const nextMessages = [...leadMessages, userMessage];
    const answeredQuestions = nextMessages.filter(m => m.role === 'user').length;
    setLeadMessages(nextMessages);
    setLeadInput('');

    if (answeredQuestions >= MAX_RESERVATION_AI_QUESTIONS) {
      setLeadMessages(prev => [...prev, { role: 'assistant', content: RESERVATION_FINAL_MESSAGE }]);
      return;
    }

    setLeadLoading(true);
    const prompt = `Você é a IA de pré-reserva da ${BRAND_LEGAL_NAME}. Conduza um questionário curto para reserva antecipada do curso ${selectedCourse?.title}. Colete nome completo, WhatsApp, objetivo profissional e melhor horário de contato. Faça no máximo ${MAX_RESERVATION_AI_QUESTIONS} perguntas no total, uma pergunta por vez. Quando tiver os dados principais, ou quando alcançar o limite de ${MAX_RESERVATION_AI_QUESTIONS} perguntas, encerre pedindo para a pessoa selecionar a opção de enviar ao WhatsApp oficial. Explique que a mensagem será enviada pelo aplicativo WhatsApp e que, caso haja qualquer problema no envio, ela deve entrar em contato com a equipe pelo WhatsApp 4199253-1598.\n\nHistórico:\n${nextMessages.map(m => `${m.role === 'user' ? 'Interessado' : 'IA'}: ${m.content}`).join('\n')}\n\nIA:`;
    const response = await base44.integrations.Core.InvokeLLM({ prompt });
    setLeadMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setLeadLoading(false);
  };

  const sendLead = () => {
    const transcript = leadMessages.map(m => `${m.role === 'user' ? 'Interessado' : `IA ${BRAND_SHORT_NAME}`}: ${m.content}`).join('\n');
    const summary = encodeURIComponent(`Olá! Quero reservar vaga antecipada.\nCurso: ${selectedCourse?.title}\n\nQuestionário em chat:\n${transcript}`);
    window.open(`https://wa.me/5541992531598?text=${summary}`, '_blank');
    setReserveOpen(false);
  };

  if (isAdmin) {
    return (
      <div className="h-[100dvh] overflow-y-auto overflow-x-hidden bg-[#080b14] text-white" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="relative z-10 border-b border-white/8 px-6 py-5">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={WR_PRIMARY_LOGO} alt={BRAND_LEGAL_NAME} className="w-10 h-10 object-contain" />
              <span className="font-black text-sm sm:text-lg leading-tight">{BRAND_LEGAL_NAME}</span>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-sm font-semibold text-white">{session?.name}</p>
              <button onClick={logout} className="text-white/40 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/8" title="Sair">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-14">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-[#5b5ef4]/10 border border-[#5b5ef4]/20 rounded-full px-4 py-1.5 mb-5">
              <GraduationCap size={13} className="text-[#5b5ef4]" />
              <span className="text-xs font-bold text-[#5b5ef4] uppercase tracking-widest">Painel do Professor</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-white mb-3">
              Escolha a{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5b5ef4] to-[#1db89e]">Turma</span>
            </h1>
            <p className="text-white/50 max-w-md mx-auto text-base">
              Selecione o curso que deseja gerenciar. Cada turma tem seu painel isolado.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {COURSES.map((c) => (
              <CourseVideoCard key={c.id} course={c} isActive={true} isAdmin={true} onAdminSelect={handleAdminSelectCourse} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] bg-[#080b14] text-white overflow-y-auto overflow-x-hidden" style={{ WebkitOverflowScrolling: 'touch' }}>
      {!termsAccepted && <ServiceTermsModal studentName={session?.name || 'Aluno'} onAccept={handleTermsAccept} />}

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(91,94,244,0.25),transparent_45%),radial-gradient(circle_at_82%_8%,rgba(29,184,158,0.2),transparent_42%),radial-gradient(circle_at_50%_85%,rgba(168,85,247,0.12),transparent_45%)]" />
      </div>
      {/* Header */}
      <div className="border-b border-white/8 px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={WR_PRIMARY_LOGO} alt={BRAND_LEGAL_NAME} className="w-10 h-10 object-contain" />
            <span className="font-black text-sm sm:text-lg leading-tight">{BRAND_LEGAL_NAME}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-white">{session?.name}</p>
              <p className="text-xs text-white/40">Aluno(a)</p>
            </div>
            <button
              onClick={logout}
              className="text-white/40 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/8"
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-14">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#5b5ef4]/10 border border-[#5b5ef4]/20 rounded-full px-4 py-1.5 mb-5">
            <GraduationCap size={13} className="text-[#5b5ef4]" />
            <span className="text-xs font-bold text-[#5b5ef4] uppercase tracking-widest">Área do Aluno</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-white mb-3">
            Olá,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5b5ef4] to-[#1db89e]">
              {session?.name?.split(' ')[0]}!
            </span>
          </h1>
          <p className="text-white/50 max-w-md mx-auto text-base">
            Sua formação está ativa abaixo. As demais turmas estarão disponíveis em breve.
          </p>
        </div>

        {/* Course Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COURSES.map((c) => (
            <CourseVideoCard key={c.id} course={c} isActive={userCourse === c.id} isAdmin={false} onAdminSelect={() => {}} onReserve={openReserve} onStudentEnter={handleStudentEnter} />
          ))}
        </div>
        <div className="max-w-xl mx-auto mt-8 rounded-2xl border border-white/10 p-4 bg-white/5">
          <p className="text-sm text-white/70">O Termo de Prestação de Serviços abre aqui no lobby antes do acesso ao portal.</p>
          <button onClick={handleStudentEnter} disabled={!termsAccepted} className="mt-3 w-full py-3 rounded-xl font-bold bg-[#5b5ef4] disabled:opacity-40">Entrar no Portal do Aluno</button>
        </div>

        <p className="text-center text-white/20 text-xs mt-10">
          Você está matriculado(a) no curso{' '}
          <strong className="text-white/40">{COURSES.find(c => c.id === userCourse)?.title}</strong>. Em caso de dúvidas, entre em contato com a coordenação.
        </p>
      </div>
      {reserveOpen && (
        <div className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setReserveOpen(false)}>
          <div className="bg-[#0d1120] text-white border border-white/10 rounded-3xl w-full max-w-lg max-h-[88dvh] overflow-hidden flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-white/10 flex items-start justify-between gap-4">
              <div>
                <h3 className="font-black text-lg flex items-center gap-2"><MessageCircle size={18} className="text-emerald-400" /> Reserva Antecipada</h3>
                <p className="text-white/40 text-xs mt-1">{selectedCourse?.title} · atendimento guiado por IA</p>
              </div>
              <button onClick={() => setReserveOpen(false)} className="text-white/35 hover:text-white">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#080b14]">
              {leadMessages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${message.role === 'user' ? 'bg-[#5b5ef4]' : 'bg-white/8 border border-white/10 text-white/80'}`}>{message.content}</div>
                </div>
              ))}
              {leadLoading && <p className="text-xs text-white/35">IA digitando...</p>}
            </div>
            <div className="p-4 border-t border-white/10 space-y-3">
              <div className="flex gap-2">
                <input value={leadInput} onChange={(e) => setLeadInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendLeadMessage(); }} placeholder={leadMessages.filter(m => m.role === 'user').length >= MAX_RESERVATION_AI_QUESTIONS ? 'Questionário encerrado. Envie pelo WhatsApp.' : 'Responda aqui...'} className="flex-1 h-11 rounded-xl bg-white/6 border border-white/10 px-3 text-sm outline-none focus:border-emerald-400/60" />
                <button onClick={sendLeadMessage} disabled={!leadInput.trim() || leadLoading || leadMessages.filter(m => m.role === 'user').length >= MAX_RESERVATION_AI_QUESTIONS} className="h-11 w-11 rounded-xl bg-emerald-500 flex items-center justify-center disabled:opacity-40"><Send size={16} /></button>
              </div>
              <button onClick={sendLead} className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 font-bold">Enviar para WhatsApp oficial</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}