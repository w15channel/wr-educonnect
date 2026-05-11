import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';
import { BRAND_SHORT_NAME, WR_PRIMARY_LOGO } from '@/lib/brand';

export default function MobileSplash() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    const alreadyShown = sessionStorage.getItem('wr_mobile_splash_seen') === '1';
    if (!isMobile || alreadyShown) return;

    setVisible(true);
    sessionStorage.setItem('wr_mobile_splash_seen', '1');
    const timer = setTimeout(() => setVisible(false), 2300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
          className="fixed inset-0 z-[300] flex items-center justify-center overflow-hidden bg-[#080b14] md:hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(91,94,244,0.22),transparent_62%)]" />
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 130, damping: 14 }}
            className="relative flex flex-col items-center px-8 text-center"
          >
            <motion.div
              animate={{ boxShadow: ['0 0 0 rgba(29,184,158,0)', '0 0 45px rgba(29,184,158,0.35)', '0 0 0 rgba(29,184,158,0)'] }}
              transition={{ repeat: Infinity, duration: 1.6 }}
              className="mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] border border-white/15 bg-white/8 backdrop-blur-xl"
            >
              <img src={WR_PRIMARY_LOGO} alt="WR" className="h-20 w-20 object-contain" />
            </motion.div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#1db89e]/25 bg-[#1db89e]/10 px-4 py-1.5 text-xs font-bold text-[#8ff5e3]">
              <Sparkles size={13} /> Plataforma terapêutica
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">{BRAND_SHORT_NAME}</h1>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/55">
              Aprendizado, acolhimento e evolução em um só lugar.
            </p>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 150 }}
              transition={{ duration: 1.8, ease: 'easeInOut' }}
              className="mt-7 h-1 rounded-full bg-gradient-to-r from-[#5b5ef4] to-[#1db89e]"
            />
            <div className="mt-5 flex items-center gap-1.5 text-[11px] font-medium text-white/30">
              <Heart size={11} className="fill-pink-400 text-pink-400" /> preparando sua jornada
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}