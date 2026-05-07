import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Shield, Award, Users, BookOpen, CheckCircle, ExternalLink, Search, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WR_LOGO = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/5265f3b64_1000407748_d589e7f2d77d09c6941cdd7fa30003c5-03_02_202612_32_07.png';
const ABED_LOGO_BLUE = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/235c6e412_LogotipoSOMOSASSOCIADOSABED-Azul.png';
const ABED_LOGO_WHITE = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/6dcc80ae2_LogotipoSOMOSASSOCIADOSABED-Branco.png';

const features = [
  {
    icon: GraduationCap,
    title: 'Formação Profissionalizante',
    desc: 'Cursos de capacitação em práticas terapêuticas reconhecidos e certificados conforme a Lei nº 9.394/96.',
    color: 'from-primary/20 to-primary/5',
    iconColor: 'text-primary',
  },
  {
    icon: Shield,
    title: 'Certificação com Validade Legal',
    desc: 'Nossos certificados têm validade em todo o Brasil, amparados pela LDB e Decreto nº 5.154/04.',
    color: 'from-green-500/20 to-green-500/5',
    iconColor: 'text-green-600',
  },
  {
    icon: Award,
    title: 'Parceiros da ABED',
    desc: 'Associados à Associação Brasileira de Educação a Distância — referência nacional em EAD.',
    color: 'from-blue-500/20 to-blue-500/5',
    iconColor: 'text-blue-600',
  },
  {
    icon: Users,
    title: 'Prática Supervisionada',
    desc: 'Formação com sessões práticas de terapia supervisionadas, garantindo preparo real ao profissional.',
    color: 'from-accent/20 to-accent/5',
    iconColor: 'text-accent',
  },
  {
    icon: BookOpen,
    title: 'Educação a Distância',
    desc: 'Acesso ao conteúdo em qualquer lugar, no seu tempo, com suporte de tutores e professores.',
    color: 'from-purple-500/20 to-purple-500/5',
    iconColor: 'text-purple-600',
  },
  {
    icon: CheckCircle,
    title: 'Autenticação de Certificados',
    desc: 'Todo certificado possui código único consultável publicamente para verificação de autenticidade.',
    color: 'from-orange-500/20 to-orange-500/5',
    iconColor: 'text-orange-600',
  },
];

const credentials = [
  { label: 'Psicoterapeuta Clínico', detail: 'Formação em Psicoterapia Clínica e Humanista' },
  { label: 'Psicanalista', detail: 'Graduado em Psicanálise — linha Freudiana e Lacaniana' },
  { label: 'Logoterapeuta', detail: 'Especialização em Logoterapia e Análise Existencial (Viktor Frankl)' },
  { label: 'Sexólogo Integrativo', detail: 'Certificação em Sexologia Integrativa' },
  { label: 'Registro AHDE nº 5593', detail: 'Associação de Hipnose e Desenvolvimento Emocional' },
  { label: 'Therapist University', detail: 'Membro registrado — reconhecimento internacional' },
];

export default function PublicLanding() {
  const [faqOpen, setFaqOpen] = useState(null);

  const faqs = [
    {
      q: 'Os certificados têm validade legal?',
      a: 'Sim. Nossos certificados têm validade em todo o território nacional, emitidos conforme a Lei nº 9.394/96 (Lei de Diretrizes e Bases da Educação Nacional) e o Decreto nº 5.154/04, que regulamenta a educação profissionalizante no Brasil.',
    },
    {
      q: 'A WR-EDU é uma instituição regularizada?',
      a: 'Sim. A WR-EDU é uma agência de formação profissionalizante registrada sob o CNPJ 62.213.790/0001-40 e associada à ABED — Associação Brasileira de Educação a Distância.',
    },
    {
      q: 'Como posso verificar a autenticidade de um certificado?',
      a: 'Cada certificado emitido pela WR-EDU possui um código único de autenticidade. Qualquer pessoa pode verificar a validade de um certificado acessando nossa página de verificação pública e informando o código.',
    },
    {
      q: 'Quais áreas de formação são oferecidas?',
      a: 'Oferecemos cursos nas áreas de Psicoterapia, Psicanálise, Logoterapia, Sexologia Integrativa, Constelação Familiar e outras práticas terapêuticas complementares.',
    },
  ];

  return (
    <div className="min-h-screen bg-white font-jakarta">
      {/* ─── NAV ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img src={WR_LOGO} alt="WR-EDU" className="h-9 w-9 object-contain" />
            <div>
              <span className="font-bold text-slate-800 text-base tracking-tight">WR-EDU</span>
              <p className="text-[9px] text-slate-400 leading-none tracking-widest uppercase">Instituto de Desenvolvimento Humano</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="#sobre" className="hover:text-primary transition-colors">Sobre Nós</a>
            <a href="#coordenador" className="hover:text-primary transition-colors">Coordenação</a>
            <a href="#certificados" className="hover:text-primary transition-colors">Certificados</a>
            <a href="#faq" className="hover:text-primary transition-colors">Dúvidas</a>
            <Link to="/certificate-verification" className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-semibold">
              <Search size={14} /> Verificar Certificado
            </Link>
          </div>
          <Link to="/login">
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20">
              Acessar Plataforma
            </Button>
          </Link>
        </div>
      </nav>

      {/* ─── HERO ────────────────────────────────────────────────── */}
      <section className="relative pt-16 bg-gradient-to-br from-slate-900 via-[#1a1f4e] to-[#0d1636] min-h-[100vh] flex items-center overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full filter blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent rounded-full filter blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 grid lg:grid-cols-2 gap-16 items-center">
          <div className="text-white">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-xs font-semibold text-white/80 mb-6 border border-white/10">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              CNPJ 62.213.790/0001-40 · Parceiros da ABED
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6">
              Formação
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                Profissionalizante
              </span>
              em Práticas
              <span className="block">Terapêuticas</span>
            </h1>

            <p className="text-lg text-white/70 leading-relaxed mb-8 max-w-lg">
              Desenvolva sua carreira terapêutica com uma formação reconhecida, certificada e com validade legal em todo o Brasil. Educação a distância de qualidade, com tutoria e prática real.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Link to="/login">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 text-base font-bold h-12 px-8 w-full sm:w-auto">
                  Acessar Minha Turma
                </Button>
              </Link>
              <Link to="/certificate-verification">
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 hover:border-white/40 h-12 px-6 w-full sm:w-auto gap-2">
                  <Search size={16} /> Verificar Certificado
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-white/60">
              {['Lei nº 9.394/96', 'Decreto nº 5.154/04', 'EAD Certificado', 'Prática Supervisionada'].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle size={13} className="text-green-400" /> {t}
                </span>
              ))}
            </div>
          </div>

          {/* ABED Seal */}
          <div className="flex flex-col items-center gap-8">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-10 backdrop-blur-sm text-center">
              <img src={ABED_LOGO_WHITE} alt="Somos Associados ABED" className="w-64 mx-auto object-contain" />
              <p className="text-white/50 text-xs mt-4 tracking-widest uppercase">Associação Brasileira de Educação a Distância</p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center w-full">
              {[
                { n: '100%', l: 'Online' },
                { n: 'EAD', l: 'Certificado' },
                { n: 'Legal', l: 'Validade' },
              ].map(item => (
                <div key={item.l} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-2xl font-black text-white">{item.n}</p>
                  <p className="text-xs text-white/50 mt-1">{item.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── SOBRE NÓS ───────────────────────────────────────────── */}
      <section id="sobre" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-widest text-primary uppercase">Sobre Nós</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-800 mt-2 mb-4">A WR-EDU em sua essência</h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg leading-relaxed">
              Somos uma agência de formação profissionalizante dedicada às práticas terapêuticas, com foco na excelência, ética e impacto social.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div className="space-y-5 text-slate-600 leading-relaxed">
              <p className="text-lg">
                A <strong className="text-slate-800">WR-EDU — Instituto de Desenvolvimento Humano</strong> surgiu da necessidade de democratizar o acesso à formação em práticas terapêuticas de qualidade no Brasil. Acreditamos que o cuidado emocional e psicológico é um direito humano fundamental.
              </p>
              <p>
                Nossa metodologia combina o rigor acadêmico com a prática supervisionada, preparando profissionais para atuar com segurança, ética e competência nas mais diversas abordagens terapêuticas.
              </p>
              <p>
                Somos associados à <strong className="text-slate-800">ABED — Associação Brasileira de Educação a Distância</strong>, garantindo que nossos cursos atendam aos mais altos padrões nacionais de qualidade em educação a distância.
              </p>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 mt-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Dados Institucionais</p>
                <div className="space-y-1.5 text-sm">
                  <p><span className="text-slate-400">Razão Social:</span> <strong>WR-EDU — Instituto de Desenvolvimento Humano</strong></p>
                  <p><span className="text-slate-400">CNPJ:</span> <strong>62.213.790/0001-40</strong></p>
                  <p><span className="text-slate-400">Modalidade:</span> <strong>Educação a Distância (EAD)</strong></p>
                  <p><span className="text-slate-400">Área:</span> <strong>Formação Profissionalizante em Práticas Terapêuticas</strong></p>
                  <p><span className="text-slate-400">Parceria:</span> <strong>ABED — Associação Brasileira de Educação a Distância</strong></p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {features.map(f => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className={`bg-gradient-to-r ${f.color} border border-slate-100 rounded-2xl p-5 flex gap-4`}>
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                      <Icon size={18} className={f.iconColor} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{f.title}</p>
                      <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── COORDENADOR ─────────────────────────────────────────── */}
      <section id="coordenador" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-widest text-primary uppercase">Coordenação Acadêmica</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-800 mt-2">Prof. William Ribeiro</h2>
            <p className="text-slate-500 mt-2">Coordenador Geral e Diretor Acadêmico da WR-EDU</p>
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <div className="bg-gradient-to-br from-[#1a1f4e] to-[#0d1636] rounded-3xl p-8 text-white mb-6">
                <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mb-5 border border-white/20">
                  <span className="text-3xl font-black text-white">WR</span>
                </div>
                <h3 className="text-xl font-black mb-1">Prof. William Ribeiro</h3>
                <p className="text-white/60 text-sm mb-4">Psicoterapeuta · Psicanalista · Logoterapeuta · Sexólogo Integrativo</p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-white/70">
                    <CheckCircle size={13} className="text-green-400 shrink-0" />
                    <span>Registro AHDE nº 5593</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70">
                    <CheckCircle size={13} className="text-green-400 shrink-0" />
                    <span>Membro registrado — Therapist University</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70">
                    <CheckCircle size={13} className="text-green-400 shrink-0" />
                    <span>Coordenador Geral — WR-EDU</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70">
                    <CheckCircle size={13} className="text-green-400 shrink-0" />
                    <span>Experiência em Tecnologia · Mercado Financeiro · UFPR</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm text-slate-600 leading-relaxed">
                <p className="font-bold text-slate-800 mb-2">Atuação Comunitária e Social</p>
                <p>Coordenador do <strong>Grupo Sinapse Coletiva</strong> e colaborador do projeto <strong>ADRA "Vida Digital"</strong>, levando educação e inclusão tecnológica a comunidades em situação de vulnerabilidade social.</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Credenciais e Certificações</p>
              {credentials.map((c, i) => (
                <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-start gap-3">
                  <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <Award size={13} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{c.label}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{c.detail}</p>
                  </div>
                </div>
              ))}

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-4">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">Experiência Profissional</p>
                <ul className="space-y-1 text-sm text-blue-600">
                  <li>· Área de Tecnologia e Sistemas de Informação</li>
                  <li>· Mercado Financeiro e Administrativo</li>
                  <li>· Parceria com a UFPR em projetos de Educação</li>
                  <li>· Educação Social através da ADRA Brasil</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CERTIFICADOS ────────────────────────────────────────── */}
      <section id="certificados" className="py-24 bg-gradient-to-br from-slate-900 via-[#1a1f4e] to-[#0d1636] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-widest text-accent uppercase">Certificação</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-2 mb-4">Certificados com Validade Legal</h2>
            <p className="text-white/60 max-w-2xl mx-auto text-lg">
              Nossos certificados têm validade em todo o Brasil, conforme a Lei nº 9.394/96 e o Decreto nº 5.154/04. Cada certificado possui um código único de autenticidade.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: Shield, title: 'Base Legal', desc: 'Amparados pela Lei nº 9.394/96 (LDB) e Decreto nº 5.154/04 — formação profissionalizante regularizada.' },
              { icon: Award, title: 'Assinatura Digital', desc: 'Cada certificado é assinado pelo Prof. William Ribeiro como Coordenador Geral da instituição.' },
              { icon: Search, title: 'Código de Autenticidade', desc: 'Código único e permanente, consultável por qualquer pessoa a qualquer momento, mesmo após desligamento do aluno.' },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Icon size={22} className="text-accent" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <Link to="/certificate-verification">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/30 gap-2 h-12 px-8 text-base font-bold">
                <Search size={18} /> Verificar Autenticidade de Certificado
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold tracking-widest text-primary uppercase">FAQ</span>
            <h2 className="text-3xl font-black text-slate-800 mt-2">Perguntas Frequentes</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full text-left flex items-center justify-between gap-4 p-5 font-semibold text-slate-800"
                >
                  {faq.q}
                  <ChevronDown size={18} className={`text-slate-400 shrink-0 transition-transform ${faqOpen === i ? 'rotate-180' : ''}`} />
                </button>
                {faqOpen === i && (
                  <div className="px-5 pb-5 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src={WR_LOGO} alt="WR-EDU" className="h-9 w-9 object-contain" />
                <div>
                  <p className="font-bold text-white">WR-EDU</p>
                  <p className="text-[10px] text-slate-400 tracking-widest uppercase">Instituto de Desenvolvimento Humano</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Agência de formação profissionalizante em práticas terapêuticas. CNPJ: 62.213.790/0001-40
              </p>
            </div>

            <div>
              <p className="font-bold text-sm uppercase tracking-wider mb-4 text-slate-300">Links</p>
              <div className="space-y-2 text-sm text-slate-400">
                <div><Link to="/login" className="hover:text-white transition-colors">Acessar Plataforma</Link></div>
                <div><Link to="/certificate-verification" className="hover:text-white transition-colors">Verificar Certificado</Link></div>
                <div><Link to="/terms" className="hover:text-white transition-colors">Termos de Serviço</Link></div>
                <div><Link to="/privacy" className="hover:text-white transition-colors">Política de Privacidade</Link></div>
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end gap-4">
              <img src={ABED_LOGO_WHITE} alt="ABED" className="w-40 object-contain opacity-80" />
              <p className="text-xs text-slate-500 text-right leading-relaxed max-w-xs">
                Certificados válidos em todo o Brasil conforme Lei nº 9.394/96 e Decreto nº 5.154/04.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} WR-EDU — Instituto de Desenvolvimento Humano. Todos os direitos reservados.</p>
            <p>CNPJ: 62.213.790/0001-40 · Parceiros da ABED</p>
          </div>
        </div>
      </footer>
    </div>
  );
}