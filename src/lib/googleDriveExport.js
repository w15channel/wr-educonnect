/**
 * googleDriveExport.js
 * Utilitários para download local de pacotes de fontes, deep-links para o Google NotebookLM
 * e exportação para o Google Drive / Docs na conta Google escolhida pelo usuário.
 */

/**
 * Realiza o download imediato de um arquivo formatado para o computador do usuário
 */
export function downloadNotebookPackage(filename, content, mimeType = 'text/markdown;charset=utf-8') {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Abre o Google NotebookLM oficial no navegador, permitindo ao usuário
 * selecionar ou alternar para a conta Google desejada no topo direito da tela da Google.
 */
export function openNotebookLmOfficial() {
  if (typeof window === 'undefined') return;
  window.open('https://notebooklm.google.com/', '_blank', 'noopener,noreferrer');
}

/**
 * Abre o Google Docs oficial em uma nova aba (docs.new) para criação rápida
 * sob a conta Google conectada no navegador.
 */
export function openGoogleDocsNew() {
  if (typeof window === 'undefined') return;
  window.open('https://docs.new', '_blank', 'noopener,noreferrer');
}

/**
 * Copia texto para a área de transferência com suporte a fallback
 */
export async function copyContentToClipboard(text) {
  if (typeof window === 'undefined') return false;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('Erro ao usar clipboard API, tentando fallback execCommand', err);
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    textarea.style.top = '-999999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    return successful;
  } catch (err) {
    console.error('Falha ao copiar para o clipboard', err);
    return false;
  }
}
