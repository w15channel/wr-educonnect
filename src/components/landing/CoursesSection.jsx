const courses = [
  {
    title: 'Terapia Integrativa',
    desc: 'Formação completa em Terapia Integrativa, unindo abordagens complementares para um cuidado holístico do ser humano. Do iniciante ao profissional certificado.',
    modules: '12 módulos · 48 aulas · Certificado incluso',
    badge: 'Mais Procurado',
  },
  {
    title: 'Psicoterapia Holística',
    desc: 'Curso de Psicoterapia Holística com ênfase em técnicas práticas supervisionadas, desenvolvimento pessoal e formação ética do terapeuta.',
    modules: '10 módulos · 40 aulas · Certificado incluso',
    badge: 'Novo',
  },
  {
    title: 'Constelação Familiar',
    desc: 'Formação em Constelação Familiar Sistêmica, com base nos ensinamentos de Bert Hellinger e aplicações modernas de campo morfogenético.',
    modules: '8 módulos · 32 aulas · Certificado incluso',
    badge: null,
  },
];

export default function CoursesSection({ onLoginClick }) {
  return (
    <section className="py-20" style={{ backgroundColor: '#111827' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-3">Formações Profissionais</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Escola de Formação de Terapeutas
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto text-base">
            Cursos reconhecidos com metodologia exclusiva do Prof. William Ribeiro, integrando teoria, prática e supervisão.
          </p>
        </div>

        {/* Course cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((c) => (
            <div
              key={c.title}
              className="relative rounded-xl border border-amber-500/20 p-7 flex flex-col hover:border-amber-500/50 transition-all duration-300 group"
              style={{ backgroundColor: '#1F2937' }}
            >
              {c.badge && (
                <span className="absolute top-5 right-5 px-2.5 py-1 rounded-full bg-amber-500 text-gray-900 text-xs font-bold">
                  {c.badge}
                </span>
              )}
              <h3 className="text-xl font-bold text-white mb-3" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                {c.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-5 flex-1">{c.desc}</p>
              <div className="text-xs text-gray-500 mb-5 border-t border-gray-700/50 pt-4">{c.modules}</div>
              <button
                onClick={onLoginClick}
                className="flex items-center gap-2 text-amber-400 text-sm font-semibold hover:text-amber-300 transition-colors group-hover:gap-3"
              >
                Conhecer formação <span>→</span>
              </button>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <button
            onClick={onLoginClick}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-amber-500 text-gray-900 font-bold text-base hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
          >
            Ver Todas as Formações →
          </button>
        </div>
      </div>
    </section>
  );
}