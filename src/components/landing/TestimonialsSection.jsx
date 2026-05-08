const testimonials = [
  {
    name: 'Ana Beatriz Souza',
    role: 'Terapeuta Holística — São Paulo, SP',
    text: 'A formação em Terapia Integrativa mudou completamente minha visão do cuidado humano. O Prof. William tem uma didática rara — une profundidade acadêmica com uma presença clínica de verdade. Hoje atendo com muito mais segurança e clareza.',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&q=80',
    stars: 5,
  },
  {
    name: 'Carlos Eduardo Matos',
    role: 'Psicólogo em Formação — Curitiba, PR',
    text: 'Optei pela WR-EDU depois de pesquisar muito. A diferença é a prática real supervisionada desde o início do curso. O conteúdo é denso, atualizado e aplicável. Recomendo a todos que querem uma formação de verdade.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80',
    stars: 5,
  },
  {
    name: 'Fernanda Lima',
    role: 'Coach e Consteladora — Brasília, DF',
    text: 'Fazer a formação em Constelação Familiar aqui foi uma das melhores decisões da minha vida. O suporte da comunidade é excepcional, as lives ao vivo criaram um ambiente de aprendizado que não encontrei em nenhuma outra escola.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80',
    stars: 5,
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-20" style={{ backgroundColor: '#111827' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-3">Depoimentos</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            O que dizem nossos alunos
          </h2>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="relative rounded-xl p-7 border border-gray-700/40 flex flex-col"
              style={{ backgroundColor: '#1F2937' }}
            >
              {/* Big quote */}
              <span className="text-6xl text-amber-500 leading-none font-serif absolute top-4 left-6 opacity-60">"</span>

              {/* Stars */}
              <div className="flex gap-1 mb-6 mt-6">
                {[...Array(t.stars)].map((_, i) => (
                  <span key={i} className="text-amber-400 text-sm">★</span>
                ))}
              </div>

              <p className="text-gray-300 text-sm leading-relaxed flex-1 mb-6">{t.text}</p>

              {/* Closing quote */}
              <span className="text-6xl text-amber-500 leading-none font-serif self-end opacity-60">"</span>

              {/* Author */}
              <div className="flex items-center gap-3 mt-4 pt-5 border-t border-gray-700/50">
                <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <div className="text-white text-sm font-semibold">{t.name}</div>
                  <div className="text-gray-500 text-xs">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}