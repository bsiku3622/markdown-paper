import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  Box,
  Button,
  Divider,
  Field,
  Floating,
  FormField,
  Grid,
  IconButton,
  Inline,
  Portal,
  SegmentControl,
  Select,
  Selectable,
  Spinner,
  Stack,
  Surface,
  Text,
} from "@studio-baeks/paper-ui";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import { documentExtensions, HIGHLIGHT_COLORS, TEXT_COLORS } from "./extensions";
import { Glyph, type GlyphName } from "./glyphs";
import { Brand } from "./chrome";
import { useMedia } from "./hooks";
import {
  FONTS,
  dimensions,
  loadDocument,
  normalize,
  statistics,
  saveFile,
  SHARED_SETTINGS,
  type Settings,
  type DocumentData,
} from "./document";
import { portableDocument, isPrivateImage } from "./portable-document";
import { Account, type AccountControls, type LiveNote } from "./Account";
import { LiveTrailingNode, openSession, useLiveStatus, useOnline, userColor, type LiveSession } from "./live";
import { Presence, SharePanel } from "./Share";
import { PaperTypography } from "./typography";
import { pagination, type PageLayout } from "./pagination";
import { image } from "./export-document";
import { pdf } from "./pdf-document";

const OLD_ORIGIN = "https://markdown.bsiku.dev",
  NEW_ORIGIN = "https://paperdown.bsiku.dev";
type Dialog = {
  kind: "new" | "link" | "math" | "import" | "transfer";
  value?: string;
  data?: DocumentData;
  position?: number;
  inline?: boolean;
};
const DIALOG_TITLES: Record<Dialog["kind"], string> = {
  new: "새 문서를 시작할까요?",
  link: "링크 편집",
  math: "LaTeX 수식",
  import: "문서 열기",
  transfer: "문서를 Paperdown으로 옮기기",
};
function Tool({
  label,
  glyph,
  active,
  disabled = false,
  onClick,
}: {
  label: string;
  glyph: GlyphName;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const icon = <Glyph name={glyph} ink={active ? "primary" : "secondary"} />;
  const common = {
    size: "xs" as const,
    variant: "ghost" as const,
    title: label,
    "aria-label": label,
    disabled,
    onMouseDown: (e: MouseEvent) => e.preventDefault(),
    onClick,
  };
  return active === undefined ? (
    <IconButton {...common}>{icon}</IconButton>
  ) : (
    <IconButton as={Selectable} selected={active} {...common}>
      {icon}
    </IconButton>
  );
}
const TableItem = ({ label, run }: { label: string; run: () => void }) => (
  <Button as={Floating.Close} variant="ghost" size="sm" fontSize="body" fullWidth justify="start" onMouseDown={(e: MouseEvent) => e.preventDefault()} onClick={run}>
    {label}
  </Button>
);
const ExportRow = ({ glyph, title, hint, tag, run }: { glyph: GlyphName; title: string; hint: string; tag?: string; run: () => void }) => (
  <Button as={Floating.Close} variant="ghost" size="xl" fullWidth justify="between" onClick={run}>
    <Inline as="span" gap="md" align="center" minWidth={0}>
      <Glyph name={glyph} />
      <Stack as="span" align="start" minWidth={0}>
        <Text as="span" ink="inherit">{title}</Text>
        <Text as="span" variant="label" strong={false} ink="tertiary" truncate>{hint}</Text>
      </Stack>
    </Inline>
    {tag ? <Text as="span" variant="label" strong={false} ink="tertiary">{tag}</Text> : null}
  </Button>
);
const Swatch = ({ label, color, kind, selected, run }: { label: string; color?: string; kind: "text" | "highlight"; selected: boolean; run: () => void }) => (
  <IconButton as={Floating.Close} size="xs" variant="ghost" aria-label={label} title={label} aria-pressed={selected} onMouseDown={(e: MouseEvent) => e.preventDefault()} onClick={run}>
    <span
      aria-hidden
      className={`swatch swatch-${kind}${color ? "" : " swatch-none"}${selected ? " swatch-selected" : ""}`}
      style={color ? (kind === "text" ? { color } : { background: color }) : undefined}
    >
      {kind === "text" ? "가" : null}
    </span>
  </IconButton>
);
function ColorMenu({ text, highlight, setText, setHighlight }: { text?: string; highlight?: string; setText: (color?: string) => void; setHighlight: (color?: string) => void }) {
  return (
    <Floating>
      <IconButton as={Floating.Trigger} size="xs" variant="ghost" aria-label="글자색과 형광펜" title="글자색과 형광펜" onMouseDown={(e: MouseEvent) => e.preventDefault()}>
        <span className="color-glyph" aria-hidden>
          <Glyph name="baseline" ink="secondary" />
          <span className="color-glyph-bar" style={{ background: text || "var(--pui-color-ink-primary)" }} />
        </span>
      </IconButton>
      <Floating.Content as={Surface} fill="raised" radius="md" padding="md" placement="bottom start" restoreFocus={false} aria-label="글자색과 형광펜">
        <Stack gap="md">
          <Stack gap="xs">
            <Text as="span" variant="label" strong={false} ink="tertiary">글자색</Text>
            <Inline gap="xs" role="group" aria-label="글자색">
              <Swatch label="기본 글자색" kind="text" selected={!text} run={() => setText()} />
              {TEXT_COLORS.map((c) => (
                <Swatch key={c.value} label={`${c.name} 글자`} color={c.value} kind="text" selected={text?.toLowerCase() === c.value} run={() => setText(c.value)} />
              ))}
            </Inline>
          </Stack>
          <Stack gap="xs">
            <Text as="span" variant="label" strong={false} ink="tertiary">형광펜</Text>
            <Inline gap="xs" role="group" aria-label="형광펜">
              <Swatch label="형광펜 없음" kind="highlight" selected={!highlight} run={() => setHighlight()} />
              {HIGHLIGHT_COLORS.map((c) => (
                <Swatch key={c.value} label={`${c.name} 형광펜`} color={c.value} kind="highlight" selected={highlight?.toLowerCase() === c.value} run={() => setHighlight(c.value)} />
              ))}
            </Inline>
          </Stack>
        </Stack>
      </Floating.Content>
    </Floating>
  );
}
const OptionRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <Inline justify="between" align="center" gap="md">
    <Text as="span" variant="caption" ink="secondary">{label}</Text>
    {children}
  </Inline>
);
const Quiet = ({ children }: { children: ReactNode }) => (
  <Text as="span" variant="label" strong={false} ink="tertiary">{children}</Text>
);
const Count = ({ value, unit, of }: { value: number; unit: string; of?: string }) => (
  <Inline as="span" gap="xs" align="baseline">
    <Text as="span" variant="label" strong={false} ink="secondary" numeric>{value.toLocaleString()}</Text>
    <Quiet>{unit}</Quiet>
    {of ? <Quiet>{of}</Quiet> : null}
  </Inline>
);
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
    <Account initial={loaded}>
      {(document, key, account, live) =>
        live ? <LiveWorkspace key={key} initial={document} account={account} live={live} /> : <Workspace key={key} initial={document} account={account} />
      }
    </Account>
  ) : (
    <div className="loading">
      <span className="wordmark">Paperdown</span>
      <p>문서를 불러오는 중…</p>
    </div>
  );
}
const zoomKey = (id: string) => `paperdown-zoom:${id}`;
function storedZoom(id: string): Settings["zoom"] | undefined {
  try {
    const value = localStorage.getItem(zoomKey(id));
    return value === "fit" ? "fit" : value ? normalize({ settings: { zoom: Number(value) } }).settings.zoom : undefined;
  } catch {
    return undefined;
  }
}
// Account notes are edited live. Each mount owns one Yjs session (StrictMode remounts get a fresh one).
// The editor mounts only after the first sync: an editor bound to an empty shared document
// fills it with a blank paragraph, which would then be merged into everyone's note.
function LiveWorkspace({ initial, account, live }: { initial: DocumentData; account: AccountControls; live: LiveNote }) {
  const [state, setState] = useState<{ session: LiveSession; key: number } | null>(null),
    [denied, setDenied] = useState(false);
  useEffect(() => {
    const session = openSession(live.note.id, live.user.id);
    let shown = false,
      timer: ReturnType<typeof setTimeout> | undefined;
    const show = () => {
      if (shown) return;
      shown = true;
      setState((s) => ({ session, key: (s?.key || 0) + 1 }));
    };
    session.provider.on("synced", show);
    session.provider.on("authenticationFailed", () => !shown && setDenied(true));
    // Offline, a copy kept on this device opens after a short wait for the server.
    void session.local.whenSynced.then(() => {
      if (session.ydoc.getXmlFragment("default").length) timer = setTimeout(show, 2500);
    });
    return () => {
      clearTimeout(timer);
      setState(null);
      setDenied(false);
      session.destroy();
    };
  }, [live.note.id, live.user.id]);
  if (state) return <Workspace key={state.key} initial={initial} account={account} live={live} session={state.session} />;
  return (
    <Stack align="center" justify="center" gap="lg" minHeight="viewport" padding="2xl">
      {denied ? (
        <>
          <Text as="p" ink="secondary">이 노트에 접근할 수 없습니다. 공유가 해제되었거나 노트가 삭제되었습니다.</Text>
          <Button variant="hairline" size="sm" onClick={account.home}>홈으로</Button>
        </>
      ) : (
        <Inline gap="sm" align="center">
          <Spinner size="inline" label="문서를 불러오는 중" />
          <Text as="p" variant="caption" ink="tertiary">문서를 불러오는 중…</Text>
        </Inline>
      )}
    </Stack>
  );
}
function Workspace({ initial, account, live, session }: { initial: DocumentData; account: AccountControls; live?: LiveNote; session?: LiveSession }) {
  const [doc, setDoc] = useState(() =>
      live ? { ...initial, settings: { ...initial.settings, zoom: storedZoom(live.note.id) ?? initial.settings.zoom } } : initial,
    ),
    [saved, setSaved] = useState(true),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(""),
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
    slashAnchor = useRef<HTMLSpanElement>(null),
    dialogField = useRef<HTMLInputElement>(null),
    lastDialog = useRef<Dialog | null>(null),
    docRef = useRef(doc),
    accountRef = useRef(account),
    saveSequence = useRef(Promise.resolve()),
    transferWindow = useRef<Window | null>(null),
    layout = useRef<PageLayout>({
      enabled: false,
      height: 1122,
      margin: 76,
      gap: 24,
    });
  docRef.current = doc;
  accountRef.current = account;
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
  const phone = useMedia("(max-width: 767px)");
  const flash = (msg: string) => setNotice(msg);
  function openDialog(d: Dialog) {
    setDialogValue(d.value || "");
    setDialog(d);
  }
  const editor = useEditor({
    extensions: [
      ...documentExtensions({
        privateImage: isPrivateImage,
        resizable: true,
        history: !session,
        math: {
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
        },
      }),
      PaperTypography,
      Placeholder.configure({
        placeholder: ({ node }) =>
          node.type.name === "heading"
            ? "제목"
            : "글을 쓰거나 / 로 블록을 추가하세요",
      }),
      pagination(() => layout.current),
      ...(session && live
        ? [
            Collaboration.configure({ document: session.ydoc, field: "default" }),
            LiveTrailingNode,
            CollaborationCaret.configure({
              provider: session.provider,
              user: { id: live.user.id, name: live.user.nickname, color: userColor(live.user.id) },
            }),
          ]
        : []),
    ],
    // Live notes take their content from the shared Yjs document instead.
    ...(session
      ? { editable: false }
      : { content: initial.content || initial.markdown, contentType: initial.content ? ("json" as const) : ("markdown" as const) }),
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
  const status = useLiveStatus(session),
    online = useOnline(session, live?.user.id || ""),
    readOnly = live?.note.role === "viewer",
    // Once access is gone, editing tools are hidden as for viewers.
    locked = readOnly || status.denied;
  useEffect(() => {
    editor?.setEditable(!session || (!status.denied && !readOnly), false);
  }, [editor, session, status.denied, readOnly]);
  // Title and page settings live beside the text in the shared document.
  useEffect(() => {
    if (!session) return;
    const meta = session.ydoc.getMap("meta"),
      shared = session.ydoc.getMap("settings");
    const pull = () =>
      setDoc((d) => {
        const title = meta.get("title");
        return {
          ...d,
          title: typeof title === "string" ? title : d.title,
          settings: { ...normalize({ settings: { ...d.settings, ...shared.toJSON() } }).settings, zoom: d.settings.zoom },
        };
      });
    meta.observe(pull);
    shared.observe(pull);
    pull();
    return () => {
      meta.unobserve(pull);
      shared.unobserve(pull);
    };
  }, [session]);
  // A nickname changed in the profile shows up on this caret for everyone without reopening.
  useEffect(() => {
    if (editor && session && live) editor.commands.updateUser({ id: live.user.id, name: live.user.nickname, color: userColor(live.user.id) });
  }, [editor, session, live?.user.id, live?.user.nickname]);
  const refreshNote = useRef(live?.refresh);
  refreshNote.current = live?.refresh;
  useEffect(() => {
    if (!session) return;
    // Every authentication after mount is a reconnect, often caused by a sharing change.
    const reauthenticated = () => refreshNote.current?.();
    session.provider.on("authenticated", reauthenticated);
    return () => {
      session.provider.off("authenticated", reauthenticated);
    };
  }, [session]);
  useEffect(() => {
    // Without access the server will never confirm pending changes, so there is nothing to wait for.
    if (!session || status.denied) return;
    const warn = (event: BeforeUnloadEvent) => {
      if (session.provider.hasUnsyncedChanges) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [session, status.denied]);
  useEffect(() => {
    accountRef.current.changed(doc);
    // Live notes are saved by the collaboration server as they change.
    if (session) return;
    setSaved(false);
    const timer = setTimeout(() => {
      const snapshot = doc;
      saveSequence.current = saveSequence.current
        .catch(() => {})
        .then(() => accountRef.current.persist(snapshot));
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
    if (session) return;
    const flush = () => {
      saveSequence.current = saveSequence.current
        .catch(() => {})
        .then(() => accountRef.current.persist(docRef.current));
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
    const keys = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        downloadDocument();
      }
      if (e.key === "Escape") {
        setSlash(null);
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
    if (session && live) {
      const { zoom, ...rest } = patch;
      if (zoom !== undefined) {
        setDoc((d) => ({ ...d, settings: { ...d.settings, zoom } }));
        try {
          localStorage.setItem(zoomKey(live.note.id), String(zoom));
        } catch {
          /* Zoom is a per-browser convenience. */
        }
      }
      const shared = session.ydoc.getMap("settings");
      session.ydoc.transact(() => {
        for (const [key, value] of Object.entries(rest)) shared.set(key, value);
      });
      return;
    }
    setDoc((d) => ({
      ...d,
      settings: { ...d.settings, ...patch },
      updatedAt: Date.now(),
    }));
  }
  function setTitle(title: string) {
    if (session) session.ydoc.getMap("meta").set("title", title);
    else setDoc((d) => ({ ...d, title, updatedAt: Date.now() }));
  }
  async function downloadDocument() {
    try {
      const snapshot = docRef.current;
      const portable = await portableDocument(snapshot);
      saveFile(new Blob([JSON.stringify(portable, null, 2)], {type: "application/json"}),
        `${(snapshot.title.trim() || "새로운 문서").replace(/[\\/:*?"<>|]/g, "-")}.paperdown.json`);
      flash("서식과 이미지를 포함한 문서를 저장했습니다.");
      return true;
    } catch (e) {
      flash(e instanceof Error ? e.message : "문서를 내려받지 못했습니다.");
      return false;
    }
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
      // Replacing a shared note would overwrite everyone's work; open the file as a new note.
      if (session) account.create(data);
      else openDialog({ kind: "import", data });
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
        const src = account.upload
          ? await account.upload(await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("이미지를 처리하지 못했습니다.")), "image/png")))
          : canvas.toDataURL("image/png");
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
    setBusy("PDF 만드는 중");
    try {
      await pdf(editor.view.dom, s, pages, filename);
      flash("텍스트 PDF를 다운로드했습니다.");
    } catch (e) {
      flash(e instanceof Error ? e.message : "PDF를 만들지 못했습니다.");
    } finally {
      setBusy("");
    }
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
  const textColor = editor?.getAttributes("textStyle").color as string | undefined,
    highlightColor = editor?.isActive("highlight")
      ? (editor.getAttributes("highlight").color as string | undefined) || "default"
      : undefined;
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
  async function submitDialog() {
    if (!editor || !dialog) return;
    if (dialog.kind === "new") {
      if (!await downloadDocument()) return;
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
      if (!await downloadDocument()) return;
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
  const saveLabel = !session
    ? saved ? "이 기기에 저장됨" : "저장 중"
    : status.denied ? "접근할 수 없음"
    : !status.connected ? "오프라인 · 이 기기에 보관됨"
    : !status.synced ? "연결 중…"
    : status.unsynced ? "저장 중…"
    : "계정에 저장됨";
  const isSaved = session ? saveLabel === "계정에 저장됨" : saved;
  const people = live ? [live.note.owner || live.user, ...(live.note.members || [])] : [];
  const shownDialog = dialog || lastDialog.current;
  if (dialog) lastDialog.current = dialog;
  const withField = shownDialog?.kind === "link" || shownDialog?.kind === "math";
  const mm = (value: string, min: number, max: number) => Math.max(min, Math.min(max, Number(value)));
  return (
    <div className="app" style={style}>
      <Surface as="header" fill="raised" border="bottom" paddingX={phone ? "md" : "xl"} paddingY="lg">
        <Grid columns={phone ? "auto minmax(0, 1fr) auto" : "auto auto minmax(0, 1fr) auto"} gap={phone ? "sm" : "lg"} align="stretch">
          <Inline align="center">
            <Brand onHome={account.home} />
          </Inline>
          {phone ? null : <Divider orientation="vertical" />}
          <Inline align="center" gap="md" minWidth={0}>
            <Box width="full" maxWidth="xl" minWidth={0}>
              <Field
                variant="ghost"
                size="xs"
                aria-label="문서 이름"
                placeholder="새로운 문서"
                value={doc.title}
                readOnly={locked}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Box>
            <Box hideBelow="lg">
              <Inline gap="xs" align="center" aria-live="polite">
                <span aria-hidden className={isSaved ? "save-dot" : "save-dot save-dot-pending"} />
                <Text as="span" variant="label" strong={false} ink="tertiary">{saveLabel}</Text>
              </Inline>
            </Box>
          </Inline>
          <Inline align="center" gap={phone ? "xs" : "sm"}>
            {live && session ? (
              <>
                <Box hideBelow="md">
                  <Presence people={people} online={online} />
                </Box>
                <SharePanel note={live.note} me={live.user} online={online} setMembers={live.setMembers} leave={live.leave} />
              </>
            ) : null}
            {account.accountButton}
            <Box hideBelow="md">
              <IconButton variant="ghost" size="xs" aria-label="새 문서" title="새 문서" onClick={() => (session ? account.create() : openDialog({ kind: "new" }))}>
                <Glyph name="file-plus-2" ink="secondary" />
              </IconButton>
            </Box>
            <IconButton variant="ghost" size="xs" aria-label="문서 열기" title="문서 열기" onClick={() => importRef.current?.click()}>
              <Glyph name="folder-open" ink="secondary" />
            </IconButton>
            <Inline align="stretch" gap="sm">
              <Box hideBelow="md"><Divider orientation="vertical" /></Box>
              <Box hideBelow="md">
                <Button variant="hairline" size="xs" disabled={!!busy} onClick={() => void exportImage(true)}>
                  <Glyph name="copy" />
                  이미지 복사
                </Button>
              </Box>
            </Inline>
            <Floating>
              <Button as={Floating.Trigger} size="xs" disabled={!!busy} aria-label={busy || "내보내기"}>
                {busy ? <Spinner size="inline" ink="inherit" decorative /> : <Glyph name="download" />}
                <Box as="span" hideBelow="md">{busy || "내보내기"}</Box>
                <Glyph name="chevron-down" />
              </Button>
              <Floating.Content as={Surface} fill="raised" radius="md" padding="sm" placement="bottom end" width="xl" maxWidth="full" aria-label="내보내기">
                <Stack gap="md">
                  <Box paddingX="md" paddingY="sm">
                    <Text as="span" variant="label" strong={false} ink="tertiary">완성한 문서를 남기는 방법</Text>
                  </Box>
                  <ExportRow glyph="file-text" title="PDF로 저장" hint={s.mode === "pages" ? `${pages}페이지 · 선택·검색 가능한 텍스트` : "한 장의 긴 문서 · 현재 높이"} tag="PDF" run={() => void exportPdf()} />
                  <ExportRow glyph="image-plus" title="PNG 이미지" hint="현재 문서 전체를 선명하게" tag="PNG" run={() => void exportImage(false)} />
                  <Divider />
                  <ExportRow glyph="panel-top" title="Paperdown 문서" hint="서식 · 표 · 이미지 보존" run={() => void downloadDocument()} />
                  <ExportRow
                    glyph="code-xml"
                    title="Markdown 원본"
                    hint="선택 서식과 정렬은 포함되지 않습니다"
                    tag="MD"
                    run={() => saveFile(new Blob([editor.getMarkdown()], { type: "text/markdown;charset=utf-8" }), `${filename}.md`)}
                  />
                </Stack>
              </Floating.Content>
            </Floating>
          </Inline>
        </Grid>
      </Surface>
      {location.origin === OLD_ORIGIN && (
        <Surface fill="sunken" border="bottom" paddingX="xl" paddingY="sm">
          <Inline justify="center" align="center" gap="xl" wrap>
            <Text as="span" variant="label" strong={false} ink="secondary">
              여백이 <Text as="strong" variant="label" ink="inherit">Paperdown</Text>으로 새로워졌습니다.
            </Text>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                transferWindow.current = window.open(`${NEW_ORIGIN}/#transfer`, "_blank");
                if (!transferWindow.current) flash("팝업을 허용하거나 문서 파일로 저장한 뒤 새 주소에서 열어주세요.");
              }}
            >
              현재 문서와 함께 새 주소로 이동
              <Glyph name="arrow-up-right" />
            </Button>
          </Inline>
        </Surface>
      )}
      {status.denied ? (
        <Surface fill="sunken" border="bottom" paddingX="xl" paddingY="sm" role="alert">
          <Inline justify="center" align="center" gap="md" wrap>
            <Text as="span" variant="label" strong={false} ink="secondary">이 노트에 더 이상 접근할 수 없습니다. 공유가 해제되었거나 노트가 삭제되었습니다.</Text>
            <Button variant="ghost" size="xs" onClick={account.home}>홈으로</Button>
          </Inline>
        </Surface>
      ) : null}
      <Surface as="div" role="toolbar" aria-label="문서 도구 모음" fill="raised" border="bottom" elevation="sticky" top="none" paddingX="xl" paddingY="sm">
        <Box overflowX={phone ? "auto" : undefined}>
          <Inline justify="between" align="center" gap="md" wrap={!phone} minWidth={phone ? "max-content" : undefined}>
            {locked ? (
              <Inline gap="sm" align="center">
                <Glyph name="users" ink="secondary" />
                <Text as="span" variant="label" strong={false} ink="secondary">{status.denied ? "더 이상 편집할 수 없습니다. 지금 화면은 내보내거나 복사할 수 있습니다." : "보기 권한으로 공유받은 노트입니다. 내보내기와 복사는 할 수 있습니다."}</Text>
              </Inline>
            ) : (
            <Inline align="stretch" gap="sm" wrap={!phone}>
              <Inline gap="xs" align="center">
                <Tool label="실행 취소 (⌘Z)" glyph="undo-2" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()} />
                <Tool label="다시 실행 (⇧⌘Z)" glyph="redo-2" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()} />
              </Inline>
              <Divider orientation="vertical" />
              <Inline gap="xs" align="center">
                <Select
                  aria-label="문단 종류"
                  size="xs"
                  value={block}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "p") editor.chain().focus().setParagraph().run();
                    else if (v === "code") editor.chain().focus().toggleCodeBlock().run();
                    else editor.chain().focus().toggleHeading({ level: Number(v[1]) as 1 | 2 | 3 }).run();
                  }}
                >
                  <Select.Option value="p">본문</Select.Option>
                  <Select.Option value="h1">제목 1</Select.Option>
                  <Select.Option value="h2">제목 2</Select.Option>
                  <Select.Option value="h3">제목 3</Select.Option>
                  <Select.Option value="code">코드 블록</Select.Option>
                </Select>
                <Box width="sm">
                  <Field
                    key={`${sizeValue}-${editor.state.selection.empty}`}
                    size="xs"
                    type="number"
                    numeric
                    aria-label="글자 크기"
                    min="6"
                    max="96"
                    step=".5"
                    defaultValue={sizeValue}
                    list="font-sizes"
                    trailing={<Text as="span" variant="caption" ink="tertiary">pt</Text>}
                    onBlur={(e) => {
                      if (e.currentTarget.value !== sizeValue) applySize(e.currentTarget.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                    }}
                  />
                </Box>
                <Box as="datalist" id="font-sizes">
                  {[6, 8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48, 72, 96].map((v) => (
                    <Box as="option" key={v} value={v} />
                  ))}
                </Box>
              </Inline>
              <Divider orientation="vertical" />
              <Inline gap="xs" align="center">
                <Tool label="굵게 (⌘B)" glyph="bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} />
                <Tool label="기울임 (⌘I)" glyph="italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} />
                <Tool label="취소선" glyph="strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} />
                <Tool label="강조" glyph="highlighter" active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight().run()} />
                <ColorMenu
                  text={textColor}
                  highlight={highlightColor}
                  setText={(color) => (color ? editor.chain().focus().setColor(color).run() : editor.chain().focus().unsetColor().run())}
                  setHighlight={(color) => (color ? editor.chain().focus().setHighlight({ color }).run() : editor.chain().focus().unsetHighlight().run())}
                />
                <Tool label="인라인 코드" glyph="code-xml" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()} />
                <Tool label="링크" glyph="link" active={editor.isActive("link")} onClick={() => openDialog({ kind: "link", value: editor.getAttributes("link").href || "" })} />
              </Inline>
              <Divider orientation="vertical" />
              <Inline gap="xs" align="center">
                <Tool label="왼쪽 정렬" glyph="align-left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} />
                <Tool label="가운데 정렬" glyph="align-center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} />
                <Tool label="오른쪽 정렬" glyph="align-right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} />
                <Select aria-label="줄 간격" size="xs" value={s.leading} onChange={(e) => settings({ leading: Number(e.target.value) })}>
                  {[1, 1.15, 1.3, 1.5, 1.6, 1.9, 2, 2.5, 3].map((v) => (
                    <Select.Option key={v} value={v}>{`↕ ${v}`}</Select.Option>
                  ))}
                </Select>
              </Inline>
              <Divider orientation="vertical" />
              <Inline gap="xs" align="center">
                <Tool label="글머리 목록" glyph="list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} />
                <Tool label="번호 목록" glyph="list-ordered" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
                <Tool label="체크리스트" glyph="list-todo" active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()} />
                <Tool label="인용" glyph="quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
              </Inline>
              <Divider orientation="vertical" />
              <Inline gap="xs" align="center">
                <Tool label="이미지 넣기" glyph="image-plus" onClick={() => imageRef.current?.click()} />
                <Floating>
                  <IconButton as={Floating.Trigger} size="xs" variant="ghost" aria-label="표" title="표" aria-current={editor.isActive("table") || undefined} onMouseDown={(e: MouseEvent) => e.preventDefault()}>
                    <Glyph name="table-2" ink={editor.isActive("table") ? "primary" : "secondary"} />
                  </IconButton>
                  <Floating.Content as={Surface} fill="raised" radius="md" padding="xs" placement="bottom start" restoreFocus={false} aria-label="표 편집">
                    <Stack gap="xs" minWidth="md">
                      {editor.isActive("table") ? (
                        <>
                          <TableItem label="아래에 행 추가" run={() => editor.chain().focus().addRowAfter().run()} />
                          <TableItem label="오른쪽에 열 추가" run={() => editor.chain().focus().addColumnAfter().run()} />
                          <TableItem label="선택 행 삭제" run={() => editor.chain().focus().deleteRow().run()} />
                          <TableItem label="선택 열 삭제" run={() => editor.chain().focus().deleteColumn().run()} />
                          <TableItem label="표 삭제" run={() => editor.chain().focus().deleteTable().run()} />
                        </>
                      ) : (
                        <TableItem label="3 × 3 표 넣기" run={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} />
                      )}
                    </Stack>
                  </Floating.Content>
                </Floating>
                <Tool label="수식 넣기" glyph="sigma" onClick={() => openDialog({ kind: "math" })} />
                <Tool label="구분선" glyph="minus" onClick={() => editor.chain().focus().setHorizontalRule().run()} />
              </Inline>
            </Inline>
            )}
            <Inline align="center" gap="sm">
              {locked ? null : (
              <Floating>
                <Button as={Floating.Trigger} variant="ghost" size="xs">
                  <Glyph name="settings-2" />
                  페이지 옵션
                  <Glyph name="chevron-down" />
                </Button>
                <Floating.Content as={Surface} fill="raised" radius="md" padding="xl" width="xl" maxWidth="full" placement="bottom end" aria-label="페이지 옵션">
                  <Stack gap="lg">
                    <Inline justify="between" align="center">
                      <Text as="h2" variant="subheading">페이지 옵션</Text>
                      <IconButton as={Floating.Close} size="xs" variant="ghost" aria-label="페이지 옵션 닫기">
                        <Glyph name="x" />
                      </IconButton>
                    </Inline>
                    <Stack gap="sm">
                      <SegmentControl aria-label="페이지 방식" fullWidth value={s.mode} onValueChange={(mode) => settings({ mode: mode as Settings["mode"] })}>
                        <SegmentControl.Item value="continuous">무한 높이</SegmentControl.Item>
                        <SegmentControl.Item value="pages">페이지 분할</SegmentControl.Item>
                      </SegmentControl>
                      <Text as="p" variant="label" strong={false} ink="tertiary">
                        {s.mode === "continuous" ? "내용과 위아래 여백에 딱 맞는 한 장의 문서입니다." : "용지 높이에 맞춰 종이를 나눕니다."}
                      </Text>
                    </Stack>
                    <Stack gap="md">
                      <OptionRow label="페이지 크기">
                        <Box width="lg">
                          <Select size="sm" aria-label="페이지 크기" value={s.paper} onChange={(e) => settings({ paper: e.target.value as Settings["paper"] })}>
                            <Select.Option value="a4">A4 · 210 × 297 mm</Select.Option>
                            <Select.Option value="a5">A5 · 148 × 210 mm</Select.Option>
                            <Select.Option value="letter">Letter · 216 × 279 mm</Select.Option>
                            <Select.Option value="custom">사용자 지정</Select.Option>
                          </Select>
                        </Box>
                      </OptionRow>
                      {s.paper === "custom" && (
                        <Inline gap="lg" justify="between" align="start">
                          <Stack gap="xs">
                            <Text as="span" variant="label" strong={false} ink="secondary">너비</Text>
                            <Box width="sm">
                              <Field size="sm" type="number" numeric aria-label="페이지 너비" min="80" max="500" key={s.width} defaultValue={s.width} trailing={<Text as="span" variant="caption" ink="tertiary">mm</Text>} onBlur={(e) => settings({ width: mm(e.target.value, 80, 500) })} />
                            </Box>
                          </Stack>
                          <Stack gap="xs">
                            <Text as="span" variant="label" strong={false} ink="secondary">높이</Text>
                            <Box width="sm">
                              <Field size="sm" type="number" numeric aria-label="페이지 높이" min="80" max="2000" key={s.height} defaultValue={s.height} disabled={s.mode === "continuous"} trailing={<Text as="span" variant="caption" ink="tertiary">mm</Text>} onBlur={(e) => settings({ height: mm(e.target.value, 80, 2000) })} />
                            </Box>
                          </Stack>
                        </Inline>
                      )}
                      <OptionRow label="방향">
                        <Box width="sm">
                          <Select size="sm" aria-label="페이지 방향" value={s.landscape ? "landscape" : "portrait"} onChange={(e) => settings({ landscape: e.target.value === "landscape" })}>
                            <Select.Option value="portrait">세로</Select.Option>
                            <Select.Option value="landscape">가로</Select.Option>
                          </Select>
                        </Box>
                      </OptionRow>
                      <OptionRow label="여백">
                        <Box width="sm">
                          <Field size="sm" type="number" numeric aria-label="페이지 여백" min="5" max="50" key={s.margin} defaultValue={s.margin} trailing={<Text as="span" variant="caption" ink="tertiary">mm</Text>} onBlur={(e) => settings({ margin: mm(e.target.value, 5, 50) })} />
                        </Box>
                      </OptionRow>
                    </Stack>
                    <Divider />
                    <Inline justify="between" gap="md">
                      <Text as="span" variant="label" strong={false} ink="tertiary">
                        {s.mode === "continuous" ? `${Math.round(dim.width)} mm · 내용 높이` : `${Math.round(dim.width)} × ${Math.round(dim.height)} mm`}
                      </Text>
                      <Text as="span" variant="label" strong={false} ink="tertiary">{s.mode === "continuous" ? "내용에 맞춤" : `${pages}페이지`}</Text>
                    </Inline>
                    {s.mode === "continuous" && (
                      <Text as="p" variant="label" strong={false} ink="tertiary">
                        무한 높이는 내용에 맞춰 자동으로 늘고 줄어듭니다. 고정 높이는 페이지 분할에서 설정하세요.
                      </Text>
                    )}
                  </Stack>
                </Floating.Content>
              </Floating>
              )}
              <Select
                aria-label="화면 배율"
                size="xs"
                variant="ghost"
                value={s.zoom}
                onChange={(e) => settings({ zoom: e.target.value === "fit" ? "fit" : Number(e.target.value) })}
              >
                <Select.Option value="fit">너비 맞춤</Select.Option>
                {[50, 75, 100, 125, 150, 175, 200].map((v) => (
                  <Select.Option key={v} value={v}>{`${v}%`}</Select.Option>
                ))}
              </Select>
            </Inline>
          </Inline>
        </Box>
      </Surface>
      <main className="workspace" ref={stageRef}>
        <div className="document-stage" style={{ width: (width + 2) * zoom }}>
          <Stack gap="md">
          <Inline justify="between" gap="md">
            <Text as="span" variant="label" strong={false} ink="tertiary">
              {s.paper === "custom" ? "CUSTOM" : s.paper.toUpperCase()} · {s.mode === "pages" ? `${pages} PAGES` : "CONTINUOUS"}
            </Text>
            <Box hideBelow="md">
              <Text as="span" variant="label" strong={false} ink="tertiary">{readOnly ? "보기 전용" : "클릭해서 바로 쓰세요"}</Text>
            </Box>
          </Inline>
          <div className={`paper-stack ${s.mode === "pages" ? "paginated" : "continuous"}`} style={{ zoom, minHeight: s.mode === "pages" ? pages * height + (pages - 1) * 24 : 0 }}>
            {s.mode === "pages" && (
              <div className="page-surfaces" aria-hidden="true">
                {Array.from({ length: pages }, (_, i) => (
                  <div key={i} className="page-surface" style={{ top: i * (height + 24) }}>
                    <span className="page-number">{i + 1}</span>
                  </div>
                ))}
              </div>
            )}
            <EditorContent editor={editor} />
          </div>
          <Stack align="center">
            <Text as="span" variant="label" strong={false} ink="tertiary">문서 끝</Text>
          </Stack>
          </Stack>
        </div>
      </main>
      <Surface as="footer" fill="raised" border="top" paddingX="xl" paddingY="sm" className="statusbar">
        <Inline justify="between" align="center" gap="xl" wrap>
          <Inline gap="xl" align="center" wrap>
            <Inline gap="md" align="stretch">
              <Quiet>{s.mode === "pages" ? `${pages}페이지` : "무한 높이"}</Quiet>
              <Divider orientation="vertical" />
              <Quiet>{Math.max(1, Math.ceil(stats.words / 200))}분 읽기</Quiet>
            </Inline>
            <Inline gap="lg" align="center" wrap role="group" aria-label="문서 통계">
              <Count value={stats.words} unit="단어" />
              <span title="문단과 줄바꿈 기준 · 자동 줄바꿈 제외"><Count value={stats.lines} unit="줄" /></span>
              <Count value={stats.chars} unit="자" of="공백 포함" />
              <Count value={stats.compact} unit="자" of="공백 제외" />
              {selection && (
                <Inline gap="lg" align="stretch">
                  <Divider orientation="vertical" />
                  <Quiet>선택 {selected.chars}자</Quiet>
                </Inline>
              )}
            </Inline>
          </Inline>
          <Box hideBelow="lg">
            <Quiet>{!session ? "이 브라우저에 자동 저장" : readOnly ? "보기 전용 · 바뀌는 내용이 바로 반영됩니다" : "함께 쓰는 내용이 계정에 바로 저장됩니다"}</Quiet>
          </Box>
        </Inline>
      </Surface>
      <span ref={slashAnchor} className="caret-anchor" style={{ left: slash?.left ?? 0, top: slash?.top ?? 0 }} />
      <Floating open={!!slash && slashItems.length > 0} onOpenChange={() => {}}>
        <Floating.Content
          as={Surface}
          fill="raised"
          radius="md"
          padding="xs"
          width="lg"
          maxHeight="xl"
          overflowY="auto"
          anchorRef={slashAnchor}
          placement="bottom start"
          flip={false}
          role="listbox"
          dismissable={false}
          keyboardDismissDisabled
          autoFocus={false}
          restoreFocus={false}
          aria-label="블록 추가"
        >
          <Stack gap="xs">
            <Box paddingX="md" paddingY="sm">
              <Text as="span" variant="label" strong={false} ink="tertiary">블록 추가</Text>
            </Box>
            {slashItems.map((item, index) => (
              <Button
                key={item.label}
                variant="ghost"
                size="lg"
                fullWidth
                justify="start"
                selected={index === slashIndex}
                role="option"
                aria-selected={index === slashIndex}
                onMouseDown={(e: MouseEvent) => e.preventDefault()}
                onClick={() => runSlash(index)}
              >
                <Stack as="span" align="start">
                  <Text as="span" ink="inherit">{item.label}</Text>
                  <Text as="span" variant="label" strong={false} ink="tertiary">{item.hint}</Text>
                </Stack>
              </Button>
            ))}
          </Stack>
        </Floating.Content>
      </Floating>
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
        <Portal>
          <Box className="toast-dock">
            <Surface theme="inverse" fill="canvas" radius="md" elevation="toast" paddingX="lg" paddingY="sm" role="status">
              <Inline gap="md" align="center">
                <Glyph name="check" />
                <Text as="span" variant="caption" ink="inherit">{notice}</Text>
                <IconButton size="xs" variant="ghost" aria-label="알림 닫기" onClick={() => setNotice("")}>
                  <Glyph name="x" />
                </IconButton>
              </Inline>
            </Surface>
          </Box>
        </Portal>
      )}
      <Floating open={!!dialog} onOpenChange={(open) => !open && setDialog(null)}>
        <Floating.Content
          as={Surface}
          fill="raised"
          radius="md"
          padding="xl"
          width={phone ? "xl" : "measure.xs"}
          maxWidth="full"
          presentation="modal"
          restoreFocus={false}
          initialFocusRef={withField ? dialogField : undefined}
          aria-label={shownDialog ? DIALOG_TITLES[shownDialog.kind] : "대화상자"}
        >
          <Stack gap="lg">
            <Inline justify="between" align="center" gap="md">
              <Text as="h2" variant="subheading">{shownDialog ? DIALOG_TITLES[shownDialog.kind] : ""}</Text>
              <IconButton as={Floating.Close} size="xs" variant="ghost" aria-label="대화상자 닫기">
                <Glyph name="x" />
              </IconButton>
            </Inline>
            <Stack
              as="form"
              gap="xl"
              onSubmit={(e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                void submitDialog();
              }}
            >
              {withField ? (
                <FormField
                  label={shownDialog?.kind === "link" ? "링크 주소" : "수식 입력"}
                  description={shownDialog?.kind === "link" ? "주소를 비우면 링크를 해제합니다." : "삽입한 수식을 클릭하면 다시 편집합니다."}
                >
                  <Field ref={dialogField} size="md" value={dialogValue} onChange={(e) => setDialogValue(e.target.value)} placeholder={shownDialog?.kind === "link" ? "https://example.com" : "E = mc^2"} />
                </FormField>
              ) : (
                <Text as="p" ink="secondary">
                  {shownDialog?.kind === "new"
                    ? "현재 문서를 파일로 내려받아 보관한 뒤 새 문서를 시작합니다."
                    : `“${shownDialog?.data?.title}” 문서를 불러옵니다. 현재 문서는 먼저 파일로 내려받아 보관합니다.`}
                </Text>
              )}
              <Inline justify="end" gap="sm" wrap>
                <Button variant="hairline" size="sm" onClick={() => setDialog(null)}>취소</Button>
                {shownDialog?.kind === "new" && (
                  <Button variant="hairline" size="sm" onClick={() => void downloadDocument()}>현재 문서 저장</Button>
                )}
                <Button type="submit" size="sm">
                  {shownDialog?.kind === "new" ? "새 문서" : withField ? "적용" : "불러오기"}
                </Button>
              </Inline>
            </Stack>
          </Stack>
        </Floating.Content>
      </Floating>
    </div>
  );
}
