import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, Printer, Loader2, ChevronLeft, ChevronRight, Image, Move, RotateCcw, Save } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

// ─── Background ───────────────────────────────────────────────────────────────
const APOSTILA_BG = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/b553e29d9_Fundo_Apostila.png';

const IMG_W = 2250;
const IMG_H = 1591;

const SQUARE_W    = 2168;
const SQUARE_H    = 1178;
const SQUARE_LEFT = 41;
const SQUARE_TOP  = 207;

const HEADER_ZONE_H = 72;
const LINE_SHIFT    = Math.round(18 * 1.85); // ~33px — one line up
const CONTENT_TOP   = SQUARE_TOP + HEADER_ZONE_H - LINE_SHIFT;
const CONTENT_H     = SQUARE_H - HEADER_ZONE_H + LINE_SHIFT;

const INNER_MARGIN = 31;
const USABLE_W     = SQUARE_W - INNER_MARGIN * 2;
const CENTER_GAP   = Math.round(USABLE_W * 0.10);
const COL_W        = Math.round((USABLE_W - CENTER_GAP) / 2);
const COL_LEFT_X   = SQUARE_LEFT + INNER_MARGIN;
const COL_RIGHT_X  = COL_LEFT_X + COL_W + CENTER_GAP;

const FONT_SIZE   = 18;
const LINE_HEIGHT = 1.85;
const TOPIC_TARGET_CHARS = 2500;

const POSITIONS_KEY = 'wr_apostila_print_layout_positions_v2';
const LEGACY_TEXT_POSITION_KEY = 'wr_apostila_print_text_position_v1';
const DEFAULT_LAYER_POSITION = { x: 0, y: 0 };
const DEFAULT_POSITIONS = {
  title: { ...DEFAULT_LAYER_POSITION },
  text: { ...DEFAULT_LAYER_POSITION },
};

function normalizePosition(value) {
  return {
    x: Number.isFinite(value?.x) ? value.x : 0,
    y: Number.isFinite(value?.y) ? value.y : 0,
  };
}

function loadPrintPositions() {
  try {
    const raw = localStorage.getItem(POSITIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        title: normalizePosition(parsed.title),
        text: normalizePosition(parsed.text),
      };
    }

    const legacyTextPosition = localStorage.getItem(LEGACY_TEXT_POSITION_KEY);
    if (legacyTextPosition) {
      return {
        ...DEFAULT_POSITIONS,
        text: normalizePosition(JSON.parse(legacyTextPosition)),
      };
    }
  } catch {}
  return {
    title: { ...DEFAULT_LAYER_POSITION },
    text: { ...DEFAULT_LAYER_POSITION },
  };
}

function savePrintPositions(positions) {
  localStorage.setItem(POSITIONS_KEY, JSON.stringify({
    title: normalizePosition(positions.title),
    text: normalizePosition(positions.text),
  }));
}

function DraggableTextLayer({ position, editMode, onMove, zIndex = 2, children }) {
  const layerRef = useRef(null);
  const dragging = useRef(false);
  const startMouse = useRef({ x: 0, y: 0 });
  const startPosition = useRef(position);

  const onMouseDown = useCallback((e) => {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();
    dragging.current = true;
    startMouse.current = { x: e.clientX, y: e.clientY };
    startPosition.current = position;

    const onMouseMove = (me) => {
      if (!dragging.current) return;
      const rect = layerRef.current?.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const scaleX = IMG_W / rect.width;
      const scaleY = IMG_H / rect.height;
      onMove({
        x: Math.round(startPosition.current.x + (me.clientX - startMouse.current.x) * scaleX),
        y: Math.round(startPosition.current.y + (me.clientY - startMouse.current.y) * scaleY),
      });
    };
    const onMouseUp = () => {
      dragging.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [editMode, onMove, position]);

  return (
    <div
      ref={layerRef}
      onMouseDown={onMouseDown}
      style={{
        position: 'absolute',
        inset: 0,
        transform: `translate(${position.x}px, ${position.y}px)`,
        zIndex,
        cursor: editMode ? 'grab' : 'default',
        outline: editMode ? '3px dashed rgba(16, 185, 129, 0.85)' : 'none',
        outlineOffset: -CONTENT_TOP,
        userSelect: editMode ? 'none' : 'auto',
      }}
    >
      {children}
    </div>
  );
}

// ─── Split content into 6 topics ─────────────────────────────────────────────
const isHtmlContent = (value = '') => /<[^>]+>/.test(value);

const plainTextToHtml = (value = '') => value
  .split(/\n{2,}/)
  .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
  .join('');

const getVisibleText = (value = '') => value
  .replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/\s+/g, ' ')
  .trim();

const visibleCharCount = (value = '') => getVisibleText(value).length;

function normalizeTopicContent(topic) {
  return topic?.trim() || '';
}

function splitIntoTopics(content, targetChars = TOPIC_TARGET_CHARS) {
  if (!content || !content.trim()) {
    return Array.from({ length: 6 }, () => '');
  }

  const htmlContent = isHtmlContent(content) ? content : plainTextToHtml(content);
  const paragraphs = htmlContent
    .split(/(?=<\/?(?:p|h[1-6]|ul|ol|blockquote)\b)/i)
    .map(p => p.trim())
    .filter(Boolean);
  const totalChars = visibleCharCount(htmlContent);
  const chunkSize  = Math.max(targetChars, Math.ceil(totalChars / 6));

  const topics = [];
  let current  = '';

  for (const para of paragraphs) {
    const candidate = current ? current + para : para;
    if (current.length >= chunkSize && topics.length < 5) {
      topics.push(current.trim());
      current = para;
    } else {
      current = candidate;
    }
  }
  if (current.trim()) topics.push(current.trim());

  while (topics.length < 6) topics.push('');
  if (topics.length > 6) {
    const extra = topics.splice(6);
    topics[5] = topics[5] + extra.join('');
  }

  return topics.map((topic) => normalizeTopicContent(topic));
}

// ─── Page component ───────────────────────────────────────────────────────────
// No transform/scale ever applied here — only raw pixel sizes
const ApostilaPage = React.forwardRef(function ApostilaPage(
  { lesson, chapterTitle, topicLeft, topicRight, pageNum, totalPages, positions = DEFAULT_POSITIONS, editMode = false, onPositionChange },
  ref
) {
  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        width: IMG_W,
        height: IMG_H,
        overflow: 'hidden',
        background: '#fff',
        boxSizing: 'border-box',
        flexShrink: 0,
        // CRITICAL: no transform, no scale — full pixel size always
      }}
    >
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

      {/* Header */}
      <DraggableTextLayer
        position={positions.title}
        editMode={editMode}
        onMove={(nextPosition) => onPositionChange?.('title', nextPosition)}
        zIndex={4}
      >
      <div style={{
        position: 'absolute',
        top: SQUARE_TOP + 4,
        left: SQUARE_LEFT,
        width: SQUARE_W,
        height: HEADER_ZONE_H - 4,
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 6,
        pointerEvents: 'none',
      }}>
        <div style={{
          fontFamily: "'Cinzel', Georgia, serif",
          fontSize: 19,
          fontWeight: 700,
          color: '#1a2d5a',
          letterSpacing: 3,
          textTransform: 'uppercase',
          lineHeight: 1.2,
        }}>
          {lesson.title}
          {pageNum > 1 && (
            <span style={{ fontSize: 12, fontWeight: 400, color: '#7a6a3a', marginLeft: 12 }}>
              · Parte {pageNum}
            </span>
          )}
        </div>
        <div style={{
          fontFamily: 'Georgia, serif',
          fontSize: 11,
          color: '#7a6a3a',
          letterSpacing: 3,
          textTransform: 'uppercase',
          marginTop: 2,
        }}>
          {chapterTitle}
        </div>
        <div style={{ width: 80, height: 2, background: '#c9a84c', marginTop: 5 }} />
      </div>
      </DraggableTextLayer>

      <DraggableTextLayer
        position={positions.text}
        editMode={editMode}
        onMove={(nextPosition) => onPositionChange?.('text', nextPosition)}
        zIndex={2}
      >
        {/* Left column */}
        <div style={{
          position: 'absolute',
          top: CONTENT_TOP,
          left: COL_LEFT_X,
          width: COL_W,
          height: CONTENT_H,
          overflow: 'hidden',
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: FONT_SIZE,
          lineHeight: LINE_HEIGHT,
          color: '#1a2d5a',
          textAlign: 'justify',
          letterSpacing: 0.3,
          hyphens: 'auto',
          wordBreak: 'break-word',
        }}
        dangerouslySetInnerHTML={{ __html: topicLeft || '' }}
        />

        {/* Right column */}
        <div style={{
          position: 'absolute',
          top: CONTENT_TOP,
          left: COL_RIGHT_X,
          width: COL_W,
          height: CONTENT_H,
          overflow: 'hidden',
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: FONT_SIZE,
          lineHeight: LINE_HEIGHT,
          color: '#1a2d5a',
          textAlign: 'justify',
          letterSpacing: 0.3,
          hyphens: 'auto',
          wordBreak: 'break-word',
        }}
        dangerouslySetInnerHTML={{ __html: topicRight || '' }}
        />
      </DraggableTextLayer>

      {/* Page number */}
      <div style={{
        position: 'absolute',
        bottom: 38,
        right: SQUARE_LEFT + 28,
        zIndex: 3,
        fontFamily: 'Georgia, serif',
        fontSize: 12,
        color: '#7a6a3a',
        letterSpacing: 1,
      }}>
        {pageNum} / {totalPages}
      </div>
    </div>
  );
});

// ─── Modal ────────────────────────────────────────────────────────────────────
export default function ApostilaPrintModal({ lesson, chapterTitle, onClose }) {
  const [topics, setTopics] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [positions, setPositions] = useState(loadPrintPositions);

  // Refs for capture — always full-size, never scaled
  const pageRefs = useRef([React.createRef(), React.createRef(), React.createRef()]);

  useEffect(() => {
    setTopics(splitIntoTopics(lesson.content));
    setCurrentPage(0);
  }, [lesson.content]);

  const pages = [
    [topics[0] || '', topics[1] || ''],
    [topics[2] || '', topics[3] || ''],
    [topics[4] || '', topics[5] || ''],
  ];
  const totalPages = 3;

  const handlePositionChange = (layer, nextPosition) => {
    setPositions((current) => ({
      ...current,
      [layer]: normalizePosition(nextPosition),
    }));
  };

  const handleSavePositions = () => {
    savePrintPositions(positions);
    toast.success('Posições salvas para este modelo.');
  };

  const handleApplyPositionsToAll = () => {
    savePrintPositions(positions);
    toast.success('Posições aplicadas e salvas para todos os modelos.');
  };

  const handleResetPositions = () => {
    setPositions(DEFAULT_POSITIONS);
    savePrintPositions(DEFAULT_POSITIONS);
    toast.success('Posições redefinidas.');
  };

  // Visual scale for preview only — NOT applied to capture nodes
  const SCALE = Math.min(0.40, (typeof window !== 'undefined' ? window.innerWidth * 0.86 : 900) / IMG_W);

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
    // Capture at 2× for crisp background + text, then downscale to native resolution
    const hiRes = await html2canvas(node, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      width: IMG_W,
      height: IMG_H,
      windowWidth: IMG_W,
      windowHeight: IMG_H,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      backgroundColor: '#fff',
      logging: false,
      imageTimeout: 15000,
    });
    // Draw back to 1× canvas so the final PNG is exactly IMG_W × IMG_H
    const out = document.createElement('canvas');
    out.width  = IMG_W;
    out.height = IMG_H;
    const ctx = out.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(hiRes, 0, 0, IMG_W, IMG_H);
    return out;
  };

  const safeName = (lesson.title || 'aula')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '-').toLowerCase();

  const handleExportPng = async () => {
    setLoading(true);
    try {
      const node = pageRefs.current[currentPage]?.current;
      if (!node) { toast.error('Página não encontrada.'); return; }
      const canvas = await captureNode(node);
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `apostila-${safeName}-p${currentPage + 1}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('PNG exportado!');
      }, 'image/png');
    } catch (e) {
      toast.error('Erro ao exportar PNG: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleExportAllPng = async () => {
    setLoading(true);
    try {
      for (let i = 0; i < totalPages; i++) {
        const node = pageRefs.current[i]?.current;
        if (!node) continue;
        const canvas = await captureNode(node);
        await new Promise((resolve) => {
          canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `apostila-${safeName}-p${i + 1}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setTimeout(resolve, 400);
          }, 'image/png');
        });
      }
      toast.success('Todas as 3 páginas exportadas como PNG!');
    } catch (e) {
      toast.error('Erro: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/82 backdrop-blur-sm p-3">
      {/* Controls */}
      <div
        className="flex flex-wrap items-center gap-2 mb-3 w-full justify-center"
        style={{ maxWidth: IMG_W * SCALE + 40 }}
      >
        <button onClick={onClose} className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors shrink-0">
          <X size={15} /> Fechar
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 transition"
          >
            <ChevronLeft size={15} className="text-white" />
          </button>
          <span className="text-white/70 text-sm min-w-[80px] text-center">
            Pág. {currentPage + 1} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 transition"
          >
            <ChevronRight size={15} className="text-white" />
          </button>
        </div>

        <button
          onClick={() => setEditMode((value) => !value)}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-bold transition-colors ${editMode ? 'border-emerald-400 bg-emerald-500/20 text-emerald-100' : 'border-white/20 bg-white/10 text-white hover:bg-white/20'}`}
        >
          <Move size={14} /> {editMode ? 'Movendo itens' : 'Mover itens'}
        </button>
        {editMode && (
          <>
            <button
              onClick={handleSavePositions}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-emerald-700 transition-colors"
            >
              <Save size={14} /> Salvar posições
            </button>
            <button
              onClick={handleApplyPositionsToAll}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors"
            >
              <Save size={14} /> Reposicionar para todos
            </button>
            <button
              onClick={handleResetPositions}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-bold text-white hover:bg-white/20 transition-colors"
            >
              <RotateCcw size={14} /> Resetar
            </button>
            <span className="text-xs text-white/60">Título X: {positions.title.x}px · Y: {positions.title.y}px | Texto X: {positions.text.x}px · Y: {positions.text.y}px</span>
          </>
        )}

        <button
          onClick={handleExportPng}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-bold text-white hover:bg-white/20 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Image size={14} />}
          PNG (esta pág.)
        </button>
        <button
          onClick={handleExportAllPng}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-1.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
          PNG (3 páginas)
        </button>
      </div>

      {/* ── PREVIEW ONLY — visual scale via CSS, no ref ── */}
      <div
        className="rounded-xl overflow-hidden border border-white/10 shadow-2xl"
        style={{ width: IMG_W * SCALE, height: IMG_H * SCALE, flexShrink: 0 }}
      >
        <div style={{ width: IMG_W, height: IMG_H, transform: `scale(${SCALE})`, transformOrigin: 'top left', pointerEvents: editMode ? 'auto' : 'none' }}>
          {/* Preview page — NO ref, just visual */}
          <ApostilaPage
            lesson={lesson}
            chapterTitle={chapterTitle}
            topicLeft={pages[currentPage][0]}
            topicRight={pages[currentPage][1]}
            pageNum={currentPage + 1}
            totalPages={totalPages}
            positions={positions}
            editMode={editMode}
            onPositionChange={handlePositionChange}
          />
        </div>
      </div>

      {/* ── CAPTURE NODES — full pixel size, off-screen, NO transform, WITH refs ── */}
      <div
        style={{
          position: 'fixed',
          left: -9999,
          top: 0,
          width: IMG_W,
          pointerEvents: 'none',
          zIndex: -10,
          opacity: 0,
          // NO transform here — ever
        }}
      >
        {pages.map((pair, i) => (
          <ApostilaPage
            key={i}
            lesson={lesson}
            chapterTitle={chapterTitle}
            topicLeft={pair[0]}
            topicRight={pair[1]}
            pageNum={i + 1}
            totalPages={totalPages}
            ref={pageRefs.current[i]}
            positions={positions}
          />
        ))}
      </div>
    </div>
  );
}
