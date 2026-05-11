export async function saveBlobWithPicker(blob, fileName, mimeType) {
  if (window.showSaveFilePicker) {
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

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export async function shareBlob(blob, fileName, mimeType, title = 'Compartilhar arquivo') {
  const file = new File([blob], fileName, { type: mimeType });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title, files: [file] });
    return true;
  }
  return false;
}
