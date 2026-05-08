import { ArrowRight } from 'lucide-react';

const courses = [
  {
    title: 'Terapia Integrativa',
    desc: 'Formação completa em Terapia Integrativa, unindo diferentes abordagens para uma prática profissional sólida e humanizada.',
    price: 'R$ 1.997',
    badge: 'Mais Procurado',
  },
  {
    title: 'Psicoterapia Holística',
    desc: 'Psicoterapia Holística com uma grade de conteúdos completa, abordando as principais correntes da psicoterapia moderna.',
    price: 'R$ 2.497',
    badge: 'Destaque',
  },
  {
    title: 'Formação em Constelação',
    desc: 'Constelação Familiar e Sistêmica com metodologia exclusiva, voltada para terapeutas que desejam expandir sua atuação.',
    price: 'R$ 1.797',
    badge: null,
  },
];

export default function LandingCourses() {
  return (
    <section id="cursos" className="bg-[#111827] py-20">
      {/* Section header */}
      <div className="text-center mb-6">
        <p className="text-amber-400 text-sm tracking-widest uppercase font-medium mb-2">Escola de Formação de Terapeutas</p>
        <h2
          className="text-3xl md:text-4xl font-bold text-white"
          style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
        >
          Cursos
        </h2>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div
            key={course.title}
            className="bg-[#1F2937] border border-amber-500/30 hover:border-amber-500 rounded-xl p-6 flex flex-col gap-4 transition-all group"
          >
            {course.badge && (
              <span className="self-start bg-amber-500/20 text-amber-400 text-xs font-semibold px-3 py-1 rounded-full">
                {course.badge}
              </span>
            )}
            <h3
              className="text-white text-xl font-bold"
              style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
            >
              {course.title}
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed flex-1">{course.desc}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-amber-400 font-bold text-lg">{course.price}</span>
              <button className="flex items-center gap-1 text-amber-400 hover:text-amber-300 text-sm font-semibold group-hover:gap-2 transition-all">
                Saiba mais <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}