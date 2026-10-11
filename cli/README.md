# Paperdown PDF

Convert Markdown or a portable Paperdown document into a selectable, searchable text PDF with the same typography, spacing, palette, task lists, tables, math, page breaks, and page numbers as Paperdown.

Markdown defaults to A4 pages, Myeongjo (KoPub Batang for both Latin and Korean), 10pt text, 20mm margins, and 1.6 line height. Rich document JSON retains its stored settings unless a CLI option overrides them. KoPub Batang and Pretendard are bundled. Noto Serif KR provides fallback glyphs.

Convert a Markdown file and specify the output path:

```sh
paperdown-pdf notes.md -o notes.pdf
```

Use Gothic text, landscape pages, or a single page fitted to the content:

```sh
paperdown-pdf notes.md --font sans --landscape -o slides.pdf
paperdown-pdf notes.md --mode continuous -o continuous.pdf
paperdown-pdf document.paperdown.json --paper a4 --mode pages -o document.pdf
```

Read Markdown from stdin or send PDF bytes to stdout. Progress and errors go to stderr:

```sh
cat notes.md | paperdown-pdf - -o notes.pdf
paperdown-pdf notes.md -o - > notes.pdf
```

Local image paths resolve relative to the input file, or `--asset-dir` for stdin or another asset folder. Files outside that directory require an explicit containing asset directory. PNG, JPEG, GIF, and WebP are supported. Public HTTP(S) images require `--allow-remote`; documents themselves are never uploaded. Account-private images must first be embedded using Paperdown's document-file export. Existing output files are protected unless `--force` is supplied.

## Install or update from the repository

Use Node.js 22.18+ and an installed Google Chrome. The command launches a separate headless browser and never attaches to a user profile. `--browser /absolute/path/to/chromium` selects another executable. The installed package contains the compiled renderer and fonts and does not depend on the repository remaining in place.

Build and install a local package into npm's global prefix:

```sh
npm ci
npm run install:cli
paperdown-pdf --help
```

## PDF limits

PDFs use Chrome's native print engine with embedded subset fonts. Text remains selectable and searchable, and lines, tables, and math stay sharp when zoomed. Only actual source images are raster images. The shared page preparation keeps the existing editor pagination instead of letting print CSS create a different set of page breaks. Continuous pages are limited to 5 metres; the old canvas-height and decreasing-resolution limits do not apply to PDF. Large indivisible blocks should be split manually when they exceed a page. Generated files include title metadata without inserting an extra visible heading. For matching editor exports, use the same saved Paperdown JSON and renderer version; Markdown does not carry editor-only text marks. Third-party license notices ship in `renderer/licenses/`.
