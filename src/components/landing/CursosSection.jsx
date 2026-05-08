const modulos = [
  {
    img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80',
    tag: 'Módulo 1',
    title: 'Curso a prática terapêutica',
    desc: 'Conteúdo completo em terapia, com diferencial da prática terapêutica ao longo de toda a jornada.',
    syllabus: ['Práticas terapêuticas', 'Práticas conscientes', 'Módulo conteúdos'],
  },
  {
    img: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=400&q=80',
    tag: 'Módulo 2',
    title: 'Prática terapêutica',
    desc: 'Conteúdo completo em terapia, com diferencial da prática terapêutica ao longo de toda a jornada.',
    syllabus: ['Práticas terapêuticas', 'Módulo conteúdo', 'Módulo conteúdo'],
  },
  {
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    tag: 'Módulo 3',
    title: 'Curso a prática terapêutica',
    desc: 'Conteúdo completo em terapia, com diferencial da prática terapêutica ao longo de toda a jornada.',
    syllabus: ['Prática terapêutica', 'Módulo conteúdo', 'Módulo conteúdo'],
  },
  {
    img: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=400&q=80',
    tag: 'Módulo 4',
    title: 'Prática terapêutica',
    desc: 'Conteúdo completo em terapia, com diferencial da prática terapêutica ao longo de toda a jornada.',
    syllabus: ['Prática terapêutica', 'Módulo conteúdo', 'Módulo conteúdo'],
  },
];

export default function CursosSection() {
  return (
    <div>
      <h2 className="text-4xl font-bold text-white mb-10" style={{ fontFamily: 'Georgia, serif' }}>Cursos e Conteúdos</h2>
      <div className="space-y-8">
        {modulos.map((m, i) => (
          <div key={i} className="flex gap-5 group">
            <div className="w-28 h-20 rounded-lg overflow-hidden shrink-0">
              <img src={m.img} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
            <div>
              <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-1">{m.tag}</p>
              <h3 className="text-white font-semibold text-sm mb-1">{m.title}</h3>
              <p className="text-gray-400 text-xs mb-2 leading-relaxed">{m.desc}</p>
              <p className="text-gray-500 text-xs font-semibold mb-1">Syllabus</p>
              <ul className="space-y-0.5">
                {m.syllabus.map((s, j) => (
                  <li key={j} className="text-gray-400 text-xs flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}