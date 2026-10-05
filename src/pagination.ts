import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { EditorView } from "@tiptap/pm/view";
export const paginationKey = new PluginKey("paperdown-pages");
export type PageLayout = {
  enabled: boolean;
  height: number;
  margin: number;
  gap: number;
};
type Break = { pos: number; height: number; inline: boolean };
// Page spacers are view decorations, never document content or undo steps.
export function pagination(getLayout: () => PageLayout) {
  return Extension.create({
    name: "paperdownPages",
    addProseMirrorPlugins() {
      return [
        new Plugin<{ decorations: DecorationSet; breaks: Break[] }>({
          key: paginationKey,
          state: {
            init: () => ({ decorations: DecorationSet.empty, breaks: [] }),
            apply(tr, state) {
              const breaks = tr.getMeta(paginationKey) as Break[] | undefined;
              if (breaks) {
                return {
                  breaks,
                  decorations: DecorationSet.create(
                    tr.doc,
                    breaks.map((b, i) =>
                      Decoration.widget(
                        b.pos,
                        () => {
                          const el = document.createElement("span");
                          el.className = "page-spacer";
                          el.dataset.pageSpacer = String(b.height);
                          el.style.height = `${b.height}px`;
                          el.contentEditable = "false";
                          el.setAttribute("aria-hidden", "true");
                          return el;
                        },
                        { key: `page-${i}-${b.pos}-${b.height}`, side: -1 },
                      ),
                    ),
                  ),
                };
              }
              return {
                breaks: state.breaks,
                decorations: state.decorations.map(tr.mapping, tr.doc),
              };
            },
          },
          props: {
            decorations(state) {
              return this.getState(state)?.decorations;
            },
          },
          view(view) {
            let frame = 0;
            let destroyed = false;
            function schedule() {
              cancelAnimationFrame(frame);
              frame = requestAnimationFrame(measure);
            }
            function measure() {
              if (destroyed) return;
              const layout = getLayout();
              const previous: Break[] =
                paginationKey.getState(view.state)?.breaks || [];
              if (!layout.enabled) {
                if (previous.length)
                  view.dispatch(
                    view.state.tr
                      .setMeta(paginationKey, [])
                      .setMeta("addToHistory", false),
                  );
                return;
              }
              const root = view.dom as HTMLElement,
                rect = root.getBoundingClientRect(),
                scale =
                  rect.width / parseFloat(getComputedStyle(root).width) || 1;
              const stride = layout.height + layout.gap,
                inner = layout.height - 2 * layout.margin;
              const oldSpacers = Array.from(
                root.querySelectorAll<HTMLElement>("[data-page-spacer]"),
              ).map((el) => ({
                top: (el.getBoundingClientRect().top - rect.top) / scale,
                height: Number(el.dataset.pageSpacer),
              }));
              const baseY = (raw: number) =>
                raw -
                oldSpacers
                  .filter((s) => s.top < raw - 0.5)
                  .reduce((sum, s) => sum + s.height, 0);
              const breaks: Break[] = [];
              let added = 0;
              function place(
                pos: number,
                top: number,
                bottom: number,
                inline: boolean,
              ) {
                let y = top + added;
                const page = Math.max(
                  0,
                  Math.floor((y - layout.margin + 0.1) / stride),
                );
                const limit = page * stride + layout.height - layout.margin;
                if (
                  bottom - top <= inner &&
                  bottom + added > limit + 0.5 &&
                  y > page * stride + layout.margin + 1
                ) {
                  const height = Math.max(
                    0,
                    (page + 1) * stride + layout.margin - y,
                  );
                  if (height > 1) {
                    breaks.push({
                      pos,
                      height: Math.round(height * 100) / 100,
                      inline,
                    });
                    added += height;
                  }
                }
              }
              view.state.doc.forEach((node, pos, index) => {
                const el = view.nodeDOM(pos) as HTMLElement | null;
                if (!el?.getBoundingClientRect) return;
                const r = el.getBoundingClientRect();
                const top = baseY((r.top - rect.top) / scale),
                  bottom = baseY((r.bottom - rect.top) / scale);
                if (node.isTextblock && bottom - top > inner) {
                  let lastTop = -1;
                  node.descendants((child, offset) => {
                    if (!child.isText) return;
                    const text = child.text || "";
                    for (let i = 0; i < text.length;) {
                      const p = pos + 1 + offset + i;
                      const c = view.coordsAtPos(p, 1);
                      const t = baseY((c.top - rect.top) / scale);
                      const b = baseY((c.bottom - rect.top) / scale);
                      if (Math.abs(t - lastTop) > 2) {
                        place(p, t, b, true);
                        lastTop = t;
                      }
                      i += text.codePointAt(i)! > 0xffff ? 2 : 1;
                    }
                  });
                } else {
                  let keepTo = bottom;
                  if (
                    node.type.name === "heading" &&
                    index + 1 < view.state.doc.childCount
                  ) {
                    const next = view.nodeDOM(
                      pos + node.nodeSize,
                    ) as HTMLElement | null;
                    if (next) {
                      const nextRect = next.getBoundingClientRect();
                      const nextTop = baseY((nextRect.top - rect.top) / scale);
                      const line =
                        parseFloat(getComputedStyle(next).lineHeight) || 24;
                      keepTo = Math.max(
                        bottom,
                        nextTop + Math.min(nextRect.height / scale, line * 2),
                      );
                    }
                  }
                  place(pos, top, keepTo, false);
                }
              });
              const same =
                previous.length === breaks.length &&
                previous.every(
                  (b, i) =>
                    b.pos === breaks[i].pos &&
                    Math.abs(b.height - breaks[i].height) < 0.5,
                );
              if (!same)
                view.dispatch(
                  view.state.tr
                    .setMeta(paginationKey, breaks)
                    .setMeta("addToHistory", false),
                );
            }
            const observer = new ResizeObserver(schedule);
            observer.observe(view.dom);
            document.fonts.ready.then(schedule);
            schedule();
            return {
              update(next: EditorView, prev) {
                if (next.state.doc !== prev.doc || next.state !== prev)
                  schedule();
              },
              destroy() {
                destroyed = true;
                cancelAnimationFrame(frame);
                observer.disconnect();
              },
            };
          },
        }),
      ];
    },
  });
}
