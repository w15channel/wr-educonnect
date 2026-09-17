import React, { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getSession, setSession } from '@/lib/customAuth';
import { toast } from 'sonner';
import { ArrowRight, Volume2, VolumeX, RotateCcw, Loader2, CheckCircle2 } from 'lucide-react';
import useLunaVoice from '@/hooks/useLunaVoice';
import ProfileAssistantField from '@/components/onboarding/ProfileAssistantField';
import { findStudentProfiles, profileDoneKey } from '@/hooks/useProfileCompletion';

/**
 * Assistente Luna do cadastro: no primeiro acesso à área do curso, pede
 * item por item os dados obrigatórios do perfil (todos, menos a foto), com
 * explicação falada em voz alta. Só libera a plataforma ao concluir.
 */
export default function ProfileAssistant({ session, profile, steps, initialValues, onFinish }) {
  const queryClient = useQueryClient();
  const voice = useLunaVoice();
  const [index, setIndex] = useState(0);
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const step = steps[index];
  const firstName = String(session?.name || 'aluno').split(' ')[0];
  const script = useMemo(() => {
    if (!step) return '';
    const intro = index === 0
      ? `Olá ${firstName}! Eu sou a Luna e vou te ajudar a completar o seu cadastro. São ${steps.length} perguntas, uma por vez.`
      : 'Muito bem! Vamos para a próxima.';
    return `${intro} ${step.question} ${step.help}`;
  }, [step, index, steps.length, firstName]);

  useEffect(() => {
    if (script) voice.speak(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [script]);

  const setValue = (value) => {
    setValues((prev) => ({ ...prev, [step.key]: value }));
    setError('');
  };

  const persist = async (finalValues) => {
    const current = getSession();
    setSaving(true);
    try {
      if (current?.codeId) {
        await base44.entities.AccessCode.update(current.codeId, {
          profile_name: finalValues.full_name,
          profile_bio: finalValues.bio,
          profile_avatar_color: finalValues.avatar_color,
          profile_avatar_emoji: finalValues.avatar_emoji,
          student_name: finalValues.full_name,
          student_email: finalValues.email,
        });
      }
      const profileData = {
        code_id: current?.codeId,
        student_email: current?.email || finalValues.email || '',
        full_name: finalValues.full_name,
        nickname: finalValues.nickname,
        bio: finalValues.bio,
        avatar_color: finalValues.avatar_color,
        avatar_emoji: finalValues.avatar_emoji,
        birth_date: finalValues.birth_date,
        whatsapp: finalValues.whatsapp,
        email: finalValues.email,
      };
      // Nunca criar um segundo cadastro: se já existe qualquer registro do aluno,
      // ele é atualizado e recebe o vínculo do código de acesso.
      const existing = profile?.id ? [profile] : await findStudentProfiles(current);
      if (existing[0]?.id) {
        await base44.entities.StudentProfile.update(existing[0].id, profileData);
      } else {
        await base44.entities.StudentProfile.create(profileData);
      }
      if (current?.codeId) localStorage.setItem(profileDoneKey(current.codeId), '1');
      setSession({
        ...current,
        name: finalValues.full_name,
        bio: finalValues.bio,
        avatarColor: finalValues.avatar_color,
        avatarEmoji: finalValues.avatar_emoji,
      });
      await queryClient.invalidateQueries({ queryKey: ['profile-completion'] });
      voice.speak(`Cadastro completo, ${firstName}! Obrigada. Agora você já pode usar a plataforma.`, { force: voice.enabled });
      toast.success('Cadastro completo!');
      onFinish();
    } catch {
      toast.error('Não conseguimos salvar. Verifique sua internet e tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    if (!step.validate(values[step.key])) {
      setError(step.error);
      voice.speak(step.error);
      return;
    }
    voice.stop();
    if (index < steps.length - 1) {
      setIndex((prev) => prev + 1);
      return;
    }
    persist(values);
  };

  if (!step) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm">
      <div className="max-h-[94dvh] w-full max-w-md overflow-y-auto rounded-3xl border-2 border-amber-300/70 bg-background p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="ofensiva-owl shrink-0 text-4xl" role="img" aria-label="Luna, assistente do site">🦉</div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-wide text-amber-600 dark:text-amber-300">
              Luna · Cadastro · {index + 1} de {steps.length}
            </p>
            <p className="mt-1 text-[15px] font-black leading-snug text-foreground">
              {step.emoji} {step.question}
            </p>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">{step.help}</p>
          </div>
        </div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${(index / steps.length) * 100}%` }} />
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-foreground">{step.label}</label>
          <ProfileAssistantField step={step} value={values[step.key] || ''} onChange={setValue} />
          {error && <p className="mt-2 text-xs font-bold text-destructive">{error}</p>}
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={saving}
          className="mt-4 flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-sm font-black text-primary-foreground disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : index === steps.length - 1 ? <CheckCircle2 size={16} /> : <ArrowRight size={16} />}
          {saving ? 'Salvando...' : index === steps.length - 1 ? 'Concluir meu cadastro' : 'Confirmar e continuar'}
        </button>

        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={voice.toggle}
            className={`flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border px-2 text-[11.5px] font-bold ${
              voice.enabled ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300' : 'border-border bg-background text-muted-foreground'
            }`}
          >
            {voice.enabled ? <Volume2 size={14} /> : <VolumeX size={14} />} {voice.enabled ? 'Voz ligada' : 'Ligar voz'}
          </button>
          <button
            type="button"
            onClick={() => voice.speak(script, { force: true })}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border border-border bg-background px-2 text-[11.5px] font-bold text-foreground"
          >
            <RotateCcw size={14} /> Ouvir de novo
          </button>
        </div>

        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          O cadastro é obrigatório para o seu certificado. A foto do perfil é opcional e pode ser enviada depois.
        </p>
      </div>
    </div>
  );
}