# Paperdown

A document editor for writing on paper. [Open Paperdown](https://paperdown.bsiku.dev).

Write directly in the finished layout, with Markdown input shortcuts and a compact formatting toolbar. Paperdown uses the Paper UI palette, Pretendard for Gothic text, and Times New Roman for Latin text with Noto Serif KR (Source Han Serif) for Korean in Myeongjo mode. Times New Roman uses the installed system font with Times/Noto fallbacks. Format selected text, add headings, lists, checklists, links, quotes, tables, images, and LaTeX math. Slash commands and undo/redo keep editing close to the document. Typing `->` or `-->` produces `→`, `=>` or `==>` produces `⇒`, and `--` produces an em dash `—`. Code blocks and inline code preserve literal text; Backspace immediately after a substitution restores the typed sequence.

## Pages and exports

Choose A4, A5, Letter, or custom dimensions, portrait or landscape, margins, and screen zoom. Continuous documents fit their content and vertical margins exactly. Paginated documents use the selected page height and visual page spacers that never become document content. Font sizes use points, including 9pt and 10pt; display zoom does not change exported dimensions.

Copy the document as an image or download PNG and PDF. Continuous PDFs use one page fitted to the content; paginated PDFs preserve page dimensions and exclude the screen gaps between sheets. PDFs currently preserve appearance as raster images rather than selectable text. Very long exports reduce raster resolution to stay within browser canvas limits; export height is limited to 28,000 CSS pixels, with continuous PDF pages limited to 5 metres. Large indivisible blocks such as tables should be split manually when they exceed one page.

Download a `.paperdown.json` file to preserve all rich formatting and embedded images, or `.md` for portable Markdown. Markdown does not preserve all font, alignment, or highlight attributes. Opening another document or starting a new one first downloads a backup of the current document.

## Storage and migration

Guests keep their document and embedded images in browser IndexedDB, with a local storage fallback. Register or log in with a username and password to manage multiple notes in a private account. The first account session imports the current guest document without removing the guest copy. Account notes save automatically to the API and retain unsynced drafts in an account-scoped browser cache. Concurrent edits use server revisions; conflicting drafts can be copied into a new note instead of overwriting another device's changes.

Account images are stored behind the same authenticated API. Paperdown document downloads embed uploaded images so the downloaded file remains usable after logout. Remote image hosts must allow CORS for image exports. Clearing browser site data removes local drafts, so export unsynced work before clearing it. Account storage allows 1,000 active notes, 100MB of note data, and 500MB of uploaded images per account. Deleted notes remain soft-deleted in the database.

The former address, `markdown.bsiku.dev`, remains available to recover existing local drafts. Its migration button opens Paperdown and transfers the current document directly between the browser windows using origin- and source-checked messages. Documents are never uploaded to a server during migration. The legacy address intentionally does not redirect before users can recover their browser storage.

## Development

Use Node.js 22.18+ (the test command uses native TypeScript support).

```sh
npm ci
npm run dev
npm test
npm run build
```

For a local account API, use Node.js 22.18+ and run it with a separate data directory and the local frontend origin. In a second terminal, set the API URL before starting Vite:

```sh
DATA_DIR=backend/data ALLOWED_ORIGINS=http://localhost:4325 PUBLIC_URL=http://localhost:8792 COOKIE_SECURE=false npm run api
VITE_API_URL=http://localhost:8792 npm run dev
```

Production runs `paperdown-api.service` on the SSH server, bound to loopback port 8792 and exposed through the existing Cloudflare Tunnel at `paperdown-api.bsiku.dev`. The environment file is `/etc/paperdown-api.env`; account data lives in `/var/lib/paperdown`. Passwords use salted scrypt hashes, sessions use hashed tokens and Secure/HttpOnly cookies, and mutation requests require the exact configured frontend origin. The daily `paperdown-backup.timer` snapshots SQLite and private files into `/var/backups/paperdown`. Backups currently remain on the same server and have no automatic retention policy. Unit and backup templates are in `deploy/`.

Vercel uses the Vite preset, `npm run build`, and `dist`. Paper UI is vendored so deployment does not depend on a sibling checkout. Both domains use the DNS-only Cloudflare CNAME `66ced14c5a41ace9.vercel-dns-017.com`.

## PDF CLI

Install the local command with `npm run install:cli`, then run `paperdown-pdf notes.md -o notes.pdf`. Markdown defaults to A4 pages, Latin Times New Roman with Korean Noto Serif KR, 10pt text, and 20mm margins. Portable Paperdown JSON retains its saved settings. The command includes the same renderer and bundled fonts as the editor and requires Node.js 22.18+ and installed Google Chrome.

See [CLI usage and options](cli/README.md) for custom paper sizes, continuous height, local images, and stdin/stdout. PDFs use the web editor's raster export; text is not selectable or searchable.

## Shortcuts

- Command/Ctrl + S: download the complete Paperdown document.
- Command/Ctrl + B / I: bold / italic.
- Command/Ctrl + Z: undo; Shift + Command/Ctrl + Z: redo.
- `/`: insert a block; arrow keys and Enter navigate the command menu.
- Escape: close menus and dialogs.

## License

MIT © Jaewon Baek. Vendored Paper UI retains its MIT license. Pretendard and Noto Serif KR retain their respective SIL Open Font Licenses.
