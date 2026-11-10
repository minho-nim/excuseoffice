import type { IssuedDocument } from '../types';

export type DocumentFileFormat = 'png' | 'pdf';
export type DocumentDownload = { url: string; filename: string; source: IssuedDocument };

async function captureDocument(element: HTMLElement): Promise<HTMLCanvasElement> {
  const { toCanvas } = await import('html-to-image');
  // The sheet uses text and CSS only. Export with local fonts instead of fetching
  // the full remote Korean font family and embedding it in the image.
  const canvas = await toCanvas(element, {
    pixelRatio: 2,
    skipFonts: true,
    backgroundColor: '#ffffff',
    style: { transform: 'none', boxShadow: 'none' },
    filter: (node) => !(node instanceof HTMLElement && node.dataset.noCapture === 'true'),
  });
  if (!canvas.width || !canvas.height) throw new Error('문서 크기를 읽지 못했어요.');
  return canvas;
}

async function renderDocumentBlob(element: HTMLElement, format: DocumentFileFormat): Promise<Blob> {
  const canvas = await captureDocument(element);
  if (format === 'png') {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob?.size) resolve(blob);
        else reject(new Error('이미지 파일을 만들지 못했어요.'));
      }, 'image/png');
    });
  }

  const { default: jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const scale = Math.min((pageWidth - 2 * margin) / canvas.width, (pageHeight - 2 * margin) / canvas.height);
  const width = canvas.width * scale;
  const height = canvas.height * scale;
  pdf.addImage(canvas, 'PNG', (pageWidth - width) / 2, margin, width, height, undefined, 'FAST');
  return pdf.output('blob');
}

async function createDocumentBlob(element: HTMLElement, format: DocumentFileFormat): Promise<Blob> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      renderDocumentBlob(element, format),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error('파일을 만드는 데 시간이 너무 오래 걸렸어요. 다시 눌러 주세요.')), 15_000);
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}

export async function prepareDocumentDownload(element: HTMLElement, source: IssuedDocument, format: DocumentFileFormat): Promise<DocumentDownload> {
  const blob = await createDocumentBlob(element, format);
  return { url: URL.createObjectURL(blob), filename: `핑계문서_${source.issueNumber}.${format}`, source };
}

export async function copyDocumentImage(element: HTMLElement): Promise<void> {
  if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write ||
      (typeof ClipboardItem.supports === 'function' && !ClipboardItem.supports('image/png'))) {
    throw new Error('이 브라우저에서는 이미지 복사를 지원하지 않아요. 이미지 저장을 이용해 주세요.');
  }

  const image = createDocumentBlob(element, 'png');
  // Keep the clipboard write inside the button gesture, even while the PNG is rendering.
  void image.catch(() => {});
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': image })]);
}

export function requestDocumentDownload(file: DocumentDownload): void {
  const link = document.createElement('a');
  link.href = file.url;
  link.download = file.filename;
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    link.remove();
  }
}
