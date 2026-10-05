## 2026-10-05 — Deploy and add paper sizes

- Files: `src/App.tsx`, `src/style.css`, `README.md`; GitHub, Vercel, and Cloudflare DNS.
- Summary: Public repository at `bsiku3622/markdown-paper`, Vercel project `zevoers/markdown-paper`, and HTTPS site at https://markdown.bsiku.dev. Add A4, A5, Letter, and free-width paper selection.

The Cloudflare CNAME `markdown` points to `66ced14c5a41ace9.vercel-dns-017.com` with DNS-only mode, as required by Vercel. Vercel reports Valid Configuration and the custom domain serves the editor over HTTPS. The paper setting changes preview width/aspect ratio and actual PDF page dimensions; free width exports to A4. Browser checks covered editing, safe raw HTML rendering, GFM tables/checklists, math, font switching, image clipboard copy, PNG/PDF downloads, and a 390px viewport with no horizontal overflow. Fonts are self-hosted and documents stay in browser storage.

## 2026-10-05 — Build the Markdown editor

- Files: `src/`, `vendor/paper-ui/`, build configuration.
- Summary: Separate Markdown editing and preview, Pretendard and Noto Serif KR typography, browser draft storage, PNG clipboard/download, and paginated PDF export.

Paper UI is vendored as a built package so a public deployment does not rely on sibling repositories. Korean fonts are bundled with the application; image export embeds only unicode subsets used by the current document to avoid downloading the entire Korean font catalogue. PDF pages use blank scanlines near each page boundary to avoid cutting ordinary text lines. PDFs are rasterized to preserve Korean typography consistently; Markdown remains the editable source.
