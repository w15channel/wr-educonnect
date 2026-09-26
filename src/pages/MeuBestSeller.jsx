import { invokePollinations } from '@/lib/pollinationsAI';
import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  BookOpen, Plus, Trash2, ChevronLeft, Download, Wand2,
  Loader2, Image, AlignLeft, FileText, BookMarked, Lightbulb, ChevronDown, ChevronUp,
  FileEdit, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { BRAND_CNPJ, BRAND_LEGAL_NAME } from '@/lib/brand';

const ALL_COVERS = [
  { url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400&q=80', tags: 'livro escrita literatura' },
  { url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80', tags: 'café leitura estudo' },
  { url: 'https://images.unsplash.com/photo-1474932430478-367dbb6832c1?w=400&q=80', tags: 'natureza floresta verde' },
  { url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&q=80', tags: 'biblioteca estantes conhecimento' },
  { url: 'https://images.unsplash.com/photo-1499244571948-7ccddb3583f1?w=400&q=80', tags: 'negócios sucesso profissional' },
  { url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=400&q=80', tags: 'oceano praia azul' },
  { url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&q=80', tags: 'escrita caneta papel' },
  { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80', tags: 'montanha paisagem aventura' },
  { url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&q=80', tags: 'montanha neve inverno' },
  { url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80', tags: 'floresta caminho natureza' },
  { url: 'https://images.unsplash.com/photo-1476820865390-c52aeebb9891?w=400&q=80', tags: 'cidade noturna luzes urbano' },
  { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', tags: 'pessoa retrato rosto' },
  { url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&q=80', tags: 'homem negócios executivo' },
  { url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80', tags: 'mulher negócios profissional' },
  { url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=80', tags: 'equipe colaboração trabalho' },
  { url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80', tags: 'escritório moderno trabalho' },
  { url: 'https://images.unsplash.com/photo-1502085671122-2d218cd434e6?w=400&q=80', tags: 'abstrato colorido arte' },
  { url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80', tags: 'espaço universo galáxia' },
  { url: 'https://images.unsplash.com/photo-1520209759809-a9bcb6cb3241?w=400&q=80', tags: 'saúde bem estar meditação' },
  { url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80', tags: 'fitness exercício esporte' },
  { url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80', tags: 'comida culinária gastronomia' },
  { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', tags: 'tecnologia digital futuro' },
  { url: 'https://images.unsplash.com/photo-1527689368864-3a821dbccc34?w=400&q=80', tags: 'educação ensino escola' },
  { url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=80', tags: 'estudo aprendizado notas' },
  { url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&q=80', tags: 'liderança gestão empreendedorismo' },
  { url: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&q=80', tags: 'marketing estratégia planejamento' },
  { url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&q=80', tags: 'laptop tecnologia café trabalho' },
  { url: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&q=80', tags: 'computador notebook mac' },
  { url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&q=80', tags: 'livros pilha leitura' },
  { url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&q=80', tags: 'biblioteca antiga história' },
  { url: 'https://images.unsplash.com/photo-1545987796-200677ee1011?w=400&q=80', tags: 'finanças dinheiro investimento' },
  { url: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&q=80', tags: 'foco mente psicologia' },
  { url: 'https://images.unsplash.com/photo-1492176273113-2d51f47b23b0?w=400&q=80', tags: 'pôr do sol céu horizonte' },
  { url: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=400&q=80', tags: 'rio água cachoeira natureza' },
  { url: 'https://images.unsplash.com/photo-1491555103944-7c647fd857e6?w=400&q=80', tags: 'noite estrelas astronomia' },
  { url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80', tags: 'circuito tecnologia programação' },
  { url: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&q=80', tags: 'mulher retrato elegante' },
  { url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&q=80', tags: 'gestão liderança reunião' },
  { url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80', tags: 'livro aberto página' },
  { url: 'https://images.unsplash.com/photo-1467746474745-41dd2c7524cf?w=400&q=80', tags: 'pôr do sol laranja cores' },
];

const PAGE_FORMATS = [
  { value: 'A4', label: 'A4 (210×297mm)' },
  { value: 'A5', label: 'A5 (148×210mm)' },
  { value: 'Letter', label: 'Letter (216×279mm)' },
  { value: '6x9', label: 'Livro 6×9 (152×229mm)' },
];

const STATUS_LABELS = { draft: 'Rascunho', in_progress: 'Em andamento', finished: 'Finalizado' };
const STATUS_COLORS = { draft: 'bg-muted text-muted-foreground', in_progress: 'bg-blue-100 text-blue-700', finished: 'bg-green-100 text-green-700' };

const WRITING_GUIDE = [
  { title: '1. Defina seu propósito', content: 'Antes de escrever, responda: Por que escrever este livro? Para quem? Qual transformação quero causar no leitor? Escreva suas respostas em poucas linhas — isso vai guiar toda a obra.' },
  { title: '2. Conheça seu público-alvo', content: 'Descreva detalhadamente quem é seu leitor ideal: idade, desafios, sonhos, vocabulário. Escreva como se fosse uma conversa com essa pessoa específica.' },
  { title: '3. Crie seu esboço (outline)', content: 'Liste os capítulos principais e o que cada um vai cobrir. Um bom livro tem começo (apresentação do problema), meio (desenvolvimento e soluções) e fim (conclusão e chamada à ação).' },
  { title: '4. Escreva sem editar primeiro', content: 'Na primeira passagem, apenas escreva. Não se preocupe com perfeição. Quantidade antes de qualidade. Depois você revisa.' },
  { title: '5. Revisão e polimento', content: 'Leia em voz alta. Peça feedback. Verifique coerência, clareza e fluidez. Elimine repetições e parágrafos desnecessários.' },
  { title: '6. Normas ABNT para citações', content: 'Cite fontes no texto com (SOBRENOME, Ano, p. X) e liste na seção de Referências. Ex: FREIRE, Paulo. Pedagogia do Oprimido. 50. ed. São Paulo: Paz e Terra, 2019.' },
];

function wordCount(text) {
  return text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
}

export default function MeuBestSeller() {
  const { user: session } = useOutletContext();
  const queryClient = useQueryClient();
  const [selectedBook, setSelectedBook] = useState(null);
  const [editingChapter, setEditingChapter] = useState(null);
  const [chapterContent, setChapterContent] = useState('');
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [coverSearch, setCoverSearch] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestingRefs, setSuggestingRefs] = useState(false);
  const [newBookForm, setNewBookForm] = useState({ title: '', subtitle: '', page_format: 'A4', cover_image_url: '', dedication: '', preface: '' });
  const [showNewBook, setShowNewBook] = useState(false);
  const [wordLoading, setWordLoading] = useState(false);
  const [guideOpen, setGuideOpen] = useState(null);

  const filteredCovers = coverSearch.trim()
    ? ALL_COVERS.filter(c => c.tags.toLowerCase().includes(coverSearch.toLowerCase()))
    : ALL_COVERS;

  const { data: books = [] } = useQuery({
    queryKey: ['books', session?.email],
    queryFn: () => base44.entities.Book.filter({ author_email: session?.email }, '-created_date', 50),
    enabled: !!session?.email,
  });

  const { data: chapters = [] } = useQuery({
    queryKey: ['book-chapters', selectedBook?.id],
    queryFn: () => base44.entities.BookChapter.filter({ book_id: selectedBook?.id }, 'order', 100),
    enabled: !!selectedBook?.id,
  });

  const createBookMutation = useMutation({
    mutationFn: (data) => base44.entities.Book.create(data),
    onSuccess: (book) => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setShowNewBook(false);
      setSelectedBook(book);
      toast.success('Livro criado!');
    },
  });

  const updateBookMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Book.update(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setSelectedBook(prev => ({ ...prev, ...updated }));
    },
  });

  const createChapterMutation = useMutation({
    mutationFn: (data) => base44.entities.BookChapter.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-chapters', selectedBook?.id] });
      toast.success('Capítulo adicionado!');
    },
  });

  const updateChapterMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BookChapter.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-chapters', selectedBook?.id] });
      setEditingChapter(null);
      toast.success('Capítulo salvo!');
    },
  });

  const deleteChapterMutation = useMutation({
    mutationFn: (id) => base44.entities.BookChapter.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['book-chapters', selectedBook?.id] }),
  });

  const deleteBookMutation = useMutation({
    mutationFn: (id) => base44.entities.Book.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setSelectedBook(null);
      toast.success('Livro removido.');
    },
  });

  const handleSuggestReferences = async () => {
    if (!selectedBook?.title) return;
    setSuggestingRefs(true);
    const result = await invokePollinations({
      prompt: `Sugira 5 referências bibliográficas reais e relevantes para um livro chamado "${selectedBook.title}"${selectedBook.subtitle ? ` (subtítulo: ${selectedBook.subtitle})` : ''}. Formate cada referência nas normas ABNT. Responda apenas com a lista numerada, uma por linha.`,
    });
    const current = selectedBook.references || '';
    updateBookMutation.mutate({ id: selectedBook.id, data: { references: current ? current + '\n\n' + result : result } });
    setSuggestingRefs(false);
    toast.success('Referências sugeridas pela IA!');
  };

  const handleExportWord = async () => {
    setWordLoading(true);
    const bookTitle = selectedBook?.title || 'Meu Livro';
    const subtitle = selectedBook?.subtitle || '';
    const author = selectedBook?.author_name || session?.name || '';
    const year = new Date().getFullYear();

    const pageSize = selectedBook?.page_format === 'A5' ? 'A5'
      : selectedBook?.page_format === 'Letter' ? 'letter'
      : selectedBook?.page_format === '6x9' ? '6in 9in'
      : 'A4';

    const marginInner = '2.5cm';
    const marginOuter = '2.0cm';

    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <title>${bookTitle}</title>
  <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>90</w:Zoom></w:WordDocument></xml><![endif]-->
  <style>
    @page Section1 { size: ${pageSize}; margin: 2.0cm ${marginOuter} 2.0cm ${marginInner}; }
    div.Section1 { page: Section1; }
    body { font-family: Georgia, "Garamond", serif; font-size: 11.5pt; line-height: 1.4; color: #000; }
    h1.chapter { font-family: Georgia, serif; font-size: 16pt; font-weight: bold; text-align: left; margin: 0 0 1.2em; page-break-before: always; line-height: 1.0; }
    h2 { font-family: Georgia, serif; font-size: 12.5pt; font-weight: bold; margin: 1.2em 0 0.6em; }
    p { font-size: 11.5pt; text-indent: 0.75cm; margin: 0; text-align: justify; line-height: 1.35; }
    p.noindent { text-indent: 0; }
    .page-break { page-break-after: always; }
    .cover { text-align: center; padding-top: 7cm; }
    .cover p { text-indent: 0; text-align: center; }
    .cover .author { font-size: 12pt; letter-spacing: 2pt; text-transform: uppercase; margin-bottom: 3cm; }
    .cover .title { font-size: 22pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1pt; margin-bottom: 0.5cm; }
    .cover .subtitle { font-size: 13pt; font-style: italic; margin-bottom: 4cm; }
    .cover .publisher { font-size: 10pt; color: #555; }
    .credits { font-size: 9pt; line-height: 1.6; padding-top: 14cm; }
    .credits p { text-indent: 0; }
    .dedication { padding-top: 10cm; text-align: right; }
    .dedication p { text-indent: 0; text-align: right; max-width: 50%; margin-left: auto; font-style: italic; }
    .section-heading { font-size: 14pt; font-weight: bold; text-transform: uppercase; text-align: center; margin-bottom: 1.5cm; letter-spacing: 2pt; }
    .toc-entry { font-size: 11pt; margin: 0; text-indent: 0; line-height: 1.8; }
    .ref-entry { font-size: 11pt; text-indent: 0; margin: 0 0 6pt; text-align: justify; }
    .author-bio { font-size: 11pt; text-indent: 0; text-align: justify; }
    .back-cover { padding-top: 5cm; text-align: center; }
    .back-cover p { text-indent: 0; font-size: 11.5pt; max-width: 70%; margin: 0 auto 1cm; font-style: italic; line-height: 1.6; text-align: justify; }
  </style>
</head>
<body>
<div class="Section1">`;

    html += `<div class="cover page-break">
  <p class="author">${author}</p>
  <p class="title">${bookTitle}</p>
  ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
  <p class="publisher">${BRAND_LEGAL_NAME}<br/>CNPJ ${BRAND_CNPJ}<br/>${year}</p>
</div>`;

    html += `<div style="text-align:center;padding-top:12cm;" class="page-break">
  <p style="font-size:18pt;font-weight:bold;text-indent:0;text-transform:uppercase;letter-spacing:2pt;">${bookTitle}</p>
  ${subtitle ? `<p style="font-size:12pt;font-style:italic;text-indent:0;margin-top:0.5cm;">${subtitle}</p>` : ''}
</div>`;

    html += `<div class="credits page-break">
  <p class="noindent">© ${year} ${author}</p>
  <p class="noindent">Todos os direitos reservados.</p>
  <p class="noindent" style="margin-top:1cm;">Publicado em parceria com ${BRAND_LEGAL_NAME}.</p>
  <p class="noindent">CNPJ ${BRAND_CNPJ}.</p>
  <p class="noindent" style="margin-top:0.5cm;">Formato: ${selectedBook?.page_format || 'A4'}</p>
  <p class="noindent" style="margin-top:0.5cm;font-style:italic">Esta obra foi produzida na plataforma ${BRAND_LEGAL_NAME}.</p>
</div>`;

    if (selectedBook?.dedication) {
      html += `<div class="dedication page-break">`;
      selectedBook.dedication.split('\n').forEach(l => {
        if (l.trim()) html += `<p>${l}</p>`;
      });
      html += `</div>`;
    }

    if (selectedBook?.preface) {
      html += `<div class="page-break"><p class="section-heading">Prefácio</p>`;
      selectedBook.preface.split('\n').forEach(l => {
        if (l.trim()) html += `<p>${l}</p>`;
      });
      html += `</div>`;
    }

    html += `<div class="page-break"><p class="section-heading">Sumário</p>`;
    chapters.forEach((ch, i) => {
      html += `<p class="toc-entry">${i + 1}. ${ch.title}</p>`;
    });
    html += `</div>`;

    chapters.forEach((ch) => {
      html += `<div class="page-break">`;
      html += `<h1 class="chapter">${ch.order}. ${ch.title}</h1>`;
      const text = ch.content ? ch.content.replace(/<[^>]+>/g, '').trim() : '';
      text.split('\n').forEach(l => {
        if (l.trim()) html += `<p>${l}</p>`;
      });
      html += `</div>`;
    });

    if (selectedBook?.references) {
      html += `<div class="page-break"><p class="section-heading">Referências Bibliográficas</p>`;
      selectedBook.references.split('\n').forEach(l => {
        if (l.trim()) html += `<p class="ref-entry">${l}</p>`;
      });
      html += `</div>`;
    }

    html += `<div class="page-break"><p class="section-heading">Sobre o Autor</p>
  <p class="author-bio">${author} é autor(a) desta obra produzida pela plataforma ${BRAND_LEGAL_NAME}. Para mais informações, entre em contato com a instituição.</p>
</div>`;

    html += `<div class="back-cover">
  <p>${bookTitle}${subtitle ? ` — ${subtitle}` : ''}</p>
  <p style="font-size:9pt;color:#555;margin-top:2cm;font-style:normal;">${BRAND_LEGAL_NAME} · CNPJ ${BRAND_CNPJ} · ${year}</p>
</div>`;

    html += `</div></body></html>`;

    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bookTitle.replace(/\s+/g, '-')}-editorial.doc`;
    a.click();
    URL.revokeObjectURL(url);
    setWordLoading(false);
    toast.success('Livro exportado com estrutura editorial completa!');
  };

  const handleAISpellcheck = async () => {
    if (!chapterContent.trim()) return;
    setAiLoading(true);
    const result = await invokePollinations({
      prompt: `Corrija ortografia e gramática do texto a seguir, mantendo o estilo e conteúdo do autor. Retorne apenas o texto corrigido, sem comentários:\n\n${chapterContent}`,
    });
    setChapterContent(result);
    setAiLoading(false);
    toast.success('Texto corrigido pela IA!');
  };

  const totalWords = chapters.reduce((sum, ch) => sum + wordCount(ch.content || ''), 0);

  // ── Editor de capítulo ──
  if (editingChapter) {
    const currentWords = wordCount(chapterContent);
    return (
      <div className="flex flex-col h-full app-page max-w-4xl mx-auto space-y-4 animate-fade-in-up">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => setEditingChapter(null)} className="gap-1.5 text-xs">
            <ChevronLeft size={14} /> Voltar ao Livro
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground font-mono">
              {currentWords} palavras
            </span>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleAISpellcheck} disabled={aiLoading || !chapterContent.trim()}>
              {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
              Corrigir com IA
            </Button>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => updateChapterMutation.mutate({ id: editingChapter.id, data: { content: chapterContent } })}
              disabled={updateChapterMutation.isPending}
            >
              Salvar Capítulo
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FileEdit size={18} className="text-primary" />
          <h2 className="text-lg font-bold text-foreground">{editingChapter.title}</h2>
        </div>
        <Textarea
          value={chapterContent}
          onChange={e => setChapterContent(e.target.value)}
          placeholder="Escreva o conteúdo do capítulo aqui... Use quebras de linha (Enter) para separar parágrafos."
          className="flex-1 resize-none text-sm leading-relaxed"
          style={{ minHeight: '65vh' }}
        />
      </div>
    );
  }

  // ── Detalhes do livro ──
  if (selectedBook) {
    return (
      <div className="app-page max-w-4xl mx-auto space-y-5 animate-fade-in-up">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => setSelectedBook(null)} className="gap-1.5 text-xs">
            <ChevronLeft size={14} /> Meus Livros
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleExportWord} disabled={wordLoading || chapters.length === 0}>
              {wordLoading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              Exportar para Word
            </Button>
            <button onClick={() => { if (confirm('Remover este livro e todos os capítulos?')) deleteBookMutation.mutate(selectedBook.id); }} className="p-2 text-muted-foreground hover:text-destructive transition-colors" title="Remover livro">
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
          <div className="flex items-start gap-4">
            <div
              className="w-24 h-36 rounded-xl overflow-hidden shrink-0 cursor-pointer relative group bg-gradient-to-br from-primary/80 to-accent/80"
              onClick={() => setShowCoverPicker(true)}
            >
              {selectedBook.cover_image_url ? (
                <img src={selectedBook.cover_image_url} alt="capa" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen size={28} className="text-white opacity-60" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Image size={16} className="text-white" />
              </div>
            </div>
            <div className="flex-1 space-y-2 min-w-[200px]">
              <Input
                value={selectedBook.title}
                onChange={e => updateBookMutation.mutate({ id: selectedBook.id, data: { title: e.target.value } })}
                className="font-bold text-base"
                placeholder="Título do livro"
              />
              <Input
                value={selectedBook.subtitle || ''}
                onChange={e => updateBookMutation.mutate({ id: selectedBook.id, data: { subtitle: e.target.value } })}
                placeholder="Subtítulo (opcional)"
                className="text-sm"
              />
              <div className="flex items-center gap-2">
                <Select value={selectedBook.page_format} onValueChange={v => updateBookMutation.mutate({ id: selectedBook.id, data: { page_format: v } })}>
                  <SelectTrigger className="h-8 text-xs w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_FORMATS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={selectedBook.status} onValueChange={v => updateBookMutation.mutate({ id: selectedBook.id, data: { status: v } })}>
                  <SelectTrigger className="h-8 text-xs w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="in_progress">Em andamento</SelectItem>
                    <SelectItem value="finished">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {totalWords > 0 && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <TrendingUp size={12} /> {totalWords} palavras escritas · {chapters.length} capítulo{chapters.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        </div>

        <Tabs defaultValue="chapters">
          <TabsList className="mb-4 flex-wrap h-auto">
            <TabsTrigger value="chapters"><AlignLeft size={13} className="mr-1.5" /> Capítulos</TabsTrigger>
            <TabsTrigger value="meta"><FileText size={13} className="mr-1.5" /> Dedicatória & Prefácio</TabsTrigger>
            <TabsTrigger value="references"><BookMarked size={13} className="mr-1.5" /> Referências</TabsTrigger>
            <TabsTrigger value="guide"><Lightbulb size={13} className="mr-1.5" /> Guia de Escrita</TabsTrigger>
          </TabsList>

          <TabsContent value="chapters" className="space-y-3">
            {chapters.map(ch => (
              <div key={ch.id} className="flex items-center gap-3 p-3 bg-secondary/40 rounded-xl hover:bg-secondary/60 transition-colors group">
                <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">{ch.order}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{ch.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {ch.content ? `${wordCount(ch.content)} palavras` : 'Vazio'}
                    {ch.content ? ' · ' + ch.content.replace(/<[^>]+>/g, '').substring(0, 50) + '...' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    onClick={() => { setEditingChapter(ch); setChapterContent(ch.content || ''); }}
                  >
                    Editar
                  </Button>
                  <button onClick={() => deleteChapterMutation.mutate(ch.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs border-dashed"
              onClick={() => {
                createChapterMutation.mutate({
                  book_id: selectedBook.id,
                  author_email: session?.email,
                  title: `Capítulo ${chapters.length + 1}`,
                  content: '',
                  order: chapters.length + 1,
                });
              }}
            >
              <Plus size={13} /> Adicionar Capítulo
            </Button>
          </TabsContent>

          <TabsContent value="meta" className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">Dedicatória</label>
              <Textarea
                rows={4}
                placeholder="A quem você dedica este livro?"
                value={selectedBook.dedication || ''}
                onChange={e => updateBookMutation.mutate({ id: selectedBook.id, data: { dedication: e.target.value } })}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">Prefácio</label>
              <Textarea
                rows={6}
                placeholder="Escreva a introdução do seu livro..."
                value={selectedBook.preface || ''}
                onChange={e => updateBookMutation.mutate({ id: selectedBook.id, data: { preface: e.target.value } })}
              />
            </div>
          </TabsContent>

          <TabsContent value="references" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-foreground">Referências Bibliográficas</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Formato ABNT. Uma referência por linha.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs shrink-0"
                onClick={handleSuggestReferences}
                disabled={suggestingRefs}
              >
                {suggestingRefs ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                Sugerir pela IA
              </Button>
            </div>
            <Textarea
              rows={10}
              placeholder={`Ex: SOBRENOME, Nome. Título do Livro. Edição. Cidade: Editora, Ano.\n\nSe não tiver referências, use o botão "Sugerir pela IA" para obter sugestões baseadas no título do seu livro.`}
              value={selectedBook.references || ''}
              onChange={e => updateBookMutation.mutate({ id: selectedBook.id, data: { references: e.target.value } })}
              className="font-mono text-xs"
            />
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
              <strong>Formato ABNT:</strong> SOBRENOME, Nome. <em>Título em itálico</em>. Nº ed. Cidade: Editora, Ano.
            </div>
          </TabsContent>

          <TabsContent value="guide" className="space-y-3">
            <p className="text-sm text-muted-foreground">Siga este passo a passo para escrever seu livro com mais clareza e profissionalismo.</p>
            {WRITING_GUIDE.map((step, i) => (
              <div key={i} className="border border-border rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 bg-secondary/30 hover:bg-secondary/50 transition-colors text-left"
                  onClick={() => setGuideOpen(guideOpen === i ? null : i)}
                >
                  <span className="font-semibold text-sm text-foreground">{step.title}</span>
                  {guideOpen === i ? <ChevronUp size={15} className="text-muted-foreground shrink-0" /> : <ChevronDown size={15} className="text-muted-foreground shrink-0" />}
                </button>
                {guideOpen === i && (
                  <div className="px-4 py-3 text-sm text-muted-foreground bg-card leading-relaxed">
                    {step.content}
                  </div>
                )}
              </div>
            ))}
          </TabsContent>
        </Tabs>

        <Dialog open={showCoverPicker} onOpenChange={setShowCoverPicker}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><Image size={16} /> Escolher Capa</DialogTitle></DialogHeader>
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="Pesquisar por tema (ex: natureza, negócios, tecnologia)..."
                value={coverSearch}
                onChange={e => setCoverSearch(e.target.value)}
              />
              <Button variant="outline" size="sm" onClick={() => setCoverSearch('')}>Limpar</Button>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{filteredCovers.length} capas disponíveis</p>
            <div className="grid grid-cols-5 gap-2 max-h-96 overflow-y-auto">
              {filteredCovers.map((item, i) => (
                <div
                  key={i}
                  className={`aspect-[2/3] rounded-xl overflow-hidden cursor-pointer border-2 transition-all hover:border-primary ${selectedBook.cover_image_url === item.url ? 'border-primary' : 'border-transparent'}`}
                  onClick={() => {
                    updateBookMutation.mutate({ id: selectedBook.id, data: { cover_image_url: item.url } });
                    setShowCoverPicker(false);
                    toast.success('Capa atualizada!');
                  }}
                >
                  <img src={item.url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
              {filteredCovers.length === 0 && (
                <div className="col-span-5 text-center py-8 text-muted-foreground text-sm">
                  Nenhuma capa encontrada para "{coverSearch}". Tente outro termo.
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ── Lista de livros (página principal) ──
  return (
    <div className="app-page max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen size={22} className="text-primary" /> Meu Best Seller
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Laboratório de Autoria — escreva, estruture e exporte seu livro com formatação editorial profissional</p>
        </div>
        <Button onClick={() => setShowNewBook(true)} className="gap-2">
          <Plus size={15} /> Novo Livro
        </Button>
      </div>

      {books.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-8 sm:p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center mx-auto mb-5">
            <BookOpen size={28} className="text-primary" />
          </div>
          <p className="font-bold text-lg text-foreground">Transforme seu conhecimento em um livro</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Crie capítulos, dedicatória, prefácio e referências bibliográficas. Exporte com estrutura editorial completa e formatação ABNT.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 max-w-2xl mx-auto">
            <div className="bg-secondary/40 rounded-xl p-4 text-left">
              <FileEdit size={18} className="text-primary mb-2" />
              <p className="font-bold text-xs text-foreground">Estrutura Editorial</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Capa, créditos, dedicatória, prefácio, sumário, capítulos, referências e contra-capa</p>
            </div>
            <div className="bg-secondary/40 rounded-xl p-4 text-left">
              <Wand2 size={18} className="text-primary mb-2" />
              <p className="font-bold text-xs text-foreground">IA de Apoio</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Correção ortográfica e sugestão de referências bibliográficas</p>
            </div>
            <div className="bg-secondary/40 rounded-xl p-4 text-left">
              <Download size={18} className="text-primary mb-2" />
              <p className="font-bold text-xs text-foreground">Exportação Word</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Documento formatado pronto para editoração e impressão</p>
            </div>
          </div>
          <Button className="mt-6 gap-2" onClick={() => setShowNewBook(true)}><Plus size={15} /> Criar Meu Primeiro Livro</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.map(book => (
            <button
              key={book.id}
              onClick={() => setSelectedBook(book)}
              className="bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all text-left group"
            >
              <div className="aspect-[3/2] relative overflow-hidden">
                {book.cover_image_url
                  ? <img src={book.cover_image_url} alt="capa" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  : <div className="w-full h-full bg-gradient-to-br from-primary/80 to-accent/80 flex items-center justify-center">
                      <BookOpen size={32} className="text-white opacity-60" />
                    </div>
                }
              </div>
              <div className="p-4">
                <p className="font-bold text-sm text-foreground truncate">{book.title}</p>
                {book.subtitle && <p className="text-xs text-muted-foreground truncate">{book.subtitle}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={`text-[10px] ${STATUS_COLORS[book.status]}`}>{STATUS_LABELS[book.status]}</Badge>
                  <span className="text-[10px] text-muted-foreground">{book.page_format}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <Dialog open={showNewBook} onOpenChange={setShowNewBook}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><BookOpen size={16} /> Criar Novo Livro</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <Input placeholder="Título do livro *" value={newBookForm.title} onChange={e => setNewBookForm(p => ({ ...p, title: e.target.value }))} />
            <Input placeholder="Subtítulo (opcional)" value={newBookForm.subtitle} onChange={e => setNewBookForm(p => ({ ...p, subtitle: e.target.value }))} />
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">Formato das Páginas</label>
              <Select value={newBookForm.page_format} onValueChange={v => setNewBookForm(p => ({ ...p, page_format: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAGE_FORMATS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              disabled={!newBookForm.title.trim() || createBookMutation.isPending}
              onClick={() => createBookMutation.mutate({ ...newBookForm, author_email: session?.email, author_name: session?.name })}
            >
              Criar Livro
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
