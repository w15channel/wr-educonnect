import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { getSession, setSession } from '@/lib/customAuth';
import { Button } from '@/components/ui/button';
import { GraduationCap, Users, CheckCircle, Save } from 'lucide-react';
import { toast } from 'sonner';

const OPTIONS = [
  {
    value: 'diploma',
    icon: GraduationCap,
    title: 'Experiência Simplificada (Diploma)',
    summary: 'Foco direto no conteúdo essencial, com rotina enxuta e estudo no seu próprio ritmo.',
    bullets: [
      'Videoaulas, apostila e tarefas em um caminho objetivo',
      'Navegação simplificada, com menos distrações',
      'Ideal para quem concilia o curso com uma rotina corrida',
      'Mesma certificação ao concluir os requisitos do curso',
    ],
  },
  {
    value: 'interativa',
    icon: Users,
    title: 'Formação Prática (Completa)',
    summary: 'Vivência completa, com prática contínua e participação ativa na comunidade.',
    bullets: [
      'Inclui tudo da experiência simplificada',
      'Comunidade, sala de debates, ofensivas e tutor digital',
      'Mentorias, terapeuta da semana e ranking da turma',
      'Mais prática aplicada e preparação profissional',
    ],
  },
];

/**
 * Perfil de Estudos — ferramenta dedicada a explicar os dois modelos de
 * formação e registrar a escolha do aluno. Ao salvar, o aluno é reconduzido
 * ao lobby: é preciso ingressar novamente para ativar o novo perfil.
 */
export default function StudyProfile() {
  const session = getSession();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(session?.study_mode || 'interativa');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session?.codeId) return;
    base44.entities.StudentProfile.filter({ code_id: session.codeId }, '-created_date', 1)
      .then((profiles) => {
        if (profiles.length > 0 && profiles[0].study_mode) setSelected(profiles[0].study_mode);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (session?.codeId) {
        const existing = await base44.entities.StudentProfile.filter({ code_id: session.codeId }, '-created_date', 1);
        if (existing.length > 0) {
          await base44.entities.StudentProfile.update(existing[0].id, { study_mode: selected });
        } else {
          await base44.entities.StudentProfile.create({
            code_id: session.codeId,
            student_email: session?.email || '',
            full_name: session?.name || '',
            study_mode: selected,
          });
        }
      }
      setSession({ ...(getSession() || {}), study_mode: selected });
      toast.success('Perfil de estudos salvo! Ingresse novamente para ativar.');
      navigate('/lobby');
    } catch {
      toast.error('Não foi possível salvar o perfil de estudos.');
      setSaving(false);
    }
  };

  return (
    <div className="app-page max-w-3xl mx-auto animate-fade-in-up">
      <div className="mb-5">
        <h2 className="text-xl lg:text-2xl font-bold text-foreground">Perfil de Estudos</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Aqui você escolhe como quer viver a sua formação. Leia as duas propostas e selecione a que
          combina com o seu momento — você pode trocar quando quiser.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {OPTIONS.map((option) => {
          const active = selected === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelected(option.value)}
              className={`text-left p-4 rounded-2xl border-2 transition-all bg-card ${active ? 'border-primary shadow-md' : 'border-border hover:border-primary/40'}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <option.icon size={20} className={active ? 'text-primary' : 'text-muted-foreground'} />
                <span className={`text-xs font-bold uppercase tracking-wide ${active ? 'text-primary' : 'text-foreground'}`}>
                  {option.title}
                </span>
                {active && <CheckCircle size={16} className="ml-auto text-primary" />}
              </div>
              <p className="text-[12px] text-muted-foreground leading-relaxed mb-2.5">{option.summary}</p>
              <ul className="text-[11px] text-muted-foreground leading-relaxed space-y-1">
                {option.bullets.map((bullet) => <li key={bullet}>• {bullet}</li>)}
              </ul>
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-2xl border border-border bg-card p-4">
        <p className="text-[12px] text-muted-foreground">
          Ao salvar, você será reconduzido ao lobby. Basta ingressar novamente para que o novo perfil
          de estudos seja ativado na plataforma.
        </p>
        <Button onClick={handleSave} disabled={saving} className="w-full h-11 mt-3 font-bold gap-2">
          <Save size={16} /> {saving ? 'Salvando...' : 'Salvar perfil de estudos'}
        </Button>
      </div>
    </div>
  );
}