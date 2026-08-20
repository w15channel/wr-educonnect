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
      email: email.trim().toLowerCase(),
      password_hash: hashPassword(password),
      is_configured: true,
    });
    setLoading(false);
    onConfigured();
  };

  return (
    <div className="fixed inset-0 bg-foreground/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-foreground border border-primary/20 rounded-3xl p-8 w-full max-w-sm shadow-2xl shadow-blue-500/10">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-accent/20 border border-primary/30 p-3 rounded-2xl mb-3">
            <Lock size={28} className="text-primary" />
          </div>
          <h2 className="text-primary-foreground text-xl font-bold">Configurar Acesso Admin</h2>
          <p className="text-muted-foreground text-xs text-center mt-1">Esta configuração só pode ser feita uma única vez</p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-foreground text-sm font-medium block mb-1.5">Email do admin</label>
            <Input
              type="email"
              placeholder="professor@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-card/5 border-border/10 text-primary-foreground placeholder:text-foreground h-11"
              required
            />
          </div>
          <div>
            <label className="text-foreground text-sm font-medium block mb-1.5">Senha</label>
            <div className="relative">
              <Input
                type={showPass ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="bg-card/5 border-border/10 text-primary-foreground placeholder:text-foreground h-11 pr-10"
                required
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-foreground text-sm font-medium block mb-1.5">Confirmar senha</label>
            <Input
              type="password"
              placeholder="Repita a senha"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="bg-card/5 border-border/10 text-primary-foreground placeholder:text-foreground h-11"
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1 text-muted-foreground" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary" disabled={loading || !email || !password || !confirm}>
              {loading ? 'Salvando...' : 'Confirmar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}