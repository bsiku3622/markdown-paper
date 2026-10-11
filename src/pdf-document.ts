import { capture } from './export-document';
import { dimensions, type Settings } from './document';
import { API } from './cloud';

// Measure the actual editor, after all font faces and images are ready.
// Print keeps these line/page positions instead of running a second paginator.
export async function settleDocument(node: HTMLElement) {
  const fonts = new Map<string, string>();
  for (const el of [node, ...node.querySelectorAll<HTMLElement>('h1,h2,h3,strong,em,[style],.katex *')]) {
    const css = getComputedStyle(el);
    fonts.set(`${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`, el.textContent || '한글 ABC');
  }
  await Promise.all([...fonts].map(([font, text]) => document.fonts.load(font, text)));
  await document.fonts.ready;
  await Promise.all([...node.querySelectorAll<HTMLImageElement>('img:not(.ProseMirror-separator)')].map(img => img.decode()));
  let previous = '', stable = 0;
  for (let frame = 0; frame < 180; frame++) {
    await new Promise(resolve => requestAnimationFrame(resolve));
    const signature = `${node.scrollHeight}:${[...node.querySelectorAll('[data-page-spacer]')].map(el => el.getAttribute('data-page-spacer')).join(',')}`;
    stable = signature === previous ? stable + 1 : 0;
    previous = signature;
    if (stable >= 6) return;
  }
  throw new Error('페이지 배치가 안정되지 않았습니다. 다시 시도해주세요.');
}

export async function preparePdf(editor: HTMLElement, s: Settings, pages: number) {
  await settleDocument(editor);
  const { node, dispose: disposeCapture, pageCount } = await capture(editor, s, pages);
  const { width, height } = dimensions(s), px = 96 / 25.4;
  const pageHeight = s.mode === 'pages' ? height : node.scrollHeight / px;
  if (pageHeight > 5000) { disposeCapture(); throw new Error('무한 높이 PDF는 최대 5m까지 지원합니다. 페이지 분할을 선택해주세요.'); }
  const output = document.createElement('div');
  output.className = 'pdf-output';
  const style = document.createElement('style');
  style.textContent = `@page { size: ${width}mm ${pageHeight}mm; margin: 0; }
    @media print {
      html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
      body > :not(.pdf-output) { display: none !important; }
      .pdf-output { display: block !important; }
    }`;
  const count = s.mode === 'pages' ? pageCount : 1;
  for (let i = 0; i < count; i++) {
    const page = document.createElement('section');
    page.className = 'pdf-page';
    page.style.cssText = `width:${width * px}px;height:${pageHeight * px}px;background:${getComputedStyle(node).backgroundColor};`;
    const content = node.cloneNode(true) as HTMLElement;
    content.style.position = 'absolute';
    content.style.left = '0';
    content.style.top = `${-i * (height * px + 24)}px`;
    content.style.margin = '0';
    content.style.transform = 'none';
    content.style.zoom = '1';
    page.append(content);
    if (s.mode === 'pages') {
      const number = document.createElement('span');
      number.className = 'page-number';
      number.textContent = String(i + 1);
      page.append(number);
    }
    output.append(page);
  }
  disposeCapture();
  document.head.append(style);
  document.body.append(output);
  return { pages: count, width, height: pageHeight, output, dispose: () => { output.remove(); style.remove(); } };
}

export async function pdf(editor: HTMLElement, s: Settings, pages: number, name: string) {
  const print = await preparePdf(editor, s, pages);
  try {
    const images = new Map<string, Promise<string>>();
    for (const img of print.output.querySelectorAll<HTMLImageElement>('img')) {
      if (img.src.startsWith('data:image/')) continue;
      if (!images.has(img.src)) images.set(img.src, fetch(img.src, { credentials: 'omit', signal: AbortSignal.timeout(20_000) }).then(async response => {
        if (!response.ok) throw new Error('PDF에 넣을 이미지를 불러오지 못했습니다.');
        const blob = await response.blob();
        return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.onerror = reject; reader.readAsDataURL(blob); });
      }));
      img.src = await images.get(img.src)!;
      img.removeAttribute('crossorigin');
    }
    const response = await fetch(`${API}/exports/pdf`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html: print.output.innerHTML, title: name, width: print.width, height: print.height, pages: print.pages }), signal: AbortSignal.timeout(60_000) });
    if (!response.ok) { const result = await response.json(); throw new Error(result.error || 'PDF를 만들지 못했습니다.'); }
    const blob = await response.blob();
    const { saveFile } = await import('./document');
    saveFile(blob, `${name}.pdf`);
  } finally { print.dispose(); }
}
