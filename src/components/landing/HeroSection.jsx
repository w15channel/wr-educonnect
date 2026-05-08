import { useState, useEffect } from 'react';
import { Shield, Video, Radio, Users, Heart, ChevronRight, Key, Lock, AlertCircle, Eye, EyeOff, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { setSession, verifyPassword, nowBRT } from '@/lib/customAuth';
import SetupAdminModal from '../auth/SetupAdminModal';

const LOGO_URL = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/077216e46_textodoseupargrafoWR_20251219_192959_0000.png';

const HERO_IMAGES = [
  'https://media.base44.com/images/public/69f55577840a3c93cee191be/056bf6bba_176702773849222.jpg',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1400&q=85',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1400&q=85',
];

const FEATURES = [
  { icon: Video, title: 'Videoaulas', desc: 'Conteúdo terapêutico exclusivo' },
  { icon: Radio, title: 'Lives ao Vivo', desc: 'Práticas e mentorias em tempo real' },
  { icon: Users, title: 'Comunidade', desc: 'Fórum de dúvidas e troca' },
  { icon: Heart, title: 'Prática', desc: 'Experiência terapêutica ao longo do curso' },
];

export default function HeroSection({ onLogin }) {
  const [tab, setTab] = useState('student');
  const [code, setCode] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [heroImg, setHeroImg] = useState(0);
  const [adminConfigured, setAdminConfigured] = useState(null);
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    base44.entities.AdminCredential.list().then(c => setAdminConfigured(c.length > 0));
    const iv = setInterval(() => setHeroImg(i => (i + 1) % HERO_IMAGES.length), 6000);
    return () => clearInterval(iv);
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
      role: 'student', codeId: record.id, code: trimmed,
      name: record.profile_name || record.student_name || 'Aluno',
      email: record.student_email || '', bio: record.profile_bio || '',
      avatarColor: record.profile_avatar_color || '#5b5ef4',
      photoUrl: record.profile_photo_url || '',
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
    if (adminEmail.trim() !== cred.email || !verifyPassword(adminPass, cred.password_hash)) {
      setError('Email ou senha incorretos.');
      setLoading(false);
      return;
    }
    setSession({ role: 'admin', name: 'Professor', email: cred.email });
    onLogin();
    setLoading(false);
  };

  return (
    <section className="relative min-h-screen bg-[#111827] overflow-hidden">
      {/* Background slideshow */}
      {HERO_IMAGES.map((src, i) => (
        <div key={src} className={`absolute inset-0 transition-opacity duration-[1500ms] ${i === heroImg ? 'opacity-100' : 'opacity-0'}`}>
          <img src={src} alt="" className="w-full h-full object-cover object-center" />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-[#111827]/95 via-[#111827]/75 to-[#111827]/50" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-[#111827]/40" />

      {/* Top badge */}
      <div className="relative z-10 flex justify-center pt-6">
        <div className="flex items-center gap-2 bg-[#1F2937]/80 border border-[#374151] rounded-full px-4 py-2 text-xs text-gray-300">
          <Shield className="w-3 h-3 text-amber-400" />
          Acesso Seguro
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-12">
          <img src={LOGO_URL} alt="WR-EDU" className="w-10 h-10 object-contain" />
          <div>
            <span className="text-xl font-bold text-white tracking-tight">WR-EDU</span>
            <p className="text-[10px] text-gray-500 tracking-widest uppercase">Portal Educacional</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — Hero Copy */}
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-1.5 mb-6">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span className="text-xs font-semibold text-white/80">Escola de Formação de Terapeutas</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-2" style={{ fontFamily: 'Georgia, serif' }}>
              Transforme vidas
            </h1>
            <h2 className="text-5xl lg:text-6xl font-bold text-amber-400 leading-tight mb-6" style={{ fontFamily: 'Georgia, serif' }}>
              através da cura.
            </h2>
            <p className="text-gray-300 text-lg leading-relaxed mb-10 max-w-md">
              Uma formação completa em terapia, com o diferencial da prática terapêutica ao longo de toda a jornada.
            </p>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 gap-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="bg-[#1F2937]/70 border border-[#374151] rounded-xl p-4 flex gap-3 items-start hover:border-amber-400/40 transition-colors">
                  <f.icon className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-white font-semibold text-sm">{f.title}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Dots */}
            <div className="flex gap-2 mt-8">
              {HERO_IMAGES.map((_, i) => (
                <button key={i} onClick={() => setHeroImg(i)} className={`h-1 rounded-full transition-all ${i === heroImg ? 'bg-amber-400 w-10' : 'bg-white/20 w-5'}`} />
              ))}
            </div>
          </div>

          {/* Right — Login Form */}
          <div className="bg-[#1F2937]/90 border border-[#374151] rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
            <h3 className="text-white text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>Entrar na plataforma</h3>
            <p className="text-gray-400 text-sm mb-6">Escolha seu tipo de acesso abaixo</p>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => { setTab('student'); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${tab === 'student' ? 'bg-amber-400 text-gray-900' : 'bg-[#374151] text-gray-300 hover:bg-[#4B5563]'}`}
              >
                <Key className="w-4 h-4" /> Código de Aluno
              </button>
              <button
                onClick={() => { setTab('admin'); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${tab === 'admin' ? 'bg-amber-400 text-gray-900' : 'bg-[#374151] text-gray-300 hover:bg-[#4B5563]'}`}
              >
                <Shield className="w-4 h-4" /> Admin
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/25 text-red-300 text-sm p-3 rounded-xl mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            {tab === 'student' ? (
              <form onSubmit={handleCodeLogin} className="space-y-4">
                <div>
                  <label className="text-gray-400 text-xs uppercase tracking-widest mb-2 block flex items-center gap-1">
                    <Key className="w-3 h-3 text-amber-400" /> Código de Acesso
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    placeholder="EDU-XXXX-XXXX"
                    autoCapitalize="characters"
                    className="w-full bg-[#111827] border border-[#4B5563] rounded-xl px-4 py-3 text-white placeholder-gray-600 text-center text-xl tracking-widest font-mono focus:outline-none focus:border-amber-400 transition-colors"
                  />
                  <p className="text-gray-500 text-xs mt-2 flex items-center gap-1 justify-center">
                    <Lock className="w-3 h-3" /> Código fornecido pelo seu professor
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={code.length < 3 || loading}
                  className="w-full bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" /> Verificando...</>
                  ) : (
                    <><span>Entrar na Plataforma</span> <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <input
                  type="email"
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  placeholder="Email administrativo"
                  className="w-full bg-[#111827] border border-[#4B5563] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 transition-colors"
                />
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={adminPass}
                    onChange={e => setAdminPass(e.target.value)}
                    placeholder="Senha"
                    className="w-full bg-[#111827] border border-[#4B5563] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 transition-colors pr-12"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!adminEmail || !adminPass || loading}
                  className="w-full bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" /> Entrando...</>
                  ) : (
                    <><span>Entrar como Admin</span> <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            )}

            {adminConfigured === false && (
              <div className="flex justify-center mt-5">
                <button
                  onClick={() => setShowSetup(true)}
                  className="flex items-center gap-2 bg-blue-500/10 border border-blue-400/20 text-blue-300 hover:bg-blue-500/20 transition-all px-4 py-2.5 rounded-xl text-sm"
                >
                  <Lock className="w-4 h-4" /> Configurar acesso administrativo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showSetup && (
        <SetupAdminModal
          onClose={() => setShowSetup(false)}
          onConfigured={() => { setAdminConfigured(true); setShowSetup(false); }}
        />
      )}
    </section>
  );
}