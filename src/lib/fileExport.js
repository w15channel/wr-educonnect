function isMobileDevice() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '') || (navigator.maxTouchPoints > 1 && /Macintosh/i.test(navigator.userAgent || ''));
}

function openBlobInNewTab(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export async function saveBlobWithPicker(blob, fileName, mimeType) {
  const file = new File([blob], fileName, { type: mimeType });

  if (isMobileDevice() && navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title: fileName, files: [file] });
    return;
  }

  if (!isMobileDevice() && window.showSaveFilePicker) {
    const ext = fileName.includes('.') ? `.${fileName.split('.').pop()}` : '';
    const handle = await window.showSaveFilePicker({
      suggestedName: fileName,
      types: [{ description: mimeType, accept: { [mimeType]: [ext] } }],
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return;
  }

  openBlobInNewTab(blob, fileName);
}

export async function shareBlob(blob, fileName, mimeType, title = 'Compartilhar arquivo') {
  const file = new File([blob], fileName, { type: mimeType });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title, files: [file] });
    return true;
  }
  openBlobInNewTab(blob, fileName);
  return true;
}