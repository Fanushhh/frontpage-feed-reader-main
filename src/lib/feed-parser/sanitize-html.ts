import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "a", "abbr", "b", "blockquote", "br", "caption", "cite", "code",
  "dd", "del", "details", "dfn", "div", "dl", "dt", "em", "figcaption",
  "figure", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "i", "img",
  "ins", "kbd", "li", "mark", "ol", "p", "pre", "q", "s", "samp",
  "small", "span", "strong", "sub", "summary", "sup", "table", "tbody",
  "td", "tfoot", "th", "thead", "time", "tr", "u", "ul", "var",
];

const ALLOWED_ATTR = [
  "href", "src", "srcset", "alt", "title", "width", "height",
  "class", "id", "target", "rel", "datetime", "cite", "lang",
  "loading", "decoding",
];

export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    // Make all links open in new tab
    ADD_ATTR: ["target"],
    FORCE_BODY: true,
  });
}

/** Strip all HTML tags to plain text */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
}
