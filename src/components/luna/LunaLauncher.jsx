import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Atalho da Luna na sidebar (ao lado da lâmpada de tema): leva o aluno
 * direto para a ferramenta da Luna em /tutor.
 */
export default function LunaLauncher() {
  const navigate = useNavigate();
  const location = useLocation();
  const first = location.pathname.split('/').filter(Boolean)[0];
  const prefix = first === 'student' || first === 'adm' ? `/${first}` : '/student';

  return (
    <button
      type="button"
      onClick={() => navigate(`${prefix}/tutor`)}
      title="Falar com a Luna"
      aria-label="Abrir a Luna, assistente do site"
      className="luna-orb"
    >
      <span className="luna-orb__halo" aria-hidden="true" />
      <span className="luna-orb__face" role="img" aria-hidden="true">🦉</span>
    </button>
  );
}