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

  // Scripts de terceiros (Rumble, YouTube, Vimeo) rodam em outra origem, então
  // o navegador entrega apenas "Script error." sem nenhum detalhe. Esse ruído
  // não é do app e não deve virar erro visível para o aluno.
  const isOpaque = (message, source, error) =>
    !error && !source && (!message || String(message) === 'Script error.');

  window.addEventListener('error', (event) => {
    if (isOpaque(event.message, event.filename, event.error)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  // Alguns coletores usam window.onerror diretamente; filtramos antes de repassar.
  const previousOnError = window.onerror;
  window.onerror = function handleWindowError(message, source, line, column, error) {
    if (isOpaque(message, source, error)) return true;
    return previousOnError ? previousOnError.call(this, message, source, line, column, error) : false;
  };
}