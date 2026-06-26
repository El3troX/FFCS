// ─── Export Service ───
// PNG, PDF, CSV export and bulk ZIP download via File System Access API or fallback

import type { Timetable } from '../types';
import { generateReport, generateCSV } from './reportGenerator';

export async function exportPNG(element: HTMLElement): Promise<Blob> {
  const htmlToImage = await import('html-to-image');
  const blob = await htmlToImage.toBlob(element, {
    backgroundColor: '#0f172a', // Use dark slate matching the theme background
    pixelRatio: 2,
    width: element.clientWidth + 40,
    height: element.clientHeight + 40,
    style: {
      padding: '20px',
      margin: '0',
    },
  });
  
  if (!blob) throw new Error('Failed to create PNG blob');
  return blob;
}

export async function exportPDF(element: HTMLElement, timetable: Timetable): Promise<Blob> {
  const [htmlToImageModule, jsPDFModule, autoTableModule] = await Promise.all([
    import('html-to-image'),
    import('jspdf'),
    import('jspdf-autotable')
  ]);

  const htmlToImage = htmlToImageModule;
  const { jsPDF } = jsPDFModule;
  const autoTable = autoTableModule.default;

  const imgWidth = element.clientWidth + 40;
  const imgHeight = element.clientHeight + 40;

  if (imgWidth <= 40 || imgHeight <= 40) {
    throw new Error('Element dimensions are zero. Cannot generate PDF.');
  }

  // Use toPng to get a base64 string for jsPDF
  const imgData = await htmlToImage.toPng(element, {
    backgroundColor: '#0f172a', // Dark theme background
    pixelRatio: 2,
    width: imgWidth,
    height: imgHeight,
    style: {
      padding: '20px',
      margin: '0',
    },
  });

  // Use landscape orientation for timetables
  const isLandscape = imgWidth > imgHeight;
  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'px',
    format: [imgWidth, imgHeight],
  });

  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

  // --- Section 2: Report ---
  pdf.addPage('a4', 'portrait');

  pdf.setFontSize(16);
  pdf.text("Timetable Report", 14, 20);

  pdf.setFontSize(10);
  pdf.text(`Total Credits: ${timetable.totalCredits} | Free Days: ${timetable.freeDays.length > 0 ? timetable.freeDays.join(', ') : 'None'}`, 14, 28);

  const tableData = timetable.choices.map(c => [
    c.subjectName,
    c.option.slot,
    c.option.faculty,
    c.option.venue
  ]);

  autoTable(pdf, {
    startY: 35,
    head: [['Subject', 'Slot', 'Teacher', 'Venue']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] }, // brand-500
    styles: { fontSize: 10, cellPadding: 5 }
  });

  return pdf.output('blob');
}

/**
 * Export a timetable as a CSV string.
 */
export function exportCSV(timetable: Timetable): string {
  const rows = generateReport(timetable);
  return generateCSV(rows);
}

/**
 * Pad a number to 3 digits (e.g. 1 → "001").
 */
function zeroPad(n: number, width = 3): string {
  return String(n).padStart(width, '0');
}

/**
 * Trigger a browser download for a Blob.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export type TimetableExportBundle = {
  timetable: Timetable;
  pngBlob: Blob;
  pdfBlob: Blob;
  csvContent: string;
};

/**
 * Save all timetables as a ZIP file.
 * Folder structure: Saved Timetables/Timetable_001/{timetable.pdf, timetable.png}
 *
 * Tries the File System Access API first for a directory picker,
 * falls back to downloading a ZIP file.
 */
export async function saveAllTimetables(
  bundles: TimetableExportBundle[],
  startNumber = 1
): Promise<void> {
  // Try File System Access API first
  if (await trySaveWithFileSystemAccess(bundles, startNumber)) {
    return;
  }

  // Fallback: build a ZIP and download it
  await saveAsZip(bundles, startNumber);
}

/**
 * Attempt to save using the File System Access API (showDirectoryPicker).
 * Returns true if successful, false if the API is unavailable or user cancelled.
 */
async function trySaveWithFileSystemAccess(
  bundles: TimetableExportBundle[],
  startNumber: number
): Promise<boolean> {
  // Check if the API is available
  if (!('showDirectoryPicker' in window)) return false;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dirHandle = await (window as any).showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'downloads',
    }) as FileSystemDirectoryHandle;

    const rootDir = await dirHandle.getDirectoryHandle('Saved Timetables', { create: true });

    for (let i = 0; i < bundles.length; i++) {
      const bundle = bundles[i]!;
      const num = startNumber + i;
      const folderName = `Timetable_${zeroPad(num)}`;
      const folder = await rootDir.getDirectoryHandle(folderName, { create: true });

      // Write PNG
      const pngFile = await folder.getFileHandle('timetable.png', { create: true });
      const pngWritable = await pngFile.createWritable();
      await pngWritable.write(bundle.pngBlob);
      await pngWritable.close();

      // Write PDF
      const pdfFile = await folder.getFileHandle('timetable.pdf', { create: true });
      const pdfWritable = await pdfFile.createWritable();
      await pdfWritable.write(bundle.pdfBlob);
      await pdfWritable.close();
    }

    return true;
  } catch (err) {
    // User cancelled or API error
    if (err instanceof DOMException && err.name === 'AbortError') {
      return false; // User cancelled
    }
    console.warn('File System Access API failed, falling back to ZIP:', err);
    return false;
  }
}

/**
 * Build and download a ZIP file containing all timetable exports.
 */
async function saveAsZip(
  bundles: TimetableExportBundle[],
  startNumber: number
): Promise<void> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  const rootFolder = zip.folder('Saved Timetables')!;

  for (let i = 0; i < bundles.length; i++) {
    const bundle = bundles[i]!;
    const num = startNumber + i;
    const folderName = `Timetable_${zeroPad(num)}`;
    const folder = rootFolder.folder(folderName)!;

    folder.file('timetable.png', bundle.pngBlob);
    folder.file('timetable.pdf', bundle.pdfBlob);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(zipBlob, 'Saved_Timetables.zip');
}
