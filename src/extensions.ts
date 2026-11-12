import type { AnyExtension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { TableKit } from "@tiptap/extension-table";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyleKit } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Mathematics, { type MathematicsOptions } from "@tiptap/extension-mathematics";

// Book-ink colours stay fixed hex values so paper, PNG, and PDF print the same.
export const TEXT_COLORS = [
  { name: "회색", value: "#6e6e73" },
  { name: "빨강", value: "#c80020" },
  { name: "주황", value: "#c2410c" },
  { name: "황토", value: "#8d5300" },
  { name: "초록", value: "#00763d" },
  { name: "파랑", value: "#1c55d4" },
  { name: "보라", value: "#7a2fbf" },
] as const;
export const HIGHLIGHT_COLORS = [
  { name: "노랑", value: "#fcefb4" },
  { name: "주황", value: "#ffe2c6" },
  { name: "분홍", value: "#fbdde3" },
  { name: "보라", value: "#e9ddf8" },
  { name: "파랑", value: "#dce7ff" },
  { name: "초록", value: "#d5f0dc" },
  { name: "회색", value: "#e8e8ea" },
] as const;

export type DocumentExtensionOptions = {
  // Private account images need credentialed requests; omit for the CLI renderer.
  privateImage?: (src: string) => boolean;
  // Corner handles only make sense in an editable browser view.
  resizable?: boolean;
  // Yjs owns undo history in collaborative documents.
  history?: boolean;
  math?: Partial<Pick<MathematicsOptions, "inlineOptions" | "blockOptions">>;
};

// The document schema shared by the editor, the PDF CLI, and the collaboration server.
export function documentExtensions(options: DocumentExtensionOptions = {}): AnyExtension[] {
  const { privateImage } = options;
  return [
    StarterKit.configure({
      link: { openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer" } },
      // Live documents use Yjs undo and a trailing paragraph that ignores remote changes (see live.ts).
      ...(options.history === false ? { undoRedo: false, trailingNode: false } : {}),
    }),
    Markdown,
    TableKit.configure({ table: { resizable: true } }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Image.extend({
      addAttributes() {
        const attributes = this.parent?.() || {};
        return {
          ...attributes,
          src: {
            default: null,
            renderHTML: (attrs: { src?: string | null }) =>
              privateImage
                ? { src: attrs.src, crossorigin: privateImage(attrs.src || "") ? "use-credentials" : "anonymous" }
                : { src: attrs.src },
          },
        };
      },
      addNodeView() {
        const factory = this.parent?.();
        if (!factory) return null;
        return (props) => {
          const view = factory(props) as unknown as {
            dom: HTMLElement;
            element: HTMLElement;
            isResizing?: boolean;
            handleResize?: (dx: number, dy: number) => void;
            handleMouseUp?: () => void;
            handleTouchMove?: (event: TouchEvent) => void;
            destroy?: () => void;
          };
          // Tiptap commits a resize only on mouseup and never removes its touchmove listener,
          // so a finger drag would change the image on screen without saving it. Finish
          // touch drags through the same commit path.
          const stopListening = () => {
            document.removeEventListener("touchend", finishTouch);
            document.removeEventListener("touchcancel", finishTouch);
            if (view.handleTouchMove) document.removeEventListener("touchmove", view.handleTouchMove);
          };
          function finishTouch() {
            stopListening();
            if (view.isResizing) view.handleMouseUp?.();
          }
          const startTouch = (event: TouchEvent) => {
            if (!(event.target as HTMLElement | null)?.closest?.("[data-resize-handle]")) return;
            document.addEventListener("touchend", finishTouch);
            document.addEventListener("touchcancel", finishTouch);
          };
          view.dom?.addEventListener("touchstart", startTouch, { capture: true });
          const destroy = view.destroy?.bind(view);
          view.destroy = () => {
            view.dom?.removeEventListener("touchstart", startTouch, { capture: true });
            stopListening();
            destroy?.();
          };
          // The page stack uses CSS zoom: pointer deltas are screen pixels,
          // while the stored width is in unzoomed document pixels.
          const resize = view.handleResize?.bind(view);
          if (resize)
            view.handleResize = (dx, dy) => {
              const { element } = view;
              const scale = element.offsetWidth ? element.getBoundingClientRect().width / element.offsetWidth : 1;
              resize(dx / (scale || 1), dy / (scale || 1));
            };
          return view as unknown as ReturnType<typeof factory>;
        };
      },
    }).configure({
      allowBase64: true,
      HTMLAttributes: privateImage ? { crossorigin: "anonymous" } : {},
      resize: options.resizable
        ? { enabled: true, minWidth: 48, minHeight: 24, alwaysPreserveAspectRatio: true }
        : false,
    }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    // The document typeface is fixed; pasted font families are not kept.
    TextStyleKit.configure({ fontFamily: false }),
    Highlight.configure({ multicolor: true, HTMLAttributes: { class: "text-highlight" } }),
    Mathematics.configure({ katexOptions: { throwOnError: false }, ...options.math }),
  ];
}
