## 2026-10-06 — Evolve the editor into Paperdown

- Files: `src/App.tsx`, `src/document.ts`, `src/pagination.ts`, `src/export-document.ts`, `src/export-fonts.ts`, `src/style.css`, tests, package metadata, and README; Vercel and Cloudflare domain configuration.
- Summary: Replace separate source/preview modes with a Tiptap document editor, compact adjacent toolbar groups, Paper UI palette tokens, rich formatting and block insertion, content-fitted continuous pages, paginated/custom page options, detailed text statistics, and rich document backups.

Rich document JSON is the canonical persisted form so selected text typography, alignment, tables, and embedded images survive reloads; Markdown remains an interchange format. IndexedDB avoids local storage limits for images. Existing drafts and pixel typography migrate without discarding their text. Page spacers are ProseMirror decorations excluded from serialization and undo history. The page count is measured from the final rendered editor, which also accounts for asynchronously decoded images. Continuous height deliberately has no paper-sized minimum: the user's follow-up requested a tight content fit.

Export uses an unzoomed clone and the exact fractional CSS width of the physical paper. Rounding A4 width to an integer caused repeated long paragraphs to wrap differently and drift across PDF page boundaries. Browser capture also silently scaled canvases above 16,384 pixels; limiting capture resolution and deriving page slices from the actual canvas scale avoids blank trailing pages. A 12-page A4 document, including a paragraph spanning several pages, was rendered and visually inspected after these fixes. Native Chrome checks covered selected 12pt/Pretendard formatting and successful image clipboard copy; imported tables/checklists/math and embedded-image reload persistence were checked in the in-app browser. Four migration, Unicode statistics, and dimension tests pass, and the production build passes.

⚠️ Keep the legacy domain serving the migration UI. Redirecting it immediately would hide its origin-specific stored drafts. The new `paperdown` CNAME uses the same Vercel target in DNS-only mode; Vercel reports Valid Configuration. Cross-origin draft transfer stays entirely in the browser and checks both origin and opener identity.

## 2026-10-05 — Use document units and inline formatting controls

- Files: `src/App.tsx`, `src/style.css`, `README.md`.
- Summary: Move preview formatting into the top toolbar, accept 6–96pt font sizes including 9pt/10pt, and separate screen zoom from physical document dimensions.

The old implementation restricted font sizes to 15–21px and scaled the complete document into PDF margins, reducing the effective printed font size. Standard paper now uses physical millimetres at 96 CSS pixels per inch, 20mm internal margins, and a separate unzoomed export document. Preview starts at 125%; 75–200% and fit-to-width are available. Existing pixel settings migrate to points without discarding drafts. 9pt rendered as 12 CSS pixels, and rasterized A4 10pt PDFs from 125% and 200% preview zoom matched byte-for-byte. Capture uses static positioning because cloned logical insets otherwise kept the offscreen export document outside the SVG. Page slicing rounds upward to avoid a blank final page caused by fractional pixel paper dimensions.

## 2026-10-05 — Deploy and add paper sizes

- Files: `src/App.tsx`, `src/style.css`, `README.md`; GitHub, Vercel, and Cloudflare DNS.
- Summary: Public repository at `bsiku3622/markdown-paper`, Vercel project `zevoers/markdown-paper`, and HTTPS site at https://markdown.bsiku.dev. Add A4, A5, Letter, and free-width paper selection.

The Cloudflare CNAME `markdown` points to `66ced14c5a41ace9.vercel-dns-017.com` with DNS-only mode, as required by Vercel. Vercel reports Valid Configuration and the custom domain serves the editor over HTTPS. The paper setting changes preview width/aspect ratio and actual PDF page dimensions; free width exports to A4. Browser checks covered editing, safe raw HTML rendering, GFM tables/checklists, math, font switching, image clipboard copy, PNG/PDF downloads, and a 390px viewport with no horizontal overflow. Fonts are self-hosted and documents stay in browser storage.

## 2026-10-05 — Build the Markdown editor

- Files: `src/`, `vendor/paper-ui/`, build configuration.
- Summary: Separate Markdown editing and preview, Pretendard and Noto Serif KR typography, browser draft storage, PNG clipboard/download, and paginated PDF export.

Paper UI is vendored as a built package so a public deployment does not rely on sibling repositories. Korean fonts are bundled with the application; image export embeds only unicode subsets used by the current document to avoid downloading the entire Korean font catalogue. PDF pages use blank scanlines near each page boundary to avoid cutting ordinary text lines. PDFs are rasterized to preserve Korean typography consistently; Markdown remains the editable source.
