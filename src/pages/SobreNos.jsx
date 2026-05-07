import React from 'react';
import { ExternalLink, Award, Shield, Globe, GraduationCap, Briefcase, Heart, BookOpen, CheckCircle } from 'lucide-react';

const CertCard = ({ title, institution, code, link, linkLabel }) => (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/8 transition-all">
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5b5ef4]/30 to-[#1db89e]/20 flex items-center justify-center shrink-0">
        <Award size={16} className="text-[#1db89e]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm">{title}</p>
        <p className="text-white/50 text-xs mt-0.5">{institution}</p>
        {code && (
          <p className="text-white/30 text-[10px] font-mono mt-1.5 break-all">
            Código: {code}
          </p>
        )}
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-2.5 text-[#1db89e] text-xs font-medium hover:text-[#1db89e]/80 transition-colors group"
          >
            <Globe size={11} />
            {linkLabel || 'Verificar credencial'}
            <ExternalLink size={10} className="opacity-60 group-hover:opacity-100 transition-opacity" />
          </a>
        )}
      </div>
    </div>
  </div>
);

const TimelineItem = ({ year, desc }) => (
  <div className="flex gap-4">
    <div className="flex flex-col items-center">
      <div className="w-8 h-8 rounded-full bg-[#5b5ef4]/20 border border-[#5b5ef4]/40 flex items-center justify-center shrink-0">
        <CheckCircle size={13} className="text-[#5b5ef4]" />
      </div>
      <div className="w-px flex-1 bg-white/8 mt-2" />
    </div>
    <div className="pb-6">
      <span className="text-[#1db89e] text-xs font-bold tracking-widest uppercase">{year}</span>
      <p className="text-white/70 text-sm mt-1 leading-relaxed">{desc}</p>
    </div>
  </div>
);

export default function SobreNos() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-[#080b14] via-[#0d1120] to-[#080b14] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#5b5ef4]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#1db89e]/8 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 lg:py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-[#1db89e]/15 border border-[#1db89e]/25 rounded-full px-4 py-1.5 mb-6">
            <Shield size={12} className="text-[#1db89e]" />
            <span className="text-xs font-semibold text-[#1db89e]">Credenciais Verificáveis</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
            Prof. William Ribeiro
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Coordenador Geral do Curso Profissionalizante para Formação de Terapeutas — WR-EDU
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">

        {/* Sobre o Curso */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
            <BookOpen size={18} className="text-[#5b5ef4]" /> Sobre o Curso
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-3">
            O <strong className="text-foreground">Curso Profissionalizante para Formação de Terapeutas</strong> é voltado para pessoas que buscam aprender de forma prática o uso das ferramentas terapêuticas para levar cuidado, dignidade e empatia a quem necessitar.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            O curso é representado oficialmente através do seu mantenedor (William Ribeiro) junto à <strong className="text-foreground">ABED — Associação Brasileira de Educação a Distância</strong>.
          </p>
          <a
            href="https://www.abed.org.br/site/associados/consulta-associados-ativos/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#5b5ef4]/10 border border-[#5b5ef4]/25 text-[#a09ef4] hover:text-white hover:bg-[#5b5ef4]/20 transition-all px-4 py-2.5 rounded-xl text-sm font-medium"
          >
            <Globe size={14} />
            Consultar associados ABED
            <ExternalLink size={12} />
          </a>
        </section>

        {/* Certificações */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Award size={18} className="text-[#1db89e]" /> Certificações e Registros
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <CertCard
              title="Psicoterapeuta"
              institution="Faculdade Unypublica"
              code="267797-1-432-19012026071526"
            />
            <CertCard
              title="Terapeuta — Registro Internacional"
              institution="AHDE — Association for Human Development and Evolution"
              code="ID: 00403THE"
              link="https://ahde-global.org/?lang=pt-br"
              linkLabel="Consultar na AHDE"
            />
            <CertCard
              title="Psicanalista Diplomado"
              institution="Faculdade Unifatec"
              code="eeee6d19-0d18-46c5-a657-3e6f5bfdb515"
            />
            <CertCard
              title="Psicanalista — Registro Internacional"
              institution="Therapist University"
              code="CERT-1768040814293-CAZA86VTQ"
              link="https://certificados.therapist.university/certificates/CERT-1768040814293-CAZA86VTQ"
              linkLabel="Consultar certificado"
            />
            <CertCard
              title="Logoterapeuta Diplomado"
              institution="Faculdade Unypublica"
              code="267797-1-405-13112025030416"
            />
            <CertCard
              title="Sexólogo Integrativo"
              institution="Unifast — School Of Business Acceleration"
              code="000300950029868"
            />
          </div>
          <p className="text-white/40 text-xs mt-4 italic">
            Possui especializações no campo da sexualidade, infidelidade conjugal, vícios, entre outras.
          </p>
        </section>

        {/* Trajetória */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Briefcase size={18} className="text-[#5b5ef4]" /> Trajetória Profissional
          </h2>
          <div>
            <TimelineItem year="2009 — 2019" desc="Atuou diretamente no âmbito administrativo, passando por departamentos como Financeiro, Recursos Humanos e Departamento Pessoal, inclusive atuando como Headhunter em processos seletivos." />
            <TimelineItem year="2019" desc="Integrou a turma de Administração da UFPR, destacando-se nas matérias de Comportamento Organizacional." />
            <TimelineItem year="2020" desc="Durante a crise da pandemia, atuou como Operador Ativo no Mercado Financeiro e de Criptoativos." />
            <TimelineItem year="2022" desc="Atuou como Profissional de Tecnologia do 8° Registro de Imóveis de Curitiba, participando ativamente do processo de implementação e migração tecnológica." />
            <TimelineItem year="Hoje" desc="Além dos trabalhos acadêmicos e pesquisas, é dirigente do grupo Sinapse Coletiva — formado por diversos profissionais da saúde comportamental — e gerencia o Curso Profissionalizante para Formação de Terapeutas na plataforma WR-EDU." />
          </div>
        </section>

        {/* Projeto Social */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Heart size={18} className="text-rose-400" /> Responsabilidade Social
          </h2>
          <div className="bg-gradient-to-br from-rose-500/8 to-orange-500/5 border border-rose-500/15 rounded-2xl p-6">
            <p className="text-foreground font-semibold mb-1">Projeto Vida Digital — ADRA</p>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              O Prof. William atua como Profissional de Educação Social para Crianças e Adolescentes em um programa promovido pela Instituição Internacional <strong className="text-foreground">ADRA</strong>. O projeto <strong className="text-foreground">Vida Digital</strong> é responsável por reestruturar grupos em situação de vulnerabilidade social, levando temas socioeducacionais, proporcionando o resgate da dignidade, o incentivo aos estudos e a quebra de paradigmas relacionados à imagem de bairros da periferia.
            </p>
            <a
              href="https://adra.org.br/projetos/vida-digital/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-rose-500/10 border border-rose-500/25 text-rose-300 hover:text-white hover:bg-rose-500/20 transition-all px-4 py-2.5 rounded-xl text-sm font-medium"
            >
              <Globe size={14} />
              Conhecer o Projeto Vida Digital
              <ExternalLink size={12} />
            </a>
          </div>
        </section>

        {/* Sinapse Coletiva */}
        <section>
          <div className="bg-gradient-to-br from-[#5b5ef4]/8 to-[#1db89e]/5 border border-[#5b5ef4]/15 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#5b5ef4]/20 flex items-center justify-center shrink-0">
                <GraduationCap size={18} className="text-[#5b5ef4]" />
              </div>
              <div>
                <p className="text-white font-semibold mb-1">Grupo Sinapse Coletiva</p>
                <p className="text-white/55 text-sm leading-relaxed">
                  Formado por diversos profissionais da saúde comportamental com um único desejo: construir um espaço consciente e equilibrado na busca de técnicas e da proximidade da comunidade profissional e acadêmica.
                </p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}