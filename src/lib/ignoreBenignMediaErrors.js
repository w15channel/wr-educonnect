export function installBenignMediaErrorGuard() {
  const isBenignMediaAbort = (reason) => {
    const message = reason?.message || String(reason || '');
    return reason?.name === 'AbortError' && message.includes('play() request was interrupted');
  };

  window.addEventListener('unhandledrejection', (event) => {
    if (isBenignMediaAbort(event.reason)) {
      event.preventDefault();
    }
  });

  // Garante que window.fetch tenha getter e setter configurados caso extensões tentem interceptar
  try {
    const currentDescriptor = Object.getOwnPropertyDescriptor(window, 'fetch');
    if (!currentDescriptor || (!currentDescriptor.writable && !currentDescriptor.set)) {
      let activeFetch = window.fetch;
      Object.defineProperty(window, 'fetch', {
        get() {
          return activeFetch;
        },
        set(fn) {
          activeFetch = fn;
        },
        configurable: true,
        enumerable: true
      });
    }
  } catch {
    // ignorar falha caso o ambiente restrinja estritamente
  }

  // Scripts de terceiros e extensões do navegador (Rumble, YouTube, extensões Chrome)
  const isOpaqueOrExtensionError = (message, source, error) => {
    const msg = String(message || error?.message || '');
    const src = String(source || error?.stack || error?.filename || '');
    if (!error && !source && (!message || String(message) === 'Script error.')) return true;
    return (
      src.includes('chrome-extension://') ||
      src.includes('moz-extension://') ||
      src.includes('requests.js') ||
      msg.includes('Cannot set property fetch') ||
      msg.includes('which has only a getter')
    );
  };

  window.addEventListener('unhandledrejection', (event) => {
    if (isBenignMediaAbort(event.reason)) {
      event.preventDefault();
      return;
    }
    const msg = String(event.reason?.message || event.reason || '');
    const stack = String(event.reason?.stack || '');
    if (
      stack.includes('chrome-extension://') ||
      msg.includes('Cannot set property fetch') ||
      msg.includes('which has only a getter')
    ) {
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    if (isOpaqueOrExtensionError(event.message, event.filename, event.error)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  // Alguns coletores usam window.onerror diretamente; filtramos antes de repassar.
  const previousOnError = window.onerror;
  window.onerror = function handleWindowError(message, source, line, column, error) {
    if (isOpaqueOrExtensionError(message, source, error)) return true;
    return previousOnError ? previousOnError.call(this, message, source, line, column, error) : false;
  };

  // Suprime logs de erro 404 do SDK Base44 gerados quando endpoints de plataforma não estão presentes
  if (typeof console !== 'undefined' && typeof console.error === 'function') {
    const originalConsoleError = console.error;
    console.error = function (...args) {
      if (
        args[0] === '[Base44 SDK Error]' &&
        (args[1]?.status === 404 || args[1]?.message?.includes('status code 404') || String(args[1]).includes('404'))
      ) {
        return;
      }
      return originalConsoleError.apply(console, args);
    };
  }
}