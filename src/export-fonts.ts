// Include only font subsets whose unicode ranges occur in this document.
// Embedding every Korean subset needlessly fetches tens of megabytes per export.
const cache = new Map<string, Promise<string>>();
function dataUrl(url: string) {
  if (!cache.has(url))
    cache.set(
      url,
      fetch(url)
        .then((response) => {
          if (!response.ok)
            throw new Error("서체를 불러오지 못했습니다. 다시 시도해주세요.");
          return response.blob();
        })
        .then(
          (blob) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            }),
        )
        .catch((error) => {
          cache.delete(url);
          throw error;
        }),
    );
  return cache.get(url)!;
}
function matches(range: string, points: number[]) {
  if (!range) return true;
  return range.split(",").some((part) => {
    const hex = part.trim().replace(/^U\+/i, "");
    const [lo, hi] = hex.includes("?")
      ? [hex.replaceAll("?", "0"), hex.replaceAll("?", "F")]
      : hex.split("-");
    const start = parseInt(lo, 16),
      end = parseInt(hi || lo, 16);
    return points.some((point) => point >= start && point <= end);
  });
}
export async function documentFonts(node: HTMLElement) {
  const points = [
    ...new Set(
      Array.from(node.textContent || "").map((char) => char.codePointAt(0)!),
    ),
  ];
  const family = [
    node,
    ...Array.from(node.querySelectorAll<HTMLElement>("[style]")),
  ]
    .map((el) => getComputedStyle(el).fontFamily)
    .join(",");
  const families = [
    "Pretendard Variable",
    "Noto Serif KR",
    "KoPub Batang",
  ].filter((name) => family.includes(name));
  if (node.querySelector(".katex")) families.push("KaTeX");
  const rules: { rule: CSSFontFaceRule; base: string }[] = [];
  function collect(sheet: CSSStyleSheet) {
    try {
      for (const rule of Array.from(sheet.cssRules)) {
        if (rule instanceof CSSFontFaceRule)
          rules.push({ rule, base: sheet.href || location.href });
        else if (rule instanceof CSSImportRule && rule.styleSheet)
          collect(rule.styleSheet);
      }
    } catch {
      /* Only same-origin bundled stylesheets are used. */
    }
  }
  Array.from(document.styleSheets).forEach(collect);
  const used = rules.filter(({ rule }) => {
    const name = rule.style
      .getPropertyValue("font-family")
      .replace(/["']/g, "");
    return (
      families.some((f) => name.includes(f)) &&
      matches(rule.style.getPropertyValue("unicode-range"), points)
    );
  });
  return (
    await Promise.all(
      used.map(async ({ rule, base }) => {
        const source = rule.style.getPropertyValue("src");
        const urls = Array.from(
          source.matchAll(
            /url\(["']?([^"')]+)["']?\)\s*format\(["']?([^"')]+)["']?\)/g,
          ),
        );
        const selected =
          urls.find((match) => match[2].startsWith("woff2")) || urls[0];
        if (!selected) return "";
        const url = new URL(selected[1], base).href;
        return rule.cssText.replace(
          source,
          `url("${await dataUrl(url)}") format("${selected[2]}")`,
        );
      }),
    )
  ).join("\n");
}
