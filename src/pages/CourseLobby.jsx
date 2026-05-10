import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import { setSession, getSession } from '@/lib/customAuth';
import { GraduationCap, Lock, ChevronRight, LogOut, Brain, Heart, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const LOGO_URL = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/077216e46_textodoseupargrafoWR_20251219_192959_0000.png';

const LOBBY_MUSIC_KEY = 'wr_lobby_music_enabled';
const LOBBY_MUSIC_EMBED = 'https://www.youtube.com/embed/Cg0dAc4-UCY?autoplay=1&start=545&controls=0&disablekb=1&modestbranding=1&rel=0&loop=1&playlist=Cg0dAc4-UCY';

const COURSES = [
  {
    id: 'tcc',
    title: 'Terapeuta TCC',
    subtitle: 'Abordagem Cognitivo-Comportamental',
    desc: 'Técnicas cognitivo-comportamentais aplicadas à prática clínica, com suporte em tempo real e mentoria ao vivo todas as segundas-feiras.',
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

function CourseVideoCard({ course, isActive, isAdmin, onAdminSelect, onReserve }) {
  const videoRef = useRef(null);
  const navigate = useNavigate();
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
          autoPlay
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
            onClick={() => navigate(`/student/${ ({tcc:'tcc',psicanalise:'psi',sexologia:'sex'})[course.id] || 'tcc'}/dashboard`)}
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
              Reservar Vaga Antecipadamente
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
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(localStorage.getItem('wr_terms_lobby_accepted') === 'yes');
  const [reserveOpen, setReserveOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [lead, setLead] = useState({ name: '', contactType: 'WhatsApp', phone: '' });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LOBBY_MUSIC_KEY, 'on');
    setMusicEnabled(localStorage.getItem(LOBBY_MUSIC_KEY) !== 'off');
  }, []);


  const handleAdminSelectCourse = (courseId) => {
    const current = getSession();
    setSession({ ...current, course: courseId });
    login(); // refresh context
    const slug = COURSE_TO_SLUG[courseId] || 'tcc';
    navigate(`/adm/${slug}/dashboard`);
  };

  const handleStudentEnter = () => {
    if (!termsAccepted) return;
    const slug = COURSE_TO_SLUG[userCourse] || 'tcc';
    navigate(`/student/${slug}/dashboard`);
  };
  const openReserve = (course) => { setSelectedCourse(course); setReserveOpen(true); };
  const sendLead = () => {
    const summary = `Olá! Quero reservar vaga antecipada.%0ACurso: ${selectedCourse?.title}%0ANome: ${lead.name}%0AContato preferencial: ${lead.contactType}%0ATelefone/WhatsApp: ${lead.phone}%0A`;
    window.open(`https://wa.me/5541992531598?text=${summary}`, '_blank');
    setReserveOpen(false);
  };

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-[#080b14] text-white">
        <div className="relative z-10 border-b border-white/8 px-6 py-5">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={LOGO_URL} alt="WR-EDU" className="w-10 h-10 object-contain" />
              <span className="font-black text-lg">WR-EDU</span>
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
    <div className="relative min-h-screen bg-[#080b14] text-white overflow-hidden">
      {musicEnabled && (
        <iframe
          className="absolute w-0 h-0 opacity-0 pointer-events-none"
          src={LOBBY_MUSIC_EMBED}
          title="Lobby ambience audio"
          allow="autoplay"
        />
      )}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(91,94,244,0.25),transparent_45%),radial-gradient(circle_at_82%_8%,rgba(29,184,158,0.2),transparent_42%),radial-gradient(circle_at_50%_85%,rgba(168,85,247,0.12),transparent_45%)]" />
      </div>
      {/* Header */}
      <div className="border-b border-white/8 px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="WR-EDU" className="w-10 h-10 object-contain" />
            <span className="font-black text-lg">WR-EDU</span>
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
            <CourseVideoCard key={c.id} course={c} isActive={userCourse === c.id} isAdmin={false} onAdminSelect={() => {}} onReserve={openReserve} />
          ))}
        </div>
        <div className="max-w-xl mx-auto mt-8 rounded-2xl border border-white/10 p-4 bg-white/5">
          <label className="flex items-start gap-3 text-sm text-white/80">
            <input type="checkbox" checked={termsAccepted} onChange={(e) => { setTermsAccepted(e.target.checked); localStorage.setItem('wr_terms_lobby_accepted', e.target.checked ? 'yes' : 'no'); }} />
            <span>Li e aceito os Termos de Uso e Política de Privacidade para continuar.</span>
          </label>
          <button onClick={handleStudentEnter} disabled={!termsAccepted} className="mt-3 w-full py-3 rounded-xl font-bold bg-[#5b5ef4] disabled:opacity-40">Entrar no Portal do Aluno</button>
        </div>

        <p className="text-center text-white/20 text-xs mt-10">
          Você está matriculado(a) no curso{' '}
          <strong className="text-white/40">{COURSES.find(c => c.id === userCourse)?.title}</strong>. Em caso de dúvidas, entre em contato com a coordenação.
        </p>
      </div>
      <Dialog open={reserveOpen} onOpenChange={setReserveOpen}>
        <DialogContent className="bg-[#0d1120] text-white border-white/10">
          <DialogHeader><DialogTitle>Reserva Antecipada • {selectedCourse?.title}</DialogTitle></DialogHeader>
          <p className="text-sm text-white/70">Que alegria te ver aqui! Vamos garantir sua prioridade e te manter por perto das próximas turmas 🚀</p>
          <Input placeholder="Nome completo" value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })} />
          <Input placeholder="Melhor contato (WhatsApp)" value={lead.contactType} onChange={(e) => setLead({ ...lead, contactType: e.target.value })} />
          <Input placeholder="Telefone / WhatsApp" value={lead.phone} onChange={(e) => setLead({ ...lead, phone: e.target.value })} />
          <Textarea value={`Resumo: ${selectedCourse?.desc || ''}\nBenefícios: metodologia prática, comunidade ativa, suporte contínuo e certificação reconhecida.`} readOnly />
          <button onClick={sendLead} className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 font-bold">Enviar para WhatsApp oficial</button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
