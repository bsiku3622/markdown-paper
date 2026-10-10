import type { JSONContent } from "@tiptap/react";
export type Settings = {
  paper: "a4" | "a5" | "letter" | "custom";
  width: number;
  height: number;
  landscape: boolean;
  mode: "continuous" | "pages";
  margin: number;
  font: "sans" | "myeongjo";
  sizePt: number;
  leading: number;
  zoom: number | "fit";
};
export type DocumentData = {
  version: 1;
  title: string;
  markdown: string;
  content?: JSONContent;
  settings: Settings;
  updatedAt: number;
};
export const DEFAULTS: Settings = {
  paper: "a4",
  width: 210,
  height: 297,
  landscape: false,
  mode: "continuous",
  margin: 20,
  font: "myeongjo",
  sizePt: 10,
  leading: 1.6,
  zoom: 125,
};
export const FONTS = {
  sans: '"Pretendard Variable", sans-serif',
  myeongjo: '"KoPub Batang", "Noto Serif KR", serif',
};
export const SAMPLE = `# 생각을 담는 한 장\n\n문장을 쓰는 동안, 문서는 이미 완성된 모습입니다. **Paperdown**은 글의 흐름과 종이의 형태를 함께 다루는 공간입니다.\n\n## 글에 집중하세요\n\n이 문장을 클릭하고 바로 써보세요. 텍스트를 선택하면 위 도구 모음에서 **굵게**, *기울임*, 서체와 크기를 바꿀 수 있습니다. Markdown 문법으로 제목과 목록을 만들 수도 있습니다.\n\n> 잘 정돈된 종이는 다음 생각을 기다립니다.\n\n## 원하는 모습으로 남기세요\n\n- 명조와 Pretendard, 글에 어울리는 서체\n- A4부터 자유 크기까지, 페이지 옵션\n- 이미지 복사와 PNG · PDF 다운로드\n\n문서 파일에는 서식과 이미지까지 함께 저장됩니다.\n\n---\n\n첫 문장부터, 마지막 한 장까지.\n`;
export function normalize(value: unknown): DocumentData {
  const d = (value || {}) as Partial<DocumentData> & { text?: string };
  const s = (d.settings || {}) as Partial<Settings> & { size?: number };
  const bounded = (n: unknown, min: number, max: number, fallback: number) =>
    typeof n === "number" && Number.isFinite(n)
      ? Math.max(min, Math.min(max, n))
      : fallback;
  return {
    version: 1,
    title: typeof d.title === "string" ? d.title : "새로운 문서",
    markdown:
      typeof d.markdown === "string"
        ? d.markdown
        : typeof d.text === "string"
          ? d.text
          : SAMPLE,
    content: d.content?.type === "doc" ? normalizeFonts(d.content) : undefined,
    settings: {
      ...DEFAULTS,
      ...s,
      paper: ["a4", "a5", "letter", "custom"].includes(s.paper || "")
        ? s.paper!
        : "a4",
      mode: s.mode === "pages" ? "pages" : "continuous",
      font: ["sans", "myeongjo"].includes(s.font || "")
        ? s.font!
        : "myeongjo",
      width: bounded(s.width, 80, 500, 210),
      height: bounded(s.height, 80, 2000, 297),
      margin: bounded(s.margin, 5, 50, 20),
      sizePt: bounded(s.sizePt ?? (s.size ? s.size * 0.75 : 10), 6, 96, 10),
      leading: bounded(s.leading, 1, 3, 1.6),
      zoom: s.zoom === "fit" ? "fit" : bounded(s.zoom, 50, 200, 125),
      landscape: !!s.landscape,
    },
    updatedAt: typeof d.updatedAt === "number" ? d.updatedAt : Date.now(),
  };
}
function normalizeFonts(node: JSONContent): JSONContent {
  return {
    ...node,
    ...(node.marks && {
      marks: node.marks.map((mark) =>
        mark.type === "textStyle" &&
        typeof mark.attrs?.fontFamily === "string" &&
        (mark.attrs.fontFamily.includes("Source Serif 4") ||
          mark.attrs.fontFamily.includes("Times New Roman") ||
          mark.attrs.fontFamily.includes("Latin Modern Roman") ||
          mark.attrs.fontFamily.includes("Nanum Myeongjo") ||
          mark.attrs.fontFamily === '"Noto Serif KR", serif')
          ? { ...mark, attrs: { ...mark.attrs, fontFamily: FONTS.myeongjo } }
          : mark,
      ),
    }),
    ...(node.content && { content: node.content.map(normalizeFonts) }),
  };
}
export function legacyDraft() {
  try {
    const raw =
      localStorage.getItem("paperdown-document-v1") ||
      localStorage.getItem("yeobaek-draft-v1");
    return normalize(raw ? JSON.parse(raw) : null);
  } catch {
    return normalize(null);
  }
}
export function dimensions(s: Settings) {
  const sizes = {
    a4: [210, 297],
    a5: [148, 210],
    letter: [215.9, 279.4],
    custom: [s.width, s.height],
  };
  const [w, h] = sizes[s.paper];
  return s.landscape ? { width: h, height: w } : { width: w, height: h };
}
export function statistics(text: string) {
  const chars = Array.from(text);
  return {
    words: text.trim() ? text.trim().split(/\s+/u).length : 0,
    lines: text ? text.split("\n").length : 0,
    chars: chars.length,
    compact: chars.filter((c) => !/\s/u.test(c)).length,
  };
}
let dbPromise: Promise<IDBDatabase> | undefined;
function database() {
  return (dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const request = indexedDB.open("paperdown", 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("documents");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Database blocked"));
  }));
}
export async function loadDocument() {
  try {
    const db = await database();
    return await new Promise<DocumentData>((resolve) => {
      const req = db
        .transaction("documents")
        .objectStore("documents")
        .get("current");
      req.onsuccess = () =>
        resolve(req.result ? normalize(req.result) : legacyDraft());
      req.onerror = () => resolve(legacyDraft());
    });
  } catch {
    return legacyDraft();
  }
}
export function isCurrentSnapshot(
  current: Pick<DocumentData, "updatedAt"> | undefined,
  incoming: Pick<DocumentData, "updatedAt">,
) {
  return !current || incoming.updatedAt >= current.updatedAt;
}
export async function persistDocument(d: DocumentData) {
  try {
    const db = await database();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("documents", "readwrite");
      const store = tx.objectStore("documents");
      const existing = store.get("current");
      // The read and conditional write share a transaction, including across tabs.
      existing.onsuccess = () => {
        if (isCurrentSnapshot(existing.result, d)) store.put(d, "current");
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    let previous: DocumentData | undefined;
    try {
      const raw = localStorage.getItem("paperdown-document-v1");
      previous = raw ? JSON.parse(raw) : undefined;
    } catch {
      /* Replace only a malformed fallback snapshot. */
    }
    if (isCurrentSnapshot(previous, d))
      localStorage.setItem("paperdown-document-v1", JSON.stringify(d));
  }
}
export function saveFile(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
