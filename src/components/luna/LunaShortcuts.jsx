import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { LUNA_TOOL_PATHS } from '@/lib/lunaPersona';

/** Atalhos que a Luna oferece após explicar uma ferramenta do site. */
export default function LunaShortcuts({ links = [], onNavigate }) {
  const navigate = useNavigate();
  const location = useLocation();
  const first = location.pathname.split('/').filter(Boolean)[0];
  const prefix = first === 'student' || first === 'adm' ? `/${first}` : '/student';

  const valid = links.filter((link) => LUNA_TOOL_PATHS[link?.key]);
  if (!valid.length) return null;

  return (
    <div className="ml-8 flex flex-wrap gap-2">
      {valid.map((link) => (
        <button
          key={link.key}
          type="button"
          onClick={() => {
            onNavigate?.();
            navigate(`${prefix}${LUNA_TOOL_PATHS[link.key]}`);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/70 bg-amber-400/15 px-3 py-1.5 text-[11px] font-bold text-amber-700 transition-colors hover:bg-amber-400/25 dark:text-amber-300"
        >
          {link.label || 'Abrir ferramenta'}
          <ArrowRight size={12} />
        </button>
      ))}
    </div>
  );
}