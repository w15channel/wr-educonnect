import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ClipboardCheck, ArrowLeft } from 'lucide-react';

/**
 * Caminho de volta do checklist: quando o aluno sai do checklist para cumprir um
 * requisito, a página recebe ?checklist=<módulo> e esta barra o traz de volta.
 */
export default function ChecklistReturnBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const moduleNumber = new URLSearchParams(location.search).get('checklist');
  if (!moduleNumber || location.pathname.endsWith('/checklist')) return null;

  const parts = location.pathname.split('/').filter(Boolean);
  const prefix = parts[0] === 'student' || parts[0] === 'adm' ? `/${parts[0]}` : '';

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 px-3 w-full max-w-md">
      <button
        type="button"
        onClick={() => navigate(`${prefix}/checklist?module=${moduleNumber}`)}
        className="w-full flex items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary px-4 py-3 text-xs font-bold text-primary-foreground shadow-lg hover:opacity-90 transition-opacity"
      >
        <ArrowLeft size={14} />
        <ClipboardCheck size={14} />
        Voltar ao Checklist do Módulo {moduleNumber}
      </button>
    </div>
  );
}