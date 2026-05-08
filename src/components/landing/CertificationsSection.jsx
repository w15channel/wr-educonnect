const certs = [
  { name: 'ABED', desc: 'Associação Brasileira de Educação a Distância', icon: '🎓' },
  { name: 'AHDE', desc: 'Academia Holística de Desenvolvimento e Educação', icon: '🏛️' },
  { name: 'ADRA', desc: 'Associação de Desenvolvimento e Recursos Alternativos', icon: '🌿' },
  { name: 'Therapist University', desc: 'Certificação Internacional em Psicoterapia', icon: '🌍' },
  { name: 'CFP Regulamentado', desc: 'Ética e conduta profissional', icon: '⚖️' },
  { name: 'ISO Educacional', desc: 'Padrão internacional de qualidade', icon: '✅' },
];

export default function CertificationsSection() {
  return (
    <section className="py-20" style={{ backgroundColor: '#1F2937' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-3">Credibilidade</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Certificações e Reconhecimentos
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto">
            Nossa escola é afiliada e reconhecida pelas principais associações nacionais e internacionais de terapia e educação.
          </p>
        </div>

        {/* Certification badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {certs.map((c) => (
            <div
              key={c.name}
              className="flex flex-col items-center text-center p-5 rounded-xl border border-amber-500/20 hover:border-amber-500/50 transition-all duration-200 group"
              style={{ backgroundColor: '#111827' }}
            >
              <div className="text-3xl mb-3">{c.icon}</div>
              <div className="w-12 h-12 rounded-full border-2 border-amber-500/40 flex items-center justify-center mb-3 group-hover:border-amber-500 transition-colors">
                <span className="text-amber-400 text-xs font-bold text-center leading-tight px-1">{c.name.split(' ')[0]}</span>
              </div>
              <div className="text-white text-xs font-bold mb-1">{c.name}</div>
              <div className="text-gray-500 text-xs leading-tight">{c.desc}</div>
            </div>
          ))}
        </div>

        {/* Trust bar */}
        <div className="mt-14 rounded-xl border border-amber-500/20 p-6 text-center" style={{ backgroundColor: '#111827' }}>
          <p className="text-gray-400 text-sm">
            🔒 Todos os certificados emitidos pela WR-EDU são <strong className="text-white">verificáveis online</strong> e reconhecidos pelas principais entidades de saúde integrativa do Brasil e do exterior.
          </p>
        </div>
      </div>
    </section>
  );
}