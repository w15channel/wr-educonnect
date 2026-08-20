import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { MessageCircle, Phone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { getAvatarPrefixedName, getInitials, resolveAvatarEmoji } from '@/lib/avatarUtils';

/**
 * Popup card that shows a student's profile summary.
 * Usage:
 *   <StudentProfileCard email="student@example.com" onClose={() => ...} />
 *
 * Or wrap any name/element with the hook version:
 *   <ClickableStudent email="...">Nome do Aluno</ClickableStudent>
 */
export function ClickableStudent({ email, children, className = '' }) {
  const [show, setShow] = useState(false);
  if (!email) return <span className={className}>{children}</span>;
  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setShow(true); }}
        className={`hover:underline cursor-pointer transition-opacity hover:opacity-80 ${className}`}
      >
        {children}
      </button>
      {show && <StudentProfileCard email={email} onClose={() => setShow(false)} />}
    </>
  );
}

export default function StudentProfileCard({ email, onClose }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [code, setCode] = useState(null);

  useEffect(() => {
    if (!email) return;
    // Load access code (has avatar color, photo, name)
    base44.entities.AccessCode.filter({ student_email: email }, '-created_date', 1)
      .then(r => { if (r.length > 0) setCode(r[0]); });
    // Load full StudentProfile (has whatsapp, bio, etc.)
    base44.entities.StudentProfile.filter({ student_email: email }, '-created_date', 1)
      .then(r => { if (r.length > 0) setProfile(r[0]); });
  }, [email]);

  const name = profile?.full_name || code?.profile_name || code?.student_name || email;
  const publicName = getAvatarPrefixedName(name, profile?.avatar_emoji || code?.profile_avatar_emoji);
  const photo = profile?.photo_url || code?.profile_photo_url || '';
  const color = profile?.avatar_color || code?.profile_avatar_color || '#5b5ef4';
  const avatarEmoji = resolveAvatarEmoji(profile?.avatar_emoji || code?.profile_avatar_emoji);
  const bio = profile?.bio || code?.profile_bio || '';
  const whatsapp = profile?.whatsapp || '';
  const nickname = profile?.nickname || '';
  const publicEmail = profile?.email || code?.student_email || email;
  const birthDate = profile?.birth_date || '';
  const lastSeen = code?.last_seen_at ? new Date(code.last_seen_at) : null;
  const isOnline = code?.is_online && lastSeen && Date.now() - lastSeen.getTime() < 90000;
  const lastSeenText = isOnline ? 'Online agora' : lastSeen ? `Visto por último em ${lastSeen.toLocaleDateString('pt-BR')} às ${lastSeen.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Visto por último indisponível';
  const initials = getInitials(name);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Card */}
      <div
        className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header strip using user's chosen color */}
        <div className="h-20 w-full" style={{ background: `linear-gradient(135deg, ${color}cc, ${color}66)` }} />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/30 flex items-center justify-center text-white hover:bg-black/50 transition-colors"
        >
          <X size={13} />
        </button>

        {/* Avatar */}
        <div className="flex flex-col items-center -mt-10 pb-5 px-5">
          {photo ? (
            <div className="relative">
              <img src={photo} alt={name} className="w-20 h-20 rounded-full object-cover border-4 border-card shadow-lg" />
              {avatarEmoji && <span className="absolute -bottom-1 -right-1 text-xl">{avatarEmoji}</span>}
            </div>
          ) : (
            <div
              className="w-20 h-20 rounded-full border-4 border-card shadow-lg flex items-center justify-center font-black text-2xl text-white"
              style={{ backgroundColor: color }}
            >
              {avatarEmoji || initials}
            </div>
          )}

          <h3 className="mt-3 font-bold text-foreground text-base text-center leading-tight">{publicName}</h3>
          {nickname && <p className="text-sm text-muted-foreground mt-0.5">"{nickname}"</p>}
          <p className={`text-[11px] font-semibold mt-1 ${isOnline ? 'text-green-600' : 'text-red-500'}`}>{isOnline ? '🟢' : '🔴'} {lastSeenText}</p>

          {bio && (
            <p className="text-xs text-muted-foreground text-center mt-2 leading-relaxed whitespace-pre-wrap">{bio}</p>
          )}

          <div className="mt-3 grid w-full grid-cols-1 gap-2 text-left">
            {publicEmail && (
              <div className="rounded-xl border border-border bg-secondary/30 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">E-mail</p>
                <p className="text-xs font-semibold text-foreground break-all">{publicEmail}</p>
              </div>
            )}
            {birthDate && (
              <div className="rounded-xl border border-border bg-secondary/30 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Nascimento</p>
                <p className="text-xs font-semibold text-foreground">{format(new Date(`${birthDate}T12:00:00`), 'dd/MM/yyyy')}</p>
              </div>
            )}
          </div>

          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center gap-2 text-xs text-green-600 font-semibold bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl hover:bg-green-100 transition-colors"
            >
              <Phone size={12} /> {whatsapp}
            </a>
          )}

          <div className="flex gap-2 mt-4 w-full">
            <Button
              className="flex-1 h-9 text-xs gap-1.5"
              onClick={() => { navigate(`../dm/${encodeURIComponent(email)}`); onClose(); }}
            >
              <MessageCircle size={13} /> Mensagem
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}