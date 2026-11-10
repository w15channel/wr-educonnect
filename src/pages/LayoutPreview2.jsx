import { invokePollinations } from '@/lib/pollinationsAI';
import React, { useState, useEffect } from 'react';
import {
  Key, Sparkles, Users, BookOpen, Heart,
  Star, ChevronRight, Shield, CheckCircle, ExternalLink,
  ArrowDown, Quote, Menu, X, Play, Zap, AlertCircle, MessageCircle, Send,
  Instagram, Award, GraduationCap, ArrowUpRight
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { setSession } from '@/lib/customAuth';
import { BRAND_CNPJ, BRAND_LEGAL_NAME, BRAND_SHORT_NAME, WR_PRIMARY_LOGO } from '@/lib/brand';
import FaqSection from '@/components/landing/FaqSection';
import SocialInitiativeNotice from '@/components/landing/SocialInitiativeNotice';

const MAX_RESERVATION_AI_QUESTIONS = 5;
const RESERVATION_FINAL_MESSAGE = 'Obrigado! Já tenho as informações principais. Agora selecione a opção de enviar a reserva para o WhatsApp oficial. A mensagem será enviada pelo aplicativo WhatsApp; caso aconteça qualquer problema no envio, entre em contato com a equipe pelo WhatsApp 4199253-1598.';
const SOCIAL_FINAL_MESSAGE = 'Obrigado. Agora escolha uma data e horário no calendário do mês vigente. Após o agendamento, em até 48 horas um atendente entrará em contato pelo WhatsApp para enviar o código Pix do atendimento social no valor de R$ 35,00 por consulta.';
const OFFER_DURATION_MS = 48 * 60 * 60 * 1000;
const SOCIAL_APPOINTMENT_PRICE = 35;
const SOCIAL_TIME_SLOTS = ['09:00', '10:30', '14:00', '15:30', '19:00'];
const INSTAGRAM_PROFILE_URL = 'https://www.instagram.com/wrterapia';
const SOCIAL_REEL_URL = 'https://www.instagram.com/wrterapia/reel/DTvNvvoDHgd/';
const SOCIAL_REEL_EMBED_URL = 'https://www.instagram.com/reel/DTvNvvoDHgd/embed';

const HERO_IMAGES = [
  'https://media.base44.com/images/public/69f55577840a3c93cee191be/056bf6bba_176702773849222.jpg',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1400&q=85',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1400&q=85',
  'https://images.unsplash.com/photo-1609234656388-0ff363383899?w=1400&q=85'
];

const FEATURES = [
  { icon: BookOpen, title: 'Videoaulas Gravadas', desc: 'Conteúdo terapêutico exclusivo e gravado em alta definição' },
  { icon: BookOpen, title: 'Apostila Digital', desc: 'Estudo guiado passo a passo com materiais complementares' },
  { icon: Users, title: 'Comunidade Ativa', desc: 'Troca contínua de experiências e networking entre alunos' },
  { icon: Heart, title: 'Prática Real', desc: 'Supervisão e simulação de casos clínicos reais desde o início' }
];

const CERTS = [
  {
    title: 'Psicoterapeuta',
    institution: 'Faculdade Unypública',
    code: '267797-1-432-19012026071526',
    extra: 'Registrado internacionalmente pela AHDE · ID: 00403THE',
    verifyLink: 'https://www.ahde-global.org/lang/ptbr/terapeuta.php?search=00403THE',
    verifyLabel: 'Verificar via AHDE'
  },
  {
    title: 'Psicanalista Diplomado',
    institution: 'Faculdade Unifatec',
    code: 'eeee6d19-0d18-46c5-a657-3e6f5bfdb515',
    extra: 'Registrado internacionalmente pela Therapist University · ID: CERT-1768040814293-CAZA86VTQ',
    verifyLink: 'https://certificados.therapist.university/certificates/CERT-1768040814293-CAZA86VTQ',
    verifyLabel: 'Verificar Certificado'
  },
  {
    title: 'Logoterapeuta Diplomado',
    institution: 'Faculdade Unypública',
    code: '267797-1-405-13112025030416',
    extra: 'Fundamentação na análise existencial e sentido da vida',
    verifyLink: null,
    verifyLabel: null
  },
  {
    title: 'Sexólogo Integrativo',
    institution: 'Unifast — School of Business Acceleration',
    code: '000300950029868',
    extra: 'Especializações em sexualidade humana, infidelidade conjugal e vícios',
    verifyLink: null,
    verifyLabel: null
  }
];

const CURRENT = [
  {
    title: 'Dirigente — Sinapse Coletiva',
    desc: 'Grupo formado por profissionais da saúde comportamental com o objetivo de construir um espaço consciente de técnicas e comunidade acadêmica.',
    link: null
  },
  {
    title: `Gestor — ${BRAND_LEGAL_NAME}`,
    desc: `Gerencia o Curso Profissionalizante para Formação de Terapeutas pela ${BRAND_LEGAL_NAME}. Representado officially junto à ABED.`,
    link: 'https://www.abed.org.br/site/associados/consulta-associados-ativos/',
    linkLabel: 'Consultar na ABED'
  },
  {
    title: 'Educador Social — Projeto Vida Digital (ADRA)',
    desc: 'Atuação como Educador Social para Crianças e Adolescentes no programa da ADRA, reestruturando grupos em vulnerabilidade social.',
    link: 'https://adra.org.br/projetos/vida-digital/',
    linkLabel: 'Conhecer o Projeto'
  }
];

const COURSES = [
  {
    slug: 'tc',
    title: 'TERAPEUTA TC',
    subtitle: 'Curso Profissionalizante em Terapia Comportamental',
    originalPrice: 'R$ 450',
    firstMonthPrice: 'R$ 225',
    price: 'R$ 270',
    period: '/mês até o fim do curso',
    tag: 'Mais Vendido',
    externalUrl: null,
    imgs: [
      'https://media.base44.com/images/public/69f55577840a3c93cee191be/1d898387b_generated_image.png',
      'https://media.base44.com/images/public/69f55577840a3c93cee191be/7a4725dbb_generated_image.png',
      'https://media.base44.com/images/public/69f55577840a3c93cee191be/fa5959e53_generated_image.png',
    ],
    highlights: [
      'Técnicas de Terapia Comportamental aplicadas',
      'Prática clínica desde as primeiras semanas',
      'Credenciamento internacional como terapeuta',
      'Plataforma centralizada de conteúdos',
      'Apostila digital para estudo contínuo',
      'Ingresso para turma de 2026',
    ]
  },
  {
    slug: 'psi',
    title: 'PSICANALISTA FREUDIANO',
    subtitle: 'Curso Profissionalizante em Métodos Psicanalíticos',
    originalPrice: 'R$ 500',
    firstMonthPrice: 'R$ 250',
    price: 'R$ 300',
    period: '/mês até o fim do curso',
    tag: 'Novo',
    externalUrl: null,
    imgs: [
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80',
    ],
    highlights: [
      'Estudos de casos reais supervisionados',
      'Profundidade do método psicanalítico freudiano',
      'Credenciamento internacional como terapeuta',
      'Plataforma centralizada de conteúdos',
      'Apostila digital para estudo contínuo',
      'Ingresso para turma de 2026',
    ]
  },
  {
    slug: 'sex',
    title: 'SEXÓLOGO(A)',
    subtitle: 'Curso Profissionalizante em Sexualidade Humana',
    originalPrice: 'R$ 550',
    firstMonthPrice: 'R$ 275',
    price: 'R$ 330',
    period: '/mês até o fim do curso',
    tag: 'Novo',
    externalUrl: null,
    imgs: [
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
      'https://images.unsplash.com/photo-1609234656388-0ff363383899?w=800&q=80',
    ],
    highlights: [
      'Estudos de casos reais em sexualidade',
      '80h de conteúdo especializado e integrativo',
      'Credenciamento internacional como terapeuta',
      'Plataforma centralizada de conteúdos',
      'Apostila digital para estudo contínuo',
      'Ingresso para turma de 2026',
    ]
  }
];

const TESTIMONIALS = [
  { name: 'Diane Martins', text: 'Ao nosso mentor William, parabenizo pela dedicação, entrega e intencionalidade em dar o primeiro passo na formação de novos terapeutas. Do aparente "menor ofício" ao mais significativo, você ousou, acreditou, executou, e o resultado está à disposição de todos que desejam crescer.', stars: 5 },
  { name: 'Stella Torres', text: 'Estou maravilhada com o andamento do curso. Confesso que iniciei um pouco desanimada e confusa, mas, mesmo em pouco tempo, nosso professor me impulsionou a acreditar que chegarei ao meu objetivo. A plataforma ficou excelente, bonita e atrativa.', stars: 5 },
  { name: 'Marilene Batista', text: 'Estou aqui navegando pela plataforma e, olha, eu já fiz vários cursos mas nos detalhes se percebe o capricho, o zelo e a entrega do nosso professor! Agradeço demais sua dedicação. Seu espírito visionário nos move a querer ir além.', stars: 5 },
  { name: 'Ana Paula M.', text: 'A formação mais completa que já fiz. O diferencial da prática desde o início foi transformador para mim.', stars: 5 },
  { name: 'Carlos Eduardo S.', text: 'O Professor William tem uma didática incrível. Aprendi mais aqui do que em anos de graduação.', stars: 5 },
  { name: 'Fernanda R.', text: 'Plataforma excelente, suporte impecável e conteúdo de altíssimo nível. Super recomendo!', stars: 5 }
];

// ── Paleta Original Refinada — Ouro Pálido & Dark Velvet ──────────────────────
const G = '#d4b96a';   // ouro pálido
const BG = '#0a0a0c';  // preto profundo
const BG2 = '#0f0f13'; // seções alternadas
const BG3 = '#14141a'; // cards e containers de destaque

export default function LandingPage({ onLogin }) {
  const [heroImg, setHeroImg] = useState(0);
  const [courseImgs, setCourseImgs] = useState([0, 0, 0]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [mode, setMode] = useState('code');
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const [code, setCode] = useState('');
  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [rememberCode, setRememberCode] = useState(localStorage.getItem('wr_remember_student_code') === 'yes');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [testimonials, setTestimonials] = useState(TESTIMONIALS);

  const [reserveOpen, setReserveOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [leadMessages, setLeadMessages] = useState([]);
  const [leadInput, setLeadInput] = useState('');
  const [leadLoading, setLeadLoading] = useState(false);

  const [socialOpen, setSocialOpen] = useState(false);
  const [socialMessages, setSocialMessages] = useState([]);
  const [socialInput, setSocialInput] = useState('');
  const [socialLoading, setSocialLoading] = useState(false);
  const [selectedSocialDate, setSelectedSocialDate] = useState('');
  const [selectedSocialTime, setSelectedSocialTime] = useState('');
  const [socialBooked, setSocialBooked] = useState(false);
  const [offerTimeLeft, setOfferTimeLeft] = useState(OFFER_DURATION_MS);

  useEffect(() => {
    const interval = setInterval(() => setHeroImg((i) => (i + 1) % HERO_IMAGES.length), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const intervals = COURSES.map((_, i) =>
      setInterval(() => {
        setCourseImgs(prev => prev.map((v, idx) => idx === i ? (v + 1) % COURSES[i].imgs.length : v));
      }, 4500 + i * 1500)
    );
    return () => intervals.forEach(clearInterval);
  }, []);

  useEffect(() => {
    const getOrResetDeadline = () => {
      const stored = localStorage.getItem('wrEduOfferDeadline');
      const deadline = stored ? Number(stored) : 0;
      if (!stored || deadline <= Date.now()) {
        const next = Date.now() + OFFER_DURATION_MS;
        localStorage.setItem('wrEduOfferDeadline', String(next));
        return next;
      }
      return deadline;
    };

    let deadline = getOrResetDeadline();
    const updateTimer = () => {
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        deadline = Date.now() + OFFER_DURATION_MS;
        localStorage.setItem('wrEduOfferDeadline', String(deadline));
        setOfferTimeLeft(OFFER_DURATION_MS);
      } else {
        setOfferTimeLeft(remaining);
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const offerHours = String(Math.floor(offerTimeLeft / 3600000)).padStart(2, '0');
  const offerMinutes = String(Math.floor((offerTimeLeft % 3600000) / 60000)).padStart(2, '0');
  const offerSeconds = String(Math.floor((offerTimeLeft % 60000) / 1000)).padStart(2, '0');

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const savedCode = localStorage.getItem('wr_saved_student_code') || '';
    if (savedCode) setCode(savedCode);
  }, []);

  useEffect(() => {
    const loadTestimonials = async () => {
      if (!import.meta.env.VITE_BASE44_APP_BASE_URL) return;
      try {
        const approved = await base44.entities.Testimonial.filter({ approved: true }, '-created_date', 20);
        if (approved?.length) {
          setTestimonials(approved.map(t => ({ name: t.student_name || 'Aluno(a)', stars: Number(t.stars || 5), text: t.comment || '' })));
        }
      } catch {}
    };
    loadTestimonials();
  }, []);

  const handleCodeLogin = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const response = await base44.functions.invoke('siteLogin', { mode: 'student', code });
      localStorage.setItem('wr_remember_student_code', rememberCode ? 'yes' : 'no');
      if (rememberCode) localStorage.setItem('wr_saved_student_code', code.trim().toUpperCase());
      else localStorage.removeItem('wr_saved_student_code');
      setSession(response.data.session, { remember: rememberCode });
      setShowLoginModal(false);
      if (response?.data?.session?.role === 'admin') {
        onLogin('adm/dashboard');
      } else {
        onLogin(response?.data?.session?.study_mode === 'interativa' ? 'student/dashboard' : 'degree/student/dashboard');
      }
    } catch (err) {
      const message = err?.response?.data?.error;
      setError(message === 'not-found' || err?.response?.status === 404
        ? 'O serviço de entrada está indisponível no momento. Isso não significa que seu código seja inválido. Tente novamente em alguns minutos.'
        : message || 'Não foi possível entrar. Verifique sua conexão e tente novamente.');
    }
    setLoading(false);
  };

  const handleAdminKeyLogin = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const response = await base44.functions.invoke('siteLogin', { mode: 'student', code: adminKeyInput.trim() });
      if (response?.data?.session?.role === 'admin') {
        setSession(response.data.session, { remember: true });
        setShowLoginModal(false);
        onLogin('adm/dashboard');
      } else {
        setError('Esta chave não possui privilégios de administrador.');
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Chave de administrador incorreta.');
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError(''); setLoading(true);
    try {
      const response = await base44.functions.invoke('siteLogin', { mode: 'admin_google' });
      if (response?.data?.session) {
        setSession(response.data.session, { remember: true });
        setShowLoginModal(false);
        onLogin('adm/dashboard');
      }
    } catch {
      base44.auth.redirectToLogin(window.location.href);
    }
    setLoading(false);
  };

  const openCourseReservation = (course) => {
    setSelectedCourse(course);
    setLeadMessages([{ role: 'assistant', content: `Olá! Sou a IA da ${BRAND_LEGAL_NAME} 😊 Vou registrar sua reserva antecipada para ${course.title}. Para começar: qual é seu nome completo e melhor WhatsApp?` }]);
    setLeadInput(''); setReserveOpen(true);
  };

  const sendReserveChatMessage = async () => {
    if (!leadInput.trim() || leadLoading || leadMessages.filter(m => m.role === 'user').length >= MAX_RESERVATION_AI_QUESTIONS) return;
    const userMessage = { role: 'user', content: leadInput.trim() };
    const nextMessages = [...leadMessages, userMessage];
    const answeredQuestions = nextMessages.filter(m => m.role === 'user').length;
    setLeadMessages(nextMessages); setLeadInput('');
    if (answeredQuestions >= MAX_RESERVATION_AI_QUESTIONS) { setLeadMessages(prev => [...prev, { role: 'assistant', content: RESERVATION_FINAL_MESSAGE }]); return; }
    setLeadLoading(true);
    const prompt = `Você é a IA de pré-reserva da ${BRAND_LEGAL_NAME}. Conduza um questionário curto em formato de chat para reserva antecipada do curso ${selectedCourse?.title}.\nFaça no máximo ${MAX_RESERVATION_AI_QUESTIONS} perguntas no total, uma pergunta por vez, até coletar: nome completo, WhatsApp, curso de interesse, objetivo profissional e melhor horário de contato.\nQuando os dados principais já estiverem presentes, ou quando alcançar o limite de ${MAX_RESERVATION_AI_QUESTIONS} perguntas, encerre o diálogo pedindo para a pessoa selecionar a opção de enviar a reserva ao WhatsApp oficial. Explique que a mensagem será enviada pelo aplicativo WhatsApp e que, caso haja qualquer problema no envio, ela deve entrar em contato com a equipe pelo WhatsApp 4199253-1598. Seja acolhedor, objetivo e use português do Brasil.\n\nHistórico:\n${nextMessages.map(m => `${m.role === 'user' ? 'Interessado' : 'IA'}: ${m.content}`).join('\n')}\n\nIA:`;
    const response = await invokePollinations({ prompt });
    setLeadMessages(prev => [...prev, { role: 'assistant', content: response }]); setLeadLoading(false);
  };

  const sendReserveToWhatsApp = () => {
    const transcript = leadMessages.map(m => `${m.role === 'user' ? 'Interessado' : `IA ${BRAND_SHORT_NAME}`}: ${m.content}`).join('\n');
    const summary = encodeURIComponent(`Olá! Quero reservar vaga antecipada.\nCurso: ${selectedCourse?.title}\n\nQuestionário em chat:\n${transcript}`);
    window.open(`https://wa.me/5541992531598?text=${summary}`, '_blank'); setReserveOpen(false);
  };

  const openSocialAppointment = () => {
    setSocialMessages([{ role: 'assistant', content: 'Olá! Vou fazer uma breve entrevista para o Atendimento Terapêutico Social. Para começar: qual é seu nome completo e WhatsApp para contato?' }]);
    setSocialInput(''); setSelectedSocialDate(''); setSelectedSocialTime(''); setSocialBooked(false); setSocialOpen(true);
  };

  const sendSocialChatMessage = async () => {
    if (!socialInput.trim() || socialLoading || socialMessages.filter(m => m.role === 'user').length >= 5) return;
    const userMessage = { role: 'user', content: socialInput.trim() };
    const nextMessages = [...socialMessages, userMessage];
    const answeredQuestions = nextMessages.filter(m => m.role === 'user').length;
    setSocialMessages(nextMessages); setSocialInput('');
    if (answeredQuestions >= 5) { setSocialMessages(prev => [...prev, { role: 'assistant', content: SOCIAL_FINAL_MESSAGE }]); return; }
    setSocialLoading(true);
    const prompt = `Você é a IA de triagem acolhedora do Atendimento Terapêutico Social da ${BRAND_LEGAL_NAME}. Faça uma entrevista curta com no máximo 5 perguntas no total, uma pergunta por vez, em português do Brasil. Colete: nome e WhatsApp, principal motivo da busca, urgência emocional, se já faz acompanhamento, preferência de horário. Não faça diagnóstico. Reforce que é um espaço sério, seguro e de cuidado comportamental. Ao final, oriente a pessoa a escolher data e horário no calendário e informe que em até 48 horas um atendente enviará o Pix de R$ 35,00 por consulta.\n\nHistórico:\n${nextMessages.map(m => `${m.role === 'user' ? 'Pessoa' : 'IA'}: ${m.content}`).join('\n')}\n\nIA:`;
    const response = await invokePollinations({ prompt });
    setSocialMessages(prev => [...prev, { role: 'assistant', content: response }]); setSocialLoading(false);
  };

  const getCurrentMonthDates = () => {
    const now = new Date();
    const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth(), i + 1);
      const iso = date.toISOString().slice(0, 10);
      return { iso, day: i + 1, week: date.toLocaleDateString('pt-BR', { weekday: 'short' }) };
    }).filter(d => d.iso >= now.toISOString().slice(0, 10));
  };

  const bookSocialAppointment = async () => {
    if (!selectedSocialDate || !selectedSocialTime) return;
    const transcript = socialMessages.map(m => `${m.role === 'user' ? 'Pessoa' : `IA ${BRAND_SHORT_NAME}`}: ${m.content}`).join('\n');
    await base44.entities.SocialAppointment.create({ preferred_date: selectedSocialDate, preferred_time: selectedSocialTime, interview_transcript: transcript, price: SOCIAL_APPOINTMENT_PRICE, status: 'requested' });
    setSocialBooked(true);
  };

  const SectionLabel = ({ children }) => (
    <div className="inline-flex items-center gap-3 mb-4">
      <div className="h-px w-6" style={{ background: `${G}60` }} />
      <span className="text-[10px] uppercase tracking-[0.3em] font-light" style={{ color: `${G}aa` }}>{children}</span>
      <div className="h-px w-6" style={{ background: `${G}60` }} />
    </div>
  );

  return (
    <div className="min-h-screen text-white font-sans selection:bg-[#d4b96a]/20 selection:text-[#d4b96a]" style={{ background: BG }}>

      {/* TOP NAVIGATION BAR */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navScrolled ? 'border-b backdrop-blur-md shadow-2xl' : ''}`}
        style={{
          paddingTop: `calc(${navScrolled ? '0.6rem' : '1.1rem'} + env(safe-area-inset-top, 0px))`,
          paddingBottom: navScrolled ? '0.6rem' : '1.1rem',
          background: navScrolled ? `${BG}f5` : 'transparent',
          borderColor: navScrolled ? `${G}1a` : 'transparent',
        }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Brand Wordmark */}
          <a href="#top" className="flex items-center gap-3 group min-w-0">
            <div className="w-9 h-9 border flex items-center justify-center transition-all group-hover:border-[#d4b96a]/80" style={{ borderColor: `${G}35`, background: `${BG3}cc` }}>
              <img src={WR_PRIMARY_LOGO} alt="WR Logo" className="w-6 h-6 object-contain" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-light tracking-[0.25em] uppercase text-white group-hover:text-[#d4b96a] transition-colors truncate">{BRAND_SHORT_NAME}</span>
              <span className="hidden sm:block text-[8px] uppercase tracking-[0.22em] font-light truncate" style={{ color: `${G}70` }}>Instituto de Desenvolvimento Humano</span>
            </div>
          </a>

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-[11px] uppercase tracking-[0.2em] font-light text-white/40">
            {[
              ['Metodologia', '#metodologia'],
              ['Mentor', '#professor'],
              ['Cursos', '#cursos'],
              ['Depoimentos', '#depoimentos'],
              ['FAQ', '#faq'],
              ['Atendimento Social', '#atuacao-social']
            ].map(([label, href]) => (
              <a key={label} href={href} className="hover:text-white transition-colors relative py-1 group"
                onMouseEnter={e => { e.currentTarget.style.color = G; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}>
                {label}
                <span className="absolute bottom-0 left-0 w-0 h-px transition-all duration-300 group-hover:w-full" style={{ background: G }} />
              </a>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowLoginModal(true)}
              className="hidden sm:flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-light text-white/50 hover:text-white px-3 py-2 border transition-colors"
              style={{ borderColor: 'rgba(255,255,255,0.1)' }}
            >
              <Key size={11} style={{ color: G }} />
              <span>Área do Aluno</span>
            </button>

            <a
              href="#cursos"
              className="hidden sm:inline-flex text-[10px] uppercase tracking-[0.22em] font-medium px-5 py-2.5 border transition-all duration-300 shadow-sm"
              style={{ borderColor: `${G}60`, color: G, background: `${G}10` }}
              onMouseEnter={e => { e.currentTarget.style.background = G; e.currentTarget.style.color = '#000'; }}
              onMouseLeave={e => { e.currentTarget.style.background = `${G}10`; e.currentTarget.style.color = G; }}
            >
              Inscreva-se
            </a>

            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              aria-label="Menu principal"
              className="md:hidden w-10 h-10 border border-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors"
              style={{ background: BG3 }}
            >
              {mobileMenu ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenu && (
          <div className="md:hidden mx-4 mt-3 border p-5 space-y-3 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200" style={{ background: `${BG3}fd`, borderColor: `${G}25` }}>
            {[
              ['Metodologia', '#metodologia'],
              ['Mentor', '#professor'],
              ['Cursos', '#cursos'],
              ['Depoimentos', '#depoimentos'],
              ['FAQ', '#faq'],
              ['Atendimento Social', '#atuacao-social'],
              ['Validar Certificado', '/validar-certificado']
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                onClick={() => setMobileMenu(false)}
                className="block text-white/50 hover:text-white py-2.5 text-[11px] uppercase tracking-[0.22em] transition-all border-b border-white/5"
              >
                {label}
              </a>
            ))}
            <div className="pt-2 space-y-2">
              <button
                onClick={() => { setShowLoginModal(true); setMobileMenu(false); }}
                className="w-full flex items-center justify-center gap-2 text-center text-white/60 text-[11px] uppercase tracking-[0.2em] py-3 border border-white/10"
              >
                <Key size={12} style={{ color: G }} /> Área do Aluno
              </button>
              <a
                href="#cursos"
                onClick={() => setMobileMenu(false)}
                className="block w-full text-center border text-[11px] uppercase tracking-[0.22em] py-3 font-medium transition-all"
                style={{ borderColor: `${G}60`, color: G, background: `${G}15` }}
              >
                Garantir Minha Vaga
              </a>
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section id="top" className="relative min-h-[92vh] flex items-center justify-center overflow-hidden pt-24 pb-16">
        {/* Background Image Carousel with Fades */}
        {HERO_IMAGES.map((src, i) => (
          <div key={src} className={`absolute inset-0 transition-opacity duration-[2500ms] ease-in-out ${i === heroImg ? 'opacity-35' : 'opacity-0'}`}>
            <img src={src} alt="" className="w-full h-full object-cover scale-105" style={{ objectPosition: '50% 30%' }} />
          </div>
        ))}

        {/* Ambient Dark Gradients */}
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at center, ${BG}70 0%, ${BG}e8 70%, ${BG} 100%)` }} />
        <div className="absolute inset-x-0 bottom-0 h-44" style={{ background: `linear-gradient(to top, ${BG}, transparent)` }} />

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8">
          
          <SectionLabel>Formação em Saúde Comportamental</SectionLabel>

          <h1 className="font-thin leading-[1.02] mb-6 tracking-tight text-white" style={{ fontSize: 'clamp(2.6rem, 7.5vw, 5.8rem)' }}>
            Transforme vidas
            <span className="block font-light italic mt-1" style={{ color: G }}>através da cura terapêutica.</span>
          </h1>

          <p className="text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl mx-auto mb-8 font-light tracking-wide text-white/50">
            Formação profissionalizante com registro reconhecido nacional e internacionalmente. Domine a prática clínica desde a primeira semana e construa uma carreira com dignidade.
          </p>

          {/* Key Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-10">
            {[
              { icon: GraduationCap, label: 'Certificado AHDE & ABED' },
              { icon: Zap, label: 'Prática desde a Aula 1' },
              { icon: Award, label: 'Coordenação Prof. William' }
            ].map((b, idx) => (
              <div key={idx} className="flex items-center gap-2 border px-3.5 py-2 text-[10px] font-light uppercase tracking-[0.18em] text-white/50 backdrop-blur-sm"
                style={{ borderColor: `${G}20`, background: `${BG3}80` }}>
                <b.icon size={12} style={{ color: G }} />
                <span>{b.label}</span>
              </div>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#cursos"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.25em] px-8 py-4 border font-medium transition-all duration-300 shadow-xl"
              style={{ borderColor: `${G}80`, color: G, background: `${G}18` }}
              onMouseEnter={e => { e.currentTarget.style.background = G; e.currentTarget.style.color = '#000'; }}
              onMouseLeave={e => { e.currentTarget.style.background = `${G}18`; e.currentTarget.style.color = G; }}
            >
              Garantir Minha Vaga <ChevronRight size={14} />
            </a>
            
            <a
              href="#metodologia"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.25em] px-8 py-4 border border-white/15 text-white/50 hover:border-white/30 hover:text-white transition-all font-light"
            >
              <Play size={11} className="fill-current text-[#d4b96a]" /> Conhecer Metodologia
            </a>
          </div>

          {/* Slide Indicator Dots */}
          <div className="flex items-center justify-center gap-2 mt-14">
            {HERO_IMAGES.map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroImg(i)}
                aria-label={`Slide ${i + 1}`}
                className="h-1 transition-all duration-500 rounded-full"
                style={{
                  width: i === heroImg ? '2.5rem' : '0.75rem',
                  background: i === heroImg ? G : 'rgba(255,255,255,0.2)'
                }}
              />
            ))}
          </div>
        </div>

        {/* Bouncing Scroll Arrow */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/20 animate-bounce">
          <ArrowDown size={14} />
        </div>
      </section>

      {/* METRICS & STATS BAR */}
      <section className="border-y py-8 px-4 sm:px-6" style={{ background: BG2, borderColor: `${G}15` }}>
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 text-center">
          {[
            { value: '4.9★', label: 'Avaliação dos Alunos' },
            { value: '80h+', label: 'Carga Horária Total' },
            { value: '4 Meses', label: 'Duração Média' },
            { value: '100%', label: 'Prática desde a Aula 1' },
            { value: '3', label: 'Formações EAD' },
            { value: 'ABED', label: 'Associado Mantenedor' }
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center p-2">
              <span className="text-2xl sm:text-3xl font-thin tracking-wider" style={{ color: G }}>{s.value}</span>
              <span className="text-white/40 text-[9px] sm:text-[10px] mt-1.5 uppercase tracking-[0.2em] font-light leading-tight">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* METODOLOGIA SECTION */}
      <section id="metodologia" className="py-20 px-4 sm:px-6 lg:px-8" style={{ background: BG }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6">
              <SectionLabel>Excelência Acadêmica & Prática</SectionLabel>
              
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-thin text-white leading-tight tracking-tight">
                Nossa
                <span className="block font-light italic mt-1" style={{ color: G }}>Metodologia Integrativa.</span>
              </h2>

              <blockquote className="border-l-2 pl-5 py-2 my-4" style={{ borderColor: `${G}60`, background: `${BG3}50` }}>
                <p className="text-white/60 text-sm sm:text-base italic leading-relaxed font-light">
                  "Você pode ser ótimo(a) em muitas coisas na sua vida, mas a excelência vai se apresentar somente quando encontrar o que realmente nasceu para fazer."
                </p>
                <footer className="text-xs font-light mt-2 uppercase tracking-[0.2em]" style={{ color: `${G}aa` }}>
                  — Prof. William Ribeiro
                </footer>
              </blockquote>

              <p className="text-white/50 text-sm sm:text-base leading-relaxed font-light">
                Muitas pessoas sentem a vocação genuína de ajudar o próximo, mas o receio da inexperiência no primeiro atendimento pode frear o início dessa trajetória. Nossa formação rompe essa barreira ao proporcionar simulações clínicas e estudos supervisionados desde as primeiras semanas de curso.
              </p>

              <p className="text-white/40 text-sm leading-relaxed font-light">
                Integramos a objetividade da <strong className="text-white/80 font-normal">Terapia Comportamental</strong>, a profundidade do método <strong className="text-white/80 font-normal">Psicanalítico Freudiano</strong> e os preceitos da <strong className="text-white/80 font-normal">Sexologia Integrativa</strong> em uma plataforma digital acessível de qualquer dispositivo.
              </p>

              {/* Feature Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                {FEATURES.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3.5 border p-4 transition-all hover:border-[#d4b96a]/40" style={{ borderColor: `${G}18`, background: BG3 }}>
                    <div className="w-8 h-8 border flex items-center justify-center shrink-0 mt-0.5" style={{ borderColor: `${G}30` }}>
                      <Icon size={14} style={{ color: G }} />
                    </div>
                    <div>
                      <h4 className="font-medium text-white/80 text-xs uppercase tracking-[0.15em]">{title}</h4>
                      <p className="text-white/40 text-xs mt-1 font-light leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Visual Image Frame */}
            <div className="lg:col-span-5 relative">
              <div className="relative border overflow-hidden shadow-2xl" style={{ borderColor: `${G}25` }}>
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80"
                  alt="Metodologia EAD"
                  className="w-full aspect-[4/5] object-cover"
                />
                <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${BG}ee, transparent 60%)` }} />
                
                <div className="absolute bottom-5 left-5 right-5 border backdrop-blur-md p-4" style={{ borderColor: `${G}30`, background: `${BG3}dd` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 border flex items-center justify-center shrink-0" style={{ borderColor: `${G}50`, background: `${G}15` }}>
                      <Zap size={14} style={{ color: G }} />
                    </div>
                    <div>
                      <p className="text-white/90 font-light text-xs uppercase tracking-[0.2em]">Próxima Turma 2026</p>
                      <p className="text-xs font-light mt-0.5" style={{ color: `${G}bb` }}>Inscrições Abertas · Vagas Limitadas</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* PROFESSOR / MENTOR SECTION */}
      <section id="professor" className="py-20 px-4 sm:px-6 lg:px-8" style={{ background: BG2 }}>
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center mb-16">
            <SectionLabel>Corpo Docente</SectionLabel>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-thin text-white tracking-tight">Prof. William Ribeiro</h2>
            <p className="text-white/40 mt-3 text-xs sm:text-sm font-light uppercase tracking-[0.22em]">
              Psicoterapeuta · Psicanalista · Sexólogo · Educador Social
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-16">
            
            {/* Mentor Image Card */}
            <div className="lg:col-span-4">
              <div className="relative border shadow-2xl" style={{ borderColor: `${G}30` }}>
                <div className="w-full overflow-hidden aspect-[3/4]">
                  <img
                    src="https://media.base44.com/images/public/69f55577840a3c93cee191be/3488805d0_17673765754883.jpg"
                    alt="Prof. William Ribeiro"
                    className="w-full h-full object-cover"
                    style={{ objectPosition: '50% 25%' }}
                  />
                </div>
                <div className="p-4 text-center border-t" style={{ background: BG3, borderColor: `${G}20` }}>
                  <p className="font-light text-xs uppercase tracking-[0.25em]" style={{ color: G }}>Prof. William Ribeiro</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-[0.15em] mt-1">Gestor do {BRAND_LEGAL_NAME}</p>
                </div>
              </div>
            </div>

            {/* Biography & Trajectory */}
            <div className="lg:col-span-8 space-y-4">
              {[
                'A base do pensamento de William Ribeiro foi construída em um mergulho profundo nos processos organizacionais e corporativos entre 2007 e 2017. Essa década representou uma ascensão estratégica: iniciando como auxiliar financeiro e departamento pessoal até assumir a gestão estratégica de pessoas.',
                'Ao ingressar no curso de Administração da Universidade Federal do Paraná (UFPR), William desenvolveu uma de suas teses centrais: a Teoria da Utilidade Comportamental, transpondo modelos de decisão comportamental para a clínica terapêutica.',
                'Dessa consolidação acadêmica, fundou a abordagem integrativa em Psicoterapia, Psicanálise e Sexologia Integrativa, com títulos e certificações registrados nacional e internacionalmente.',
                `Hoje coordena a matriz acadêmica da ${BRAND_LEGAL_NAME}, associada à ABED (Associação Brasileira de Educação a Distância), assegurando padrões éticos e práticos de excelência para os futuros terapeutas.`
              ].map((paragraph, idx) => (
                <p key={idx} className="text-white/50 text-sm sm:text-base leading-relaxed font-light">
                  {paragraph}
                </p>
              ))}
            </div>

          </div>

          {/* Credentials & Verifiable Registration Grid */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle size={14} style={{ color: G }} />
              <span className="text-xs font-light text-white/50 uppercase tracking-[0.25em]">Credenciais e Certificações Verificáveis</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CERTS.map((c, i) => (
                <div key={i} className="border p-5 transition-all hover:border-[#d4b96a]/40" style={{ borderColor: `${G}18`, background: BG3 }}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h4 className="text-white/90 font-light text-sm uppercase tracking-[0.15em]">{c.title}</h4>
                      <p className="text-white/40 text-xs mt-0.5 font-light">{c.institution}</p>
                    </div>
                    <div className="w-6 h-6 border flex items-center justify-center shrink-0" style={{ borderColor: `${G}30` }}>
                      <CheckCircle size={12} style={{ color: G }} />
                    </div>
                  </div>
                  <p className="text-white/30 text-[10px] font-mono py-1 mb-2 truncate">Cód: {c.code}</p>
                  {c.extra && <p className="text-white/40 text-xs mb-3 font-light">{c.extra}</p>}
                  {c.verifyLink && (
                    <a
                      href={c.verifyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-light hover:underline transition-all"
                      style={{ color: G }}
                    >
                      <ExternalLink size={11} /> {c.verifyLabel}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Active Professional Roles */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Sparkles size={14} style={{ color: G }} />
              <span className="text-xs font-light text-white/50 uppercase tracking-[0.25em]">Atuação & Projetos Ativos</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {CURRENT.map((item, i) => (
                <div key={i} className="border p-5 flex flex-col justify-between transition-all hover:border-[#d4b96a]/40" style={{ borderColor: `${G}18`, background: BG3 }}>
                  <div>
                    <h4 className="text-white/80 font-light text-xs uppercase tracking-[0.15em] mb-2">{item.title}</h4>
                    <p className="text-white/40 text-xs leading-relaxed font-light mb-4">{item.desc}</p>
                  </div>
                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-light hover:underline transition-all mt-auto"
                      style={{ color: G }}
                    >
                      <ArrowUpRight size={12} /> {item.linkLabel}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* SOCIAL IMPACT & INSTAGRAM SECTION */}
      <section id="atuacao-social" className="py-20 px-4 sm:px-6 lg:px-8" style={{ background: BG }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-6">
              <SectionLabel>Atuação Aberta à Comunidade</SectionLabel>
              
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-thin text-white leading-tight">
                Terapia também é
                <span className="block font-light italic mt-1" style={{ color: G }}>presença e acolhimento social.</span>
              </h2>

              <p className="text-white/50 text-sm sm:text-base leading-relaxed font-light">
                Nossa atuação vai além das salas virtuais de aula: produzimos conteúdo educativo aberto e oferecemos o <strong className="text-white/80 font-normal">Atendimento Terapêutico Social (R$ 35,00 por consulta)</strong> para garantir suporte emocional acessível.
              </p>

              <div className="pt-2 flex flex-wrap gap-4">
                <button
                  onClick={openSocialAppointment}
                  className="inline-flex items-center justify-center gap-2 text-xs uppercase tracking-[0.2em] border px-6 py-3.5 font-medium transition-all duration-300"
                  style={{ borderColor: `${G}60`, color: G, background: `${G}12` }}
                  onMouseEnter={e => { e.currentTarget.style.background = G; e.currentTarget.style.color = '#000'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = `${G}12`; e.currentTarget.style.color = G; }}
                >
                  <Heart size={14} /> Agendar Atendimento Social (R$ 35)
                </button>

                <a
                  href={INSTAGRAM_PROFILE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 border border-white/15 text-white/50 text-xs uppercase tracking-[0.2em] px-6 py-3.5 hover:border-white/30 hover:text-white transition-all font-light"
                >
                  <Instagram size={14} /> Instagram @wrterapia
                </a>
              </div>
            </div>

            {/* Instagram Reel Container */}
            <div className="lg:col-span-5">
              <div className="border overflow-hidden shadow-2xl" style={{ borderColor: `${G}25`, background: BG3 }}>
                <div className="flex items-center justify-between gap-3 px-4 py-3 border-b" style={{ borderColor: `${G}15`, background: BG2 }}>
                  <div className="flex items-center gap-2">
                    <Instagram size={15} style={{ color: G }} />
                    <span className="text-xs font-light uppercase tracking-[0.18em] text-white/70">@wrterapia</span>
                  </div>
                  <a href={INSTAGRAM_PROFILE_URL} target="_blank" rel="noopener noreferrer" className="text-[10px] font-light uppercase tracking-[0.15em] hover:underline" style={{ color: G }}>
                    Seguir
                  </a>
                </div>

                <div className="relative w-full bg-black aspect-[9/16] max-h-[480px]">
                  <iframe
                    title="WR Terapia — Instagram"
                    src={SOCIAL_REEL_EMBED_URL}
                    className="absolute inset-0 w-full h-full bg-black"
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* COURSES / FORMAÇÕES SECTION */}
      <section id="cursos" className="py-20 px-4 sm:px-6 lg:px-8" style={{ background: BG2 }}>
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center mb-12">
            <SectionLabel>Nossos Cursos Profissionalizantes</SectionLabel>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-thin text-white tracking-tight">
              Oferta de Matrícula <span className="font-light italic" style={{ color: G }}>Antecipada</span>
            </h2>
            <p className="text-white/40 mt-3 max-w-2xl mx-auto text-xs sm:text-sm font-light">
              Condição especial para a próxima turma: 50% de desconto na primeira mensalidade e 40% mantido até o encerramento do curso.
            </p>

            <SocialInitiativeNotice className="mx-auto mt-6 max-w-3xl text-left" />

            {/* Offer Timer Banner */}
            <div className="mt-8 mx-auto max-w-2xl border p-5 sm:p-6 shadow-xl" style={{ borderColor: `${G}30`, background: BG3 }}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] font-light mb-1" style={{ color: G }}>Janela Promocional de 48 Horas</p>
                  <p className="text-white/80 font-light text-sm sm:text-base">50% na 1ª mensalidade + 40% vitalício</p>
                </div>
                
                <div className="shrink-0 grid grid-cols-3 gap-2">
                  {[
                    ['Horas', offerHours],
                    ['Min', offerMinutes],
                    ['Seg', offerSeconds]
                  ].map(([label, value]) => (
                    <div key={label} className="min-w-[64px] border px-2.5 py-2 text-center" style={{ borderColor: `${G}25`, background: BG }}>
                      <span className="text-lg font-light font-mono block" style={{ color: G }}>{value}</span>
                      <span className="text-[8px] text-white/30 uppercase tracking-[0.2em]">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Institution Credentials Bar */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
              <a
                href="https://www.abed.org.br/site/associados/consulta-associados-ativos/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 border px-6 py-3 transition-all hover:border-[#d4b96a]/40"
                style={{ borderColor: `${G}18`, background: BG3 }}
              >
                <img src="https://media.base44.com/images/public/69f55577840a3c93cee191be/fb3aaf448_LogotipoSOMOSASSOCIADOSABED-Branco.png" alt="ABED" className="h-9 object-contain opacity-70" />
                <span className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-light">Membro Mantenedor ABED</span>
              </a>
            </div>
          </div>

          {/* Courses Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {COURSES.map((c, i) => (
              <div key={i} className="border flex flex-col transition-all duration-300 hover:border-[#d4b96a]/50 shadow-xl overflow-hidden" style={{ borderColor: i === 0 ? `${G}40` : `${G}18`, background: BG3 }}>
                
                {/* Course Image Carousel Header */}
                <div className="relative h-48 overflow-hidden">
                  {c.imgs.map((img, j) => (
                    <img
                      key={j}
                      src={img}
                      alt={c.title}
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${j === courseImgs[i] ? 'opacity-100' : 'opacity-0'}`}
                    />
                  ))}
                  <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${BG3}, transparent 70%)` }} />
                  
                  <div className="absolute top-3 left-3 border px-2.5 py-1 text-[9px] font-light uppercase tracking-[0.2em]" style={{ borderColor: `${G}50`, color: G, background: `${BG}ee` }}>
                    {c.tag}
                  </div>

                  <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5 items-center">
                    {c.imgs.map((_, j) => (
                      <button
                        key={j}
                        onClick={() => setCourseImgs((prev) => prev.map((v, idx) => idx === i ? j : v))}
                        aria-label={`Imagem ${j + 1}`}
                        className="h-1 transition-all rounded-full"
                        style={{ width: j === courseImgs[i] ? '1.25rem' : '0.5rem', background: j === courseImgs[i] ? G : 'rgba(255,255,255,0.3)' }}
                      />
                    ))}
                  </div>
                </div>

                {/* Course Content Details */}
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="font-light text-white text-base uppercase tracking-[0.18em] mb-1">{c.title}</h3>
                  <p className="text-white/40 text-xs leading-relaxed mb-4 font-light">{c.subtitle}</p>
                  
                  <div className="space-y-2 mb-6 flex-1">
                    {c.highlights.map((h, j) => (
                      <div key={j} className="flex items-start gap-2.5 text-xs text-white/50 font-light">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: G }} />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t space-y-4" style={{ borderColor: `${G}15` }}>
                    <div>
                      <p className="text-[10px] text-white/30 uppercase tracking-[0.15em] font-light">Preço Regular: <span className="line-through">{c.originalPrice}</span></p>
                      <p className="text-[11px] font-light mt-1" style={{ color: G }}>1ª Mensalidade (50% OFF): <strong className="text-xl text-white font-thin block">{c.firstMonthPrice}</strong></p>
                      <p className="text-[10px] text-white/40 mt-1 font-light">Demais mensalidades: <span className="text-white/80 font-normal">{c.price}</span> {c.period}</p>
                    </div>

                    <a
                      href={`/ementa-cursos#${c.slug}`}
                      className="w-full py-2.5 border text-[10px] text-white/50 font-light uppercase tracking-[0.15em] flex items-center justify-center gap-2 hover:text-white transition-all"
                      style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                    >
                      <BookOpen size={12} /> Ver Ementa Completa
                    </a>

                    <button
                      onClick={() => openCourseReservation(c)}
                      className="w-full py-3.5 border text-[11px] font-medium uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all duration-300"
                      style={{ borderColor: `${G}60`, color: G, background: `${G}10` }}
                      onMouseEnter={e => { e.currentTarget.style.background = G; e.currentTarget.style.color = '#000'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = `${G}10`; e.currentTarget.style.color = G; }}
                    >
                      <MessageCircle size={13} /> Quero Me Inscrever
                    </button>
                  </div>

                </div>

              </div>
            ))}
          </div>

        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section id="depoimentos" className="py-20 px-4 sm:px-6 lg:px-8" style={{ background: BG }}>
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center mb-12">
            <SectionLabel>Relatos de Alunos</SectionLabel>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-thin text-white tracking-tight">Depoimentos Verificados</h2>
            <p className="text-white/40 text-xs sm:text-sm mt-2 font-light uppercase tracking-[0.2em]">Experiências reais da nossa comunidade acadêmica</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t, i) => {
              const colors = ['#8b5cf6', '#059669', '#2563eb', '#dc2626', '#d97706', '#0891b2'];
              const color = colors[i % colors.length];
              return (
                <div key={i} className="border p-6 flex flex-col justify-between transition-all hover:border-[#d4b96a]/40 shadow-lg" style={{ borderColor: `${G}18`, background: BG3 }}>
                  <div>
                    <div className="flex gap-1 mb-3">
                      {Array.from({ length: t.stars }).map((_, j) => (
                        <Star key={j} size={12} style={{ color: G, fill: G }} />
                      ))}
                    </div>
                    <Quote size={18} className="mb-2 text-white/20" />
                    <p className="text-white/60 text-xs sm:text-sm leading-relaxed italic font-light mb-6">
                      "{t.text}"
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: `${G}10` }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium text-white shrink-0 shadow" style={{ background: color }}>
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="text-white/80 text-xs font-medium uppercase tracking-[0.12em]">{t.name}</p>
                      <p className="text-white/30 text-[10px] font-light">Aluno(a) verificado(a)</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8" style={{ background: BG2 }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel>Dúvidas Frequentes</SectionLabel>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-thin text-white tracking-tight">Perguntas Respostas</h2>
          </div>
          <FaqSection />
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden text-center" style={{ background: BG }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at center, ${G}12, transparent 70%)` }} />
        
        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <SectionLabel>Início em 2026</SectionLabel>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-thin text-white tracking-tight">
            Pronto para iniciar <span className="font-light italic block mt-1" style={{ color: G }}>sua formação clínica?</span>
          </h2>

          <p className="text-white/40 text-sm font-light leading-relaxed">
            As vagas com condição especial da primeira mensalidade com 50% OFF são limitadas. Inscreva-se agora mesmo.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <a
              href="#cursos"
              className="inline-flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.25em] border px-8 py-4 font-medium transition-all duration-300"
              style={{ borderColor: `${G}80`, color: G, background: `${G}18` }}
              onMouseEnter={e => { e.currentTarget.style.background = G; e.currentTarget.style.color = '#000'; }}
              onMouseLeave={e => { e.currentTarget.style.background = `${G}18`; e.currentTarget.style.color = G; }}
            >
              Garantir Minha Vaga <ChevronRight size={14} />
            </a>

            <button
              onClick={() => setShowLoginModal(true)}
              className="inline-flex items-center justify-center gap-2 border border-white/15 text-white/50 text-[11px] uppercase tracking-[0.25em] px-8 py-4 hover:border-white/30 hover:text-white transition-all font-light"
            >
              Já Sou Aluno
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t py-12 px-4 sm:px-6 lg:px-8 text-xs font-light" style={{ background: BG2, borderColor: `${G}15` }}>
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border flex items-center justify-center" style={{ borderColor: `${G}30` }}>
                <img src={WR_PRIMARY_LOGO} alt="WR" className="w-5 h-5 object-contain" />
              </div>
              <div>
                <p className="text-white/80 font-light text-sm uppercase tracking-[0.2em]">{BRAND_LEGAL_NAME}</p>
                <p className="text-white/30 text-[10px] mt-0.5">CNPJ {BRAND_CNPJ}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 text-white/40 uppercase tracking-[0.18em] text-[10px]">
              <a href="/politica" className="hover:text-white transition-colors">Política de Trabalho</a>
              <a href="/termos" className="hover:text-white transition-colors">Termos de Uso</a>
              <a href="/privacidade" className="hover:text-white transition-colors">Privacidade</a>
            </div>
          </div>

          <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-white/30 text-[10px]" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <p>{BRAND_LEGAL_NAME} © 2026 · CNPJ {BRAND_CNPJ}</p>
            <p>Desenvolvido por <span style={{ color: G }}>WR-TEC®</span></p>
          </div>

        </div>
      </footer>

      {/* FLOATING WHATSAPP BUTTON */}
      <a
        href="https://wa.me/5541992531598?text=Olá! Vim pelo site e gostaria de saber mais sobre as formações."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-[180] flex items-center gap-2.5 px-4 py-3 shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 border"
        style={{ background: '#25D366', borderColor: '#20ba5a', borderRadius: '2rem' }}
        title="Falar pelo WhatsApp"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span className="text-white text-xs font-medium uppercase tracking-wider hidden sm:block">WhatsApp</span>
      </a>

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowLoginModal(false)}>
          <div className="border p-6 sm:p-8 w-full max-w-sm shadow-2xl space-y-6" style={{ background: BG3, borderColor: `${G}30` }} onClick={(e) => e.stopPropagation()}>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white/90 font-light text-sm uppercase tracking-[0.25em]">Área do Aluno</h3>
                <p className="text-white/30 text-[10px] mt-0.5 font-light uppercase tracking-[0.15em]">Acesso seguro à plataforma</p>
              </div>
              <button onClick={() => { setShowLoginModal(false); setError(''); }} className="text-white/30 hover:text-white transition-colors"><X size={18} /></button>
            </div>

            <div className="flex gap-2 border p-1" style={{ borderColor: `${G}20` }}>
              {['code', 'admin'].map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); }}
                  className="flex-1 py-2 text-[10px] font-light transition-all flex items-center justify-center gap-1.5 uppercase tracking-[0.18em]"
                  style={mode === m ? { background: G, color: '#000' } : { color: 'rgba(255,255,255,0.4)' }}
                >
                  {m === 'code' ? <><Key size={11} /> Código</> : <><Shield size={11} /> Admin</>}
                </button>
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-2 border text-red-300 text-xs p-3 font-light" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)' }}>
                <AlertCircle size={14} className="shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {mode === 'code' ? (
              <form onSubmit={handleCodeLogin} className="space-y-4">
                <input
                  placeholder="EDU-XXXX-XXXX"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full border text-white placeholder:text-white/20 h-12 text-center text-base tracking-[0.3em] font-mono focus:outline-none"
                  style={{ background: BG, borderColor: `${G}25` }}
                  autoCapitalize="characters"
                />
                
                <button
                  type="submit"
                  disabled={code.length < 3 || loading}
                  className="w-full h-12 border text-xs uppercase tracking-[0.22em] font-medium flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
                  style={{ borderColor: `${G}60`, color: G, background: `${G}10` }}
                  onMouseEnter={e => { if (!loading && code.length >= 3) { e.currentTarget.style.background = G; e.currentTarget.style.color = '#000'; } }}
                  onMouseLeave={e => { e.currentTarget.style.background = `${G}10`; e.currentTarget.style.color = G; }}
                >
                  {loading ? 'Verificando...' : <>Entrar na Plataforma <ChevronRight size={13} /></>}
                </button>

                <label className="flex items-center justify-center gap-2 text-[11px] text-white/40 font-light cursor-pointer">
                  <input type="checkbox" checked={rememberCode} onChange={(e) => setRememberCode(e.target.checked)} className="accent-[#d4b96a]" />
                  Lembrar acesso neste dispositivo
                </label>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <div className="w-10 h-10 mx-auto border flex items-center justify-center" style={{ borderColor: `${G}30` }}>
                    <Shield size={18} style={{ color: G }} />
                  </div>
                  <p className="text-white/40 text-xs font-light">Acesso restrito para administradores.</p>
                </div>

                <form onSubmit={handleAdminKeyLogin} className="space-y-3">
                  <input
                    placeholder="ADM-XXXX-XXXX"
                    value={adminKeyInput}
                    onChange={(e) => setAdminKeyInput(e.target.value.toUpperCase())}
                    className="w-full border text-white placeholder:text-white/20 h-11 text-center text-xs tracking-[0.2em] font-mono focus:outline-none"
                    style={{ background: BG, borderColor: `${G}25` }}
                    autoCapitalize="characters"
                  />
                  <button
                    type="submit"
                    disabled={!adminKeyInput.trim() || loading}
                    className="w-full h-11 border text-xs uppercase tracking-[0.2em] font-medium flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
                    style={{ borderColor: `${G}60`, color: G }}
                  >
                    {loading ? 'Verificando...' : 'Entrar como Admin'}
                  </button>
                </form>

                <div className="relative my-2 text-center">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">ou</span>
                </div>

                <button
                  onClick={handleGoogleLogin}
                  className="w-full h-11 border text-xs uppercase tracking-[0.2em] font-medium flex items-center justify-center gap-2 text-white/70 hover:text-white transition-all"
                  style={{ borderColor: 'rgba(255,255,255,0.15)' }}
                >
                  Entrar com Google
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* MODAL RESERVA ANTECIPADA */}
      {reserveOpen && (
        <div className="fixed inset-0 z-[190] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setReserveOpen(false)}>
          <div className="border w-full max-w-lg max-h-[88dvh] shadow-2xl overflow-hidden flex flex-col" style={{ background: BG3, borderColor: `${G}30` }} onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b flex items-start justify-between gap-4" style={{ borderColor: `${G}15` }}>
              <div>
                <h3 className="text-white/90 font-light text-sm uppercase tracking-[0.2em] flex items-center gap-2">
                  <MessageCircle size={15} style={{ color: G }} /> Reserva Antecipada
                </h3>
                <p className="text-white/40 text-xs mt-0.5 font-light">{selectedCourse?.title}</p>
              </div>
              <button onClick={() => setReserveOpen(false)} className="text-white/30 hover:text-white transition-colors"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: BG }}>
              {leadMessages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className="max-w-[85%] border px-4 py-3 text-xs leading-relaxed font-light"
                    style={message.role === 'user' ? { background: G, borderColor: G, color: '#000' } : { background: BG3, borderColor: `${G}20`, color: 'rgba(255,255,255,0.8)' }}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {leadLoading && <div className="text-xs text-white/30 font-light italic">A IA está respondendo...</div>}
            </div>

            <div className="p-4 border-t space-y-3" style={{ borderColor: `${G}15`, background: BG3 }}>
              <div className="flex gap-2">
                <input
                  value={leadInput}
                  onChange={(e) => setLeadInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') sendReserveChatMessage(); }}
                  placeholder={leadMessages.filter(m => m.role === 'user').length >= MAX_RESERVATION_AI_QUESTIONS ? 'Enviar dados pelo WhatsApp abaixo.' : 'Digite sua resposta...'}
                  className="flex-1 border h-11 px-3 text-xs focus:outline-none font-light text-white placeholder:text-white/20"
                  style={{ background: BG, borderColor: `${G}25` }}
                />
                <button
                  onClick={sendReserveChatMessage}
                  disabled={!leadInput.trim() || leadLoading || leadMessages.filter(m => m.role === 'user').length >= MAX_RESERVATION_AI_QUESTIONS}
                  className="h-11 w-11 border flex items-center justify-center disabled:opacity-30 transition-all"
                  style={{ borderColor: `${G}50`, color: G }}
                >
                  <Send size={14} />
                </button>
              </div>

              <button
                onClick={sendReserveToWhatsApp}
                className="w-full py-3 border text-xs uppercase tracking-[0.2em] font-medium transition-all"
                style={{ borderColor: `${G}60`, color: G, background: `${G}12` }}
              >
                Enviar reserva para o WhatsApp oficial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ATENDIMENTO SOCIAL */}
      {socialOpen && (
        <div className="fixed inset-0 z-[190] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setSocialOpen(false)}>
          <div className="border w-full max-w-xl max-h-[90dvh] shadow-2xl overflow-hidden flex flex-col" style={{ background: BG3, borderColor: `${G}30` }} onClick={(e) => e.stopPropagation()}>
            
            <div className="p-4 border-b flex items-start justify-between gap-4" style={{ borderColor: `${G}15` }}>
              <div>
                <h3 className="text-white/90 font-light text-sm uppercase tracking-[0.2em] flex items-center gap-2">
                  <Heart size={15} style={{ color: G }} /> Triagem Atendimento Social
                </h3>
                <p className="text-white/40 text-xs mt-0.5 font-light">Sessão social R$ 35,00 · Retorno em até 48h</p>
              </div>
              <button onClick={() => setSocialOpen(false)} className="text-white/30 hover:text-white transition-colors"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: BG }}>
              {socialMessages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className="max-w-[85%] border px-4 py-3 text-xs leading-relaxed font-light"
                    style={message.role === 'user' ? { background: G, borderColor: G, color: '#000' } : { background: BG3, borderColor: `${G}20`, color: 'rgba(255,255,255,0.8)' }}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {socialLoading && <div className="text-xs text-white/30 font-light italic">A IA está digitando...</div>}

              {socialMessages.filter(m => m.role === 'user').length >= 5 && (
                <div className="border p-4 space-y-4" style={{ background: BG3, borderColor: `${G}20` }}>
                  <p className="text-xs font-light uppercase tracking-[0.2em]" style={{ color: G }}>Escolha uma Data</p>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 max-h-36 overflow-y-auto pr-1">
                    {getCurrentMonthDates().map((date) => (
                      <button
                        key={date.iso}
                        onClick={() => setSelectedSocialDate(date.iso)}
                        className="border px-2 py-2 text-center transition-all"
                        style={selectedSocialDate === date.iso ? { borderColor: G, background: G, color: '#000' } : { borderColor: `${G}20`, color: 'rgba(255,255,255,0.5)' }}
                      >
                        <span className="block text-[8px] uppercase">{date.week}</span>
                        <span className="text-xs font-light">{date.day}</span>
                      </button>
                    ))}
                  </div>

                  <p className="text-xs font-light uppercase tracking-[0.2em]" style={{ color: G }}>Escolha um Horário</p>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {SOCIAL_TIME_SLOTS.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedSocialTime(time)}
                        className="border px-2.5 py-2 text-xs font-light transition-all"
                        style={selectedSocialTime === time ? { borderColor: G, background: G, color: '#000' } : { borderColor: `${G}20`, color: 'rgba(255,255,255,0.5)' }}
                      >
                        {time}
                      </button>
                    ))}
                  </div>

                  {socialBooked ? (
                    <div className="border p-3 text-xs text-emerald-400/90 font-light" style={{ borderColor: 'rgba(52,211,153,0.3)', background: 'rgba(52,211,153,0.05)' }}>
                      ✓ Agendamento prévio registrado. Entraremos em contato via WhatsApp em até 48 horas.
                    </div>
                  ) : (
                    <button
                      onClick={bookSocialAppointment}
                      disabled={!selectedSocialDate || !selectedSocialTime}
                      className="w-full py-3 text-xs uppercase tracking-[0.2em] font-medium border transition-all disabled:opacity-30"
                      style={{ borderColor: `${G}60`, color: G }}
                    >
                      Confirmar Solicitação de Agendamento
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t" style={{ borderColor: `${G}15`, background: BG3 }}>
              <div className="flex gap-2">
                <input
                  value={socialInput}
                  onChange={(e) => setSocialInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') sendSocialChatMessage(); }}
                  placeholder={socialMessages.filter(m => m.role === 'user').length >= 5 ? 'Respostas concluídas. Escolha data/horário acima.' : 'Digite sua resposta...'}
                  className="flex-1 border h-11 px-3 text-xs focus:outline-none font-light text-white placeholder:text-white/20"
                  style={{ background: BG, borderColor: `${G}25` }}
                />
                <button
                  onClick={sendSocialChatMessage}
                  disabled={!socialInput.trim() || socialLoading || socialMessages.filter(m => m.role === 'user').length >= 5}
                  className="h-11 w-11 border flex items-center justify-center disabled:opacity-30 transition-all"
                  style={{ borderColor: `${G}50`, color: G }}
                >
                  <Send size={14} />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
