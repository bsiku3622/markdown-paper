import assert from "node:assert/strict";
import { test } from "node:test";
import {
  normalize,
  dimensions,
  statistics,
  DEFAULTS,
  FONTS,
  isCurrentSnapshot,
} from "../src/document.ts";
test("migrates an existing Markdown draft and pixel typography without losing text", () => {
  const d = normalize({
    text: "# 기존 글\n\n한글과 emoji 🧑‍💻",
    title: "내 문서",
    settings: { size: 15, font: "serif", zoom: 125, paper: "a5" },
  });
  assert.equal(d.markdown, "# 기존 글\n\n한글과 emoji 🧑‍💻");
  assert.equal(d.title, "내 문서");
  assert.equal(d.settings.sizePt, 11.25);
  assert.equal(d.settings.font, "myeongjo");
  assert.deepEqual(dimensions(d.settings), { width: 148, height: 210 });
});
test("migrates legacy Source Serif marks without changing text or other formatting", () => {
  const content = {
    type: "doc",
    content: [{ type: "paragraph", content: [{
      type: "text", text: "기존 문장",
      marks: [{ type: "textStyle", attrs: { fontFamily: '"Source Serif 4", "Noto Serif KR", serif', fontSize: "11.25pt" } }, { type: "bold" }],
    }] }],
  };
  const d = normalize({ content, settings: { font: "serif" } });
  const text = d.content!.content![0].content![0];
  assert.equal(text.text, "기존 문장");
  assert.equal(text.marks![0].attrs!.fontFamily, FONTS.myeongjo);
  assert.equal(text.marks![0].attrs!.fontSize, "11.25pt");
  assert.equal(text.marks![1].type, "bold");
  assert.match(content.content[0].content[0].marks[0].attrs!.fontFamily!, /Source Serif/);
});
test("preserves mixed Times and Noto typography across document loading", () => {
  const content = {type: "doc", content: [{type: "paragraph", content: [{
    type: "text", text: "Closed System인 이유",
    marks: [{type: "textStyle", attrs: {fontFamily: '"Times New Roman", Times, "Noto Serif KR", serif', fontSize: "10pt"}}, {type: "italic"}],
  }]}]};
  const text = normalize({content}).content!.content![0].content![0];
  assert.equal(text.marks![0].attrs!.fontFamily, FONTS.myeongjo);
  assert.equal(text.marks![0].attrs!.fontSize, "10pt");
  assert.equal(text.marks![1].type, "italic");
  assert.equal(text.text, "Closed System인 이유");
  assert.match(content.content[0].content[0].marks[0].attrs!.fontFamily!, /Times New Roman/);
});
test("preserves rich document structure and custom landscape dimensions", () => {
  const content = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "본문",
            marks: [{ type: "textStyle", attrs: { fontSize: "9pt" } }],
          },
        ],
      },
    ],
  };
  const d = normalize({
    content,
    settings: {
      ...DEFAULTS,
      paper: "custom",
      width: 160,
      height: 230,
      landscape: true,
      mode: "pages",
    },
  });
  assert.deepEqual(d.content, content);
  assert.deepEqual(dimensions(d.settings), { width: 230, height: 160 });
  assert.equal(d.settings.mode, "pages");
});
test("counts Unicode code points, whitespace-separated words and explicit lines", () => {
  assert.deepEqual(statistics("가 나\n😀\tA"), {
    words: 4,
    lines: 2,
    chars: 7,
    compact: 4,
  });
  assert.deepEqual(statistics(""), {
    words: 0,
    lines: 0,
    chars: 0,
    compact: 0,
  });
});
test("bounds imported document sizes and falls back from invalid settings", () => {
  const d = normalize({
    settings: {
      paper: "unknown",
      width: 10,
      height: Infinity,
      sizePt: 2,
      zoom: 1000,
      font: "missing",
    },
  });
  assert.equal(d.settings.paper, "a4");
  assert.equal(d.settings.width, 80);
  assert.equal(d.settings.height, 297);
  assert.equal(d.settings.sizePt, 6);
  assert.equal(d.settings.zoom, 200);
  assert.equal(d.settings.font, "myeongjo");
});

test("an older tab cannot overwrite a newer saved document", () => {
  assert.equal(
    isCurrentSnapshot({ updatedAt: 200 }, { updatedAt: 100 }),
    false,
  );
  assert.equal(isCurrentSnapshot({ updatedAt: 200 }, { updatedAt: 200 }), true);
  assert.equal(isCurrentSnapshot({ updatedAt: 200 }, { updatedAt: 300 }), true);
  assert.equal(isCurrentSnapshot(undefined, { updatedAt: 100 }), true);
});
