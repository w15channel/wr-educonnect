import React from 'react';
import { CERT_W, CERT_H } from '@/pages/AdminCertificateGenerator';

const NAVY = '#1a2d5a';
const GOLD = '#c9a227';
const WHITE = '#ffffff';

export default function CertificateBack({ cert, certRef }) {
  const totalClassHours = cert.classes?.reduce((s, c) => s + (Number(c.hours) || 0), 0) || 0;

  return (
    <div
      ref={certRef}
      style={{
        width: CERT_W,
        height: CERT_H,
        position: 'relative',
        background: '#f8f9fc',
        overflow: 'hidden',
        boxSizing: 'border-box',
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        flexShrink: 0,
      }}
    >
      {/* Top band */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 10, background: NAVY }} />
      <div style={{ position: 'absolute', top: 10, left: 0, right: 0, height: 3, background: GOLD }} />
      {/* Bottom band */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 10, background: NAVY }} />
      <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, height: 3, background: GOLD }} />
      {/* Left band */}
      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 10, background: NAVY }} />
      <div style={{ position: 'absolute', top: 0, left: 10, bottom: 0, width: 3, background: GOLD }} />
      {/* Right band */}
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 10, background: NAVY }} />
      <div style={{ position: 'absolute', top: 0, right: 10, bottom: 0, width: 3, background: GOLD }} />

      {/* Header */}
      <div style={{ position: 'absolute', top: 22, left: 28, right: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: GOLD, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 700 }}>Verso do Certificado</div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 18, color: NAVY, fontWeight: 900, letterSpacing: 2, marginTop: 2, textTransform: 'uppercase' }}>Registro Acadêmico</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: NAVY, letterSpacing: 0.5 }}>{cert.studentName || '—'}</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 11, color: '#666', marginTop: 2 }}>{cert.courseName || '—'}</div>
        </div>
      </div>

      {/* Gold divider */}
      <div style={{ position: 'absolute', top: 78, left: 28, right: 28, height: 2, background: GOLD }} />

      {/* Main content area */}
      <div style={{ position: 'absolute', top: 90, left: 28, right: 28, bottom: 28, display: 'flex', gap: 18 }}>

        {/* Left column: class table */}
        <div style={{ flex: '1 1 0', background: WHITE, border: `2px solid ${GOLD}`, borderRadius: 8, padding: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: GOLD, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Grade Curricular</div>

          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px', gap: 6, borderBottom: `1px solid ${GOLD}`, paddingBottom: 5, marginBottom: 4 }}>
            {['Aula / Módulo', 'Horas', 'Nota'].map(h => (
              <span key={h} style={{ fontFamily: "'Cinzel', serif", fontSize: 8.5, fontWeight: 900, color: NAVY, letterSpacing: 1, textTransform: 'uppercase' }}>{h}</span>
            ))}
          </div>

          {/* Rows */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {(cert.classes || []).map((cls, i) => (
              <div key={cls.id} style={{
                display: 'grid', gridTemplateColumns: '1fr 60px 60px', gap: 6,
                borderBottom: '1px solid #eee', padding: '5px 0',
                background: i % 2 === 0 ? '#fafafa' : WHITE,
              }}>
                <span style={{ fontSize: 9.5, fontWeight: 600, color: NAVY, fontFamily: 'Arial, sans-serif' }}>{cls.title}</span>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: NAVY, textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>{cls.hours}h</span>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: NAVY, textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>{cls.grade}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={{ display: 'flex', gap: 10, marginTop: 10, paddingTop: 8, borderTop: `2px solid ${GOLD}` }}>
            <div style={{ flex: 1, textAlign: 'center', background: NAVY, borderRadius: 6, padding: '6px 4px' }}>
              <div style={{ fontSize: 7.5, color: GOLD, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Arial, sans-serif' }}>Carga Total</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: WHITE, fontFamily: 'Arial, sans-serif' }}>{totalClassHours}h</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', background: NAVY, borderRadius: 6, padding: '6px 4px' }}>
              <div style={{ fontSize: 7.5, color: GOLD, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Arial, sans-serif' }}>Nota Total</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: WHITE, fontFamily: 'Arial, sans-serif' }}>{cert.averageGrade}</div>
            </div>
          </div>
        </div>

        {/* Right column: honor + sensitive data */}
        <div style={{ width: 290, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Honor / Qualificação de Destaque */}
          {cert.honorTitle ? (
            <div style={{ background: WHITE, border: `2px solid ${GOLD}`, borderRadius: 8, padding: 14 }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: GOLD, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>Qualificação de Destaque</div>
              <div style={{
                background: NAVY, borderRadius: 6, padding: '8px 12px', marginBottom: 8,
                fontFamily: "'Cinzel', serif", fontSize: 11, color: GOLD, fontWeight: 700, textAlign: 'center', letterSpacing: 1.5, textTransform: 'uppercase'
              }}>
                ★ {cert.honorTitle}
              </div>
              {cert.honorDescription && (
                <div style={{ fontSize: 10, color: '#333', lineHeight: 1.6, fontFamily: "'Cormorant Garamond', serif" }}>
                  {cert.honorDescription}
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: WHITE, border: `2px dashed ${GOLD}44`, borderRadius: 8, padding: 14, textAlign: 'center' }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: '#aaa', letterSpacing: 2, textTransform: 'uppercase' }}>Sem destaque atribuído</div>
            </div>
          )}

          {/* Sensitive data */}
          <div style={{ background: WHITE, border: `2px solid ${GOLD}`, borderRadius: 8, padding: 14, flex: 1 }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: GOLD, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Dados do Aluno</div>
            {[
              ['Nome', cert.studentName || '—'],
              ['CPF / RG', cert.studentDocument || '—'],
              ['E-mail', cert.studentEmail || '—'],
              ['Curso', cert.courseName || '—'],
              ['Emissão', cert.issueDate || '—'],
            ].map(([label, value]) => (
              <div key={label} style={{ marginBottom: 7 }}>
                <div style={{ fontSize: 8, color: NAVY, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Arial, sans-serif' }}>{label}</div>
                <div style={{ fontSize: 10, color: '#333', fontFamily: "'Cormorant Garamond', serif", marginTop: 1 }}>{value}</div>
              </div>
            ))}

            {/* Verification code */}
            <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px solid ${GOLD}55` }}>
              <div style={{ fontSize: 8, color: NAVY, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Arial, sans-serif', marginBottom: 4 }}>Código de Autenticidade</div>
              <div style={{
                background: NAVY, color: WHITE, fontFamily: 'monospace', fontSize: 11,
                fontWeight: 900, letterSpacing: 3, padding: '5px 8px', borderRadius: 4, textAlign: 'center'
              }}>
                {cert.verificationCode}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}