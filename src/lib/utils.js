import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
} 


export const isIframe = window.self !== window.top;

/**
 * Converts plain text with markdown-style links and bare URLs into safe HTML.
 * Supports: [label](url), https://example.com, and relative paths like /termos
 */
export function linkifyText(text) {
  if (!text) return '';
  // Escape HTML entities first
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  // Convert markdown-style links: [label](url)
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_, label, url) => {
      const isExternal = /^https?:\/\//.test(url);
      const safeUrl = url.replace(/"/g, '&quot;');
      return `<a href="${safeUrl}"${isExternal ? ' target="_blank" rel="noopener noreferrer"' : ''} class="text-primary hover:underline font-medium">${label}</a>`;
    }
  );
  // Convert bare URLs (http/https)
  html = html.replace(
    /(^|\s)(https?:\/\/[^\s<]+)/g,
    (_, space, url) => `${space}<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline font-medium">${url}</a>`
  );
  // Convert line breaks
  html = html.replace(/\n/g, '<br/>');
  return html;
}