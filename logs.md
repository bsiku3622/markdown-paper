## 2026-10-05 — Build the Markdown editor

- Files: `src/`, `vendor/paper-ui/`, build configuration.
- Summary: Separate Markdown editing and preview, Pretendard and Noto Serif KR typography, browser draft storage, PNG clipboard/download, and paginated PDF export.

Paper UI is vendored as a built package so a public deployment does not rely on sibling repositories. Korean fonts are bundled with the application; image export embeds only unicode subsets used by the current document to avoid downloading the entire Korean font catalogue. PDF pages use blank scanlines near each page boundary to avoid cutting ordinary text lines. PDFs are rasterized to preserve Korean typography consistently; Markdown remains the editable source.
