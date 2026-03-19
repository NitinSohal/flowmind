import { toPng, toSvg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import type { Node } from '@xyflow/react';

interface ExportOptions {
  viewportElement: HTMLElement;
  nodes: Node[];
  filename?: string;
}

function getNodesBounds(nodes: Node[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const node of nodes) {
    const x = node.position.x;
    const y = node.position.y;
    const w = (node.measured?.width ?? node.width ?? 150) as number;
    const h = (node.measured?.height ?? node.height ?? 50) as number;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x + w > maxX) maxX = x + w;
    if (y + h > maxY) maxY = y + h;
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function getCaptureOptions(viewportElement: HTMLElement, nodes: Node[]) {
  const bounds = getNodesBounds(nodes);
  const padding = 50;
  const imageWidth = bounds.width + padding * 2;
  const imageHeight = bounds.height + padding * 2;

  return {
    width: imageWidth,
    height: imageHeight,
    style: {
      width: `${imageWidth}px`,
      height: `${imageHeight}px`,
      transform: `translate(${-bounds.x + padding}px, ${-bounds.y + padding}px) scale(1)`,
    },
    filter: (node: HTMLElement) => {
      // Exclude minimap, controls, and other overlays
      if (node.classList?.contains('react-flow__minimap')) return false;
      if (node.classList?.contains('react-flow__controls')) return false;
      if (node.classList?.contains('react-flow__panel')) return false;
      return true;
    },
  };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

async function generateSvgString(viewportElement: HTMLElement, nodes: Node[]): Promise<string> {
  const options = getCaptureOptions(viewportElement, nodes);
  const dataUrl = await toSvg(viewportElement, options);
  // Decode the data URL to raw SVG
  const svgString = decodeURIComponent(dataUrl.split(',')[1]);
  return svgString;
}

export async function exportToPng({ viewportElement, nodes, filename = 'flowchart' }: ExportOptions) {
  const options = getCaptureOptions(viewportElement, nodes);
  const dataUrl = await toPng(viewportElement, {
    ...options,
    pixelRatio: 2,
    backgroundColor: '#ffffff',
  });
  downloadDataUrl(dataUrl, `${filename}.png`);
}

export async function exportToSvg({ viewportElement, nodes, filename = 'flowchart' }: ExportOptions) {
  const svgString = await generateSvgString(viewportElement, nodes);
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  downloadBlob(blob, `${filename}.svg`);
}

export async function exportToPdf({ viewportElement, nodes, filename = 'flowchart' }: ExportOptions) {
  const options = getCaptureOptions(viewportElement, nodes);
  const dataUrl = await toPng(viewportElement, {
    ...options,
    pixelRatio: 2,
    backgroundColor: '#ffffff',
  });

  const bounds = getNodesBounds(nodes);
  const padding = 50;
  const imgWidth = bounds.width + padding * 2;
  const imgHeight = bounds.height + padding * 2;

  // Use landscape or portrait depending on aspect ratio
  const orientation = imgWidth > imgHeight ? 'landscape' : 'portrait';
  const pdf = new jsPDF({ orientation, unit: 'pt', format: 'a4' });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const pageMargin = 40;

  const availableWidth = pageWidth - pageMargin * 2;
  const availableHeight = pageHeight - pageMargin * 2;
  const scale = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);

  const scaledWidth = imgWidth * scale;
  const scaledHeight = imgHeight * scale;
  const offsetX = (pageWidth - scaledWidth) / 2;
  const offsetY = (pageHeight - scaledHeight) / 2;

  pdf.addImage(dataUrl, 'PNG', offsetX, offsetY, scaledWidth, scaledHeight);
  pdf.save(`${filename}.pdf`);
}

export async function exportToVsdx({ viewportElement, nodes, filename = 'flowchart' }: ExportOptions) {
  const svgString = await generateSvgString(viewportElement, nodes);

  const zip = new JSZip();

  // [Content_Types].xml
  zip.file('[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/visio/document.xml" ContentType="application/vnd.ms-visio.drawing.main+xml"/>' +
    '<Override PartName="/visio/pages/pages.xml" ContentType="application/vnd.ms-visio.pages+xml"/>' +
    '<Override PartName="/visio/pages/page1.xml" ContentType="application/vnd.ms-visio.page+xml"/>' +
    '</Types>'
  );

  // _rels/.rels
  zip.folder('_rels')!.file('.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.microsoft.com/visio/2010/relationships/document" Target="visio/document.xml"/>' +
    '</Relationships>'
  );

  // visio/document.xml
  const visioFolder = zip.folder('visio')!;
  visioFolder.file('document.xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<VisioDocument xmlns="http://schemas.microsoft.com/office/visio/2012/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    '<DocumentProperties/>' +
    '</VisioDocument>'
  );

  // visio/_rels/document.xml.rels
  visioFolder.folder('_rels')!.file('document.xml.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.microsoft.com/visio/2010/relationships/pages" Target="pages/pages.xml"/>' +
    '</Relationships>'
  );

  // visio/pages/pages.xml
  const pagesFolder = visioFolder.folder('pages')!;
  pagesFolder.file('pages.xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Pages xmlns="http://schemas.microsoft.com/office/visio/2012/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    '<Page ID="0" Name="Page-1" NameU="Page-1"><Rel r:id="rId1"/></Page>' +
    '</Pages>'
  );

  // visio/pages/_rels/pages.xml.rels
  pagesFolder.folder('_rels')!.file('pages.xml.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.microsoft.com/visio/2010/relationships/page" Target="page1.xml"/>' +
    '</Relationships>'
  );

  // visio/pages/page1.xml with embedded SVG as ForeignData
  const escapedSvg = svgString.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  pagesFolder.file('page1.xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<PageContents xmlns="http://schemas.microsoft.com/office/visio/2012/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    '<Shapes>' +
    '<Shape ID="1" Type="Foreign" NameU="FlowchartExport">' +
    '<ForeignData ForeignType="Svg">' +
    '<Rel r:id="rId1"/>' +
    '<Text>' + escapedSvg + '</Text>' +
    '</ForeignData>' +
    '</Shape>' +
    '</Shapes>' +
    '</PageContents>'
  );

  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.ms-visio.drawing.main+xml' });
  downloadBlob(blob, `${filename}.vsdx`);
}
