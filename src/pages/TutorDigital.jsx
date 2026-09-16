import React, { useState } from 'react';
import { Navigate, useOutletContext } from 'react-router-dom';
import LunaChat from '@/components/luna/LunaChat';
import OperationsChat from '@/components/luna/OperationsChat';

/** Ferramenta da Luna — assistente do site e, para o admin, gerente de operações. */
export default function TutorDigital() {
  const { user: session } = useOutletContext();
  const isAdmin = session?.role === 'admin';
  const [mode, setMode] = useState(isAdmin ? 'operations' : 'assistant');

  if (!isAdmin) return <Navigate to="/student/chat?tab=luna" replace />;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {isAdmin && (
        <div className="flex shrink-0 gap-1 border-b border-border bg-card px-3 py-2">
          {[{ id: 'operations', label: 'Gerente de Operações' }, { id: 'assistant', label: 'Assistente' }].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMode(tab.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${mode === tab.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
      {isAdmin && mode === 'operations' ? <OperationsChat session={session} /> : <LunaChat session={session} />}
    </div>
  );
}