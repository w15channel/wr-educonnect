import React, { useState, useEffect } from 'react';
import { BookOpen, Video, Users, Heart, Sparkles, ChevronRight, Key, Shield, Award, ExternalLink, ArrowDown, X, Menu, ChevronDown } from 'lucide-react';

const LOGO_URL = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/077216e46_textodoseupargrafoWR_20251219_192959_0000.png';

const HERO_IMAGES = [
  'https://media.base44.com/images/public/69f55577840a3c93cee191be/056bf6bba_176702773849222.jpg',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1400',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1400',
  'https://images.unsplash.com/photo-1609234656388-0ff363383899?w=1400',
];

const FEATURES = [
  { icon: BookOpen, title: 'Videoaulas', desc: 'Conteúdo terapêutico exclusivo em vídeo' },
  { icon: Video, title: 'Lives ao Vivo', desc: 'Práticas e mentorias em tempo real' },
  { icon: Users, title: 'Comunidade', desc: 'Fórum de dúvidas e troca entre alunos' },
  { icon: Heart, title: 'Prática Clínica', desc: 'Experiência terapêutica ao longo do curso' },
];

const CERTS = [
  { title: 'AHDE', desc: 'Associação de Hipnose e Desenvolvimento Emocional' },
  { title: 'ABED', desc: 'Associação Brasileira de Educação a Distância' },
  { title: 'CFP', desc: 'Conselho Federal de Psicologia — Formação Complementar' },
  { title: 'ICF', desc: 'International Coach Federation — Membro Internacional' },
];

const COURSES = [
  {
    title: 'Formação de Terapeutas',
    desc: 'Curso profissionalizante completo em Terapia Holística. Prática real ao longo de toda a jornada.',
    price: 'R$ 1.497',
    tag: 'Mais Popular',
    img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600',
    color: '#5b5ef4',
  },
  {
    title: 'Hipnoterapia Clínica',
    desc: 'Formação profissional em hipnoterapia com fundamentação científica e técnicas avançadas.',
    price: 'R$ 997',
    tag: 'Novidade',
    img: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600',
    color: '#1db89e',
  },
];

// Paleta Modelo 2: Âmbar / Ouro + Azul Profundo (premium, quente, confiável)
const C = {
  bg: '#06080f',
  bgAlt: '#0b0f1c',
  gold: '#c9a84c',
  goldLight: '#e5c97a',
  blue: '#1a2a6e',
  blueLight: '#3b4faf',
  text: '#f0ede5',
  muted: 'rgba(240,237,229,0.5)',
  border: 'rgba(201,168,76,0.15)',
  borderLight: 'rgba(240,237,229,0.07)',
};

export default function LayoutPreview2() {
  const [heroImg, setHeroImg] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const [loginMode, setLoginMode] = useState('code');
  const [code, setCode] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setHeroImg(i => (i + 1) % HERO_IMAGES.length), 6000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const profImg = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600';

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: "'Plus Jakarta Sans', sans-serif", minHeight: '100vh' }}>

      {/* Badge */}
      <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 60, background: C.gold, color: '#06080f', borderRadius: 99, padding: '6px 20px', fontSize: 11, fontWeight: 700, letterSpacing: 1, whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(201,168,76,0.5)' }}>
        MODELO 2 — Experiência Imersiva com Navegação Fixa
      </div>

      {/* ══ NAV FIXA ══ */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40, transition: 'all 0.3s', background: scrolled ? 'rgba(6,8,15,0.97)' : 'transparent', borderBottom: scrolled ? `1px solid ${C.border}` : '1px solid transparent', backdropFilter: scrolled ? 'blur(20px)' : 'none', padding: '0 40px', display: 'flex', alignItems: 'center', height: 68 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <img src={LOGO_URL} alt="WR" style={{ width: 36, height: 36, objectFit: 'contain' }} />
          <span style={{ fontWeight: 700, fontSize: 17, color: C.text }}>WR-EDU</span>
        </div>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          {['Sobre', 'Professor', 'Cursos', 'Contato'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} style={{ fontSize: 13, fontWeight: 600, color: C.muted, textDecoration: 'none', transition: 'color 0.2s' }}>{item}</a>
          ))}
          <button
            onClick={() => setShowLogin(true)}
            style={{ padding: '8px 20px', borderRadius: 10, fontWeight: 700, fontSize: 13, background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight})`, color: '#06080f', border: 'none', cursor: 'pointer' }}
          >
            Entrar
          </button>
        </div>
      </nav>

      {/* ══ HERO FULL-WIDTH ══ */}
      <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
        {HERO_IMAGES.map((src, i) => (
          <div key={i} style={{ position: 'absolute', inset: 0, transition: 'opacity 1.5s', opacity: i === heroImg ? 1 : 0 }}>
            <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ))}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(6,8,15,0.55) 0%, rgba(6,8,15,0.3) 40%, rgba(6,8,15,0.8) 75%, rgba(6,8,15,1) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(6,8,15,0.7) 0%, transparent 60%)' }} />

        {/* Centro do hero */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', height: '100%', padding: '0 80px', maxWidth: 700 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `rgba(201,168,76,0.15)`, border: `1px solid ${C.border}`, borderRadius: 99, padding: '6px 16px', marginBottom: 28, fontSize: 12, fontWeight: 600, color: C.gold }}>
            <Sparkles size={12} /> Escola de Formação de Terapeutas
          </div>
          <h1 style={{ fontSize: 62, fontWeight: 900, color: C.text, lineHeight: 1.05, marginBottom: 20 }}>
            Transforme vidas
            <br />
            <span style={{ background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              através da cura.
            </span>
          </h1>
          <p style={{ fontSize: 18, color: C.muted, lineHeight: 1.7, maxWidth: 500, marginBottom: 40 }}>
            Uma formação completa em terapia, com o diferencial da prática terapêutica ao longo de toda a jornada.
          </p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <a href="#cursos" style={{ padding: '14px 32px', borderRadius: 14, fontWeight: 700, fontSize: 15, background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight})`, color: '#06080f', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Ver Nossos Cursos <ChevronRight size={16} />
            </a>
            <button onClick={() => setShowLogin(true)} style={{ padding: '14px 32px', borderRadius: 14, fontWeight: 700, fontSize: 15, background: 'rgba(255,255,255,0.08)', border: `1px solid rgba(255,255,255,0.15)`, color: C.text, cursor: 'pointer' }}>
              Já sou Aluno
            </button>
          </div>
        </div>

        {/* Indicadores */}
        <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 10 }}>
          {HERO_IMAGES.map((_, i) => (
            <button key={i} onClick={() => setHeroImg(i)} style={{ height: 4, borderRadius: 99, background: i === heroImg ? C.gold : 'rgba(255,255,255,0.2)', width: i === heroImg ? 36 : 18, border: 'none', cursor: 'pointer', transition: 'all 0.3s' }} />
          ))}
        </div>

        {/* Features flutuantes */}
        <div style={{ position: 'absolute', bottom: 80, right: 60, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: 320, zIndex: 10 }}>
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{ background: 'rgba(6,8,15,0.75)', border: `1px solid ${C.border}`, borderRadius: 16, padding: 14, backdropFilter: 'blur(20px)' }}>
              <Icon size={15} style={{ color: C.gold, marginBottom: 6 }} />
              <div style={{ fontWeight: 600, fontSize: 12, color: C.text }}>{title}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ SOBRE O CURSO ══ */}
      <section id="sobre" style={{ padding: '100px 80px', background: C.bgAlt }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 3, color: C.gold, marginBottom: 12 }}>Nossa Missão</div>
            <h2 style={{ fontSize: 38, fontWeight: 800, color: C.text, lineHeight: 1.2, marginBottom: 20 }}>
              Uma formação que transforma de dentro para fora
            </h2>
            <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.8, marginBottom: 24 }}>
              A WR-EDU foi criada com a missão de formar terapeutas completos, preparados para atender com ética, ciência e sensibilidade. Nossa metodologia integra conhecimento técnico, prática supervisionada e desenvolvimento pessoal profundo.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['Metodologia baseada em evidências científicas', 'Prática terapêutica real ao longo de todo o curso', 'Certificação reconhecida por entidades nacionais e internacionais', 'Suporte contínuo de mentoria com o Prof. William'].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: C.muted }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: `rgba(201,168,76,0.2)`, border: `1px solid ${C.gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.gold }} />
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[{ n: '15+', l: 'Anos de experiência' }, { n: '500+', l: 'Terapeutas formados' }, { n: '98%', l: 'Taxa de aprovação' }, { n: '4', l: 'Entidades certificadoras' }].map(s => (
              <div key={s.l} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 20, padding: 24, textAlign: 'center' }}>
                <div style={{ fontSize: 36, fontWeight: 900, background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 4 }}>{s.n}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PROFESSOR ══ */}
      <section id="professor" style={{ padding: '100px 80px', background: C.bg }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 3, color: C.gold, marginBottom: 12 }}>Seu Mentor</div>
          <h2 style={{ fontSize: 38, fontWeight: 800, color: C.text, marginBottom: 48 }}>Prof. William Ribeiro</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: 56, alignItems: 'start' }}>
            <div>
              <div style={{ borderRadius: 28, overflow: 'hidden', border: `2px solid ${C.border}`, marginBottom: 24, boxShadow: `0 0 60px rgba(201,168,76,0.15)` }}>
                <img src={profImg} alt="Professor" style={{ width: '100%', height: 380, objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ background: `rgba(201,168,76,0.08)`, border: `1px solid ${C.border}`, borderRadius: 16, padding: '16px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: C.gold, fontWeight: 700, marginBottom: 4 }}>Terapeuta Holístico · Educador · Mentor</div>
                <div style={{ fontSize: 11, color: C.muted }}>15+ anos em desenvolvimento humano</div>
              </div>
            </div>
            <div>
              <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.9, marginBottom: 32 }}>
                William Ribeiro é terapeuta holístico, educador e mentor com mais de 15 anos de experiência em desenvolvimento humano. Fundador da WR-EDU, sua metodologia une ciência, prática clínica e espiritualidade em uma abordagem transformadora que já formou mais de 500 terapeutas em todo o Brasil.
              </p>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 3, color: C.muted, marginBottom: 16 }}>Certificações e Afiliações</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {CERTS.map(c => (
                  <div key={c.title} style={{ display: 'flex', alignItems: 'center', gap: 16, background: C.bgAlt, border: `1px solid ${C.borderLight}`, borderRadius: 16, padding: '14px 18px' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: `rgba(201,168,76,0.12)`, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Award size={17} style={{ color: C.gold }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{c.title}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{c.desc}</div>
                    </div>
                    <a href="#" style={{ fontSize: 11, fontWeight: 600, color: C.gold, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto', flexShrink: 0 }}>
                      Ver <ExternalLink size={11} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CURSOS ══ */}
      <section id="cursos" style={{ padding: '100px 80px', background: C.bgAlt }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 3, color: C.gold, marginBottom: 12 }}>Formações Profissionais</div>
          <h2 style={{ fontSize: 38, fontWeight: 800, color: C.text, marginBottom: 56 }}>Nossos Cursos</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
            {COURSES.map(c => (
              <div key={c.title} style={{ background: C.bg, border: `1px solid ${C.borderLight}`, borderRadius: 28, overflow: 'hidden', transition: 'border-color 0.3s' }}>
                <div style={{ position: 'relative' }}>
                  <img src={c.img} alt={c.title} style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(6,8,15,0.9) 0%, transparent 60%)' }} />
                  <span style={{ position: 'absolute', top: 16, left: 16, background: C.gold, color: '#06080f', borderRadius: 99, padding: '4px 14px', fontSize: 11, fontWeight: 700 }}>{c.tag}</span>
                </div>
                <div style={{ padding: 28 }}>
                  <h3 style={{ fontWeight: 700, fontSize: 20, color: C.text, marginBottom: 10 }}>{c.title}</h3>
                  <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 24 }}>{c.desc}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 28, fontWeight: 900, color: C.gold }}>{c.price}</span>
                    <button style={{ padding: '11px 22px', borderRadius: 12, fontWeight: 700, fontSize: 13, background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight})`, color: '#06080f', border: 'none', cursor: 'pointer' }}>
                      Comprar Agora
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer id="contato" style={{ padding: '60px 80px', background: C.bg, borderTop: `1px solid ${C.border}`, textAlign: 'center' }}>
        <img src={LOGO_URL} alt="WR" style={{ width: 44, height: 44, objectFit: 'contain', margin: '0 auto 14px', display: 'block' }} />
        <div style={{ fontWeight: 700, fontSize: 18, color: C.text, marginBottom: 4 }}>WR-EDU</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 28 }}>Escola de Formação de Terapeutas © 2025</div>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginBottom: 20 }}>
          {['Política de Trabalho', 'Termos de Uso', 'Contato'].map(l => (
            <a key={l} href="#" style={{ fontSize: 12, color: C.muted, textDecoration: 'none' }}>{l}</a>
          ))}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(240,237,229,0.2)' }}>Desenvolvido com dedicação para transformar vidas</div>
      </footer>

      {/* ══ MODAL LOGIN ══ */}
      {showLogin && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={() => setShowLogin(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(6,8,15,0.85)', backdropFilter: 'blur(10px)' }} />
          <div style={{ position: 'relative', background: '#0d1020', border: `1px solid ${C.border}`, borderRadius: 28, padding: '40px 36px', width: '100%', maxWidth: 400, boxShadow: `0 24px 80px rgba(201,168,76,0.15)` }}>
            <button onClick={() => setShowLogin(false)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.muted }}>
              <X size={15} />
            </button>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <img src={LOGO_URL} alt="WR" style={{ width: 40, height: 40, objectFit: 'contain', margin: '0 auto 12px', display: 'block' }} />
              <div style={{ fontWeight: 700, fontSize: 20, color: C.text }}>Acessar Plataforma</div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Escolha seu tipo de acesso</div>
            </div>
            <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.borderLight}`, borderRadius: 14, padding: 5, marginBottom: 20 }}>
              {[{ id: 'code', icon: Key, label: 'Código Aluno' }, { id: 'admin', icon: Shield, label: 'Admin' }].map(({ id, icon: Icon, label }) => (
                <button key={id} onClick={() => setLoginMode(id)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: 'none', cursor: 'pointer', transition: 'all 0.2s', ...(loginMode === id ? { background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight})`, color: '#06080f' } : { background: 'transparent', color: C.muted }) }}>
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.borderLight}`, borderRadius: 16, padding: 20 }}>
              <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: C.muted, display: 'block', marginBottom: 10 }}>
                {loginMode === 'code' ? 'Código de acesso' : 'Email administrativo'}
              </label>
              <input
                placeholder={loginMode === 'code' ? 'EDU-XXXX-XXXX' : 'seu@email.com'}
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.borderLight}`, borderRadius: 10, padding: '12px 16px', textAlign: 'center', fontFamily: 'monospace', fontSize: 16, color: C.text, outline: 'none', boxSizing: 'border-box' }}
              />
              <button style={{ width: '100%', marginTop: 14, padding: '13px 0', borderRadius: 12, fontWeight: 700, fontSize: 14, background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight})`, color: '#06080f', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                Entrar na Plataforma <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}