import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';

const WR_LOGO = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/5265f3b64_1000407748_d589e7f2d77d09c6941cdd7fa30003c5-03_02_202612_32_07.png';

export default function PrivacyPolicy() {
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
            <Lock size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">Política de Privacidade</h1>
            <p className="text-sm text-slate-500">WR-EDU — Instituto de Desenvolvimento Humano · Última atualização: maio de 2026</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm space-y-8 text-slate-600 text-sm leading-relaxed">

          <section>
            <h2 className="text-base font-bold text-slate-800 mb-3">1. Compromisso com a Privacidade</h2>
            <p>A <strong>WR-EDU — Instituto de Desenvolvimento Humano</strong> (CNPJ: 62.213.790/0001-40) está comprometida com a proteção da sua privacidade e o tratamento responsável de seus dados pessoais, em conformidade com a <strong>Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018)</strong>.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-800 mb-3">2. Dados Coletados</h2>
            <p>Coletamos os seguintes dados para a prestação dos nossos serviços educacionais:</p>
            <div className="mt-3 space-y-3">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="font-semibold text-slate-700 mb-1">Dados de Identificação</p>
                <p className="text-slate-500 text-xs">Nome completo, CPF, e-mail, número de WhatsApp, data de nascimento e foto de perfil (opcional).</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="font-semibold text-slate-700 mb-1">Dados de Acesso e Uso</p>
                <p className="text-slate-500 text-xs">Código de acesso à plataforma, histórico de aulas assistidas, atividades concluídas, notas e progresso acadêmico.</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="font-semibold text-slate-700 mb-1">Dados para Certificação</p>
                <p className="text-slate-500 text-xs">Nome completo e CPF fornecidos voluntariamente para emissão de certificados. Esses dados são mantidos permanentemente para fins de autenticação.</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="font-semibold text-slate-700 mb-1">Conteúdo Gerado pelo Usuário</p>
                <p className="text-slate-500 text-xs">Postagens no fórum, mensagens no chat, resumos de aulas, comentários e trabalhos submetidos.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-800 mb-3">3. Finalidade do Tratamento</h2>
            <p>Seus dados são utilizados exclusivamente para:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Gerenciar seu acesso e progresso na plataforma educacional;</li>
              <li>Emissão e autenticação de certificados de conclusão;</li>
              <li>Comunicação sobre atividades acadêmicas, avisos e atualizações do curso;</li>
              <li>Cálculo de pontuação, ranking e histórico acadêmico;</li>
              <li>Melhoria contínua da experiência educacional;</li>
              <li>Cumprimento de obrigações legais e regulatórias.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-800 mb-3">4. Base Legal para o Tratamento (LGPD)</h2>
            <p>O tratamento dos seus dados pessoais é realizado com base nas seguintes hipóteses legais previstas na LGPD:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Execução de contrato</strong> — para prestação dos serviços educacionais contratados;</li>
              <li><strong>Consentimento</strong> — para dados opcionais como foto de perfil;</li>
              <li><strong>Legítimo interesse</strong> — para comunicações sobre o curso e segurança da plataforma;</li>
              <li><strong>Cumprimento de obrigação legal</strong> — para manutenção de registros exigidos por lei.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-800 mb-3">5. Compartilhamento de Dados</h2>
            <p>A WR-EDU <strong>não comercializa seus dados pessoais</strong> a terceiros. Dados podem ser compartilhados apenas nas seguintes hipóteses:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Com a ABED para fins de verificação de associação institucional;</li>
              <li>Com fornecedores de tecnologia que operam a plataforma, sob acordos de confidencialidade;</li>
              <li>Por determinação judicial ou exigência de autoridade competente.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-800 mb-3">6. Retenção e Exclusão de Dados</h2>
            <p>Mantemos seus dados pelo tempo necessário para o cumprimento das finalidades descritas. Em caso de solicitação de exclusão de cadastro:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Dados de acesso e progresso poderão ser removidos após encerramento do vínculo;</li>
              <li><strong>Os dados de certificação (nome, CPF e código de autenticidade)</strong> serão mantidos permanentemente para garantir a integridade e verificabilidade dos certificados emitidos, mesmo após desligamento do aluno.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-800 mb-3">7. Seus Direitos como Titular (LGPD)</h2>
            <p>Nos termos da LGPD, você tem direito a:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Confirmar a existência e acessar seus dados pessoais;</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
              <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários;</li>
              <li>Obter informações sobre o compartilhamento de dados;</li>
              <li>Revogar o consentimento a qualquer momento;</li>
              <li>Peticionar à Autoridade Nacional de Proteção de Dados (ANPD).</li>
            </ul>
            <p className="mt-2">Para exercer seus direitos, entre em contato através dos canais disponíveis na plataforma.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-800 mb-3">8. Segurança dos Dados</h2>
            <p>Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados contra acesso não autorizado, perda, destruição ou divulgação indevida, incluindo criptografia em trânsito e controles de acesso baseados em função.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-800 mb-3">9. Cookies e Tecnologias de Rastreamento</h2>
            <p>A plataforma utiliza cookies técnicos essenciais para o funcionamento da autenticação e preferências do usuário. Não utilizamos cookies de rastreamento de terceiros para fins publicitários.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-800 mb-3">10. Contato e Encarregado de Dados (DPO)</h2>
            <p>Para questões relacionadas à privacidade e proteção de dados, entre em contato diretamente com a coordenação da WR-EDU através dos canais disponíveis na plataforma. Comprometemo-nos a responder sua solicitação em até 15 dias úteis.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-800 mb-3">11. Atualizações desta Política</h2>
            <p>Esta Política de Privacidade pode ser atualizada periodicamente. Notificaremos os usuários sobre alterações relevantes através da plataforma. Recomendamos que você revise este documento periodicamente.</p>
          </section>

          <div className="border-t border-slate-100 pt-6 text-xs text-slate-400 text-center">
            <p>WR-EDU — Instituto de Desenvolvimento Humano · CNPJ: 62.213.790/0001-40</p>
            <p className="mt-1">Em conformidade com a LGPD (Lei nº 13.709/2018)</p>
          </div>
        </div>
      </div>
    </div>
  );
}