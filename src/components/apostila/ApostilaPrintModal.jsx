import React, { useEffect, useRef, useState } from 'react';
import { X, Printer, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { BRAND_CNPJ, BRAND_LEGAL_NAME } from '@/lib/brand';

const APOSTILA_BG = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/ddb83cc38_Fundo_Apostila.png';

// A4 landscape at 120dpi → pixel dimensions for rendering
// A4 landscape = 297mm × 210mm → at 120dpi: 1404 × 992
const PAGE_W = 1404;
const PAGE_H = 992;

// Usable content area (px) inside margins
const MARGIN_TOP    = 90;   // space for header
const MARGIN_BOTTOM = 64;   // space for footer
const MARGIN_LEFT   = 88;
const MARGIN_RIGHT  = 88;
const CONTENT_W = PAGE_W - MARGIN_LEFT - MARGIN_RIGHT;   // 1228px
const CONTENT_H = PAGE_H - MARGIN_TOP - MARGIN_BOTTOM;   // 838px

// Typography — rendered at PAGE_W scale
const FONT_SIZE   = 15;     // px, body text
const LINE_HEIGHT = 1.85;   // ratio
const LINE_PX     = Math.round(FONT_SIZE * LINE_HEIGHT);  // ~28px per line
const COL_GAP     = 44;
const COL_W       = Math.round((CONTENT_W - COL_GAP) / 2); // two-column layout

/**
 * Splits raw content string into pages.
 * Uses approximate character-count heuristic calibrated to COL_W / LINE_PX / CONTENT_H.
 */
function paginateContent(content) {
  if (!content || !content.trim()) return ['Conteúdo desta aula será disponibilizado em breve.'];

  // Approx chars per line given COL_W and font-size 15px (avg char ~8.5px at 15px Georgia)
  const CHARS_PER_LINE = Math.floor(COL_W / (FONT_SIZE * 0.52));
  const LINES_PER_COL  = Math.floor(CONTENT_H / LINE_PX);
  // Two columns per page
  const LINES_PER_PAGE = LINES_PER_COL * 2;
  const CHARS_PER_PAGE = CHARS_PER_LINE * LINES_PER_PAGE;

  // Split by paragraphs to avoid breaking mid-word
  const paragraphs = content.split(/\n+/).map(p => p.trim()).filter(Boolean);
  const pages = [];
  let current = '';

  for (const para of paragraphs) {
    const candidate = current ? current + '\n\n' + para : para;
    if (candidate.length <= CHARS_PER_PAGE) {
      current = candidate;
    } else {
      // If even this paragraph alone exceeds a page, split it by lines
      if (!current) {
        // Hard split long paragraph
        let remaining = para;
        while (remaining.length > 0) {
          pages.push(remaining.slice(0, CHARS_PER_PAGE));
          remaining = remaining.slice(CHARS_PER_PAGE);
        }
      } else {
        pages.push(current);
        current = para;
      }
    }
  }
  if (current) pages.push(current);
  return pages.length ? pages : [content];
}

function ApostilaPageView({ lesson, chapterTitle, content, pageNum, totalPages, pageRef }) {
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
        boxSizing: 'border-box',
      }}
    >
      {/* Background */}
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

      {/* ── HEADER ── */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: MARGIN_TOP,
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        paddingInline: MARGIN_LEFT,
        paddingBottom: 10,
      }}>
        {/* Chapter label */}
        <div style={{
          fontFamily: "'Cinzel', 'Trajan Pro', Georgia, serif",
          fontSize: 10,
          letterSpacing: 4,
          color: '#7a6a3a',
          textTransform: 'uppercase',
          textAlign: 'center',
          marginBottom: 3,
        }}>
          {chapterTitle}
        </div>

        {/* Lesson title */}
        <div style={{
          fontFamily: "'Cinzel', 'Trajan Pro', Georgia, serif",
          fontSize: pageNum === 1 ? 21 : 16,
          fontWeight: 700,
          color: '#1a2d5a',
          textAlign: 'center',
          letterSpacing: 2,
          textTransform: 'uppercase',
          marginBottom: 6,
        }}>
          {lesson.title}
          {pageNum > 1 && (
            <span style={{ fontSize: 11, fontWeight: 400, color: '#7a6a3a', letterSpacing: 1, marginLeft: 12 }}>
              (continuação)
            </span>
          )}
        </div>

        {/* Gold divider */}
        <div style={{ width: 80, height: 2, background: '#c9a84c', margin: '0 auto' }} />
      </div>

      {/* ── CONTENT — two columns ── */}
      <div style={{
        position: 'absolute',
        top: MARGIN_TOP,
        left: MARGIN_LEFT,
        right: MARGIN_RIGHT,
        bottom: MARGIN_BOTTOM,
        zIndex: 2,
        columnCount: 2,
        columnGap: COL_GAP,
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: FONT_SIZE,
        color: '#1a2d5a',
        lineHeight: LINE_HEIGHT,
        textAlign: 'justify',
        letterSpacing: 0.25,
        whiteSpace: 'pre-wrap',
        overflow: 'hidden',
        hyphens: 'auto',
        wordBreak: 'break-word',
      }}>
        {content}
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: MARGIN_BOTTOM,
        zIndex: 2,
        paddingInline: MARGIN_LEFT,
        paddingTop: 10,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderTop: '1px solid rgba(26,45,90,0.15)',
      }}>
        <div style={{
          fontFamily: "Georgia, serif",
          fontSize: 9,
          color: '#888',
          letterSpacing: 0.8,
        }}>
          {BRAND_LEGAL_NAME} · CNPJ {BRAND_CNPJ}
        </div>
        <div style={{
          fontFamily: "Georgia, serif",
          fontSize: 9,
          color: '#888',
          letterSpacing: 0.8,
        }}>
          Página {pageNum}/{totalPages}
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
  );
}

export default function ApostilaPrintModal({ lesson, chapterTitle, onClose }) {
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const pageRefs = useRef([]);

  useEffect(() => {
    const paginated = paginateContent(lesson.content);
    setPages(paginated);
    setCurrentPage(0);
    pageRefs.current = paginated.map(() => React.createRef());
  }, [lesson.content]);

  const waitImages = async (node) => {
    const imgs = Array.from(node.querySelectorAll('img'));
    return Promise.all(imgs.map(img =>
      img.complete && img.naturalWidth > 0
        ? Promise.resolve()
        : new Promise(res => { img.onload = res; img.onerror = res; })
    ));
  };

  const captureNode = async (node) => {
    await waitImages(node);
    return html2canvas(node, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      width: PAGE_W,
      height: PAGE_H,
      backgroundColor: '#fff',
    });
  };

  const handlePrint = async () => {
    setLoading(true);
    try {
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();   // 297
      const pdfH = pdf.internal.pageSize.getHeight();  // 210

      // Render all pages — they're mounted in the hidden grid
      const allRefs = pageRefs.current.map(r => r.current).filter(Boolean);

      for (let i = 0; i < allRefs.length; i++) {
        const canvas = await captureNode(allRefs[i]);
        const imgData = canvas.toDataURL('image/png');
        if (i > 0) pdf.addPage('a4', 'landscape');
        pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
      }

      const safeName = (lesson.title || 'aula')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9-_ ]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase();
      pdf.save(`apostila-${safeName}.pdf`);
      toast.success(`PDF gerado com ${pages.length} página${pages.length > 1 ? 's' : ''}!`);
    } catch (e) {
      toast.error('Erro ao gerar PDF: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const total = pages.length;
  const PREVIEW_SCALE = 0.58;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      {/* Controls */}
      <div className="flex items-center gap-3 mb-4 w-full" style={{ maxWidth: PAGE_W * PREVIEW_SCALE + 40 }}>
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors shrink-0"
        >
          <X size={16} /> Fechar
        </button>

        <div className="flex items-center gap-2 flex-1 justify-center">
          <button
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 transition"
          >
            <ChevronLeft size={16} className="text-white" />
          </button>
          <span className="text-white/70 text-sm min-w-[80px] text-center">
            Pág. {currentPage + 1} / {total || 1}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(total - 1, p + 1))}
            disabled={currentPage >= total - 1}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 transition"
          >
            <ChevronRight size={16} className="text-white" />
          </button>
        </div>

        <button
          onClick={handlePrint}
          disabled={loading || pages.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors shrink-0"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
          {loading ? 'Gerando PDF...' : `Imprimir / PDF (${total} pág.)`}
        </button>
      </div>

      {/* Preview — current page, scaled to fit screen */}
      <div
        className="rounded-xl overflow-hidden border border-white/10 shadow-2xl"
        style={{
          width: PAGE_W * PREVIEW_SCALE,
          height: PAGE_H * PREVIEW_SCALE,
        }}
      >
        <div style={{
          width: PAGE_W,
          height: PAGE_H,
          transform: `scale(${PREVIEW_SCALE})`,
          transformOrigin: 'top left',
        }}>
          {pages.length > 0 && (
            <ApostilaPageView
              lesson={lesson}
              chapterTitle={chapterTitle}
              content={pages[currentPage]}
              pageNum={currentPage + 1}
              totalPages={total}
              pageRef={pageRefs.current[currentPage]}
            />
          )}
        </div>
      </div>

      {/* Hidden render area — all pages mounted for pdf capture */}
      <div style={{ position: 'fixed', top: -99999, left: -99999, pointerEvents: 'none', zIndex: -1 }}>
        {pages.map((pageContent, i) => (
          i !== currentPage ? (
            <ApostilaPageView
              key={i}
              lesson={lesson}
              chapterTitle={chapterTitle}
              content={pageContent}
              pageNum={i + 1}
              totalPages={total}
              pageRef={pageRefs.current[i]}
            />
          ) : null
        ))}
      </div>
    </div>
  );
}