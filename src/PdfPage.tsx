import { useEffect, useRef, useState } from 'react';
import './pdf-page.css';

/** Render trusted PDF.js canvas/text output; never embed document scripts or links. */
export default function PdfPage({ file, pageNumber, onWord }: { file: Blob; pageNumber: number; onWord: (word: string) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [message, setMessage] = useState('Rendering original page…');
  useEffect(() => { const element = host.current; if (!element) return; const observer = new ResizeObserver(entries => setWidth(Math.max(240, Math.floor(entries[0].contentRect.width)))); observer.observe(element); return () => observer.disconnect(); }, []);
  useEffect(() => {
    const element = host.current; if (!element) return;
    let disposed = false; let cleanup: (() => void) | undefined;
    setMessage('Rendering original page…');
    void (async () => {
      const pdf = await import('pdfjs-dist'); const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
      if (disposed) return;
      pdf.GlobalWorkerOptions.workerSrc = worker.default;
      const loading = pdf.getDocument({ data: await file.arrayBuffer() });
      cleanup = () => { void loading.destroy(); };
      if (disposed) { cleanup(); return; }
      const doc = await loading.promise; const page = await doc.getPage(pageNumber);
      if (disposed) return;
      const unscaled = page.getViewport({ scale: 1 }); const scale = width / unscaled.width;
      const viewport = page.getViewport({ scale }); const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const container = document.createElement('div'); container.className = 'pdf-page'; container.style.width = `${viewport.width}px`; container.style.height = `${viewport.height}px`;
      container.style.setProperty('--total-scale-factor', String(scale)); container.style.setProperty('--scale-round-x', '1px'); container.style.setProperty('--scale-round-y', '1px');
      const canvas = document.createElement('canvas'); canvas.width = Math.ceil(viewport.width * ratio); canvas.height = Math.ceil(viewport.height * ratio); canvas.style.width = `${viewport.width}px`; canvas.style.height = `${viewport.height}px`; canvas.setAttribute('aria-label', `Original PDF page ${pageNumber}`); container.append(canvas);
      const textContainer = document.createElement('div'); textContainer.className = 'pdf-text-layer'; container.append(textContainer); element.replaceChildren(container);
      const render = page.render({ canvas, viewport, transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined });
      const textLayer = new pdf.TextLayer({ textContentSource: await page.getTextContent(), viewport, container: textContainer });
      cleanup = () => { render.cancel(); textLayer.cancel(); void loading.destroy(); container.remove(); };
      if (disposed) { cleanup(); return; }
      await Promise.all([render.promise, textLayer.render()]); if (!disposed) setMessage('Select one English word on the original page to look it up.');
    })().catch(error => { if (!disposed) setMessage(`Original page could not be rendered. Extracted text remains available. ${error instanceof Error ? error.message : ''}`); });
    return () => { disposed = true; cleanup?.(); };
  }, [file, pageNumber, width]);
  function lookupSelection() { const selection = window.getSelection(); if (!selection?.anchorNode || !host.current?.contains(selection.anchorNode)) return; const word = selection.toString().trim(); if (/^[A-Za-z]+(?:['’-][A-Za-z]+)*$/.test(word)) onWord(word.toLowerCase().replaceAll('’', "'")); }
  return <section className="original-pdf"><p className="muted" role="status">{message}</p><div ref={host} className="pdf-host" onMouseUp={lookupSelection} onTouchEnd={lookupSelection} /><button onClick={lookupSelection}>Look up selected word</button><p className="muted">Original layout above; accessible, marked reading text below.</p></section>;
}
