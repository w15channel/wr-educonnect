import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import { setSession, getSession } from '@/lib/customAuth';
import { Lock, ChevronRight, LogOut, Brain, MessageCircle, Send, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { BRAND_LEGAL_NAME, BRAND_SHORT_NAME, WR_PRIMARY_LOGO } from '@/lib/brand';
import SocialInitiativeNotice from '@/components/landing/SocialInitiativeNotice';
import LobbyTutorialChoice from '@/components/onboarding/LobbyTutorialChoice';
import { toast } from 'sonner';

const G = '#d4b96a';
const BG = '#07080f';
const BG2 = '#0a0c18';
const BG3 = '#0f1220';

const MAX_RESERVATION_AI_QUESTIONS = 5;
const RESERVATION_FINAL_MESSAGE = 'Obrigado! Já tenho as informações principais. Agora selecione a opção de enviar a reserva para o WhatsApp oficial. A mensagem será enviada pelo aplicativo WhatsApp no seu celular.';

const LOBBY_MUSIC_KEY = 'wr_lobby_music_enabled';

const COURSES = [
  {
    id: 'tcc',
    title: 'Terapeuta em TC',
    subtitle: 'Terapia Comportamental',
    desc: 'Técnicas de Terapia Comportamental aplicadas à prática clínica, com trilha de estudo estruturada em videoaulas, apostila e atividades práticas.',
    icon: Brain,
    video: 'https://media.base44.com/videos/public/69f55577840a3c93cee191be/9adbe6196_generated_video.mp4',
    tag: 'Turma Ativa',
    active: true,
    externalUrl: null,
  },
];

const OFFER_COURSES = [
  {
    id: 'psicanalise',
    title: 'Psicanalista Diplomado',
    subtitle: 'Formação em Psicanálise',
    desc: 'Fundamentos da Psicanálise Freudiana e Lacaniana, prática clínica supervisionada e aprofundamento terapêutico. Próxima turma: setembro de 2026.',
    originalPrice: 'R$ 450',
    firstMonthPrice: 'R$ 225',
    price: 'R$ 270',
    period: '/mês até o fim do curso',
    tag: 'Em breve · Set/2026',
    video: 'https://media.base44.com/videos/public/69f55577840a3c93cee191be/19e8f76e8_generated_video.mp4',
    imgs: [
      'https://media.base44.com/images/public/69f55577840a3c93cee191be/056bf6bba_176702773849222.jpg',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1400&q=85',
    ],
    highlights: [
      'Fundamentos da Psicanálise Freudiana e Lacaniana',
      'Prática clínica supervisionada',
      'Certificação profissional reconhecida',
      'Análise de sonhos e processos inconscientes',
      'Próxima turma: setembro de 2026',
    ],
  },
  {
    id: 'sexologia',
    title: 'Sexólogo Integrativo',
    subtitle: 'Formação em Sexologia',
    desc: 'Sexualidade humana com base científica, infidelidade conjugal e abordagem integrativa. Próxima turma: setembro de 2026.',
    originalPrice: 'R$ 450',
    firstMonthPrice: 'R$ 225',
    price: 'R$ 270',
    period: '/mês até o fim do curso',
    tag: 'Em breve · Set/2026',
    video: 'https://media.base44.com/videos/public/69f55577840a3c93cee191be/8af57bf56_generated_video.mp4',
    imgs: [
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1400&q=85',
      'https://images.unsplash.com/photo-1609234656388-0ff363383899?w=1400&q=85',
    ],
    highlights: [
      'Sexualidade humana com base científica',
      'Infidelidade conjugal e vícios comportamentais',
      'Abordagem integrativa e sistêmica',
      'Certificação nacional e internacional',
      'Próxima turma: setembro de 2026',
    ],
  },
];

function OfferCard({ course: c, onReserve }) {
  return (
    <div className="border flex flex-col overflow-hidden transition-all" style={{ borderColor: `${G}20` }}>
      {/* Vídeo animado */}
      <div className="relative h-44 overflow-hidden bg-black">
        <video
          src={c.video}
          className="absolute inset-0 w-full h-full object-cover brightness-75"
          muted loop playsInline autoPlay
        />
        <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${BG3}, ${BG3}10)` }} />
        <div className="absolute top-3 left-3 border px-2.5 py-1 text-[9px] font-light uppercase tracking-[0.2em]"
          style={{ borderColor: `${G}50`, color: G, background: `${BG}cc` }}>{c.tag}</div>
      </div>

      {/* Conteúdo */}
      <div className="p-5 flex flex-col flex-1" style={{ background: BG3 }}>
        <h3 className="font-light text-white text-sm uppercase tracking-[0.18em] mb-1">{c.title}</h3>
        <p className="text-white/30 text-xs leading-relaxed mb-4 font-light">{c.subtitle}</p>

        {/* Highlights */}
        <div className="space-y-1.5 mb-5 flex-1">
          {c.highlights.map((h, j) => (
            <div key={j} className="flex items-center gap-2 text-xs text-white/35 font-light">
              <div className="w-1 h-1 shrink-0" style={{ background: `${G}80` }} />
              {h}
            </div>
          ))}
        </div>

        {/* Preços */}
        <div className="pt-4 border-t mb-4" style={{ borderColor: `${G}10` }}>
          <p className="text-[10px] text-white/30 mb-0.5 font-light uppercase tracking-[0.15em]">Oferta de reserva antecipada</p>
          <p className="text-xs text-white/25 mb-0.5 font-light">Valor cheio: <span className="line-through">{c.originalPrice}</span></p>
          <p className="text-[11px] font-light mb-0.5" style={{ color: `${G}80` }}>Primeira mensalidade com 50%:</p>
          <p className="text-2xl font-thin text-white">{c.firstMonthPrice}</p>
          <p className="text-[11px] text-white/30 mt-2 font-light">Depois, 40% de desconto vitalício:</p>
          <p className="text-xl font-thin text-white">{c.price} <span className="text-xs font-light text-white/30">{c.period}</span></p>
          <SocialInitiativeNotice compact className="mt-4 rounded-none" />
        </div>

        <button
          onClick={() => onReserve(c)}
          className="w-full px-4 py-3 border text-[11px] font-medium uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all"
          style={{ borderColor: `${G}60`, color: G }}
          onMouseEnter={e => { e.currentTarget.style.background = G; e.currentTarget.style.color = '#000'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = G; }}
        >
          <MessageCircle size={11} /> Reservar Vaga Antecipada
        </button>
      </div>
    </div>
  );
}

function CourseCard({ course, isActive, isAdmin, onAdminSelect, onReserve, onStudentEnter }) {
  const videoRef = useRef(null);
  const Icon = course.icon;

  return (
    <div
      className={`relative border flex flex-col overflow-hidden transition-all duration-300 ${
        isActive
          ? 'border-[#d4b96a]/30 shadow-lg shadow-[#d4b96a]/5'
          : 'border-[#1e2540] opacity-60'
      }`}
      style={{ background: BG3 }}
      onMouseEnter={() => {}}
      onMouseLeave={() => {}}
    >
      {/* Video area */}
      <div className="relative h-44 overflow-hidden bg-black">
        <video
          ref={videoRef}
          src={course.video}
          className={`w-full h-full object-cover transition-all duration-500 ${!isActive ? 'grayscale brightness-[0.3]' : 'brightness-75'}`}
          muted loop playsInline autoPlay
        />
        <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${BG3}, ${BG3}20)` }} />

        {/* Tag */}
        <div className="absolute top-3 left-3 border px-2.5 py-1 text-[9px] font-light uppercase tracking-[0.2em]"
          style={isActive
            ? { borderColor: `${G}50`, color: G, background: `${BG}cc` }
            : { borderColor: '#ffffff15', color: 'rgba(255,255,255,0.35)', background: `${BG}cc` }}>
          {isActive ? `✓ ${course.tag}` : course.tag}
        </div>

        {/* Lock */}
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="border border-white/10 p-4" style={{ background: `${BG}90` }}>
              <Lock size={22} className="text-white/30" />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-6 h-6 border flex items-center justify-center shrink-0" style={{ borderColor: `${G}25` }}>
            <Icon size={12} style={{ color: isActive ? G : 'rgba(255,255,255,0.3)' }} />
          </div>
          <h3 className={`font-light text-sm uppercase tracking-[0.15em] ${isActive ? 'text-[#e8dfc8]' : 'text-white/35'}`}>{course.title}</h3>
        </div>
        <p className="text-[10px] uppercase tracking-[0.2em] font-light mb-3" style={{ color: `${G}50` }}>{course.subtitle}</p>
        <p className={`text-xs leading-relaxed flex-1 mb-5 font-light ${isActive ? 'text-white/45' : 'text-white/20'}`}>{course.desc}</p>

        {isAdmin ? (
          <button
            onClick={() => onAdminSelect(course.id)}
            className="w-full py-3 border text-[11px] font-medium uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all"
            style={{ borderColor: `${G}60`, color: G }}
            onMouseEnter={e => { e.currentTarget.style.background = G; e.currentTarget.style.color = '#000'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = G; }}
          >
            Gerenciar Turma <ChevronRight size={13} />
          </button>
        ) : isActive ? (
          <button
            onClick={onStudentEnter}
            className="w-full py-3 border text-[11px] font-medium uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all"
            style={{ borderColor: `${G}60`, color: G }}
            onMouseEnter={e => { e.currentTarget.style.background = G; e.currentTarget.style.color = '#000'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = G; }}
          >
            Entrar na Plataforma <ChevronRight size={13} />
          </button>
        ) : course.externalUrl ? (
          <a
            href={course.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 border text-[11px] font-medium uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all"
            style={{ borderColor: `${G}40`, color: G }}
            onMouseEnter={e => { e.currentTarget.style.background = G; e.currentTarget.style.color = '#000'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = G; }}
          >
            Acessar Plataforma <ChevronRight size={13} />
          </a>
        ) : (
          <div className="w-full py-3 border border-[#1e2540] text-[11px] font-light uppercase tracking-[0.2em] text-white/20 flex items-center justify-center gap-2 cursor-default">
            <Lock size={11} /> Plataforma em breve
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

  const termsAccepted = true;
  const [reserveOpen, setReserveOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [leadMessages, setLeadMessages] = useState([]);
  const [leadInput, setLeadInput] = useState('');
  const [leadLoading, setLeadLoading] = useState(false);

  // Primeiro acesso ao lobby: oferece o tutorial escrito ou em vídeo.
  const tutorialKey = `wr_lobby_tutorial_${session?.code || session?.email || 'aluno'}`;
  const [showTutorialChoice, setShowTutorialChoice] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem(tutorialKey);
  });

  const finishTutorialChoice = () => {
    localStorage.setItem(tutorialKey, 'done');
    setShowTutorialChoice(false);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LOBBY_MUSIC_KEY, 'off');
  }, []);

  const handleAdminSelectCourse = (courseId) => {
    const current = getSession();
    setSession({ ...current, course: courseId });
    login();
    navigate(`/adm/dashboard`);
  };

  const handleStudentEnter = () => {
    if (!termsAccepted) return;
    const savedMode = getSession()?.study_mode || session?.study_mode || 'interativa';
    if (savedMode === 'diploma') {
      navigate(`/degree/student/dashboard`);
    } else {
      navigate(`/student/dashboard`);
    }
  };

  const openReserve = (course) => {
    setSelectedCourse(course);
    setLeadMessages([{ role: 'assistant', content: `Olá! Sou a IA da ${BRAND_LEGAL_NAME} 😊 Vamos fazer sua reserva antecipada para ${course.title}. Qual é seu nome completo e melhor número de WhatsApp para contato?` }]);
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
    try {
      const prompt = `Você é a IA de pré-reserva da ${BRAND_LEGAL_NAME}. Conduza um questionário curto para reserva antecipada do curso ${selectedCourse?.title}. Colete nome completo, WhatsApp, email e motivação. Faça uma pergunta por vez, de forma amigável. A resposta anterior foi: "${userMessage.content}". Qual é a próxima pergunta?`;
      const response = await base44.integrations.Core.InvokeLLM({ prompt });
      if (response && typeof response === 'string') {
        setLeadMessages(prev => [...prev, { role: 'assistant', content: response }]);
      } else {
        throw new Error('Resposta inválida da IA');
      }
    } catch (error) {
      console.error('Erro ao chamar IA:', error);
      toast.error('Não foi possível continuar. Tente novamente.');
      setLeadMessages(prev => prev.slice(0, -1)); // Remove mensagem do usuário em caso de erro
    } finally {
      setLeadLoading(false);
    }
  };

  const sendLead = () => {
    const transcript = leadMessages.map(m => `${m.role === 'user' ? 'Interessado' : `IA ${BRAND_SHORT_NAME}`}: ${m.content}`).join('\n');
    const summary = encodeURIComponent(`Olá! Quero reservar vaga antecipada.\nCurso: ${selectedCourse?.title}\n\nQuestionário em chat:\n${transcript}`);
    window.open(`https://wa.me/5541992531598?text=${summary}`, '_blank');
    setReserveOpen(false);
  };

  const Header = () => (
    <div className="border-b px-6" style={{ borderColor: `${G}12`, background: `${BG}f5`, paddingTop: 'calc(1rem + env(safe-area-inset-top, 0px))', paddingBottom: '1rem' }}>
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border flex items-center justify-center" style={{ borderColor: `${G}30` }}>
            <img src={WR_PRIMARY_LOGO} alt={BRAND_LEGAL_NAME} className="w-6 h-6 object-contain" />
          </div>
          <div>
            <p className="text-xs font-light uppercase tracking-[0.25em] text-white/70">{BRAND_SHORT_NAME}</p>
            <p className="text-[9px] font-light text-white/25 uppercase tracking-[0.2em] hidden sm:block">Instituto de Desenvolvimento Humano</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-light text-white/60 uppercase tracking-[0.15em]">{session?.name}</p>
            <p className="text-[9px] text-white/25 uppercase tracking-[0.15em]">{isAdmin ? 'Administrador' : 'Aluno(a)'}</p>
          </div>
          <button onClick={logout} className="border border-white/10 p-2 text-white/30 hover:text-white/60 hover:border-white/20 transition-all" title="Sair">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  if (isAdmin) {
    return (
      <div className="app-shell-bg h-[100dvh] overflow-y-auto overflow-x-hidden scrollbar-invisible text-white" style={{ WebkitOverflowScrolling: 'touch' }}>
        <Header />
        <div className="internal-page-shell">
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-px w-8" style={{ background: `${G}50` }} />
              <span className="text-[10px] uppercase tracking-[0.35em] font-light" style={{ color: `${G}70` }}>Painel do Administrador</span>
              <div className="h-px w-8" style={{ background: `${G}50` }} />
            </div>
            <h1 className="text-4xl lg:text-5xl font-thin text-white mb-3 tracking-[-0.01em]">
              Escolha a <span className="font-light italic" style={{ color: G }}>Turma</span>
            </h1>
            <p className="text-white/35 max-w-md mx-auto text-sm font-light">
              Selecione o curso que deseja gerenciar. Cada turma tem seu painel isolado.
            </p>
          </div>
          <div className="max-w-md mx-auto w-full mb-10">
            {COURSES.map((c) => (
              <CourseCard key={c.id} course={c} isActive={true} isAdmin={true} onAdminSelect={handleAdminSelectCourse} />
            ))}
          </div>
          {/* Oferta dos outros cursos para admin */}
          <div className="max-w-2xl mx-auto w-full">
            <div className="flex items-center gap-3 mb-5 justify-center">
              <div className="h-px flex-1" style={{ background: `${G}20` }} />
              <span className="text-[10px] uppercase tracking-[0.3em] font-light" style={{ color: `${G}60` }}>Próximas Formações — Em Oferta</span>
              <div className="h-px flex-1" style={{ background: `${G}20` }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {OFFER_COURSES.map((c, i) => (
                <OfferCard key={c.id} course={c} onReserve={openReserve} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell-bg lobby-shell relative h-[100dvh] text-white overflow-y-auto overflow-x-hidden scrollbar-invisible" style={{ WebkitOverflowScrolling: 'touch' }}>
      {/* Subtle cosmos gradient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 20% 20%, rgba(212,185,106,0.04), transparent 45%), radial-gradient(circle at 80% 80%, rgba(212,185,106,0.03), transparent 50%)` }} />
      </div>

      <Header />

      {showTutorialChoice && (
        <LobbyTutorialChoice studentName={session?.name} onFinish={finishTutorialChoice} />
      )}

      <div className="internal-page-shell">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-8" style={{ background: `${G}50` }} />
            <span className="text-[10px] uppercase tracking-[0.35em] font-light" style={{ color: `${G}70` }}>Área do Aluno</span>
            <div className="h-px w-8" style={{ background: `${G}50` }} />
          </div>
          <h1 className="text-4xl lg:text-5xl font-thin text-white mb-3 tracking-[-0.01em]">
            Olá, <span className="font-light italic" style={{ color: G }}>{session?.name?.split(' ')[0]}!</span>
          </h1>
          <p className="text-white/35 max-w-md mx-auto text-sm font-light">
            Acesse sua formação em Terapia Comportamental.
          </p>
        </div>

        {/* Oferta dos outros cursos */}
        <div className="max-w-2xl mx-auto w-full mb-10">
          <div className="flex items-center gap-3 mb-5 justify-center">
            <div className="h-px flex-1" style={{ background: `${G}20` }} />
            <span className="text-[10px] uppercase tracking-[0.3em] font-light" style={{ color: `${G}60` }}>Próximas Formações</span>
            <div className="h-px flex-1" style={{ background: `${G}20` }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {OFFER_COURSES.map((c) => (
              <OfferCard key={c.id} course={c} onReserve={openReserve} />
            ))}
          </div>
        </div>

        {/* Course Card — acesso do aluno */}
        <div className="max-w-md mx-auto w-full">
          {COURSES.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              isActive={true}
              isAdmin={false}
              onAdminSelect={() => {}}
              onReserve={openReserve}
              onStudentEnter={handleStudentEnter}
            />
          ))}
        </div>

        <p className="text-center text-white/20 text-[10px] mt-6 mb-4 font-light uppercase tracking-[0.15em]">
          Matriculado(a) em <span className="text-white/35">{COURSES.find(c => c.id === userCourse)?.title}</span> · Dúvidas? Fale com a coordenação.
        </p>
      </div>

      {/* Reserve Modal */}
      {reserveOpen && (
        <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setReserveOpen(false)}>
          <div className="border w-full max-w-lg max-h-[88dvh] shadow-2xl overflow-hidden flex flex-col" style={{ background: BG3, borderColor: `${G}20` }} onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex items-start justify-between gap-4" style={{ borderColor: `${G}12` }}>
              <div>
                <h3 className="text-white/80 font-light text-sm uppercase tracking-[0.22em] flex items-center gap-2"><MessageCircle size={14} style={{ color: G }} /> Reserva Antecipada</h3>
                <p className="text-white/30 text-xs mt-1 font-light">{selectedCourse?.title} · atendimento guiado por IA</p>
              </div>
              <button onClick={() => setReserveOpen(false)} className="text-white/25 hover:text-white/60 transition-colors"><X size={15} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: BG }}>
              {leadMessages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[82%] border px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap font-light"
                    style={message.role === 'user'
                      ? { background: G, borderColor: G, color: '#000' }
                      : { background: BG3, borderColor: `${G}15`, color: 'rgba(255,255,255,0.6)' }}>
                    {message.content}
                  </div>
                </div>
              ))}
              {leadLoading && <p className="text-xs text-white/25 font-light">IA digitando...</p>}
            </div>
            <div className="p-4 border-t space-y-3" style={{ borderColor: `${G}12`, background: BG3 }}>
              <div className="flex gap-2">
                <input
                  value={leadInput}
                  onChange={e => setLeadInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') sendLeadMessage(); }}
                  placeholder={leadMessages.filter(m => m.role === 'user').length >= MAX_RESERVATION_AI_QUESTIONS ? 'Questionário encerrado. Envie pelo WhatsApp.' : 'Responda aqui...'}
                  className="flex-1 border h-11 px-3 text-sm focus:outline-none font-light"
                  style={{ background: BG, borderColor: `${G}18`, color: 'white' }}
                />
                <button
                  onClick={sendLeadMessage}
                  disabled={!leadInput.trim() || leadLoading || leadMessages.filter(m => m.role === 'user').length >= MAX_RESERVATION_AI_QUESTIONS}
                  className="h-11 w-11 border flex items-center justify-center disabled:opacity-30 transition-all"
                  style={{ borderColor: `${G}50`, color: G }}>
                  <Send size={14} />
                </button>
              </div>
              <button
                onClick={sendLead}
                className="w-full py-3 border text-xs uppercase tracking-[0.2em] font-medium transition-all"
                style={{ borderColor: `${G}60`, color: G }}
                onMouseEnter={e => { e.currentTarget.style.background = G; e.currentTarget.style.color = '#000'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = G; }}>
                Enviar para WhatsApp oficial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}