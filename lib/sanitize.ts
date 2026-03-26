let DOMPurify: { sanitize: (dirty: string, config: Record<string, unknown>) => string };
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  DOMPurify = require("isomorphic-dompurify");
} catch {
  DOMPurify = { sanitize: (dirty: string) => dirty };
}

const ALLOWED_TAGS = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "br",
  "hr",
  "ul",
  "ol",
  "li",
  "a",
  "strong",
  "em",
  "u",
  "s",
  "blockquote",
  "pre",
  "code",
  "img",
  "figure",
  "figcaption",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "div",
  "span",
  "iframe",
];

const ALLOWED_ATTR = [
  "href",
  "target",
  "rel",
  "src",
  "alt",
  "width",
  "height",
  "class",
  "id",
  "loading",
  "decoding",
  "style",
  "colspan",
  "rowspan",
  "allow",
  "allowfullscreen",
  "frameborder",
];

export function sanitizeHTML(dirty: string): string {
  try {
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      ALLOW_DATA_ATTR: false,
      ADD_ATTR: ["target"],
    });
  } catch {
    return dirty;
  }
}
