import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

/**
 * Downloads a data URL as a file (supports mobile browsers via hidden anchor and target blank fallback)
 */
function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.target = '_self';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Capture DOM element to PNG and trigger download
 */
export async function exportDocumentAsPng(
  element: HTMLElement,
  filename: string
): Promise<void> {
  try {
    // Wait for web fonts to be completely ready
    if (document.fonts) {
      await document.fonts.ready;
    }

    // Slight timeout for layout stabilization
    await new Promise((r) => setTimeout(r, 100));

    const dataUrl = await toPng(element, {
      pixelRatio: 2.5,
      cacheBust: true,
      backgroundColor: '#faf7ee',
      style: {
        transform: 'none',
        borderRadius: '0px',
      },
      filter: (node) => {
        // Exclude any controls or download buttons if inside
        if (node instanceof HTMLElement && node.dataset.noCapture === 'true') {
          return false;
        }
        return true;
      },
    });

    downloadDataUrl(dataUrl, filename.endsWith('.png') ? filename : `${filename}.png`);
  } catch (error) {
    console.error('PNG Export failed:', error);
    throw new Error('문서 이미지(PNG) 저장 중 오류가 발생했습니다. 브라우저 설정을 확인해 주세요.');
  }
}

/**
 * Capture DOM element, scale to A4 dimensions, and export as PDF
 */
export async function exportDocumentAsPdf(
  element: HTMLElement,
  filename: string
): Promise<void> {
  try {
    if (document.fonts) {
      await document.fonts.ready;
    }

    await new Promise((r) => setTimeout(r, 100));

    // High quality PNG capture
    const dataUrl = await toPng(element, {
      pixelRatio: 2.5,
      cacheBust: true,
      backgroundColor: '#faf7ee',
      style: {
        transform: 'none',
      },
      filter: (node) => {
        if (node instanceof HTMLElement && node.dataset.noCapture === 'true') {
          return false;
        }
        return true;
      },
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm

    // Add 10mm margin
    const margin = 10;
    const printableWidth = pageWidth - margin * 2;
    const printableHeight = pageHeight - margin * 2;

    const img = new Image();
    img.src = dataUrl;

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;
    const imgRatio = imgWidth / imgHeight;

    let targetWidth = printableWidth;
    let targetHeight = printableWidth / imgRatio;

    // If height exceeds printable height, constrain by height
    if (targetHeight > printableHeight) {
      targetHeight = printableHeight;
      targetWidth = printableHeight * imgRatio;
    }

    // Center on page
    const xPos = margin + (printableWidth - targetWidth) / 2;
    const yPos = margin + (printableHeight - targetHeight) / 2;

    pdf.addImage(dataUrl, 'PNG', xPos, yPos, targetWidth, targetHeight, undefined, 'FAST');
    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
  } catch (error) {
    console.error('PDF Export failed:', error);
    throw new Error('문서 PDF 변환 및 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
  }
}
