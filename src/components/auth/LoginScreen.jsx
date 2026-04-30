import React, { useState, useEffect } from 'react';
import { GraduationCap, Lock, Eye, EyeOff, Key, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { setSession, verifyPassword } from '@/lib/customAuth';
import SetupAdminModal from './SetupAdminModal';

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80', // students studying
  'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80', // classroom
  'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&q=80', // library
  'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80', // graduation
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
    const interval = setInterval(() => setHeroImg(i => (i + 1) % HERO_IMAGES.length), 5000);
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
      avatarColor: record.profile_avatar_color || '#6366f1',
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
    <div className="min-h-screen flex">
      {/* Left panel — hero image carousel */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        {HERO_IMAGES.map((src, i) => (
          <img
            key={src}
            src={src}
            alt="Estudantes"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === heroImg ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-slate-900/20" />
        {/* Text overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-12 text-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary p-2.5 rounded-xl shadow-xl">
              <GraduationCap size={28} className="text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">WR-EDU</span>
          </div>
          <h2 className="text-4xl font-bold mb-3 leading-tight">
            Sua jornada de aprendizado começa aqui
          </h2>
          <p className="text-slate-300 text-lg leading-relaxed max-w-md">
            Acesse videoaulas, participe de lives, entregue atividades e acompanhe seu progresso — tudo em um só lugar.
          </p>
          {/* Dots */}
          <div className="flex gap-2 mt-8">
            {HERO_IMAGES.map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroImg(i)}
                className={`h-1.5 rounded-full transition-all ${i === heroImg ? 'bg-primary w-8' : 'bg-white/40 w-4'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="w-full lg:w-[440px] flex flex-col items-center justify-center bg-slate-900 p-8 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-primary/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <div className="bg-primary p-3 rounded-2xl shadow-xl shadow-primary/30 mb-3">
              <GraduationCap size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">WR-EDU</h1>
            <p className="text-slate-400 text-sm mt-1">Plataforma de Estudos</p>
          </div>

          {/* Desktop title */}
          <div className="hidden lg:block mb-8">
            <h1 className="text-3xl font-bold text-white">Bem-vindo(a) 👋</h1>
            <p className="text-slate-400 mt-1">Acesse sua conta para continuar</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-6">
            <button
              onClick={() => { setMode('code'); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${mode === 'code' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              <Key size={15} /> Código de Acesso
            </button>
            <button
              onClick={() => { setMode('admin'); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${mode === 'admin' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              <Lock size={15} /> Admin
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-400/20 text-red-300 text-sm p-3 rounded-xl mb-4">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
            {mode === 'code' ? (
              <form onSubmit={handleCodeLogin} className="space-y-4">
                <div>
                  <label className="text-slate-300 text-sm font-medium block mb-2">Seu código de acesso</label>
                  <Input
                    placeholder="EDU-XXXX-XXXX"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="bg-white/10 border-white/10 text-white placeholder:text-slate-500 h-13 text-center text-xl tracking-widest font-mono"
                    autoCapitalize="characters"
                  />
                  <p className="text-slate-500 text-xs mt-2 text-center">Insira o código fornecido pelo seu professor</p>
                </div>
                <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={code.length < 3 || loading}>
                  {loading ? 'Verificando...' : 'Entrar na Plataforma'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="text-slate-300 text-sm font-medium block mb-1.5">Email</label>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="bg-white/10 border-white/10 text-white placeholder:text-slate-500 h-11"
                  />
                </div>
                <div>
                  <label className="text-slate-300 text-sm font-medium block mb-1.5">Senha</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="bg-white/10 border-white/10 text-white placeholder:text-slate-500 h-11 pr-10"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={!adminEmail || !adminPassword || loading}>
                  {loading ? 'Entrando...' : 'Entrar como Admin'}
                </Button>
              </form>
            )}
          </div>

          {adminConfigured === false && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setShowSetup(true)}
                className="flex items-center gap-2 bg-blue-500/15 border border-blue-400/25 backdrop-blur text-blue-300 hover:text-blue-200 hover:bg-blue-500/25 transition-all px-5 py-3 rounded-2xl text-sm font-medium"
              >
                <Lock size={16} className="text-blue-400" />
                Configurar acesso administrativo
              </button>
            </div>
          )}
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