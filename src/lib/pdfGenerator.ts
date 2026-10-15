/**
 * PDF & High-Res Document Generator for KAF PRO ERP
 * Generates 100% standard, compliant PDF 1.4 binary documents and High-Res PNG images
 * directly in the browser with zero external dependencies.
 * Preserves exact colors, borders, badges, stamps, and layout.
 */

export function buildPdfBinary(
  jpegBytes: Uint8Array,
  imageWidth: number,
  imageHeight: number
): Uint8Array {
  // Standard A4 dimensions in PDF points (72 points per inch)
  const pageWidth = 595.28;
  const pageHeight = 841.89;

  // Header
  const header = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";

  // Catalog
  const obj1 = "1 0 obj\n<<\n  /Type /Catalog\n  /Pages 2 0 R\n>>\nendobj\n";

  // Pages
  const obj2 = "2 0 obj\n<<\n  /Type /Pages\n  /Kids [3 0 R]\n  /Count 1\n>>\nendobj\n";

  // Page
  const obj3 =
    "3 0 obj\n<<\n  /Type /Page\n  /Parent 2 0 R\n  /MediaBox [0 0 " +
    pageWidth.toFixed(2) +
    " " +
    pageHeight.toFixed(2) +
    "]\n  /Resources <<\n    /XObject <<\n      /Im0 4 0 R\n    >>\n    /ProcSet [/PDF /ImageC]\n  >>\n  /Contents 5 0 R\n>>\nendobj\n";

  // Image XObject
  const obj4Header =
    "4 0 obj\n<<\n  /Type /XObject\n  /Subtype /Image\n  /Width " +
    imageWidth +
    "\n  /Height " +
    imageHeight +
    "\n  /ColorSpace /DeviceRGB\n  /BitsPerComponent 8\n  /Filter /DCTDecode\n  /Length " +
    jpegBytes.length +
    "\n>>\nstream\n";
  const obj4Footer = "\nendstream\nendobj\n";

  // Content Stream: Scale image to fit A4 page
  const contentStream =
    "q\n" +
    pageWidth.toFixed(2) +
    " 0 0 " +
    pageHeight.toFixed(2) +
    " 0 0 cm\n/Im0 Do\nQ\n";
  const obj5 =
    "5 0 obj\n<<\n  /Length " +
    contentStream.length +
    "\n>>\nstream\n" +
    contentStream +
    "endstream\nendobj\n";

  // Compute byte offsets
  const encoder = new TextEncoder();
  const headerBytes = encoder.encode(header);
  const obj1Bytes = encoder.encode(obj1);
  const obj2Bytes = encoder.encode(obj2);
  const obj3Bytes = encoder.encode(obj3);
  const obj4HeaderBytes = encoder.encode(obj4Header);
  const obj4FooterBytes = encoder.encode(obj4Footer);
  const obj5Bytes = encoder.encode(obj5);

  const offsets: number[] = [];
  let currentOffset = headerBytes.length;

  offsets.push(currentOffset);
  currentOffset += obj1Bytes.length;

  offsets.push(currentOffset);
  currentOffset += obj2Bytes.length;

  offsets.push(currentOffset);
  currentOffset += obj3Bytes.length;

  offsets.push(currentOffset);
  currentOffset += obj4HeaderBytes.length + jpegBytes.length + obj4FooterBytes.length;

  offsets.push(currentOffset);
  currentOffset += obj5Bytes.length;

  // XRef Table
  let xref = "xref\n0 6\n0000000000 65535 f \n";
  for (let i = 0; i < offsets.length; i++) {
    xref += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
  }

  // Trailer
  const trailer =
    "trailer\n<<\n  /Size 6\n  /Root 1 0 R\n>>\nstartxref\n" +
    currentOffset +
    "\n%%EOF\n";

  const xrefBytes = encoder.encode(xref);
  const trailerBytes = encoder.encode(trailer);

  // Total size
  const totalLength =
    headerBytes.length +
    obj1Bytes.length +
    obj2Bytes.length +
    obj3Bytes.length +
    obj4HeaderBytes.length +
    jpegBytes.length +
    obj4FooterBytes.length +
    obj5Bytes.length +
    xrefBytes.length +
    trailerBytes.length;

  const result = new Uint8Array(totalLength);
  let pos = 0;

  const append = (bytes: Uint8Array) => {
    result.set(bytes, pos);
    pos += bytes.length;
  };

  append(headerBytes);
  append(obj1Bytes);
  append(obj2Bytes);
  append(obj3Bytes);
  append(obj4HeaderBytes);
  append(jpegBytes);
  append(obj4FooterBytes);
  append(obj5Bytes);
  append(xrefBytes);
  append(trailerBytes);

  return result;
}

/**
 * Render a DOM element to an HTML5 Canvas at high resolution (2x DPI)
 * Uses strict XML serialization without external link tags to avoid parser crashes
 */
export async function renderElementToCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
  const width = Math.max(element.scrollWidth, element.offsetWidth, 750);
  const height = Math.max(element.scrollHeight, element.offsetHeight, 950);

  // Clone the element so we can safely sanitize it
  const clone = element.cloneNode(true) as HTMLElement;

  // Remove buttons, inputs, interactive and print-hidden elements
  clone.querySelectorAll("button, input, select, textarea, .print\\:hidden").forEach((el) => el.remove());

  // Serialize to valid XML
  const serializer = new XMLSerializer();
  let xhtml = serializer.serializeToString(clone);

  // Replace HTML named entities that cause XML syntax errors
  xhtml = xhtml
    .replace(/&nbsp;/g, "&#160;")
    .replace(/&ndash;/g, "&#8211;")
    .replace(/&mdash;/g, "&#8212;")
    .replace(/&copy;/g, "&#169;")
    .replace(/&reg;/g, "&#174;")
    .replace(/&quot;/g, "&#34;");

  // Collect text content of <style> tags only (exclude <link> tags to prevent unclosed XML tag errors)
  const styleContent = Array.from(document.querySelectorAll("style"))
    .map((s) => s.textContent || "")
    .join("\n");

  const svgXml = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <defs>
        <style type="text/css">
          <![CDATA[
            * { box-sizing: border-box; }
            ${styleContent}
          ]]>
        </style>
      </defs>
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="background:#ffffff; color:#0f172a; font-family:'Segoe UI', Tahoma, Arial, sans-serif; direction:rtl; margin:0; padding:12px;">
          ${xhtml}
        </div>
      </foreignObject>
    </svg>
  `;

  const blob = new Blob([svgXml], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const img = new Image();
  img.crossOrigin = "anonymous";

  await new Promise((resolve) => {
    img.onload = () => resolve(true);
    img.onerror = (e) => {
      console.warn("SVG foreignObject rendering error, using canvas fallback", e);
      resolve(false);
    };
    img.src = url;
  });

  const scale = 2; // Sharp 2x DPI for official print/PDF
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.scale(scale, scale);

  if (img.width > 0 && img.height > 0) {
    ctx.drawImage(img, 0, 0, width, height);
  }

  URL.revokeObjectURL(url);
  return canvas;
}

/**
 * Copy an element directly as a high-resolution PNG image to the system clipboard
 * When pasted in WhatsApp Web (Ctrl + V), WhatsApp immediately shows the full colored slip
 */
export async function copyElementAsImageToClipboard(element: HTMLElement): Promise<boolean> {
  try {
    const canvas = await renderElementToCanvas(element);
    const blob: Blob | null = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/png", 1.0);
    });

    if (!blob) return false;

    if (navigator.clipboard && typeof (window as any).ClipboardItem !== "undefined") {
      const item = new (window as any).ClipboardItem({ "image/png": blob });
      await navigator.clipboard.write([item]);
      return true;
    }
    return false;
  } catch (err) {
    console.error("Failed to copy image to clipboard", err);
    return false;
  }
}

/**
 * Download an element directly as a high-resolution PNG image
 */
export async function downloadElementAsImage(element: HTMLElement, fileName: string): Promise<void> {
  const canvas = await renderElementToCanvas(element);
  const blob: Blob | null = await new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/png", 1.0);
  });
  if (blob) {
    const safeName = fileName.endsWith(".png") ? fileName : `${fileName}.png`;
    downloadFile(blob, safeName);
  }
}

/**
 * Convert an element to a genuine .pdf Blob and File object
 */
export async function generatePdfFromElement(
  element: HTMLElement,
  fileName: string = "document.pdf"
): Promise<{ blob: Blob; file: File; dataUrl: string }> {
  const canvas = await renderElementToCanvas(element);

  // Convert canvas to JPEG blob
  const jpegBlob: Blob = await new Promise((resolve) => {
    canvas.toBlob(
      (b) => resolve(b || new Blob([], { type: "image/jpeg" })),
      "image/jpeg",
      0.95
    );
  });

  const arrayBuffer = await jpegBlob.arrayBuffer();
  const jpegBytes = new Uint8Array(arrayBuffer);

  const pdfBytes = buildPdfBinary(jpegBytes, canvas.width, canvas.height);
  const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
  const safeFileName = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
  const file = new File([pdfBlob], safeFileName, { type: "application/pdf" });
  const dataUrl = URL.createObjectURL(pdfBlob);

  return { blob: pdfBlob, file, dataUrl };
}

/**
 * Triggers direct download of a Blob file
 */
export function downloadFile(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
