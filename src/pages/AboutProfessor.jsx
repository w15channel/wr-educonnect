import React from 'react';
import { Award, ExternalLink, Shield, Globe, Users, BookOpen, Heart, Star, ChevronRight } from 'lucide-react';

const LOGO_URL = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/077216e46_textodoseupargrafoWR_20251219_192959_0000.png';

const credentials = [
  {
    title: 'Psicoterapeuta',
    institution: 'Faculdade Unypublica',
    code: '267797-1-432-19012026071526',
    color: 'from-purple-500 to-indigo-600',
    badge: 'bg-purple-500/15 border-purple-500/30 text-purple-300',
  },
  {
    title: 'Terapeuta — Registro Internacional',
    institution: 'AHDE · Association for Human Development and Evolution',
    code: 'ID: 00403THE',
    link: 'https://ahde-global.org/?lang=pt-br',
    color: 'from-blue-500 to-cyan-600',
    badge: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
  },
  {
    title: 'Psicanalista Diplomado',
    institution: 'Faculdade Unifatec',
    code: 'eeee6d19-0d18-46c5-a657-3e6f5bfdb515',
    color: 'from-indigo-500 to-violet-600',
    badge: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300',
  },
  {
    title: 'Psicanalista — Registro Internacional',
    institution: 'THERAPIST UNIVERSITY',
    code: 'CERT-1768040814293-CAZA86VTQ',
    link: 'https://certificados.therapist.university/certificates/CERT-1768040814293-CAZA86VTQ',
    color: 'from-violet-500 to-purple-700',
    badge: 'bg-violet-500/15 border-violet-500/30 text-violet-300',
  },
  {
    title: 'Logoterapeuta Diplomado',
    institution: 'Faculdade Unypublica',
    code: '267797-1-405-13112025030416',
    color: 'from-teal-500 to-emerald-600',
    badge: 'bg-teal-500/15 border-teal-500/30 text-teal-300',
  },
  {
    title: 'Sexólogo Integrativo',
    institution: 'Unifast · School Of Business Acceleration',
    code: '000300950029868',
    color: 'from-rose-500 to-pink-600',
    badge: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
  },
];

const experiences = [
  {
    period: 'Atual',
    role: 'Dirigente — Sinapse Coletiva',
    desc: 'Grupo formado por profissionais da saúde comportamental que constroem um espaço consciente e equilibrado na busca de técnicas e proximidade da comunidade profissional e acadêmica.',
    icon: Users,
    color: 'text-purple-400',
  },
  {
    period: 'Atual',
    role: 'Educador Social · Programa ADRA — Vida Digital',
    desc: 'Educação Social para Crianças e Adolescentes em situação de vulnerabilidade social, promovendo resgate da dignidade, incentivo aos estudos e quebra de paradigmas de comunidades periféricas.',
    link: 'https://adra.org.br/projetos/vida-digital/',
    icon: Heart,
    color: 'text-rose-400',
  },
  {
    period: '2022',
    role: 'Profissional de Tecnologia — 8° Registro de Imóveis de Curitiba',
    desc: 'Participação ativa no processo de implementação de migração tecnológica institucional.',
    icon: Globe,
    color: 'text-blue-400',
  },
  {
    period: '2020',
    role: 'Operador no Mercado Financeiro e de Criptoativos',
    desc: 'Atuação como operador ativo durante o período da crise da pandemia, com foco em mercado financeiro e criptoativos.',
    icon: Star,
    color: 'text-yellow-400',
  },
  {
    period: '2019',
    role: 'Administração — UFPR',
    desc: 'Integrou a turma de Administração da UFPR, com destaque nas disciplinas de Comportamento Organizacional.',
    icon: BookOpen,
    color: 'text-green-400',
  },
  {
    period: '2009–2019',
    role: 'Atuação Administrativa e Recursos Humanos',
    desc: 'Experiência em departamentos Financeiro, Recursos Humanos e Departamento Pessoal, incluindo atuação como Headhunter em processos seletivos.',
    icon: Shield,
    color: 'text-cyan-400',
  },
];

export default function AboutProfessor() {
  return (
    <div className="min-h-screen bg-[#080b14] text-white">
      {/* Header */}
      <header className="border-b border-white/8 px-6 py-4 flex items-center gap-4 sticky top-0 bg-[#080b14]/95 backdrop-blur-md z-10">
        <a href="/" className="flex items-center gap-3">
          <img src={LOGO_URL} alt="WR-EDU" className="w-9 h-9 object-contain" />
          <div>
            <span className="text-white font-bold text-base">WR-EDU</span>
            <p className="text-white/30 text-[10px] uppercase tracking-widest -mt-0.5">Portal Educacional</p>
          </div>
        </a>
        <div className="ml-auto flex items-center gap-4">
          <a href="/verificar-certificado" className="text-white/40 hover:text-white/70 text-xs transition-colors hidden sm:block">
            Verificar Certificado
          </a>
          <a href="/" className="text-white/40 hover:text-white/70 text-xs transition-colors">
            ← Portal
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5b5ef4]/20 via-transparent to-[#1db89e]/10 pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/8 border border-white/12 rounded-full px-4 py-1.5 mb-8">
            <Shield size={12} className="text-[#1db89e]" />
            <span className="text-xs font-semibold text-white/70">Credenciado junto à ABED</span>
            <a href="https://www.abed.org.br/site/associados/consulta-associados-ativos/" target="_blank" rel="noopener noreferrer"
              className="text-[#1db89e] hover:underline flex items-center gap-1 text-xs ml-1">
              Consultar <ExternalLink size={9} />
            </a>
          </div>

          <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6">
            Professor{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5b5ef4] to-[#1db89e]">
              William Ribeiro
            </span>
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto leading-relaxed mb-6">
            Psicoterapeuta, Psicanalista Diplomado, Logoterapeuta e Sexólogo Integrativo. Coordenador do Curso Profissionalizante de Formação de Terapeutas na WR-EDU, representado oficialmente junto à <strong className="text-white/70">ABED — Associação Brasileira de Educação a Distância</strong>.
          </p>

          <div className="flex flex-wrap justify-center gap-3 text-xs">
            {['Psicoterapeuta', 'Psicanalista', 'Logoterapeuta', 'Sexólogo Integrativo', 'Educador Social'].map(tag => (
              <span key={tag} className="bg-white/8 border border-white/12 px-3 py-1.5 rounded-full text-white/60 font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Credentials */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/20">
            <Award size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Credenciais e Certificações</h2>
            <p className="text-white/40 text-sm">Todas verificáveis e autenticadas</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {credentials.map((cred, i) => (
            <div key={i} className="bg-white/4 border border-white/8 rounded-2xl p-5 hover:bg-white/6 transition-colors">
              <div className={`inline-flex items-center gap-2 border px-3 py-1 rounded-full text-xs font-semibold mb-3 ${cred.badge}`}>
                <Award size={10} />
                {cred.title}
              </div>
              <p className="text-white/60 text-sm font-medium mb-2">{cred.institution}</p>
              <div className="bg-black/30 rounded-xl p-3 mb-3">
                <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1">Código de Autenticidade</p>
                <p className="text-white/60 font-mono text-xs break-all">{cred.code}</p>
              </div>
              {cred.link && (
                <a href={cred.link} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#1db89e] text-xs hover:underline font-medium">
                  <ExternalLink size={11} /> Consultar credencial online
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Specializations */}
        <div className="mt-6 bg-white/4 border border-white/8 rounded-2xl p-5">
          <p className="text-white/50 text-xs uppercase tracking-widest font-bold mb-3">Especializações</p>
          <div className="flex flex-wrap gap-2">
            {['Sexualidade', 'Infidelidade Conjugal', 'Vícios e Dependências', 'Comportamento Organizacional', 'Terapia Cognitivo-Comportamental', 'Psicanálise', 'Logoterapia'].map(spec => (
              <span key={spec} className="bg-white/6 border border-white/10 px-3 py-1.5 rounded-full text-xs text-white/55 font-medium">
                {spec}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Experience */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <BookOpen size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Trajetória Profissional</h2>
            <p className="text-white/40 text-sm">Experiência multidisciplinar</p>
          </div>
        </div>

        <div className="space-y-4">
          {experiences.map((exp, i) => {
            const Icon = exp.icon;
            return (
              <div key={i} className="bg-white/4 border border-white/8 rounded-2xl p-5 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/8 flex items-center justify-center shrink-0">
                  <Icon size={16} className={exp.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="text-white/30 text-[11px] font-mono bg-white/6 border border-white/8 px-2 py-0.5 rounded-full">{exp.period}</span>
                    <h3 className="text-white font-semibold text-sm">{exp.role}</h3>
                  </div>
                  <p className="text-white/45 text-sm leading-relaxed">{exp.desc}</p>
                  {exp.link && (
                    <a href={exp.link} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[#1db89e] text-xs hover:underline mt-2 font-medium">
                      <ExternalLink size={11} /> Saber mais
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* About the course */}
      <section className="border-t border-white/8">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="bg-gradient-to-br from-[#5b5ef4]/15 to-[#1db89e]/10 border border-white/10 rounded-3xl p-8 text-center">
            <Shield size={32} className="mx-auto mb-4 text-[#1db89e]" />
            <h2 className="text-2xl font-bold text-white mb-3">Curso Profissionalizante de Formação de Terapeutas</h2>
            <p className="text-white/50 text-base max-w-2xl mx-auto leading-relaxed mb-6">
              Voltado para pessoas que buscam aprender de forma prática o uso das ferramentas terapêuticas, para levar cuidado, dignidade e empatia a quem necessitar. Representado oficialmente junto à ABED.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <div className="bg-white/8 border border-white/12 rounded-xl px-4 py-2 text-sm">
                <span className="text-white/40 text-xs block">Base Legal</span>
                <span className="text-white/70 font-medium">Lei nº 9.394/96</span>
              </div>
              <div className="bg-white/8 border border-white/12 rounded-xl px-4 py-2 text-sm">
                <span className="text-white/40 text-xs block">Decreto</span>
                <span className="text-white/70 font-medium">Decreto nº 5.154/04</span>
              </div>
              <div className="bg-white/8 border border-white/12 rounded-xl px-4 py-2 text-sm">
                <span className="text-white/40 text-xs block">Credenciamento</span>
                <span className="text-white/70 font-medium">ABED</span>
              </div>
            </div>
            <a href="https://www.abed.org.br/site/associados/consulta-associados-ativos/" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#1db89e] hover:bg-[#1db89e]/90 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm">
              Consultar credenciamento na ABED <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 px-6 py-6 text-center">
        <p className="text-white/20 text-xs">WR-EDU © {new Date().getFullYear()} · Escola de Formação de Terapeutas</p>
        <div className="flex justify-center gap-4 mt-3">
          <a href="/verificar-certificado" className="text-white/25 hover:text-white/50 text-xs transition-colors flex items-center gap-1">
            <Shield size={10} /> Verificar Certificado
          </a>
          <a href="https://www.abed.org.br/site/associados/consulta-associados-ativos/" target="_blank" rel="noopener noreferrer"
            className="text-white/25 hover:text-white/50 text-xs transition-colors flex items-center gap-1">
            <ExternalLink size={10} /> ABED
          </a>
        </div>
      </footer>
    </div>
  );
}