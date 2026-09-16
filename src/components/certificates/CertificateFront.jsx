import React, { useRef, useState, useCallback, useEffect } from 'react';
import { CERT_W, CERT_H, makeVerifUrl } from '@/pages/AdminCertificateGenerator';
import { formatDuration } from '@/lib/durationUtils';
import { getDefaultCertificateTemplate } from '@/lib/generateReceiptImage';

const CERT_BG_HQ = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/c2484fbeb_certificado-concluso_OFICIAL.png';

// v2 key — forces reset when background changes
const POSITIONS_KEY = 'wr_cert_front_positions_v2';

function qrUrl(data) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=0&color=1a2d5a&bgcolor=FFFFFF&data=${encodeURIComponent(data)}`;
}

// Default positions calibrated for the official certificate background
// CERT_W=1052, CERT_H=744
// QR positioned inside the bracket square at bottom-right corner of the new bg
const DEFAULT_POSITIONS = {
  gratification: { x: 526, y: 195 },  // centered horizontally, below "CERTIFICADO" title
  name:          { x: 526, y: 285 },  // student name in cursive, centered
  body:          { x: 526, y: 430 },  // body text block, centered
  qr:            { x: 890, y: 618 },  // inside the bracket square at bottom-right
};

function loadPositions() {
  try {
    const raw = localStorage.getItem(POSITIONS_KEY);
    if (raw) return { ...DEFAULT_POSITIONS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_POSITIONS };
}

function savePositions(pos) {
  localStorage.setItem(POSITIONS_KEY, JSON.stringify(pos));
}

// A single draggable element layer
function DraggableElement({ id, x, y, onMove, editMode, children, anchor = 'center' }) {
  const elRef = useRef(null);
  const dragging = useRef(false);
  const startMouse = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x, y });

  useEffect(() => {
    if (!editMode || !dragging.current) return;

    const onMouseMove = (me) => {
      if (!dragging.current) return;
      const rect = elRef.current?.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const scaleX = CERT_W / rect.width;
      const scaleY = CERT_H / rect.height;
      const dx = (me.clientX - startMouse.current.x) * scaleX;
      const dy = (me.clientY - startMouse.current.y) * scaleY;
      onMove(id, startPos.current.x + dx, startPos.current.y + dy);
    };

    const onMouseUp = () => {
      dragging.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      dragging.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [editMode, id, onMove]);

  const onMouseDown = useCallback((e) => {
    if (!editMode) return;
    e.preventDefault();
    dragging.current = true;
    startMouse.current = { x: e.clientX, y: e.clientY };
    startPos.current = { x, y };
  }, [editMode, x, y]);

  const transform = anchor === 'center' ? 'translate(-50%, -50%)' : anchor === 'top-center' ? 'translateX(-50%)' : 'none';

  return (
    <div
      ref={elRef}
      onMouseDown={onMouseDown}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform,
        cursor: editMode ? 'grab' : 'default',
        userSelect: 'none',
        outline: editMode ? '2px dashed rgba(91,94,244,0.7)' : 'none',
        outlineOffset: 4,
        borderRadius: 4,
        zIndex: editMode ? 10 : 1,
      }}
    >
      {children}
    </div>
  );
}

export default function CertificateFront({ cert, certRef, editMode = false, positions, onPositionsChange, backgroundUrl }) {
  const verifUrl = makeVerifUrl(cert.verificationCode);

  // Load saved AI template background if no explicit backgroundUrl is provided
  const [resolvedBg, setResolvedBg] = useState(backgroundUrl || CERT_BG_HQ);
  useEffect(() => {
    if (backgroundUrl) { setResolvedBg(backgroundUrl); return; }
    let active = true;
    getDefaultCertificateTemplate()
      .then((tpl) => { if (active && tpl?.image_url) setResolvedBg(tpl.image_url); })
      .catch(() => {});
    return () => { active = false; };
  }, [backgroundUrl]);

  const handleMove = useCallback((id, nx, ny) => {
    const next = { ...positions, [id]: { x: nx, y: ny } };
    onPositionsChange?.(next);
  }, [positions, onPositionsChange]);

  return (
    <div
      ref={certRef}
      style={{
        width: CERT_W,
        height: CERT_H,
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        flexShrink: 0,
        background: '#f5f5f5',
      }}
    >
      {/* Background image — uses saved AI template if available, falls back to official PNG */}
      <img
        src={resolvedBg}
        alt=""
        crossOrigin="anonymous"
        draggable={false}
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: CERT_W,
          height: CERT_H,
          objectFit: 'cover',
          display: 'block',
          pointerEvents: 'none',
          imageRendering: 'high-quality',
        }}
      />

      {/* Gratification text */}
      <DraggableElement id="gratification" editMode={editMode} x={positions.gratification.x} y={positions.gratification.y} onMove={handleMove} anchor="top-center">
        <div style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 22,
          color: '#1a2d5a',
          letterSpacing: 1,
          fontStyle: 'italic',
          lineHeight: 1.4,
          textAlign: 'center',
          width: 700,
          whiteSpace: 'pre-wrap',
        }}>
          {cert.gratificationText || 'É com imensa satisfação que certificamos que'}
        </div>
      </DraggableElement>

      {/* Student name */}
      <DraggableElement id="name" editMode={editMode} x={positions.name.x} y={positions.name.y} onMove={handleMove} anchor="top-center">
        <div style={{
          fontFamily: "'Pinyon Script', 'Brush Script MT', cursive",
          fontSize: 82,
          color: '#1a2d5a',
          lineHeight: 1.1,
          letterSpacing: 1,
          textAlign: 'center',
          width: 750,
          whiteSpace: 'nowrap',
          overflow: 'visible',
        }}>
          {cert.studentName || 'Nome Completo do Aluno'}
        </div>
      </DraggableElement>

      {/* Body text block */}
      <DraggableElement id="body" editMode={editMode} x={positions.body.x} y={positions.body.y} onMove={handleMove} anchor="top-center">
        <div style={{ textAlign: 'center', width: 620 }}>
          <div style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 18,
            color: '#1a2d5a',
            lineHeight: 1.75,
            letterSpacing: 0.3,
            whiteSpace: 'pre-wrap',
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
            Carga horária: {formatDuration(cert.totalMinutes ?? (Number(cert.totalHours) || 0) * 60)} &nbsp;·&nbsp; Média final: {cert.averageGrade} &nbsp;·&nbsp; {cert.issueDate}
          </div>
        </div>
      </DraggableElement>

      {/* QR Code */}
      <DraggableElement id="qr" editMode={editMode} x={positions.qr.x} y={positions.qr.y} onMove={handleMove} anchor="center">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <img
            src={qrUrl(verifUrl)}
            alt="QR Code"
            crossOrigin="anonymous"
            style={{ width: 106, height: 106, display: 'block', background: '#fff', imageRendering: 'crisp-edges' }}
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
      </DraggableElement>
    </div>
  );
}