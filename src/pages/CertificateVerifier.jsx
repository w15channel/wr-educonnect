import React, { useEffect, useState } from 'react';
import { Award, CheckCircle2, Search, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { BRAND_CNPJ, BRAND_LEGAL_NAME, WR_CERTIFICATE_LOGO } from '@/lib/brand';

function readCertificateParams(search) {
  const params = new URLSearchParams(search);
  const codigo = params.get('codigo') || '';
  return {
    codigo,
    aluno: params.get('aluno') || '',
    curso: params.get('curso') || '',
    carga: params.get('carga') || '',
    media: params.get('media') || '',
    emissao: params.get('emissao') || '',
    honra: params.get('honra') || '',
  };
}

function normalizeVerificationCode(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[–—−]/g, '-')
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9-]/g, '');
}

async function searchCertificateRecords(code) {
  const response = await base44.functions.invoke('saveStudentRecord', { action: 'certificateSearch', code });
  const data = response?.data || response;
  if (data?.error) throw new Error(data.error);
  return data?.records || [];
}

function mapCertificateRecord(record) {
  if (!record) return null;
  return {
    codigo: record.verification_code || '',
    aluno: record.student_name || '',
    curso: record.course_name || '',
    carga: record.total_hours ? String(record.total_hours) : '',
    media: record.average_grade || '',
    emissao: record.issue_date || '',
    honra: record.honor_title || '',
  };
}

export default function CertificateVerifier() {
  const [certificateParams, setCertificateParams] = useState(() => readCertificateParams(window.location.search));
  const [certificateData, setCertificateData] = useState(certificateParams);
  const [typedCode, setTypedCode] = useState(certificateParams.codigo);
  const [isSearching, setIsSearching] = useState(false);
  const normalizedTypedCode = normalizeVerificationCode(typedCode);
  const normalizedCertificateCode = normalizeVerificationCode(certificateData.codigo);
  const hasCertificateData = Boolean(normalizedCertificateCode && certificateData.aluno && certificateData.curso);
  const isCodeConfirmed = hasCertificateData && normalizedTypedCode === normalizedCertificateCode;

  // Detecta mudanças na URL e atualiza o estado
  useEffect(() => {
    const params = readCertificateParams(window.location.search);
    setCertificateParams(params);
    setCertificateData(params);
    setTypedCode(params.codigo);
  }, [window.location.search]);

  const searchCertificateCode = async () => {
    const code = normalizedTypedCode;
    if (!code) {
      toast.error('Digite um código de autenticidade para pesquisar.');
      return;
    }

    setIsSearching(true);
    try {
      const records = await searchCertificateRecords(code);
      const publicData = mapCertificateRecord(records[0]);
      if (!publicData) {
        setCertificateData({ codigo: code, aluno: '', curso: '', carga: '', media: '', emissao: '', honra: '' });
        toast.error('Nenhum certificado foi encontrado para este código.');
        return;
      }
      setCertificateData(publicData);
      setTypedCode(publicData.codigo);
      const url = new URL(window.location.href);
      url.search = new URLSearchParams({ codigo: publicData.codigo }).toString();
      window.history.replaceState({}, '', url.toString());
      toast.success('Certificado encontrado no banco de dados.');
    } catch (error) {
      console.error('Erro ao pesquisar certificado:', error);
      toast.error('Não foi possível pesquisar o código agora.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-foreground px-4 py-10 text-primary-foreground">
      <main className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-3xl border border-border/10 bg-card/5 p-6 shadow-2xl backdrop-blur">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card shadow-lg">
                <img src={WR_CERTIFICATE_LOGO} alt="Logo WR" className="h-12 w-12 object-contain" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-primary">Autenticidade</p>
                <h1 className="mt-1 text-2xl font-black">Validação de certificado</h1>
                <p className="mt-1 text-sm text-primary-foreground/60">{BRAND_LEGAL_NAME} · CNPJ {BRAND_CNPJ}</p>
              </div>
            </div>
            <ShieldCheck className="h-14 w-14 text-primary" />
          </div>
        </header>

        <section className="rounded-3xl border border-border/10 bg-card p-6 text-foreground shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-primary">
              <Search size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black">Campo público de conferência</h2>
              <p className="mt-1 text-sm text-foreground">Digite ou cole o código exibido no certificado e clique em pesquisar código para buscar o registro salvo no banco de dados.</p>
            </div>
          </div>

          <label className="mt-5 block space-y-2">
            <span className="text-xs font-black uppercase tracking-wide text-foreground">Código de autenticidade</span>
            <input
              className="h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm font-black uppercase tracking-widest text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
              value={typedCode}
              onChange={(event) => setTypedCode(event.target.value.toUpperCase())}
              onKeyDown={(event) => {
                if (event.key === 'Enter') searchCertificateCode();
              }}
              placeholder="WR-26-XXXX"
            />
          </label>

          <button
            type="button"
            onClick={searchCertificateCode}
            disabled={isSearching}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-5 py-3 text-sm font-black uppercase tracking-wide text-primary-foreground transition hover:bg-foreground disabled:opacity-50"
          >
            <Search size={18} />
            {isSearching ? 'Pesquisando...' : 'Pesquisar código'}
          </button>

          {!hasCertificateData && (
            <div className="mt-5 rounded-2xl border border-primary bg-accent p-4 text-sm text-primary">
              Informe um código válido e clique em pesquisar para consultar os dados públicos do certificado emitido pela coordenação.
            </div>
          )}

          {hasCertificateData && !isCodeConfirmed && (
            <div className="mt-5 rounded-2xl border border-destructive bg-destructive p-4 text-sm text-destructive">
              O código digitado não corresponde ao código de autenticidade carregado nesta página.
            </div>
          )}

          {isCodeConfirmed && (
            <div className="mt-5 rounded-2xl border border-primary bg-accent p-5 text-primary">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={22} className="text-primary" />
                <h3 className="text-lg font-black">Certificado conferido</h3>
              </div>
              <p className="mt-2 text-sm leading-6 text-primary">Os dados públicos abaixo correspondem às informações de conclusão salvas no banco de dados de autenticidade do certificado.</p>
              <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-card p-4"><dt className="text-xs font-black uppercase tracking-wide text-foreground">Aluno</dt><dd className="mt-1 font-bold text-foreground">{certificateData.aluno}</dd></div>
                <div className="rounded-2xl bg-card p-4"><dt className="text-xs font-black uppercase tracking-wide text-foreground">Curso</dt><dd className="mt-1 font-bold text-foreground">{certificateData.curso}</dd></div>
                <div className="rounded-2xl bg-card p-4"><dt className="text-xs font-black uppercase tracking-wide text-foreground">Carga horária</dt><dd className="mt-1 font-bold text-foreground">{certificateData.carga}h</dd></div>
                <div className="rounded-2xl bg-card p-4"><dt className="text-xs font-black uppercase tracking-wide text-foreground">Média final</dt><dd className="mt-1 font-bold text-foreground">{certificateData.media}</dd></div>
                <div className="rounded-2xl bg-card p-4"><dt className="text-xs font-black uppercase tracking-wide text-foreground">Emissão</dt><dd className="mt-1 font-bold text-foreground">{certificateData.emissao}</dd></div>
                <div className="rounded-2xl bg-card p-4"><dt className="text-xs font-black uppercase tracking-wide text-foreground">Código</dt><dd className="mt-1 font-black tracking-widest text-foreground">{certificateData.codigo}</dd></div>
              </dl>
              {certificateData.honra && (
                <div className="mt-3 rounded-2xl bg-card p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-foreground">Destaque</p>
                  <p className="mt-1 font-bold text-foreground">{certificateData.honra}</p>
                </div>
              )}
            </div>
          )}
        </section>

        <footer className="flex items-center justify-center gap-2 text-sm text-primary-foreground/60">
          <Award size={16} /> WR Educacional · Validação pública de certificados
        </footer>
      </main>
    </div>
  );
}