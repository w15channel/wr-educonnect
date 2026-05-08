import { ShieldCheck } from 'lucide-react';

const certs = [
  { name: 'ABED', desc: 'Associação Brasileira de EaD' },
  { name: 'AHDE', desc: 'Associação Humanista' },
  { name: 'ICF', desc: 'International Coaching Federation' },
  { name: 'CFP', desc: 'Conselho Federal de Psicologia' },
  { name: 'SEAT', desc: 'Sociedade Europeia de Terapias' },
  { name: 'TU', desc: 'Therapist University' },
];

export default function LandingCerts() {
  return (
    <section id="certs" className="bg-[#0D1117] py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2
            className="text-2xl md:text-3xl font-bold text-white mb-2"
            style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
          >
            Certificações
          </h2>
          <p className="text-gray-400 text-sm">Reconhecimento nacional e internacional</p>
        </div>

        <div className="flex flex-wrap justify-center gap-6">
          {certs.map((c) => (
            <div
              key={c.name}
              className="flex flex-col items-center gap-2 bg-[#1F2937] border border-gray-700 hover:border-amber-500/50 rounded-xl p-5 w-32 transition-all group"
            >
              <div className="w-14 h-14 rounded-full border-2 border-amber-500/40 group-hover:border-amber-500 flex items-center justify-center transition-all">
                <ShieldCheck className="w-7 h-7 text-amber-400" />
              </div>
              <span className="text-amber-400 font-bold text-sm">{c.name}</span>
              <span className="text-gray-500 text-[10px] text-center leading-tight">{c.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}