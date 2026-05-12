import React, { useState, useEffect } from 'react';
import {
  GraduationCap, Lock, Key, Sparkles, Users, BookOpen, Video, Heart,
  Star, ChevronRight, Shield, Award, CheckCircle, ExternalLink,
  ArrowDown, Quote, Menu, X, Play, Zap, AlertCircle, MessageCircle, Send } from
'lucide-react';
import { base44 } from '@/api/base44Client';
import { setSession } from '@/lib/customAuth';
import { BRAND_CNPJ, BRAND_LEGAL_NAME, BRAND_SHORT_NAME, WR_PRIMARY_LOGO } from '@/lib/brand';

const MAX_RESERVATION_AI_QUESTIONS = 5;
const RESERVATION_FINAL_MESSAGE = 'Obrigado! Já tenho as informações principais. Agora selecione a opção de enviar a reserva para o WhatsApp oficial. A mensagem será enviada pelo aplicativo WhatsApp; caso aconteça qualquer problema no envio, entre em contato com a equipe pelo WhatsApp 4199253-1598.';

const HERO_IMAGES = [
'https://media.base44.com/images/public/69f55577840a3c93cee191be/056bf6bba_176702773849222.jpg',
'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1400&q=85',
'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1400&q=85',
'https://images.unsplash.com/photo-1609234656388-0ff363383899?w=1400&q=85'];


const FEATURES = [
{ icon: BookOpen, title: 'Videoaulas Gravadas', desc: 'Conteúdo terapêutico exclusivo' },
{ icon: Video, title: 'Lives ao Vivo', desc: 'Práticas e mentorias em tempo real' },
{ icon: Users, title: 'Comunidade Ativa', desc: 'Fórum de dúvidas entre alunos' },
{ icon: Heart, title: 'Prática Real', desc: 'Experiência terapêutica ao longo do curso' }];


const CERTS = [
{
  title: 'Psicoterapeuta',
  institution: 'Faculdade Unypública',
  code: '267797-1-432-19012026071526',
  link: null,
  extra: 'Registrado internacionalmente pela AHDE · ID: 00403THE',
  verifyLink: 'https://www.ahde-global.org/lang/ptbr/terapeuta.php?search=00403THE',
  verifyLabel: 'Verificar via AHDE'
},
{
  title: 'Psicanalista Diplomado',
  institution: 'Faculdade Unifatec',
  code: 'eeee6d19-0d18-46c5-a657-3e6f5bfdb515',
  link: null,
  extra: 'Registrado internacionalmente pela Therapist University · ID: CERT-1768040814293-CAZA86VTQ',
  verifyLink: 'https://certificados.therapist.university/certificates/CERT-1768040814293-CAZA86VTQ',
  verifyLabel: 'Verificar Certificado'
},
{
  title: 'Logoterapeuta Diplomado',
  institution: 'Faculdade Unypública',
  code: '267797-1-405-13112025030416',
  link: null,
  extra: null,
  verifyLink: null,
  verifyLabel: null
},
{
  title: 'Sexólogo Integrativo',
  institution: 'Unifast — School of Business Acceleration',
  code: '000300950029868',
  link: null,
  extra: 'Especializações em sexualidade, infidelidade conjugal, vícios e outras áreas',
  verifyLink: null,
  verifyLabel: null
}];


const TIMELINE = [
{ period: '2009 – 2019', role: 'Atuação Administrativa', desc: 'Departamentos financeiro, RH, departamento pessoal e processos seletivos como Headhunter.' },
{ period: '2019', role: 'Administração — UFPR', desc: 'Ingresso na turma de Administração da UFPR, com destaque nas matérias de Comportamento Organizacional.' },
{ period: '2020', role: 'Operador no Mercado Financeiro e de Criptoativos', desc: 'Atuação ativa durante a crise da pandemia no mercado financeiro e de criptoativos.' },
{ period: '2022', role: 'Tecnologia da Informação — 8° RI de Curitiba', desc: 'Profissional de TI no 8° Registro de Imóveis de Curitiba, participando da implementação de migração tecnológica.' }];


const CURRENT = [
{
  title: 'Dirigente — Sinapse Coletiva',
  desc: 'Grupo formado por profissionais da saúde comportamental com o objetivo de construir um espaço consciente e equilibrado de técnicas e comunidade acadêmica.',
  link: null
},
{
  title: `Gestor — ${BRAND_LEGAL_NAME}`,
  desc: `Gerencia o Curso Profissionalizante para Formação de Terapeutas pela ${BRAND_LEGAL_NAME}. Representado oficialmente junto à ABED (Associação Brasileira de Educação a Distância).`,
  link: 'https://www.abed.org.br/site/associados/consulta-associados-ativos/',
  linkLabel: 'Consultar na ABED'
},
{
  title: 'Educador Social — Projeto Vida Digital (ADRA)',
  desc: 'Profissional de Educação Social para Crianças e Adolescentes em programa da instituição internacional ADRA. O projeto reestrutura grupos em vulnerabilidade social levando temas socioeducacionais e resgate de dignidade.',
  link: 'https://adra.org.br/projetos/vida-digital/',
  linkLabel: 'Conhecer o Projeto'
}];


const COURSES = [
{
  title: 'TERAPEUTA TC',
  subtitle: 'Curso Profissionalizante em Terapia Comportamental',
  price: 'R$ 250',
  period: '/mês · 4 meses',
  tag: 'Mais Vendido',
  tagColor: '#5b5ef4',
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
    'Aulas ao vivo todas as segundas-feiras',
    'Ingresso em Setembro/2026',
  ]
},
{
  title: 'PSICANALISTA FREUDIANO',
  subtitle: 'Curso Profissionalizante em Métodos Psicanalíticos',
  price: 'R$ 300',
  period: '/mês · 4 meses',
  tag: 'Novo',
  tagColor: '#1db89e',
  imgs: [
    'https://media.base44.com/images/public/69f55577840a3c93cee191be/f28c89ba7_generated_image.png',
    'https://media.base44.com/images/public/69f55577840a3c93cee191be/919ebf5be_generated_image.png',
    'https://media.base44.com/images/public/69f55577840a3c93cee191be/2ac899065_generated_image.png',
  ],
  highlights: [
    'Estudos de casos reais supervisionados',
    'Profundidade do método psicanalítico freudiano',
    'Credenciamento internacional como terapeuta',
    'Plataforma centralizada de conteúdos',
    'Aulas ao vivo todas as segundas-feiras',
    'Ingresso em Setembro/2026',
  ]
},
{
  title: 'SEXÓLOGO(A)',
  subtitle: 'Curso Profissionalizante em Sexualidade Humana',
  price: 'R$ 350',
  period: '/mês · 4 meses',
  tag: 'Novo',
  tagColor: '#a855f7',
  imgs: [
    'https://media.base44.com/images/public/69f55577840a3c93cee191be/e9014c7ae_generated_image.png',
    'https://media.base44.com/images/public/69f55577840a3c93cee191be/31339ba94_generated_image.png',
    'https://media.base44.com/images/public/69f55577840a3c93cee191be/f2d68446f_generated_image.png',
  ],
  highlights: [
    'Estudos de casos reais em sexualidade',
    '80h de conteúdo especializado e integrativo',
    'Credenciamento internacional como terapeuta',
    'Plataforma centralizada de conteúdos',
    'Aulas ao vivo todas as segundas-feiras',
    'Ingresso em Setembro/2026',
  ]
}];


const TESTIMONIALS = [
{ name: 'Ana Paula M.', text: 'A formação mais completa que já fiz. O diferencial da prática desde o início foi transformador para mim.', stars: 5 },
{ name: 'Carlos Eduardo S.', text: 'O Professor William tem uma didática incrível. Aprendi mais aqui do que em anos de graduação.', stars: 5 },
{ name: 'Fernanda R.', text: 'Plataforma excelente, suporte impecável e conteúdo de altíssimo nível. Super recomendo!', stars: 5 }];


export default function LandingPage({ onLogin }) {
  const [heroImg, setHeroImg] = useState(0);
  const [courseImgs, setCourseImgs] = useState([0, 0, 0]);

  useEffect(() => {
    const intervals = COURSES.map((_, i) => {
      return setInterval(() => {
        setCourseImgs(prev => prev.map((v, idx) => idx === i ? (v + 1) % COURSES[i].imgs.length : v));
      }, 4000 + i * 1500);
    });
    return () => intervals.forEach(clearInterval);
  }, []);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [mode, setMode] = useState('code');
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  // Login state
  const [code, setCode] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [testimonials, setTestimonials] = useState(TESTIMONIALS);
  const [reserveOpen, setReserveOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [leadMessages, setLeadMessages] = useState([]);
  const [leadInput, setLeadInput] = useState('');
  const [leadLoading, setLeadLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setHeroImg((i) => (i + 1) % HERO_IMAGES.length), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const loadTestimonials = async () => {
      try {
        const approved = await base44.entities.Testimonial.filter({ approved: true }, '-created_date', 20);
        if (approved?.length) {
          setTestimonials(approved.map(t => ({ name: t.student_name || 'Aluno(a)', stars: Number(t.stars || 5), text: t.comment || '' })));
        }
      } catch (error) {
        console.error('Falha ao carregar depoimentos aprovados', error);
      }
    };
    loadTestimonials();
  }, []);

  const handleCodeLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await base44.functions.invoke('siteLogin', { mode: 'student', code });
      setSession(response.data.session);
      onLogin('lobby');
    } catch (err) {
      setError(err?.response?.data?.error || 'Não foi possível entrar. Verifique o código.');
    }
    setLoading(false);
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await base44.functions.invoke('siteLogin', { mode: 'admin', email: adminEmail, password: adminPassword });
      setSession(response.data.session);
      onLogin('lobby');
    } catch (err) {
      setError(err?.response?.data?.error || 'Email ou senha incorretos.');
    }
    setLoading(false);
  };

  const openCourseReservation = (course) => {
    setSelectedCourse(course);
    setLeadMessages([
      {
        role: 'assistant',
        content: `Olá! Sou a IA da ${BRAND_LEGAL_NAME} 😊 Vou registrar sua reserva antecipada para ${course.title}. Para começar: qual é seu nome completo e melhor WhatsApp?`
      }
    ]);
    setLeadInput('');
    setReserveOpen(true);
  };

  const sendReserveChatMessage = async () => {
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

    const prompt = `Você é a IA de pré-reserva da ${BRAND_LEGAL_NAME}. Conduza um questionário curto em formato de chat para reserva antecipada do curso ${selectedCourse?.title}.
Faça no máximo ${MAX_RESERVATION_AI_QUESTIONS} perguntas no total, uma pergunta por vez, até coletar: nome completo, WhatsApp, curso de interesse, objetivo profissional e melhor horário de contato.
Quando os dados principais já estiverem presentes, ou quando alcançar o limite de ${MAX_RESERVATION_AI_QUESTIONS} perguntas, encerre o diálogo pedindo para a pessoa selecionar a opção de enviar a reserva ao WhatsApp oficial. Explique que a mensagem será enviada pelo aplicativo WhatsApp e que, caso haja qualquer problema no envio, ela deve entrar em contato com a equipe pelo WhatsApp 4199253-1598. Seja acolhedor, objetivo e use português do Brasil.

Histórico:
${nextMessages.map(m => `${m.role === 'user' ? 'Interessado' : 'IA'}: ${m.content}`).join('\n')}

IA:`;

    const response = await base44.integrations.Core.InvokeLLM({ prompt });
    setLeadMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setLeadLoading(false);
  };

  const sendReserveToWhatsApp = () => {
    const transcript = leadMessages.map(m => `${m.role === 'user' ? 'Interessado' : `IA ${BRAND_SHORT_NAME}`}: ${m.content}`).join('\n');
    const summary = encodeURIComponent(`Olá! Quero reservar vaga antecipada.
Curso: ${selectedCourse?.title}

Questionário em chat:
${transcript}`);
    window.open(`https://wa.me/5541992531598?text=${summary}`, '_blank');
    setReserveOpen(false);
  };

  return (
    <div
      className="h-[100dvh] overflow-y-auto overflow-x-hidden bg-[#080b14] text-white"
      style={{ WebkitOverflowScrolling: 'touch' }}
      onScroll={(e) => setNavScrolled(e.currentTarget.scrollTop > 60)}
    >

      {/* STICKY NAVBAR */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navScrolled ? 'py-3' : 'py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className={`flex items-center justify-between rounded-[2rem] border px-4 sm:px-5 py-3 transition-all duration-300 ${navScrolled ? 'bg-[#080b14]/88 border-white/12 shadow-2xl shadow-black/35 backdrop-blur-2xl' : 'bg-[#080b14]/45 border-white/10 shadow-lg shadow-black/10 backdrop-blur-xl'}`}>
            <a href="#top" className="flex items-center gap-3 min-w-0 group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/12 to-white/4 border border-white/12 flex items-center justify-center shadow-inner group-hover:border-[#1db89e]/45 transition-colors">
                <img src={WR_PRIMARY_LOGO} alt="WR" className="w-10 h-10 object-contain" />
              </div>
              <div className="min-w-0">
                <span className="block text-base sm:text-lg font-black tracking-tight leading-tight truncate text-white">{BRAND_SHORT_NAME}</span>
                <span className="hidden sm:block text-[10px] text-white/40 uppercase tracking-[0.22em]">Instituto de Desenvolvimento Humano</span>
              </div>
            </a>
            <div className="hidden md:flex items-center gap-1 rounded-full bg-white/[0.06] border border-white/10 p-1 text-sm text-white/62 shadow-inner shadow-black/20">
              {[['Metodologia', '#metodologia'], ['Coordenação', '#professor'], ['Cursos', '#cursos'], ['Depoimentos', '#depoimentos']].map(([label, href]) =>
              <a key={label} href={href} className="px-4 py-2 rounded-full hover:bg-white/10 hover:text-white transition-all">{label}</a>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={() => setShowLoginModal(true)} className="hidden md:flex items-center gap-2 rounded-full border border-[#1db89e]/25 bg-[#1db89e]/10 px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1db89e]/16 hover:border-[#1db89e]/45 transition-all shadow-lg shadow-[#1db89e]/10">
                <span className="w-2 h-2 rounded-full bg-[#1db89e] shadow-[0_0_12px_rgba(29,184,158,0.8)]" /> Área do Aluno
              </button>
              <a href="#cursos" className="hidden md:block rounded-full bg-gradient-to-r from-[#5b5ef4] to-[#1db89e] px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-[#5b5ef4]/30 hover:opacity-95 transition-all" style={{animation:'pulse-cta 2s ease-in-out infinite'}}>
                Inscreva-se
              </a>
              <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden w-11 h-11 rounded-2xl bg-white/8 border border-white/10 text-white/70 hover:text-white flex items-center justify-center">
                {mobileMenu ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
        {mobileMenu &&
        <div className="md:hidden mx-4 mt-2 rounded-3xl bg-[#0d1120]/95 border border-white/10 px-4 py-4 space-y-2 shadow-2xl shadow-black/30 backdrop-blur-xl">
            {[['Metodologia', '#metodologia'], ['Coordenação', '#professor'], ['Cursos', '#cursos'], ['Depoimentos', '#depoimentos']].map(([label, href]) =>
          <a key={label} href={href} onClick={() => setMobileMenu(false)} className="block text-white/65 hover:text-white hover:bg-white/8 py-3 px-3 rounded-2xl text-sm font-medium transition-all">{label}</a>
          )}
            <button onClick={() => {setShowLoginModal(true);setMobileMenu(false);}} className="w-full flex items-center justify-center gap-2 rounded-2xl border border-[#1db89e]/25 bg-[#1db89e]/10 py-3 text-white font-bold text-sm">
              <span className="w-2 h-2 rounded-full bg-[#1db89e]" /> Área do Aluno
            </button>
            <a href="#cursos" onClick={() => setMobileMenu(false)} className="block w-full text-center bg-gradient-to-r from-[#5b5ef4] to-[#1db89e] text-white font-black py-3 rounded-2xl text-sm shadow-lg shadow-[#5b5ef4]/35" style={{animation:'pulse-cta 2s ease-in-out infinite'}}>
              Inscreva-se
            </a>
          </div>
        }
      </nav>

      {/* HERO FULL-WIDTH */}
      <div id="top" className="relative h-screen flex items-center justify-center overflow-hidden">
        {HERO_IMAGES.map((src, i) =>
        <div key={src} className={`absolute inset-0 transition-opacity duration-1500 ${i === heroImg ? 'opacity-100' : 'opacity-0'}`}>
            <img src={src} alt="" className="w-full h-full object-cover" style={{ objectPosition: '50% 35%' }} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#080b14]/70 via-[#080b14]/50 to-[#080b14]" />
        <div className="absolute inset-0 bg-[#080b14]/30" />

        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto pt-24 lg:pt-32">
          <h1 className="text-6xl lg:text-8xl font-black leading-[0.95] mb-8 tracking-tight">
            Transforme
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#5b5ef4] via-[#a855f7] to-[#1db89e]">
              vidas
            </span>
            <span className="block text-4xl lg:text-5xl text-white/80 font-bold mt-2">através da cura.</span>
          </h1>
          <p className="text-white/60 text-lg lg:text-xl leading-relaxed max-w-2xl mx-auto mb-12">
            Sua vocação merece o próximo passo. Nossa formação profissionalizante redefine o ensino da terapia ao integrar o acolhimento humanizado à prática terapêutica constante.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#cursos" className="inline-flex items-center gap-2 bg-gradient-to-r from-[#5b5ef4] to-[#1db89e] text-white font-black px-8 py-4 rounded-2xl shadow-2xl shadow-[#5b5ef4]/40 hover:opacity-90 transition-all text-base">
              Ver Nossos Cursos <ChevronRight size={18} />
            </a>
            <a href="#metodologia" className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/15 transition-all text-base">
              <Play size={15} className="fill-current" /> Nossa Metodologia
            </a>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30 animate-bounce">
          <span className="text-xs tracking-widest uppercase">Role para baixo</span>
          <ArrowDown size={16} />
        </div>
        <div className="absolute bottom-8 right-8 flex gap-2">
          {HERO_IMAGES.map((_, i) =>
          <button key={i} onClick={() => setHeroImg(i)}
          className={`h-1.5 rounded-full transition-all ${i === heroImg ? 'bg-[#5b5ef4] w-10' : 'bg-white/20 w-5'}`} />
          )}
        </div>
      </div>

      {/* STATS BAR */}
      <div className="bg-[#0d1120] border-y border-white/8 py-8 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 text-center">
          {[
          { value: '4.8★', label: 'Avaliação Média' },
          { value: '80h', label: 'Carga Horária' },
          { value: '4 meses', label: 'Duração' },
          { value: 'Reais', label: 'Professores Reais' },
          { value: 'Vivência', label: 'Consultório' },
          { value: 'Exclusiva', label: 'Plataforma' }].
          map((s, i) =>
          <div key={i}>
              <p className="text-2xl lg:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#5b5ef4] to-[#1db89e]">{s.value}</p>
              <p className="text-white/40 text-xs mt-1 uppercase tracking-wide">{s.label}</p>
            </div>
          )}
        </div>
      </div>

      {/* METODOLOGIA */}
      <section id="metodologia" className="py-28 px-6 lg:px-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#5b5ef4]/10 border border-[#5b5ef4]/20 rounded-full px-4 py-1.5 mb-6">
                <GraduationCap size={13} className="text-[#5b5ef4]" />
                <span className="text-xs font-bold text-[#5b5ef4] uppercase tracking-widest">Nossa Metodologia</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-black text-white mb-6 leading-tight">
                Nossa
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#5b5ef4] to-[#1db89e]">Metodologia.</span>
              </h2>
              <blockquote className="border-l-2 border-[#5b5ef4]/40 pl-4 mb-6">
                <p className="text-white/50 text-sm italic leading-relaxed">“Você pode ser ótimo(a) em muitas coisas na sua vida, mas a excelência vai se apresentar somente quando encontrar o que realmente nasceu para fazer.”</p>
                <p className="text-[#5b5ef4] text-xs font-bold mt-2">— William Ribeiro</p>
              </blockquote>
              <p className="text-white/60 leading-relaxed mb-4 text-sm">
                Muitas pessoas sentem o chamado para ajudar o próximo, mas o medo de não saber o que fazer no primeiro atendimento acaba travando o início dessa jornada. Foi para romper essa barreira que criei uma formação onde você não apenas estuda, mas pratica a terapia desde as primeiras semanas. Aqui, unimos a <strong className="text-white">Terapia Comportamental</strong>, a <strong className="text-white">profundidade da psicanálise</strong> e a <strong className="text-white">complexidade da sexualidade humana</strong> em um método direto e sem rodeios.
              </p>
              <p className="text-white/60 leading-relaxed mb-4 text-sm">
                Diferente de cursos gravados e solitários, estarei com você em tempo real, guiando sua evolução técnica enquanto você interage com colegas e se conecta à comunidade profissional do grupo Sinapse Coletiva. O nosso compromisso é que você experimente a vivência do consultório ainda durante o curso, saindo preparado para atender com ética, segurança e a dignidade que cada paciente merece.
              </p>
              <p className="text-white/60 leading-relaxed mb-8 text-sm">
                Se você busca transformar sua vocação em uma carreira de impacto e <strong className="text-white">excelência</strong>, este é o caminho para dominar as ferramentas que realmente <strong className="text-white">mudam vidas</strong>.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {FEATURES.map(({ icon: Icon, title, desc }) =>
                <div key={title} className="flex items-start gap-3 bg-white/4 border border-white/8 rounded-2xl p-4">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#5b5ef4]/20 to-[#1db89e]/20 flex items-center justify-center shrink-0">
                      <Icon size={14} className="text-[#1db89e]" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{title}</p>
                      <p className="text-white/40 text-xs mt-0.5">{desc}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden">
                <img src={'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80'} alt="Curso" className="w-full aspect-[4/5] object-cover object-center" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080b14]/80 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#5b5ef4] to-[#1db89e] rounded-full flex items-center justify-center">
                        <Zap size={16} className="text-white" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">Próxima turma</p>
                        <p className="text-[#1db89e] text-xs font-semibold">Início em Setembro/2026 · Vagas limitadas</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#5b5ef4]/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-[#1db89e]/15 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* SOBRE O PROFESSOR */}
      <section id="professor" className="py-28 px-6 lg:px-20 bg-[#0a0d1a]">
        <div className="max-w-6xl mx-auto">
              {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[#5b5ef4]/10 border border-[#5b5ef4]/20 rounded-full px-4 py-1.5 mb-4">
              <Award size={13} className="text-[#5b5ef4]" />
              <span className="text-xs font-bold text-[#5b5ef4] uppercase tracking-widest">Seu Mentor</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-white">Prof. William Ribeiro</h2>
            <p className="text-white/50 mt-2 text-lg">Psicoterapeuta · Psicanalista · Sexólogo · Educador</p>
          </div>

          {/* Avatar + Bio */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start mb-16" style={{alignItems:'start'}}>
            <div className="lg:col-span-2">
              <div className="relative">
                <div className="w-full rounded-3xl overflow-hidden aspect-square">
                  <img
                    src="https://media.base44.com/images/public/69f55577840a3c93cee191be/3488805d0_17673765754883.jpg"
                    alt="Prof. William Ribeiro"
                    className="w-full h-full object-cover"
                    style={{ objectPosition: '50% 30%' }} />
                  
                </div>
                <div className="absolute inset-0 rounded-3xl ring-2 ring-[#5b5ef4]/20" />
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-auto whitespace-nowrap bg-gradient-to-r from-[#5b5ef4] to-[#1db89e] rounded-2xl px-6 py-3 shadow-xl shadow-[#5b5ef4]/30">
                  <p className="text-white font-black text-center text-sm">Prof. William Ribeiro - WR EDU®</p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-3 space-y-4">
              <p className="text-white/70 text-sm leading-relaxed">
                A base do pensamento de William Ribeiro foi construída em um mergulho profundo nos processos organizacionais e corporativos entre 2007 e 2017. Essa década representou uma ascensão estratégica: iniciando como office boy e percorrendo setores vitais como auxiliar de finanças, assistente de departamento pessoal e, finalmente, gestor de pessoas à frente de recrutamentos e seleções.
              </p>
              <p className="text-white/60 text-sm leading-relaxed">
                Foi com o ingresso na turma de Administração da <strong className="text-white">Universidade Federal do Paraná (UFPR)</strong> que William desenvolveu uma de suas principais teses: a <strong className="text-white">Teoria da Utilidade Comportamental</strong>. Originalmente inspirada em teorias do comportamento econômico e adaptada para o âmbito clínico, essa visão propõe uma análise profunda de como as escolhas e motivações moldam a existência humana.
              </p>
              <p className="text-white/60 text-sm leading-relaxed">
                Também atuou profissionalmente no campo da tecnologia, atendendo a estruturas e processos junto ao <strong className="text-white">8° Registro de Imóveis de Curitiba</strong>, realizando transições entre sistemas tecnológicos, manutenção do ecossistema digital, controle de dados de pessoal e processos de treinamentos e capacitações internas.
              </p>
              <p className="text-white/60 text-sm leading-relaxed">
                Dessa evolução natural, consolidou-se sua atuação como Psicoterapeuta, Psicanalista e Sexólogo Integrativo, com formações certificadas nacional e internacionalmente. Especialista em vícios e dinâmicas conjugais, William fundou o grupo <strong className="text-white">Sinapse Coletiva</strong>, um ecossistema que integra profissionais da saúde comportamental focados em uma técnica consciente, equilibrada e despida de amadorismos.
              </p>
              <p className="text-white/60 text-sm leading-relaxed">
                Atualmente, essa trajetória culmina na coordenação da plataforma <strong className="text-white">{BRAND_LEGAL_NAME}</strong>. Como mantenedor associado à <strong className="text-white">ABED</strong>, William gerencia formações profissionalizantes que capacitam novos terapeutas através de um método focado na prática, na ética e na dignidade do atendimento. Esse compromisso expande-se como Educador Social no projeto <strong className="text-white">Vida Digital</strong> da <strong className="text-white">ADRA Paraná</strong>, onde reestrutura comunidades em vulnerabilidade.
              </p>
              <p className="text-white/50 text-sm leading-relaxed italic">
                William Ribeiro não apenas ensina terapia; ele lidera uma formação que une o rigor da utilidade comportamental ao poder transformador do acolhimento humanizado.
              </p>
            </div>
          </div>

          {/* Credenciais */}
          <div className="mb-14">
            <p className="text-xs font-black text-white/30 uppercase tracking-widest mb-5 flex items-center gap-2">
              <CheckCircle size={13} className="text-[#1db89e]" /> Credenciais e Certificações Verificáveis
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CERTS.map((c, i) =>
              <div key={i} className="bg-white/4 border border-white/8 rounded-2xl p-5 hover:border-[#5b5ef4]/30 hover:bg-white/6 transition-all">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-7 h-7 rounded-full bg-[#1db89e]/15 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle size={13} className="text-[#1db89e]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm">{c.title}</p>
                      <p className="text-white/50 text-xs mt-0.5">{c.institution}</p>
                    </div>
                  </div>
                  <p className="text-white/25 text-[10px] font-mono bg-white/5 rounded-lg px-3 py-1.5 mb-2 truncate">Cód: {c.code}</p>
                  {c.extra && <p className="text-white/40 text-xs mb-2 leading-relaxed">{c.extra}</p>}
                  {c.verifyLink &&
                <a href={c.verifyLink} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#5b5ef4] text-xs font-semibold hover:text-[#7c7ef4] transition-colors">
                      <ExternalLink size={11} /> {c.verifyLabel}
                    </a>
                }
                </div>
              )}
            </div>
          </div>

          {/* Trajetória */}
          













          

          {/* Atuação Atual */}
          <div>
            <p className="text-xs font-black text-white/30 uppercase tracking-widest mb-5 flex items-center gap-2">
              <Sparkles size={13} className="text-yellow-400" /> Atuação Atual
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {CURRENT.map((item, i) =>
              <div key={i} className="bg-white/4 border border-white/8 rounded-2xl p-5 hover:border-[#1db89e]/30 transition-all">
                  <p className="text-white font-bold text-sm mb-2">{item.title}</p>
                  <p className="text-white/45 text-xs leading-relaxed mb-3">{item.desc}</p>
                  {item.link &&
                <a href={item.link} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#1db89e] text-xs font-semibold hover:opacity-80 transition-opacity">
                      <ExternalLink size={11} /> {item.linkLabel}
                    </a>
                }
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* NOSSOS CURSOS */}
      <section id="cursos" className="py-28 px-6 lg:px-20 bg-[#080b14]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[#1db89e]/10 border border-[#1db89e]/20 rounded-full px-4 py-1.5 mb-4">
              <GraduationCap size={13} className="text-[#1db89e]" />
              <span className="text-xs font-bold text-[#1db89e] uppercase tracking-widest">Formações</span>
            </div>
            <h2 className="text-4xl font-black text-white">Nossos Cursos Profissionalizantes</h2>
            <p className="text-white/50 mt-3 max-w-lg mx-auto text-base">Certificados digitais verificáveis emitidos pela {BRAND_LEGAL_NAME}.</p>
            {/* Selos ABED + AHDE */}
            <div className="flex flex-wrap items-center justify-center gap-5 mt-6">
              <a href="https://www.abed.org.br/site/associados/consulta-associados-ativos/" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-[18px] bg-white/6 hover:bg-white/10 border border-white/10 rounded-3xl px-[30px] py-[18px] transition-all group">
                <img src="https://media.base44.com/images/public/69f55577840a3c93cee191be/fb3aaf448_LogotipoSOMOSASSOCIADOSABED-Branco.png" alt="ABED" className="h-[60px] object-contain" />
                <ExternalLink size={17} className="text-white/20 group-hover:text-[#5b5ef4] transition-colors" />
              </a>
              <a href="https://ahde-global.org/?lang=pt-br" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white/6 hover:bg-white/10 border border-white/10 rounded-2xl px-5 py-3 transition-all group">
                <div className="text-center">
                  <p className="text-[#1db89e] font-black text-sm leading-none">AHDE</p>
                  <p className="text-white/30 text-[9px] uppercase tracking-widest mt-0.5">International</p>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="text-left">
                  <p className="text-white/70 text-xs font-semibold leading-none">Membro Registrado</p>
                  <p className="text-white/30 text-[10px] mt-0.5">ID: 00403THE</p>
                </div>
                <ExternalLink size={11} className="text-white/20 group-hover:text-[#1db89e] transition-colors" />
              </a>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {COURSES.map((c, i) =>
            <div key={i} className={`bg-[#0d1120] border rounded-3xl overflow-hidden flex flex-col transition-all hover:shadow-2xl hover:shadow-[#5b5ef4]/10 ${i === 0 ? 'border-[#5b5ef4]/40 ring-1 ring-[#5b5ef4]/20' : 'border-white/10'}`}>
                <div className="relative h-44 overflow-hidden">
                  {c.imgs.map((img, j) =>
                <img key={j} src={img} alt={c.title} className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ${j === courseImgs[i] ? 'opacity-100' : 'opacity-0'}`} />
                )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d1120] via-[#0d1120]/20 to-transparent" />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black text-white" style={{ backgroundColor: c.tagColor }}>
                    {c.tag}
                  </div>
                  <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {c.imgs.map((_, j) =>
                  <button key={j} onClick={() => setCourseImgs((prev) => prev.map((v, idx) => idx === i ? j : v))}
                  className={`h-1.5 rounded-full transition-all ${j === courseImgs[i] ? 'w-5' : 'bg-white/40 w-2'}`}
                  style={j === courseImgs[i] ? { backgroundColor: c.tagColor } : {}} />
                  )}
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-black text-white text-lg mb-1">{c.title}</h3>
                  <p className="text-white/40 text-xs leading-relaxed mb-4">{c.subtitle}</p>
                  <div className="space-y-1.5 mb-5 flex-1">
                    {c.highlights.map((h, j) =>
                  <div key={j} className="flex items-center gap-2 text-xs text-white/55">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: c.tagColor }} />
                        {h}
                      </div>
                  )}
                  </div>
                  <div className="pt-4 border-t border-white/8">
                    <div className="mb-3">
                      <p className="text-xs text-white/30 mb-0.5">Investimento</p>
                      <p className="text-2xl font-black text-white">{c.price} <span className="text-sm font-normal text-white/40">{c.period}</span></p>
                    </div>
                    <button
                      onClick={() => openCourseReservation(c)}
                      className="w-full px-4 py-3 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-[#5b5ef4] to-[#1db89e] border border-[#5b5ef4]/30 flex items-center justify-center gap-2 hover:opacity-90 transition-all" style={{animation:'pulse-cta 2s ease-in-out infinite'}}>
                      <MessageCircle size={13} /> Quero Me Inscrever
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <style>{`
        @keyframes pulse-cta {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(91,94,244,0.5); }
          50% { transform: scale(1.03); box-shadow: 0 0 0 10px rgba(91,94,244,0); }
        }
      `}</style>

      {/* DEPOIMENTOS */}
      <section id="depoimentos" className="py-24 px-6 lg:px-20 bg-[#0a0d1a]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-white mb-2">O que dizem nossos alunos</h2>
            <p className="text-white/40 text-sm">Mais de 500 terapeutas formados</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) =>
            <div key={i} className="bg-[#0d1120] border border-white/8 rounded-2xl p-6 hover:border-[#5b5ef4]/20 transition-all">
                <Quote size={22} className="text-[#5b5ef4]/30 mb-3" />
                <p className="text-white/70 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#5b5ef4] to-[#1db89e] flex items-center justify-center text-xs font-black">{t.name[0]}</div>
                  <div>
                    <p className="text-white text-sm font-bold">{t.name}</p>
                    <div className="flex gap-0.5 mt-0.5">{Array.from({ length: t.stars }).map((_, j) => <Star key={j} size={9} className="text-yellow-400 fill-yellow-400" />)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 px-6 lg:px-20 bg-gradient-to-br from-[#5b5ef4]/20 via-[#080b14] to-[#1db89e]/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(91,94,244,0.15)_0%,transparent_70%)]" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl lg:text-5xl font-black text-white mb-4">Pronto para começar sua jornada?</h2>
          <p className="text-white/60 text-lg mb-10">Vagas limitadas para a turma 2026. Inscreva-se agora e garanta sua transformação.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#cursos" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#5b5ef4] to-[#1db89e] text-white font-black px-10 py-4 rounded-2xl shadow-2xl shadow-[#5b5ef4]/40 hover:opacity-90 transition-all text-base" style={{animation:'pulse-cta 2s ease-in-out infinite'}}>
              Garantir Minha Vaga <ChevronRight size={18} />
            </a>
            <button onClick={() => setShowLoginModal(true)} className="inline-flex items-center justify-center gap-2 bg-white/8 border border-white/15 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/12 transition-all text-sm">
              <span className="w-2 h-2 rounded-full bg-[#1db89e] shadow-[0_0_12px_rgba(29,184,158,0.7)]" /> Já sou aluno
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/8 py-12 px-6 lg:px-20 bg-[#080b14]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-8">
            <div className="flex items-center gap-3">
              <img src={WR_PRIMARY_LOGO} alt="WR" className="w-12 h-12 object-contain" />
              <div>
                <p className="text-white font-black text-base">{BRAND_LEGAL_NAME}</p>
                <p className="text-white/30 text-xs">CNPJ {BRAND_CNPJ}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-6 text-white/30 text-sm">
              {[
              { label: 'Política de Trabalho', href: '/politica' },
              { label: 'Termos de Uso', href: '/termos' },
              { label: 'Privacidade', href: '/privacidade' }].
              map((l) =>
              <a key={l.label} href={l.href} className="hover:text-white/70 transition-colors">{l.label}</a>
              )}
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3">
              <p className="text-white/20 text-xs">{BRAND_LEGAL_NAME} © 2026 · CNPJ {BRAND_CNPJ}</p>
              <span className="text-white/10 hidden sm:inline">·</span>
              <p className="text-white/20 text-xs">Feito com <span className="text-red-500">♥</span> pela <a href="/wr-tec" className="text-white/40 font-semibold hover:text-[#5b5ef4] transition-colors">WR-TEC®</a> © 2026</p>
            </div>
            <div className="flex items-center gap-4">
              <img
                src="https://media.base44.com/images/public/69f55577840a3c93cee191be/fb3aaf448_LogotipoSOMOSASSOCIADOSABED-Branco.png"
                alt="ABED" className="h-8 object-contain opacity-30 hover:opacity-70 transition-opacity" />
              
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/8 rounded-full px-3 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#1db89e]" />
                <span className="text-white/30 text-[10px] font-mono font-semibold tracking-widest">V-003-00</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* RESERVA ANTECIPADA EM CHAT */}
      {reserveOpen &&
      <div className="fixed inset-0 z-[190] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setReserveOpen(false)}>
          <div className="bg-[#0d1120] border border-white/15 rounded-3xl w-full max-w-lg max-h-[88dvh] shadow-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-white/10 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-white font-black text-lg flex items-center gap-2"><MessageCircle size={18} className="text-[#1db89e]" /> Reserva Antecipada</h3>
                <p className="text-white/40 text-xs mt-1">{selectedCourse?.title} · questionário guiado por IA</p>
              </div>
              <button onClick={() => setReserveOpen(false)} className="text-white/30 hover:text-white transition-colors"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#080b14]">
              {leadMessages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${message.role === 'user' ? 'bg-[#5b5ef4] text-white' : 'bg-white/8 border border-white/10 text-white/80'}`}>
                    {message.content}
                  </div>
                </div>
              ))}
              {leadLoading && <div className="text-xs text-white/35">IA digitando...</div>}
            </div>
            <div className="p-4 border-t border-white/10 bg-[#0d1120] space-y-3">
              <div className="flex gap-2">
                <input
                  value={leadInput}
                  onChange={(e) => setLeadInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') sendReserveChatMessage(); }}
                  placeholder={leadMessages.filter(m => m.role === 'user').length >= MAX_RESERVATION_AI_QUESTIONS ? 'Questionário encerrado. Envie pelo WhatsApp.' : 'Responda aqui...'}
                  className="flex-1 bg-white/6 border border-white/10 text-white placeholder:text-white/25 h-11 rounded-xl px-3 text-sm focus:outline-none focus:border-[#1db89e]/60"
                />
                <button onClick={sendReserveChatMessage} disabled={!leadInput.trim() || leadLoading || leadMessages.filter(m => m.role === 'user').length >= MAX_RESERVATION_AI_QUESTIONS} className="h-11 w-11 rounded-xl bg-[#1db89e] text-white flex items-center justify-center disabled:opacity-40"><Send size={16} /></button>
              </div>
              <button onClick={sendReserveToWhatsApp} className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 font-bold text-sm">Enviar reserva para WhatsApp oficial</button>
            </div>
          </div>
        </div>
      }

      {/* LOGIN MODAL */}
      {showLoginModal &&
      <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowLoginModal(false)}>
          <div className="bg-[#0d1120] border border-white/15 rounded-3xl p-8 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-white font-black text-xl">Área do Aluno</h3>
                <p className="text-white/40 text-xs mt-0.5">Acesso seguro à plataforma</p>
              </div>
              <button onClick={() => {setShowLoginModal(false);setError('');}} className="text-white/30 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="flex gap-1.5 bg-white/4 rounded-2xl p-1.5 mb-5 border border-white/8">
              {['code', 'admin'].map((m) =>
            <button key={m} onClick={() => {setMode(m);setError('');}}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${mode === m ? 'bg-gradient-to-br from-[#5b5ef4] to-[#7c3aed] text-white shadow-lg' : 'text-white/35 hover:text-white/65'}`}>
                  {m === 'code' ? <><Key size={12} /> Código</> : <><Shield size={12} /> Admin</>}
                </button>
            )}
            </div>

            {error &&
          <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/25 text-red-300 text-xs p-3 rounded-xl mb-4">
                <AlertCircle size={13} className="shrink-0" /> {error}
              </div>
          }

            {mode === 'code' ?
          <form onSubmit={handleCodeLogin} className="space-y-4">
                <input
              placeholder="EDU-XXXX-XXXX"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full bg-white/6 border border-white/10 text-white placeholder:text-white/20 h-12 text-center text-lg tracking-widest font-mono rounded-xl px-3 focus:outline-none focus:border-[#5b5ef4]/60"
              autoCapitalize="characters" />
            
                <button
              type="submit"
              disabled={code.length < 3 || loading}
              className="w-full h-12 bg-gradient-to-r from-[#5b5ef4] to-[#1db89e] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
              
                  {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verificando...</> : <>Entrar na Plataforma <ChevronRight size={15} /></>}
                </button>
              </form> :

          <form onSubmit={handleAdminLogin} className="space-y-3">
                <input
              type="email"
              placeholder="seu@email.com"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="w-full bg-white/6 border border-white/10 text-white placeholder:text-white/20 h-10 rounded-xl px-3 text-sm focus:outline-none focus:border-[#5b5ef4]/60" />
            
                <input
              type="password"
              placeholder="••••••••"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full bg-white/6 border border-white/10 text-white placeholder:text-white/20 h-10 rounded-xl px-3 text-sm focus:outline-none focus:border-[#5b5ef4]/60" />
            
                <button
              type="submit"
              disabled={!adminEmail || !adminPassword || loading}
              className="w-full h-10 bg-gradient-to-r from-[#5b5ef4] to-[#1db89e] text-white font-bold text-sm rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
              
                  {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Entrando...</> : 'Entrar como Admin'}
                </button>
              </form>
          }
          </div>
        </div>
      }
    </div>);

}