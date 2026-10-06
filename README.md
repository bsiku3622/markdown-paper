# Paperdown

A document editor for writing on paper. [Open Paperdown](https://paperdown.bsiku.dev).

Write directly in the finished layout, with Markdown input shortcuts and a compact formatting toolbar. Paperdown uses the Paper UI palette, Pretendard, and Noto Serif KR (Source Han Serif). Format selected text, add headings, lists, checklists, links, quotes, tables, images, and LaTeX math. Slash commands and undo/redo keep editing close to the document.

## Pages and exports

Choose A4, A5, Letter, or custom dimensions, portrait or landscape, margins, and screen zoom. Continuous documents fit their content and vertical margins exactly. Paginated documents use the selected page height and visual page spacers that never become document content. Font sizes use points, including 9pt and 10pt; display zoom does not change exported dimensions.

Copy the document as an image or download PNG and PDF. Continuous PDFs use one page fitted to the content; paginated PDFs preserve page dimensions and exclude the screen gaps between sheets. PDFs currently preserve appearance as raster images rather than selectable text. Very long exports reduce raster resolution to stay within browser canvas limits; export height is limited to 28,000 CSS pixels, with continuous PDF pages limited to 5 metres. Large indivisible blocks such as tables should be split manually when they exceed one page.

Download a `.paperdown.json` file to preserve all rich formatting and embedded images, or `.md` for portable Markdown. Markdown does not preserve all font, alignment, or highlight attributes. Opening another document or starting a new one first downloads a backup of the current document.

## Storage and migration

Documents and images are saved in this browser's IndexedDB, with a local storage fallback. There is no account, backend, or cloud document storage. Clearing browser site data removes drafts, so keep document file backups. Imported image files are embedded locally. Remote image hosts must allow CORS for image exports.

The former address, `markdown.bsiku.dev`, remains available to recover existing local drafts. Its migration button opens Paperdown and transfers the current document directly between the browser windows using origin- and source-checked messages. Documents are never uploaded to a server during migration. The legacy address intentionally does not redirect before users can recover their browser storage.

## Development

Use Node.js 22.18+ (the test command uses native TypeScript support).

```sh
npm ci
npm run dev
npm test
npm run build
```

Vercel uses the Vite preset, `npm run build`, and `dist`. Paper UI is vendored so deployment does not depend on a sibling checkout. Both domains use the DNS-only Cloudflare CNAME `66ced14c5a41ace9.vercel-dns-017.com`.

## Shortcuts

- Command/Ctrl + S: download the complete Paperdown document.
- Command/Ctrl + B / I: bold / italic.
- Command/Ctrl + Z: undo; Shift + Command/Ctrl + Z: redo.
- `/`: insert a block; arrow keys and Enter navigate the command menu.
- Escape: close menus and dialogs.

## License

MIT © Jaewon Baek. Vendored Paper UI retains its MIT license. Pretendard and Noto Serif KR retain their respective SIL Open Font Licenses.
