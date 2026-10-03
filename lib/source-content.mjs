import { load } from "cheerio";

const BLOCK_TAGS = new Set([
  "blockquote", "br", "div", "h1", "h2", "h3", "h4", "h5", "h6",
  "li", "ol", "p", "ul"
]);
const SECTION_TAGS = new Set(["blockquote", "li", "ol", "p", "ul"]);

function normalizeText(value) {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/[\t\f\v ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function renderText(node) {
  if (node.type === "text") return node.data ?? "";
  if (node.type !== "tag") return "";

  const tag = node.name.toLowerCase();
  const inner = (node.children ?? []).map(renderText).join("");
  if (tag === "br") return "\n";
  if (tag === "li") return `\n- ${inner}\n`;
  return BLOCK_TAGS.has(tag) ? `\n${inner}\n` : inner;
}

function textOf(node) {
  return normalizeText(renderText(node));
}

function collectSections(node, sections = []) {
  let looseNodes = [];
  const flushLooseText = () => {
    const text = normalizeText(looseNodes.map(renderText).join(""));
    if (text) sections.push({ type: "text", text });
    looseNodes = [];
  };

  for (const child of node.children ?? []) {
    if (child.type === "text" || (child.type === "tag" && child.name.toLowerCase() === "br")) {
      looseNodes.push(child);
      continue;
    }
    if (child.type !== "tag") continue;

    const tag = child.name.toLowerCase();
    if (/^h[1-6]$/.test(tag)) {
      flushLooseText();
      const text = textOf(child);
      if (text) sections.push({ type: "heading", level: Number(tag[1]), text });
      continue;
    }

    if (tag === "p" || tag === "blockquote") {
      flushLooseText();
      const text = textOf(child);
      if (text) sections.push({ type: tag === "p" ? "paragraph" : "quote", text });
      continue;
    }

    if (tag === "ul" || tag === "ol") {
      flushLooseText();
      const items = (child.children ?? [])
        .filter(item => item.type === "tag" && item.name.toLowerCase() === "li")
        .map(textOf)
        .filter(Boolean);
      if (items.length) sections.push({ type: "list", ordered: tag === "ol", items });
      continue;
    }

    if (tag === "li") {
      flushLooseText();
      const text = textOf(child);
      if (text) sections.push({ type: "list-item", text });
      continue;
    }

    const containsSections = child.children?.some(
      descendant => descendant.type === "tag" &&
        (/^h[1-6]$/.test(descendant.name.toLowerCase()) || SECTION_TAGS.has(descendant.name.toLowerCase()))
    );
    if (containsSections) {
      flushLooseText();
      collectSections(child, sections);
    } else {
      looseNodes.push(child);
    }
  }

  flushLooseText();
  return sections;
}

export function extractSourceLesson(html, id, sourceUrl, fetchedAt) {
  const $ = load(html);
  const article = $("#fontchu").first();
  if (!article.length) throw new Error("Lesson article container #fontchu was not found");

  const cleanArticle = article.clone();
  cleanArticle.find("center").each((_, element) => {
    const center = $(element);
    if (center.find(".sm2-bar-ui, script[src*='/sound/script/']").length) {
      center.remove();
    }
  });
  cleanArticle.find("script, style, link, noscript, iframe, object, embed, .sm2-bar-ui").remove();
  cleanArticle.find("a").each((_, element) => {
    const link = $(element);
    const label = normalizeText(link.text());
    if (label === "Menu Bài Học" && link.attr("href") === "index.php") {
      const parent = link.parent();
      if (parent.is("center") && normalizeText(parent.text()) === label) parent.remove();
      else link.remove();
    }
  });

  const sections = collectSections(cleanArticle[0]);
  const content = normalizeText(renderText(cleanArticle[0]));
  if (!content) throw new Error("Lesson article container was empty after cleanup");

  const heading = cleanArticle.find("h1, h2, h3, h4, h5, h6").first();
  const title = normalizeText(heading.text()) || normalizeText($("title").first().text()) || `Lesson ${id}`;
  return { id, sourceUrl, title, content, sections, fetchedAt, status: "fetched" };
}