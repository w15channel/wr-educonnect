import React from 'react';
import { HeartHandshake } from 'lucide-react';

const G = '#d4b96a';

export default function SocialInitiativeNotice({ compact = false, className = '' }) {
  return (
    <div
      className={`rounded-2xl border bg-[#1db89e]/[0.06] p-4 ${className}`}
      style={{ borderColor: 'rgba(29,184,158,0.24)' }}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1db89e]/12 text-[#1db89e]">
          <HeartHandshake size={16} />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1db89e]">Diferencial social</p>
          <p className={`mt-1 ${compact ? 'text-xs' : 'text-sm'} leading-relaxed text-primary-foreground/62 font-light`}>
            Alunos selecionados por grupos de encaminhamento e pelo projeto <strong className="font-semibold text-primary-foreground/82">ABERTAMENTE</strong> podem estudar com contribuição mensal pessoal e voluntária, sem valor mínimo estipulado, dentro de suas possibilidades financeiras.
          </p>
          {!compact && (
            <p className="mt-2 text-xs leading-relaxed text-primary-foreground/42 font-light">
              Como instituto, asseguramos que não haverá cobranças posteriores nem qualquer distinção financeira ou social entre participantes. Simpatizantes também podem apoiar com doações mensais de valor livre, ajudando a manter o projeto e abrir novas vagas.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
