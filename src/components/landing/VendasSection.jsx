import { Check } from 'lucide-react';

const planos = [
  {
    name: 'Acesso',
    featured: false,
    price: null,
    features: ['Preço Exclusivo', 'Acesso Vitalício', 'Acesso Mentoria', 'Terapeutas'],
    cta: 'Saiba Mais',
  },
  {
    name: 'Curso Raríssimo Cantado',
    featured: true,
    price: null,
    features: ['Acesso Vitalício', 'Acesso Vitalício', 'Acesso Mentoria', 'Acesso de Atividades', 'Correo de Movimentos'],
    cta: 'Comprar Agora',
  },
  {
    name: 'Premieiro',
    featured: false,
    price: null,
    features: ['Preço Exclusivo', 'Acesso Vitalício', 'Acesso Mentoria', 'Terapeutas', 'Registro links'],
    cta: 'Saiba Mais',
  },
];

export default function VendasSection() {
  return (
    <section className="bg-[#111827] py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-white text-center mb-12" style={{ fontFamily: 'Georgia, serif' }}>Área de Vendas</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {planos.map((p) => (
            <div
              key={p.name}
              className={`rounded-2xl p-6 border flex flex-col ${
                p.featured
                  ? 'bg-[#1F2937] border-amber-400 shadow-xl shadow-amber-400/10 scale-105'
                  : 'bg-[#1a2030] border-[#374151]'
              }`}
            >
              <h3 className={`text-lg font-bold mb-4 ${p.featured ? 'text-amber-400' : 'text-white'}`} style={{ fontFamily: 'Georgia, serif' }}>{p.name}</h3>
              <ul className="space-y-2 mb-6 flex-1">
                {p.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-3 rounded-lg font-bold text-sm transition-all ${
                  p.featured
                    ? 'bg-amber-400 hover:bg-amber-300 text-gray-900'
                    : 'bg-[#374151] hover:bg-[#4B5563] text-white'
                }`}
              >
                {p.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-500 text-sm mt-10">
          Entre em contato para informações sobre valores e condições especiais.
        </p>
      </div>
    </section>
  );
}