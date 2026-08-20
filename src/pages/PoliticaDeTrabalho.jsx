import React from 'react';
import { Shield, CheckCircle, AlertTriangle, ExternalLink, ArrowLeft, Scale, Award } from 'lucide-react';
import { BRAND_CNPJ, BRAND_LEGAL_NAME, WR_PRIMARY_LOGO } from '@/lib/brand';

const ABED_WHITE = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/fb3aaf448_LogotipoSOMOSASSOCIADOSABED-Branco.png';

export default function PoliticaDeTrabalho() {
  return (
    <div className="min-h-screen bg-[#080b14] text-primary-foreground">
      {/* Header */}
      <div className="bg-[#0d1120] border-b border-border/8 px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <a href="/" className="flex items-center gap-2 text-primary-foreground/40 hover:text-primary-foreground transition-colors text-sm">
            <ArrowLeft size={15} /> Voltar ao site
          </a>
          <div className="h-4 w-px bg-card/10" />
          <div className="flex items-center gap-2">
            <img src={WR_PRIMARY_LOGO} alt={BRAND_LEGAL_NAME} className="w-6 h-6 object-contain" />
            <span className="text-primary-foreground/60 text-sm font-semibold">{BRAND_LEGAL_NAME}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Título */}
        <div className="mb-14 text-center">
          <div className="inline-flex items-center gap-2 bg-[#5b5ef4]/10 border border-[#5b5ef4]/20 rounded-full px-4 py-1.5 mb-4">
            <Shield size={13} className="text-[#5b5ef4]" />
            <span className="text-xs font-bold text-[#5b5ef4] uppercase tracking-widest">Transparência e Ética</span>
          </div>
          <h1 className="text-4xl font-black text-primary-foreground mb-3">Política de Trabalho</h1>
          <p className="text-primary-foreground/50 max-w-xl mx-auto text-sm leading-relaxed">
            Nossa política reflete o compromisso com a legalidade, transparência e respeito aos nossos alunos e à sociedade.
          </p>
        </div>

        {/* Selos de Associação */}
        <div className="bg-gradient-to-r from-[#5b5ef4]/10 via-white/4 to-[#1db89e]/10 border border-border/10 rounded-3xl p-8 mb-10">
          <p className="text-xs font-black text-primary-foreground/30 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Award size={13} className="text-primary" /> Associações e Reconhecimentos Institucionais
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card/6 border border-border/10 rounded-2xl p-6 flex flex-col items-center text-center gap-4">
              <img src={ABED_WHITE} alt="Somos Associados ABED" className="h-28 object-contain" />
              <div>
                <p className="text-primary-foreground font-bold text-sm mb-1">Associação Brasileira de Educação a Distância</p>
                <p className="text-primary-foreground/50 text-xs leading-relaxed">
                  A {BRAND_LEGAL_NAME} é associada à ABED, habilitada a operar em conformidade com a <strong className="text-primary-foreground/70">Lei nº 9.394/96</strong> (LDB) e o <strong className="text-primary-foreground/70">Decreto Presidencial nº 5.154/04</strong>. CNPJ {BRAND_CNPJ}.
                </p>
              </div>
              <a href="https://www.abed.org.br/site/associados/consulta-associados-ativos/" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#5b5ef4] text-xs font-semibold hover:opacity-80 transition-opacity">
                <ExternalLink size={11} /> Consultar Associados Ativos
              </a>
            </div>

            <div className="bg-card/6 border border-border/10 rounded-2xl p-6 flex flex-col items-center text-center gap-4">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#1db89e]/20 to-[#5b5ef4]/20 border border-[#1db89e]/30 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-black text-[#1db89e]">AHDE</p>
                  <p className="text-[9px] text-primary-foreground/40 leading-tight mt-0.5">GLOBAL</p>
                </div>
              </div>
              <div>
                <p className="text-primary-foreground font-bold text-sm mb-1">Association for Human Development and Evolution</p>
                <p className="text-primary-foreground/50 text-xs leading-relaxed">
                  Órgão internacional que registra e fiscaliza a atuação de profissionais em métodos terapêuticos comportamentais. Prof. William Ribeiro registrado sob o <strong className="text-primary-foreground/70">ID: 00403THE</strong>.
                </p>
              </div>
              <a href="https://ahde-global.org/?lang=pt-br" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#1db89e] text-xs font-semibold hover:opacity-80 transition-opacity">
                <ExternalLink size={11} /> Verificar Registro AHDE
              </a>
            </div>
          </div>

          <div className="mt-5 bg-card/4 border border-border/8 rounded-2xl px-6 py-4 flex items-start gap-3">
            <CheckCircle size={15} className="text-[#1db89e] mt-0.5 shrink-0" />
            <p className="text-primary-foreground/60 text-sm">
              Nossos cursos estão em <strong className="text-primary-foreground">conformidade com os critérios do Ministério Público do Estado do Paraná</strong>, garantindo segurança jurídica para alunos e instituição.
            </p>
          </div>
        </div>

        {/* Sobre os Cursos */}
        <div className="space-y-4 mb-10">
          <h2 className="text-lg font-black text-primary-foreground flex items-center gap-2">
            <CheckCircle size={16} className="text-[#1db89e]" /> Sobre os Cursos
          </h2>
          <div className="bg-[#0d1120] border border-border/8 rounded-2xl p-6 space-y-4 text-sm text-primary-foreground/60 leading-relaxed">
            <p>
              Todos os cursos são <strong className="text-primary-foreground">totalmente on-line</strong>, com atividades práticas de técnicas terapêuticas voltadas ao acolhimento, cuidado, mediação e preservação da vida, destinados à capacitação profissional.
            </p>
            <div className="h-px bg-card/5" />
            <p>
              Os cursos são voltados para pessoas que buscam aprender, de forma prática, o uso das ferramentas terapêuticas para levar <strong className="text-primary-foreground">cuidado, dignidade e empatia</strong> a quem necessitar.
            </p>
          </div>
        </div>

        {/* Aviso Legal */}
        <div className="space-y-4 mb-10">
          <h2 className="text-lg font-black text-primary-foreground flex items-center gap-2">
            <AlertTriangle size={16} className="text-primary" /> Aviso Legal Importante
          </h2>
          <div className="bg-accent/5 border border-primary/20 rounded-2xl p-6 space-y-4 text-sm leading-relaxed">
            <p className="text-primary/80">
              Os cursos <strong className="text-primary">não são considerados de nível superior</strong> (graduação, extensão ou pós-graduação).
            </p>
            <div className="h-px bg-accent/10" />
            <p className="text-primary/80">
              Os cursos <strong className="text-primary">não possuem reconhecimento ou autorização</strong> de órgãos como:
              MEC, CONTRAN, DENATRAN, CIRETRAN, DETRAN, CETRAN, CONTRANDIFE, COFFITO, CRO, CRM, CFP, CREA, entre outros.
            </p>
          </div>
        </div>

        {/* Certificação */}
        <div className="space-y-4 mb-10">
          <h2 className="text-lg font-black text-primary-foreground flex items-center gap-2">
            <Award size={16} className="text-[#5b5ef4]" /> Política de Certificação
          </h2>
          <div className="bg-[#0d1120] border border-border/8 rounded-2xl p-6 space-y-5 text-sm text-primary-foreground/60 leading-relaxed">
            <p>
              Para obter o certificado é necessário estar <strong className="text-primary-foreground">aprovado na avaliação</strong> e cumprir todos os requisitos dos Termos de Serviço deste site, bem como o tempo de estudo exigido.
            </p>
            <div className="flex items-start gap-3 bg-[#1db89e]/8 border border-[#1db89e]/20 rounded-xl p-4">
              <CheckCircle size={15} className="text-[#1db89e] mt-0.5 shrink-0" />
              <p className="text-primary-foreground/70 text-sm">
                <strong className="text-primary-foreground">Temos orgulho de afirmar</strong> que nesta Instituição não antecipamos o certificado nem retroagimos datas, pois temos profundo respeito pelos alunos que genuinamente dedicam seu tempo aos estudos e conquistam seus certificados de maneira honrosa.
              </p>
            </div>
            <p>
              É com base nesse princípio que reiteramos nosso compromisso em garantir que nossos certificados tenham <strong className="text-primary-foreground">valor real e sejam considerados documentos legítimos</strong>.
            </p>
          </div>
        </div>

        {/* ─── Seções complementares ─────────────────────────────── */}

        <div className="mb-10">
          <h2 className="text-2xl font-black text-primary-foreground mb-3">Política de Trabalho e Compromisso Ético</h2>
          <p className="text-primary-foreground/55 text-sm leading-relaxed">
            Nossa Política de Trabalho reflete os valores que sustentam cada etapa da nossa formação. Acreditamos que a excelência não é um destino, mas um padrão de conduta aplicado diariamente na relação entre professor, aluno e o futuro paciente.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-black text-primary-foreground flex items-center gap-2">
            <CheckCircle size={16} className="text-[#5b5ef4]" /> 1. Natureza da Formação e Amparo Legal
          </h2>
          <div className="bg-[#0d1120] border border-border/8 rounded-2xl p-6 text-sm text-primary-foreground/60 leading-relaxed">
            <p>
              A {BRAND_LEGAL_NAME} dedica-se à oferta de <strong className="text-primary-foreground">Cursos de Formação Profissionalizante Livre</strong>, em conformidade com a <strong className="text-primary-foreground">Lei nº 9.394 (Diretrizes e Bases da Educação Nacional)</strong>. Nossas certificações são de caráter profissionalizante e de atualização técnica, não se configurando como cursos de graduação ou pós-graduação acadêmica. Nosso objetivo é a capacitação prática para o exercício ético e técnico da terapia no âmbito das terapias integrativas e comportamentais.
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-black text-primary-foreground flex items-center gap-2">
            <CheckCircle size={16} className="text-[#1db89e]" /> 2. Metodologia e Interação Real-Time
          </h2>
          <div className="bg-[#0d1120] border border-border/8 rounded-2xl p-6 text-sm text-primary-foreground/60 leading-relaxed">
            <p>
              Nosso compromisso é com o <strong className="text-primary-foreground">aprendizado ativo</strong>. Diferente de modelos de ensino passivos, nossa política de trabalho prioriza a <strong className="text-primary-foreground">interação em tempo real</strong>. As aulas e mentorias são desenhadas para proporcionar o diálogo direto com o professor e a troca de experiências entre os membros da classe. A participação nos grupos de integração é incentivada como ferramenta fundamental para o networking e o fortalecimento da comunidade acadêmica e profissional.
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-black text-primary-foreground flex items-center gap-2">
            <CheckCircle size={16} className="text-[#1db89e]" /> 3. Prática Terapêutica Assistida
          </h2>
          <div className="bg-[#0d1120] border border-border/8 rounded-2xl p-6 text-sm text-primary-foreground/60 leading-relaxed">
            <p>
              A excelência na terapia nasce da vivência. Nossa política garante que o aluno tenha contato com <strong className="text-primary-foreground">simulações e práticas de consultório</strong> ainda durante o período de formação. Essas atividades são conduzidas sob rigorosos critérios éticos, preparando o futuro terapeuta para lidar com a subjetividade humana em áreas como <strong className="text-primary-foreground">Terapia Comportamental, Psicanálise e Sexualidade Humana</strong> com segurança e profundidade.
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-black text-primary-foreground flex items-center gap-2">
            <CheckCircle size={16} className="text-[#5b5ef4]" /> 4. Conduta Ética e Humanização
          </h2>
          <div className="bg-[#0d1120] border border-border/8 rounded-2xl p-6 text-sm text-primary-foreground/60 leading-relaxed">
            <p>
              Pautamos nosso trabalho no resgate da dignidade e no acolhimento. Espera-se que todos os alunos e colaboradores mantenham conduta baseada no <strong className="text-primary-foreground">respeito mútuo</strong>, no <strong className="text-primary-foreground">sigilo das informações compartilhadas em aula</strong> e na busca constante pela humanização do atendimento. Não formamos apenas técnicos; formamos <strong className="text-primary-foreground">agentes de transformação social</strong> que utilizam a empatia como ferramenta de trabalho.
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-10">
          <h2 className="text-lg font-black text-primary-foreground flex items-center gap-2">
            <Shield size={16} className="text-[#5b5ef4]" /> 5. Propriedade Intelectual e Direitos
          </h2>
          <div className="bg-[#0d1120] border border-border/8 rounded-2xl p-6 text-sm text-primary-foreground/60 leading-relaxed">
            <p>
              Todo o material didático, metodologias exclusivas (como a <strong className="text-primary-foreground">Teoria da Utilidade Comportamental</strong>) e conteúdos disponibilizados na plataforma são de <strong className="text-primary-foreground">propriedade intelectual da {BRAND_LEGAL_NAME} e de seu mantenedor</strong>. O uso desse material é restrito ao aprendizado individual, sendo proibida a reprodução ou distribuição sem autorização prévia.
            </p>
          </div>
        </div>

        {/* Citação */}
        <div className="bg-gradient-to-r from-[#5b5ef4]/10 via-white/4 to-[#1db89e]/10 border border-border/10 rounded-3xl p-8 mb-10 text-center">
          <p className="text-primary-foreground/80 text-lg italic leading-relaxed mb-3">
            "Você pode fazer muitas coisas na sua vida, mas a excelência vai se apresentar somente quando encontrar o que realmente nasceu para fazer."
          </p>
          <p className="text-[#5b5ef4] text-sm font-bold">— William Ribeiro</p>
          <p className="text-primary-foreground/40 text-xs mt-4">Esta política visa assegurar que sua jornada conosco seja produtiva, segura e, acima de tudo, transformadora.</p>
        </div>

        {/* Aviso Penal */}
        <div className="space-y-4 mb-14">
          <h2 className="text-lg font-black text-primary-foreground flex items-center gap-2">
            <Scale size={16} className="text-destructive" /> Responsabilidade Legal
          </h2>
          <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6 text-sm leading-relaxed">
            <p className="text-destructive/80">
              A utilização e/ou emissão de certificados <strong className="text-destructive">sem o devido cumprimento da carga horária</strong> não apenas decepciona os alunos comprometidos, mas também pode configurar <strong className="text-destructive">crime de falsidade ideológica</strong>, conforme previsto no{' '}
              <strong className="text-destructive">Art. 299 do Código Penal Brasileiro</strong>, sujeito a pena de reclusão de um a cinco anos.
            </p>
          </div>
        </div>

        {/* Footer da página */}
        <div className="border-t border-border/8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={WR_PRIMARY_LOGO} alt={BRAND_LEGAL_NAME} className="w-8 h-8 object-contain" />
            <div>
              <p className="text-primary-foreground font-bold text-sm">{BRAND_LEGAL_NAME}</p>
              <p className="text-primary-foreground/30 text-xs">CNPJ {BRAND_CNPJ}</p>
            </div>
          </div>
          <div className="text-center">
            <span style={{
              fontFamily: '"Dancing Script", "Brush Script MT", cursive',
              fontSize: 28,
              color: '#7b8fcc',
              letterSpacing: 2,
              display: 'block',
              lineHeight: 1.2,
            }}>William Ribeiro S.</span>
            <div className="w-48 border-t border-border/15 pt-2 mx-auto">
              <p className="text-primary-foreground/30 text-[10px] uppercase tracking-widest">Direção Geral · {BRAND_LEGAL_NAME}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-card/5 border border-border/8 rounded-full px-3 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1db89e]" />
            <span className="text-primary-foreground/30 text-[10px] font-mono font-semibold tracking-widest">V-003-00</span>
          </div>
        </div>
      </div>
    </div>
  );
}