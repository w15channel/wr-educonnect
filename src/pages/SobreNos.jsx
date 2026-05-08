import React from 'react';
import { ExternalLink, CheckCircle2, Award, Globe, Heart, Users, AlertCircle, Sparkles } from 'lucide-react';

const PROFESSOR_PHOTO = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/5265f3b64_1000407748_d589e7f2d77d09c6941cdd7fa30003c5-03_02_202612_32_07.png';

// ─── Reusable: Premium Credential Badge ──────────────────────────────────────
function CredentialBadge({ title, institution, code, link, linkLabel, iconLetter = 'ψ' }) {
  return (
    <div className="bg-white border border-[#d4af37]/30 rounded-lg p-5 text-center shadow-sm hover:shadow-md transition-all relative">
      {/* Inner gold border frame */}
      <div className="absolute inset-2 border border-[#d4af37]/20 rounded pointer-events-none" />
      <div className="relative">
        <h4 className="text-[#0f2645] font-serif font-bold text-base tracking-wide uppercase">{title}</h4>
        <p className="text-[#0f2645]/60 text-sm mt-0.5 mb-4 italic">({institution})</p>
        {/* Medal */}
        <div className="flex justify-center mb-3">
          <div className="relative w-14 h-16 flex flex-col items-center">
            {/* Ribbons */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 flex gap-0.5">
              <div className="w-2.5 h-7 bg-gradient-to-b from-[#0f2645] to-[#1e3a5f] skew-x-6" style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 20% 100%)' }} />
              <div className="w-2.5 h-7 bg-gradient-to-b from-[#d4af37] to-[#b8941f] skew-x-6" style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 20% 100%)' }} />
              <div className="w-2.5 h-7 bg-gradient-to-b from-[#0f2645] to-[#1e3a5f] skew-x-6" style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 20% 100%)' }} />
            </div>
            {/* Coin */}
            <div className="absolute bottom-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#f4d574] via-[#d4af37] to-[#a8821a] flex items-center justify-center border-2 border-[#b8941f] shadow-md">
              <span className="text-[#0f2645] font-bold text-base">{iconLetter}</span>
            </div>
          </div>
        </div>
        {code && (
          <p className="text-[#0f2645]/40 text-[9px] font-mono break-all mb-1.5 leading-tight">
            {code}
          </p>
        )}
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[#0f7a5f] text-xs font-semibold hover:underline"
          >
            <CheckCircle2 size={11} />
            {linkLabel || 'Verificar'}
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Section heading (serif, gold underline) ─────────────────────────────────
function SectionHeading({ children, center = false }) {
  return (
    <div className={center ? 'text-center mb-10' : 'mb-8'}>
      <h2 className="font-serif text-3xl lg:text-4xl text-[#0f2645] tracking-wide uppercase">{children}</h2>
      <div className={`h-0.5 w-16 bg-[#d4af37] mt-3 ${center ? 'mx-auto' : ''}`} />
    </div>
  );
}

// ─── Timeline item ───────────────────────────────────────────────────────────
function TimelineItem({ year, title, desc }) {
  return (
    <div className="flex gap-5">
      <div className="flex flex-col items-center shrink-0">
        <span className="font-serif text-[#0f2645] font-bold text-base w-20 text-right -mr-2">{year}</span>
      </div>
      <div className="relative flex flex-col items-center shrink-0">
        <div className="w-3 h-3 rounded-full bg-[#0f2645] border-2 border-white ring-2 ring-[#0f2645]/20 mt-1.5" />
        <div className="w-px flex-1 bg-[#0f2645]/20 my-1" />
      </div>
      <div className="pb-7 pt-0.5 flex-1 min-w-0">
        {title && <p className="text-[#0f2645] font-bold text-sm mb-1">{title}</p>}
        <p className="text-[#0f2645]/70 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function SobreNos() {
  return (
    <div className="min-h-screen bg-[#f5f3ef] font-jakarta">
      {/* ── HERO ── */}
      <section className="relative bg-gradient-to-br from-[#e8e9ed] via-[#eef0f4] to-[#dde0e6] overflow-hidden">
        {/* Decorative gold curves */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <svg className="absolute right-0 top-0 h-full w-1/2 opacity-40" viewBox="0 0 600 600" fill="none">
            <circle cx="500" cy="300" r="280" fill="#d4af37" fillOpacity="0.08" />
            <path d="M450 100 Q 600 300 450 500" stroke="#d4af37" strokeWidth="2" fill="none" opacity="0.3"/>
            <path d="M500 50 Q 700 300 500 550" stroke="#d4af37" strokeWidth="1.5" fill="none" opacity="0.2"/>
          </svg>
        </div>

        <div className="relative max-w-6xl mx-auto px-6 lg:px-10 py-12 lg:py-20 grid lg:grid-cols-2 gap-8 items-center">
          {/* Left: Text */}
          <div>
            <h1 className="font-serif text-4xl lg:text-5xl xl:text-6xl text-[#0f2645] leading-[1.05] tracking-wide uppercase">
              Prof. William<br/>Ribeiro
            </h1>
            <p className="text-[#0f2645]/70 text-base lg:text-lg mt-5 leading-relaxed max-w-md">
              Coordenador Geral · Escola de Capacitação Profissionalizante na Área do Comportamento
            </p>

            {/* Disclaimer card */}
            <div className="mt-6 bg-white/90 backdrop-blur border-l-4 border-[#d4af37] rounded-r-lg p-4 max-w-md shadow-sm">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-[#d4af37] shrink-0 mt-0.5" />
                <p className="text-[#0f2645] text-sm leading-relaxed">
                  <strong className="font-bold">NÃO é faculdade</strong> nem pós-graduação — é formação prática com vivência terapêutica.
                </p>
              </div>
            </div>

            <a href="#credenciais" className="inline-flex items-center gap-2 mt-6 bg-[#0f2645] text-white px-7 py-3 rounded-sm text-sm font-bold tracking-widest uppercase hover:bg-[#1e3a5f] transition-colors">
              Saiba Mais
            </a>
          </div>

          {/* Right: Photo with circle */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative">
              <div className="absolute inset-0 -z-10 flex items-center justify-center">
                <div className="w-72 h-72 lg:w-96 lg:h-96 rounded-full bg-gradient-to-br from-[#d4af37]/40 to-[#d4af37]/10" />
              </div>
              <img
                src={PROFESSOR_PHOTO}
                alt="Prof. William Ribeiro"
                className="relative w-64 h-80 lg:w-80 lg:h-[420px] object-cover object-top rounded-md shadow-xl"
                crossOrigin="anonymous"
              />
              <div className="absolute -top-4 -right-4 w-20 h-20 lg:w-28 lg:h-28 pointer-events-none">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <path d="M 50 0 L 100 50 L 50 100 L 0 50 Z" fill="#d4af37" opacity="0.3"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CREDENCIAIS ── */}
      <section id="credenciais" className="bg-white py-16 lg:py-20 relative overflow-hidden">
        {/* Decorative side waves */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-32 h-64 opacity-30 pointer-events-none">
          <svg viewBox="0 0 100 200" fill="none">
            {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
              <path key={i} d={`M0 ${20 + i*22} Q 50 ${10 + i*22}, 100 ${20 + i*22}`} stroke="#d4af37" strokeWidth="1" fill="none" opacity="0.4"/>
            ))}
          </svg>
        </div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-32 h-64 opacity-20 pointer-events-none">
          <svg viewBox="0 0 100 100" fill="none">
            <path d="M 30 10 L 90 50 L 30 90 Z" stroke="#d4af37" strokeWidth="1" fill="none"/>
            <path d="M 20 20 L 80 50 L 20 80 Z" stroke="#d4af37" strokeWidth="1" fill="none"/>
            <path d="M 10 30 L 70 50 L 10 70 Z" stroke="#d4af37" strokeWidth="1" fill="none"/>
          </svg>
        </div>

        <div className="max-w-6xl mx-auto px-6 lg:px-10 relative">
          <SectionHeading center>Credenciais e Certificações</SectionHeading>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            <CredentialBadge title="Psicoterapeuta" institution="Unypublica" code="267797-1-432-19012026071526" iconLetter="ψ" />
            <CredentialBadge title="Psicanalista" institution="Unifatec" code="eeee6d19-0d18-46c5-a657-3e6f5bfdb515" iconLetter="Ψ" />
            <CredentialBadge title="Logoterapeuta" institution="Unypublica" code="267797-1-405-13112025030416" iconLetter="λ" />
            <CredentialBadge title="Sexólogo Integrativo" institution="Unifast" code="000300950029868" iconLetter="♀" />
            <CredentialBadge
              title="Registro Internacional"
              institution="AHDE Global"
              code="ID: 00403THE"
              link="https://ahde-global.org/?lang=pt-br"
              linkLabel="Verificar AHDE"
              iconLetter="A"
            />
            <CredentialBadge
              title="Registro Internacional"
              institution="Therapist University"
              code="CERT-1768040814293-CAZA86VTQ"
              link="https://certificados.therapist.university/certificates/CERT-1768040814293-CAZA86VTQ"
              linkLabel="Verificar Therapist University"
              iconLetter="T"
            />
          </div>

          <p className="text-center text-[#0f2645]/50 text-sm italic mt-8 max-w-2xl mx-auto">
            Possui especializações no campo da sexualidade, infidelidade conjugal, vícios, entre outras áreas do comportamento humano.
          </p>
        </div>
      </section>

      {/* ── TRAJETÓRIA + PROJETO SOCIAL ── */}
      <section className="bg-[#eef0f4] py-16 lg:py-20 relative overflow-hidden">
        <div className="absolute right-0 top-10 w-32 h-32 opacity-20 pointer-events-none">
          <svg viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="40" stroke="#d4af37" strokeWidth="1" fill="none"/>
            <circle cx="50" cy="50" r="30" stroke="#d4af37" strokeWidth="1" fill="none"/>
          </svg>
        </div>

        <div className="max-w-6xl mx-auto px-6 lg:px-10 grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Trajetória */}
          <div>
            <SectionHeading>Trajetória<br/>Profissional</SectionHeading>
            <div className="mt-6">
              <TimelineItem
                year="Hoje"
                title="Coordenador Geral · WR-EDU"
                desc="Dirige o grupo Sinapse Coletiva e o Curso Profissionalizante para Formação de Terapeutas, além de pesquisas e produção acadêmica."
              />
              <TimelineItem
                year="2022"
                title="Tecnologia · 8º Registro de Imóveis"
                desc="Atuou no processo de implementação e migração tecnológica do 8º Registro de Imóveis de Curitiba."
              />
              <TimelineItem
                year="2020"
                title="Mercado Financeiro"
                desc="Operador Ativo no Mercado Financeiro e de Criptoativos durante o período da pandemia."
              />
              <TimelineItem
                year="2019"
                title="Administração · UFPR"
                desc="Integrou a turma de Administração da UFPR, destacando-se em Comportamento Organizacional."
              />
              <TimelineItem
                year="2009"
                title="Início da Trajetória"
                desc="Atuação em departamentos como Financeiro, RH e Departamento Pessoal, inclusive como Headhunter em processos seletivos."
              />
            </div>
          </div>

          {/* Projeto Social + Sinapse */}
          <div className="space-y-8">
            <div>
              <SectionHeading>Projeto Social</SectionHeading>
              <div className="bg-white rounded-lg p-6 shadow-sm border border-[#d4af37]/15">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-lg text-[#0f2645] font-bold mb-2">ADRA — Vida Digital</h3>
                    <p className="text-[#0f2645]/70 text-sm leading-relaxed mb-3">
                      Profissional de Educação Social para crianças e adolescentes em programa promovido pela Instituição Internacional ADRA. O projeto Vida Digital reestrutura grupos em situação de vulnerabilidade social, levando temas socioeducacionais e o resgate da dignidade.
                    </p>
                    <a href="https://adra.org.br/projetos/vida-digital/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[#0f2645] font-bold text-xs hover:text-[#d4af37] transition-colors">
                      <Heart size={12} className="text-[#d4af37]" />
                      ADRA · Vida Digital
                      <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <SectionHeading>Sinapse Coletiva</SectionHeading>
              <div className="bg-white rounded-lg p-6 shadow-sm border border-[#d4af37]/15 space-y-4">
                <div className="flex items-start gap-3">
                  <Users size={18} className="text-[#d4af37] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[#0f2645] font-bold text-sm">Prof. William Ribeiro</p>
                    <p className="text-[#0f2645]/60 text-xs">Coordenador Geral · Dirigente do Grupo</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Sparkles size={18} className="text-[#d4af37] mt-0.5 shrink-0" />
                  <p className="text-[#0f2645]/70 text-sm leading-relaxed">
                    Grupo formado por diversos profissionais da saúde comportamental em busca de técnicas e proximidade da comunidade profissional e acadêmica.
                  </p>
                </div>
                <p className="text-[#0f2645]/60 text-xs italic border-t border-[#d4af37]/20 pt-3">
                  O Sinapse Coletiva atende com ética, respeito e proximidade da comunidade científica terapêutica.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOBRE O CURSO ── */}
      <section className="bg-white py-16 lg:py-20 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-40 h-40 opacity-20 pointer-events-none">
          <svg viewBox="0 0 100 100" fill="none">
            {[0, 1, 2, 3, 4].map(i => (
              <path key={i} d={`M${10+i*15} 10 L${30+i*15} 10 L${50+i*15} 90 L${30+i*15} 90 Z`} stroke="#d4af37" strokeWidth="0.8" fill="none"/>
            ))}
          </svg>
        </div>

        <div className="max-w-6xl mx-auto px-6 lg:px-10 grid lg:grid-cols-3 gap-10 items-start">
          <div className="lg:col-span-2">
            <SectionHeading>Sobre o Curso</SectionHeading>
            <p className="text-[#0f2645]/80 text-base leading-relaxed mb-4">
              O <strong className="text-[#0f2645] font-bold">WR-EDU</strong> é uma <strong className="text-[#0f2645] font-bold">Escola de Capacitação Profissionalizante na Área do Comportamento</strong>, voltada ao ensino e à prática de técnicas terapêuticas, com vivência da experiência terapêutica. Aqui, capacitamos profissionais para levar cuidado, dignidade e empatia a quem necessitar.
            </p>

            <div className="bg-[#f5f3ef] border-l-4 border-[#d4af37] rounded-r-lg p-5 mb-4">
              <p className="font-serif text-[#0f2645] font-bold text-base mb-2 uppercase tracking-wide">Que não é?</p>
              <p className="text-[#0f2645]/80 text-sm leading-relaxed">
                <strong>Não é faculdade nem pós-graduação</strong> — é formação prática profissionalizante. Não substitui graduação acadêmica em Psicologia ou cursos de bacharelado. Nosso foco é a <strong>aplicação prática das ferramentas terapêuticas</strong>, com vivência supervisionada da experiência terapêutica entre os alunos.
              </p>
            </div>

            <p className="text-[#0f2645]/80 text-base leading-relaxed">
              O curso é representado oficialmente por seu mantenedor (William Ribeiro) junto à <strong className="text-[#0f2645] font-bold">ABED — Associação Brasileira de Educação a Distância</strong>, garantindo transparência e seriedade institucional.
            </p>
          </div>

          {/* ABED Seal */}
          <div className="flex flex-col items-center text-center">
            <div className="relative w-48 h-48 lg:w-56 lg:h-56">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#0f2645] to-[#1e3a5f] shadow-lg flex items-center justify-center border-8 border-[#d4af37]">
                <div className="text-center">
                  <p className="text-[#d4af37] font-serif text-[10px] tracking-[0.3em] uppercase mb-1">Associação Brasileira</p>
                  <div className="bg-white rounded-full w-20 h-20 mx-auto flex items-center justify-center my-1 shadow-inner">
                    <span className="font-serif font-black text-2xl text-[#0f2645] tracking-widest">ABED</span>
                  </div>
                  <p className="text-[#d4af37] font-serif text-[10px] tracking-[0.3em] uppercase mt-1">de Educação a Distância</p>
                </div>
              </div>
              {/* Outer ring text simulation */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 200">
                <defs>
                  <path id="circle-text" d="M 100, 100 m -85, 0 a 85,85 0 1,1 170,0 a 85,85 0 1,1 -170,0" />
                </defs>
              </svg>
            </div>
            <a
              href="https://www.abed.org.br/site/associados/consulta-associados-ativos/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-4 text-[#0f2645] font-bold text-sm hover:text-[#d4af37] transition-colors underline decoration-[#d4af37]/40 underline-offset-4"
            >
              Associação Brasileira de<br/>Educação a Distância
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0f2645] py-6 px-6 lg:px-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/60 text-xs">
            Copyright © {new Date().getFullYear()} · Prof. William Ribeiro · WR-EDU · Capacitação Profissionalizante
          </p>
          <div className="flex items-center gap-2 text-white/40 text-xs">
            <Award size={12} className="text-[#d4af37]" />
            Credenciais verificáveis
          </div>
        </div>
      </footer>
    </div>
  );
}