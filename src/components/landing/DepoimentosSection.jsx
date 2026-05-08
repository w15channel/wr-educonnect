const depoimentos = [
  {
    name: 'Ana Paula S.',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80',
    text: 'Melhorou minha prática. Como prática de minha caminho vida prática enriqueceu minha poios.',
  },
  {
    name: 'Carlos M.',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
    text: 'Curso incrível. Melhora minha prática e tece memórias de prática excelente realmente emocionante positivo nenhuma outra minha clínica.',
  },
  {
    name: 'Fernanda R.',
    photo: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=100&q=80',
    text: 'Curso Incrível, bendito ora minha prática avançada como coisas medo de questionamentos de terapeutas.',
  },
  {
    name: 'Mariana T.',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80',
    text: 'Curso incrível. Crescemos muito aonde o professor me leva e consigo ainda melhoros anos minha prática.',
  },
  {
    name: 'Roberto L.',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
    text: 'Curso incrível, onde a escrita profissional através am felicidades com tendências práticas extraordinariamente melhorou e módulo aos que novas conhecimento com entendimento.',
  },
];

export default function DepoimentosSection() {
  return (
    <div>
      <h2 className="text-4xl font-bold text-white mb-10" style={{ fontFamily: 'Georgia, serif' }}>Depoimentos de Alunos</h2>
      <div className="space-y-6">
        {depoimentos.map((d, i) => (
          <div key={i} className={`relative bg-[#1F2937] border border-[#374151] rounded-2xl p-5 ${i % 2 === 1 ? 'ml-4' : ''}`}>
            <span className="absolute -top-3 left-5 text-6xl text-amber-400 leading-none font-serif">"</span>
            <p className="text-gray-300 text-sm leading-relaxed mb-4 pt-3 italic">{d.text}</p>
            <div className="flex items-center gap-3">
              <img src={d.photo} alt={d.name} className="w-10 h-10 rounded-full object-cover border-2 border-amber-400/30" />
              <span className="text-white text-sm font-semibold">{d.name}</span>
            </div>
            <span className="absolute -bottom-3 right-5 text-6xl text-amber-400 leading-none font-serif rotate-180">"</span>
          </div>
        ))}
      </div>
    </div>
  );
}