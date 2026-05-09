import React, { useState, useEffect } from 'react';
import {
  GraduationCap, Lock, Key, Sparkles, Users, BookOpen, Video, Heart,
  Star, ChevronRight, Shield, Award, CheckCircle, ExternalLink,
  ArrowDown, Quote, Menu, X, Play, Zap, AlertCircle } from
'lucide-react';
import { base44 } from '@/api/base44Client';
import { setSession, verifyPassword, nowBRT } from '@/lib/customAuth';

const LOGO_URL = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/077216e46_textodoseupargrafoWR_20251219_192959_0000.png';

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
  verifyLink: 'https://ahde-global.org/?lang=pt-br',
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
  title: 'Gestor — WR-EDU',
  desc: 'Gerencia o Curso Profissionalizante para Formação de Terapeutas. Representado oficialmente junto à ABED (Associação Brasileira de Educação a Distância).',
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
  title: 'Terapeuta TCC',
  subtitle: 'Curso Profissionalizante na Formação de Terapeuta em Abordagem TCC',
  price: 'R$ 250',
  period: '/mês · 4 meses',
  tag: 'Mais Vendido',
  tagColor: '#5b5ef4',
  imgs: [
  'https://media.base44.com/images/public/69f55577840a3c93cee191be/1d898387b_generated_image.png',
  'https://media.base44.com/images/public/69f55577840a3c93cee191be/7a4725dbb_generated_image.png',
  'https://media.base44.com/images/public/69f55577840a3c93cee191be/fa5959e53_generated_image.png'],

  highlights: [
  'Técnicas cognitivo-comportamentais aplicadas',
  'Prática clínica desde as primeiras semanas',
  'Credenciamento internacional como terapeuta',
  'Plataforma centralizada de conteúdos',
  'Aulas ao vivo todas as segundas-feiras',
  'Ingresso em Setembro/2026']

},
{
  title: 'Psicanalista Freudiano',
  subtitle: 'Curso Profissionalizante na Formação de Terapeutas do Método Psicanalítico',
  price: 'R$ 300',
  period: '/mês · 4 meses',
  tag: 'Novo',
  tagColor: '#1db89e',
  imgs: [
  'https://media.base44.com/images/public/69f55577840a3c93cee191be/f28c89ba7_generated_image.png',
  'https://media.base44.com/images/public/69f55577840a3c93cee191be/919ebf5be_generated_image.png',
  'https://media.base44.com/images/public/69f55577840a3c93cee191be/2ac899065_generated_image.png'],

  highlights: [
  'Estudos de casos reais supervisionados',
  'Profundidade do método psicanalítico freudiano',
  'Credenciamento internacional como terapeuta',
  'Plataforma centralizada de conteúdos',
  'Aulas ao vivo todas as segundas-feiras',
  'Ingresso em Setembro/2026']

},
{
  title: 'Sexólogo(a)',
  subtitle: 'Curso Profissionalizante na Formação de Terapeutas da Sexualidade Humana',
  price: 'R$ 350',
  period: '/mês · 4 meses',
  tag: 'Novo',
  tagColor: '#a855f7',
  imgs: [
  'https://media.base44.com/images/public/69f55577840a3c93cee191be/e9014c7ae_generated_image.png',
  'https://media.base44.com/images/public/69f55577840a3c93cee191be/31339ba94_generated_image.png',
  'https://media.base44.com/images/public/69f55577840a3c93cee191be/f2d68446f_generated_image.png'],

  highlights: [
  'Estudos de casos reais em sexualidade',
  '80h de conteúdo especializado e integrativo',
  'Credenciamento internacional como terapeuta',
  'Plataforma centralizada de conteúdos',
  'Aulas ao vivo todas as segundas-feiras',
  'Ingresso em Setembro/2026']

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
        setCourseImgs((prev) => prev.map((v, idx) => idx === i ? (v + 1) % COURSES[i].imgs.length : v));
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

  useEffect(() => {
    const interval = setInterval(() => setHeroImg((i) => (i + 1) % HERO_IMAGES.length), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleCodeLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const trimmed = code.trim().toUpperCase();
    const results = await base44.entities.AccessCode.filter({ code: trimmed, is_active: true });
    if (results.length === 0) {
      setError('Código inválido ou desativado.');
      setLoading(false);
      return;
    }
    const record = results[0];
    await base44.entities.AccessCode.update(record.id, { last_login: nowBRT() });
    setSession({
      role: 'student',
      codeId: record.id,
      code: trimmed,
      name: record.profile_name || record.student_name || 'Aluno',
      email: record.student_email || '',
      bio: record.profile_bio || '',
      avatarColor: record.profile_avatar_color || '#5b5ef4',
      photoUrl: record.profile_photo_url || ''
    });
    onLogin();
    setLoading(false);
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const creds = await base44.entities.AdminCredential.list();
    if (creds.length === 0) {
      setError('Login admin não configurado.');
      setLoading(false);
      return;
    }
    const cred = creds[0];
    if (adminEmail.trim() !== cred.email || !verifyPassword(adminPassword, cred.password_hash)) {
      setError('Email ou senha incorretos.');
      setLoading(false);
      return;
    }
    setSession({ role: 'admin', name: 'Professor', email: cred.email });
    onLogin();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#080b14] text-white">

      {/* STICKY NAVBAR */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navScrolled ? 'bg-[#080b14]/95 backdrop-blur-xl border-b border-white/8 py-3 shadow-xl' : 'py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="WR" className="w-12 h-12 object-contain" />
            <span className="text-2xl font-black tracking-tight">WR-EDU</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/50">
            {[['Metodologia', '#metodologia'], ['Coordenação', '#professor'], ['Cursos', '#cursos'], ['Depoimentos', '#depoimentos']].map(([label, href]) => null

            )}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowLoginModal(true)} className="hidden md:flex items-center gap-1.5 text-white/60 hover:text-white text-sm font-medium transition-colors">
              <Lock size={13} /> Área do Aluno
            </button>
            <a href="#cursos" className="bg-gradient-to-r from-[#5b5ef4] to-[#1db89e] text-white text-sm font-bold px-5 py-2 rounded-xl hidden md:block animate-pulse hover:animate-none hover:opacity-90 transition-all shadow-lg shadow-[#5b5ef4]/40" style={{ animation: 'pulse-cta 2s ease-in-out infinite' }}>
              Inscreva-se
            </a>
            <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden text-white/60 hover:text-white">
              {mobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {mobileMenu &&
        <div className="md:hidden bg-[#0d1120] border-t border-white/8 px-6 py-4 space-y-3">
            {[['Metodologia', '#metodologia'], ['Coordenação', '#professor'], ['Cursos', '#cursos'], ['Depoimentos', '#depoimentos']].map(([label, href]) =>
          <a key={label} href={href} onClick={() => setMobileMenu(false)} className="block text-white/60 hover:text-white py-2 text-sm transition-colors">{label}</a>
          )}
            <button onClick={() => {setShowLoginModal(true);setMobileMenu(false);}} className="w-full text-center py-2 text-[#5b5ef4] font-semibold text-sm">
              Área do Aluno
            </button>
            <a href="#cursos" onClick={() => setMobileMenu(false)} className="block w-full text-center bg-gradient-to-r from-[#5b5ef4] to-[#1db89e] text-white font-bold py-3 rounded-xl text-sm shadow-lg shadow-[#5b5ef4]/40" style={{ animation: 'pulse-cta 2s ease-in-out infinite' }}>
              Inscreva-se
            </a>
          </div>
        }
      </nav>

      {/* HERO FULL-WIDTH */}
      







































      

      {/* STATS BAR */}
      















      

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
                Muitas pessoas sentem o chamado para ajudar o próximo, mas o medo de não saber o que fazer no primeiro atendimento acaba travando o início dessa jornada. Foi para romper essa barreira que criei uma formação onde você não apenas estuda, mas pratica a terapia desde as primeiras semanas. Aqui, unimos a <strong className="text-white">técnica da TCC</strong>, a <strong className="text-white">profundidade da psicanálise</strong> e a <strong className="text-white">complexidade da sexualidade humana</strong> em um método direto e sem rodeios.
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
                
                <div className="absolute bottom-6 left-6 right-6">
                  









                  
                </div>
              </div>
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#5b5ef4]/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-[#1db89e]/15 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* SOBRE O PROFESSOR */}
      























































































































      

      {/* NOSSOS CURSOS */}
      <section id="cursos" className="py-28 px-6 lg:px-20 bg-[#080b14]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[#1db89e]/10 border border-[#1db89e]/20 rounded-full px-4 py-1.5 mb-4">
              <GraduationCap size={13} className="text-[#1db89e]" />
              <span className="text-xs font-bold text-[#1db89e] uppercase tracking-widest">Formações</span>
            </div>
            <h2 className="text-4xl font-black text-white">Nossos Cursos Profissionalizantes</h2>
            <p className="text-white/50 mt-3 max-w-lg mx-auto text-base">Certificados digitais verificáveis emitidos pelo WR-EDU.</p>
            {/* Selos ABED + AHDE */}
            <div className="flex flex-wrap items-center justify-center gap-5 mt-6">
              <a href="https://www.abed.org.br/site/associados/consulta-associados-ativos/" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white/6 hover:bg-white/10 border border-white/10 rounded-2xl px-5 py-3 transition-all group">
                <img src="https://media.base44.com/images/public/69f55577840a3c93cee191be/fb3aaf448_LogotipoSOMOSASSOCIADOSABED-Branco.png" alt="ABED" className="h-10 object-contain" />
                <ExternalLink size={11} className="text-white/20 group-hover:text-[#5b5ef4] transition-colors" />
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
                    <div className="group relative">
                      <button
                      disabled
                      className="w-full px-4 py-3 rounded-2xl font-bold text-sm text-white/50 bg-gradient-to-r from-[#5b5ef4]/20 to-[#1db89e]/20 border border-[#5b5ef4]/30 cursor-not-allowed flex items-center justify-center gap-2" style={{ animation: 'pulse-cta 2s ease-in-out infinite' }}>
                      
                        <Lock size={13} /> Quero Me Inscrever
                      </button>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-[#1a1d2e] border border-white/15 rounded-xl p-3 text-center text-xs text-white/70 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        <p className="font-bold text-white mb-0.5">Em breve!</p>
                        <p>A próxima turma estará disponível em Setembro/2026. Fique ligado!</p>
                      </div>
                    </div>
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
      





















      

      {/* CTA FINAL */}
      <section className="py-24 px-6 lg:px-20 bg-gradient-to-br from-[#5b5ef4]/20 via-[#080b14] to-[#1db89e]/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(91,94,244,0.15)_0%,transparent_70%)]" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl lg:text-5xl font-black text-white mb-4">Pronto para começar sua jornada?</h2>
          <p className="text-white/60 text-lg mb-10">Vagas limitadas para a turma 2026. Inscreva-se agora e garanta sua transformação.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#cursos" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#5b5ef4] to-[#1db89e] text-white font-black px-10 py-4 rounded-2xl shadow-2xl shadow-[#5b5ef4]/40 hover:opacity-90 transition-all text-base" style={{ animation: 'pulse-cta 2s ease-in-out infinite' }}>
              Garantir Minha Vaga <ChevronRight size={18} />
            </a>
            <button onClick={() => setShowLoginModal(true)} className="inline-flex items-center justify-center gap-2 bg-white/8 border border-white/15 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/12 transition-all text-sm">
              <Lock size={14} /> Já sou aluno
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/8 py-12 px-6 lg:px-20 bg-[#080b14]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-8">
            <div className="flex items-center gap-3">
              <img src={LOGO_URL} alt="WR" className="w-10 h-10 object-contain" />
              <div>
                <p className="text-white font-black text-base">WR-EDU</p>
                <p className="text-white/30 text-xs">Escola de Formação de Terapeutas</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-6 text-white/30 text-sm">
              {[
              { label: 'Política de Trabalho', href: '/documentos?tab=politica' },
              { label: 'Termos de Uso', href: '/documentos?tab=termos' },
              { label: 'Privacidade', href: '/documentos?tab=privacidade' }].
              map((l) =>
              <a key={l.label} href={l.href} className="hover:text-white/70 transition-colors">{l.label}</a>
              )}
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-white/20 text-xs">WR-EDU © 2026 — Todos os direitos reservados</p>
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