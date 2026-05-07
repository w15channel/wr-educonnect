import React, { useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Award, Plus, Search, Download, Eye, CheckCircle, XCircle, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const WR_LOGO = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/5265f3b64_1000407748_d589e7f2d77d09c6941cdd7fa30003c5-03_02_202612_32_07.png';
const ABED_LOGO_BLUE = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/235c6e412_LogotipoSOMOSASSOCIADOSABED-Azul.png';

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const year = new Date().getFullYear();
  let seg = '';
  for (let i = 0; i < 8; i++) seg += chars[Math.floor(Math.random() * chars.length)];
  return `WRED-${year}-${seg}`;
}

function CertificatePreview({ cert }) {
  const certRef = useRef(null);
  const emissionDate = cert.issue_date ? format(new Date(cert.issue_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const completionDate = cert.completion_date ? format(new Date(cert.completion_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : '—';

  const handleDownloadPDF = async () => {
    if (!certRef.current) return;
    const canvas = await html2canvas(certRef.current, { scale: 2, backgroundColor: '#fff', useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
    pdf.save(`certificado-${cert.student_full_name.replace(/\s+/g, '-')}.pdf`);
    toast.success('Certificado exportado em PDF!');
  };

  return (
    <div className="space-y-4">
      <Button onClick={handleDownloadPDF} className="gap-2 w-full">
        <Download size={15} /> Baixar PDF
      </Button>
      <div
        ref={certRef}
        style={{
          background: '#fff',
          fontFamily: 'Georgia, "Times New Roman", serif',
          padding: '40px 56px',
          border: '3px solid #1e3a5f',
          boxShadow: 'inset 0 0 0 8px #f0f4f8, inset 0 0 0 11px #1e3a5f',
          minHeight: 480,
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #1e3a5f', paddingBottom: 16, marginBottom: 24 }}>
          <img src={WR_LOGO} alt="WR" style={{ width: 60, height: 60, objectFit: 'contain' }} crossOrigin="anonymous" />
          <div style={{ textAlign: 'center', flex: 1 }}>
            <p style={{ fontSize: 9, letterSpacing: 5, color: '#1e3a5f', fontWeight: 'bold', textTransform: 'uppercase', margin: 0 }}>
              WR — Instituto de Desenvolvimento Humano
            </p>
            <p style={{ fontSize: 8, color: '#888', margin: '3px 0 0', letterSpacing: 2, textTransform: 'uppercase' }}>
              CNPJ: 62.213.790/0001-40 · Parceiros da ABED
            </p>
          </div>
          <img src={ABED_LOGO_BLUE} alt="ABED" style={{ width: 80, objectFit: 'contain', opacity: 0.85 }} crossOrigin="anonymous" />
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <p style={{ fontSize: 9, letterSpacing: 5, color: '#7a6a3a', textTransform: 'uppercase', margin: '0 0 6px' }}>
            Certificado de Conclusão de Curso
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 'bold', color: '#1e3a5f', margin: 0, letterSpacing: 2, textTransform: 'uppercase' }}>
            CERTIFICADO
          </h1>
        </div>

        {/* Body */}
        <div style={{ textAlign: 'center', fontSize: 12, color: '#333', lineHeight: 1.9 }}>
          <p>Certificamos que</p>
          <p style={{ fontSize: 22, fontWeight: 'bold', color: '#1e3a5f', margin: '8px 0', letterSpacing: 1 }}>{cert.student_full_name}</p>
          <p style={{ fontSize: 10, color: '#888', margin: '-6px 0 12px' }}>CPF: {cert.student_cpf}</p>
          <p>concluiu com êxito o curso de</p>
          <p style={{ fontSize: 16, fontWeight: 'bold', color: '#1e3a5f', margin: '6px 0' }}>{cert.course_name}</p>
          <p style={{ fontSize: 10, color: '#555' }}>
            Modalidade: <strong>{cert.modality || 'EAD'}</strong> · Carga Horária: <strong>{cert.workload}</strong> · Conclusão: <strong>{completionDate}</strong>
          </p>
          {cert.course_description && (
            <p style={{ fontSize: 10, color: '#777', marginTop: 8, fontStyle: 'italic', maxWidth: 500, margin: '8px auto 0' }}>{cert.course_description}</p>
          )}
        </div>

        {/* Legal basis */}
        <div style={{ textAlign: 'center', fontSize: 9, color: '#999', marginTop: 16, lineHeight: 1.6 }}>
          Certificado emitido em conformidade com a Lei nº 9.394/96 (LDB) e o Decreto nº 5.154/04 · Validade nacional
        </div>

        {/* Signature */}
        <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center', gap: 80 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontStyle: 'italic', color: '#1e3a5f', marginBottom: 4, letterSpacing: 1 }}>W.Ribeiro</div>
            <div style={{ width: 160, borderTop: '1px solid #1e3a5f', paddingTop: 6 }}>
              <p style={{ fontSize: 8, color: '#1e3a5f', margin: 0, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase' }}>Prof. William Ribeiro</p>
              <p style={{ fontSize: 7, color: '#888', margin: '2px 0 0' }}>Coordenador Geral — WR-EDU</p>
              <p style={{ fontSize: 7, color: '#888', margin: '1px 0 0' }}>Psicoterapeuta · Psicanalista · Reg. AHDE nº 5593</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #ccd6e0', marginTop: 20, paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 7, color: '#aaa', margin: 0, letterSpacing: 1 }}>
            Emitido em {emissionDate}
          </p>
          <p style={{ fontSize: 7, color: '#1e3a5f', margin: 0, fontWeight: 'bold', letterSpacing: 1, fontFamily: 'monospace' }}>
            Código: {cert.authenticity_code}
          </p>
        </div>
      </div>
    </div>
  );
}

const EMPTY_FORM = {
  student_full_name: '',
  student_cpf: '',
  student_email: '',
  student_code: '',
  course_name: 'Formação em Práticas Terapêuticas — WR-EDU',
  course_description: 'Curso profissionalizante em práticas terapêuticas, com ênfase em abordagens humanistas e integrativas.',
  workload: '120 horas',
  completion_date: '',
  modality: 'EAD',
};

export default function IssueCertificate() {
  const { user: session } = useOutletContext();
  const isAdmin = session?.role === 'admin';
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [previewCert, setPreviewCert] = useState(null);

  const { data: certs = [], isLoading } = useQuery({
    queryKey: ['certificates'],
    queryFn: () => base44.entities.Certificate.list('-created_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Certificate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      setShowForm(false);
      setForm(EMPTY_FORM);
      toast.success('Certificado emitido com sucesso!');
    },
  });

  const revokeMutation = useMutation({
    mutationFn: ({ id }) => base44.entities.Certificate.update(id, { status: 'revoked' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      toast.success('Certificado revogado.');
    },
  });

  const handleIssue = () => {
    if (!form.student_full_name || !form.student_cpf || !form.course_name || !form.workload || !form.completion_date) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }
    const code = generateCode();
    createMutation.mutate({
      ...form,
      authenticity_code: code,
      issue_date: new Date().toISOString().split('T')[0],
      coordinator_name: 'Prof. William Ribeiro',
      coordinator_credentials: 'Psicoterapeuta | Psicanalista | Logoterapeuta | Sexólogo Integrativo\nRegistro AHDE nº 5593 | Therapist University',
      institution_cnpj: '62.213.790/0001-40',
      abed_affiliated: true,
      legal_basis: 'Lei nº 9.394/96 (LDB) e Decreto nº 5.154/04',
    });
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado!');
  };

  const filtered = certs.filter(c =>
    !search ||
    (c.student_full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.authenticity_code || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.course_name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Acesso restrito à coordenação.
      </div>
    );
  }

  if (previewCert) {
    return (
      <div className="p-4 lg:p-7 max-w-4xl mx-auto">
        <button onClick={() => setPreviewCert(null)} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4">← Voltar</button>
        <CertificatePreview cert={previewCert} />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-7 max-w-5xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Award size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl lg:text-2xl font-bold text-foreground">Emissão de Certificados</h2>
            <p className="text-muted-foreground text-sm mt-0.5">{certs.length} certificado(s) emitido(s)</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2 h-9 text-sm">
          <Plus size={15} /> Emitir Certificado
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-foreground">Dados do Certificado</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Nome Completo do Aluno *</label>
              <Input placeholder="Nome completo" value={form.student_full_name} onChange={e => setForm({...form, student_full_name: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">CPF do Aluno *</label>
              <Input placeholder="000.000.000-00" value={form.student_cpf} onChange={e => setForm({...form, student_cpf: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">E-mail do Aluno</label>
              <Input placeholder="email@exemplo.com" value={form.student_email} onChange={e => setForm({...form, student_email: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Código de Acesso do Aluno</label>
              <Input placeholder="Código de acesso (opcional)" value={form.student_code} onChange={e => setForm({...form, student_code: e.target.value})} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Nome do Curso *</label>
              <Input placeholder="Nome completo do curso" value={form.course_name} onChange={e => setForm({...form, course_name: e.target.value})} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Descrição do Curso (para o certificado)</label>
              <Input placeholder="Breve descrição do conteúdo abordado" value={form.course_description} onChange={e => setForm({...form, course_description: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Carga Horária *</label>
              <Input placeholder="Ex: 120 horas" value={form.workload} onChange={e => setForm({...form, workload: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Data de Conclusão *</label>
              <Input type="date" value={form.completion_date} onChange={e => setForm({...form, completion_date: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Modalidade</label>
              <select
                value={form.modality}
                onChange={e => setForm({...form, modality: e.target.value})}
                className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="EAD">EAD</option>
                <option value="Semipresencial">Semipresencial</option>
                <option value="Presencial">Presencial</option>
              </select>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground mb-1">Dados preenchidos automaticamente:</p>
            <p>· Coordenador: Prof. William Ribeiro · CNPJ: 62.213.790/0001-40 · Afiliação: ABED</p>
            <p>· Base legal: Lei nº 9.394/96 e Decreto nº 5.154/04 · Código de autenticidade: gerado automaticamente</p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleIssue} disabled={createMutation.isPending} className="gap-2">
              <Award size={15} /> {createMutation.isPending ? 'Emitindo...' : 'Emitir Certificado'}
            </Button>
            <Button variant="outline" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative w-full sm:w-80">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar por nome, código..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
      </div>

      {/* Certificates list */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-card rounded-2xl border border-border h-16 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Award size={40} className="mx-auto mb-3 opacity-20" />
          <p className="font-semibold">Nenhum certificado emitido ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(cert => (
            <div key={cert.id} className={`bg-card border rounded-2xl p-4 flex items-center gap-4 flex-wrap ${cert.status === 'revoked' ? 'border-red-200 opacity-60' : 'border-border'}`}>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                {cert.status === 'revoked' ? <XCircle size={18} className="text-red-400" /> : <CheckCircle size={18} className="text-green-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-foreground truncate">{cert.student_full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{cert.course_name} · {cert.workload}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-[10px] text-primary bg-primary/8 px-2 py-0.5 rounded-lg tracking-wider">{cert.authenticity_code}</span>
                  <button onClick={() => copyCode(cert.authenticity_code)} className="text-muted-foreground hover:text-foreground">
                    <Copy size={11} />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => setPreviewCert(cert)}>
                  <Eye size={12} /> Visualizar
                </Button>
                {cert.status !== 'revoked' && (
                  <button onClick={() => revokeMutation.mutate({ id: cert.id })} className="text-muted-foreground hover:text-destructive p-1.5 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}