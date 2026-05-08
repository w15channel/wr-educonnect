import { ExternalLink, ShieldCheck } from 'lucide-react';

const professorImg = "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600";

const certs = [
  { label: 'ABED — Associação Brasileira de Educação a Distância', url: 'https://abed.org.br' },
  { label: 'AHDE — Associação Humanista de Desenvolvimento', url: '#' },
  { label: 'Therapist University — Registro Internacional', url: '#' },
];

export default function LandingProfessor() {
  return (
    <section className="bg-[#0D1117] py-20">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
        {/* Photo */}
        <div className="relative">
          <img
            src={professorImg}
            alt="Prof. William Ribeiro"
            className="w-full max-w-md rounded-xl object-cover grayscale brightness-90 shadow-2xl"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D1117] via-transparent to-transparent rounded-xl" />
        </div>

        {/* Content */}
        <div>
          <p className="text-amber-400 text-sm tracking-widest uppercase font-medium mb-3">Coordenador Geral</p>
          <h2
            className="text-3xl md:text-4xl font-bold text-white mb-6"
            style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
          >
            Sobre o Professor<br />William Ribeiro
          </h2>
          <p className="text-gray-300 text-base leading-relaxed mb-4">
            William Ribeiro é um profissional renomado na área da saúde mental e desenvolvimento humano. Terapeuta Holístico e especialista em Psicoterapia Integrativa, com atuação em âmbito nacional e internacional.
          </p>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            Com anos de experiência clínica e acadêmica, o Professor William desenvolveu uma metodologia própria que alia rigor científico com sensibilidade humanizada, formando terapeutas de excelência em todo o Brasil.
          </p>

          <div className="space-y-3">
            <p className="text-amber-400 text-xs tracking-widest uppercase font-semibold mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Certificações e Registros Verificáveis
            </p>
            {certs.map((c) => (
              <a
                key={c.label}
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between bg-[#1F2937] border border-gray-700 hover:border-amber-500/50 rounded-lg px-4 py-3 group transition-all"
              >
                <span className="text-gray-300 text-sm group-hover:text-white transition-colors">{c.label}</span>
                <ExternalLink className="w-4 h-4 text-amber-400 opacity-50 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}