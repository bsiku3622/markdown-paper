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
      ...(options.history === false ? { undoRedo: false } : {}),
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
            element: HTMLElement;
            handleResize?: (dx: number, dy: number) => void;
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
