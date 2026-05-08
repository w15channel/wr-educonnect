import React, { useState, useEffect } from 'react';
import { BookOpen, Video, Users, Heart, Sparkles, ChevronRight, Key, Shield, Award, ExternalLink, ArrowDown } from 'lucide-react';

const LOGO_URL = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/077216e46_textodoseupargrafoWR_20251219_192959_0000.png';

const HERO_IMAGES = [
  'https://media.base44.com/images/public/69f55577840a3c93cee191be/056bf6bba_176702773849222.jpg',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1400',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1400',
  'https://images.unsplash.com/photo-1609234656388-0ff363383899?w=1400',
];

const FEATURES = [
  { icon: BookOpen, title: 'Videoaulas', desc: 'Conteúdo terapêutico exclusivo' },
  { icon: Video, title: 'Lives ao Vivo', desc: 'Práticas e mentorias em tempo real' },
  { icon: Users, title: 'Comunidade', desc: 'Fórum de dúvidas e troca' },
  { icon: Heart, title: 'Prática', desc: 'Experiência terapêutica ao longo do curso' },
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
    desc: 'Curso profissionalizante completo em Terapia Holística e Desenvolvimento Humano. Prática real ao longo de toda a jornada.',
    price: 'R$ 1.497',
    tag: 'Mais Popular',
    img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600',
  },
  {
    title: 'Hipnoterapia Clínica',
    desc: 'Formação profissional em hipnoterapia com fundamentação científica e técnicas avançadas de intervenção terapêutica.',
    price: 'R$ 997',
    tag: 'Novidade',
    img: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600',
  },
];

const S = {
  page: { background: '#070c18', color: '#f0f4ff', fontFamily: "'Plus Jakarta Sans', sans-serif", minHeight: '100vh' },
  badge: { position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 50, background: '#5b5ef4', color: '#fff', borderRadius: 99, padding: '6px 20px', fontSize: 11, fontWeight: 700, letterSpacing: 1, whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(91,94,244,0.5)' },
};

export default function LayoutPreview1() {
  const [heroImg, setHeroImg] = useState(0);
  const [loginMode, setLoginMode] = useState('code');
  const [code, setCode] = useState('');

  useEffect(() => {
    const t = setInterval(() => setHeroImg(i => (i + 1) % HERO_IMAGES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const profImg = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600';

  return (
    <div style={S.page}>
      <div style={S.badge}>MODELO 1 — Vitrine Lateral com Acesso Centralizado</div>

      {/* HERO */}
      <div style={{ display: 'flex', minHeight: '100vh' }}>

        {/* LEFT — Carrossel */}
        <div style={{ position: 'relative', overflow: 'hidden', flex: 1, minHeight: '55vh' }}>
          {HERO_IMAGES.map((src, i) => (
            <div key={i} style={{ position: 'absolute', inset: 0, transition: 'opacity 1s', opacity: i === heroImg ? 1 : 0 }}>
              <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(7,12,24,0.96) 0%, rgba(7,12,24,0.65) 55%, transparent 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(7,12,24,1) 0%, transparent 40%)' }} />

          <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', padding: '3rem 3.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src={LOGO_URL} alt="WR" style={{ width: 44, height: 44, objectFit: 'contain' }} />
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>WR-EDU</div>
                <div style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>Portal Educacional</div>
              </div>
            </div>

            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 99, padding: '6px 16px', marginBottom: 24, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>
                <Sparkles size={12} style={{ color: '#f4c23d' }} /> Escola de Formação de Terapeutas
              </div>
              <h1 style={{ fontSize: 52, fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 16, maxWidth: 480 }}>
                Transforme vidas
                <br />
                <span style={{ background: 'linear-gradient(90deg, #5b5ef4, #1db89e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>através da cura.</span>
              </h1>
              <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, maxWidth: 400, marginBottom: 32 }}>
                Uma formação completa em terapia, com o diferencial da prática terapêutica ao longo de toda a jornada.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 320, marginBottom: 28 }}>
                {FEATURES.map(({ icon: Icon, title, desc }) => (
                  <div key={title} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 16, padding: 14 }}>
                    <Icon size={15} style={{ color: '#1db89e', marginBottom: 6 }} />
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#fff' }}>{title}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{desc}</div>
                  </div>
                ))}
              </div>
              <a href="#cursos" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#1db89e', textDecoration: 'none' }}>
                Ver nossos cursos <ArrowDown size={14} />
              </a>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              {HERO_IMAGES.map((_, i) => (
                <button key={i} onClick={() => setHeroImg(i)} style={{ height: 4, borderRadius: 99, background: i === heroImg ? '#5b5ef4' : 'rgba(255,255,255,0.18)', width: i === heroImg ? 36 : 18, border: 'none', cursor: 'pointer', transition: 'all 0.3s' }} />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Acesso */}
        <div style={{ width: 420, background: '#0d1325', borderLeft: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2.5rem', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: 280, height: 280, background: 'rgba(91,94,244,0.1)', borderRadius: '50%', filter: 'blur(60px)', transform: 'translate(50%,-50%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: 220, height: 220, background: 'rgba(29,184,158,0.08)', borderRadius: '50%', filter: 'blur(50px)', transform: 'translate(-50%,50%)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* CTA Curso */}
            <div style={{ background: 'linear-gradient(135deg, rgba(91,94,244,0.18), rgba(29,184,158,0.12))', border: '1px solid rgba(91,94,244,0.3)', borderRadius: 20, padding: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: '#a09ef4', marginBottom: 4 }}>Vagas Abertas</div>
              <div style={{ fontWeight: 700, fontSize: 17, color: '#fff', marginBottom: 4 }}>Formação de Terapeutas</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 16 }}>Acesso vitalício · Certificado incluso</div>
              <button style={{ width: '100%', padding: '12px 0', borderRadius: 12, fontWeight: 700, fontSize: 14, background: 'linear-gradient(90deg,#5b5ef4,#1db89e)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                Adquirir Agora — R$ 1.497
              </button>
            </div>

            {/* Login */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: 'rgba(255,255,255,0.28)', marginBottom: 10 }}>Já sou aluno</div>
              <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 6, marginBottom: 14 }}>
                {[{ id: 'code', icon: Key, label: 'Código' }, { id: 'admin', icon: Shield, label: 'Admin' }].map(({ id, icon: Icon, label }) => (
                  <button key={id} onClick={() => setLoginMode(id)} style={{ flex: 1, padding: '10px 0', borderRadius: 12, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: 'none', cursor: 'pointer', transition: 'all 0.2s', ...(loginMode === id ? { background: 'linear-gradient(135deg,#5b5ef4,#7c3aed)', color: '#fff', boxShadow: '0 4px 20px rgba(91,94,244,0.4)' } : { background: 'transparent', color: 'rgba(255,255,255,0.3)' }) }}>
                    <Icon size={13} /> {label}
                  </button>
                ))}
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20 }}>
                <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: 'rgba(255,255,255,0.38)', display: 'block', marginBottom: 10 }}>
                  {loginMode === 'code' ? 'Código de acesso' : 'Email administrativo'}
                </label>
                <input
                  placeholder={loginMode === 'code' ? 'EDU-XXXX-XXXX' : 'seu@email.com'}
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', textAlign: 'center', fontFamily: 'monospace', fontSize: 17, color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                />
                <button style={{ width: '100%', marginTop: 14, padding: '12px 0', borderRadius: 12, fontWeight: 700, fontSize: 14, background: 'linear-gradient(90deg,#5b5ef4,#1db89e)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  Entrar na Plataforma <ChevronRight size={15} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {['Política de Trabalho', 'Termos de Uso', 'Contato'].map(l => (
                <a key={l} href="#" style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textDecoration: 'none' }}>{l}</a>
              ))}
            </div>
            <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>WR-EDU © 2025 — Escola de Formação de Terapeutas</div>
          </div>
        </div>
      </div>

      {/* PROFESSOR */}
      <section style={{ padding: '80px 24px', background: '#0a1020', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 3, color: '#5b5ef4', marginBottom: 8 }}>Seu Mentor</div>
          <h2 style={{ fontSize: 34, fontWeight: 800, color: '#fff', marginBottom: 48 }}>Prof. William Ribeiro</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
            <div>
              <div style={{ borderRadius: 24, overflow: 'hidden', border: '2px solid rgba(91,94,244,0.3)', marginBottom: 20 }}>
                <img src={profImg} alt="Professor" style={{ width: '100%', height: 280, objectFit: 'cover', display: 'block' }} />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.8 }}>
                William Ribeiro é terapeuta holístico, educador e mentor com mais de 15 anos de experiência em desenvolvimento humano. Fundador da WR-EDU, sua metodologia une ciência, prática clínica e espiritualidade em uma abordagem transformadora.
              </p>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 3, color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>Certificações e Afiliações</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {CERTS.map(c => (
                  <div key={c.title} style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '14px 16px' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(91,94,244,0.2)', border: '1px solid rgba(91,94,244,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Award size={16} style={{ color: '#a09ef4' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>{c.title}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{c.desc}</div>
                    </div>
                    <a href="#" style={{ fontSize: 11, fontWeight: 600, color: '#1db89e', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
                      Ver <ExternalLink size={11} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CURSOS */}
      <section id="cursos" style={{ padding: '80px 24px', background: '#070c18' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 3, color: '#1db89e', marginBottom: 8 }}>Formações Profissionais</div>
          <h2 style={{ fontSize: 34, fontWeight: 800, color: '#fff', marginBottom: 48 }}>Nossos Cursos</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {COURSES.map(c => (
              <div key={c.title} style={{ background: '#0d1325', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, overflow: 'hidden' }}>
                <div style={{ position: 'relative' }}>
                  <img src={c.img} alt={c.title} style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
                  <span style={{ position: 'absolute', top: 14, left: 14, background: '#5b5ef4', color: '#fff', borderRadius: 99, padding: '4px 12px', fontSize: 11, fontWeight: 700 }}>{c.tag}</span>
                </div>
                <div style={{ padding: 24 }}>
                  <h3 style={{ fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 8 }}>{c.title}</h3>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 20 }}>{c.desc}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 24, fontWeight: 900, color: '#1db89e' }}>{c.price}</span>
                    <button style={{ padding: '10px 20px', borderRadius: 12, fontWeight: 700, fontSize: 13, background: 'linear-gradient(90deg,#5b5ef4,#1db89e)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                      Comprar Agora
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '40px 24px', background: '#0a1020', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
        <img src={LOGO_URL} alt="WR" style={{ width: 40, height: 40, objectFit: 'contain', margin: '0 auto 12px', display: 'block' }} />
        <div style={{ fontWeight: 700, color: '#fff', marginBottom: 4 }}>WR-EDU</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>Escola de Formação de Terapeutas © 2025</div>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
          {['Política de Trabalho', 'Termos de Uso', 'Contato'].map(l => (
            <a key={l} href="#" style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textDecoration: 'none' }}>{l}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}