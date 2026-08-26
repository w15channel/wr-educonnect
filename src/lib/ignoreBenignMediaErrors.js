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
  window.addEventListener('error', (event) => {
    const isOpaqueCrossOriginError =
      !event.error && (!event.message || event.message === 'Script error.') && !event.filename;
    if (isOpaqueCrossOriginError) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
}