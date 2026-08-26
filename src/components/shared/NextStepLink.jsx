import React from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * Atalho de continuidade entre as atividades principais: leva o aluno de uma
 * etapa concluída direto para a próxima, sem sair da plataforma.
 */
export default function NextStepLink({ to, icon: Icon, title, description, tone = 'primary', size = 'default' }) {
  const location = useLocation();
  const base = location.pathname.split('/').filter(Boolean)[0];
  const prefix = base === 'adm' || base === 'student' ? `/${base}` : '';

  const tones = {
    primary: 'border-primary/25 bg-primary/10 hover:bg-primary/20 text-primary',
    orange: 'border-orange-500/25 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500',
  };

  if (size === 'sm') {
    return (
      <Link
        to={`${prefix}${to}`}
        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors ${tones[tone]}`}
      >
        {Icon && <Icon size={13} />} {title}
      </Link>
    );
  }

  return (
    <Link to={`${prefix}${to}`} className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${tones[tone]}`}>
      {Icon && <Icon size={16} className="mt-0.5 shrink-0" />}
      <div className="text-left">
        <p className="text-sm font-bold">{title}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    </Link>
  );
}