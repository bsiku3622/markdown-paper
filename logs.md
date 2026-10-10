## 2026-10-11 — Match Myeongjo to the LaTeX font families

- Files: document font settings, browser/CLI font imports, export font embedding, bundled Latin Modern assets, and documentation.
- Summary: Replace Times/Noto Myeongjo with Latin Modern Roman and Nanum Myeongjo in Paperdown and the installed PDF CLI.

The personal LaTeX format allows Computer Modern/Latin Modern with the serif Korean font supplied by kotex. The installed pdfLaTeX kotexutf declares `nanummj`, so Korean uses Nanum Myeongjo rather than assuming Noto Serif KR is the default. Bundle Latin Modern Roman regular, bold, italic, and bold italic OpenType fonts and Nanum Myeongjo regular/bold webfonts. Keep Noto as a fallback for missing glyphs. Existing Times, Source Serif, and Noto rich-text marks migrate to the new stack without changing text, sizes, or other formatting.

Font embedding must preserve each source format: hardcoding `woff2` for the new OpenType data URLs would prevent matching PDF typography. Third-party license, author, and manifest files accompany the bundled Latin Modern faces and the installed CLI. Twelve tests, TypeScript/renderer builds, and the skill validator passed; both pages of a PDF with Korean/Latin, bold/italic, table, image, tasks, and math were visually checked. Page size and margins stay at the existing Paperdown defaults because this request changes typography only.

## 2026-10-11 — Add an installed Paperdown PDF CLI

- Files: `cli/`, `src/cli-render.tsx`, shared document/export styles, tests, and README.
- Summary: Add a self-contained global `paperdown-pdf` command for Markdown and portable Paperdown JSON; restore Latin Times New Roman with Korean Noto Serif KR as the Myeongjo default.

The CLI bundles the web editor's actual Tiptap, pagination, font, and raster PDF renderer rather than recreating its typography with another PDF engine. Markdown defaults to A4 pages, 10pt, 20mm margins, and 1.6 line height; document JSON keeps its saved settings unless options override them. The package installs as a snapshot in npm's global prefix, so moving the checkout does not break the command. Chrome runs headlessly in an isolated temporary profile. Local assets are constrained to the selected asset directory; public remote images require an explicit option, and private account images must be embedded in document JSON first.

ProseMirror adds an empty separator image after image content. Treating it as a real image caused decode failures; applying document-image margins to it also shifted page boundaries. Exclude it from image styling and loading, remove it from export clones, and keep its CLI layout footprint zero before pagination measures the document.

Twelve document/API/CLI tests passed, TypeScript and renderer builds passed, and the installed command produced verified A4 pagination, content-fitted Gothic output, custom landscape PDF bytes via stdin/stdout, and an A5 JSON document with an embedded image. Both A4 pages were visually inspected for margins, font coverage, task strikethrough, table, math, and image layout. The PDF remains rasterized like the web export: text is not selectable/searchable, with a 28,000 CSS-pixel content limit. Installation and the personal `paperdown-pdf` skill are recorded in the system log.

## 2026-10-10 — Unify Myeongjo and add symbol input rules

- Files: `src/typography.ts`, `src/App.tsx`, `src/document.ts`, document tests, and README.
- Summary: Use Noto Serif KR for both Latin and Korean Myeongjo text; convert typed arrows and double hyphens into typographic symbols.

Input rules replace `->` and `-->` with `→`, `=>` and `==>` with `⇒`, and `--` with `—`. Since two hyphens convert before the final greater-than character arrives, `—>` also resolves to an arrow. Tiptap's existing `—-` horizontal-rule shortcut keeps triple-hyphen separators working. Code blocks and inline code bypass input rules, and immediate Backspace reverses the substitution. Pasted/imported text stays literal; existing document content is not rewritten for symbols.

Existing mixed Times New Roman/Noto rich-text marks normalize to Noto Serif KR while preserving text and other marks. Browser checks verified all five sequences, Backspace reversal, the triple-hyphen separator, and literal code-block text. Document/API tests and production build passed.

## 2026-10-10 — Add private accounts and synchronized notes

- Files: account UI and API client, document/export integration, `backend/`, `deploy/`, README, and tests.
- Summary: Add username/password registration and login, private multi-note storage, account image uploads, autosave with local draft recovery, and Gothic/Myeongjo font choices.

SQLite and image files run under a dedicated system user on the existing SSH server, behind the existing Cloudflare Tunnel at `paperdown-api.bsiku.dev`. Mutation requests require the configured frontend origin, sessions use HttpOnly/Secure cookies and hashed tokens, and passwords use salted scrypt. Owner checks cover both notes and files. Daily systemd backups snapshot SQLite and images on the server; no off-server backup or retention automation was added.

Autosave serializes writes, retains drafts by account and note, and checks server revisions to prevent simultaneous tabs from silently replacing each other's edits. Opening an unchanged document must not issue a new revision: doing so caused false conflicts during two-tab verification. Conflict recovery can create a separate note. Offline edits remained in the browser and synchronized when the connection returned. Guest storage stays separate from account drafts.

Private image requests and raster exports include credentials. Document-file exports embed uploaded images rather than exporting session-dependent URLs, and replacement waits for its backup download to succeed. Myeongjo now uses Times New Roman/Times for supported Latin glyphs and Noto Serif KR for Korean; Gothic uses Pretendard. Times New Roman remains a system font rather than a redistributed asset. Existing Noto and Source Serif rich-text marks migrate to the new stack.

Validation: seven document/API tests and production build passed. Browser checks covered registration, two-note switching and reload, font selection, private image upload, PDF export, portable document image embedding, conflict duplication, and offline retry. Public API health and the backup timer were verified after server deployment.

## 2026-10-07 — Strike completed task text

- Files: `src/style.css`.
- Summary: Apply line-through to paragraphs in checked task items, and remove it automatically when unchecked.

The selector follows Tiptap's checked state and targets only direct paragraphs. Striking the entire content wrapper would also strike nested unfinished tasks. Export clones retain the task attributes and document-content class, so image/PDF output uses the same styling. Production build passes.

## 2026-10-06 — Enlarge the point unit label

- Files: `src/style.css`.
- Summary: Increase the font-size field's pt label from 10px to 12px, matching the numeric value while retaining the muted unit color.

The unit remains non-shrinking inside the existing 90px field. Browser checks confirm 11.25 is visible in a roughly 57px input and the unit retains its 8px right gap including the border. Production build passes.

## 2026-10-06 — Distinguish pointer and keyboard select focus

- Files: `src/App.tsx`, `src/style.css`.
- Summary: Suppress the blue select outline for pointer activation while retaining keyboard focus indication on formatting, page settings, and zoom dropdowns.

Native selects can match focus-visible after pointer activation, so that selector alone does not distinguish input modality. Pointer-down marks the select before focus styling, blur clears the mark, and keyboard interaction restores the default focus-visible rule. Browser checks confirm a pointer click has no outline while Tab navigation shows a 2px solid ring. The native select and keyboard behavior remain intact. Production build passes.

## 2026-10-06 — Remove Source Serif from font choices

- Files: font options, document normalization, font imports and export embedding, wordmark CSS, package metadata, README, and migration tests.
- Summary: Keep Noto Serif KR and Pretendard only, remove the Source Serif dependency, and map legacy document settings and rich-text font marks to Noto Serif KR.

Legacy font marks are normalized recursively without mutating the imported document or changing text, point sizes, or other marks. The wordmark now uses the already bundled Noto Serif KR rather than retaining a separate font dependency for branding. Build and all six document tests pass.

## 2026-10-06 — Match placeholders to document typography

- Files: `src/style.css`.
- Summary: Inherit the empty block font instead of forcing 13px sans typography on heading placeholders.

The shared placeholder pseudo-element overrode the heading font family and size, making its label smaller than its caret and eventual content. Inheriting the font preserves heading levels, document typeface, size, weight, and line height while keeping the muted placeholder color. Browser verification on an empty H1 confirms both node and placeholder use 30px Noto Serif KR at weight 600. Production build passes.

## 2026-10-06 — Review Paperdown patterns for Paper UI

- Files: design review report in `/Users/baeks/Reports/2026-10-06_01-42-paperdown-paper-ui-design-review.md`.
- Summary: Compare the deployed editor and local app styles against the current Paper UI working tree; recommend a document-workspace recipe before adding shared components.

The existing palette is already inherited from Paper UI, while toolbar geometry and document presentation remain app-owned. Field already supports unit adornments, and Select already disables native arrows, so the recent app dropdown defect is not evidence of a reproduced library defect. The report separates reusable composition patterns from application typography, pagination, export, and persistence, and flags the uncommitted Paper UI source and conflicting documentation values as comparison limits. No implementation or deployment changes were made.

## 2026-10-06 — Control dropdown arrow spacing explicitly

- Files: `src/App.tsx`, `src/style.css`.
- Summary: Replace browser-drawn select arrows with shared decorative chevrons and reserve independent text/arrow padding for formatting and page option dropdowns.

The affected font dropdown is a plain HTML select styled by Paperdown, not the Paper UI Select component. Paper UI's bundled stylesheet has no unscoped select rule; its own Select class already disables native appearance. Paperdown's appearance:auto and 6px right padding left arrow placement to the browser. The shared wrapper keeps native keyboard/select behavior while positioning a pointer-transparent arrow 7px from the edge with 25px reserved right padding. Browser checks confirm all formatting selects use those values and the 1280px toolbar remains one 51px row; page option controls also render correctly. Production build passes.

## 2026-10-06 — Fix field padding and unify page controls

- Files: `src/style.css`, `src/App.tsx`.
- Summary: Give the font-size field explicit symmetric internal padding and match page options and zoom typography, height, hover appearance, and chevron icons.

The size input now flexes within its fixed outer width, with a non-shrinking unit label and reserved right padding; browser measurement confirms an 8px gap including the border after the unit. Replacing the native zoom arrow with the same ChevronDown icon avoids platform-specific differences while retaining the accessible native select. The 1280px toolbar stays on one 51px row, 11.25pt remains visible, and the production build passes.

## 2026-10-06 — Align page controls and show fractional sizes

- Files: `src/style.css`.
- Summary: Anchor page options and zoom at the right edge of the toolbar and widen the font size field to display fractional point values completely.

The previous 43px numeric input clipped the migrated 11.25pt value. A 63px input inside a non-shrinking 90px field preserves the full value while keeping the 1280px desktop toolbar on one 51px row. Auto left margin anchors the page group independently of the formatting tools, including when the toolbar wraps. The Paper UI palette and document content remain unchanged. Production build and browser layout checks pass.

## 2026-10-06 — Evolve the editor into Paperdown

- Files: `src/App.tsx`, `src/document.ts`, `src/pagination.ts`, `src/export-document.ts`, `src/export-fonts.ts`, `src/style.css`, tests, package metadata, and README; Vercel and Cloudflare domain configuration.
- Summary: Replace separate source/preview modes with a Tiptap document editor, compact adjacent toolbar groups, Paper UI palette tokens, rich formatting and block insertion, content-fitted continuous pages, paginated/custom page options, detailed text statistics, and rich document backups.

Rich document JSON is the canonical persisted form so selected text typography, alignment, tables, and embedded images survive reloads; Markdown remains an interchange format. IndexedDB avoids local storage limits for images. Existing drafts and pixel typography migrate without discarding their text. Conditional writes compare timestamps within a single IndexedDB transaction so closing an older tab cannot overwrite a newer migrated document. Page spacers are ProseMirror decorations excluded from serialization and undo history. The page count is measured from the final rendered editor, which also accounts for asynchronously decoded images. Continuous height deliberately has no paper-sized minimum: the user's follow-up requested a tight content fit.

Export uses an unzoomed clone and the exact fractional CSS width of the physical paper. Rounding A4 width to an integer caused repeated long paragraphs to wrap differently and drift across PDF page boundaries. Browser capture also silently scaled canvases above 16,384 pixels; limiting capture resolution and deriving page slices from the actual canvas scale avoids blank trailing pages. A 12-page A4 document, including a paragraph spanning several pages, was rendered and visually inspected after these fixes. Native Chrome checks covered selected 12pt/Pretendard formatting and successful image clipboard copy; imported tables/checklists/math and embedded-image reload persistence were checked in the in-app browser. Five migration, Unicode statistics, dimension, and stale-tab tests pass, and the production build passes.

A native Chrome regression check changed a local test document in one tab, closed an older tab, and reloaded the current tab; the newer document survived. Already loaded old builds still execute their old save handlers, so the live legacy document was backed up before migration, recovered from the unchanged old-origin copy after an old-build conflict, and verified again after reload on the updated build. Repeated migration uses a fresh window so an existing target with a changed URL hash cannot miss the opener handshake.

⚠️ Keep the legacy domain serving the migration UI. Redirecting it immediately would hide its origin-specific stored drafts. The new `paperdown` CNAME uses the same Vercel target in DNS-only mode; Vercel reports Valid Configuration and production deployment c1f2892 serves Paperdown over HTTPS. The open legacy document was backed up and transferred with its 11.25pt typography and 1.9 line spacing intact. Cross-origin draft transfer stays entirely in the browser and checks both origin and opener identity.

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
