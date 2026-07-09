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
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#5b5ef4] to-[#1db89e] flex items-center justify-center">
            <CalendarHeart size={16} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground">Contratação de Serviço</h3>
            <p className="text-xs text-muted-foreground">Sessões individuais com W.Ribeiro · R$ 45,00/hora</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => setActiveService('Mentoria Particular')}
            className="group flex items-center gap-3 bg-gradient-to-br from-[#5b5ef4] to-[#7c3aed] text-white rounded-2xl p-4 hover:shadow-xl hover:shadow-[#5b5ef4]/25 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Brain size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm leading-tight">Adquirir Mentoria Particular</p>
              <p className="text-white/70 text-xs mt-0.5">Sessão individual de mentoria</p>
            </div>
          </button>

          <button
            onClick={() => setActiveService('Terapia Particular')}
            className="group flex items-center gap-3 bg-gradient-to-br from-[#1db89e] to-[#059669] text-white rounded-2xl p-4 hover:shadow-xl hover:shadow-[#1db89e]/25 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <CalendarHeart size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm leading-tight">Reservar Terapia Particular</p>
              <p className="text-white/70 text-xs mt-0.5">Sessão terapêutica individual</p>
            </div>
          </button>
        </div>
      </div>

      {activeService && <ServiceRequestChatModal serviceLabel={activeService} onClose={() => setActiveService(null)} />}
    </>
  );
}