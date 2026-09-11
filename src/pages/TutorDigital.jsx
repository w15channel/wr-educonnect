import React from 'react';
import { useOutletContext } from 'react-router-dom';
import LunaChat from '@/components/luna/LunaChat';

/** Ferramenta da Luna — a inteligência artificial interna da plataforma. */
export default function TutorDigital() {
  const { user: session } = useOutletContext();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <LunaChat session={session} />
    </div>
  );
}