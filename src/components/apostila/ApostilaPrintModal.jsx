import React, { useRef, useState } from 'react';
import { X, Printer, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { BRAND_CNPJ, BRAND_LEGAL_NAME } from '@/lib/brand';

const APOSTILA_BG = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/ddb83cc38_Fundo_Apostila.png';

// A4 landscape dimensions in px at 96dpi → we render at 1400x990 for quality
const PAGE_W = 1400;
const PAGE_H = 990;

function ApostilaPage({ lesson, chapterTitle, pageRef }) {
  return (
    <div
      ref={pageRef}
      style={{
        width: PAGE_W,
        height: PAGE_H,
        position: 'relative',
        overflow: 'hidden',
        background: '#fff',
        fontFamily: "Georgia, 'Times New Roman', serif",
      }}
    >
      {/* Background image */}
      <img
        src={APOSTILA_BG}
        alt=""
        crossOrigin="anonymous"
        draggable={false}
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: PAGE_W, height: PAGE_H,
          objectFit: 'cover',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Content overlay */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '72px 96px 80px 96px',
      }}>
        {/* Chapter subtitle */}
        <div style={{
          fontFamily: "'Cinzel', 'Trajan Pro', Georgia, serif",
          fontSize: 11,
          letterSpacing: 4,
          color: '#7a6a3a',
          textTransform: 'uppercase',
          textAlign: 'center',
          marginBottom: 6,
        }}>
          {chapterTitle}
        </div>

        {/* Lesson title */}
        <div style={{
          fontFamily: "'Cinzel', 'Trajan Pro', Georgia, serif",
          fontSize: 22,
          fontWeight: 700,
          color: '#1a2d5a',
          textAlign: 'center',
          letterSpacing: 2,
          textTransform: 'uppercase',
          marginBottom: 6,
        }}>
          {lesson.title}
        </div>

        {/* Gold divider */}
        <div style={{ width: 80, height: 2, background: '#c9a84c', margin: '0 auto 20px' }} />

        {/* Lesson content */}
        <div style={{
          flex: 1,
          overflow: 'hidden',
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 14,
          color: '#1a2d5a',
          lineHeight: 1.85,
          textAlign: 'justify',
          letterSpacing: 0.2,
          columnCount: 2,
          columnGap: 40,
          whiteSpace: 'pre-wrap',
        }}>
          {lesson.content || 'Conteúdo desta aula será disponibilizado em breve.'}
        </div>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid rgba(26,45,90,0.2)',
          paddingTop: 10,
          marginTop: 14,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{
            fontFamily: "Georgia, serif",
            fontSize: 9,
            color: '#999',
            letterSpacing: 1,
          }}>
            {BRAND_LEGAL_NAME} · CNPJ {BRAND_CNPJ}
          </div>
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 9,
            color: '#c9a84c',
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}>
            WR-EDU® · Prof. William Ribeiro
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ApostilaPrintModal({ lesson, chapterTitle, onClose }) {
  const pageRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const handlePrint = async () => {
    if (!pageRef.current) return;
    setLoading(true);
    try {
      // Wait for background image
      const imgs = Array.from(pageRef.current.querySelectorAll('img'));
      await Promise.all(imgs.map(img =>
        img.complete && img.naturalWidth > 0
          ? Promise.resolve()
          : new Promise(res => { img.onload = res; img.onerror = res; })
      ));

      const canvas = await html2canvas(pageRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        width: PAGE_W,
        height: PAGE_H,
        backgroundColor: '#fff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);

      const safeName = (lesson.title || 'aula')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9-_ ]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase();
      pdf.save(`apostila-${safeName}.pdf`);
      toast.success('PDF gerado! Escolha onde salvar.');
    } catch (e) {
      toast.error('Erro ao gerar PDF: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      {/* Controls */}
      <div className="flex items-center gap-3 mb-4 w-full max-w-5xl">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
        >
          <X size={16} /> Fechar
        </button>
        <span className="flex-1 text-white/50 text-sm text-center truncate">{lesson.title}</span>
        <button
          onClick={handlePrint}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
          {loading ? 'Gerando PDF...' : 'Imprimir / Salvar PDF'}
        </button>
      </div>

      {/* Preview — scaled down visually but rendered at full resolution */}
      <div
        className="overflow-auto rounded-xl border border-white/10 shadow-2xl"
        style={{ maxWidth: '100%', maxHeight: '75vh' }}
      >
        <div style={{ transform: 'scale(0.65)', transformOrigin: 'top left', width: PAGE_W, height: PAGE_H }}>
          <ApostilaPage lesson={lesson} chapterTitle={chapterTitle} pageRef={pageRef} />
        </div>
      </div>
    </div>
  );
}