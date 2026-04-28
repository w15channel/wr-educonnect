import React, { useState, useEffect } from 'react';
import { BookOpen, Lock, Eye, EyeOff, Key, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { setSession, hashPassword, verifyPassword } from '@/lib/customAuth';
import SetupAdminModal from './SetupAdminModal';

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

  useEffect(() => {
    checkAdminSetup();
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
      avatarColor: record.profile_avatar_color || '#6366f1'
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary p-3.5 rounded-2xl shadow-xl shadow-primary/30 mb-4">
            <BookOpen size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">WR-EN</h1>
          <p className="text-slate-400 text-sm mt-1">Plataforma de Estudos</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {/* Tabs */}
          <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-6">
            <button
              onClick={() => {setMode('code');setError('');}}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${mode === 'code' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
              
              <Key size={15} /> Código de Acesso
            </button>
            <button
              onClick={() => {setMode('admin');setError('');}}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${mode === 'admin' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
              
              <Lock size={15} /> Admin
            </button>
          </div>

          {error &&
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-400/20 text-red-300 text-sm p-3 rounded-xl mb-4">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          }

          {mode === 'code' ?
          <form onSubmit={handleCodeLogin} className="space-y-4">
              <div>
                <label className="text-slate-300 text-sm font-medium block mb-2">Seu código de acesso</label>
                <Input
                placeholder="EDU-XXXX-XXXX"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="bg-white/10 border-white/10 text-white placeholder:text-slate-500 h-13 text-center text-xl tracking-widest font-mono"
                autoCapitalize="characters" />
              
                <p className="text-slate-500 text-xs mt-2 text-center">Insira o código fornecido pelo seu professor</p>
              </div>
              <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={code.length < 3 || loading}>
                {loading ? 'Verificando...' : 'Entrar'}
              </Button>
            </form> :

          <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="text-slate-300 text-sm font-medium block mb-1.5">Email</label>
                <Input
                type="email"
                placeholder="seu@email.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="bg-white/10 border-white/10 text-white placeholder:text-slate-500 h-11" />
              
              </div>
              <div>
                <label className="text-slate-300 text-sm font-medium block mb-1.5">Senha</label>
                <div className="relative">
                  <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="bg-white/10 border-white/10 text-white placeholder:text-slate-500 h-11 pr-10" />
                
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={!adminEmail || !adminPassword || loading}>
                {loading ? 'Entrando...' : 'Entrar como Admin'}
              </Button>
            </form>
          }
        </div>

        {/* Setup Admin Lock */}
        {adminConfigured === false &&
        <div className="flex justify-center mt-6">
            <button
            onClick={() => setShowSetup(true)}
            className="flex items-center gap-2 bg-blue-500/15 border border-blue-400/25 backdrop-blur text-blue-300 hover:text-blue-200 hover:bg-blue-500/25 transition-all px-5 py-3 rounded-2xl text-sm font-medium shadow-lg">
            
              <Lock size={16} className="text-blue-400" />
              Configurar acesso administrativo
            </button>
          </div>
        }
      </div>

      {showSetup &&
      <SetupAdminModal
        onClose={() => setShowSetup(false)}
        onConfigured={() => {setAdminConfigured(true);setShowSetup(false);}} />

      }
    </div>);

}