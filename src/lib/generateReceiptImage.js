import { base44 } from '@/api/base44Client';
import { BRAND_CNPJ, BRAND_LEGAL_NAME, BRAND_SHORT_NAME } from '@/lib/brand';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateReceiptCode() {
  const block = (len) => Array.from({ length: len }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
  return `EDU-${block(4)}-${block(4)}`;
}

function buildPrompt({ studentName, receiptCode, amount, referenceLabel, paidDate, coordinatorName }) {
  return `A single, complete, print-ready vertical A4 portrait receipt document for a Brazilian education institute, rendered as one cohesive designed page — classic academic style, sober and institutional, absolutely not a collage of pieces.

OVERALL DESIGN: clean off-white paper background with a fine double border frame in deep navy blue #1a365d running around the whole page, with small ornamental corner flourishes. Elegant, symmetric, generous white space, refined serif typography throughout (Garamond / Trajan feel). Accent color forest green #2d5a27 used sparingly for rules and the seal. Flat vector editorial print design, crisp high-resolution, perfectly straight horizontal baselines, no photo texture, no drop shadows, no gradients, no mockup, no desk, no hands, no folded paper.

TEXT CONTENT — render every line exactly as written, spelled correctly, sharp and highly legible, correct Portuguese accents:
Header, centered at top: "WR EDU ®" large in navy serif capitals, below it "Instituto de Desenvolvimento Humano" in smaller serif italic, below it "CNPJ ${BRAND_CNPJ}" in small caps. A thin green horizontal rule under the header.
Main title, centered, navy serif capitals with letter-spacing: "RECIBO DE CONTRIBUIÇÃO VOLUNTÁRIA".
A bordered data panel with light blue-grey fill containing five aligned label/value rows, labels in navy serif on the left and values in bold serif on the right:
"Código de registro:" — "${receiptCode}"
"Aluno(a):" — "${studentName}"
"Valor da contribuição:" — "${amount}"
"Referente a:" — "${referenceLabel}"
"Data do pagamento:" — "${paidDate}"
Below the panel, a justified formal declaration paragraph in serif: "Declaramos, para os devidos fins, que recebemos de ${studentName} a contribuição voluntária no valor de ${amount}, referente a ${referenceLabel}, com pagamento realizado em ${paidDate}."
A recognition box outlined in green #2d5a27 with the heading "NOSSO RECONHECIMENTO" and the text: "Agradecemos a dedicação aos estudos e a contribuição realizada. Cada colaboração fortalece a continuidade das atividades formativas do instituto."
Bottom left: a handwritten-style signature line above the name "${coordinatorName}" with "Coordenador Geral" underneath.
Bottom right: an elegant circular scalloped seal in green and navy with the words "OBRIGADO POR CONTRIBUIR" curved inside the ring and a small sprouting leaf at its center.
Footer bar across the bottom in navy small capitals: "CONHECIMENTO • DESENVOLVIMENTO • OPORTUNIDADES".

No other words, no lorem ipsum, no placeholder text, no duplicated lines, no watermark, no QR code, no barcode.`;
}

export async function getDefaultReceiptTemplate() {
  const [template] = await base44.entities.ReceiptTemplate.list('-created_date', 1);
  return template || null;
}

export async function setDefaultReceiptTemplate(imageUrl, adminEmail) {
  const existing = await base44.entities.ReceiptTemplate.list('-created_date', 5);
  await Promise.all(existing.map((t) => base44.entities.ReceiptTemplate.delete(t.id)));
  return base44.entities.ReceiptTemplate.create({ image_url: imageUrl, set_by: adminEmail || '' });
}

// Com um modelo padrão definido, a IA reaproveita exatamente o mesmo design
// da imagem de referência e troca apenas os dados do aluno.
export async function generateReceiptImage(data, templateUrl = null) {
  const prompt = templateUrl
    ? `Reproduce EXACTLY the same receipt design as the reference image — same layout, frame, colors, typography, seal, signature block and footer — changing ONLY the variable data to the values below. Keep every other word identical to the reference.\n\n${buildPrompt(data)}`
    : buildPrompt(data);
  const result = await base44.integrations.Core.GenerateImage({
    prompt,
    ...(templateUrl ? { existing_image_urls: [templateUrl] } : {}),
  });
  return result.url;
}

export async function downloadReceiptImage(url, receiptCode) {
  const response = await fetch(url);
  const blob = await response.blob();
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `recibo-contribuicao-${receiptCode}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

// ════════════════════════════════════════════════════════════════════════
// CERTIFICATE TEMPLATE GENERATOR
// ════════════════════════════════════════════════════════════════════════
// Generates certificate background designs via AI image generation, similar
// to the receipt generator. The admin can generate multiple variations,
// preview them, and save a favorite as the default template.
//
// Two output modes:
//   • PDF model: full certificate with all data (for printing at a print shop)
//   • PNG model: social-media-ready, without sensitive data (CPF, email, etc.)
//
// The AI generates ONLY the decorative background/ornaments — text overlay
// (name, course, QR code, etc.) is rendered by the HTML/CSS layer
// (CertificateFront.jsx), ensuring crisp, legible text in both PDF and PNG.
// ════════════════════════════════════════════════════════════════════════

const CERT_ASPECT_RATIO = '1052:744';

export const CERTIFICATE_STYLES = [
  { id: 'classic', label: 'Clássico', description: 'Navy e dourado, ornamentos tradicionais' },
  { id: 'modern', label: 'Moderno', description: 'Minimalista, linhas geométricas limpas' },
  { id: 'royal', label: 'Real', description: 'Barroco luxuoso, filigrana dourada' },
  { id: 'botanical', label: 'Botânico', description: 'Floral elegante, folhas de louro' },
  { id: 'geometric', label: 'Geométrico', description: 'Angular contemporâneo, triângulos dourados' },
];

/**
 * Builds the AI prompt for generating a certificate background.
 * The AI creates ONLY the decorative frame/ornaments — no text data.
 * Text is overlaid by the HTML layer, so it stays crisp at any resolution.
 */
function buildCertBgPrompt({ style = 'classic', courseLabel = '' }) {
  const styleMap = {
    classic: 'Classic academic certificate background. Deep navy blue #1a2d5a and gold #c9a227 color scheme. Ornate but elegant border frame with corner flourishes. Light cream/ivory center area for text overlay. Subtle watermark-style laurel wreath pattern in the background at 5% opacity. Empty center — no text, no names, no dates. Flat vector editorial print design, perfectly symmetrical, high resolution, no photo texture, no drop shadows, no gradients in the center area. Landscape orientation ' + CERT_ASPECT_RATIO + '.',
    modern: 'Modern minimalist certificate background. Soft gradient from off-white to pale blue. Clean geometric border in navy blue #1a2d5a with thin gold #c9a227 accent lines. Abstract geometric corner ornaments. Generous empty center space for text. No text, no names, no dates. Flat vector design, high resolution, landscape orientation ' + CERT_ASPECT_RATIO + '.',
    royal: 'Luxurious royal certificate background. Deep navy #1a2d5a with gold #c9a227 filigree border. Baroque-style corner ornaments and decorative guilloche pattern frame. Elegant guilloche security background pattern at very low opacity. Cream center area completely empty. No text, no names, no dates. Flat vector design, high resolution, landscape orientation ' + CERT_ASPECT_RATIO + '.',
    botanical: 'Elegant botanical certificate background. Soft ivory with delicate navy and gold floral border frame. Thin gold double-line border with botanical corner accents (laurel leaves). Watercolor-style subtle botanical watermark in corners only. Center area completely clean and empty. No text, no names, no dates. Flat vector design, high resolution, landscape orientation ' + CERT_ASPECT_RATIO + '.',
    geometric: 'Contemporary geometric certificate background. Clean white center with bold navy #1a2d5a angular border design and gold #c9a227 triangular accents. Modern architectural feel. Center completely empty. No text, no names, no dates. Flat vector design, high resolution, landscape orientation ' + CERT_ASPECT_RATIO + '.',
  };
  const stylePrompt = styleMap[style] || styleMap.classic;
  const courseHint = courseLabel ? ' This is for a ' + courseLabel + ' course certificate.' : '';
  return stylePrompt + courseHint + ' The design must be a complete certificate BACKGROUND ONLY — absolutely no text, no letters, no numbers, no names, no dates, no QR codes, no seals with text. Only decorative frame, borders, ornaments, and background patterns. The center must be clean and empty for text to be overlaid later. Landscape orientation, high resolution, print-ready quality.';
}

/**
 * Generates a certificate background image via AI.
 * @param {Object} options - style, courseLabel, templateUrl
 * @returns {Promise<string>} URL of the generated image
 */
export async function generateCertificateBackground({ style = 'classic', courseLabel = '', templateUrl = null } = {}) {
  const prompt = templateUrl
    ? 'Reproduce EXACTLY the same certificate background design as the reference image — same layout, frame, colors, ornaments, and style — but regenerate it in maximum quality. Keep it as a BACKGROUND ONLY with no text.\n\n' + buildCertBgPrompt({ style, courseLabel })
    : buildCertBgPrompt({ style, courseLabel });
  const result = await base44.integrations.Core.GenerateImage({
    prompt,
    ...(templateUrl ? { existing_image_urls: [templateUrl] } : {}),
  });
  return result.url;
}

/**
 * Builds the AI prompt for a complete social-media-ready certificate image.
 * Includes student name and course but NO sensitive data (no CPF, email, etc.).
 */
export function buildSocialMediaCertPrompt(data) {
  const studentName = data.studentName || 'Nome do Aluno';
  const courseName = data.courseName || 'Curso de Formacao';
  const gratification = data.gratificationText || 'E com imensa satisfacao que certificamos que';
  const bodyText = data.bodyText || 'concluiu com exito o curso de formacao profissional';
  const totalHours = data.totalHours || 120;
  const averageGrade = data.averageGrade || '10,0';
  const issueDate = data.issueDate || '';
  const honorTitle = data.honorTitle || '';

  return [
    'A single, complete, print-ready landscape certificate document for a Brazilian education institute, rendered as one cohesive designed page — classic academic style, sober and institutional, absolutely not a collage of pieces.',
    '',
    'OVERALL DESIGN: elegant off-white/ivory paper background with a refined ornamental border frame in deep navy blue #1a2d5a with gold #c9a227 accents. Fine double border lines, small ornamental corner flourishes. Elegant, symmetric, generous white space, refined serif typography throughout (Cormorant Garamond / Cinzel feel). Flat vector editorial print design, crisp high-resolution, perfectly straight horizontal baselines, no photo texture, no drop shadows, no gradients, no mockup.',
    '',
    'TEXT CONTENT — render every line exactly as written, spelled correctly, sharp and highly legible, correct Portuguese accents:',
    '',
    'Header, centered at top: "' + BRAND_SHORT_NAME + '" large in navy serif capitals, below it "' + BRAND_LEGAL_NAME + '" in smaller serif italic, below it "CNPJ ' + BRAND_CNPJ + '" in small caps. A thin gold horizontal rule under the header.',
    '',
    'Main title, centered, navy serif capitals with letter-spacing: "CERTIFICADO DE CONCLUSAO".',
    '',
    'Gratification line, centered, serif italic: "' + gratification + '"',
    '',
    'Student name, centered, large cursive script font in navy: "' + studentName + '"',
    '',
    'Body text, centered, serif: "' + bodyText + '"',
    '',
    'Course name, centered, below body text, in navy serif capitals with letter-spacing: "' + courseName + '"',
    '',
    'A line with: "Carga horaria: ' + totalHours + ' horas - Media final: ' + averageGrade + ' - ' + issueDate + '"',
    '',
    honorTitle ? 'A decorative honor badge in gold and navy: "★ ' + honorTitle + '"' : '',
    '',
    'Bottom left: a handwritten-style signature line above the name "William Ribeiro S." with "Coordenador Geral" underneath.',
    '',
    'Bottom right: an elegant circular scalloped seal in gold and navy with the words "WR-EDU CERTIFICADO AUTENTICO" curved inside the ring.',
    '',
    'Footer bar across the bottom in navy small capitals: "CONHECIMENTO - DESENVOLVIMENTO - OPORTUNIDADES".',
    '',
    'IMPORTANT: Do NOT include any CPF, RG, email address, phone number, or access code. This is a public certificate for social media sharing. No QR code. No barcode.',
    '',
    'No other words, no lorem ipsum, no placeholder text, no duplicated lines, no watermark.',
    '',
    'Landscape orientation ' + CERT_ASPECT_RATIO + '.',
  ].filter(Boolean).join('\n');
}

/**
 * Generates a complete social-media certificate image via AI (no sensitive data).
 * @param {Object} certData - Certificate data
 * @param {string|null} templateUrl - Optional reference template to reuse design
 * @returns {Promise<string>} URL of the generated image
 */
export async function generateSocialMediaCertificate(certData, templateUrl = null) {
  const prompt = templateUrl
    ? 'Reproduce EXACTLY the same certificate design as the reference image — same layout, frame, colors, typography, seal, signature block and footer — changing ONLY the variable data to the values below. Keep every other word identical to the reference.\n\n' + buildSocialMediaCertPrompt(certData)
    : buildSocialMediaCertPrompt(certData);
  const result = await base44.integrations.Core.GenerateImage({
    prompt,
    ...(templateUrl ? { existing_image_urls: [templateUrl] } : {}),
  });
  return result.url;
}

/**
 * Loads the saved default certificate background template.
 * @returns {Promise<Object|null>}
 */
export async function getDefaultCertificateTemplate() {
  const [template] = await base44.entities.CertificateTemplate.list('-created_date', 1);
  return template || null;
}

/**
 * Saves a certificate background as the default template (replaces existing).
 * @param {string} imageUrl - URL of the background image
 * @param {string} style - Style name
 * @param {string} adminEmail - Admin who saved it
 * @returns {Promise<Object>}
 */
export async function setDefaultCertificateTemplate(imageUrl, style = 'classic', adminEmail = '') {
  const existing = await base44.entities.CertificateTemplate.list('-created_date', 5);
  await Promise.all(existing.map((t) => base44.entities.CertificateTemplate.delete(t.id)));
  return base44.entities.CertificateTemplate.create({
    image_url: imageUrl,
    style,
    set_by: adminEmail || '',
  });
}

/**
 * Downloads an image from a URL as a file.
 * @param {string} url - Image URL
 * @param {string} filename - Output filename
 */
export async function downloadCertificateImage(url, filename) {
  const response = await fetch(url);
  const blob = await response.blob();
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}
