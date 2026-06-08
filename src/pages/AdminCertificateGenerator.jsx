import React, { useEffect, useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Award, Download, FileImage, Plus, RefreshCw, Save, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { BRAND_CNPJ, BRAND_LEGAL_NAME, WR_CERTIFICATE_LOGO, WR_SIGNATURE_IMAGE, ABED_LOGO } from '@/lib/brand';
import { useCustomAuth } from '@/lib/CustomAuthContext';

const VERIFICATION_PATH = '/validar-certificado';
const CERTIFICATE_WIDTH_PX = 1123;
const CERTIFICATE_HEIGHT_PX = 794;

const COURSE_LABELS = {
  tcc: 'Formação Profissional em Terapia Comportamental',
  psicanalise: 'Formação Profissional em Psicanálise Freudiana',
  sexologia: 'Formação Profissional em Sexologia Integrativa',
};

// ─── 5 templates distintos ────────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: 'navy-gold',
    name: '🔵 Azul & Ouro',
    // frente
    bgFront: 'linear-gradient(135deg,#f8f9fc 0%,#eef1f8 100%)',
    marbleOverlay: true,
    topBand: '#1a2d5a',
    topBandAccent: '#c9a227',
    bottomBand: '#1a2d5a',
    titleColor: '#1a2d5a',
    subColor: '#1a2d5a',
    nameColor: '#1a2d5a',
    bodyColor: '#1a2d5a',
    borderOuter: '#1a2d5a',
    borderInner: '#c9a227',
    sealBg: '#1a2d5a',
    // verso
    bgBack: '#f8f9fc',
    accentBack: '#1a2d5a',
    goldBack: '#c9a227',
  },
  {
    id: 'black-gold',
    name: '⚫ Preto & Ouro',
    bgFront: 'linear-gradient(135deg,#fafafa 0%,#f0f0f0 100%)',
    marbleOverlay: false,
    topBand: '#111111',
    topBandAccent: '#d4a017',
    bottomBand: '#111111',
    titleColor: '#111111',
    subColor: '#111111',
    nameColor: '#111111',
    bodyColor: '#111111',
    borderOuter: '#111111',
    borderInner: '#d4a017',
    sealBg: '#111111',
    bgBack: '#fafafa',
    accentBack: '#111111',
    goldBack: '#d4a017',
  },
  {
    id: 'burgundy-gold',
    name: '🍷 Bordô & Ouro',
    bgFront: 'linear-gradient(135deg,#fdf8f8 0%,#f5eaea 100%)',
    marbleOverlay: false,
    topBand: '#6b1a2e',
    topBandAccent: '#c9a227',
    bottomBand: '#6b1a2e',
    titleColor: '#6b1a2e',
    subColor: '#6b1a2e',
    nameColor: '#6b1a2e',
    bodyColor: '#3a0d1a',
    borderOuter: '#6b1a2e',
    borderInner: '#c9a227',
    sealBg: '#6b1a2e',
    bgBack: '#fdf8f8',
    accentBack: '#6b1a2e',
    goldBack: '#c9a227',
  },
  {
    id: 'forest-gold',
    name: '🌿 Verde & Ouro',
    bgFront: 'linear-gradient(135deg,#f5faf6 0%,#e8f4ea 100%)',
    marbleOverlay: false,
    topBand: '#1a4d2e',
    topBandAccent: '#c9a227',
    bottomBand: '#1a4d2e',
    titleColor: '#1a4d2e',
    subColor: '#1a4d2e',
    nameColor: '#1a4d2e',
    bodyColor: '#0d2b18',
    borderOuter: '#1a4d2e',
    borderInner: '#c9a227',
    sealBg: '#1a4d2e',
    bgBack: '#f5faf6',
    accentBack: '#1a4d2e',
    goldBack: '#c9a227',
  },
  {
    id: 'purple-gold',
    name: '💜 Roxo & Ouro',
    bgFront: 'linear-gradient(135deg,#faf8ff 0%,#f0eaff 100%)',
    marbleOverlay: false,
    topBand: '#3b1a6b',
    topBandAccent: '#c9a227',
    bottomBand: '#3b1a6b',
    titleColor: '#3b1a6b',
    subColor: '#3b1a6b',
    nameColor: '#3b1a6b',
    bodyColor: '#1e0d3a',
    borderOuter: '#3b1a6b',
    borderInner: '#c9a227',
    sealBg: '#3b1a6b',
    bgBack: '#faf8ff',
    accentBack: '#3b1a6b',
    goldBack: '#c9a227',
  },
];

function getTemplate(id) {
  return TEMPLATES.find(t => t.id === id) || TEMPLATES[0];
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function todayPtBr() {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date());
}

function sanitizeFileName(v) {
  return v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
}

function getOrigin() {
  return typeof window !== 'undefined' ? window.location.origin : 'https://wr-edu.com';
}

function normalizeCode(v) {
  return String(v || '').trim().toUpperCase().replace(/[–—−]/g, '-').replace(/\s+/g, '').replace(/[^A-Z0-9-]/g, '');
}

function makeVerifCode() {
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `WR-${String(new Date().getFullYear()).slice(-2)}-${r}`;
}

function makeVerifUrl(code) {
  const params = new URLSearchParams({ codigo: normalizeCode(code) });
  return `${getOrigin()}${VERIFICATION_PATH}?${params}`;
}

function qrUrl(data) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=10&color=000000&bgcolor=FFFFFF&data=${encodeURIComponent(data)}`;
}

const INITIAL_CLASSES = [
  { id: uid(), selected: true, title: 'Fundamentos Teóricos', description: 'Introdução, ética profissional e diretrizes de estudo.', hours: 8, grade: 10 },
  { id: uid(), selected: true, title: 'Prática Supervisionada', description: 'Atividades práticas, estudos de caso e acompanhamento docente.', hours: 12, grade: 10 },
  { id: uid(), selected: true, title: 'Avaliação Final', description: 'Síntese dos módulos e avaliação de aproveitamento.', hours: 5, grade: 10 },
];

// ─── Componente: Frente do Certificado ───────────────────────────────────────
function FrontCertificate({ cert, totalHours, avgGrade, verifUrl, tpl, frontRef }) {
  const t = tpl;
  const gold = '#c9a227';
  const white = '#ffffff';

  return (
    <div
      ref={frontRef}
      style={{
        width: CERTIFICATE_WIDTH_PX,
        height: CERTIFICATE_HEIGHT_PX,
        position: 'relative',
        background: t.bgFront,
        overflow: 'hidden',
        fontFamily: 'Georgia, "Times New Roman", serif',
        boxSizing: 'border-box',
      }}
    >
      {/* Marble texture overlay */}
      {t.marbleOverlay && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'url("https://www.transparenttextures.com/patterns/white-wall.png")',
          opacity: 0.18, pointerEvents: 'none'
        }} />
      )}

      {/* Top diagonal band (navy/color) */}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 200 }} viewBox={`0 0 ${CERTIFICATE_WIDTH_PX} 200`} preserveAspectRatio="none">
        <polygon points={`0,0 ${CERTIFICATE_WIDTH_PX},0 ${CERTIFICATE_WIDTH_PX},80 0,160`} fill={t.topBand} />
        <polygon points={`0,158 ${CERTIFICATE_WIDTH_PX},78 ${CERTIFICATE_WIDTH_PX},90 0,174`} fill={t.topBandAccent} opacity="0.85" />
      </svg>

      {/* Bottom diagonal band */}
      <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 180 }} viewBox={`0 0 ${CERTIFICATE_WIDTH_PX} 180`} preserveAspectRatio="none">
        <polygon points={`0,80 ${CERTIFICATE_WIDTH_PX},20 ${CERTIFICATE_WIDTH_PX},180 0,180`} fill={t.bottomBand} />
        <polygon points={`0,68 ${CERTIFICATE_WIDTH_PX},8 ${CERTIFICATE_WIDTH_PX},22 0,82`} fill={t.topBandAccent} opacity="0.85" />
      </svg>

      {/* Corner ornaments (top-right and bottom-left) */}
      <svg style={{ position: 'absolute', top: 8, right: 8, width: 90, height: 90 }} viewBox="0 0 90 90">
        <line x1="10" y1="10" x2="80" y2="10" stroke={gold} strokeWidth="2" />
        <line x1="80" y1="10" x2="80" y2="80" stroke={gold} strokeWidth="2" />
        <line x1="10" y1="10" x2="10" y2="35" stroke={gold} strokeWidth="2" />
        <circle cx="80" cy="10" r="4" fill={gold} />
        <circle cx="10" cy="10" r="4" fill={gold} />
      </svg>
      <svg style={{ position: 'absolute', bottom: 8, left: 8, width: 90, height: 90 }} viewBox="0 0 90 90">
        <line x1="10" y1="80" x2="80" y2="80" stroke={gold} strokeWidth="2" />
        <line x1="10" y1="10" x2="10" y2="80" stroke={gold} strokeWidth="2" />
        <line x1="55" y1="80" x2="80" y2="80" stroke={gold} strokeWidth="2" />
        <circle cx="10" cy="80" r="4" fill={gold} />
        <circle cx="80" cy="80" r="4" fill={gold} />
      </svg>

      {/* ABED logo — top left over band */}
      <div style={{ position: 'absolute', top: 14, left: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
        <span style={{ fontSize: 8, color: white, letterSpacing: 2, marginBottom: 2, fontFamily: 'Arial, sans-serif', opacity: 0.9 }}>SOMOS ASSOCIADOS</span>
        <img src={ABED_LOGO} alt="ABED" crossOrigin="anonymous"
          style={{ height: 48, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
        <span style={{ fontSize: 7, color: white, letterSpacing: 1, marginTop: 2, fontFamily: 'Arial, sans-serif', textAlign: 'center', opacity: 0.85 }}>ASSOCIAÇÃO BRASILEIRA{'\n'}DE EDUCAÇÃO A DISTÂNCIA</span>
      </div>

      {/* WR Logo — top right over band */}
      <div style={{ position: 'absolute', top: 14, right: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
        <img src={WR_CERTIFICATE_LOGO} alt="WR" crossOrigin="anonymous"
          style={{ height: 60, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
      </div>

      {/* Main title */}
      <div style={{ position: 'absolute', top: 180, left: 0, right: 0, textAlign: 'center', zIndex: 5 }}>
        <div style={{
          fontSize: 74,
          fontWeight: 900,
          color: t.titleColor,
          letterSpacing: 6,
          lineHeight: 1,
          fontFamily: '"Times New Roman", Georgia, serif',
          textTransform: 'uppercase',
        }}>CERTIFICADO</div>
        <div style={{
          fontSize: 20,
          fontWeight: 600,
          color: t.subColor,
          letterSpacing: 8,
          marginTop: 4,
          fontFamily: 'Arial, sans-serif',
          textTransform: 'uppercase',
        }}>DE CONCLUSÃO</div>
        <div style={{
          fontSize: 13,
          color: t.subColor,
          letterSpacing: 4,
          marginTop: 6,
          fontFamily: 'Arial, sans-serif',
          textTransform: 'uppercase',
          opacity: 0.8,
        }}>{(cert.courseName || '').toUpperCase()}</div>
      </div>

      {/* "MEDIANTE ESSE DOCUMENTO CERTIFICAMOS QUE" */}
      <div style={{ position: 'absolute', top: 330, left: 0, right: 0, textAlign: 'center', zIndex: 5 }}>
        <div style={{ fontSize: 12, color: t.bodyColor, letterSpacing: 3, fontFamily: 'Arial, sans-serif', textTransform: 'uppercase', opacity: 0.75 }}>
          MEDIANTE ESSE DOCUMENTO CERTIFICAMOS QUE
        </div>
      </div>

      {/* Student name — cursive/script style */}
      <div style={{ position: 'absolute', top: 350, left: 80, right: 80, textAlign: 'center', zIndex: 5 }}>
        <div style={{
          fontSize: 52,
          color: t.nameColor,
          fontFamily: '"Brush Script MT", "Zapf Chancery", "Comic Sans MS", cursive',
          letterSpacing: 2,
          lineHeight: 1.2,
        }}>{cert.studentName || 'Nome Completo do Aluno'}</div>
      </div>

      {/* Body text */}
      <div style={{ position: 'absolute', top: 430, left: 100, right: 100, textAlign: 'center', zIndex: 5 }}>
        <div style={{ fontSize: 11.5, color: t.bodyColor, lineHeight: 1.75, fontFamily: 'Arial, sans-serif', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          CONCLUIU O CURSO {(cert.courseName || '').toUpperCase()}, REALIZADO PELA {BRAND_LEGAL_NAME.toUpperCase()},<br />
          COM CARGA HORÁRIA TOTAL DE {totalHours} HORAS, MÉDIA FINAL {avgGrade} E<br />
          APROVEITAMENTO CONSIDERADO SATISFATÓRIO.
        </div>
        {cert.description ? (
          <div style={{ fontSize: 10, color: t.bodyColor, lineHeight: 1.6, fontFamily: 'Arial, sans-serif', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 8, opacity: 0.8 }}>
            {cert.description.toUpperCase()}
          </div>
        ) : null}
      </div>

      {/* Footer row: ABED text | Signature | Seal */}
      <div style={{
        position: 'absolute', bottom: 52, left: 80, right: 80,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', zIndex: 10,
      }}>
        {/* Left: ABED small reprint */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <img src={ABED_LOGO} alt="ABED" crossOrigin="anonymous"
            style={{ height: 38, objectFit: 'contain' }} />
          <span style={{ fontSize: 7.5, color: white, fontFamily: 'Arial, sans-serif', letterSpacing: 1, textAlign: 'center', opacity: 0.9 }}>SOMOS ASSOCIADOS</span>
        </div>

        {/* Center: Signature */}
        <div style={{ textAlign: 'center' }}>
          <img src={WR_SIGNATURE_IMAGE} alt="Assinatura" crossOrigin="anonymous"
            style={{ height: 52, objectFit: 'contain', display: 'block', margin: '0 auto' }} />
          <div style={{ width: 200, height: 1, background: white, margin: '4px auto' }} />
          <div style={{ fontSize: 11, color: white, fontFamily: 'Arial, sans-serif', letterSpacing: 1, fontWeight: 700 }}>
            {cert.coordinatorName.toUpperCase()}
          </div>
          <div style={{ fontSize: 9.5, color: white, fontFamily: 'Arial, sans-serif', letterSpacing: 1, opacity: 0.85 }}>
            COORDENADOR GERAL
          </div>
        </div>

        {/* Right: Seal */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: `radial-gradient(circle, ${t.sealBg} 60%, ${gold} 100%)`,
          border: `3px solid ${gold}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 0 3px ${gold}44`,
        }}>
          <img src={WR_CERTIFICATE_LOGO} alt="WR" crossOrigin="anonymous"
            style={{ height: 36, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          <div style={{ fontSize: 7, color: gold, fontFamily: 'Arial, sans-serif', letterSpacing: 1, marginTop: 2, textAlign: 'center' }}>
            WR-EDU®
          </div>
        </div>
      </div>

      {/* Issue date bottom center */}
      <div style={{ position: 'absolute', bottom: 18, left: 0, right: 0, textAlign: 'center', zIndex: 10 }}>
        <span style={{ fontSize: 9, color: white, fontFamily: 'Arial, sans-serif', letterSpacing: 2, opacity: 0.7 }}>
          SOMOS ASSOCIADOS
        </span>
      </div>
    </div>
  );
}

// ─── Componente: Verso do Certificado ────────────────────────────────────────
function BackCertificate({ cert, classes, totalHours, avgGrade, verifUrl, tpl, backRef }) {
  const t = tpl;
  const gold = t.goldBack;

  return (
    <div
      ref={backRef}
      style={{
        width: CERTIFICATE_WIDTH_PX,
        height: CERTIFICATE_HEIGHT_PX,
        position: 'relative',
        background: t.bgBack,
        overflow: 'hidden',
        fontFamily: 'Arial, sans-serif',
        boxSizing: 'border-box',
      }}
    >
      {/* Top accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8, background: t.accentBack }} />
      <div style={{ position: 'absolute', top: 8, left: 0, right: 0, height: 3, background: gold }} />

      {/* Bottom accent bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 8, background: t.accentBack }} />
      <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, height: 3, background: gold }} />

      {/* Left border */}
      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 8, background: t.accentBack }} />
      <div style={{ position: 'absolute', top: 0, left: 8, bottom: 0, width: 3, background: gold }} />
      {/* Right border */}
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 8, background: t.accentBack }} />
      <div style={{ position: 'absolute', top: 0, right: 8, bottom: 0, width: 3, background: gold }} />

      {/* Header */}
      <div style={{ position: 'absolute', top: 24, left: 30, right: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 10, color: gold, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 700 }}>Verso do Certificado</div>
          <div style={{ fontSize: 18, color: t.accentBack, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2, marginTop: 2 }}>Registro Acadêmico</div>
        </div>
        <img src={WR_CERTIFICATE_LOGO} alt="WR" crossOrigin="anonymous"
          style={{ height: 48, objectFit: 'contain' }} />
      </div>

      {/* Divider */}
      <div style={{ position: 'absolute', top: 85, left: 30, right: 30, height: 2, background: gold }} />

      {/* Main content grid */}
      <div style={{ position: 'absolute', top: 98, left: 30, right: 30, bottom: 30, display: 'flex', gap: 20 }}>

        {/* Left: class table */}
        <div style={{ flex: '1 1 0', background: '#fff', border: `2px solid ${gold}`, borderRadius: 8, padding: 14, overflow: 'hidden' }}>
          <div style={{ fontSize: 11, color: gold, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Grade, Cargas e Notas</div>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 2fr 60px 60px', gap: 6, borderBottom: `1px solid ${gold}`, paddingBottom: 5, marginBottom: 4 }}>
            {['Aula', 'Descrição', 'Horas', 'Nota'].map(h => (
              <span key={h} style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', color: t.accentBack, letterSpacing: 1 }}>{h}</span>
            ))}
          </div>
          {/* Rows */}
          {classes.filter(c => c.selected).map((item, i) => (
            <div key={item.id} style={{
              display: 'grid', gridTemplateColumns: '1.4fr 2fr 60px 60px', gap: 6,
              borderBottom: '1px solid #eee', padding: '5px 0',
              background: i % 2 === 0 ? '#fafafa' : '#fff',
            }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: t.accentBack }}>{item.title}</span>
              <span style={{ fontSize: 8.5, color: '#444' }}>{item.description}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: t.accentBack, textAlign: 'center' }}>{item.hours}h</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: t.accentBack, textAlign: 'center' }}>{Number(item.grade || 0).toFixed(1)}</span>
            </div>
          ))}
          {/* Totals */}
          <div style={{ display: 'flex', gap: 10, marginTop: 10, padding: '8px 0', borderTop: `2px solid ${gold}` }}>
            <div style={{ flex: 1, textAlign: 'center', background: t.accentBack, borderRadius: 6, padding: '6px 4px' }}>
              <div style={{ fontSize: 8, color: gold, letterSpacing: 2, textTransform: 'uppercase' }}>Carga Total</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{totalHours}h</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', background: t.accentBack, borderRadius: 6, padding: '6px 4px' }}>
              <div style={{ fontSize: 8, color: gold, letterSpacing: 2, textTransform: 'uppercase' }}>Média Final</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{avgGrade}</div>
            </div>
          </div>
        </div>

        {/* Right: student data + QR */}
        <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#fff', border: `2px solid ${gold}`, borderRadius: 8, padding: 14, flex: '0 0 auto' }}>
            <div style={{ fontSize: 11, color: gold, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Dados do Aluno</div>
            {[
              ['Aluno', cert.studentName || '—'],
              ['CPF/RG', cert.studentDocument || '—'],
              ['E-mail', cert.studentEmail || '—'],
              ['Curso', cert.courseName],
              ['Emissão', cert.issueDate],
            ].map(([label, value]) => (
              <div key={label} style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 8.5, color: t.accentBack, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{label}: </span>
                <span style={{ fontSize: 8.5, color: '#333' }}>{value}</span>
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', border: `2px solid ${gold}`, borderRadius: 8, padding: 14, textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 11, color: gold, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Conferência Externa</div>
            <img src={qrUrl(verifUrl)} alt="QR Code" crossOrigin="anonymous"
              style={{ width: 110, height: 110, borderRadius: 6, marginBottom: 8, background: '#fff' }} />
            <div style={{ fontSize: 8, color: '#555', lineHeight: 1.5, marginBottom: 6 }}>
              Escaneie o QR Code ou informe o código abaixo no autenticador público para validar este certificado.
            </div>
            <div style={{
              background: t.accentBack, color: '#fff', fontSize: 10, fontWeight: 900,
              letterSpacing: 3, padding: '5px 10px', borderRadius: 4, marginBottom: 6
            }}>{cert.verificationCode}</div>
            <div style={{ fontSize: 7, color: '#888', wordBreak: 'break-all' }}>{verifUrl}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Formulário ───────────────────────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <label style={{ display: 'block' }}>
      <span className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">{label}</span>
      {children}
      {hint && <span className="block text-[10px] text-muted-foreground mt-0.5">{hint}</span>}
    </label>
  );
}

const INPUT = "flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const TEXTAREA = "flex w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none";

// ─── Página principal ─────────────────────────────────────────────────────────
export default function AdminCertificateGenerator() {
  const { session } = useCustomAuth();
  const frontRef = useRef(null);
  const backRef = useRef(null);

  const [cert, setCert] = useState({
    studentName: '',
    studentDocument: '',
    studentEmail: '',
    studentAccessCode: '',
    courseName: COURSE_LABELS[session?.course] || 'Curso de Formação Livre',
    description: 'Certificado emitido manualmente pelo administrador para antecipação ou regularização da conclusão, conforme cargas horárias, aulas e notas registradas no verso.',
    coordinatorName: 'William Ribeiro S.',
    honorTitle: '',
    honorDescription: '',
    verificationCode: makeVerifCode(),
    issueDate: todayPtBr(),
    templateId: TEMPLATES[0].id,
  });

  const [classes, setClasses] = useState(INITIAL_CLASSES);
  const [students, setStudents] = useState([]);
  const [studentKey, setStudentKey] = useState('');
  const [savedId, setSavedId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRescuing, setIsRescuing] = useState(false);
  const [activeTab, setActiveTab] = useState('front'); // 'front' | 'back'

  useEffect(() => {
    base44.entities.AccessCode.list('-created_date', 10000)
      .then(r => setStudents(r.filter(s => s.student_name || s.student_email || s.code)))
      .catch(() => {});
  }, []);

  const selectedClasses = useMemo(() => classes.filter(c => c.selected), [classes]);
  const totalHours = useMemo(() => selectedClasses.reduce((s, c) => s + (Number(c.hours) || 0), 0), [selectedClasses]);
  const avgGrade = useMemo(() => {
    if (!selectedClasses.length) return '0.0';
    return (selectedClasses.reduce((s, c) => s + (Number(c.grade) || 0), 0) / selectedClasses.length).toFixed(1);
  }, [selectedClasses]);
  const template = useMemo(() => getTemplate(cert.templateId), [cert.templateId]);
  const verifUrl = useMemo(() => makeVerifUrl(cert.verificationCode), [cert.verificationCode]);

  const upd = (field, value) => setCert(p => ({ ...p, [field]: value }));
  const updClass = (id, field, value) => setClasses(p => p.map(c => c.id === id ? { ...c, [field]: value } : c));
  const addClass = () => setClasses(p => [...p, { id: uid(), selected: true, title: 'Nova Aula', description: 'Descrição da aula ou módulo.', hours: 4, grade: 10 }]);
  const delClass = (id) => setClasses(p => p.filter(c => c.id !== id));

  const fillStudent = (s) => {
    if (!s) return;
    setCert(p => ({
      ...p,
      studentName: s.student_name || s.profile_name || p.studentName,
      studentEmail: s.student_email || p.studentEmail,
      studentAccessCode: s.code || p.studentAccessCode,
      courseName: COURSE_LABELS[s.course] || p.courseName,
    }));
  };

  const buildPayload = () => ({
    verification_code: normalizeCode(cert.verificationCode),
    student_name: cert.studentName.trim(),
    student_document: cert.studentDocument.trim(),
    student_email: cert.studentEmail.trim(),
    student_access_code: cert.studentAccessCode.trim(),
    course_name: cert.courseName.trim(),
    course_slug: students.find(s => String(s.id || s.code) === studentKey)?.course || session?.course || '',
    description: cert.description,
    coordinator_name: cert.coordinatorName.trim(),
    honor_title: cert.honorTitle.trim(),
    honor_description: cert.honorDescription,
    issue_date: cert.issueDate.trim(),
    template_id: cert.templateId,
    total_hours: totalHours,
    average_grade: avgGrade,
    classes: classes.map(c => ({ id: c.id, selected: c.selected, title: c.title, description: c.description, hours: Number(c.hours) || 0, grade: Number(c.grade) || 0 })),
    verification_url: verifUrl,
    is_available_to_student: true,
  });

  const saveCertificate = async () => {
    if (!cert.studentName.trim()) { toast.error('Informe o nome do aluno.'); return; }
    if (!selectedClasses.length) { toast.error('Selecione pelo menos uma aula.'); return; }
    setIsSaving(true);
    try {
      const payload = buildPayload();
      let record;
      if (savedId) {
        record = await base44.entities.CertificateRecord.update(savedId, payload);
      } else {
        const existing = await base44.entities.CertificateRecord.filter({ verification_code: payload.verification_code });
        if (existing?.[0]) {
          record = await base44.entities.CertificateRecord.update(existing[0].id, payload);
        } else {
          record = await base44.entities.CertificateRecord.create(payload);
        }
      }
      setSavedId(record?.id || savedId);
      toast.success('Certificado salvo com sucesso!');
    } catch (e) {
      toast.error('Erro ao salvar: ' + (e.message || 'tente novamente.'));
    } finally { setIsSaving(false); }
  };

  const rescueData = async () => {
    setIsRescuing(true);
    try {
      const code = normalizeCode(cert.verificationCode);
      const email = cert.studentEmail.trim();
      let records = [];
      if (code) records = await base44.entities.CertificateRecord.filter({ verification_code: code });
      if (!records.length && email) records = await base44.entities.CertificateRecord.filter({ student_email: email });
      if (records[0]) {
        const r = records[0];
        setSavedId(r.id);
        setCert({
          studentName: r.student_name || '',
          studentDocument: r.student_document || '',
          studentEmail: r.student_email || '',
          studentAccessCode: r.student_access_code || '',
          courseName: r.course_name || COURSE_LABELS[session?.course] || 'Curso Livre',
          description: r.description || '',
          coordinatorName: r.coordinator_name || 'William Ribeiro S.',
          honorTitle: r.honor_title || '',
          honorDescription: r.honor_description || '',
          verificationCode: r.verification_code || makeVerifCode(),
          issueDate: r.issue_date || todayPtBr(),
          templateId: r.template_id || TEMPLATES[0].id,
        });
        if (Array.isArray(r.classes) && r.classes.length) setClasses(r.classes.map(c => ({ id: c.id || uid(), selected: c.selected !== false, title: c.title || '', description: c.description || '', hours: Number(c.hours) || 0, grade: Number(c.grade) || 0 })));
        toast.success('Dados resgatados do banco!');
      } else {
        toast.info('Nenhum certificado encontrado. Preencha manualmente.');
      }
    } catch (e) {
      toast.error('Erro ao resgatar: ' + (e.message || 'tente novamente.'));
    } finally { setIsRescuing(false); }
  };

  const waitImages = (node) => {
    const imgs = Array.from(node.querySelectorAll('img'));
    return Promise.all(imgs.map(img => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise(res => { img.onload = res; img.onerror = res; });
    }));
  };

  const captureNode = async (node, bg = '#ffffff') => {
    await waitImages(node);
    const canvas = await html2canvas(node, {
      scale: 2, backgroundColor: bg, useCORS: true, allowTaint: false,
      width: CERTIFICATE_WIDTH_PX, height: CERTIFICATE_HEIGHT_PX,
      scrollX: -window.scrollX, scrollY: -window.scrollY,
      onclone: (_, el) => { el.style.width = `${CERTIFICATE_WIDTH_PX}px`; el.style.height = `${CERTIFICATE_HEIGHT_PX}px`; el.style.transform = 'none'; },
    });
    return canvas.toDataURL('image/png');
  };

  const generatePdf = async () => {
    if (!frontRef.current || !backRef.current) return;
    if (!selectedClasses.length) { toast.error('Selecione pelo menos uma aula.'); return; }
    setIsGenerating(true);
    try {
      const [fi, bi] = await Promise.all([captureNode(frontRef.current), captureNode(backRef.current)]);
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      pdf.addImage(fi, 'PNG', 0, 0, 297, 210);
      pdf.addPage('a4', 'landscape');
      pdf.addImage(bi, 'PNG', 0, 0, 297, 210);
      pdf.save(`certificado-${sanitizeFileName(cert.studentName || 'aluno')}.pdf`);
      toast.success('PDF gerado com sucesso!');
    } catch (e) { toast.error('Erro ao gerar PDF.'); }
    finally { setIsGenerating(false); }
  };

  const generatePng = async () => {
    if (!frontRef.current) return;
    setIsGenerating(true);
    try {
      const img = await captureNode(frontRef.current);
      const a = document.createElement('a');
      a.href = img;
      a.download = `certificado-${sanitizeFileName(cert.studentName || 'aluno')}.png`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      toast.success('PNG gerado!');
    } catch (e) { toast.error('Erro ao gerar PNG.'); }
    finally { setIsGenerating(false); }
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 text-white shadow">
            <Award size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground">Gerador de Certificados</h2>
            <p className="text-xs text-muted-foreground">Emita diplomas profissionais com frente e verso personalizados.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={rescueData} disabled={isRescuing} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground hover:bg-secondary disabled:opacity-50">
            <Search size={14} />{isRescuing ? 'Buscando...' : 'Resgatar dados'}
          </button>
          <button onClick={saveCertificate} disabled={isSaving} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
            <Save size={14} />{isSaving ? 'Salvando...' : 'Salvar'}
          </button>
          <button onClick={generatePng} disabled={isGenerating} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground hover:bg-secondary disabled:opacity-50">
            <FileImage size={14} />PNG Frente
          </button>
          <button onClick={generatePdf} disabled={isGenerating} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            <Download size={14} />{isGenerating ? 'Gerando...' : 'Baixar PDF completo'}
          </button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[400px_1fr]">
        {/* ── Sidebar form ── */}
        <div className="space-y-4">

          {/* Template selector */}
          <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-black text-foreground">Modelo do certificado</h3>
            <div className="grid grid-cols-5 gap-2">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => upd('templateId', t.id)}
                  className={`rounded-lg border-2 p-1.5 transition text-center ${cert.templateId === t.id ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-muted-foreground'}`}
                  title={t.name}
                >
                  {/* Mini preview swatch */}
                  <div className="h-10 w-full rounded overflow-hidden mb-1 relative" style={{ background: t.bgFront }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%', background: t.topBand, clipPath: 'polygon(0 0,100% 0,100% 60%,0 100%)' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%', background: t.bottomBand, clipPath: 'polygon(0 40%,100% 0,100% 100%,0 100%)' }} />
                    <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: '60%', height: 3, background: t.topBandAccent, borderRadius: 2 }} />
                  </div>
                  <span className="text-[9px] font-bold text-muted-foreground leading-tight block">{t.name.split(' ').slice(1).join(' ')}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Student picker */}
          <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-black text-foreground">Aluno</h3>
            <div className="space-y-3">
              <Field label="Selecionar do cadastro">
                <select className={INPUT} value={studentKey} onChange={e => { setStudentKey(e.target.value); fillStudent(students.find(s => String(s.id || s.code) === e.target.value)); setSavedId(null); }}>
                  <option value="">Escolha um aluno…</option>
                  {students.map(s => (
                    <option key={s.id || s.code} value={s.id || s.code}>
                      {s.student_name || s.profile_name || s.student_email || s.code}{s.course ? ` · ${s.course}` : ''}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Nome completo">
                <input className={INPUT} value={cert.studentName} onChange={e => upd('studentName', e.target.value)} placeholder="Nome completo" />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="CPF / RG" hint="Verso apenas">
                  <input className={INPUT} value={cert.studentDocument} onChange={e => upd('studentDocument', e.target.value)} placeholder="000.000.000-00" />
                </Field>
                <Field label="E-mail" hint="Verso apenas">
                  <input className={INPUT} value={cert.studentEmail} onChange={e => upd('studentEmail', e.target.value)} placeholder="aluno@email.com" />
                </Field>
              </div>
            </div>
          </section>

          {/* Certificate data */}
          <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-black text-foreground">Dados do certificado</h3>
            <div className="space-y-3">
              <Field label="Curso">
                <input className={INPUT} value={cert.courseName} onChange={e => upd('courseName', e.target.value)} />
              </Field>
              <Field label="Texto complementar">
                <textarea className={TEXTAREA} rows={3} value={cert.description} onChange={e => upd('description', e.target.value)} />
              </Field>
              <Field label="Coordenador">
                <input className={INPUT} value={cert.coordinatorName} onChange={e => upd('coordinatorName', e.target.value)} />
              </Field>
              <Field label="Data de emissão">
                <input className={INPUT} value={cert.issueDate} onChange={e => upd('issueDate', e.target.value)} />
              </Field>
            </div>
          </section>

          {/* Verification code */}
          <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-foreground">Código de autenticidade</h3>
              <button onClick={() => { upd('verificationCode', makeVerifCode()); setSavedId(null); }} className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-xs font-bold hover:bg-secondary">
                <RefreshCw size={12} />Novo
              </button>
            </div>
            <input className={INPUT + ' font-mono font-bold uppercase tracking-widest'} value={cert.verificationCode} onChange={e => upd('verificationCode', e.target.value.toUpperCase())} />
            <div className="mt-2 rounded-lg bg-secondary p-2 text-[10px] text-muted-foreground break-all">{verifUrl}</div>
          </section>

          {/* Classes */}
          <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-foreground">Aulas e cargas horárias</h3>
              <button onClick={addClass} className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-xs font-bold hover:bg-secondary">
                <Plus size={12} />Adicionar
              </button>
            </div>
            <div className="space-y-3">
              {classes.map((item, idx) => (
                <div key={item.id} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                      <input type="checkbox" checked={item.selected} onChange={e => updClass(item.id, 'selected', e.target.checked)} className="accent-primary" />
                      Aula {idx + 1}
                    </label>
                    <button onClick={() => delClass(item.id)} className="text-muted-foreground hover:text-red-500 rounded p-1 transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <input className={INPUT + ' mb-2'} value={item.title} onChange={e => updClass(item.id, 'title', e.target.value)} placeholder="Título da aula" />
                  <textarea className={TEXTAREA + ' mb-2'} rows={2} value={item.description} onChange={e => updClass(item.id, 'description', e.target.value)} placeholder="Descrição" />
                  <div className="grid grid-cols-2 gap-2">
                    <input className={INPUT} type="number" min="0" step="0.5" value={item.hours} onChange={e => updClass(item.id, 'hours', e.target.value)} placeholder="Horas" />
                    <input className={INPUT} type="number" min="0" max="10" step="0.1" value={item.grade} onChange={e => updClass(item.id, 'grade', e.target.value)} placeholder="Nota" />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 rounded-lg bg-secondary p-3 text-center">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Carga total</div>
                <div className="text-lg font-black text-foreground">{totalHours}h</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Média final</div>
                <div className="text-lg font-black text-foreground">{avgGrade}</div>
              </div>
            </div>
          </section>
        </div>

        {/* ── Preview ── */}
        <div className="min-w-0 space-y-3">
          {/* Tab toggle */}
          <div className="flex gap-2">
            {['front', 'back'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${activeTab === tab ? 'bg-primary text-primary-foreground' : 'border border-border bg-background text-foreground hover:bg-secondary'}`}>
                {tab === 'front' ? '🖼 Frente' : '↩ Verso'}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-xl border border-border bg-secondary/40 p-4">
            {/* Scale wrapper so it fits in the viewport */}
            <div style={{ width: CERTIFICATE_WIDTH_PX, transformOrigin: 'top left' }}>
              {activeTab === 'front' ? (
                <FrontCertificate cert={cert} totalHours={totalHours} avgGrade={avgGrade} verifUrl={verifUrl} tpl={template} frontRef={frontRef} />
              ) : (
                <BackCertificate cert={cert} classes={classes} totalHours={totalHours} avgGrade={avgGrade} verifUrl={verifUrl} tpl={template} backRef={backRef} />
              )}
            </div>
          </div>

          {/* Hidden render for export (both pages always rendered off-screen) */}
          <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', pointerEvents: 'none', zIndex: -1 }}>
            {activeTab === 'front' ? (
              <BackCertificate cert={cert} classes={classes} totalHours={totalHours} avgGrade={avgGrade} verifUrl={verifUrl} tpl={template} backRef={backRef} />
            ) : (
              <FrontCertificate cert={cert} totalHours={totalHours} avgGrade={avgGrade} verifUrl={verifUrl} tpl={template} frontRef={frontRef} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}