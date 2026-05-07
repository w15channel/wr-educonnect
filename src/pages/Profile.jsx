import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { getSession, setSession } from '@/lib/customAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Save, CheckCircle, Camera, User, Trash2, Link } from 'lucide-react';
import GoogleLinkModal from '@/components/auth/GoogleLinkModal';
import { toast } from 'sonner';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const AVATAR_COLORS = [
  '#5b5ef4', '#7c3aed', '#db2777', '#dc2626',
  '#ea580c', '#ca8a04', '#16a34a', '#0d9488',
  '#2563eb', '#0891b2', '#9333ea', '#c2410c',
];

const AVATARS = [
  { id: 'a1', emoji: '🧑‍🎓', label: 'Estudante' },
  { id: 'a2', emoji: '🧘', label: 'Zen' },
  { id: 'a3', emoji: '🌟', label: 'Estrela' },
  { id: 'a4', emoji: '🦋', label: 'Borboleta' },
  { id: 'a5', emoji: '🌸', label: 'Flor' },
  { id: 'a6', emoji: '🦁', label: 'Leão' },
  { id: 'a7', emoji: '🐬', label: 'Golfinho' },
  { id: 'a8', emoji: '🌈', label: 'Arco-íris' },
  { id: 'a9', emoji: '🔮', label: 'Cristal' },
  { id: 'a10', emoji: '🌻', label: 'Girassol' },
  { id: 'a11', emoji: '🦉', label: 'Coruja' },
  { id: 'a12', emoji: '🌊', label: 'Onda' },
];

export default function Profile() {
  const session = getSession();
  const { logout } = useCustomAuth();
  const [name, setName] = useState(session?.name || '');
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState(session?.bio || '');
  const [avatarColor, setAvatarColor] = useState(session?.avatarColor || '#5b5ef4');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState(session?.email || '');
  const [photoUrl, setPhotoUrl] = useState(session?.photoUrl || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showGoogleLink, setShowGoogleLink] = useState(false);
  const [googleLinked, setGoogleLinked] = useState(false);

  useEffect(() => {
    if (session?.codeId) {
      base44.entities.AccessCode.get(session.codeId).then(code => {
        if (code?.google_email) setGoogleLinked(code.google_email);
      });
    }
  }, [session?.codeId]);
  const fileRef = useRef();

  useEffect(() => {
    // CRITICAL: Only load profile if we have a unique codeId to identify this student.
    // Never filter by empty email — that would return another student's profile.
    if (!session?.codeId) return;

    base44.entities.StudentProfile.filter({ code_id: session.codeId }, '-created_date', 1)
      .then(profiles => {
        if (profiles.length > 0) {
          const p = profiles[0];
          setBirthDate(p.birth_date || '');
          setWhatsapp(p.whatsapp || '');
          setPhotoUrl(p.photo_url || session?.photoUrl || '');
          setAvatarColor(p.avatar_color || session?.avatarColor || '#5b5ef4');
          setName(p.full_name || session?.name || '');
          setBio(p.bio || session?.bio || '');
          setNickname(p.nickname || '');
          setSelectedAvatar(p.avatar_emoji || '');
          setEmail(p.email || session?.email || '');
        }
      });
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
    // Optimistic: update session immediately so UI reflects changes at once
    setSession({ ...session, name, bio, avatarColor, photoUrl });
    setSaved(true);
    try {
      if (session?.codeId) {
        await base44.entities.AccessCode.update(session.codeId, {
          profile_name: name,
          profile_bio: bio,
          profile_avatar_color: avatarColor,
          profile_photo_url: photoUrl,
        });
      }
      // Filter by codeId to avoid cross-student collisions when email is empty
      const existing = await base44.entities.StudentProfile.filter({ code_id: session?.codeId }, '-created_date', 1);
      const profileData = {
        code_id: session?.codeId,
        student_email: session?.email || '',
        full_name: name,
        nickname,
        bio,
        avatar_color: avatarColor,
        avatar_emoji: selectedAvatar,
        birth_date: birthDate,
        whatsapp,
        email,
        photo_url: photoUrl,
      };
      if (existing.length > 0) {
        await base44.entities.StudentProfile.update(existing[0].id, profileData);
      } else {
        await base44.entities.StudentProfile.create(profileData);
      }
      toast.success('Perfil atualizado!');
    } catch {
      // Rollback optimistic session update
      setSession(session);
      toast.error('Erro ao salvar perfil.');
    } finally {
      setSaving(false);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      if (session?.codeId) {
        await base44.entities.AccessCode.delete(session.codeId);
      }
      const profiles = await base44.entities.StudentProfile.filter({ student_email: session?.email }, '-created_date', 10);
      for (const p of profiles) {
        await base44.entities.StudentProfile.delete(p.id);
      }
      toast.success('Conta excluída.');
      logout();
    } catch {
      toast.error('Erro ao excluir conta. Tente novamente.');
      setDeleting(false);
    }
  };

  const avatarEl = selectedAvatar ? AVATARS.find(a => a.id === selectedAvatar) : null;

  return (
    <div className="p-4 lg:p-7 max-w-2xl mx-auto animate-fade-in-up">
      {showGoogleLink && (
        <GoogleLinkModal
          session={session}
          onClose={() => setShowGoogleLink(false)}
        />
      )}
      <div className="mb-6">
        <h2 className="text-xl lg:text-2xl font-bold text-foreground">Meu Perfil</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Personalize suas informações</p>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {/* Header with avatar */}
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-6 flex flex-col items-center gap-4 border-b border-border">
          {/* Avatar preview */}
          <div className="relative">
            {photoUrl ? (
              <img src={photoUrl} alt="Foto" className="w-24 h-24 rounded-2xl object-cover shadow-lg border-4 border-white ring-2 ring-primary/20" />
            ) : avatarEl ? (
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl shadow-lg border-4 border-white" style={{ backgroundColor: avatarColor }}>
                {avatarEl.emoji}
              </div>
            ) : (
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg border-4 border-white" style={{ backgroundColor: avatarColor }}>
                {initials}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
              disabled={uploading}
            >
              {uploading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Camera size={13} />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>

          <div className="text-center">
            <p className="font-bold text-foreground">{name || 'Seu Nome'}</p>
            {nickname && <p className="text-sm text-muted-foreground">"{nickname}"</p>}
          </div>

          {/* Color picker */}
          <div>
            <p className="text-[10px] text-muted-foreground text-center mb-2 font-semibold uppercase tracking-wider">Cor do Perfil</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {AVATAR_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setAvatarColor(color)}
                  className={`w-7 h-7 rounded-full border-3 transition-all hover:scale-110 ${avatarColor === color ? 'border-foreground scale-110 shadow-md' : 'border-transparent'}`}
                  style={{ backgroundColor: color, borderWidth: '2px' }}
                />
              ))}
            </div>
          </div>

          {/* Avatar emoji picker */}
          <div className="w-full">
            <p className="text-[10px] text-muted-foreground text-center mb-2 font-semibold uppercase tracking-wider">Avatar</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => setSelectedAvatar('')}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border-2 transition-all hover:scale-110 ${!selectedAvatar ? 'border-primary bg-primary/10' : 'border-transparent bg-secondary hover:bg-secondary/70'}`}
              >
                <User size={16} className="text-muted-foreground" />
              </button>
              {AVATARS.map(av => (
                <button
                  key={av.id}
                  onClick={() => setSelectedAvatar(av.id)}
                  title={av.label}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl border-2 transition-all hover:scale-110 ${selectedAvatar === av.id ? 'border-primary bg-primary/10 scale-110' : 'border-transparent bg-secondary hover:bg-secondary/70'}`}
                >
                  {av.emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Form fields */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">Nome Completo *</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome completo" />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">Apelido / Nickname</label>
              <Input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Como quer ser chamado(a)" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">Data de Nascimento</label>
              <Input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">WhatsApp</label>
              <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="(00) 00000-0000" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-foreground block mb-1.5">Email</label>
            <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
          </div>

          <div>
            <label className="text-xs font-bold text-foreground block mb-1.5">Apresentação Pessoal</label>
            <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Conte um pouco sobre você, sua jornada..." rows={3} />
          </div>

          {session?.code && (
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">Código de Acesso</label>
              <Input value={session.code} disabled className="font-mono text-center tracking-widest opacity-60 bg-secondary" />
              <p className="text-[10px] text-muted-foreground mt-1">Este é seu código exclusivo de acesso à plataforma</p>
            </div>
          )}

          {/* Google email link */}
          {session?.role === 'student' && (
            <div className="bg-gradient-to-r from-[#1db89e]/8 to-[#5b5ef4]/8 border border-[#1db89e]/20 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Link size={13} className="text-[#1db89e]" /> Email Google Vinculado
                  </p>
                  {googleLinked ? (
                    <p className="text-xs text-muted-foreground mt-0.5">{googleLinked}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-0.5">Nenhum email vinculado ainda</p>
                  )}
                </div>
                <button
                  onClick={() => setShowGoogleLink(true)}
                  className="text-xs font-bold text-[#1db89e] hover:underline"
                >
                  {googleLinked ? 'Alterar' : 'Vincular'}
                </button>
              </div>
            </div>
          )}

          <Button onClick={handleSave} disabled={saving} className="w-full h-11 font-bold gap-2">
            {saved ? <><CheckCircle size={16} /> Perfil Salvo!</> : <><Save size={16} /> {saving ? 'Salvando...' : 'Salvar Perfil'}</>}
          </Button>

          {session?.role === 'admin' && <div className="border-t border-border pt-4 mt-2">
            <p className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">Zona de Perigo</p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full h-10 text-destructive border-destructive/40 hover:bg-destructive/5 gap-2">
                  <Trash2 size={14} /> Excluir Minha Conta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação é irreversível. Seu código de acesso e todos os seus dados de perfil serão permanentemente removidos da plataforma.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  >
                    {deleting ? 'Excluindo...' : 'Sim, excluir minha conta'}
                  </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
                </AlertDialog>
                </div>}
                </div>
                </div>
                </div>
                );
}