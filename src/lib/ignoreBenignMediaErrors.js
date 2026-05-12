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
}