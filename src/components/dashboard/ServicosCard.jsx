import React, { useState } from 'react';
import { Brain, CalendarHeart, X, ExternalLink } from 'lucide-react';
import ServiceRequestChatModal from './ServiceRequestChatModal';

const CALENDLY_URL = 'https://calendly.com/wrterapia/atendimentos';

function CalendlyModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
        style={{ height: '90vh', maxHeight: '700px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-[#5b5ef4]/5 to-[#1db89e]/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5b5ef4] to-[#1db89e] flex items-center justify-center shadow-md">
              <CalendarHeart size={18} className="text-white" />
            </div>
            <div>
              <p className="font-black text-sm text-foreground">Agendamento W.Ribeiro</p>
              <p className="text-xs text-muted-foreground">Mentoria & Terapia Particular</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border px-3 py-1.5 rounded-xl hover:bg-secondary transition-colors"
            >
              <ExternalLink size={12} /> Abrir em nova aba
            </a>
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Calendly iframe */}
        <div className="flex-1 min-h-0">
          <iframe
            src={CALENDLY_URL}
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            title="Agendamento Calendly"
            allow="payment"
          />
        </div>
      </div>
    </div>
  );
}

export default function ServicosCard() {
  const [activeService, setActiveService] = useState(null);

  return (
    <>
      <div className="rounded-2xl overflow-hidden border border-white/8 bg-gradient-to-br from-[#0f0c29] via-[#1a1060] to-[#0d2020]">
        {/* Header */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
              <CalendarHeart size={14} className="text-[#a78bfa]" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#a78bfa]">Desenvolvimento Individual</p>
          </div>
          <h3 className="text-base font-black text-white leading-snug">
            Vá além da turma — cresça com atenção exclusiva
          </h3>
          <p className="text-xs text-white/50 mt-1">
            Sessões individuais com W.Ribeiro · <span className="text-[#d4b96a] font-semibold">R$ 45,00/hora</span>
          </p>
        </div>

        {/* Divider */}
        <div className="mx-5 border-t border-white/8 mb-4" />

        {/* Service cards */}
        <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Mentoria */}
          <button
            onClick={() => setActiveService('Mentoria Particular')}
            className="group flex flex-col gap-3 bg-white/5 hover:bg-[#5b5ef4]/20 border border-[#5b5ef4]/25 hover:border-[#5b5ef4]/60 text-white rounded-2xl p-4 hover:shadow-xl hover:shadow-[#5b5ef4]/15 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5b5ef4] to-[#7c3aed] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-[#5b5ef4]/30">
                <Brain size={20} className="text-white" />
              </div>
              <div>
                <p className="font-black text-sm leading-tight">Mentoria Particular</p>
                <p className="text-[10px] text-[#a78bfa] font-semibold mt-0.5">Aprenda na prática · 1:1 com W.Ribeiro</p>
              </div>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              Resolva dúvidas específicas e viva uma experiência real de aprendizado direto com o professor. Cada sessão é personalizada para o seu momento.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#a78bfa] mt-auto">
              <span>Contratar Mentoria</span>
              <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
            </div>
          </button>

          {/* Terapia */}
          <button
            onClick={() => setActiveService('Terapia Particular')}
            className="group flex flex-col gap-3 bg-white/5 hover:bg-[#1db89e]/15 border border-[#1db89e]/25 hover:border-[#1db89e]/60 text-white rounded-2xl p-4 hover:shadow-xl hover:shadow-[#1db89e]/15 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1db89e] to-[#059669] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-[#1db89e]/30">
                <CalendarHeart size={20} className="text-white" />
              </div>
              <div>
                <p className="font-black text-sm leading-tight">Terapia Particular</p>
                <p className="text-[10px] text-[#34d399] font-semibold mt-0.5">Supere bloqueios · Desenvolvimento pleno</p>
              </div>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              Para quem quer superar dores, dificuldades e limitações que travam o crescimento. Sessões individuais para você se tornar mais completo e preparado.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#34d399] mt-auto">
              <span>Reservar Terapia</span>
              <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
            </div>
          </button>
        </div>
      </div>

      {activeService && <ServiceRequestChatModal serviceLabel={activeService} onClose={() => setActiveService(null)} />}
    </>
  );
}