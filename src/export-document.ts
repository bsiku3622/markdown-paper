import { toCanvas, toBlob } from "html-to-image";
import { isPrivateImage, privateImageData } from "./portable-document";
import { documentFonts } from "./export-fonts";
import { dimensions, FONTS, saveFile, type Settings } from "./document";
export async function capture(editor: HTMLElement, s: Settings, pages: number) {
  await document.fonts.ready;
  await Promise.all(
    Array.from(editor.querySelectorAll("img")).map(async (img) => {
      try {
        await img.decode();
      } catch {
        throw new Error("이미지를 불러오지 못했습니다. 주소를 확인해주세요.");
      }
    }),
  );
  const box = document.createElement("div");
  const node = editor.cloneNode(true) as HTMLElement;
  await Promise.all(Array.from(node.querySelectorAll("img")).map(async img => {
    if (isPrivateImage(img.src)) { img.src = await privateImageData(img.src); img.crossOrigin = "anonymous"; await img.decode(); }
  }));
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
  if (node.scrollHeight > 28000) {
    box.remove();
    throw new Error("문서가 너무 깁니다. 나누어 내보내주세요.");
  }
  return { node, pageCount, dispose: () => box.remove() };
}
export async function image(editor: HTMLElement, s: Settings, pages: number) {
  const { node, dispose } = await capture(editor, s, pages);
  try {
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
export async function pdf(
  editor: HTMLElement,
  s: Settings,
  pages: number,
  name: string,
) {
  const { node, dispose, pageCount } = await capture(editor, s, pages);
  try {
    const ratio = Math.min(2, 16000 / node.scrollHeight);
    const canvas = await toCanvas(node, {
      width: (dimensions(s).width * 96) / 25.4,
      height: node.scrollHeight,
      pixelRatio: ratio,
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
    const { jsPDF } = await import("jspdf");
    const { width, height } = dimensions(s);
    const pageHeight =
      s.mode === "pages" ? height : (canvas.height / canvas.width) * width;
    if (pageHeight > 5000)
      throw new Error(
        "무한 높이 PDF는 최대 5m까지 지원합니다. 페이지 분할을 선택해주세요.",
      );
    const doc = new jsPDF({
      unit: "mm",
      format: [width, pageHeight],
      orientation: width > pageHeight ? "landscape" : "portrait",
    });
    doc.setProperties({ title: name, creator: "Paperdown" });
    if (s.mode === "continuous")
      doc.addImage(canvas, "PNG", 0, 0, width, pageHeight, undefined, "FAST");
    else {
      const actualRatio = canvas.width / ((width * 96) / 25.4);
      const stride = ((height * 96) / 25.4 + 24) * actualRatio;
      const sliceHeight = ((height * 96) / 25.4) * actualRatio;
      for (let page = 0; page < pageCount; page++) {
        const part = document.createElement("canvas");
        part.width = canvas.width;
        part.height = Math.round(sliceHeight);
        const ctx = part.getContext("2d")!;
        ctx.fillStyle = getComputedStyle(node).backgroundColor;
        ctx.fillRect(0, 0, part.width, part.height);
        ctx.drawImage(
          canvas,
          0,
          Math.round(page * stride),
          canvas.width,
          Math.min(part.height, canvas.height - Math.round(page * stride)),
          0,
          0,
          part.width,
          Math.min(part.height, canvas.height - Math.round(page * stride)),
        );
        if (page)
          doc.addPage(
            [width, height],
            width > height ? "landscape" : "portrait",
          );
        doc.addImage(part, "PNG", 0, 0, width, height, undefined, "FAST");
      }
    }
    doc.save(`${name}.pdf`);
  } finally {
    dispose();
  }
}
export { saveFile };
