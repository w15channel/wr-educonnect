import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { hashPassword } from '@/lib/customAuth';

export default function SetupAdminModal({ onClose, onConfigured }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return; }
    if (password !== confirm) { setError('As senhas não coincidem.'); return; }
    setLoading(true);
    await base44.entities.AdminCredential.create({
      email: email.trim(),
      password_hash: hashPassword(password),
      is_configured: true,
    });
    setLoading(false);
    onConfigured();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-blue-400/20 rounded-3xl p-8 w-full max-w-sm shadow-2xl shadow-blue-500/10">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-blue-500/20 border border-blue-400/30 p-3 rounded-2xl mb-3">
            <Lock size={28} className="text-blue-400" />
          </div>
          <h2 className="text-white text-xl font-bold">Configurar Acesso Admin</h2>
          <p className="text-slate-400 text-xs text-center mt-1">Esta configuração só pode ser feita uma única vez</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-400/20 text-red-300 text-sm p-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-slate-300 text-sm font-medium block mb-1.5">Email do admin</label>
            <Input
              type="email"
              placeholder="professor@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 h-11"
              required
            />
          </div>
          <div>
            <label className="text-slate-300 text-sm font-medium block mb-1.5">Senha</label>
            <div className="relative">
              <Input
                type={showPass ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 h-11 pr-10"
                required
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-slate-300 text-sm font-medium block mb-1.5">Confirmar senha</label>
            <Input
              type="password"
              placeholder="Repita a senha"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 h-11"
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1 text-slate-400" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={loading || !email || !password || !confirm}>
              {loading ? 'Salvando...' : 'Confirmar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}