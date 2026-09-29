import React, { useState } from 'react';
import { ArrowRight, Check, Crown, HeartPulse, Sparkles, Trophy } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import ServiceRequestChatModal from './ServiceRequestChatModal';


export default function ServicosCard() {
  const [activeService, setActiveService] = useState(null);
  const reduceMotion = useReducedMotion();

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

        <div className="relative mx-6 mb-6 flex flex-col gap-4 rounded-2xl border border-rose-300/20 bg-gradient-to-r from-rose-400/10 to-fuchsia-400/10 p-5 sm:mx-8 sm:mb-8 sm:flex-row sm:items-center">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-400/15 text-rose-200" aria-hidden="true">
            <HeartPulse size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-black text-white">Atendimento terapêutico pessoal</p>
            <p className="mt-1 text-xs leading-relaxed text-white/60">Um espaço individual, acolhedor e confidencial para cuidar de questões pessoais com escuta responsável e acompanhamento humano.</p>
          </div>
          <button
            onClick={() => setActiveService('Atendimento Terapêutico Pessoal')}
            className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-rose-200/25 bg-rose-500 px-4 py-3 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:bg-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
          >
            Quero ser atendido(a) <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </motion.section>

      {activeService && <ServiceRequestChatModal serviceLabel={activeService} onClose={() => setActiveService(null)} />}
    </>
  );
}
