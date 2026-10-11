import { toBlob } from "html-to-image";
import { isPrivateImage, privateImageData } from "./portable-document";
import { documentFonts } from "./export-fonts";
import { dimensions, FONTS, saveFile, type Settings } from "./document";
export async function capture(editor: HTMLElement, s: Settings, pages: number) {
  await document.fonts.ready;
  await Promise.all(
    Array.from(editor.querySelectorAll<HTMLImageElement>("img:not(.ProseMirror-separator)")).map(async (img) => {
      try {
        await img.decode();
      } catch {
        throw new Error("이미지를 불러오지 못했습니다. 주소를 확인해주세요.");
      }
    }),
  );
  const box = document.createElement("div");
  const node = editor.cloneNode(true) as HTMLElement;
  await Promise.all(Array.from(node.querySelectorAll<HTMLImageElement>("img:not(.ProseMirror-separator)")).map(async img => {
    if (isPrivateImage(img.src)) { img.src = await privateImageData(img.src); img.crossOrigin = "anonymous"; await img.decode(); }
  }));
  node.querySelectorAll(".ProseMirror-separator").forEach(el => el.remove());
  const { width, height } = dimensions(s);
  const px = 96 / 25.4;
  const palette = getComputedStyle(document.documentElement);
  const ink = palette.getPropertyValue("--pui-color-ink-primary").trim(),
    paper = palette.getPropertyValue("--pui-color-bg-raised").trim();
  box.className = "capture-host";
  box.setAttribute("aria-hidden", "true");
  const pageCount =
    s.mode === "pages"
      ? Math.max(
          pages,
          Math.ceil((editor.scrollHeight + 24 - 0.5) / (height * px + 24)),
        )
      : 1;
  box.style.cssText = "position:fixed;left:-20000px;top:0;pointer-events:none";
  node.contentEditable = "false";
  node.classList.add("export-document");
  node.style.cssText = `width:${width * px}px;min-height:${s.mode === "pages" ? pageCount * height * px + (pageCount - 1) * 24 : 0}px;padding:${s.margin * px}px;box-sizing:border-box;font-family:${FONTS[s.font]};font-size:${s.sizePt}pt;line-height:${s.leading};color:${ink};background:${paper};--doc-margin:${s.margin * px}px;--page-content-height:${s.mode === "continuous" ? "none" : `${(height - 2 * s.margin) * px}px`};`;
  node
    .querySelectorAll(".ProseMirror-selectednode")
    .forEach((el) => el.classList.remove("ProseMirror-selectednode"));
  node
    .querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
    .forEach((input) => {
      if (input.checked) input.setAttribute("checked", "");
      else input.removeAttribute("checked");
    });
  box.append(node);
  document.body.append(box);
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return { node, pageCount, dispose: () => box.remove() };
}
export async function image(editor: HTMLElement, s: Settings, pages: number) {
  const { node, dispose } = await capture(editor, s, pages);
  try {
    if (node.scrollHeight > 28000)
      throw new Error("이미지로 내보내기에는 문서가 너무 깁니다. PDF를 사용해주세요.");
    const blob = await toBlob(node, {
      width: (dimensions(s).width * 96) / 25.4,
      height: node.scrollHeight,
      pixelRatio: Math.min(2, 16000 / node.scrollHeight),
      backgroundColor: getComputedStyle(node).backgroundColor,
      style: {
        position: "static",
        inset: "auto",
        margin: "0",
        transform: "none",
        zoom: "1",
      },
      fontEmbedCSS: await documentFonts(node),
    });
    if (!blob) throw new Error("이미지를 만들지 못했습니다.");
    return blob;
  } finally {
    dispose();
  }
}
export { saveFile };
