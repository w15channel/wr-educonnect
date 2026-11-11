import { invokePollinations } from '@/lib/pollinationsAI';
import React, { useState, useEffect } from 'react';
import {
  Key, Sparkles, Users, BookOpen, Heart,
  Star, ChevronRight, Shield, CheckCircle, ExternalLink,
  ArrowDown, Quote, Menu, X, Play, Zap, AlertCircle, MessageCircle, Send,
  Instagram } from
'lucide-react';
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
'https://images.unsplash.com/photo-1609234656388-0ff363383899?w=1400&q=85'];

const FEATURES = [
{ icon: BookOpen, title: 'Videoaulas Gravadas', desc: 'Conteúdo terapêutico exclusivo' },
{ icon: BookOpen, title: 'Apostila Digital', desc: 'Estudo guiado com apoio por módulos' },
{ icon: Users, title: 'Comunidade Ativa', desc: 'Fórum de dúvidas entre alunos' },
{ icon: Heart, title: 'Prática Real', desc: 'Experiência terapêutica ao longo do curso' }];

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
  extra: null,
  verifyLink: null,
  verifyLabel: null
},
{
  title: 'Sexólogo Integrativo',
  institution: 'Unifast — School of Business Acceleration',
  code: '000300950029868',
  extra: 'Especializações em sexualidade, infidelidade conjugal, vícios e outras áreas',
  verifyLink: null,
  verifyLabel: null
}];

const CURRENT = [
{
  title: 'Dirigente — Sinapse Coletiva',
  desc: 'Grupo formado por profissionais da saúde comportamental com o objetivo de construir um espaço consciente e equilibrado de técnicas e comunidade acadêmica.',
  link: null
},
{
  title: `Gestor — ${BRAND_LEGAL_NAME}`,
  desc: `Gerencia o Curso Profissionalizante para Formação de Terapeutas pela ${BRAND_LEGAL_NAME}. Representado oficialmente junto à ABED.`,
  link: 'https://www.abed.org.br/site/associados/consulta-associados-ativos/',
  linkLabel: 'Consultar na ABED'
},
{
  title: 'Educador Social — Projeto Vida Digital (ADRA)',
  desc: 'Profissional de Educação Social para Crianças e Adolescentes em programa da instituição internacional ADRA. O projeto reestrutura grupos em vulnerabilidade social.',
  link: 'https://adra.org.br/projetos/vida-digital/',
  linkLabel: 'Conhecer o Projeto'
}];

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
  tagColor: '#c9a227',
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
    'Ingresso em Setembro/2026',
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
  tagColor: '#c9a227',
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
    'Ingresso em Setembro/2026',
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
  tagColor: '#c9a227',
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
    'Ingresso em Setembro/2026',
  ]
}];

const TESTIMONIALS = [
{ name: 'Diane Martins', text: 'Ao nosso mentor William, parabenizo pela dedicação, entrega e intencionalidade em dar o primeiro passo na formação de novos terapeutas. Do aparente "menor ofício" ao mais significativo, você ousou, acreditou, executou, e o resultado está à disposição de todos que desejam crescer.', stars: 5 },
{ name: 'Stella Torres', text: 'Estou maravilhada com o andamento do curso. Confesso que iniciei um pouco desanimada e confusa, mas, mesmo em pouco tempo, nosso professor me impulsionou a acreditar que chegarei ao meu objetivo. A plataforma ficou excelente, bonita e atrativa.', stars: 5 },
{ name: 'Marilene Batista', text: 'Estou aqui navegando pela plataforma e, olha, eu já fiz vários cursos mas nos detalhes se percebe o capricho, o zelo e a entrega do nosso professor! Agradeço demais sua dedicação. Seu espírito visionário nos move a querer ir além.', stars: 5 },
{ name: 'Ana Paula M.', text: 'A formação mais completa que já fiz. O diferencial da prática desde o início foi transformador para mim.', stars: 5 },
{ name: 'Carlos Eduardo S.', text: 'O Professor William tem uma didática incrível. Aprendi mais aqui do que em anos de graduação.', stars: 5 },
{ name: 'Fernanda R.', text: 'Plataforma excelente, suporte impecável e conteúdo de altíssimo nível. Super recomendo!', stars: 5 }];

// ── Paleta Original — Preto Profundo & Ouro Pálido ───────────────────────────
const G = '#d4b96a';   // ouro pálido
const BG = '#0a0a0c';  // preto profundo
const BG2 = '#0f0f12'; // secções alternadas — quase preto
const BG3 = '#141418'; // cards escuros

export default function LandingPage({ onLogin }) {
  const [heroImg, setHeroImg] = useState(0);
  const [courseImgs, setCourseImgs] = useState([0, 0, 0]);

  useEffect(() => {
    const intervals = COURSES.map((_, i) =>
      setInterval(() => {
        setCourseImgs(prev => prev.map((v, idx) => idx === i ? (v + 1) % COURSES[i].imgs.length : v));
      }, 4000 + i * 1500)
    );
    return () => intervals.forEach(clearInterval);
  }, []);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [mode, setMode] = useState('code');
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const [code, setCode] = useState('');
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
    const onScroll = () => setNavScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const savedCode = localStorage.getItem('wr_saved_student_code') || '';
    if (savedCode) setCode(savedCode);
  }, []);

  useEffect(() => {
    const loadTestimonials = async () => {
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
      setSession(response.data.session, { remember: rememberCode }); onLogin('lobby');
    } catch (err) {
      const message = err?.response?.data?.error;
      setError(message === 'not-found' || err?.response?.status === 404
        ? 'O serviço de entrada está indisponível no momento. Isso não significa que seu código seja inválido. Tente novamente em alguns minutos.'
        : message || 'Não foi possível entrar. Verifique sua conexão e tente novamente.');
    }
    setLoading(false);
  };

  // Login admin via Google OAuth — redireciona para o fluxo nativo do Base44.
  // Após autenticação Google, o CustomAuthContext detecta o retorno e valida
  // o email autorizado via siteLogin (mode: 'admin_google').
  const handleGoogleLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
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

  // ── Shared sub-components ──────────────────────────────────────────────────
  const GoldDivider = () => <div className="h-px bg-[#c9a227]/12 my-0" />;
  const SectionLabel = ({ children, center = false }) => (
    <div className={`mb-7 flex items-center gap-3 ${center ? 'justify-center' : ''}`}>
      <span className="h-px w-8" style={{ background: `linear-gradient(to right, transparent, ${G}70)` }} />
      <span className="text-[9.5px] uppercase tracking-[0.34em] font-light" style={{ color: `${G}95` }}>{children}</span>
      <span className="h-px w-8" style={{ background: `linear-gradient(to left, transparent, ${G}70)` }} />
    </div>
  );

  return (
    <div className="site-page scrollbar-invisible text-white" style={{ background: BG }}>

      {/* NAVBAR */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navScrolled ? 'backdrop-blur-xl' : ''}`}
        style={{
          paddingTop: `calc(${navScrolled ? '0.6rem' : '1.1rem'} + env(safe-area-inset-top, 0px))`,
          paddingBottom: navScrolled ? '0.6rem' : '1.1rem',
          ...(navScrolled ? { background: 'rgba(10,10,12,0.82)', borderBottom: `1px solid ${G}22`, boxShadow: '0 18px 50px -36px rgba(0,0,0,0.9)' } : {}),
        }}>
        <div className="site-container flex items-center justify-between gap-4">
          <a href="#top" className="flex items-center gap-3 min-w-0 group">
            <div className="relative flex h-10 w-10 items-center justify-center border transition-colors duration-300 group-hover:border-[#d4b96a]/60" style={{ borderColor: `${G}33`, background: `linear-gradient(160deg, ${G}14, transparent)` }}>
              <img src={WR_PRIMARY_LOGO} alt="WR" className="w-7 h-7 object-contain" />
            </div>
            <div className="min-w-0">
              <span className="block text-[13px] font-light tracking-[0.34em] uppercase text-white">{BRAND_SHORT_NAME}</span>
              <span className="hidden sm:block text-[8.5px] uppercase tracking-[0.26em] font-light mt-0.5" style={{ color: `${G}70` }}>Instituto de Desenvolvimento Humano</span>
            </div>
          </a>

          <div className="hidden md:flex items-center gap-8 text-[10.5px] text-white/40 uppercase tracking-[0.2em] font-light">
            {[['Metodologia', '#metodologia'], ['Cursos', '#cursos'], ['Depoimentos', '#depoimentos'], ['FAQ', '#faq'], ['Atendimento Social', '/atendimento-social']].map(([label, href]) =>
              <a key={label} href={href} className="site-link hover:text-[#e9d9a6]">{label}</a>
            )}
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <button onClick={() => setShowLoginModal(true)} className="hidden md:inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-light text-white/40 hover:text-white/75 transition-colors">
              <Key size={11} style={{ color: `${G}90` }} /> Área do Aluno
            </button>
            <span className="hidden md:block w-px h-4" style={{ background: `${G}25` }} />
            <a href="#cursos" className="site-btn hidden md:inline-flex !min-h-0 !px-5 !py-2.5 !text-[10px]">
              Inscreva-se
            </a>
            <button onClick={() => setMobileMenu(!mobileMenu)} aria-label="Abrir menu" className="md:hidden flex h-10 w-10 items-center justify-center border text-white/60 hover:text-white transition-colors" style={{ borderColor: `${G}25`, background: 'rgba(255,255,255,0.03)' }}>
              {mobileMenu ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {mobileMenu && (
          <div className="site-container md:hidden">
            <div className="mt-3 overflow-hidden border backdrop-blur-xl" style={{ background: 'rgba(20,20,24,0.96)', borderColor: `${G}22` }}>
              <div className="site-hairline" />
              <div className="px-5 py-4 space-y-1">
                {[['Metodologia', '#metodologia'], ['Cursos', '#cursos'], ['Depoimentos', '#depoimentos'], ['FAQ', '#faq'], ['Atendimento Social', '/atendimento-social'], ['Validar Certificado', '/validar-certificado']].map(([label, href]) =>
                  <a key={label} href={href} onClick={() => setMobileMenu(false)} className="flex items-center justify-between border-b py-3 text-[11px] uppercase tracking-[0.2em] text-white/50 transition-colors last:border-0 hover:text-[#e9d9a6]" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    {label} <ChevronRight size={12} style={{ color: `${G}60` }} />
                  </a>
                )}
                <button onClick={() => { setShowLoginModal(true); setMobileMenu(false); }} className="flex w-full items-center gap-2 py-3 text-[11px] uppercase tracking-[0.2em] text-white/45">
                  <Key size={12} style={{ color: `${G}90` }} /> Área do Aluno
                </button>
                <a href="#cursos" onClick={() => setMobileMenu(false)} className="site-btn mt-2 w-full">Inscreva-se</a>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <div id="top" className="site-hero">
        {HERO_IMAGES.map((src, i) =>
          <div key={src} className={`absolute inset-0 transition-opacity [transition-duration:2.2s] ${i === heroImg ? 'opacity-100' : 'opacity-0'}`}>
            <img
              src={src}
              alt=""
              className="h-full w-full object-cover"
              style={{
                objectPosition: '50% 32%',
                transform: i === heroImg ? 'scale(1.04)' : 'scale(1)',
                transition: 'transform 9s ease-out',
              }}
            />
          </div>
        )}
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${BG}f2 0%, #0d0d11d6 46%, ${BG}e6 100%)` }} />
        <div className="site-hero-glow pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64" style={{ background: `linear-gradient(to top, ${BG}, transparent)` }} />

        <div className="site-container relative z-10 text-center" style={{ paddingTop: 'calc(6.5rem + env(safe-area-inset-top, 0px))', paddingBottom: '4rem' }}>
          <div className="mx-auto mb-9 inline-flex items-center gap-3">
            <span className="h-px w-10 sm:w-14" style={{ background: `linear-gradient(to right, transparent, ${G}70)` }} />
            <span className="text-[9px] uppercase tracking-[0.38em] font-light sm:text-[10px]" style={{ color: `${G}90` }}>Instituto de Desenvolvimento Humano</span>
            <span className="h-px w-10 sm:w-14" style={{ background: `linear-gradient(to left, transparent, ${G}70)` }} />
          </div>

          <h1 className="font-thin leading-[0.92] mb-7 tracking-[-0.025em] text-white" style={{ fontSize: 'clamp(2.7rem,10vw,6.2rem)' }}>
            Transforme vidas
            <span className="mt-1 block font-light italic" style={{ color: G }}>através da cura.</span>
          </h1>

          <p className="mx-auto mb-9 max-w-xl text-[15px] leading-relaxed font-light tracking-wide text-white/45 sm:text-base lg:text-lg">
            Torne-se terapeuta com formação profissionalizante reconhecida nacional e internacionalmente. Prática clínica desde a primeira semana.
          </p>

          <div className="mb-11 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
            {[
              { icon: '🎓', label: 'Certificado verificável' },
              { icon: '⚡', label: 'Prática desde a aula 1' },
              { icon: '🏆', label: 'Associado ABED' },
            ].map((b) => (
              <div key={b.label} className="site-pill flex items-center gap-2 px-3.5 py-2 text-[9px] font-light uppercase tracking-[0.16em] text-white/50 sm:text-[10px]">
                <span>{b.icon}</span> {b.label}
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <a href="#cursos" className="site-btn w-full sm:w-auto">
              Garantir Minha Vaga <ChevronRight size={13} />
            </a>
            <a href="#metodologia" className="site-btn site-btn--ghost w-full sm:w-auto">
              <Play size={11} className="fill-current" /> Nossa Metodologia
            </a>
          </div>
        </div>

        <div className="absolute bottom-9 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-white/20 animate-bounce sm:flex">
          <span className="text-[8px] uppercase tracking-[0.3em]">Explore</span>
          <ArrowDown size={13} />
        </div>
        <div className="absolute bottom-9 right-6 flex items-center gap-2.5 sm:right-10">
          {HERO_IMAGES.map((_, i) =>
            <button
              key={i}
              onClick={() => setHeroImg(i)}
              aria-label={`Imagem ${i + 1}`}
              className="h-[2px] transition-all duration-500"
              style={{ width: i === heroImg ? '2.25rem' : '1rem', background: i === heroImg ? G : 'rgba(255,255,255,0.22)' }}
            />
          )}
        </div>
      </div>

      {/* STATS BAR */}
      <div className="relative border-y" style={{ background: `linear-gradient(180deg, ${BG2}, #0b0b0e)`, borderColor: `${G}18` }}>
        <div className="site-container py-9 sm:py-11">
          <div className="grid grid-cols-2 gap-x-6 gap-y-9 text-center sm:grid-cols-3 lg:grid-cols-6 lg:gap-0">
            {[
              { value: '4.9★', label: 'Avaliação dos Alunos' },
              { value: '80h+', label: 'Carga Horária Total' },
              { value: '4 Meses', label: 'Duração do Curso' },
              { value: '100%', label: 'Prática desde a Aula 1' },
              { value: '3', label: 'Formações Disponíveis' },
              { value: 'ABED', label: 'Associado Oficial' }
            ].map((s, i) =>
              <div key={i} className={`group flex flex-col items-center lg:px-4 ${i > 0 ? 'lg:border-l' : ''}`} style={{ borderColor: `${G}18` }}>
                <p className="text-[26px] font-thin leading-none tracking-[0.02em] transition-colors duration-300 sm:text-3xl" style={{ color: G }}>{s.value}</p>
                <span className="mt-2.5 h-px w-6 transition-all duration-300 group-hover:w-10" style={{ background: `${G}60` }} />
                <p className="mt-2 text-[9px] font-light uppercase leading-snug tracking-[0.22em] text-white/35">{s.label}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* METODOLOGIA */}
      <section id="metodologia" className="site-section" style={{ background: BG }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <SectionLabel>Nossa Metodologia</SectionLabel>
              <h2 className="text-4xl lg:text-5xl font-thin text-white mb-2 leading-tight tracking-[-0.01em]">
                Nossa
                <span className="block font-light italic" style={{ color: G }}>Metodologia.</span>
              </h2>
              <div className="h-px my-7" style={{ background: `${G}15` }} />
              <blockquote className="border-l pl-5 mb-7" style={{ borderColor: `${G}30` }}>
                <p className="text-white/40 text-sm italic leading-relaxed font-light">"Você pode ser ótimo(a) em muitas coisas na sua vida, mas a excelência vai se apresentar somente quando encontrar o que realmente nasceu para fazer."</p>
                <p className="text-xs font-light mt-2 uppercase tracking-[0.2em]" style={{ color: `${G}70` }}>— William Ribeiro</p>
              </blockquote>
              <p className="text-white/40 leading-relaxed mb-4 text-sm font-light">
                Muitas pessoas sentem o chamado para ajudar o próximo, mas o medo de não saber o que fazer no primeiro atendimento acaba travando o início dessa jornada. Foi para romper essa barreira que criei uma formação onde você não apenas estuda, mas pratica a terapia desde as primeiras semanas. Aqui, unimos a <strong className="text-white/70 font-normal">Terapia Comportamental</strong>, a <strong className="text-white/70 font-normal">profundidade da psicanálise</strong> e a <strong className="text-white/70 font-normal">complexidade da sexualidade humana</strong>.
              </p>
              <p className="text-white/35 leading-relaxed mb-8 text-sm font-light">
                Se você busca transformar sua vocação em uma carreira de impacto e <strong className="text-white/60 font-normal">excelência</strong>, este é o caminho para dominar as ferramentas que realmente <strong className="text-white/60 font-normal">mudam vidas</strong>.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {FEATURES.map(({ icon: Icon, title, desc }) =>
                  <div key={title} className="flex items-start gap-3 border p-4 transition-colors" style={{ borderColor: `${G}12` }}>
                    <div className="w-7 h-7 border flex items-center justify-center shrink-0" style={{ borderColor: `${G}25` }}>
                      <Icon size={12} style={{ color: `${G}80` }} />
                    </div>
                    <div>
                      <p className="font-medium text-white/70 text-xs uppercase tracking-[0.15em]">{title}</p>
                      <p className="text-white/30 text-xs mt-0.5 font-light">{desc}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="relative">
              <div className="relative overflow-hidden">
                <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80" alt="Curso" className="w-full aspect-[4/5] object-cover object-center" />
                <div className="absolute inset-0" style={{ background: `${BG}28` }} />
                <div className="absolute inset-x-0 bottom-0 h-36" style={{ background: `linear-gradient(to top, ${BG}, transparent)` }} />
                <div className="absolute bottom-6 left-6 right-6 border backdrop-blur-sm p-4" style={{ borderColor: `${G}25`, background: `${BG}cc` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 border flex items-center justify-center" style={{ borderColor: `${G}40` }}>
                      <Zap size={12} style={{ color: G }} />
                    </div>
                    <div>
                      <p className="text-white/70 font-light text-xs uppercase tracking-[0.2em]">Próxima turma</p>
                      <p className="text-xs font-light tracking-wide" style={{ color: `${G}70` }}>Setembro/2026 · Vagas limitadas</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-2 -right-2 w-full h-full border pointer-events-none" style={{ borderColor: `${G}08` }} />
            </div>
          </div>
        </div>
      </section>

      {/* SOBRE O PROFESSOR */}
      <section id="professor" className="site-section" style={{ background: BG2 }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <SectionLabel center>Seu Mentor</SectionLabel>
            <h2 className="text-4xl lg:text-5xl font-thin text-white tracking-[-0.01em]">Prof. William Ribeiro</h2>
            <p className="text-white/35 mt-2 text-sm font-light uppercase tracking-[0.2em]">Psicoterapeuta · Psicanalista · Sexólogo · Educador</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start mb-16">
            <div className="lg:col-span-2">
              <div className="relative">
                <div className="w-full overflow-hidden aspect-square">
                  <img src="https://media.base44.com/images/public/69f55577840a3c93cee191be/3488805d0_17673765754883.jpg"
                    alt="Prof. William Ribeiro" className="w-full h-full object-cover" style={{ objectPosition: '50% 30%' }} />
                </div>
                <div className="absolute inset-0 ring-1 pointer-events-none" style={{ ringColor: `${G}20` }} />
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-auto whitespace-nowrap border px-6 py-3" style={{ background: BG3, borderColor: `${G}30` }}>
                  <p className="font-light text-center text-xs uppercase tracking-[0.25em]" style={{ color: G }}>Prof. William Ribeiro — WR EDU®</p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-3 space-y-4">
              {[
                'A base do pensamento de William Ribeiro foi construída em um mergulho profundo nos processos organizacionais e corporativos entre 2007 e 2017. Essa década representou uma ascensão estratégica: iniciando como office boy e percorrendo setores vitais como auxiliar de finanças, assistente de departamento pessoal e, finalmente, gestor de pessoas à frente de recrutamentos e seleções.',
                `Foi com o ingresso na turma de Administração da Universidade Federal do Paraná (UFPR) que William desenvolveu uma de suas principais teses: a Teoria da Utilidade Comportamental. Originalmente inspirada em teorias do comportamento econômico e adaptada para o âmbito clínico.`,
                `Dessa evolução natural, consolidou-se sua atuação como Psicoterapeuta, Psicanalista e Sexólogo Integrativo, com formações certificadas nacional e internacionalmente. Especialista em vícios e dinâmicas conjugais, William fundou o grupo Sinapse Coletiva.`,
                `Atualmente, essa trajetória culmina na coordenação da plataforma ${BRAND_LEGAL_NAME}. Como mantenedor associado à ABED, William gerencia formações profissionalizantes que capacitam novos terapeutas através de um método focado na prática, na ética e na dignidade do atendimento.`
              ].map((text, i) =>
                <p key={i} className="text-white/40 text-sm leading-relaxed font-light">{text}</p>
              )}
            </div>
          </div>

          {/* Credenciais */}
          <div className="mb-14">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle size={11} style={{ color: G }} />
              <span className="text-[10px] font-light text-white/30 uppercase tracking-[0.3em]">Credenciais e Certificações Verificáveis</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CERTS.map((c, i) =>
                <div key={i} className="border p-5 transition-all" style={{ borderColor: `${G}10` }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = `${G}25`}
                  onMouseLeave={e => e.currentTarget.style.borderColor = `${G}10`}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-6 h-6 border flex items-center justify-center shrink-0 mt-0.5" style={{ borderColor: `${G}25` }}>
                      <CheckCircle size={11} style={{ color: G }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 font-light text-sm uppercase tracking-[0.12em]">{c.title}</p>
                      <p className="text-white/35 text-xs mt-0.5 font-light">{c.institution}</p>
                    </div>
                  </div>
                  <p className="text-white/20 text-[10px] font-mono py-1.5 mb-2 truncate">Cód: {c.code}</p>
                  {c.extra && <p className="text-white/30 text-xs mb-2 leading-relaxed font-light">{c.extra}</p>}
                  {c.verifyLink && <a href={c.verifyLink} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-light hover:opacity-80 transition-opacity" style={{ color: G }}>
                    <ExternalLink size={10} /> {c.verifyLabel}
                  </a>}
                </div>
              )}
            </div>
          </div>

          {/* Atuação Atual */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Sparkles size={11} className="text-white/30" />
              <span className="text-[10px] font-light text-white/30 uppercase tracking-[0.3em]">Atuação Atual</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {CURRENT.map((item, i) =>
                <div key={i} className="border p-5 transition-all" style={{ borderColor: `${G}10` }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = `${G}22`}
                  onMouseLeave={e => e.currentTarget.style.borderColor = `${G}10`}>
                  <p className="text-white/70 font-light text-xs uppercase tracking-[0.12em] mb-2">{item.title}</p>
                  <p className="text-white/35 text-xs leading-relaxed mb-3 font-light">{item.desc}</p>
                  {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-light hover:opacity-80 transition-opacity" style={{ color: G }}>
                    <ExternalLink size={10} /> {item.linkLabel}
                  </a>}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ATUAÇÃO SOCIAL */}
      <section id="atuacao-social" className="site-section" style={{ background: BG }}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <SectionLabel>Atuação aberta à comunidade</SectionLabel>
            <h2 className="text-4xl lg:text-5xl font-thin text-white leading-tight mb-5 tracking-[-0.01em]">Terapia também é<span className="block font-light italic" style={{ color: G }}>presença social.</span></h2>
            <p className="text-white/40 leading-relaxed mb-4 text-sm font-light">
              Nossa atuação vai além da sala de aula: produzimos conteúdo aberto, acolhimento emocional e reflexões para ouvintes e espectadores que buscam orientação, equilíbrio e consciência no dia a dia.
            </p>
            <p className="text-white/30 leading-relaxed mb-7 text-sm font-light">
              Esse compromisso social mostra na prática a essência da nossa formação: técnica, humanidade e responsabilidade com pessoas reais.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href={SOCIAL_REEL_URL} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 text-xs uppercase tracking-[0.2em] border px-6 py-3 font-medium transition-all"
                style={{ borderColor: `${G}60`, color: G }}
                onMouseEnter={e => { e.currentTarget.style.background = G; e.currentTarget.style.color = '#000'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = G; }}>
                <Play size={12} className="fill-current" /> Assistir no Instagram
              </a>
              <a href={INSTAGRAM_PROFILE_URL} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 border border-white/10 text-white/40 text-xs uppercase tracking-[0.2em] px-6 py-3 hover:border-white/20 hover:text-white/60 transition-all font-light">
                <Instagram size={12} /> @wrterapia
              </a>
            </div>
          </div>
          <div className="relative">
            <div className="border overflow-hidden" style={{ borderColor: `${G}15` }}>
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b" style={{ borderColor: `${G}10`, background: BG3 }}>
                <div className="flex items-center gap-2 min-w-0">
                  <Instagram size={14} style={{ color: G }} />
                  <span className="text-xs font-light uppercase tracking-[0.15em] text-white/60">Instagram @wrterapia</span>
                </div>
                <a href={INSTAGRAM_PROFILE_URL} target="_blank" rel="noopener noreferrer" className="text-[11px] font-light uppercase tracking-[0.15em] hover:text-white/70 transition-colors" style={{ color: G }}>Ver perfil</a>
              </div>
              <div className="relative w-full bg-black aspect-[9/16] max-h-[520px]">
                <iframe title="WR Terapia — Vídeo do Instagram" src={SOCIAL_REEL_EMBED_URL}
                  className="absolute inset-0 w-full h-full bg-black"
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowFullScreen loading="lazy" />
              </div>
              <div className="px-4 py-3 border-t text-center" style={{ borderColor: `${G}10`, background: BG3 }}>
                <a href={SOCIAL_REEL_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 text-[11px] font-light text-white/40 hover:text-white/60 uppercase tracking-[0.15em]">
                  <Play size={11} className="fill-current" /> Abrir no Instagram
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NOSSOS CURSOS */}
      <section id="cursos" className="site-section" style={{ background: BG }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <SectionLabel center>Formações</SectionLabel>
            <h2 className="text-4xl lg:text-5xl font-thin text-white tracking-[-0.01em]">Oferta de Matrícula<span className="block font-light italic" style={{ color: G }}>Antecipada</span></h2>
            <p className="text-white/35 mt-3 max-w-2xl mx-auto text-sm font-light">Entre na primeira turma com condição exclusiva: 50% de desconto na primeira mensalidade e 40% de desconto mantido até o final do curso.</p>
            <SocialInitiativeNotice className="mx-auto mt-6 max-w-3xl text-left" />

            {/* Timer oferta */}
            <div className="site-card relative mx-auto mt-9 max-w-2xl overflow-hidden p-6 sm:p-7">
              <span className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${G}90, transparent)` }} />
              <div className="flex flex-col items-center justify-between gap-6 lg:flex-row">
                <div className="text-center lg:text-left">
                  <p className="mb-2 text-[9px] font-light uppercase tracking-[0.3em]" style={{ color: `${G}90` }}>Janela especial de 48 horas</p>
                  <p className="text-[15px] font-light leading-snug text-white/80">Garanta 50% na 1ª mensalidade + 40% vitalício até o fim do curso</p>
                  <p className="mt-1.5 text-[11px] font-light leading-relaxed text-white/35">A condição vitalícia vale para inscritos até a abertura da primeira turma.</p>
                </div>
                <div className="grid shrink-0 grid-cols-3 gap-2 text-center">
                  {[['Horas', offerHours], ['Min', offerMinutes], ['Seg', offerSeconds]].map(([label, value]) => (
                    <div key={label} className="min-w-[66px] border px-2.5 py-2.5" style={{ borderColor: `${G}22`, background: 'rgba(255,255,255,0.02)' }}>
                      <p className="font-mono text-xl font-light tabular-nums" style={{ color: G }}>{value}</p>
                      <p className="mt-1 text-[8px] uppercase tracking-[0.22em] text-white/30">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Selos */}
            <div className="flex flex-wrap items-center justify-center gap-5 mt-6">
              <a href="https://www.abed.org.br/site/associados/consulta-associados-ativos/" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-5 border px-8 py-5 transition-all group" style={{ borderColor: `${G}12` }}
                onMouseEnter={e => e.currentTarget.style.borderColor = `${G}28`}
                onMouseLeave={e => e.currentTarget.style.borderColor = `${G}12`}>
                <img src="https://media.base44.com/images/public/69f55577840a3c93cee191be/fb3aaf448_LogotipoSOMOSASSOCIADOSABED-Branco.png" alt="ABED" className="h-16 object-contain opacity-50 group-hover:opacity-80 transition-opacity" />
                <ExternalLink size={14} className="text-white/20 group-hover:text-white/50 transition-colors" />
              </a>
              <a href="https://ahde-global.org/?lang=pt-br" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 border px-5 py-3 transition-all group" style={{ borderColor: `${G}12` }}
                onMouseEnter={e => e.currentTarget.style.borderColor = `${G}28`}
                onMouseLeave={e => e.currentTarget.style.borderColor = `${G}12`}>
                <div className="text-center">
                  <p className="font-light text-sm uppercase tracking-[0.2em]" style={{ color: G }}>AHDE</p>
                  <p className="text-white/25 text-[9px] uppercase tracking-widest mt-0.5">International</p>
                </div>
                <div className="h-6 w-px bg-white/10" />
                <div className="text-left">
                  <p className="text-white/50 text-xs font-light">Membro Registrado</p>
                  <p className="text-white/25 text-[10px] mt-0.5 font-light">ID: 00403THE</p>
                </div>
                <ExternalLink size={10} className="text-white/20 group-hover:text-white/50 transition-colors" />
              </a>
            </div>
          </div>

          {/* Cards dos Cursos */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {COURSES.map((c, i) =>
              <div key={i} className="site-card group relative flex flex-col overflow-hidden" style={{ borderColor: i === 0 ? `${G}42` : undefined }}>
                {i === 0 && <span className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px" style={{ background: `linear-gradient(90deg, transparent, ${G}, transparent)` }} />}
                <div className="relative h-48 overflow-hidden">
                  {c.imgs.map((img, j) =>
                    <img key={j} src={img} alt={c.title} className={`absolute inset-0 h-full w-full object-cover object-center transition-all duration-700 group-hover:scale-105 ${j === courseImgs[i] ? 'opacity-100' : 'opacity-0'}`} />
                  )}
                  <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${BG3}, ${BG3}18 55%, transparent)` }} />
                  <div className="absolute left-4 top-4 site-pill px-2.5 py-1 text-[8.5px] font-medium uppercase tracking-[0.22em]" style={{ borderColor: `${G}55`, color: G, background: 'rgba(10,10,12,0.72)' }}>
                    {c.tag}
                  </div>
                  <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2">
                    {c.imgs.map((_, j) =>
                      <button key={j} onClick={() => setCourseImgs((prev) => prev.map((v, idx) => idx === i ? j : v))}
                        aria-label={`Imagem ${j + 1}`}
                        className="h-[2px] transition-all duration-500" style={{ width: j === courseImgs[i] ? '1.6rem' : '0.8rem', background: j === courseImgs[i] ? G : 'rgba(255,255,255,0.28)' }} />
                    )}
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5 sm:p-6" style={{ background: `linear-gradient(180deg, ${BG3}, #101014)` }}>
                  <h3 className="mb-1.5 text-[13px] font-light uppercase tracking-[0.2em] text-white">{c.title}</h3>
                  <p className="mb-5 text-[11.5px] font-light leading-relaxed text-white/35">{c.subtitle}</p>
                  <div className="mb-5 flex-1 space-y-2">
                    {c.highlights.map((h, j) =>
                      <div key={j} className="flex items-start gap-2.5 text-[11.5px] font-light leading-snug text-white/45">
                        <span className="mt-[6px] h-px w-2.5 shrink-0" style={{ background: `${G}90` }} />
                        {h}
                      </div>
                    )}
                  </div>
                  <div className="border-t pt-4" style={{ borderColor: `${G}18` }}>
                    <div className="mb-4 border p-4" style={{ borderColor: `${G}14`, background: 'rgba(255,255,255,0.02)' }}>
                      <p className="mb-1 text-[8.5px] font-light uppercase tracking-[0.22em] text-white/35">Oferta ativa por 48h</p>
                      <p className="mb-2.5 text-[11px] font-light text-white/30">Valor cheio: <span className="line-through">{c.originalPrice}</span></p>
                      <p className="mb-0.5 text-[10px] font-light uppercase tracking-[0.12em]" style={{ color: `${G}90` }}>Primeira mensalidade com 50%</p>
                      <p className="text-[26px] font-thin leading-tight text-white">{c.firstMonthPrice}</p>
                      <div className="my-3 h-px" style={{ background: `${G}14` }} />
                      <p className="text-[10px] font-light uppercase tracking-[0.12em] text-white/35">Depois, 40% vitalício</p>
                      <p className="text-lg font-thin text-white">{c.price} <span className="text-[11px] font-light text-white/30">{c.period}</span></p>
                      <SocialInitiativeNotice compact className="mt-3.5 rounded-none" />
                    </div>
                    <a href={`/ementa-cursos#${c.slug}`} className="mb-2 flex w-full items-center justify-center gap-2 border py-2.5 text-[10px] font-light uppercase tracking-[0.18em] text-white/45 transition-colors hover:border-[#d4b96a]/40 hover:text-white/75" style={{ borderColor: `${G}18` }}>
                      <BookOpen size={11} /> Ver ementa do curso
                    </a>
                    <button onClick={() => openCourseReservation(c)} className="site-btn w-full">
                      <MessageCircle size={11} /> Quero Me Inscrever
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <style>{`
        html { scroll-behavior: smooth; }
        #atuacao-social, #atendimento-social, #cursos, #professor, #metodologia, #depoimentos, #faq {
          scroll-margin-top: 5rem;
        }
        @media (max-width: 767px) {
          iframe { max-width: 100%; }
        }
      `}</style>

      {/* SEÇÃO REMOVIDA — cursos agora exibidos diretamente acima */}
      {false && (
      <section className="site-section" style={{ background: BG2 }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <SectionLabel>Em breve</SectionLabel>
            <h2 className="text-4xl lg:text-5xl font-thin text-white tracking-[-0.01em]">Próximas <span className="font-light italic" style={{ color: G }}>Formações</span></h2>
            <p className="text-white/35 mt-3 max-w-2xl mx-auto text-sm font-light">Garanta sua vaga antecipada com condição exclusiva: 50% de desconto na primeira mensalidade e 40% de desconto vitalício até o final do curso.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: 'PSICANALISTA DIPLOMADO',
                subtitle: 'Formação Profissionalizante em Psicanálise',
                originalPrice: 'R$ 450',
                firstMonthPrice: 'R$ 225',
                price: 'R$ 270',
                period: '/mês até o fim do curso',
                tag: 'Em breve · 2027',
                slug: 'psi',
                imgs: [
                  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
                  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80',
                ],
                highlights: [
                  'Fundamentos da Psicanálise Freudiana e Lacaniana',
                  'Prática clínica supervisionada',
                  'Certificação profissional reconhecida',
                  'Análise de sonhos e processos inconscientes',
                  'Ingresso previsto para início de 2027',
                ],
              },
              {
                title: 'SEXÓLOGO INTEGRATIVO',
                subtitle: 'Formação Profissionalizante em Sexologia',
                originalPrice: 'R$ 450',
                firstMonthPrice: 'R$ 225',
                price: 'R$ 270',
                period: '/mês até o fim do curso',
                tag: 'Em breve · 2027',
                slug: 'sex',
                imgs: [
                  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
                  'https://images.unsplash.com/photo-1609234656388-0ff363383899?w=800&q=80',
                ],
                highlights: [
                  'Sexualidade humana com base científica',
                  'Infidelidade conjugal e vícios comportamentais',
                  'Abordagem integrativa e sistêmica',
                  'Certificação nacional e internacional',
                  'Ingresso previsto para meados de 2027',
                ],
              },
            ].map((c, i) => (
              <div key={i} className="border flex flex-col transition-all overflow-hidden" style={{ borderColor: `${G}20` }}>
                {/* Imagem */}
                <div className="relative h-44 overflow-hidden">
                  <img src={c.imgs[0]} alt={c.title} className="w-full h-full object-cover object-center" />
                  <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${BG3}, ${BG3}10)` }} />
                  <div className="absolute top-3 left-3 border px-2.5 py-1 text-[9px] font-light uppercase tracking-[0.2em]" style={{ borderColor: `${G}50`, color: G, background: `${BG}cc` }}>
                    {c.tag}
                  </div>
                </div>
                {/* Conteúdo */}
                <div className="p-5 flex flex-col flex-1" style={{ background: BG3 }}>
                  <h3 className="font-light text-white text-sm uppercase tracking-[0.18em] mb-1">{c.title}</h3>
                  <p className="text-white/30 text-xs leading-relaxed mb-4 font-light">{c.subtitle}</p>
                  <div className="space-y-1.5 mb-5 flex-1">
                    {c.highlights.map((h, j) => (
                      <div key={j} className="flex items-center gap-2 text-xs text-white/35 font-light">
                        <div className="w-1 h-1 shrink-0" style={{ background: `${G}80` }} />
                        {h}
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t" style={{ borderColor: `${G}10` }}>
                    <div className="mb-4">
                      <p className="text-[10px] text-white/30 mb-0.5 font-light uppercase tracking-[0.15em]">Oferta de reserva antecipada</p>
                      <p className="text-xs text-white/25 mb-0.5 font-light">Valor cheio: <span className="line-through">{c.originalPrice}</span></p>
                      <p className="text-[11px] font-light mb-0.5" style={{ color: `${G}80` }}>Primeira mensalidade com 50%:</p>
                      <p className="text-2xl font-thin text-white">{c.firstMonthPrice}</p>
                      <p className="text-[11px] text-white/30 mt-2 font-light">Depois, 40% de desconto vitalício:</p>
                      <p className="text-xl font-thin text-white">{c.price} <span className="text-xs font-light text-white/30">{c.period}</span></p>
                    </div>
                    <button
                      onClick={() => openCourseReservation({ title: c.title })}
                      className="w-full px-4 py-3 border text-[11px] font-medium uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all"
                      style={{ borderColor: `${G}60`, color: G }}
                      onMouseEnter={e => { e.currentTarget.style.background = G; e.currentTarget.style.color = '#000'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = G; }}>
                      <MessageCircle size={11} /> Reservar Vaga Antecipada
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* DEPOIMENTOS */}
      <section id="depoimentos" className="site-section" style={{ background: BG2 }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel center>Depoimentos Verificados</SectionLabel>
            <h2 className="text-3xl font-thin text-white tracking-[-0.01em]">O que dizem nossos alunos</h2>
            <p className="text-white/30 text-xs mt-2 font-light uppercase tracking-[0.2em]">Relatos reais · nomes e identidades preservados pelos próprios alunos</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {testimonials.map((t, i) => {
              const avatarColors = ['#8b5cf6','#059669','#2563eb','#dc2626','#d97706','#0891b2'];
              const color = avatarColors[i % avatarColors.length];
              return (
                <div key={i} className="site-card group flex h-full flex-col p-6 sm:p-7">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex gap-1">{Array.from({ length: t.stars }).map((_, j) => <Star key={j} size={11} style={{ color: G, fill: G }} />)}</div>
                    <Quote size={18} className="shrink-0" style={{ color: `${G}28` }} />
                  </div>
                  <p className="mb-6 flex-1 text-[13.5px] font-light italic leading-relaxed text-white/50">"{t.text}"</p>
                  <div className="mt-auto flex items-center gap-3 border-t pt-4" style={{ borderColor: `${G}12` }}>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white ring-1 ring-white/10"
                      style={{ background: color }}>{t.name[0]}</div>
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-medium uppercase tracking-[0.14em] text-white/70">{t.name}</p>
                      <p className="mt-0.5 text-[9.5px] font-light uppercase tracking-[0.12em] text-white/25">Aluno(a) verificado(a)</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="site-section" style={{ background: BG }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel center>Perguntas Frequentes</SectionLabel>
            <h2 className="text-3xl font-thin text-white tracking-[-0.01em]">Dúvidas comuns</h2>
          </div>
          <FaqSection />
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="site-section relative overflow-hidden" style={{ background: BG }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at center, ${G}08, transparent 65%)` }} />
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <div className="mx-auto mb-10 h-px w-24" style={{ background: `linear-gradient(90deg, transparent, ${G}80, transparent)` }} />
          <h2 className="mb-4 text-4xl font-thin tracking-[-0.015em] text-white lg:text-5xl">Pronto para começar<span className="block font-light italic" style={{ color: G }}>sua jornada?</span></h2>
          <p className="mx-auto mb-10 max-w-md text-sm font-light leading-relaxed text-white/40">Vagas limitadas para a turma 2026. Inscreva-se agora e garanta sua transformação.</p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
            <a href="#cursos" className="site-btn site-btn--solid w-full sm:w-auto">
              Garantir Minha Vaga <ChevronRight size={13} />
            </a>
            <button onClick={() => setShowLoginModal(true)} className="site-btn site-btn--ghost w-full sm:w-auto">
              Já sou aluno
            </button>
          </div>
          <div className="mx-auto mt-10 h-px w-24" style={{ background: `linear-gradient(90deg, transparent, ${G}40, transparent)` }} />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative" style={{ background: '#08080a' }}>
        <div className="site-hairline" />
        <div className="site-container py-14">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-8">
            <div className="md:col-span-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center border" style={{ borderColor: `${G}30`, background: `linear-gradient(160deg, ${G}12, transparent)` }}>
                  <img src={WR_PRIMARY_LOGO} alt="WR" className="h-7 w-7 object-contain" />
                </div>
                <div>
                  <p className="text-[12px] font-light uppercase tracking-[0.28em] text-white/85">{BRAND_SHORT_NAME}</p>
                  <p className="mt-1 text-[8.5px] font-light uppercase tracking-[0.2em]" style={{ color: `${G}70` }}>Instituto de Desenvolvimento Humano</p>
                </div>
              </div>
              <p className="mt-5 max-w-xs text-[11.5px] font-light leading-relaxed text-white/30">
                {BRAND_LEGAL_NAME} · CNPJ {BRAND_CNPJ}
              </p>
              <button onClick={() => setShowLoginModal(true)} className="mt-6 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/40 transition-colors hover:text-[#e9d9a6]">
                <Key size={11} style={{ color: `${G}90` }} /> Área do Aluno
              </button>
            </div>

            <div className="md:col-span-3">
              <p className="mb-4 text-[8.5px] font-semibold uppercase tracking-[0.28em] text-white/35">Navegação</p>
              <div className="flex flex-col gap-2.5">
                {[['Metodologia', '#metodologia'], ['Cursos', '#cursos'], ['Depoimentos', '#depoimentos'], ['FAQ', '#faq'], ['Atendimento Social', '/atendimento-social']].map(([label, href]) =>
                  <a key={label} href={href} className="text-[11.5px] font-light text-white/40 transition-colors hover:text-white/80">{label}</a>
                )}
              </div>
            </div>

            <div className="md:col-span-4">
              <p className="mb-4 text-[8.5px] font-semibold uppercase tracking-[0.28em] text-white/35">Institucional</p>
              <div className="flex flex-col gap-2.5">
                {[{ label: 'Política de Trabalho', href: '/politica' }, { label: 'Termos de Uso', href: '/termos' }, { label: 'Privacidade', href: '/privacidade' }, { label: 'Validar Certificado', href: '/validar-certificado' }].map((l) =>
                  <a key={l.label} href={l.href} className="text-[11.5px] font-light text-white/40 transition-colors hover:text-white/80">{l.label}</a>
                )}
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-5 border-t pt-7 md:flex-row" style={{ borderColor: `${G}14` }}>
            <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-3">
              <p className="text-[10px] font-light text-white/25">{BRAND_LEGAL_NAME} © 2026 · CNPJ {BRAND_CNPJ}</p>
              <span className="hidden text-white/10 sm:inline">·</span>
              <p className="text-[10px] font-light text-white/25">Feito com <span className="text-red-400/60">♥</span> pela <a href="/wr-tec" className="transition-colors hover:text-white/50" style={{ color: `${G}70` }}>WR-TEC®</a> © 2026</p>
            </div>
            <div className="flex items-center gap-4">
              <img src="https://media.base44.com/images/public/69f55577840a3c93cee191be/fb3aaf448_LogotipoSOMOSASSOCIADOSABED-Branco.png"
                alt="ABED" className="h-7 object-contain opacity-25 transition-opacity hover:opacity-60" />
              <div className="flex items-center gap-1.5 border px-3 py-1" style={{ borderColor: `${G}18` }}>
                <div className="h-1.5 w-1.5 rounded-full" style={{ background: G }} />
                <span className="font-mono text-[10px] font-light tracking-widest text-white/25">V-003-00</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* MODAL ATENDIMENTO SOCIAL */}
      {socialOpen && (
        <div className="fixed inset-0 z-[190] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4" onClick={() => setSocialOpen(false)}>
          <div className="border w-full max-w-2xl max-h-[90dvh] shadow-2xl overflow-hidden flex flex-col" style={{ background: BG3, borderColor: `${G}20` }} onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b flex items-start justify-between gap-4" style={{ borderColor: `${G}12` }}>
              <div>
                <h3 className="text-white/80 font-light text-sm uppercase tracking-[0.22em] flex items-center gap-2"><Heart size={14} style={{ color: G }} /> Atendimento Social</h3>
                <p className="text-white/30 text-xs mt-1 font-light">Triagem breve · consulta social R$ 35,00 · retorno em até 48h</p>
              </div>
              <button onClick={() => setSocialOpen(false)} className="text-white/25 hover:text-white/60 transition-colors"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ background: BG }}>
              <div className="space-y-3">
                {socialMessages.map((message, index) => (
                  <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[86%] border px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap font-light ${message.role === 'user' ? 'text-black' : 'text-white/60'}`}
                      style={message.role === 'user' ? { background: G, borderColor: G } : { background: BG3, borderColor: `${G}15` }}>
                      {message.content}
                    </div>
                  </div>
                ))}
                {socialLoading && <div className="text-xs text-white/25 font-light">A IA está digitando...</div>}
              </div>
              {socialMessages.filter(m => m.role === 'user').length >= 5 && (
                <div className="border p-4 space-y-4" style={{ background: BG3, borderColor: `${G}15` }}>
                  <p className="text-xs font-light uppercase tracking-[0.2em]" style={{ color: G }}>Escolha uma data do mês vigente</p>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 max-h-40 overflow-y-auto pr-1">
                    {getCurrentMonthDates().map((date) => (
                      <button key={date.iso} onClick={() => setSelectedSocialDate(date.iso)} className="border px-2 py-2 text-center transition-all"
                        style={selectedSocialDate === date.iso ? { borderColor: G, background: G, color: '#000' } : { borderColor: `${G}15`, color: 'rgba(255,255,255,0.5)' }}>
                        <span className="block text-[9px] uppercase font-light">{date.week}</span>
                        <span className="text-sm font-light">{date.day}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs font-light uppercase tracking-[0.2em]" style={{ color: G }}>Horário</p>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {SOCIAL_TIME_SLOTS.map((time) => (
                      <button key={time} onClick={() => setSelectedSocialTime(time)} className="border px-3 py-2 text-xs font-light transition-all"
                        style={selectedSocialTime === time ? { borderColor: G, background: G, color: '#000' } : { borderColor: `${G}15`, color: 'rgba(255,255,255,0.5)' }}>{time}</button>
                    ))}
                  </div>
                  {socialBooked ? (
                    <div className="border p-4 text-xs text-white/50 font-light" style={{ borderColor: `${G}20` }}>
                      Agendamento solicitado. Em até 48 horas um atendente entrará em contato para enviar o código Pix de R$ 35,00.
                    </div>
                  ) : (
                    <button onClick={bookSocialAppointment} disabled={!selectedSocialDate || !selectedSocialTime}
                      className="w-full py-3 text-xs uppercase tracking-[0.2em] font-medium border transition-all disabled:opacity-30"
                      style={{ borderColor: `${G}60`, color: G }}>Solicitar agendamento</button>
                  )}
                </div>
              )}
            </div>
            <div className="p-4 border-t" style={{ borderColor: `${G}12`, background: BG3 }}>
              <div className="flex gap-2">
                <input value={socialInput} onChange={(e) => setSocialInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') sendSocialChatMessage(); }}
                  placeholder={socialMessages.filter(m => m.role === 'user').length >= 5 ? 'Entrevista concluída. Escolha data e horário acima.' : 'Responda aqui...'}
                  className="flex-1 border text-white placeholder:text-white/20 h-11 px-3 text-sm focus:outline-none font-light"
                  style={{ background: BG, borderColor: `${G}18`, color: 'white' }} />
                <button onClick={sendSocialChatMessage} disabled={!socialInput.trim() || socialLoading || socialMessages.filter(m => m.role === 'user').length >= 5}
                  className="h-11 w-11 border flex items-center justify-center disabled:opacity-30 transition-all"
                  style={{ borderColor: `${G}50`, color: G }}><Send size={14} /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RESERVA */}
      {reserveOpen && (
        <div className="fixed inset-0 z-[190] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setReserveOpen(false)}>
          <div className="border w-full max-w-lg max-h-[88dvh] shadow-2xl overflow-hidden flex flex-col" style={{ background: BG3, borderColor: `${G}20` }} onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b flex items-start justify-between gap-4" style={{ borderColor: `${G}12` }}>
              <div>
                <h3 className="text-white/80 font-light text-sm uppercase tracking-[0.22em] flex items-center gap-2"><MessageCircle size={14} style={{ color: G }} /> Reserva Antecipada</h3>
                <p className="text-white/30 text-xs mt-1 font-light">{selectedCourse?.title} · questionário guiado por IA</p>
              </div>
              <button onClick={() => setReserveOpen(false)} className="text-white/25 hover:text-white/60 transition-colors"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: BG }}>
              {leadMessages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[82%] border px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap font-light`}
                    style={message.role === 'user' ? { background: G, borderColor: G, color: '#000' } : { background: BG3, borderColor: `${G}15`, color: 'rgba(255,255,255,0.6)' }}>
                    {message.content}
                  </div>
                </div>
              ))}
              {leadLoading && <div className="text-xs text-white/25 font-light">A IA está digitando...</div>}
            </div>
            <div className="p-4 border-t space-y-3" style={{ borderColor: `${G}12`, background: BG3 }}>
              <div className="flex gap-2">
                <input value={leadInput} onChange={(e) => setLeadInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') sendReserveChatMessage(); }}
                  placeholder={leadMessages.filter(m => m.role === 'user').length >= MAX_RESERVATION_AI_QUESTIONS ? 'Questionário encerrado. Envie pelo WhatsApp.' : 'Responda aqui...'}
                  className="flex-1 border h-11 px-3 text-sm focus:outline-none font-light"
                  style={{ background: BG, borderColor: `${G}18`, color: 'white' }} />
                <button onClick={sendReserveChatMessage} disabled={!leadInput.trim() || leadLoading || leadMessages.filter(m => m.role === 'user').length >= MAX_RESERVATION_AI_QUESTIONS}
                  className="h-11 w-11 border flex items-center justify-center disabled:opacity-30"
                  style={{ borderColor: `${G}50`, color: G }}><Send size={14} /></button>
              </div>
              <button onClick={sendReserveToWhatsApp} className="w-full py-3 border text-xs uppercase tracking-[0.2em] font-medium transition-all"
                style={{ borderColor: `${G}60`, color: G }}
                onMouseEnter={e => { e.currentTarget.style.background = G; e.currentTarget.style.color = '#000'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = G; }}>
                Enviar reserva para WhatsApp oficial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP FLOATING BUTTON */}
      <a
        href="https://wa.me/5541992531598?text=Olá! Vim pelo site e gostaria de saber mais sobre as formações."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-[180] flex items-center gap-3 px-4 py-3 shadow-2xl transition-all hover:scale-105 active:scale-95"
        style={{ background: '#25D366', borderRadius: '2rem' }}
        title="Falar pelo WhatsApp"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span className="text-white text-xs font-medium uppercase tracking-wide hidden sm:block">Fale Conosco</span>
      </a>

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm" onClick={() => setShowLoginModal(false)}>
          <div className="relative w-full max-w-sm overflow-hidden border p-7 shadow-2xl sm:p-8" style={{ background: 'linear-gradient(180deg, #17171b, #101014)', borderColor: `${G}28` }} onClick={(e) => e.stopPropagation()}>
            <span className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${G}, transparent)` }} />
            <div className="mb-7 flex items-start justify-between">
              <div>
                <div className="mb-3 flex h-10 w-10 items-center justify-center border" style={{ borderColor: `${G}30`, background: `linear-gradient(160deg, ${G}14, transparent)` }}>
                  <img src={WR_PRIMARY_LOGO} alt="WR" className="h-6 w-6 object-contain" />
                </div>
                <h3 className="text-[12px] font-light uppercase tracking-[0.28em] text-white/85">Área do Aluno</h3>
                <p className="mt-1 text-[9px] font-light uppercase tracking-[0.18em]" style={{ color: `${G}70` }}>Acesso seguro à plataforma</p>
              </div>
              <button onClick={() => { setShowLoginModal(false); setError(''); }} aria-label="Fechar" className="text-white/30 transition-colors hover:text-white/70"><X size={16} /></button>
            </div>

            <div className="mb-5 flex gap-1.5 border p-1.5" style={{ borderColor: `${G}18`, background: 'rgba(255,255,255,0.02)' }}>
              {['code', 'admin'].map((m) =>
                <button key={m} onClick={() => { setMode(m); setError(''); }}
                  className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[9.5px] font-light uppercase tracking-[0.2em] transition-all"
                  style={mode === m ? { background: G, color: '#0a0a0c' } : { color: 'rgba(255,255,255,0.35)' }}>
                  {m === 'code' ? <><Key size={10} /> Código</> : <><Shield size={10} /> Admin</>}
                </button>
              )}
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2.5 border p-3 text-[11px] font-light text-white/60" style={{ borderColor: 'rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.07)' }}>
                <AlertCircle size={11} className="shrink-0 text-red-400/70" /> {error}
              </div>
            )}

            {mode === 'code' ? (
              <form onSubmit={handleCodeLogin} className="space-y-4">
                <label className="block text-[9px] font-light uppercase tracking-[0.22em] text-white/35">Código de acesso</label>
                <input placeholder="EDU-XXXX-XXXX" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="h-12 w-full border text-center font-mono text-[15px] tracking-[0.3em] text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-[#d4b96a]/40"
                  style={{ background: 'rgba(10,10,12,0.85)', borderColor: `${G}25` }} autoCapitalize="characters" />
                <button type="submit" disabled={code.length < 3 || loading}
                  className="site-btn w-full disabled:opacity-40">
                  {loading ? <><div className="h-4 w-4 animate-spin rounded-full border border-current border-t-transparent" /> Verificando...</> : <>Entrar na Plataforma <ChevronRight size={12} /></>}
                </button>
                <label className="flex cursor-pointer items-center justify-center gap-2 text-[10.5px] font-light text-white/40">
                  <input type="checkbox" checked={rememberCode} onChange={(e) => setRememberCode(e.target.checked)} className="accent-[#d4b96a]" />
                  Lembrar acesso neste dispositivo
                </label>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center border" style={{ borderColor: `${G}28` }}>
                    <Shield size={20} style={{ color: G }} />
                  </div>
                  <p className="text-[11.5px] font-light leading-relaxed text-white/45">Acesso restrito ao administrador.<br/>Autenticação obrigatória via conta Google.</p>
                </div>
                <button onClick={handleGoogleLogin} className="site-btn w-full">
                  <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Entrar com Google
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}