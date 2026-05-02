import React, { useState, useEffect } from 'react';
import { GraduationCap, Lock, Eye, EyeOff, Key, AlertCircle, Heart, Star, Sparkles, ChevronRight, Users, BookOpen, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { setSession, verifyPassword } from '@/lib/customAuth';
import SetupAdminModal from './SetupAdminModal';

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1400&q=85',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1400&q=85',
  'https://images.unsplash.com/photo-1609234656388-0ff363383899?w=1400&q=85',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1400&q=85',
];

const FEATURES = [
  { icon: BookOpen, title: 'Videoaulas', desc: 'Conteúdo terapêutico exclusivo' },
  { icon: Video, title: 'Lives ao Vivo', desc: 'Práticas e mentorias em tempo real' },
  { icon: Users, title: 'Comunidade', desc: 'Fórum de dúvidas e troca' },
  { icon: Heart, title: 'Prática', desc: 'Experiência terapêutica ao longo do curso' },
];

export default function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState('code');
  const [code, setCode] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [adminConfigured, setAdminConfigured] = useState(null);
  const [heroImg, setHeroImg] = useState(0);

  useEffect(() => {
    checkAdminSetup();
    const interval = setInterval(() => setHeroImg(i => (i + 1) % HERO_IMAGES.length), 6000);
    return () => clearInterval(interval);
  }, []);

  const checkAdminSetup = async () => {
    const creds = await base44.entities.AdminCredential.list();
    setAdminConfigured(creds.length > 0);
  };

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
    await base44.entities.AccessCode.update(record.id, { last_login: new Date().toISOString() });
    setSession({
      role: 'student',
      codeId: record.id,
      code: trimmed,
      name: record.profile_name || record.student_name || 'Aluno',
      email: record.student_email || '',
      bio: record.profile_bio || '',
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
    <div className="min-h-screen bg-[#080b14] flex flex-col">
      {/* ── HERO SECTION ── */}
      <div className="relative min-h-screen flex flex-col lg:flex-row">

        {/* Left — Hero imagery & content */}
        <div className="relative flex-1 overflow-hidden min-h-[50vh] lg:min-h-screen">
          {HERO_IMAGES.map((src, i) => (
            <div
              key={src}
              className={`absolute inset-0 transition-opacity duration-1500 ${i === heroImg ? 'opacity-100' : 'opacity-0'}`}
            >
              <img src={src} alt="" className="w-full h-full object-cover object-center" />
            </div>
          ))}

          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#080b14]/95 via-[#080b14]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080b14] via-transparent to-[#080b14]/30" />

          {/* Content over image */}
          <div className="relative z-10 flex flex-col justify-between h-full p-8 lg:p-14">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#5b5ef4] to-[#1db89e] flex items-center justify-center shadow-2xl shadow-[#5b5ef4]/40">
                <GraduationCap size={22} className="text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-white tracking-tight">WR-EDU</span>
                <p className="text-[10px] text-white/40 -mt-0.5 tracking-widest uppercase">Portal Educacional</p>
              </div>
            </div>

            {/* Center content */}
            <div className="hidden lg:block">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-1.5 mb-6">
                <Sparkles size={12} className="text-yellow-400" />
                <span className="text-xs font-semibold text-white/80">Escola de Formação de Terapeutas</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-6 max-w-lg">
                Transforme vidas
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#5b5ef4] to-[#1db89e]">
                  através da cura.
                </span>
              </h1>
              <p className="text-white/60 text-lg leading-relaxed max-w-md mb-10">
                Uma formação completa em terapia, com o diferencial da prática terapêutica ao longo de toda a jornada.
              </p>

              {/* Feature cards */}
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                {FEATURES.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl p-3.5">
                    <Icon size={16} className="text-[#1db89e] mb-2" />
                    <p className="text-white font-semibold text-sm">{title}</p>
                    <p className="text-white/50 text-xs mt-0.5">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Dots */}
            <div className="hidden lg:flex gap-2">
              {HERO_IMAGES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setHeroImg(i)}
                  className={`h-1 rounded-full transition-all ${i === heroImg ? 'bg-[#5b5ef4] w-10' : 'bg-white/20 w-5'}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right — Login panel */}
        <div className="w-full lg:w-[420px] bg-[#0d1120] border-l border-white/8 flex flex-col justify-center p-7 lg:p-10 relative overflow-hidden">
          {/* Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#5b5ef4]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#1db89e]/8 rounded-full blur-2xl pointer-events-none" />

          <div className="relative">
            {/* Mobile logo */}
            <div className="flex flex-col items-center mb-8 lg:hidden">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#5b5ef4] to-[#1db89e] flex items-center justify-center shadow-2xl shadow-[#5b5ef4]/40 mb-3">
                <GraduationCap size={26} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">WR-EDU</h1>
              <p className="text-white/40 text-xs mt-1 tracking-widest uppercase">Escola de Terapeutas</p>
            </div>

            {/* Title */}
            <div className="hidden lg:block mb-8">
              <h2 className="text-2xl font-bold text-white">Entrar na plataforma</h2>
              <p className="text-white/40 text-sm mt-1">Escolha seu tipo de acesso abaixo</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-white/5 rounded-2xl p-1 mb-6 border border-white/8">
              <button
                onClick={() => { setMode('code'); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  mode === 'code'
                    ? 'bg-gradient-to-r from-[#5b5ef4] to-[#7c5ef4] text-white shadow-lg shadow-[#5b5ef4]/30'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                <Key size={14} /> Código de Aluno
              </button>
              <button
                onClick={() => { setMode('admin'); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  mode === 'admin'
                    ? 'bg-gradient-to-r from-[#5b5ef4] to-[#7c5ef4] text-white shadow-lg shadow-[#5b5ef4]/30'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                <Lock size={14} /> Admin
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-300 text-sm p-3.5 rounded-xl mb-5">
                <AlertCircle size={15} className="shrink-0" />
                {error}
              </div>
            )}

            {/* Form card */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 shadow-2xl">
              {mode === 'code' ? (
                <form onSubmit={handleCodeLogin} className="space-y-4">
                  <div>
                    <label className="text-white/60 text-xs font-semibold uppercase tracking-wider block mb-2">
                      Código de acesso
                    </label>
                    <Input
                      placeholder="EDU-XXXX-XXXX"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      className="bg-white/8 border-white/12 text-white placeholder:text-white/25 h-13 text-center text-xl tracking-widest font-mono focus:border-[#5b5ef4]/60"
                      autoCapitalize="characters"
                    />
                    <p className="text-white/30 text-xs mt-2 text-center">
                      Insira o código fornecido pelo seu professor
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 text-sm font-bold bg-gradient-to-r from-[#5b5ef4] to-[#7c5ef4] hover:opacity-90 transition-opacity border-0 shadow-lg shadow-[#5b5ef4]/30 gap-2"
                    disabled={code.length < 3 || loading}
                  >
                    {loading ? 'Verificando...' : <><span>Entrar na Plataforma</span> <ChevronRight size={16} /></>}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div>
                    <label className="text-white/60 text-xs font-semibold uppercase tracking-wider block mb-2">Email</label>
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="bg-white/8 border-white/12 text-white placeholder:text-white/25 h-11 focus:border-[#5b5ef4]/60"
                    />
                  </div>
                  <div>
                    <label className="text-white/60 text-xs font-semibold uppercase tracking-wider block mb-2">Senha</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="bg-white/8 border-white/12 text-white placeholder:text-white/25 h-11 pr-11 focus:border-[#5b5ef4]/60"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 text-sm font-bold bg-gradient-to-r from-[#5b5ef4] to-[#7c5ef4] hover:opacity-90 transition-opacity border-0 shadow-lg shadow-[#5b5ef4]/30 gap-2"
                    disabled={!adminEmail || !adminPassword || loading}
                  >
                    {loading ? 'Entrando...' : <><span>Entrar como Admin</span> <ChevronRight size={16} /></>}
                  </Button>
                </form>
              )}
            </div>

            {/* Setup lock */}
            {adminConfigured === false && (
              <div className="flex justify-center mt-5">
                <button
                  onClick={() => setShowSetup(true)}
                  className="flex items-center gap-2.5 bg-blue-500/10 border border-blue-400/20 backdrop-blur text-blue-300 hover:text-blue-200 hover:bg-blue-500/20 transition-all px-5 py-3 rounded-2xl text-sm font-medium"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Lock size={12} className="text-blue-400" />
                  </div>
                  Configurar acesso administrativo
                </button>
              </div>
            )}

            {/* Footer credits */}
            <div className="mt-8 text-center">
              <div className="flex items-center justify-center gap-1.5 text-white/20 text-xs">
                <Star size={10} className="fill-current" />
                <span>WR-EDU © 2025 — Escola de Formação de Terapeutas</span>
                <Star size={10} className="fill-current" />
              </div>
              <p className="text-white/15 text-[10px] mt-1">
                Desenvolvido com <Heart size={8} className="inline fill-current text-red-400/60" /> para transformar vidas
              </p>
            </div>
          </div>
        </div>
      </div>

      {showSetup && (
        <SetupAdminModal
          onClose={() => setShowSetup(false)}
          onConfigured={() => { setAdminConfigured(true); setShowSetup(false); }}
        />
      )}
    </div>
  );
}