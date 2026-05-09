import React, { useState, useEffect } from 'react';
import {
  Code2, Smartphone, Globe, Zap, Shield, BarChart3, ArrowRight,
  CheckCircle, Star, Mail, MessageSquare, ChevronRight,
  Layers, Database, Cloud, Cpu, TrendingUp,
  ExternalLink, Menu, X, Play, Sparkles, Palette
} from 'lucide-react';

const SERVICES = [
  { icon: Globe, color: '#5b5ef4', title: 'Plataformas Web', desc: 'Desenvolvemos plataformas web sob medida, escaláveis e de alto desempenho. Do MVP ao produto final, com tecnologia de ponta.' },
  { icon: Smartphone, color: '#1db89e', title: 'Apps Mobile', desc: 'Aplicativos nativos e híbridos para iOS e Android. Experiências fluidas que encantam seus usuários e impulsionam seu negócio.' },
  { icon: Database, color: '#a855f7', title: 'Sistemas e APIs', desc: 'Integrações robustas, APIs RESTful e sistemas internos que automatizam processos e conectam o seu ecossistema digital.' },
  { icon: Palette, color: '#f4a23d', title: 'Design UI/UX', desc: 'Interfaces que convertem. Design estratégico focado em experiência do usuário, identidade visual e arquitetura de informação.' },
  { icon: Cloud, color: '#1db89e', title: 'Cloud e Infraestrutura', desc: 'Hospedagem, configuração de servidores, CI/CD e escalabilidade automatizada para que seu produto esteja sempre no ar.' },
  { icon: BarChart3, color: '#5b5ef4', title: 'Analytics e IA', desc: 'Dashboards inteligentes, integração com IA e análise de dados que transformam números em decisões estratégicas.' },
];

const PROCESS = [
  { num: '01', title: 'Briefing', desc: 'Entendemos sua necessidade, seu público e seus objetivos de negócio.' },
  { num: '02', title: 'Proposta', desc: 'Elaboramos um escopo técnico claro, com cronograma e investimento definidos.' },
  { num: '03', title: 'Desenvolvimento', desc: 'Sprints ágeis com entregas parciais e validações contínuas.' },
  { num: '04', title: 'Entrega e Suporte', desc: 'Deploy completo, treinamento da equipe e suporte pós-lançamento.' },
];

const DIFFERENTIALS = [
  'Código limpo e documentado',
  'Entregas dentro do prazo',
  'Comunicação transparente',
  'Suporte pós-entrega incluso',
  'Foco em performance e segurança',
  'Tecnologias modernas e escaláveis',
];

const TESTIMONIALS = [
  { name: 'Ricardo A.', role: 'CEO · Startup Fintech', text: 'A WR-TEC entregou nossa plataforma no prazo e superou todas as expectativas técnicas. Suporte impecável.', stars: 5 },
  { name: 'Camila F.', role: 'Diretora · Escola EAD', text: 'Migramos nosso sistema legado com zero downtime. Profissionalismo acima da média.', stars: 5 },
  { name: 'Marcos T.', role: 'Fundador · SaaS B2B', text: 'MVP entregue em 6 semanas. A equipe da WR-TEC é excepcional em agilidade e qualidade.', stars: 5 },
];

const TECHS = ['React', 'Node.js', 'TypeScript', 'Python', 'PostgreSQL', 'AWS', 'Docker', 'Next.js', 'React Native', 'Supabase'];

export default function WRTec() {
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '', service: '' });
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleContact = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-[#060810] text-white overflow-x-hidden">

      {/* NAVBAR */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navScrolled ? 'bg-[#060810]/95 backdrop-blur-xl border-b border-white/8 py-3 shadow-xl' : 'py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5b5ef4] to-[#1db89e] flex items-center justify-center">
              <Code2 size={18} className="text-white" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight">WR-TEC</span>
              <span className="text-[#5b5ef4] text-xs font-bold ml-1">®</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/50">
            {[['Serviços', '#servicos'], ['Processo', '#processo'], ['Tecnologias', '#tecnologias'], ['Contato', '#contato']].map(([l, h]) => (
              <a key={l} href={h} className="hover:text-white transition-colors">{l}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <a href="#contato" className="hidden md:flex items-center gap-1.5 bg-gradient-to-r from-[#5b5ef4] to-[#1db89e] text-white text-sm font-bold px-5 py-2 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[#5b5ef4]/30">
              Solicitar Proposta <ChevronRight size={14} />
            </a>
            <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden text-white/60 hover:text-white">
              {mobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {mobileMenu && (
          <div className="md:hidden bg-[#0a0d1a] border-t border-white/8 px-6 py-4 space-y-3">
            {[['Serviços', '#servicos'], ['Processo', '#processo'], ['Tecnologias', '#tecnologias'], ['Contato', '#contato']].map(([l, h]) => (
              <a key={l} href={h} onClick={() => setMobileMenu(false)} className="block text-white/60 hover:text-white py-2 text-sm">{l}</a>
            ))}
            <a href="#contato" onClick={() => setMobileMenu(false)} className="block w-full text-center bg-gradient-to-r from-[#5b5ef4] to-[#1db89e] text-white font-bold py-3 rounded-xl text-sm">
              Solicitar Proposta
            </a>
          </div>
        )}
      </nav>

      {/* HERO */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'linear-gradient(rgba(91,94,244,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(91,94,244,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#060810]/50 to-[#060810]" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-[#5b5ef4]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-[#1db89e]/15 rounded-full blur-3xl" />

        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#5b5ef4]/10 border border-[#5b5ef4]/25 rounded-full px-5 py-2 mb-8">
            <Sparkles size={13} className="text-[#5b5ef4]" />
            <span className="text-xs font-bold text-[#5b5ef4] uppercase tracking-widest">Tecnologia que transforma negócios</span>
          </div>
          <h1 className="text-5xl lg:text-8xl font-black leading-[0.9] mb-8 tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5b5ef4] via-[#a855f7] to-[#1db89e]">
              Construímos
            </span>
            <span className="block text-white mt-2">o digital do</span>
            <span className="block text-white">seu negócio.</span>
          </h1>
          <p className="text-white/55 text-lg lg:text-xl leading-relaxed max-w-2xl mx-auto mb-12">
            Plataformas web, apps mobile, sistemas customizados e integrações que escalam. Da ideia ao produto, com excelência técnica e entrega garantida.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#contato" className="inline-flex items-center gap-2 bg-gradient-to-r from-[#5b5ef4] to-[#1db89e] text-white font-black px-8 py-4 rounded-2xl shadow-2xl shadow-[#5b5ef4]/30 hover:opacity-90 transition-all text-base">
              Solicitar Proposta Grátis <ArrowRight size={18} />
            </a>
            <a href="#servicos" className="inline-flex items-center gap-2 bg-white/8 border border-white/15 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/12 transition-all text-base">
              <Play size={14} className="fill-current" /> Ver nossos serviços
            </a>
          </div>
          <div className="grid grid-cols-3 gap-8 mt-20 max-w-md mx-auto">
            {[{ v: '50+', l: 'Projetos entregues' }, { v: '100%', l: 'No prazo' }, { v: '5★', l: 'Avaliação média' }].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#5b5ef4] to-[#1db89e]">{s.v}</p>
                <p className="text-white/35 text-xs mt-1">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SERVIÇOS */}
      <section id="servicos" className="py-28 px-6 lg:px-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[#1db89e]/10 border border-[#1db89e]/20 rounded-full px-4 py-1.5 mb-4">
              <Layers size={13} className="text-[#1db89e]" />
              <span className="text-xs font-bold text-[#1db89e] uppercase tracking-widest">O que fazemos</span>
            </div>
            <h2 className="text-4xl font-black text-white">Nossos Serviços</h2>
            <p className="text-white/45 mt-3 max-w-lg mx-auto">Soluções completas de tecnologia para empresas que querem crescer com solidez digital.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICES.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="bg-[#0d1120] border border-white/8 rounded-3xl p-7 hover:border-white/20 hover:shadow-xl transition-all">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: s.color + '20', border: `1px solid ${s.color}30` }}>
                    <Icon size={20} style={{ color: s.color }} />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{s.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PROCESSO */}
      <section id="processo" className="py-28 px-6 lg:px-20 bg-[#0a0d1a]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[#5b5ef4]/10 border border-[#5b5ef4]/20 rounded-full px-4 py-1.5 mb-4">
              <TrendingUp size={13} className="text-[#5b5ef4]" />
              <span className="text-xs font-bold text-[#5b5ef4] uppercase tracking-widest">Como trabalhamos</span>
            </div>
            <h2 className="text-4xl font-black text-white">Processo Transparente</h2>
            <p className="text-white/45 mt-3 max-w-lg mx-auto">Do primeiro contato à entrega final, você sabe exatamente o que esperar em cada etapa.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROCESS.map((p, i) => (
              <div key={i} className="relative bg-[#0d1120] border border-white/8 rounded-3xl p-6 text-center hover:border-[#5b5ef4]/30 transition-all">
                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#5b5ef4]/40 to-[#1db89e]/40 mb-4">{p.num}</div>
                <h3 className="text-white font-bold text-base mb-2">{p.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{p.desc}</p>
                {i < PROCESS.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 text-white/20">
                    <ChevronRight size={20} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DIFERENCIAIS */}
      <section className="py-20 px-6 lg:px-20">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-[#5b5ef4]/10 via-white/3 to-[#1db89e]/10 border border-white/10 rounded-3xl p-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="text-3xl font-black text-white mb-4">Por que escolher a WR-TEC?</h2>
                <p className="text-white/50 text-sm leading-relaxed">
                  Somos uma empresa de desenvolvimento focada em resultado. Não entregamos apenas código — entregamos soluções que funcionam, escalam e geram valor real para o seu negócio.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DIFFERENTIALS.map((d, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm text-white/65">
                    <CheckCircle size={15} className="text-[#1db89e] shrink-0" />
                    {d}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TECNOLOGIAS */}
      <section id="tecnologias" className="py-20 px-6 lg:px-20 bg-[#0a0d1a]">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#a855f7]/10 border border-[#a855f7]/20 rounded-full px-4 py-1.5 mb-4">
            <Cpu size={13} className="text-[#a855f7]" />
            <span className="text-xs font-bold text-[#a855f7] uppercase tracking-widest">Stack tecnológico</span>
          </div>
          <h2 className="text-3xl font-black text-white mb-3">Tecnologias que dominamos</h2>
          <p className="text-white/40 text-sm mb-12 max-w-md mx-auto">Utilizamos as ferramentas mais modernas e consolidadas do mercado para garantir qualidade e longevidade do seu produto.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {TECHS.map((t, i) => (
              <span key={i} className="bg-[#0d1120] border border-white/10 text-white/60 text-sm font-semibold px-5 py-2.5 rounded-xl hover:border-[#5b5ef4]/40 hover:text-white transition-all">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="py-24 px-6 lg:px-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-white mb-2">O que dizem nossos clientes</h2>
            <p className="text-white/40 text-sm">Resultados reais de quem confiou na WR-TEC.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-[#0d1120] border border-white/8 rounded-2xl p-6 hover:border-[#5b5ef4]/20 transition-all">
                <div className="flex gap-0.5 mb-4">{Array.from({ length: t.stars }).map((_, j) => <Star key={j} size={12} className="text-yellow-400 fill-yellow-400" />)}</div>
                <p className="text-white/65 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div>
                  <p className="text-white text-sm font-bold">{t.name}</p>
                  <p className="text-white/35 text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTATO */}
      <section id="contato" className="py-28 px-6 lg:px-20 bg-[#0a0d1a]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[#5b5ef4]/10 border border-[#5b5ef4]/20 rounded-full px-4 py-1.5 mb-4">
              <MessageSquare size={13} className="text-[#5b5ef4]" />
              <span className="text-xs font-bold text-[#5b5ef4] uppercase tracking-widest">Fale conosco</span>
            </div>
            <h2 className="text-4xl font-black text-white">Vamos construir juntos?</h2>
            <p className="text-white/45 mt-3 max-w-lg mx-auto">Envie sua ideia. Nossa equipe analisa e retorna com uma proposta em até 24h úteis.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 space-y-5">
              {[
                { icon: Mail, label: 'E-mail', value: 'contato@wr-tec.com.br' },
                { icon: MessageSquare, label: 'WhatsApp', value: '+55 (41) 9 0000-0000' },
              ].map((c, i) => {
                const Icon = c.icon;
                return (
                  <div key={i} className="flex items-start gap-4 bg-[#0d1120] border border-white/8 rounded-2xl p-5">
                    <div className="w-10 h-10 rounded-xl bg-[#5b5ef4]/15 border border-[#5b5ef4]/25 flex items-center justify-center shrink-0">
                      <Icon size={16} className="text-[#5b5ef4]" />
                    </div>
                    <div>
                      <p className="text-white/40 text-xs mb-0.5">{c.label}</p>
                      <p className="text-white text-sm font-semibold">{c.value}</p>
                    </div>
                  </div>
                );
              })}
              <div className="bg-gradient-to-br from-[#5b5ef4]/15 to-[#1db89e]/10 border border-white/10 rounded-2xl p-5">
                <p className="text-white font-bold text-sm mb-1">Resposta rápida</p>
                <p className="text-white/50 text-xs leading-relaxed">Respondemos todas as propostas em até 24 horas úteis com uma análise técnica inicial sem compromisso.</p>
              </div>
            </div>

            <div className="lg:col-span-3 bg-[#0d1120] border border-white/10 rounded-3xl p-7">
              {sent ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-10 gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#1db89e]/15 border border-[#1db89e]/30 flex items-center justify-center">
                    <CheckCircle size={28} className="text-[#1db89e]" />
                  </div>
                  <h3 className="text-white font-black text-xl">Mensagem enviada!</h3>
                  <p className="text-white/50 text-sm max-w-xs">Nossa equipe irá analisar seu projeto e retornar em até 24 horas úteis.</p>
                  <button onClick={() => setSent(false)} className="text-[#5b5ef4] text-sm font-semibold hover:underline">Enviar outra mensagem</button>
                </div>
              ) : (
                <form onSubmit={handleContact} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-white/40 text-xs mb-1.5 block">Seu nome</label>
                      <input
                        required
                        placeholder="João Silva"
                        value={contactForm.name}
                        onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-xl px-4 h-11 text-sm focus:outline-none focus:border-[#5b5ef4]/50"
                      />
                    </div>
                    <div>
                      <label className="text-white/40 text-xs mb-1.5 block">E-mail</label>
                      <input
                        required
                        type="email"
                        placeholder="joao@empresa.com"
                        value={contactForm.email}
                        onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-xl px-4 h-11 text-sm focus:outline-none focus:border-[#5b5ef4]/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-white/40 text-xs mb-1.5 block">Tipo de projeto</label>
                    <select
                      value={contactForm.service}
                      onChange={e => setContactForm(p => ({ ...p, service: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 h-11 text-sm focus:outline-none focus:border-[#5b5ef4]/50"
                    >
                      <option value="" disabled>Selecione o serviço</option>
                      <option value="web">Plataforma Web</option>
                      <option value="app">App Mobile</option>
                      <option value="sistema">Sistema / API</option>
                      <option value="design">Design UI/UX</option>
                      <option value="cloud">Cloud / Infraestrutura</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-white/40 text-xs mb-1.5 block">Descreva seu projeto</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Conte-nos sobre sua ideia, necessidade ou problema a resolver..."
                      value={contactForm.message}
                      onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#5b5ef4]/50 resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-[#5b5ef4] to-[#1db89e] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-[#5b5ef4]/25"
                  >
                    Enviar Proposta <ArrowRight size={16} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/8 py-10 px-6 lg:px-20 bg-[#060810]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5b5ef4] to-[#1db89e] flex items-center justify-center">
              <Code2 size={15} className="text-white" />
            </div>
            <div>
              <p className="text-white font-black text-sm">WR-TEC®</p>
              <p className="text-white/30 text-xs">Tecnologia e Desenvolvimento</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-white/30 text-xs">
            <a href="/" className="hover:text-white/60 transition-colors flex items-center gap-1.5">
              <ExternalLink size={11} /> WR-EDU
            </a>
            <span>·</span>
            <p>WR-TEC® © 2026 — Todos os direitos reservados</p>
          </div>
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/8 rounded-full px-3 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1db89e] animate-pulse" />
            <span className="text-white/30 text-[10px] font-mono font-semibold tracking-widest">V-001-00</span>
          </div>
        </div>
      </footer>
    </div>
  );
}