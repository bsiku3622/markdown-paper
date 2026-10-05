# Yeobaek

A quiet Markdown editor built with Paper UI. Write in Pretendard, then read your work in Noto Serif KR (Source Han Serif), Source Serif 4, or Pretendard.

Separate editing and preview modes keep writing and typesetting focused. The preview supports font size, line spacing, and paper width. Export the current layout as a clipboard image, a PNG, or an A4 PDF, and save the original Markdown whenever you need it.

Documents are stored in this browser's local storage. There is no account, backend, or cloud document storage. External image URLs are requested directly from their hosts; those hosts must allow CORS for image export. Exported PDFs preserve appearance as images rather than selectable text.

## Development

Install dependencies and start the local editor:

```sh
npm ci
npm run dev
```

Create a production build with TypeScript validation:

```sh
npm run build
```

Vercel uses the Vite preset, `npm run build`, and the `dist` output directory. The Paper UI distribution is vendored so deployments are independent of local filesystem paths.

## Shortcuts

- Command/Ctrl + S: download the original Markdown.
- Command/Ctrl + Shift + P: switch between editing and preview.
- Escape: close menus or the new-document dialog.

## License

MIT © Jaewon Baek. Vendored Paper UI retains its MIT license. Pretendard, Noto Serif KR, and Source Serif 4 retain their respective SIL Open Font Licenses.
