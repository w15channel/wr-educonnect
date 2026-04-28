import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { getSession, setSession } from '@/lib/customAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { User, Save, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#06b6d4',
];

export default function Profile() {
  const session = getSession();
  const [name, setName] = useState(session?.name || '');
  const [bio, setBio] = useState(session?.bio || '');
  const [avatarColor, setAvatarColor] = useState(session?.avatarColor || '#6366f1');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';

  const handleSave = async () => {
    setSaving(true);
    if (session?.codeId) {
      await base44.entities.AccessCode.update(session.codeId, {
        profile_name: name,
        profile_bio: bio,
        profile_avatar_color: avatarColor,
      });
    }
    setSession({ ...session, name, bio, avatarColor });
    setSaving(false);
    setSaved(true);
    toast.success('Perfil atualizado!');
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-6 lg:p-8 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-foreground mb-6">Meu Perfil</h2>

      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-6">
        {/* Avatar preview */}
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg"
            style={{ backgroundColor: avatarColor }}
          >
            {initials}
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {AVATAR_COLORS.map(color => (
              <button
                key={color}
                onClick={() => setAvatarColor(color)}
                className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${avatarColor === color ? 'border-foreground scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Escolha a cor do seu avatar</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Nome de exibição</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Apresentação</label>
            <Textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Conte um pouco sobre você..."
              rows={3}
            />
          </div>
          {session?.email && (
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
              <Input value={session.email} disabled className="opacity-60" />
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Código de acesso</label>
            <Input value={session?.code || '—'} disabled className="font-mono text-center tracking-widest opacity-60" />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
          {saved ? <><CheckCircle size={16} /> Salvo!</> : <><Save size={16} /> {saving ? 'Salvando...' : 'Salvar Perfil'}</>}
        </Button>
      </div>
    </div>
  );
}