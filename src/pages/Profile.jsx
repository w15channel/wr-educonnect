import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { getSession, setSession } from '@/lib/customAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { User, Save, CheckCircle, Camera, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
  const [birthDate, setBirthDate] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [photoUrl, setPhotoUrl] = useState(session?.photoUrl || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    if (session?.codeId) {
      base44.entities.StudentProfile.filter({ student_email: session?.email }, '-created_date', 1)
        .then(profiles => {
          if (profiles.length > 0) {
            const p = profiles[0];
            setBirthDate(p.birth_date || '');
            setWhatsapp(p.whatsapp || '');
            setPhotoUrl(p.photo_url || session?.photoUrl || '');
            setAvatarColor(p.avatar_color || session?.avatarColor || '#6366f1');
            setName(p.full_name || session?.name || '');
            setBio(p.bio || session?.bio || '');
          }
        });
    }
  }, []);

  const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setPhotoUrl(file_url);
    setUploading(false);
    toast.success('Foto carregada!');
  };

  const handleSave = async () => {
    setSaving(true);
    if (session?.codeId) {
      await base44.entities.AccessCode.update(session.codeId, {
        profile_name: name,
        profile_bio: bio,
        profile_avatar_color: avatarColor,
        profile_photo_url: photoUrl,
      });
    }
    // Upsert StudentProfile
    const existing = await base44.entities.StudentProfile.filter({ student_email: session?.email }, '-created_date', 1);
    const profileData = {
      student_email: session?.email,
      full_name: name,
      bio,
      avatar_color: avatarColor,
      birth_date: birthDate,
      whatsapp,
      photo_url: photoUrl,
    };
    if (existing.length > 0) {
      await base44.entities.StudentProfile.update(existing[0].id, profileData);
    } else {
      await base44.entities.StudentProfile.create(profileData);
    }
    setSession({ ...session, name, bio, avatarColor, photoUrl });
    setSaving(false);
    setSaved(true);
    toast.success('Perfil atualizado!');
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-6 lg:p-8 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-foreground mb-6">Meu Perfil</h2>

      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-6">
        {/* Avatar / Photo */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            {photoUrl ? (
              <img src={photoUrl} alt="Foto" className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-background" />
            ) : (
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg"
                style={{ backgroundColor: avatarColor }}
              >
                {initials}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
              disabled={uploading}
            >
              {uploading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Camera size={14} />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
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
          <p className="text-xs text-muted-foreground">Cor do avatar e foto de perfil</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Nome completo</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome completo" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Data de nascimento</label>
              <Input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">WhatsApp</label>
              <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="(00) 00000-0000" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
            <Input value={session?.email || ''} disabled className="opacity-60" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Apresentação</label>
            <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Conte um pouco sobre você..." rows={3} />
          </div>
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