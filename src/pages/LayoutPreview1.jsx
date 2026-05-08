import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap, Lock, Key, Sparkles, Users, BookOpen, Video, Heart,
  Star, ChevronRight, Shield, Zap, Award, CheckCircle, ExternalLink,
  ArrowDown, Quote
} from 'lucide-react';

const LOGO_URL = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/077216e46_textodoseupargrafoWR_20251219_192959_0000.png';

const HERO_IMAGES = [
  'https://media.base44.com/images/public/69f55577840a3c93cee191be/056bf6bba_176702773849222.jpg',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1400&q=85',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1400&q=85',
  'https://images.unsplash.com/photo-1609234656388-0ff363383899?w=1400&q=85',
];

const FEATURES = [
  { icon: BookOpen, title: 'Videoaulas Gravadas', desc: 'Conteúdo terapêutico exclusivo e organizado' },
  { icon: Video, title: 'Lives ao Vivo', desc: 'Práticas e mentorias em tempo real' },
  { icon: Users, title: 'Comunidade Ativa', desc: 'Fórum de dúvidas e troca entre alunos' },
  { icon: Heart, title: 'Prática Real', desc: 'Experiência terapêutica ao longo do curso' },
];

const CERTS = [
  { title: 'Pós-Graduação em Psicoterapia Integrativa', institution: 'Universidade Estácio de Sá', year: '2018' },
  { title: 'Certificação em Terapia Cognitivo-Comportamental', institution: 'Instituto Beck Brasil', year: '2019' },
  { title: 'Formação em Hipnoterapia Clínica', institution: 'Academia Brasileira de Hipnose', year: '2020' },
  { title: 'Especialização em Neurociência Aplicada', institution: 'PUC-Rio', year: '2021' },
  { title: 'Certificação Internacional em Coaching', institution: 'ICF — International Coaching Federation', year: '2022' },
];

const COURSES = [
  {
    title: 'Formação de Terapeutas',
    desc: 'Formação completa e profissionalizante com prática real desde o início.',
    price: 'R$ 1.497',
    tag: 'Mais Vendido',
    color: '#5b5ef4',
    img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80',
  },
  {
    title: 'Mentoria Avançada em TCC',
    desc: 'Aprofundamento em Terapia Cognitivo-Comportamental com supervisão.',
    price: 'R$ 897',
    tag: 'Novo',
    color: '#1db89e',
    img: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80',
  },
];

const TESTIMONIALS = [
  { name: 'Ana Paula M.', text: 'A formação mais completa que já fiz. O diferencial da prática desde o início foi transformador para mim.', stars: 5 },
  { name: 'Carlos Eduardo S.', text: 'O Professor William tem uma didática incrível. Aprendi mais aqui do que em anos de graduação.', stars: 5 },
  { name: 'Fernanda R.', text: 'Plataforma excelente, suporte impecável e conteúdo de altíssimo nível. Super recomendo!', stars: 5 },
];

export default function LayoutPreview1() {
  const [heroImg, setHeroImg] = useState(0);
  const [mode, setMode] = useState('code');

  useEffect(() => {
    const interval = setInterval(() => setHeroImg(i => (i + 1) % HERO_IMAGES.length), 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#080b14] text-white">
      {/* PREVIEW BADGE */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3">
        <div className="bg-yellow-400/90 text-black text-xs font-black px-4 py-1.5 rounded-full shadow-lg tracking-wide uppercase">
          📐 Modelo 1 — Vitrine Lateral
        </div>
        <Link to="/preview2" className="bg-white/10 border border-white/20 text-white text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-white/20 transition-all">
          Ver Modelo 2 →
        </Link>
      </div>

      {/* HERO SECTION */}
      <div className="relative min-h-screen flex flex-col lg:flex-row">
        {/* Left — Hero Imagery */}
        <div className="relative flex-[7] overflow-hidden min-h-[55vh] lg:min-h-screen">
          {HERO_IMAGES.map((src, i) => (
            <div key={src} className={`absolute inset-0 transition-opacity duration-1500 ${i === heroImg ? 'opacity-100' : 'opacity-0'}`}>
              <img src={src} alt="" className="w-full h-full object-cover object-center" />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-[#080b14]/95 via-[#080b14]/60 to-[#080b14]/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080b14] via-transparent to-[#080b14]/30" />

          <div className="relative z-10 flex flex-col justify-between h-full p-8 lg:p-14">
            <div className="flex items-center gap-3">
              <img src={LOGO_URL} alt="WR" className="w-10 h-10 object-contain" />
              <div>
                <span className="text-xl font-bold tracking-tight">WR-EDU</span>
                <p className="text-[10px] text-white/40 -mt-0.5 tracking-widest uppercase">Portal Educacional</p>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-1.5 mb-6">
                <Sparkles size={12} className="text-yellow-400" />
                <span className="text-xs font-semibold text-white/80">Escola de Formação de Terapeutas</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold leading-[1.1] mb-5 max-w-lg">
                Transforme vidas
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#5b5ef4] to-[#1db89e]">
                  através da cura.
                </span>
              </h1>
              <p className="text-white/60 text-lg leading-relaxed max-w-md mb-8">
                Uma formação completa em terapia, com o diferencial da prática terapêutica ao longo de toda a jornada.
              </p>
              <div className="grid grid-cols-2 gap-3 max-w-sm mb-8">
                {FEATURES.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl p-3.5">
                    <Icon size={16} className="text-[#1db89e] mb-2" />
                    <p className="font-semibold text-sm">{title}</p>
                    <p className="text-white/50 text-xs mt-0.5">{desc}</p>
                  </div>
                ))}
              </div>
              <a href="#cursos" className="inline-flex items-center gap-2 bg-gradient-to-r from-[#5b5ef4] to-[#1db89e] text-white font-semibold px-6 py-3 rounded-2xl shadow-lg shadow-[#5b5ef4]/30 hover:opacity-90 transition-all text-sm">
                Ver Nossos Cursos <ArrowDown size={15} />
              </a>
            </div>

            <div className="hidden lg:flex gap-2">
              {HERO_IMAGES.map((_, i) => (
                <button key={i} onClick={() => setHeroImg(i)}
                  className={`h-1 rounded-full transition-all ${i === heroImg ? 'bg-[#5b5ef4] w-10' : 'bg-white/20 w-5'}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Right — Access Panel */}
        <div className="w-full lg:w-[400px] bg-[#0d1120] border-l border-white/8 flex flex-col justify-center p-7 lg:p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#5b5ef4]/12 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#1db89e]/10 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/2" />

          <div className="flex flex-col items-center lg:hidden mb-6">
            <img src={LOGO_URL} alt="WR" className="w-14 h-14 object-contain mb-2" />
            <h1 className="text-xl font-bold">WR-EDU</h1>
            <p className="text-white/35 text-xs mt-1 tracking-widest uppercase">Escola de Terapeutas</p>
          </div>

          {/* CTA de compra */}
          <div className="bg-gradient-to-br from-[#1db89e]/15 to-[#5b5ef4]/10 border border-[#1db89e]/25 rounded-2xl p-5 mb-6">
            <p className="text-[11px] font-bold text-[#1db89e] uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <Sparkles size={11} /> Vagas Abertas
            </p>
            <p className="font-bold text-white text-base leading-tight mb-3">Formação de Terapeutas — Turma 2026</p>
            <p className="text-white/50 text-xs mb-4 leading-relaxed">Processo seletivo aberto. Garanta sua vaga antes que esgote!</p>
            <button className="w-full py-3 bg-gradient-to-r from-[#1db89e] to-[#5b5ef4] text-white font-bold text-sm rounded-xl hover:opacity-90 transition-all">
              Quero Me Inscrever
            </button>
          </div>

          {/* Login */}
          <div className="mb-2">
            <div className="inline-flex items-center gap-2 bg-[#5b5ef4]/15 border border-[#5b5ef4]/25 rounded-full px-3 py-1 mb-4">
              <Zap size={11} className="text-[#7c5ef4]" />
              <span className="text-[11px] font-semibold text-[#a09ef4] tracking-wide">Acesso para Alunos</span>
            </div>
            <div className="flex gap-1.5 bg-white/4 rounded-2xl p-1.5 mb-4 border border-white/8">
              {['code', 'admin'].map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${mode === m ? 'bg-gradient-to-br from-[#5b5ef4] to-[#7c3aed] text-white shadow-lg' : 'text-white/35 hover:text-white/65'}`}>
                  {m === 'code' ? <><Key size={12} /> Código</> : <><Shield size={12} /> Admin</>}
                </button>
              ))}
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              {mode === 'code' ? (
                <div className="space-y-4">
                  <input placeholder="EDU-XXXX-XXXX" className="w-full bg-white/6 border border-white/10 text-white placeholder:text-white/20 h-12 text-center text-lg tracking-widest font-mono rounded-xl px-3 focus:outline-none focus:border-[#5b5ef4]/60" />
                  <button className="w-full h-11 bg-gradient-to-r from-[#5b5ef4] to-[#1db89e] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2">
                    Entrar na Plataforma <ChevronRight size={15} />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <input placeholder="seu@email.com" className="w-full bg-white/6 border border-white/10 text-white placeholder:text-white/20 h-10 rounded-xl px-3 text-sm focus:outline-none" />
                  <input type="password" placeholder="••••••••" className="w-full bg-white/6 border border-white/10 text-white placeholder:text-white/20 h-10 rounded-xl px-3 text-sm focus:outline-none" />
                  <button className="w-full h-10 bg-gradient-to-r from-[#5b5ef4] to-[#1db89e] text-white font-bold text-sm rounded-xl">Entrar como Admin</button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-white/8 flex flex-wrap gap-3 justify-center">
            {['Política de Trabalho', 'Termos de Uso', 'Contato'].map(l => (
              <a key={l} href="#" className="text-white/30 text-[11px] hover:text-white/60 transition-colors">{l}</a>
            ))}
          </div>
          <p className="text-center text-white/15 text-[10px] mt-3">WR-EDU © 2026 · Escola de Terapeutas</p>
        </div>
      </div>

      {/* SOBRE O PROFESSOR */}
      <section className="py-24 px-6 lg:px-20 bg-[#080b14]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-16 items-start">
            <div className="lg:w-80 shrink-0">
              <div className="relative">
                <div className="w-full rounded-3xl overflow-hidden aspect-[3/4] bg-gradient-to-br from-[#5b5ef4]/20 to-[#1db89e]/10 flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#5b5ef4] to-[#1db89e] mx-auto mb-4 flex items-center justify-center">
                      <span className="text-4xl font-black text-white">WR</span>
                    </div>
                    <p className="text-white/60 text-sm">Prof. William Ribeiro</p>
                  </div>
                </div>
                <div className="absolute inset-0 rounded-3xl ring-2 ring-[#5b5ef4]/30" />
                <div className="absolute -bottom-4 -right-4 bg-gradient-to-br from-[#5b5ef4] to-[#1db89e] rounded-2xl p-4 shadow-xl">
                  <p className="text-white font-black text-xl leading-none">15+</p>
                  <p className="text-white/70 text-[10px] uppercase tracking-wide">Anos de exp.</p>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-[#5b5ef4]/10 border border-[#5b5ef4]/20 rounded-full px-4 py-1.5 mb-6">
                <Award size={13} className="text-[#5b5ef4]" />
                <span className="text-xs font-bold text-[#5b5ef4] uppercase tracking-widest">Sobre o Professor</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-black text-white mb-2 leading-tight">
                Prof. William Ribeiro
              </h2>
              <p className="text-transparent bg-clip-text bg-gradient-to-r from-[#5b5ef4] to-[#1db89e] text-xl font-bold mb-6">
                Terapeuta e Educador
              </p>
              <p className="text-white/60 text-base leading-relaxed mb-8 max-w-xl">
                Com mais de 15 anos de experiência clínica e formação continuada nas principais escolas de psicoterapia do Brasil e do mundo, o Professor William Ribeiro dedica sua carreira à formação de terapeutas completos, éticos e altamente qualificados.
              </p>
              <div className="space-y-3">
                <p className="text-xs font-black text-white/40 uppercase tracking-widest mb-4">Certificações Verificáveis</p>
                {CERTS.map((c, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white/4 border border-white/8 rounded-xl p-4 hover:border-[#5b5ef4]/30 hover:bg-white/6 transition-all group cursor-pointer">
                    <CheckCircle size={15} className="text-[#1db89e] mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm">{c.title}</p>
                      <p className="text-white/40 text-xs mt-0.5">{c.institution} · {c.year}</p>
                    </div>
                    <ExternalLink size={13} className="text-white/20 group-hover:text-[#5b5ef4] transition-colors shrink-0 mt-0.5" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NOSSOS CURSOS */}
      <section id="cursos" className="py-24 px-6 lg:px-20 bg-[#0a0d1a]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-[#1db89e]/10 border border-[#1db89e]/20 rounded-full px-4 py-1.5 mb-4">
              <GraduationCap size={13} className="text-[#1db89e]" />
              <span className="text-xs font-bold text-[#1db89e] uppercase tracking-widest">Formações</span>
            </div>
            <h2 className="text-4xl font-black text-white">Nossos Cursos Profissionalizantes</h2>
            <p className="text-white/50 mt-3 max-w-lg mx-auto">Formações reconhecidas com certificado digital verificável emitido pelo WR-EDU.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {COURSES.map((c, i) => (
              <div key={i} className="bg-[#0d1120] border border-white/10 rounded-3xl overflow-hidden hover:border-[#5b5ef4]/40 hover:shadow-xl hover:shadow-[#5b5ef4]/10 transition-all group">
                <div className="relative h-44 overflow-hidden">
                  <img src={c.img} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d1120] to-transparent" />
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-black text-white" style={{ backgroundColor: c.color }}>
                    {c.tag}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-black text-white text-lg mb-2">{c.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed mb-5">{c.desc}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-black text-white">{c.price}</p>
                    <button className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90" style={{ background: `linear-gradient(135deg, ${c.color}, #1db89e)` }}>
                      Quero Esse Curso
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="py-20 px-6 lg:px-20 bg-[#080b14]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-white mb-2">O que dizem nossos alunos</h2>
            <p className="text-white/40 text-sm">Mais de 500 terapeutas formados e transformados</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-[#0d1120] border border-white/8 rounded-2xl p-6">
                <Quote size={20} className="text-[#5b5ef4]/40 mb-3" />
                <p className="text-white/70 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5b5ef4] to-[#1db89e] flex items-center justify-center text-xs font-black">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-white text-xs font-bold">{t.name}</p>
                    <div className="flex gap-0.5">{Array.from({ length: t.stars }).map((_, j) => <Star key={j} size={9} className="text-yellow-400 fill-yellow-400" />)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/8 py-10 px-6 lg:px-20 bg-[#080b14]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="WR" className="w-8 h-8 object-contain" />
            <div>
              <p className="text-white font-bold text-sm">WR-EDU</p>
              <p className="text-white/30 text-xs">Escola de Formação de Terapeutas</p>
            </div>
          </div>
          <div className="flex gap-6 text-white/30 text-xs">
            {['Política de Trabalho', 'Termos de Uso', 'Privacidade', 'Contato'].map(l => (
              <a key={l} href="#" className="hover:text-white/70 transition-colors">{l}</a>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-white/20 text-xs">
            <Star size={9} className="fill-current" />
            <span>WR-EDU © 2026</span>
            <Star size={9} className="fill-current" />
          </div>
        </div>
      </footer>
    </div>
  );
}