const credentials = [
  { title: 'Membro da ABED', desc: 'Associação Brasileira de Educação a Distância', url: 'https://www.abed.org.br' },
  { title: 'Certificado AHDE', desc: 'Academia Holística de Desenvolvimento e Educação', url: '#' },
  { title: 'Therapist University', desc: 'Formação Internacional em Psicoterapia', url: '#' },
  { title: 'Membro ADRA', desc: 'Associação de Desenvolvimento e Recursos Alternativos', url: '#' },
];

export default function AboutSection() {
  const photoUrl = "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80";
  return (
    <section className="py-20" style={{ backgroundColor: '#1F2937' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
          {/* Photo */}
          <div className="lg:col-span-2 flex justify-center lg:justify-start">
            <div className="relative w-full max-w-xs">
              <div className="absolute -inset-3 rounded-2xl border border-amber-500/20"></div>
              <img
                src={photoUrl}
                alt="Prof. William Ribeiro"
                className="relative rounded-xl w-full object-cover shadow-2xl"
                style={{ aspectRatio: '3/4', objectPosition: 'top' }}
              />
              <div className="absolute bottom-4 left-4 right-4 rounded-lg p-3 border border-amber-500/30" style={{ backgroundColor: 'rgba(17,24,39,0.92)', backdropFilter: 'blur(8px)' }}>
                <div className="text-amber-400 text-xs font-semibold tracking-wide">COORDENADOR GERAL</div>
                <div className="text-white font-bold text-sm mt-0.5">Prof. William Ribeiro</div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <p className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-3">Sobre o Professor</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              William Ribeiro
            </h2>
            <p className="text-gray-300 text-base leading-relaxed mb-4">
              Professor e coordenador com mais de duas décadas de experiência clínica e educacional na área da saúde integrativa e psicoterapia holística. Formado em diversas abordagens complementares, acumula certificações nacionais e internacionais reconhecidas.
            </p>
            <p className="text-gray-400 text-base leading-relaxed mb-8">
              Fundador da WR-EDU, a escola nasceu do compromisso com uma formação prática, humana e transformadora — que equipa o terapeuta não apenas com técnicas, mas com uma visão sistêmica do cuidado.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {credentials.map((c) => (
                <a
                  key={c.title}
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-4 rounded-lg border border-gray-600/40 hover:border-amber-500/40 transition-all group"
                  style={{ backgroundColor: '#111827' }}
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-500/20 transition-colors">
                    <span className="text-amber-400 text-sm">✓</span>
                  </div>
                  <div>
                    <div className="text-white text-sm font-semibold">{c.title}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{c.desc}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}