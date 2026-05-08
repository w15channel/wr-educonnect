import { Award, ExternalLink } from 'lucide-react';

const certs = [
  {
    type: 'image',
    label: 'Diploma Nacional',
    sublabel: 'Psicoterapia — Unypublica',
    code: '267797-1-432-19012026071526',
    link: null,
    img: 'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=200&q=80',
  },
  {
    type: 'image',
    label: 'Certificação Internacional',
    sublabel: 'Psicanálise — Unifatec',
    code: 'eeee6d19-0d18-46c5-a657-3e6f5bfdb515',
    link: null,
    img: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=200&q=80',
  },
  {
    type: 'badge',
    label: 'Reconhecimento de Prática',
    sublabel: 'AHDE Internacional',
    code: 'ID: 00403THE',
    link: 'https://ahde-global.org/?lang=pt-br',
  },
  {
    type: 'badge',
    label: 'Reconhecimento de Prática',
    sublabel: 'Therapist University',
    code: 'CERT-1768040814293-CAZA86VTQ',
    link: 'https://certificados.therapist.university/certificates/CERT-1768040814293-CAZA86VTQ',
  },
  {
    type: 'badge',
    label: 'Escola Formação de Terapeutas',
    sublabel: 'ABED — Associação Brasileira EaD',
    code: null,
    link: 'https://www.abed.org.br/site/associados/consulta-associados-ativos/',
  },
  {
    type: 'badge',
    label: 'Logoterapeuta Diplomado',
    sublabel: 'Unypublica',
    code: '267797-1-405-13112025030416',
    link: null,
  },
];

export default function CertificacoesSection() {
  return (
    <section className="bg-[#1a2030] py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-12 gap-4">
          <h2 className="text-4xl font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>Certificações</h2>
          <div className="flex items-center gap-2 bg-amber-400/10 border border-amber-400/30 rounded-full px-4 py-2 text-amber-400 text-sm font-medium">
            <Award className="w-4 h-4" />
            Escola de Formação de Terapeutas
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
          {certs.map((c, i) => (
            <div key={i} className="flex flex-col items-center text-center group">
              {c.type === 'image' ? (
                <div className="w-full aspect-[3/4] rounded-lg overflow-hidden border border-[#374151] mb-3 group-hover:border-amber-400/50 transition-colors">
                  <img src={c.img} alt={c.label} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400/20 to-amber-600/10 border-2 border-amber-400/40 flex items-center justify-center mb-3 group-hover:border-amber-400 transition-colors">
                  <Award className="w-8 h-8 text-amber-400" />
                </div>
              )}
              <p className="text-white text-xs font-semibold leading-tight mb-1">{c.label}</p>
              <p className="text-gray-400 text-xs leading-tight mb-2">{c.sublabel}</p>
              {c.code && <p className="text-gray-600 text-[10px] break-all leading-tight mb-1">{c.code}</p>}
              {c.link && (
                <a
                  href={c.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-amber-400 text-[10px] hover:text-amber-300 transition-colors"
                >
                  Verificar <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}