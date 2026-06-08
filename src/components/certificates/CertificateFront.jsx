import React from 'react';
import { CERT_BG, CERT_W, CERT_H, makeVerifUrl } from '@/pages/AdminCertificateGenerator';

function qrUrl(data) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=0&color=1a2d5a&bgcolor=FFFFFF&data=${encodeURIComponent(data)}`;
}

export default function CertificateFront({ cert, certRef }) {
  const verifUrl = makeVerifUrl(cert.verificationCode);

  return (
    <div
      ref={certRef}
      style={{
        width: CERT_W,
        height: CERT_H,
        position: 'relative',
        backgroundImage: `url('${CERT_BG}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        overflow: 'hidden',
        boxSizing: 'border-box',
        flexShrink: 0,
      }}
    >
      {/* Gratification text — above name */}
      <div style={{
        position: 'absolute',
        top: '28%',
        left: '14%',
        right: '14%',
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 22,
          color: '#1a2d5a',
          letterSpacing: 1,
          fontStyle: 'italic',
          lineHeight: 1.4,
        }}>
          {cert.gratificationText || 'É com imensa satisfação que certificamos que'}
        </div>
      </div>

      {/* Student name — cursive */}
      <div style={{
        position: 'absolute',
        top: '38%',
        left: '10%',
        right: '10%',
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: "'Pinyon Script', 'Brush Script MT', cursive",
          fontSize: 82,
          color: '#1a2d5a',
          lineHeight: 1.1,
          letterSpacing: 1,
        }}>
          {cert.studentName || 'Nome Completo do Aluno'}
        </div>
      </div>

      {/* Body text block */}
      <div style={{
        position: 'absolute',
        top: '60%',
        left: '14%',
        right: '32%', // leave space for QR on the right
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 18,
          color: '#1a2d5a',
          lineHeight: 1.75,
          letterSpacing: 0.3,
        }}>
          {cert.bodyText}
        </div>
        {cert.courseName && (
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 15,
            color: '#1a2d5a',
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: 'uppercase',
            marginTop: 10,
          }}>
            {cert.courseName}
          </div>
        )}
        <div style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 15,
          color: '#1a2d5a',
          marginTop: 8,
          opacity: 0.8,
          letterSpacing: 0.3,
        }}>
          Carga horária: {cert.totalHours}h &nbsp;·&nbsp; Média final: {cert.averageGrade} &nbsp;·&nbsp; {cert.issueDate}
        </div>
      </div>

      {/* QR Code — inside the black square frame bottom-right of the layout */}
      {/* The square frame in the image is at approx right:3.5% bottom:3.5%, size ~120x120px */}
      <div style={{
        position: 'absolute',
        bottom: '5%',
        right: '4%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
      }}>
        <img
          src={qrUrl(verifUrl)}
          alt="QR Code"
          crossOrigin="anonymous"
          style={{ width: 106, height: 106, display: 'block', background: '#fff' }}
        />
        <div style={{
          fontFamily: 'monospace',
          fontSize: 8.5,
          color: '#1a2d5a',
          letterSpacing: 1.5,
          fontWeight: 700,
          textAlign: 'center',
        }}>
          {cert.verificationCode}
        </div>
      </div>
    </div>
  );
}