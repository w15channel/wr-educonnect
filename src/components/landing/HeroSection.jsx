export default function HeroSection({ onLoginClick, scrollTo }) {
  const imgUrl = "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80";
  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: '#111827' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[520px]">
          {/* Left: text */}
          <div className="flex flex-col justify-center py-16 lg:py-20 pr-0 lg:pr-12 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/40 text-amber-400 text-xs font-medium mb-6 w-fit">
              🎓 Escola de Formação de Terapeutas
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Transforme vidas<br />
              <span className="text-amber-400">através da cura.</span>
            </h1>
            <p className="text-gray-300 text-lg leading-relaxed mb-8 max-w-lg">
              Uma formação completa em terapia, com o diferencial da prática terapêutica ao longo de toda a jornada — do iniciante ao profissional certificado.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onLoginClick}
                className="px-7 py-3.5 rounded-lg bg-amber-500 text-gray-900 font-bold text-base hover:bg-amber-400 transition-all duration-200 shadow-lg"
              >
                Quero Me Matricular
              </button>
              <button
                onClick={() => scrollTo('cursos')}
                className="px-7 py-3.5 rounded-lg border border-gray-500 text-gray-300 font-semibold text-base hover:border-amber-400 hover:text-amber-400 transition-all duration-200"
              >
                Ver Cursos
              </button>
            </div>
          </div>

          {/* Right: image — desktop only */}
          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-r from-[#111827] via-[#111827]/30 to-transparent z-10"></div>
            <img src={imgUrl} alt="Sessão terapêutica" className="w-full h-full object-cover object-center" style={{ minHeight: '520px' }} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/60 to-transparent z-10"></div>
          </div>
        </div>
      </div>

      {/* Mobile image */}
      <div className="lg:hidden relative h-64">
        <img src={imgUrl} alt="Sessão terapêutica" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-[#111827]/40 to-transparent"></div>
      </div>

      {/* Features bar */}
      <div className="border-t border-gray-700/50" style={{ backgroundColor: '#1F2937' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '🎬', title: 'Videoaulas', desc: 'Conteúdo terapêutico exclusivo' },
              { icon: '📡', title: 'Lives ao Vivo', desc: 'Práticas e mentorias em tempo real' },
              { icon: '💬', title: 'Comunidade', desc: 'Fórum de dúvidas e troca' },
              { icon: '🧘', title: 'Prática', desc: 'Experiência terapêutica ao longo do curso' },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3 p-3">
                <span className="text-2xl flex-shrink-0">{f.icon}</span>
                <div>
                  <div className="text-white font-semibold text-sm">{f.title}</div>
                  <div className="text-gray-400 text-xs mt-0.5">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}