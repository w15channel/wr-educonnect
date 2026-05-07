import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

const WR_LOGO = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/5265f3b64_1000407748_d589e7f2d77d09c6941cdd7fa30003c5-03_02_202612_32_07.png';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50 font-jakarta">
      <nav className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3">
            <img src={WR_LOGO} alt="WR-EDU" className="h-8 w-8 object-contain" />
            <p className="font-bold text-slate-800 text-sm">WR-EDU</p>
          </Link>
          <Link to="/" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft size={14} /> Voltar
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Shield size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">Termos de Serviço</h1>
            <p className="text-sm text-slate-500">WR-EDU — Instituto de Desenvolvimento Humano · Última atualização: maio de 2026</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm space-y-8 text-slate-600 text-sm leading-relaxed">

          <section>
            <h2 className="text-base font-bold text-slate-800 mb-3">1. Aceitação dos Termos</h2>
            <p>Ao se cadastrar, acessar ou utilizar qualquer serviço oferecido pela <strong>WR-EDU — Instituto de Desenvolvimento Humano</strong> (CNPJ: 62.213.790/0001-40), você declara ter lido, compreendido e aceitado integralmente estes Termos de Serviço e a nossa Política de Privacidade.</p>
            <p className="mt-2">Caso não concorde com qualquer parte destes termos, você não deve utilizar nossa plataforma. O uso contínuo dos serviços após alterações constitui aceitação tácita das modificações.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-800 mb-3">2. Sobre a WR-EDU</h2>
            <p>A WR-EDU é uma <strong>agência de formação profissionalizante</strong> dedicada às práticas terapêuticas, registrada sob o CNPJ <strong>62.213.790/0001-40</strong>. Somos associados à <strong>ABED — Associação Brasileira de Educação a Distância</strong>, garantindo padrões nacionais de qualidade em educação a distância.</p>
            <p className="mt-2">Nossa missão é democratizar o acesso à formação terapêutica de qualidade, preparando profissionais para atuar com ética, responsabilidade e competência técnica.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-800 mb-3">3. Natureza dos Cursos e Base Legal</h2>
            <p>Os cursos oferecidos pela WR-EDU são de caráter <strong>livre e profissionalizante</strong>. Nossos certificados têm validade em todo o território nacional para fins de comprovação de qualificação profissional, com fundamento nas seguintes legislações:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Lei nº 9.394/96</strong> — Lei de Diretrizes e Bases da Educação Nacional (LDB), que reconhece e regulamenta a educação profissional no Brasil.</li>
              <li><strong>Decreto nº 5.154/04</strong> — Regulamenta o § 2º do art. 36 e os arts. 39 a 41 da LDB, estabelecendo as diretrizes para a educação profissional e tecnológica.</li>
            </ul>
            <p className="mt-2 bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-500">Os cursos não substituem graduações universitárias regulamentadas por conselhos profissionais (CRP, CFM, etc.). Trata-se de formação complementar e profissionalizante livre, conforme enquadramento legal vigente.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-800 mb-3">4. Cadastro e Acesso à Plataforma</h2>
            <p>O acesso à plataforma é concedido mediante um <strong>código de acesso personalizado</strong> fornecido pela instituição. Ao receber seu código, você:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Assume total responsabilidade pelo uso e sigilo do código de acesso;</li>
              <li>Compromete-se a utilizar a plataforma exclusivamente para fins educacionais;</li>
              <li>Declara que as informações fornecidas (incluindo nome completo e CPF para certificação) são verídicas e completas;</li>
              <li>Concorda que o acesso é pessoal e intransferível.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-800 mb-3">5. Conteúdo da Plataforma</h2>
            <p>Todo o conteúdo disponibilizado na plataforma WR-EDU — incluindo textos, vídeos, materiais de apoio, aulas gravadas e questionários — é de propriedade exclusiva da WR-EDU ou de seus licenciadores, protegido pelas leis de direitos autorais (Lei nº 9.610/98).</p>
            <p className="mt-2">É <strong>expressamente proibido</strong>:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Reproduzir, distribuir, modificar, publicar ou compartilhar qualquer conteúdo sem autorização escrita prévia;</li>
              <li>Gravar ou fazer capturas de telas das aulas ao vivo sem autorização;</li>
              <li>Utilizar o conteúdo para fins comerciais sem licença expressa.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-800 mb-3">6. Certificação</h2>
            <p>A emissão de certificados está condicionada à conclusão satisfatória dos requisitos de cada curso, incluindo:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Participação mínima nas aulas e atividades definidas pela coordenação;</li>
              <li>Fornecimento de nome completo e CPF válidos para registro e emissão;</li>
              <li>Cumprimento das obrigações financeiras junto à instituição.</li>
            </ul>
            <p className="mt-2">Cada certificado emitido possui um <strong>código único de autenticidade</strong>, consultável publicamente em qualquer momento através da página de verificação da WR-EDU. Este registro é permanente e não será removido mesmo em caso de desligamento do aluno da plataforma.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-800 mb-3">7. Conduta do Usuário</h2>
            <p>Ao utilizar a plataforma, você concorda em:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Tratar com respeito todos os participantes — alunos, professores e coordenadores;</li>
              <li>Não publicar conteúdo ofensivo, discriminatório, ilegal ou difamatório no fórum e no chat;</li>
              <li>Não utilizar a plataforma para fins de propaganda, spam ou atividades comerciais não autorizadas;</li>
              <li>Respeitar a privacidade dos demais usuários, especialmente nas sessões de prática terapêutica.</li>
            </ul>
            <p className="mt-2">O descumprimento dessas regras pode resultar na suspensão ou cancelamento do acesso, sem direito a reembolso.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-800 mb-3">8. Responsabilidades e Limitações</h2>
            <p>A WR-EDU envidarão esforços razoáveis para manter a plataforma disponível e funcional, mas não garante:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Disponibilidade ininterrupta do serviço;</li>
              <li>Ausência de falhas técnicas temporárias;</li>
              <li>Adequação do conteúdo às expectativas individuais de cada aluno.</li>
            </ul>
            <p className="mt-2">O conteúdo educacional tem caráter formativo e não substitui atendimento psicológico, psiquiátrico ou médico individual. A WR-EDU não se responsabiliza por decisões tomadas com base no conteúdo dos cursos.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-800 mb-3">9. Privacidade e Proteção de Dados</h2>
            <p>O tratamento de dados pessoais dos usuários é realizado em conformidade com a <strong>Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/18)</strong>. Para detalhes completos, consulte nossa <Link to="/privacy" className="text-primary hover:underline">Política de Privacidade</Link>.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-800 mb-3">10. Modificações dos Termos</h2>
            <p>A WR-EDU reserva-se o direito de modificar estes Termos de Serviço a qualquer momento, publicando a versão atualizada na plataforma com indicação da data de revisão. O uso contínuo após a publicação das alterações constitui aceite dos novos termos.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-800 mb-3">11. Foro e Lei Aplicável</h2>
            <p>Estes Termos de Serviço são regidos pelas leis da República Federativa do Brasil. Eventuais disputas serão submetidas ao foro da comarca da sede da WR-EDU, com renúncia expressa a qualquer outro, por mais privilegiado que seja.</p>
          </section>

          <div className="border-t border-slate-100 pt-6 text-xs text-slate-400 text-center">
            <p>WR-EDU — Instituto de Desenvolvimento Humano · CNPJ: 62.213.790/0001-40</p>
            <p className="mt-1">Parceiros da ABED — Associação Brasileira de Educação a Distância</p>
          </div>
        </div>
      </div>
    </div>
  );
}