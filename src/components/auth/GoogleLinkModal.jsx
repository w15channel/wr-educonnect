import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Mail, CheckCircle, X, Link } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function GoogleLinkModal({ session, onClose }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleLink = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return;
    setLoading(true);
    await base44.entities.AccessCode.update(session.codeId, { google_email: email.trim().toLowerCase() });
    setDone(true);
    setLoading(false);
    toast.success('Email vinculado com sucesso!');
    setTimeout(onClose, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-[#0d1120] border border-white/10 rounded-2xl p-6 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white/70">
          <X size={18} />
        </button>

        {done ? (
          <div className="text-center py-4">
            <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
            <h3 className="text-white font-bold text-base">Email vinculado!</h3>
            <p className="text-white/40 text-sm mt-1">Na próxima vez, você pode entrar com seu email Google.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5b5ef4] to-[#1db89e] flex items-center justify-center">
                <Link size={18} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-base">Vincular Email Google</h3>
                <p className="text-white/40 text-xs mt-0.5">Facilite seus próximos acessos</p>
              </div>
            </div>

            <p className="text-white/50 text-sm leading-relaxed mb-5">
              Vincule seu email Google à sua conta de aluno. Na próxima vez, você poderá entrar digitando apenas seu email, sem precisar do código.
            </p>

            <form onSubmit={handleLink} className="space-y-4">
              <div>
                <label className="text-white/40 text-[10px] font-bold uppercase tracking-widest block mb-2">
                  Seu email Google (Gmail)
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                  <Input
                    type="email"
                    placeholder="seu@gmail.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="pl-9 bg-white/6 border-white/10 text-white placeholder:text-white/20 h-11 focus:border-[#5b5ef4]/60"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={!email.includes('@') || loading}
                className="w-full h-11 bg-gradient-to-r from-[#5b5ef4] to-[#1db89e] border-0 font-bold text-sm"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : 'Vincular Email'}
              </Button>
              <button type="button" onClick={onClose} className="w-full text-white/30 hover:text-white/50 text-xs py-1 transition-colors">
                Agora não
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}