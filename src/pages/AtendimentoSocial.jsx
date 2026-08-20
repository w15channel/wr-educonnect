import React from 'react';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const G = '#d4b96a';
const BG = '#07080f';
const BG2 = '#0a0c18';
const BG3 = '#0f1220';

export default function AtendimentoSocial() {
  return (
    <main className="site-page scrollbar-invisible text-primary-foreground" style={{ background: BG }}>
      <section className="site-section" style={{ background: BG2 }}>
        <div className="max-w-5xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary-foreground/50 hover:text-primary-foreground/75 transition-colors mb-8">
            <ArrowLeft size={12} /> Voltar para home
          </Link>

          <div className="border p-8" style={{ borderColor: `${G}20`, background: BG3 }}>
            <p className="text-[11px] uppercase tracking-[0.3em] text-primary-foreground/35 mb-4">Atendimento Social</p>
            <h1 className="text-4xl font-thin leading-tight mb-5">Cuidado sério,<span className="block font-light italic" style={{ color: G }}>seguro e acessível.</span></h1>
            <p className="text-primary-foreground/40 text-sm leading-relaxed mb-8">
              Um espaço de acolhimento terapêutico social para promover saúde comportamental, ampliar o acesso ao cuidado e permitir que profissionais em capacitação desenvolvam sua prática com seriedade, supervisão e responsabilidade humana.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              {[['R$ 35', 'por consulta'], ['5 perguntas', 'triagem inicial'], ['48h', 'retorno com Pix']].map(([value, label]) => (
                <div key={value} className="border p-4" style={{ borderColor: `${G}15` }}>
                  <p className="text-2xl font-light">{value}</p>
                  <p className="text-xs text-primary-foreground/30 mt-1 uppercase tracking-[0.15em]">{label}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3 mb-8">
              {[
                'Você responde uma entrevista curta pelo chat com 5 perguntas.',
                'Escolhe data e horário disponíveis no mês vigente.',
                'Nossa equipe entra em contato em até 48 horas pelo WhatsApp.',
                'O atendente envia o código Pix de R$ 35,00 para confirmar a consulta.'
              ].map((item, index) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="w-6 h-6 border flex items-center justify-center text-[10px]" style={{ borderColor: `${G}40`, color: G }}>{index + 1}</div>
                  <p className="text-sm text-primary-foreground/45">{item}</p>
                </div>
              ))}
            </div>

            <a href="https://wa.me/5541992531598" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 border px-7 py-3 text-xs uppercase tracking-[0.2em] font-medium transition-all"
              style={{ borderColor: `${G}60`, color: G }}>
              <MessageCircle size={13} /> Falar com atendimento social
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
