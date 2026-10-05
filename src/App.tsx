import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { TableKit } from "@tiptap/extension-table";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import TiptapImage from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Mathematics from "@tiptap/extension-mathematics";
import { TextStyleKit } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Strikethrough,
  Highlighter,
  Code2,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Link,
  ImagePlus,
  Table2,
  Sigma,
  Undo2,
  Redo2,
  FilePlus2,
  FolderOpen,
  Copy,
  Download,
  ChevronDown,
  X,
  Check,
  Settings2,
  PanelTop,
  ArrowUpRight,
  FileText,
  Minus,
} from "lucide-react";
import {
  FONTS,
  dimensions,
  loadDocument,
  persistDocument,
  normalize,
  statistics,
  saveFile,
  type Settings,
  type DocumentData,
} from "./document";
import { pagination, type PageLayout } from "./pagination";
import { image, pdf } from "./export-document";

const OLD_ORIGIN = "https://markdown.bsiku.dev",
  NEW_ORIGIN = "https://paperdown.bsiku.dev";
type Dialog = {
  kind: "new" | "link" | "math" | "import" | "transfer";
  value?: string;
  data?: DocumentData;
  position?: number;
  inline?: boolean;
};
function Tool({
  label,
  children,
  active = false,
  disabled = false,
  onClick,
}: {
  label: string;
  children: ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`tool ${active ? "is-active" : ""}`}
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
export default function App() {
  const [loaded, setLoaded] = useState<DocumentData | null>(null);
  useEffect(() => {
    let live = true;
    void loadDocument().then((d) => {
      if (live) setLoaded(d);
    });
    return () => {
      live = false;
    };
  }, []);
  return loaded ? (
    <Workspace initial={loaded} />
  ) : (
    <div className="loading">
      <span className="wordmark">Paperdown</span>
      <p>문서를 불러오는 중…</p>
    </div>
  );
}
function Workspace({ initial }: { initial: DocumentData }) {
  const [doc, setDoc] = useState(initial),
    [saved, setSaved] = useState(true),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(""),
    [menu, setMenu] = useState<"export" | "pages" | "table" | null>(null),
    [dialog, setDialog] = useState<Dialog | null>(null),
    [dialogValue, setDialogValue] = useState(""),
    [pages, setPages] = useState(1),
    [available, setAvailable] = useState(1100),
    [, rerender] = useState(0),
    [selection, setSelection] = useState(""),
    [slashIndex, setSlashIndex] = useState(0),
    [slash, setSlash] = useState<{
      from: number;
      to: number;
      filter: string;
      left: number;
      top: number;
    } | null>(null);
  const importRef = useRef<HTMLInputElement>(null),
    imageRef = useRef<HTMLInputElement>(null),
    stageRef = useRef<HTMLDivElement>(null),
    pageButtonRef = useRef<HTMLButtonElement>(null),
    dialogRef = useRef<HTMLDialogElement>(null),
    docRef = useRef(doc),
    saveSequence = useRef(Promise.resolve()),
    transferWindow = useRef<Window | null>(null),
    layout = useRef<PageLayout>({
      enabled: false,
      height: 1122,
      margin: 76,
      gap: 24,
    });
  docRef.current = doc;
  const s = doc.settings,
    dim = dimensions(s),
    px = 96 / 25.4,
    width = dim.width * px,
    height = dim.height * px;
  layout.current = {
    enabled: s.mode === "pages",
    height,
    margin: s.margin * px,
    gap: 24,
  };
  const flash = (msg: string) => setNotice(msg);
  function openDialog(d: Dialog) {
    setMenu(null);
    setDialogValue(d.value || "");
    setDialog(d);
  }
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          HTMLAttributes: { rel: "noopener noreferrer" },
        },
      }),
      Markdown,
      TableKit.configure({ table: { resizable: true } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TiptapImage.configure({
        allowBase64: true,
        HTMLAttributes: { crossorigin: "anonymous" },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyleKit,
      Highlight.configure({ HTMLAttributes: { class: "text-highlight" } }),
      Placeholder.configure({
        placeholder: ({ node }) =>
          node.type.name === "heading"
            ? "제목"
            : "글을 쓰거나 / 로 블록을 추가하세요",
      }),
      Mathematics.configure({
        katexOptions: { throwOnError: false },
        inlineOptions: {
          onClick: (node, pos) =>
            openDialog({
              kind: "math",
              value: node.attrs.latex,
              position: pos,
              inline: true,
            }),
        },
        blockOptions: {
          onClick: (node, pos) =>
            openDialog({
              kind: "math",
              value: node.attrs.latex,
              position: pos,
            }),
        },
      }),
      pagination(() => layout.current),
    ],
    content: initial.content || initial.markdown,
    contentType: initial.content ? "json" : "markdown",
    editorProps: {
      attributes: {
        class: "document-content",
        role: "textbox",
        "aria-label": "문서 편집기",
        "aria-multiline": "true",
        spellcheck: "false",
      },
      handlePaste: (_view, event) => {
        const file = Array.from(event.clipboardData?.files || []).find((f) =>
          f.type.startsWith("image/"),
        );
        if (file) {
          event.preventDefault();
          void insertImage(file);
          return true;
        }
        return false;
      },
      handleDrop: (_view, event) => {
        const file = Array.from(event.dataTransfer?.files || []).find((f) =>
          f.type.startsWith("image/"),
        );
        if (file) {
          event.preventDefault();
          void insertImage(file);
          return true;
        }
        return false;
      },
    },
    onCreate: ({ editor: ed }) =>
      setDoc((d) => ({
        ...d,
        content: ed.getJSON(),
        markdown: ed.getMarkdown(),
      })),
    onUpdate: ({ editor: ed }) => {
      setDoc((d) => ({
        ...d,
        content: ed.getJSON(),
        markdown: ed.getMarkdown(),
        updatedAt: Date.now(),
      }));
      updateSelection(ed);
    },
    onSelectionUpdate: ({ editor: ed }) => updateSelection(ed),
    onTransaction: () => rerender((v) => v + 1),
  });
  function updateSelection(ed: Editor) {
    const { from, to, $from } = ed.state.selection;
    setSelection(ed.state.doc.textBetween(from, to, "\n"));
    const preceding = $from.parent.textBetween(0, $from.parentOffset, "\n");
    const match = preceding.match(/(?:^|\s)\/([^\s/]*)$/);
    if (match && from === to) {
      const coords = ed.view.coordsAtPos(from);
      setSlash({
        from: from - match[1].length - 1,
        to: from,
        filter: match[1],
        left: Math.min(coords.left, window.innerWidth - 260),
        top: Math.min(coords.bottom + 8, window.innerHeight - 350),
      });
    } else setSlash(null);
  }
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 5500);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    setSaved(false);
    const timer = setTimeout(() => {
      const snapshot = doc;
      saveSequence.current = saveSequence.current
        .catch(() => {})
        .then(() => persistDocument(snapshot));
      void saveSequence.current
        .then(() => {
          if (docRef.current.updatedAt === snapshot.updatedAt) setSaved(true);
        })
        .catch(() =>
          flash("저장 공간에 접근하지 못했습니다. 문서 파일을 내려받아주세요."),
        );
    }, 250);
    return () => clearTimeout(timer);
  }, [doc]);
  useEffect(() => {
    const flush = () => {
      saveSequence.current = saveSequence.current
        .catch(() => {})
        .then(() => persistDocument(docRef.current));
    };
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, []);
  useEffect(() => {
    if (!stageRef.current) return;
    const observer = new ResizeObserver(([e]) =>
      setAvailable(e.contentRect.width),
    );
    observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (editor) {
      editor.view.dispatch(
        editor.state.tr
          .setMeta("paperdown-layout", Date.now())
          .setMeta("addToHistory", false),
      );
    }
  }, [editor, s]);
  useEffect(() => {
    document.title = `${doc.title || "새로운 문서"} — Paperdown`;
  }, [doc.title]);
  useEffect(() => {
    if (dialog) {
      dialogRef.current?.showModal();
      return () => dialogRef.current?.close();
    }
  }, [dialog]);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".menu-anchor")) setMenu(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  useEffect(() => {
    const keys = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        downloadDocument();
      }
      if (e.key === "Escape") {
        setMenu(null);
        setSlash(null);
        setDialog(null);
      }
    };
    window.addEventListener("keydown", keys);
    return () => window.removeEventListener("keydown", keys);
  });
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (
        location.origin === OLD_ORIGIN &&
        event.origin === NEW_ORIGIN &&
        event.source === transferWindow.current &&
        event.data?.type === "paperdown-ready"
      ) {
        transferWindow.current?.postMessage(
          { type: "paperdown-transfer", document: docRef.current },
          NEW_ORIGIN,
        );
      }
      if (
        location.origin === NEW_ORIGIN &&
        location.hash === "#transfer" &&
        event.origin === OLD_ORIGIN &&
        event.source === window.opener &&
        event.data?.type === "paperdown-transfer"
      ) {
        openDialog({ kind: "transfer", data: normalize(event.data.document) });
      }
    };
    window.addEventListener("message", receive);
    if (
      location.origin === NEW_ORIGIN &&
      location.hash === "#transfer" &&
      window.opener
    )
      window.opener.postMessage({ type: "paperdown-ready" }, OLD_ORIGIN);
    return () => window.removeEventListener("message", receive);
  }, []);
  useEffect(() => {
    if (!editor) return;
    const update = () =>
      setPages(
        s.mode === "pages"
          ? Math.max(
              1,
              Math.ceil(
                (editor.view.dom.scrollHeight + 24 - 0.5) / (height + 24),
              ),
            )
          : 1,
      );
    const observer = new ResizeObserver(update);
    observer.observe(editor.view.dom);
    update();
    return () => observer.disconnect();
  }, [editor, s.mode, height]);
  const filename = (doc.title.trim() || "새로운 문서").replace(
    /[\\/:*?"<>|]/g,
    "-",
  );
  function settings(patch: Partial<Settings>) {
    setDoc((d) => ({
      ...d,
      settings: { ...d.settings, ...patch },
      updatedAt: Date.now(),
    }));
  }
  function downloadDocument() {
    saveFile(
      new Blob([JSON.stringify(docRef.current, null, 2)], {
        type: "application/json",
      }),
      `${filename}.paperdown.json`,
    );
    setMenu(null);
    flash("서식과 이미지를 포함한 문서를 저장했습니다.");
  }
  function replaceDocument(data: DocumentData) {
    if (!editor) return;
    editor.commands.setContent(data.content || data.markdown, {
      contentType: data.content ? "json" : "markdown",
    });
    setDoc({
      ...data,
      content: editor.getJSON(),
      markdown: editor.getMarkdown(),
      updatedAt: Date.now(),
    });
    setDialog(null);
    setSlash(null);
    editor.commands.focus("start");
  }
  async function importFile(file?: File) {
    if (!file) return;
    if (file.size > 20_000_000) {
      flash("20MB 이하의 문서 파일을 선택해주세요.");
      return;
    }
    try {
      const text = await file.text();
      const data = file.name.endsWith(".json")
        ? normalize(JSON.parse(text))
        : normalize({
            title: file.name.replace(/\.(md|markdown|txt)$/i, ""),
            markdown: text,
            settings: doc.settings,
          });
      if (!data.content && file.name.endsWith(".json"))
        throw new Error("올바른 Paperdown 문서 파일이 아닙니다.");
      if (data.content) editor?.schema.nodeFromJSON(data.content).check();
      openDialog({ kind: "import", data });
    } catch (e) {
      flash(e instanceof Error ? e.message : "파일을 열지 못했습니다.");
    }
  }
  async function insertImage(file?: File) {
    if (!file || !editor) return;
    if (
      !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
        file.type,
      )
    ) {
      flash("PNG, JPEG, WebP, GIF 이미지를 선택해주세요.");
      return;
    }
    if (file.size > 15_000_000) {
      flash("이미지는 15MB 이하로 선택해주세요.");
      return;
    }
    try {
      const url = URL.createObjectURL(file),
        img = new window.Image();
      img.src = url;
      try {
        await img.decode();
        const ratio = Math.min(1, 1800 / img.naturalWidth);
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth * ratio;
        canvas.height = img.naturalHeight * ratio;
        canvas
          .getContext("2d")!
          .drawImage(img, 0, 0, canvas.width, canvas.height);
        const src = canvas.toDataURL("image/png");
        editor
          .chain()
          .focus()
          .setImage({ src, alt: file.name.replace(/\.[^.]+$/, "") })
          .run();
        flash("이미지를 넣었습니다.");
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch {
      flash("이미지를 열지 못했습니다.");
    }
  }
  async function exportImage(copy: boolean) {
    if (!editor) return;
    setMenu(null);
    setBusy(copy ? "이미지 복사 중" : "PNG 저장 중");
    try {
      const canCopy =
        copy && window.ClipboardItem && navigator.clipboard?.write;
      if (canCopy)
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": image(editor.view.dom, s, pages) }),
        ]);
      else saveFile(await image(editor.view.dom, s, pages), `${filename}.png`);
      flash(
        canCopy
          ? "이미지를 복사했습니다."
          : copy
            ? "이 브라우저는 이미지 복사를 지원하지 않아 PNG로 저장했습니다."
            : "PNG 이미지를 저장했습니다.",
      );
    } catch (e) {
      flash(
        e instanceof Error && e.name !== "NotAllowedError"
          ? e.message
          : "복사가 허용되지 않았습니다. PNG 다운로드를 사용해주세요.",
      );
    } finally {
      setBusy("");
    }
  }
  async function exportPdf() {
    if (!editor) return;
    setMenu(null);
    setBusy("PDF 만드는 중");
    try {
      await pdf(editor.view.dom, s, pages, filename);
      flash("PDF를 다운로드했습니다.");
    } catch (e) {
      flash(e instanceof Error ? e.message : "PDF를 만들지 못했습니다.");
    } finally {
      setBusy("");
    }
  }
  function applyFont(value: Settings["font"]) {
    if (!editor) return;
    if (editor.state.selection.empty) settings({ font: value });
    else editor.chain().focus().setFontFamily(FONTS[value]).run();
  }
  function applySize(value: string) {
    const size = Number(value);
    if (!Number.isFinite(size) || size < 6 || size > 96) {
      flash("글자 크기는 6~96pt로 입력해주세요.");
      return;
    }
    if (!editor) return;
    if (editor.state.selection.empty) settings({ sizePt: size });
    else editor.chain().focus().setFontSize(`${size}pt`).run();
  }
  const zoom =
    s.zoom === "fit"
      ? Math.min(1.5, Math.max(0.25, (available - 48) / width))
      : s.zoom / 100;
  const style = {
    "--doc-width": `${width}px`,
    "--doc-height": `${height}px`,
    "--doc-margin": `${s.margin * px}px`,
    "--doc-font": FONTS[s.font],
    "--doc-size": `${s.sizePt}pt`,
    "--doc-leading": s.leading,
    "--page-content-height":
      s.mode === "continuous" ? "none" : `${height - 2 * s.margin * px}px`,
    "--zoom": zoom,
    "--page-count": pages,
  } as CSSProperties;
  const text = editor?.getText({ blockSeparator: "\n" }) || "",
    stats = statistics(text),
    selected = statistics(selection);
  const block = editor?.isActive("heading", { level: 1 })
    ? "h1"
    : editor?.isActive("heading", { level: 2 })
      ? "h2"
      : editor?.isActive("heading", { level: 3 })
        ? "h3"
        : editor?.isActive("codeBlock")
          ? "code"
          : "p";
  const fontAttr = editor?.getAttributes("textStyle").fontFamily as
    string | undefined;
  const fontValue = fontAttr
    ? Object.entries(FONTS).find(([, v]) => v === fontAttr)?.[0] || s.font
    : s.font;
  const sizeValue = String(
    editor?.getAttributes("textStyle").fontSize || `${s.sizePt}pt`,
  ).replace("pt", "");
  const slashItems = [
    {
      label: "본문",
      hint: "일반 텍스트",
      key: "text 본문",
      run: () => editor?.chain().focus().setParagraph().run(),
    },
    {
      label: "제목 1",
      hint: "큰 제목",
      key: "h1 제목",
      run: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      label: "제목 2",
      hint: "소제목",
      key: "h2 제목",
      run: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: "글머리 목록",
      hint: "순서 없는 목록",
      key: "list 목록",
      run: () => editor?.chain().focus().toggleBulletList().run(),
    },
    {
      label: "체크리스트",
      hint: "할 일과 기록",
      key: "todo 체크",
      run: () => editor?.chain().focus().toggleTaskList().run(),
    },
    {
      label: "인용",
      hint: "문장에 다른 목소리",
      key: "quote 인용",
      run: () => editor?.chain().focus().toggleBlockquote().run(),
    },
    {
      label: "표",
      hint: "3 × 3 표",
      key: "table 표",
      run: () =>
        editor
          ?.chain()
          .focus()
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run(),
    },
    {
      label: "이미지",
      hint: "파일에서 가져오기",
      key: "image 이미지",
      run: () => imageRef.current?.click(),
    },
    {
      label: "수식",
      hint: "LaTeX 수식",
      key: "math 수식",
      run: () => openDialog({ kind: "math" }),
    },
  ].filter((item) =>
    item.key.toLowerCase().includes(slash?.filter.toLowerCase() || ""),
  );
  function runSlash(index: number) {
    if (!slash || !slashItems[index] || !editor) return;
    editor
      .chain()
      .focus()
      .deleteRange({ from: slash.from, to: slash.to })
      .run();
    setSlash(null);
    slashItems[index].run();
  }
  useEffect(() => {
    setSlashIndex(0);
  }, [slash?.filter, slash?.from]);
  useEffect(() => {
    if (!slash) return;
    const key = (event: KeyboardEvent) => {
      if (
        !["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(event.key) ||
        event.isComposing
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      if (event.key === "Escape") setSlash(null);
      else if (event.key === "Enter")
        runSlash(Math.min(slashIndex, slashItems.length - 1));
      else
        setSlashIndex(
          (i) =>
            (i + (event.key === "ArrowDown" ? 1 : -1) + slashItems.length) %
            Math.max(1, slashItems.length),
        );
    };
    window.addEventListener("keydown", key, true);
    return () => window.removeEventListener("keydown", key, true);
  });
  function submitDialog() {
    if (!editor || !dialog) return;
    if (dialog.kind === "new") {
      downloadDocument();
      replaceDocument(
        normalize({
          title: "새로운 문서",
          markdown: "",
          settings: doc.settings,
        }),
      );
    } else if (
      (dialog.kind === "import" || dialog.kind === "transfer") &&
      dialog.data
    ) {
      downloadDocument();
      replaceDocument(dialog.data);
      if (dialog.kind === "transfer")
        history.replaceState(null, "", location.pathname);
      flash("문서를 불러왔습니다. 이전 문서는 파일로 보관했습니다.");
    } else if (dialog.kind === "link") {
      const url = dialogValue.trim();
      if (!url)
        editor.chain().focus().extendMarkRange("link").unsetLink().run();
      else {
        try {
          const parsed = new URL(url);
          if (!["https:", "http:", "mailto:"].includes(parsed.protocol))
            throw new Error();
          editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: url })
            .run();
        } catch {
          flash("https:// 로 시작하는 주소를 입력해주세요.");
          return;
        }
      }
      setDialog(null);
    } else if (dialog.kind === "math") {
      if (!dialogValue.trim()) return;
      if (dialog.position !== undefined) {
        if (dialog.inline)
          editor
            .chain()
            .focus()
            .setNodeSelection(dialog.position)
            .updateInlineMath({ latex: dialogValue })
            .run();
        else
          editor
            .chain()
            .focus()
            .setNodeSelection(dialog.position)
            .updateBlockMath({ latex: dialogValue })
            .run();
      } else
        editor.chain().focus().insertBlockMath({ latex: dialogValue }).run();
      setDialog(null);
    }
  }
  if (!editor) return null;
  return (
    <div className="app" style={style}>
      <header className="app-header">
        <a className="brand" href="/" aria-label="Paperdown 홈">
          <span className="brand-symbol">
            <FileText size={21} strokeWidth={1.5} />
          </span>
          <span className="wordmark">Paperdown</span>
        </a>
        <span className="header-divider" />
        <div className="identity">
          <input
            aria-label="문서 이름"
            value={doc.title}
            placeholder="새로운 문서"
            onChange={(e) =>
              setDoc((d) => ({
                ...d,
                title: e.target.value,
                updatedAt: Date.now(),
              }))
            }
          />
          <span className="save-state">
            <span className={saved ? "saved-dot" : "saved-dot pending"} />
            {saved ? "저장됨" : "저장 중"}
          </span>
        </div>
        <div className="header-actions">
          <Tool label="새 문서" onClick={() => openDialog({ kind: "new" })}>
            <FilePlus2 size={17} />
          </Tool>
          <Tool label="문서 열기" onClick={() => importRef.current?.click()}>
            <FolderOpen size={17} />
          </Tool>
          <span className="header-divider" />
          <button
            className="action-button image-copy"
            disabled={!!busy}
            onClick={() => void exportImage(true)}
          >
            <Copy size={15} />
            <span>이미지 복사</span>
          </button>
          <div className="menu-anchor">
            <button
              className="action-button primary"
              aria-haspopup="menu"
              aria-expanded={menu === "export"}
              disabled={!!busy}
              onClick={() => setMenu(menu === "export" ? null : "export")}
            >
              <Download size={15} />
              <span>{busy || "내보내기"}</span>
              <ChevronDown size={13} />
            </button>
            {menu === "export" && (
              <div className="dropdown export-menu" role="menu">
                <p className="menu-caption">완성한 문서를 남기는 방법</p>
                <button role="menuitem" onClick={() => void exportPdf()}>
                  <FileText size={18} />
                  <span>
                    PDF 다운로드
                    <small>
                      {s.mode === "pages"
                        ? `${pages}페이지 · 용지 크기 유지`
                        : "한 장의 긴 문서 · 현재 높이"}
                    </small>
                  </span>
                  <span className="file-tag">PDF</span>
                </button>
                <button role="menuitem" onClick={() => void exportImage(false)}>
                  <ImagePlus size={18} />
                  <span>
                    PNG 이미지<small>현재 문서 전체를 선명하게</small>
                  </span>
                  <span className="file-tag">PNG</span>
                </button>
                <hr />
                <button role="menuitem" onClick={downloadDocument}>
                  <PanelTop size={18} />
                  <span>
                    Paperdown 문서<small>서식 · 표 · 이미지 보존</small>
                  </span>
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    saveFile(
                      new Blob([editor.getMarkdown()], {
                        type: "text/markdown;charset=utf-8",
                      }),
                      `${filename}.md`,
                    );
                    setMenu(null);
                  }}
                >
                  <Code2 size={18} />
                  <span>
                    Markdown 원본
                    <small>선택 서식과 정렬은 포함되지 않습니다</small>
                  </span>
                  <span className="file-tag">MD</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      {location.origin === OLD_ORIGIN && (
        <div className="migration">
          <span>
            여백이 <strong>Paperdown</strong>으로 새로워졌습니다.
          </span>
          <button
            onClick={() => {
              transferWindow.current = window.open(
                `${NEW_ORIGIN}/#transfer`,
                "_blank",
              );
              if (!transferWindow.current)
                flash(
                  "팝업을 허용하거나 문서 파일로 저장한 뒤 새 주소에서 열어주세요.",
                );
            }}
          >
            현재 문서와 함께 새 주소로 이동 <ArrowUpRight size={14} />
          </button>
        </div>
      )}
      <div className="toolbar" role="toolbar" aria-label="문서 도구 모음">
        <div className="tool-group">
          <Tool
            label="실행 취소 (⌘Z)"
            disabled={!editor.can().undo()}
            onClick={() => editor.chain().focus().undo().run()}
          >
            <Undo2 size={16} />
          </Tool>
          <Tool
            label="다시 실행 (⇧⌘Z)"
            disabled={!editor.can().redo()}
            onClick={() => editor.chain().focus().redo().run()}
          >
            <Redo2 size={16} />
          </Tool>
        </div>
        <div className="tool-group">
          <select
            className="block-select"
            aria-label="문단 종류"
            value={block}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "p") editor.chain().focus().setParagraph().run();
              else if (v === "code")
                editor.chain().focus().toggleCodeBlock().run();
              else
                editor
                  .chain()
                  .focus()
                  .toggleHeading({ level: Number(v[1]) as 1 | 2 | 3 })
                  .run();
            }}
          >
            <option value="p">본문</option>
            <option value="h1">제목 1</option>
            <option value="h2">제목 2</option>
            <option value="h3">제목 3</option>
            <option value="code">코드 블록</option>
          </select>
          <select
            aria-label="서체"
            className="font-select"
            value={fontValue}
            onChange={(e) => applyFont(e.target.value as Settings["font"])}
          >
            <option value="myeongjo">본명조</option>
            <option value="sans">Pretendard</option>
            <option value="serif">Source Serif</option>
          </select>
          <span className="size-field">
            <input
              key={`${sizeValue}-${editor.state.selection.empty}`}
              aria-label="글자 크기"
              type="number"
              min="6"
              max="96"
              step=".5"
              defaultValue={sizeValue}
              onBlur={(e) => {
                if (e.currentTarget.value !== sizeValue)
                  applySize(e.currentTarget.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              list="font-sizes"
            />
            <span>pt</span>
          </span>
          <datalist id="font-sizes">
            {[
              6, 8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48, 72, 96,
            ].map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </div>
        <div className="tool-group">
          <Tool
            label="굵게 (⌘B)"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold size={16} />
          </Tool>
          <Tool
            label="기울임 (⌘I)"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic size={16} />
          </Tool>
          <Tool
            label="취소선"
            active={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough size={16} />
          </Tool>
          <Tool
            label="강조"
            active={editor.isActive("highlight")}
            onClick={() => editor.chain().focus().toggleHighlight().run()}
          >
            <Highlighter size={16} />
          </Tool>
          <Tool
            label="인라인 코드"
            active={editor.isActive("code")}
            onClick={() => editor.chain().focus().toggleCode().run()}
          >
            <Code2 size={16} />
          </Tool>
          <Tool
            label="링크"
            active={editor.isActive("link")}
            onClick={() =>
              openDialog({
                kind: "link",
                value: editor.getAttributes("link").href || "",
              })
            }
          >
            <Link size={16} />
          </Tool>
        </div>
        <div className="tool-group">
          <Tool
            label="왼쪽 정렬"
            active={editor.isActive({ textAlign: "left" })}
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
          >
            <AlignLeft size={16} />
          </Tool>
          <Tool
            label="가운데 정렬"
            active={editor.isActive({ textAlign: "center" })}
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
          >
            <AlignCenter size={16} />
          </Tool>
          <Tool
            label="오른쪽 정렬"
            active={editor.isActive({ textAlign: "right" })}
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
          >
            <AlignRight size={16} />
          </Tool>
          <select
            aria-label="줄 간격"
            className="leading-select"
            value={s.leading}
            onChange={(e) => settings({ leading: Number(e.target.value) })}
          >
            {[1, 1.15, 1.3, 1.5, 1.6, 1.9, 2, 2.5, 3].map((v) => (
              <option key={v} value={v}>
                ↕ {v}
              </option>
            ))}
          </select>
        </div>
        <div className="tool-group">
          <Tool
            label="글머리 목록"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List size={17} />
          </Tool>
          <Tool
            label="번호 목록"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered size={17} />
          </Tool>
          <Tool
            label="체크리스트"
            active={editor.isActive("taskList")}
            onClick={() => editor.chain().focus().toggleTaskList().run()}
          >
            <ListTodo size={17} />
          </Tool>
          <Tool
            label="인용"
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote size={16} />
          </Tool>
        </div>
        <div className="tool-group">
          <Tool label="이미지 넣기" onClick={() => imageRef.current?.click()}>
            <ImagePlus size={17} />
          </Tool>
          <div className="menu-anchor">
            <Tool
              label="표"
              active={editor.isActive("table")}
              onClick={() => setMenu(menu === "table" ? null : "table")}
            >
              <Table2 size={16} />
            </Tool>
            {menu === "table" && (
              <div className="dropdown table-menu" role="menu">
                {editor.isActive("table") ? (
                  <>
                    <button
                      role="menuitem"
                      onClick={() => {
                        editor.chain().focus().addRowAfter().run();
                        setMenu(null);
                      }}
                    >
                      아래에 행 추가
                    </button>
                    <button
                      role="menuitem"
                      onClick={() => {
                        editor.chain().focus().addColumnAfter().run();
                        setMenu(null);
                      }}
                    >
                      오른쪽에 열 추가
                    </button>
                    <button
                      role="menuitem"
                      onClick={() => {
                        editor.chain().focus().deleteRow().run();
                        setMenu(null);
                      }}
                    >
                      선택 행 삭제
                    </button>
                    <button
                      role="menuitem"
                      onClick={() => {
                        editor.chain().focus().deleteColumn().run();
                        setMenu(null);
                      }}
                    >
                      선택 열 삭제
                    </button>
                    <button
                      role="menuitem"
                      onClick={() => {
                        editor.chain().focus().deleteTable().run();
                        setMenu(null);
                      }}
                    >
                      표 삭제
                    </button>
                  </>
                ) : (
                  <button
                    role="menuitem"
                    onClick={() => {
                      editor
                        .chain()
                        .focus()
                        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                        .run();
                      setMenu(null);
                    }}
                  >
                    3 × 3 표 넣기
                  </button>
                )}
              </div>
            )}
          </div>
          <Tool label="수식 넣기" onClick={() => openDialog({ kind: "math" })}>
            <Sigma size={16} />
          </Tool>
          <Tool
            label="구분선"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            <Minus size={16} />
          </Tool>
        </div>
        <div className="tool-group page-group">
          <div className="menu-anchor">
            <button
              ref={pageButtonRef}
              className={`page-trigger ${menu === "pages" ? "is-active" : ""}`}
              aria-expanded={menu === "pages"}
              onClick={() => setMenu(menu === "pages" ? null : "pages")}
            >
              <Settings2 size={15} />
              페이지 옵션
              <ChevronDown size={12} />
            </button>
            {menu === "pages" && (
              <div
                className="dropdown page-options"
                style={{
                  position: "fixed",
                  right: "auto",
                  left: Math.max(
                    12,
                    Math.min(
                      pageButtonRef.current?.getBoundingClientRect().left || 12,
                      window.innerWidth - 314,
                    ),
                  ),
                  top:
                    (pageButtonRef.current?.getBoundingClientRect().bottom ||
                      110) + 12,
                }}
              >
                <div className="panel-heading">
                  <h2>페이지 옵션</h2>
                  <button
                    className="tool"
                    aria-label="페이지 옵션 닫기"
                    onClick={() => setMenu(null)}
                  >
                    <X size={15} />
                  </button>
                </div>
                <div className="segmented" aria-label="페이지 방식">
                  <button
                    aria-pressed={s.mode === "continuous"}
                    className={s.mode === "continuous" ? "is-active" : ""}
                    onClick={() => settings({ mode: "continuous" })}
                  >
                    무한 높이
                  </button>
                  <button
                    aria-pressed={s.mode === "pages"}
                    className={s.mode === "pages" ? "is-active" : ""}
                    onClick={() => settings({ mode: "pages" })}
                  >
                    페이지 분할
                  </button>
                </div>
                <p className="option-help">
                  {s.mode === "continuous"
                    ? "내용과 위아래 여백에 딱 맞는 한 장의 문서입니다."
                    : "용지 높이에 맞춰 종이를 나눕니다."}
                </p>
                <label>
                  페이지 크기
                  <select
                    aria-label="페이지 크기"
                    value={s.paper}
                    onChange={(e) =>
                      settings({ paper: e.target.value as Settings["paper"] })
                    }
                  >
                    <option value="a4">A4 · 210 × 297 mm</option>
                    <option value="a5">A5 · 148 × 210 mm</option>
                    <option value="letter">Letter · 216 × 279 mm</option>
                    <option value="custom">사용자 지정</option>
                  </select>
                </label>
                {s.paper === "custom" && (
                  <div className="dimension-fields">
                    <label>
                      너비
                      <span>
                        <input
                          aria-label="페이지 너비"
                          type="number"
                          min="80"
                          max="500"
                          key={s.width}
                          defaultValue={s.width}
                          onBlur={(e) =>
                            settings({
                              width: Math.max(
                                80,
                                Math.min(500, Number(e.target.value)),
                              ),
                            })
                          }
                        />
                        mm
                      </span>
                    </label>
                    <label>
                      높이
                      <span>
                        <input
                          disabled={s.mode === "continuous"}
                          aria-label="페이지 높이"
                          type="number"
                          min="80"
                          max="2000"
                          key={s.height}
                          defaultValue={s.height}
                          onBlur={(e) =>
                            settings({
                              height: Math.max(
                                80,
                                Math.min(2000, Number(e.target.value)),
                              ),
                            })
                          }
                        />
                        mm
                      </span>
                    </label>
                  </div>
                )}
                <label>
                  방향
                  <select
                    aria-label="페이지 방향"
                    value={s.landscape ? "landscape" : "portrait"}
                    onChange={(e) =>
                      settings({ landscape: e.target.value === "landscape" })
                    }
                  >
                    <option value="portrait">세로</option>
                    <option value="landscape">가로</option>
                  </select>
                </label>
                <label>
                  여백
                  <span className="unit-field">
                    <input
                      aria-label="페이지 여백"
                      type="number"
                      min="5"
                      max="50"
                      key={s.margin}
                      defaultValue={s.margin}
                      onBlur={(e) =>
                        settings({
                          margin: Math.max(
                            5,
                            Math.min(50, Number(e.target.value)),
                          ),
                        })
                      }
                    />
                    mm
                  </span>
                </label>
                <div className="page-spec">
                  <span>
                    {s.mode === "continuous"
                      ? `${Math.round(dim.width)} mm · 내용 높이`
                      : `${Math.round(dim.width)} × ${Math.round(dim.height)} mm`}
                  </span>
                  <span>
                    {s.mode === "continuous" ? "내용에 맞춤" : `${pages}페이지`}
                  </span>
                </div>
                {s.mode === "continuous" && (
                  <p className="option-help">
                    무한 높이는 내용에 맞춰 자동으로 늘고 줄어듭니다. 고정
                    높이는 페이지 분할에서 설정하세요.
                  </p>
                )}
              </div>
            )}
          </div>
          <select
            aria-label="화면 배율"
            className="zoom-select"
            value={s.zoom}
            onChange={(e) =>
              settings({
                zoom: e.target.value === "fit" ? "fit" : Number(e.target.value),
              })
            }
          >
            <option value="fit">너비 맞춤</option>
            {[50, 75, 100, 125, 150, 175, 200].map((v) => (
              <option key={v} value={v}>
                {v}%
              </option>
            ))}
          </select>
        </div>
      </div>
      <main className="workspace" ref={stageRef}>
        <div className="document-stage" style={{ width: (width + 2) * zoom }}>
          <div className="document-caption">
            <span>
              {s.paper === "custom" ? "CUSTOM" : s.paper.toUpperCase()}{" "}
              <span className="caption-dot">·</span>{" "}
              {s.mode === "pages" ? `${pages} PAGES` : "CONTINUOUS"}
            </span>
            <span>클릭해서 바로 쓰세요</span>
          </div>
          <div
            className={`paper-stack ${s.mode === "pages" ? "paginated" : "continuous"}`}
            style={{
              zoom,
              minHeight:
                s.mode === "pages" ? pages * height + (pages - 1) * 24 : 0,
            }}
          >
            {s.mode === "pages" && (
              <div className="page-surfaces" aria-hidden="true">
                {Array.from({ length: pages }, (_, i) => (
                  <div
                    key={i}
                    className="page-surface"
                    style={{ top: i * (height + 24) }}
                  >
                    <span className="page-number">{i + 1}</span>
                  </div>
                ))}
              </div>
            )}
            <EditorContent editor={editor} />
          </div>
          <div className="document-end">
            <span>문서 끝</span>
          </div>
        </div>
      </main>
      <footer className="statusbar">
        <div className="status-primary">
          <span>{s.mode === "pages" ? `${pages}페이지` : "무한 높이"}</span>
          <span className="status-divider" />
          <span>{Math.max(1, Math.ceil(stats.words / 200))}분 읽기</span>
        </div>
        <div className="document-stats" aria-label="문서 통계">
          <span>
            <b>{stats.words.toLocaleString()}</b> 단어
          </span>
          <span title="문단과 줄바꿈 기준 · 자동 줄바꿈 제외">
            <b>{stats.lines.toLocaleString()}</b> 줄
          </span>
          <span>
            <b>{stats.chars.toLocaleString()}</b> 자 <em>공백 포함</em>
          </span>
          <span>
            <b>{stats.compact.toLocaleString()}</b> 자 <em>공백 제외</em>
          </span>
          {selection && (
            <span className="selection-stat">선택 {selected.chars}자</span>
          )}
        </div>
        <span className="storage-hint">이 브라우저에 자동 저장</span>
      </footer>
      {slash && slashItems.length > 0 && (
        <div
          className="slash-menu dropdown"
          style={{ left: slash.left, top: slash.top }}
        >
          <p className="menu-caption">블록 추가</p>
          {slashItems.map((item, index) => (
            <button
              className={index === slashIndex ? "is-active" : ""}
              key={item.label}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => runSlash(index)}
            >
              <span>
                {item.label}
                <small>{item.hint}</small>
              </span>
            </button>
          ))}
        </div>
      )}
      <input
        ref={importRef}
        type="file"
        accept=".md,.markdown,.txt,.json"
        hidden
        onChange={(e) => {
          void importFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={imageRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        hidden
        onChange={(e) => {
          void insertImage(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {notice && (
        <div className="toast" role="status">
          <Check size={16} />
          <span>{notice}</span>
          <button aria-label="알림 닫기" onClick={() => setNotice("")}>
            <X size={14} />
          </button>
        </div>
      )}
      {dialog && (
        <dialog
          ref={dialogRef}
          className="document-dialog"
          onCancel={() => setDialog(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitDialog();
            }}
          >
            <div className="panel-heading">
              <h2>
                {dialog.kind === "new"
                  ? "새 문서를 시작할까요?"
                  : dialog.kind === "link"
                    ? "링크 편집"
                    : dialog.kind === "math"
                      ? "LaTeX 수식"
                      : dialog.kind === "transfer"
                        ? "문서를 Paperdown으로 옮기기"
                        : "문서 열기"}
              </h2>
              <button
                type="button"
                className="tool"
                aria-label="대화상자 닫기"
                onClick={() => setDialog(null)}
              >
                <X size={17} />
              </button>
            </div>
            {dialog.kind === "link" || dialog.kind === "math" ? (
              <>
                <label className="dialog-label">
                  {dialog.kind === "link" ? "링크 주소" : "수식 입력"}
                  <input
                    autoFocus
                    value={dialogValue}
                    onChange={(e) => setDialogValue(e.target.value)}
                    placeholder={
                      dialog.kind === "link"
                        ? "https://example.com"
                        : "E = mc^2"
                    }
                  />
                </label>
                <p>
                  {dialog.kind === "link"
                    ? "주소를 비우면 링크를 해제합니다."
                    : "삽입한 수식을 클릭하면 다시 편집합니다."}
                </p>
              </>
            ) : (
              <p>
                {dialog.kind === "new"
                  ? "현재 문서를 파일로 내려받아 보관한 뒤 새 문서를 시작합니다."
                  : `“${dialog.data?.title}” 문서를 불러옵니다. 현재 문서는 먼저 파일로 내려받아 보관합니다.`}
              </p>
            )}
            <div className="dialog-actions">
              <button
                type="button"
                className="action-button"
                onClick={() => setDialog(null)}
              >
                취소
              </button>
              {dialog.kind === "new" && (
                <button
                  type="button"
                  className="action-button"
                  onClick={downloadDocument}
                >
                  현재 문서 저장
                </button>
              )}
              <button className="action-button primary" type="submit">
                {dialog.kind === "new"
                  ? "새 문서"
                  : dialog.kind === "link" || dialog.kind === "math"
                    ? "적용"
                    : "불러오기"}
              </button>
            </div>
          </form>
        </dialog>
      )}
    </div>
  );
}
