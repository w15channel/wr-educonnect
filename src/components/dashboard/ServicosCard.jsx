import React, { useState } from 'react';
import { ArrowRight, Check, ChevronDown, Crown, HeartPulse, Sparkles, Trophy } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import ServiceRequestChatModal from './ServiceRequestChatModal';


const COMPACT_SERVICES = [
  {
    id: 'mentoria',
    label: 'Mentoria particular',
    eyebrow: 'Direção individual para avançar',
    description: 'Aprofunde dúvidas e transforme o conteúdo em um plano prático ao lado de W.Ribeiro.',
    benefits: ['Plano personalizado', 'Orientação prática 1:1', 'R$ 45,00 por hora'],
    action: 'Quero minha mentoria',
    requestLabel: 'Mentoria Particular',
    Icon: Sparkles,
    accent: 'violet',
  },
  {
    id: 'terapia',
    label: 'Atendimento terapêutico',
    eyebrow: 'Um espaço seguro para cuidar de você',
    description: 'Escuta responsável, acolhedora e confidencial para fortalecer sua saúde emocional.',
    benefits: ['Escuta individual', 'Ambiente confidencial', 'R$ 45,00 por hora'],
    action: 'Quero cuidar de mim',
    requestLabel: 'Atendimento Terapêutico Pessoal',
    Icon: HeartPulse,
    accent: 'rose',
  },
];

function CompactServices({ onRequest, reduceMotion }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <section aria-labelledby="services-title" className="space-y-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600">Apoio para sua jornada</p>
        <h2 id="services-title" className="mt-1 text-base font-bold text-foreground">Cuidado e orientação quando você precisar</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {COMPACT_SERVICES.map((service, index) => {
          const open = expanded === service.id;
          const rose = service.accent === 'rose';
          return (
            <motion.article
              key={service.id}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className={`relative overflow-hidden rounded-2xl border bg-card shadow-sm ${rose ? 'border-rose-300/60' : 'border-violet-300/60'}`}
            >
              <motion.span
                aria-hidden="true"
                className={`pointer-events-none absolute inset-0 rounded-2xl border-2 ${rose ? 'border-rose-400/50' : 'border-violet-400/50'}`}
                animate={reduceMotion ? undefined : { opacity: [0.2, 0.75, 0.2], scale: [0.99, 1.01, 0.99] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: index * 0.5 }}
              />
              <button
                type="button"
                onClick={() => setExpanded(open ? null : service.id)}
                className="relative flex w-full items-center gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500"
                aria-expanded={open}
                aria-controls={`${service.id}-details`}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${rose ? 'bg-gradient-to-br from-rose-500 to-fuchsia-500' : 'bg-gradient-to-br from-violet-500 to-indigo-500'}`}>
                  <service.Icon size={19} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-black text-foreground">{service.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{service.eyebrow}</span>
                </span>
                <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown size={18} aria-hidden="true" /></motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    id={`${service.id}-details`}
                    initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="relative overflow-hidden"
                  >
                    <div className="border-t border-border/70 px-4 pb-4 pt-3">
                      <p className="text-xs leading-relaxed text-muted-foreground">{service.description}</p>
                      <ul className="my-3 flex flex-wrap gap-1.5" aria-label="Benefícios">
                        {service.benefits.map((benefit) => <li key={benefit} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-[10px] font-semibold text-foreground"><Check size={11} className="text-emerald-500" />{benefit}</li>)}
                      </ul>
                      <button type="button" onClick={() => onRequest(service.requestLabel)} className={`flex min-h-10 w-full items-center justify-center gap-2 rounded-xl px-4 text-xs font-black text-white transition-transform hover:-translate-y-0.5 ${rose ? 'bg-gradient-to-r from-rose-500 to-fuchsia-500' : 'bg-gradient-to-r from-violet-500 to-indigo-500'}`}>
                        {service.action} <ArrowRight size={14} aria-hidden="true" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}

export default function ServicosCard({ expandable = false }) {
  const [activeService, setActiveService] = useState(null);
  const reduceMotion = useReducedMotion();

  if (expandable) {
    return (
      <>
        <CompactServices onRequest={setActiveService} reduceMotion={reduceMotion} />
        {activeService && <ServiceRequestChatModal serviceLabel={activeService} onClose={() => setActiveService(null)} />}
      </>
    );
  }

  return (
    <>
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="relative isolate overflow-hidden rounded-3xl border border-violet-400/20 bg-[#0d0b26] text-white shadow-2xl shadow-violet-950/20"
        aria-labelledby="mentoria-title"
      >
        <motion.div
          aria-hidden="true"
          className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-violet-500/25 blur-3xl"
          animate={reduceMotion ? undefined : { scale: [1, 1.14, 1], opacity: [0.35, 0.65, 0.35] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden="true"
          className="absolute -bottom-32 left-1/4 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl"
          animate={reduceMotion ? undefined : { x: [-16, 18, -16], y: [8, -10, 8] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative grid gap-7 p-6 sm:p-8 lg:grid-cols-[1.25fr_.75fr] lg:items-center">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200">
                <Sparkles size={12} /> Desenvolvimento individual
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-200">
                <Trophy size={12} /> Benefício por desempenho
              </span>
            </div>

            <h3 id="mentoria-title" className="max-w-xl text-2xl font-black leading-tight sm:text-3xl">
              Acelere sua evolução com uma mentoria feita para o seu momento
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65">
              Um encontro individual com W.Ribeiro para transformar dúvidas em direção prática, aprofundar conteúdos e construir seu próximo passo com mais segurança.
            </p>

            <div className="mt-5 grid gap-2 text-xs text-white/75 sm:grid-cols-3">
              {['Plano personalizado', 'Dúvidas aprofundadas', 'Orientação prática 1:1'].map((benefit) => (
                <div key={benefit} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2.5">
                  <Check size={14} className="shrink-0 text-emerald-300" /> {benefit}
                </div>
              ))}
            </div>
          </div>

          <div className="relative rounded-2xl border border-amber-300/20 bg-gradient-to-b from-amber-200/[0.11] to-white/[0.04] p-5 shadow-xl">
            <motion.div
              aria-hidden="true"
              className="absolute right-4 top-4 text-amber-300/30"
              animate={reduceMotion ? undefined : { rotate: [-5, 5, -5], scale: [1, 1.08, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Crown size={38} />
            </motion.div>
            <p className="pr-12 text-sm font-black text-amber-200">Excelência que abre oportunidades</p>
            <p className="mt-2 text-xs leading-relaxed text-white/65">
              Os alunos com as <strong className="text-white">3 melhores pontuações da classe</strong> recebem este benefício gratuitamente. É nosso reconhecimento por dedicação e constância nos estudos.
            </p>
            <div className="my-4 border-t border-white/10" />
            <p className="text-xs leading-relaxed text-white/55">
              Não está no top 3? Você também pode adquirir mentorias separadamente, sempre que quiser apoio individual.
            </p>
            <button
              onClick={() => setActiveService('Mentoria Particular')}
              className="group mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-3 text-sm font-black shadow-lg shadow-violet-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-violet-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0b26]"
            >
              Quero minha mentoria
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
            <p className="mt-2 text-center text-[10px] text-white/40">Sessão individual · R$ 45,00/hora</p>
          </div>
        </div>

        <div className="relative mx-6 mb-6 overflow-hidden rounded-3xl border border-rose-300/25 bg-[#1b0c20] shadow-xl shadow-rose-950/20 sm:mx-8 sm:mb-8">
          <div aria-hidden="true" className="absolute -left-16 -top-20 h-52 w-52 rounded-full bg-rose-500/20 blur-3xl" />
          <div className="relative grid gap-7 p-6 sm:p-7 lg:grid-cols-[1.25fr_.75fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-300/20 bg-rose-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-200">
                <HeartPulse size={12} /> Cuidado que também transforma
              </span>
              <h3 className="mt-4 max-w-xl text-2xl font-black leading-tight sm:text-3xl">
                Cuide de quem sustenta todos os seus projetos: você
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65">
                Um espaço individual, acolhedor e confidencial para cuidar da sua saúde emocional com escuta responsável e acompanhamento humano.
              </p>
              <div className="mt-5 grid gap-2 text-xs text-white/75 sm:grid-cols-3">
                {['Escuta individual', 'Ambiente confidencial', 'Cuidado com propósito'].map((benefit) => (
                  <div key={benefit} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2.5">
                    <Check size={14} className="shrink-0 text-rose-300" /> {benefit}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-rose-300/20 bg-gradient-to-b from-rose-200/[0.11] to-white/[0.04] p-5 shadow-xl">
              <p className="text-sm font-black text-rose-200">Seu cuidado fortalece esta jornada</p>
              <p className="mt-2 text-xs leading-relaxed text-white/65">
                Além de investir no seu bem-estar psicológico, cada atendimento contribui para manter e aprimorar a estrutura que apoia sua formação.
              </p>
              <div className="my-4 border-t border-white/10" />
              <p className="text-2xl font-black text-white">R$ 45,00 <span className="text-xs font-semibold text-white/50">/ hora</span></p>
              <button
                onClick={() => setActiveService('Atendimento Terapêutico Pessoal')}
                className="group mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-rose-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-rose-500/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1b0c20]"
              >
                Quero cuidar de mim <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </button>
              <p className="mt-2 text-center text-[10px] text-white/40">Atendimento individual · Solicitação sem compromisso</p>
            </div>
          </div>
        </div>
      </motion.section>

      {activeService && <ServiceRequestChatModal serviceLabel={activeService} onClose={() => setActiveService(null)} />}
    </>
  );
}
