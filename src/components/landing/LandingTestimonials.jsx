const testimonials = [
  {
    text: 'A Terapia Integrativa mudou completamente minha prática profissional. O curso é denso, prático e transformador. Recomendo a todos que desejam se destacar na área.',
    name: 'Mariana S.',
    role: 'Terapeuta Holística',
    initials: 'MS',
    color: 'bg-amber-500',
  },
  {
    text: 'O curso de Psicoterapia Holística superou minhas expectativas. As lives ao vivo com o Professor William são um diferencial que nenhuma outra formação oferece.',
    name: 'Ricardo A.',
    role: 'Psicólogo',
    initials: 'RA',
    color: 'bg-blue-600',
  },
  {
    text: 'Investi na minha formação e hoje atendo pacientes em três países. A qualidade do conteúdo e o suporte da comunidade foram fundamentais para meu crescimento.',
    name: 'Fernanda L.',
    role: 'Consteladora Familiar',
    initials: 'FL',
    color: 'bg-teal-600',
  },
];

export default function LandingTestimonials() {
  return (
    <section id="depoimentos" className="bg-[#111827] py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-amber-400 text-sm tracking-widest uppercase font-medium mb-2">O que dizem nossos alunos</p>
          <h2
            className="text-3xl md:text-4xl font-bold text-white"
            style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
          >
            Depoimentos
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-[#1F2937] rounded-xl p-8 flex flex-col gap-6 relative">
              {/* Big quote mark */}
              <span
                className="text-7xl text-amber-500 font-serif leading-none absolute top-4 left-6 opacity-80 select-none"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                "
              </span>
              <p className="text-gray-300 text-sm leading-relaxed mt-10 flex-1">
                {t.text}
              </p>
              {/* Closing quote */}
              <span
                className="text-7xl text-amber-500 font-serif leading-none self-end opacity-80 select-none"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                "
              </span>
              <div className="flex items-center gap-3 border-t border-gray-700 pt-4">
                <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-sm`}>
                  {t.initials}
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">{t.name}</div>
                  <div className="text-gray-400 text-xs">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}