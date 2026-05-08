import { Video, Users, MessageSquare, Heart } from 'lucide-react';

const features = [
  { icon: Video, title: 'Videoaulas', desc: 'Conteúdo terapêutico exclusivo' },
  { icon: Users, title: 'Lives ao Vivo', desc: 'Práticas e mentorias em tempo real' },
  { icon: MessageSquare, title: 'Comunidade', desc: 'Fórum de dúvidas e troca' },
  { icon: Heart, title: 'Prática', desc: 'Experiência terapêutica ao longo do curso' },
];

const heroImg = "https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=800";

export default function LandingHero({ onScrollToCourses }) {
  return (
    <section id="escola" className="relative bg-[#111827] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 py-16 md:py-20 grid md:grid-cols-2 gap-12 items-center">
        {/* Left */}
        <div>
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs px-3 py-1.5 rounded-full mb-6">
            🎓 Escola de Formação de Terapeutas
          </div>
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
            style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
          >
            Transforme vidas<br />através da cura.
          </h1>
          <p className="text-gray-300 text-lg leading-relaxed mb-8">
            Uma formação completa em terapia, com o diferencial da prática terapêutica ao longo de toda a jornada.
          </p>
          <div className="flex flex-wrap gap-4 mb-12">
            <button
              onClick={onScrollToCourses}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-3 rounded text-sm transition-colors"
            >
              Ver Cursos e Formações
            </button>
            <button
              onClick={onScrollToCourses}
              className="border border-amber-500/50 text-amber-400 hover:border-amber-400 font-semibold px-8 py-3 rounded text-sm transition-colors"
            >
              Saiba Mais
            </button>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-2 gap-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-[#1F2937] border border-gray-700 rounded-lg p-4">
                <Icon className="w-5 h-5 text-amber-400 mb-2" />
                <div className="text-white font-semibold text-sm">{title}</div>
                <div className="text-gray-400 text-xs mt-1">{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — image */}
        <div className="relative hidden md:block">
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#111827] z-10 w-1/3" />
          <img
            src={heroImg}
            alt="Terapia"
            className="w-full h-[500px] object-cover rounded-xl opacity-80"
          />
        </div>
      </div>
    </section>
  );
}