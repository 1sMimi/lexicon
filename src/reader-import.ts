export interface ImportedChapter { title: string; text: string }
export function tokens(text: string): string[] { return text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) ?? [] }
export function vocabulary(text: string): [string, number][] {
  const counts = new Map<string, number>();
  tokens(text).forEach(word => { const id = word.toLowerCase().replaceAll('’', "'"); counts.set(id, (counts.get(id) ?? 0) + 1) });
  return [...counts].sort((a, b) => b[1] - a[1]);
}
function validateZipExpansion(buffer: ArrayBuffer) {
  const view = new DataView(buffer); let total = 0;
  for(let offset=0;offset+46<=view.byteLength;offset++) {
    if(view.getUint32(offset,true)!==0x02014b50)continue;
    const size=view.getUint32(offset+24,true); total+=size;
    if(size===0xffffffff||total>80*1024*1024)throw new Error('Archive expands beyond the 80 MB safety limit.');
    offset+=45+view.getUint16(offset+28,true)+view.getUint16(offset+30,true)+view.getUint16(offset+32,true);
  }
}
export async function parseDocument(file: File): Promise<ImportedChapter[]> {
  if (file.size > 40 * 1024 * 1024) throw new Error('Please import a file smaller than 40 MB.');
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (['txt', 'md', 'markdown'].includes(ext ?? '')) return [{ title: file.name, text: await file.text() }];
  if (ext === 'docx') {
    const buffer = await file.arrayBuffer(); validateZipExpansion(buffer);
    const { default: mammoth } = await import('mammoth/mammoth.browser.js');
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return [{ title: file.name, text: result.value }];
  }
  if (ext === 'pdf') {
    const pdf = await import('pdfjs-dist');
    const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    pdf.GlobalWorkerOptions.workerSrc = worker.default;
    const loadingTask = pdf.getDocument({ data: await file.arrayBuffer() });
    const document = await loadingTask.promise;
    const chapters: ImportedChapter[] = [];
    for (let i = 1; i <= document.numPages; i++) {
      const page = await document.getPage(i); const content = await page.getTextContent();
      chapters.push({ title: `Page ${i}`, text: content.items.map(item => 'str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : '').join('') });
    }
    await loadingTask.destroy();
    if (!chapters.some(chapter => chapter.text.trim())) throw new Error('This PDF has no readable text layer. OCR is not supported.');
    return chapters;
  }
  if (ext === 'epub') {
    const { default: JSZip } = await import('jszip');
    const buffer=await file.arrayBuffer(); validateZipExpansion(buffer);
    const zip = await JSZip.loadAsync(buffer);
    const container = await zip.file('META-INF/container.xml')?.async('string');
    if (!container) throw new Error('Invalid EPUB container. DRM books are not supported.');
    const parser = new DOMParser();
    const packagePath = parser.parseFromString(container, 'application/xml').getElementsByTagName('rootfile')[0]?.getAttribute('full-path');
    const packageText = packagePath ? await zip.file(packagePath)?.async('string') : undefined;
    if (!packageText || !packagePath) throw new Error('EPUB package is missing.');
    const packageDoc = parser.parseFromString(packageText, 'application/xml');
    const manifest = new Map(Array.from(packageDoc.getElementsByTagName('item')).map(item => [item.getAttribute('id'), item.getAttribute('href')]));
    const base = packagePath.slice(0, packagePath.lastIndexOf('/') + 1);
    const chapters: ImportedChapter[] = []; let total = 0;
    for (const item of Array.from(packageDoc.getElementsByTagName('itemref'))) {
      const href = manifest.get(item.getAttribute('idref')); if (!href) continue;
      const resolved = new URL(href, `https://epub.local/${base}`).pathname.slice(1);
      const html = await zip.file(decodeURIComponent(resolved))?.async('string'); if (!html) continue;
      total += html.length; if (total > 20_000_000) throw new Error('EPUB text exceeds the 20 MB safety limit.');
      // Parse XML without executing scripts or loading external resources; render text only.
      const doc = parser.parseFromString(html, 'application/xhtml+xml');
      doc.querySelectorAll('script,style').forEach(node => node.remove());
      const text = doc.querySelector('body')?.textContent?.trim() ?? '';
      if (text) chapters.push({ title: doc.querySelector('h1,h2,title')?.textContent?.trim() || `Chapter ${chapters.length + 1}`, text });
    }
    if (!chapters.length) throw new Error('No readable chapters found.'); return chapters;
  }
  throw new Error('Supported files: TXT, Markdown, DOCX, text PDF and DRM-free EPUB.');
}
