import React, { useEffect, useRef, useState } from 'react';
import { X, Printer, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// ─── Background & pixel geometry (exact, as specified) ───────────────────────
const APOSTILA_BG = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/ac615f227_Fundo_Apostila.png';

// Full image dimensions (px)
const IMG_W = 2250;
const IMG_H = 1591;

// Grey content square inside the image
const SQUARE_W    = 2168;
const SQUARE_H    = 1178;
const SQUARE_LEFT = 41;          // (2250 - 2168) / 2
const SQUARE_TOP  = 207;         // (1591 - 1178) / 2  →  206.5 → 207

// "APOSTILA DE ESTUDOS" heading is already baked into the BG image.
// It ends at approx Y=282 (measured: title top ≈235, height 47 → 235+47=282).
// We add a small safety gap of 8px.
const TITLE_BOTTOM_Y = 282 + 8;  // 290px from image top → content starts here

// Two equal columns, side-by-side, no gap, centred inside the square
// Inner horizontal margin = (2168 - 2 × 1053) / 2 = 31px per side
const INNER_MARGIN = 31;
const COL_W        = 1053;
const COL_GAP      = 0;          // columns touch; add gap by reducing col widths if desired
const COL_LEFT_X   = SQUARE_LEFT + INNER_MARGIN;          // 72 from img left
const COL_RIGHT_X  = COL_LEFT_X + COL_W;                  // 1125 from img left
const COL_TOP_Y    = TITLE_BOTTOM_Y;                       // 290 from img top
const COL_H        = SQUARE_TOP + SQUARE_H - COL_TOP_Y;   // 207+1178-290 = 1095px

// Typography — tuned for COL_W=1053 at 96dpi render
const FONT_SIZE   = 17;           // px
const LINE_HEIGHT = 1.9;          // ratio
const LINE_PX     = Math.round(FONT_SIZE * LINE_HEIGHT);  // ~32px
// Two columns combined lines per page
const CHARS_PER_LINE  = Math.floor(COL_W / (FONT_SIZE * 0.50));   // ≈123 chars
const LINES_PER_COL   = Math.floor(COL_H / LINE_PX);              // ≈34 lines
const CHARS_PER_PAGE  = CHARS_PER_LINE * LINES_PER_COL * 2;       // ×2 cols

// ─── Paginator ───────────────────────────────────────────────────────────────
function paginateContent(content) {
  if (!content || !content.trim()) {
    return ['Conteúdo desta aula será disponibilizado em breve.'];
  }

  const paragraphs = content.split(/\n+/).map(p => p.trim()).filter(Boolean);
  const pages = [];
  let current = '';

  for (const para of paragraphs) {
    const candidate = current ? current + '\n\n' + para : para;
    if (candidate.length <= CHARS_PER_PAGE) {
      current = candidate;
    } else {
      if (current) {
        pages.push(current);
        current = para.length <= CHARS_PER_PAGE ? para : '';
        // Hard-split oversized paragraph
        if (!current) {
          let rem = para;
          while (rem.length > 0) {
            pages.push(rem.slice(0, CHARS_PER_PAGE));
            rem = rem.slice(CHARS_PER_PAGE);
          }
        }
      } else {
        // First item already too big → hard split
        let rem = para;
        while (rem.length > 0) {
          pages.push(rem.slice(0, CHARS_PER_PAGE));
          rem = rem.slice(CHARS_PER_PAGE);
        }
      }
    }
  }
  if (current) pages.push(current);
  return pages.length ? pages : [content];
}

// ─── Single page renderer ────────────────────────────────────────────────────
function ApostilaPageView({ lesson, chapterTitle, content, pageNum, totalPages, pageRef }) {
  return (
    <div
      ref={pageRef}
      style={{
        position: 'relative',
        width: IMG_W,
        height: IMG_H,
        overflow: 'hidden',
        background: '#fff',
        boxSizing: 'border-box',
      }}
    >
      {/* Full-bleed background */}
      <img
        src={APOSTILA_BG}
        alt=""
        crossOrigin="anonymous"
        draggable={false}
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: IMG_W, height: IMG_H,
          objectFit: 'fill',          // exact pixel match, no scaling
          pointerEvents: 'none',
          zIndex: 0,
          display: 'block',
        }}
      />

      {/* Lesson title overlay — sits just above the content area inside the grey square */}
      <div style={{
        position: 'absolute',
        top: SQUARE_TOP + 4,           // just inside the grey square
        left: SQUARE_LEFT,
        width: SQUARE_W,
        zIndex: 2,
        textAlign: 'center',
        pointerEvents: 'none',
      }}>
        <div style={{
          fontFamily: "'Cinzel', 'Trajan Pro', Georgia, serif",
          fontSize: 20,
          fontWeight: 700,
          color: '#1a2d5a',
          letterSpacing: 3,
          textTransform: 'uppercase',
        }}>
          {lesson.title}
          {pageNum > 1 && (
            <span style={{ fontSize: 13, fontWeight: 400, color: '#7a6a3a', letterSpacing: 1, marginLeft: 14 }}>
              · p. {pageNum}
            </span>
          )}
        </div>
        <div style={{
          fontFamily: "Georgia, serif",
          fontSize: 13,
          color: '#7a6a3a',
          letterSpacing: 3,
          textTransform: 'uppercase',
          marginTop: 3,
        }}>
          {chapterTitle}
        </div>
        {/* gold divider under lesson title */}
        <div style={{ width: 90, height: 2, background: '#c9a84c', margin: '6px auto 0' }} />
      </div>

      {/* ── Two columns of content ── */}
      {/* Left column */}
      <div style={{
        position: 'absolute',
        top: COL_TOP_Y,
        left: COL_LEFT_X,
        width: COL_W,
        height: COL_H,
        overflow: 'hidden',
        zIndex: 2,
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: FONT_SIZE,
        lineHeight: LINE_HEIGHT,
        color: '#1a2d5a',
        textAlign: 'justify',
        letterSpacing: 0.2,
        hyphens: 'auto',
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
      }}>
        {content}
      </div>

      {/* Right column — CSS column-count trick: we render full text in left col
          using CSS multi-column so text flows automatically into right col.
          We achieve this by making the content container span both columns. */}

      {/* Page number badge */}
      <div style={{
        position: 'absolute',
        bottom: SQUARE_TOP - 10,    // inside footer area of bg image
        right: SQUARE_LEFT + 20,
        zIndex: 3,
        fontFamily: "Georgia, serif",
        fontSize: 12,
        color: '#7a6a3a',
        letterSpacing: 1,
      }}>
        {pageNum} / {totalPages}
      </div>
    </div>
  );
}

// ─── Two-column aware page renderer (true CSS columns) ───────────────────────
function ApostilaPageViewCols({ lesson, chapterTitle, content, pageNum, totalPages, pageRef }) {
  // The content box spans from left of col1 to right of col2
  const contentBoxLeft = COL_LEFT_X;
  const contentBoxWidth = COL_W * 2 + COL_GAP;  // 2106px
  const contentBoxTop = COL_TOP_Y;
  const contentBoxHeight = COL_H;

  return (
    <div
      ref={pageRef}
      style={{
        position: 'relative',
        width: IMG_W,
        height: IMG_H,
        overflow: 'hidden',
        background: '#fff',
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
          width: IMG_W, height: IMG_H,
          objectFit: 'fill',
          pointerEvents: 'none',
          zIndex: 0,
          display: 'block',
        }}
      />

      {/* Lesson title — inside grey square, above content */}
      <div style={{
        position: 'absolute',
        top: SQUARE_TOP + 6,
        left: SQUARE_LEFT,
        width: SQUARE_W,
        zIndex: 2,
        textAlign: 'center',
        pointerEvents: 'none',
      }}>
        <div style={{
          fontFamily: "'Cinzel', Georgia, serif",
          fontSize: 21,
          fontWeight: 700,
          color: '#1a2d5a',
          letterSpacing: 3,
          textTransform: 'uppercase',
        }}>
          {lesson.title}
          {pageNum > 1 && (
            <span style={{ fontSize: 13, fontWeight: 400, color: '#7a6a3a', marginLeft: 14 }}>
              · p. {pageNum}
            </span>
          )}
        </div>
        <div style={{
          fontFamily: "Georgia, serif",
          fontSize: 13,
          color: '#7a6a3a',
          letterSpacing: 3,
          textTransform: 'uppercase',
          marginTop: 2,
        }}>
          {chapterTitle}
        </div>
        <div style={{ width: 90, height: 2, background: '#c9a84c', margin: '5px auto 0' }} />
      </div>

      {/* ── Content box spanning both columns ── */}
      <div style={{
        position: 'absolute',
        top: contentBoxTop,
        left: contentBoxLeft,
        width: contentBoxWidth,
        height: contentBoxHeight,
        overflow: 'hidden',
        zIndex: 2,
        // CSS two-column layout
        columnCount: 2,
        columnGap: COL_GAP,
        columnFill: 'auto',
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: FONT_SIZE,
        lineHeight: LINE_HEIGHT,
        color: '#1a2d5a',
        textAlign: 'justify',
        letterSpacing: 0.2,
        hyphens: 'auto',
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
      }}>
        {content}
      </div>

      {/* Page indicator */}
      <div style={{
        position: 'absolute',
        bottom: 40,
        right: SQUARE_LEFT + 30,
        zIndex: 3,
        fontFamily: "Georgia, serif",
        fontSize: 12,
        color: '#7a6a3a',
        letterSpacing: 1,
      }}>
        {pageNum} / {totalPages}
      </div>
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────
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

  const waitImages = (node) => {
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
      scale: 1,                // 1:1 → already high-res at IMG_W=2250
      useCORS: true,
      allowTaint: false,
      width: IMG_W,
      height: IMG_H,
      backgroundColor: '#fff',
    });
  };

  const handlePrint = async () => {
    setLoading(true);
    try {
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();   // 297mm
      const pdfH = pdf.internal.pageSize.getHeight();  // 210mm

      const allRefs = pageRefs.current.map(r => r?.current).filter(Boolean);

      for (let i = 0; i < allRefs.length; i++) {
        const canvas = await captureNode(allRefs[i]);
        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        if (i > 0) pdf.addPage('a4', 'landscape');
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH);
      }

      const safeName = (lesson.title || 'aula')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '-').toLowerCase();
      pdf.save(`apostila-${safeName}.pdf`);
      toast.success(`PDF gerado com ${pages.length} página${pages.length > 1 ? 's' : ''}!`);
    } catch (e) {
      toast.error('Erro ao gerar PDF: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const total = pages.length;
  // Preview: scale down so it fits viewport (max width ~90vw)
  const PREVIEW_SCALE = Math.min(0.42, (window.innerWidth * 0.88) / IMG_W);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-3">
      {/* Controls */}
      <div
        className="flex items-center gap-3 mb-3 w-full"
        style={{ maxWidth: IMG_W * PREVIEW_SCALE + 40 }}
      >
        <button onClick={onClose} className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors shrink-0">
          <X size={15} /> Fechar
        </button>

        {total > 1 && (
          <div className="flex items-center gap-2 flex-1 justify-center">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 transition"
            >
              <ChevronLeft size={15} className="text-white" />
            </button>
            <span className="text-white/70 text-sm min-w-[90px] text-center">
              Pág. {currentPage + 1} / {total}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(total - 1, p + 1))}
              disabled={currentPage >= total - 1}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 transition"
            >
              <ChevronRight size={15} className="text-white" />
            </button>
          </div>
        )}

        {total <= 1 && <div className="flex-1" />}

        <button
          onClick={handlePrint}
          disabled={loading || pages.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors shrink-0"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Printer size={15} />}
          {loading ? 'Gerando...' : `PDF (${total} pág.)`}
        </button>
      </div>

      {/* Preview */}
      <div
        className="rounded-xl overflow-hidden border border-white/10 shadow-2xl"
        style={{ width: IMG_W * PREVIEW_SCALE, height: IMG_H * PREVIEW_SCALE }}
      >
        <div style={{
          width: IMG_W,
          height: IMG_H,
          transform: `scale(${PREVIEW_SCALE})`,
          transformOrigin: 'top left',
        }}>
          {pages.length > 0 && (
            <ApostilaPageViewCols
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

      {/* Hidden pages for PDF capture */}
      <div style={{ position: 'fixed', top: -99999, left: -99999, pointerEvents: 'none', zIndex: -1 }}>
        {pages.map((pageContent, i) =>
          i !== currentPage ? (
            <ApostilaPageViewCols
              key={i}
              lesson={lesson}
              chapterTitle={chapterTitle}
              content={pageContent}
              pageNum={i + 1}
              totalPages={total}
              pageRef={pageRefs.current[i]}
            />
          ) : null
        )}
      </div>
    </div>
  );
}