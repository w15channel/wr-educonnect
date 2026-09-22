import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { getSession, setSession } from '@/lib/customAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Save, CheckCircle, Camera, User, Trash2, GraduationCap, Users, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { AVATAR_OPTIONS, getInitials, resolveAvatarEmoji } from '@/lib/avatarUtils';
import { functionLabel } from '@/lib/profileRoles';
import { invalidateStudentIdentity } from '@/lib/studentIdentityCache';
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

export default function Profile() {
  const session = getSession();
  const { logout } = useCustomAuth();
  const queryClient = useQueryClient();
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
  const [deleting, setDeleting] = useState(false);
  const [studyMode, setStudyMode] = useState(session?.study_mode || 'interativa');
  const fileRef = useRef();


  useEffect(() => {
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
          setSelectedAvatar(p.avatar_emoji || session?.avatarEmoji || '');
          setEmail(p.email || session?.email || '');
          setStudyMode(p.study_mode || session?.study_mode || 'interativa');
        }
      });
  }, []);

  const initials = getInitials(name);

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
    setSession({ ...session, name, nickname: nickname.trim(), bio, avatarColor, photoUrl, avatarEmoji: selectedAvatar, study_mode: studyMode });
    setSaved(true);
    try {
      if (session?.codeId) {
        await base44.entities.AccessCode.update(session.codeId, {
          profile_name: name,
          profile_bio: bio,
          profile_avatar_color: avatarColor,
          profile_avatar_emoji: selectedAvatar,
          profile_photo_url: photoUrl,
          student_name: name,
          student_email: email,
        });
      }
      const existing = await base44.entities.StudentProfile.filter({ code_id: session?.codeId }, '-created_date', 1);
      const profileData = {
        code_id: session?.codeId,
        student_email: session?.email || '',
        full_name: name,
        nickname,
        bio,
        avatar_color: avatarColor,
        avatar_emoji: selectedAvatar,
        study_mode: studyMode,
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
      await invalidateStudentIdentity(queryClient);
      toast.success('Perfil atualizado!');
    } catch {
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

  const avatarEmoji = resolveAvatarEmoji(selectedAvatar);

  return (
    <div className="app-page max-w-2xl mx-auto animate-fade-in-up">
      <div className="mb-6">
        <h2 className="text-xl lg:text-2xl font-bold text-foreground">Meu Perfil</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Personalize suas informações e modalidade de estudo</p>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {/* Header with avatar */}
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-6 flex flex-col items-center gap-4 border-b border-border">
          <div className="relative">
            {photoUrl ? (
              <img src={photoUrl} alt="Foto" className="w-24 h-24 rounded-2xl object-cover shadow-lg border-4 border-white ring-2 ring-primary/20" />
            ) : avatarEmoji ? (
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl shadow-lg border-4 border-white" style={{ backgroundColor: avatarColor }}>
                {avatarEmoji}
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
            <span className="mt-2 inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              Função: {functionLabel(session?.profileCategory, session?.role)}
            </span>
          </div>

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

          <div className="w-full">
            <p className="text-[10px] text-muted-foreground text-center mb-2 font-semibold uppercase tracking-wider">Avatar</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => setSelectedAvatar('')}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border-2 transition-all hover:scale-110 ${!selectedAvatar ? 'border-primary bg-primary/10' : 'border-transparent bg-secondary hover:bg-secondary/70'}`}
              >
                <User size={16} className="text-muted-foreground" />
              </button>
              {AVATAR_OPTIONS.map(av => (
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

          <Button onClick={handleSave} disabled={saving} className="w-full h-11 font-bold gap-2">
            {saved ? <><CheckCircle size={16} /> Perfil Salvo!</> : <><Save size={16} /> {saving ? 'Salvando...' : 'Salvar Perfil'}</>}
          </Button>
        </div>
      </div>

      {/* Modalidade de Estudo */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden mt-4">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <GraduationCap size={18} className="text-primary" />
            <h3 className="font-bold text-sm text-foreground">Modalidade de Estudo</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Escolha como prefere experienciar o curso</p>
        </div>
        <div className="p-5 space-y-3">
          {/* Interativa (Completa) */}
          <button
            onClick={() => setStudyMode('interativa')}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${studyMode === 'interativa' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${studyMode === 'interativa' ? 'bg-primary/15' : 'bg-secondary'}`}>
                <Users size={18} className={studyMode === 'interativa' ? 'text-primary' : 'text-muted-foreground'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-foreground">Formação Prática (Completa)</p>
                <p className="text-xs text-muted-foreground">Vivência completa com comunidade, debates e prática terapêutica</p>
              </div>
              {studyMode === 'interativa' && <CheckCircle size={18} className="text-primary shrink-0" />}
            </div>
            <div className="flex flex-wrap gap-1.5 pl-13">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">Mural & Debates</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">Ofensivas Diárias</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">Terapeuta da Semana</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">Ranking & Monitores</span>
            </div>
          </button>

          {/* Diploma (Simplificada) */}
          <button
            onClick={() => setStudyMode('diploma')}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${studyMode === 'diploma' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${studyMode === 'diploma' ? 'bg-primary/15' : 'bg-secondary'}`}>
                <GraduationCap size={18} className={studyMode === 'diploma' ? 'text-primary' : 'text-muted-foreground'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-foreground">Experiência Simplificada (Diploma)</p>
                <p className="text-xs text-muted-foreground">Foco no conteúdo essencial, no seu próprio ritmo</p>
              </div>
              {studyMode === 'diploma' && <CheckCircle size={18} className="text-primary shrink-0" />}
            </div>
            <div className="flex flex-wrap gap-1.5 pl-13">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">Aulas & Apostila</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">Tarefas & Provas</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">Certificação</span>
            </div>
          </button>

          <div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-secondary/40 rounded-lg p-3">
            <Sparkles size={13} className="shrink-0 mt-0.5 text-primary/60" />
            <span>A mudança de modalidade entra em vigor na próxima vez que você entrar no curso. Seu progresso acadêmico é preservado em ambos os modos. Clique em "Salvar Perfil" para confirmar.</span>
          </div>
        </div>
      </div>

      {session?.role === 'admin' && <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden mt-4">
        <div className="p-5 border-b border-border">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Zona de Perigo</p>
        </div>
        <div className="p-5">
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
        </div>
      </div>}
    </div>
  );
}
