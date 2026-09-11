import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import LunaChat from '@/components/luna/LunaChat';

/**
 * Botão circular da Luna (ao lado da lâmpada de tema): abre a sobreposição
 * onde ela responde qualquer dúvida do site e oferece apoio emocional.
 */
export default function LunaLauncher() {
  const { session } = useCustomAuth();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Falar com a Luna"
        aria-label="Falar com a Luna, assistente do site"
        className="luna-orb"
      >
        <span className="luna-orb__halo" aria-hidden="true" />
        <span className="luna-orb__face" role="img" aria-hidden="true">🦉</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[130] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="flex h-[88dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border-2 border-amber-300/70 bg-background shadow-2xl sm:h-[80dvh] sm:rounded-3xl">
            <div className="flex shrink-0 items-center justify-end border-b border-border px-2 py-1.5">
              <button onClick={() => setOpen(false)} className="rounded-xl p-2 text-muted-foreground hover:text-foreground" aria-label="Fechar conversa">
                <X size={18} />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <LunaChat session={session} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}