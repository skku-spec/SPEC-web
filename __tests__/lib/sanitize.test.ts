import { describe, it, expect } from "vitest";
import { sanitizeHTML } from "@/lib/sanitize";

describe("sanitizeHTML", () => {
  it("preserves clean HTML", () => {
    const html = "<p>Hello <strong>world</strong></p>";
    expect(sanitizeHTML(html)).toBe(html);
  });

  it("preserves headings", () => {
    const html = "<h1>Title</h1><h2>Subtitle</h2>";
    expect(sanitizeHTML(html)).toBe(html);
  });

  it("preserves links with target", () => {
    const html = '<a href="https://example.com" target="_blank">Link</a>';
    expect(sanitizeHTML(html)).toContain('href="https://example.com"');
  });

  it("preserves images with loading/decoding", () => {
    const html = '<img src="https://img.com/a.jpg" alt="photo" loading="lazy" decoding="async">';
    const result = sanitizeHTML(html);
    expect(result).toContain('src="https://img.com/a.jpg"');
    expect(result).toContain('loading="lazy"');
  });

  it("strips script tags", () => {
    const html = '<p>Hello</p><script>alert("xss")</script>';
    const result = sanitizeHTML(html);
    expect(result).not.toContain("<script>");
    expect(result).not.toContain("alert");
    expect(result).toContain("<p>Hello</p>");
  });

  it("strips onclick handlers", () => {
    const html = '<div onclick="alert(1)">Click</div>';
    const result = sanitizeHTML(html);
    expect(result).not.toContain("onclick");
    expect(result).toContain("Click");
  });

  it("strips onerror on img", () => {
    const html = '<img src="x" onerror="alert(1)">';
    const result = sanitizeHTML(html);
    expect(result).not.toContain("onerror");
  });

  it("strips javascript: protocol in href", () => {
    const html = '<a href="javascript:alert(1)">Click</a>';
    const result = sanitizeHTML(html);
    expect(result).not.toContain("javascript:");
  });

  it("strips nested XSS vectors", () => {
    const html = '<div><img src=x onerror="fetch(\'https://evil.com\')"><script>document.cookie</script></div>';
    const result = sanitizeHTML(html);
    expect(result).not.toContain("onerror");
    expect(result).not.toContain("<script>");
    expect(result).not.toContain("document.cookie");
  });

  it("preserves tables", () => {
    const html = "<table><thead><tr><th>Header</th></tr></thead><tbody><tr><td>Cell</td></tr></tbody></table>";
    expect(sanitizeHTML(html)).toContain("<table>");
    expect(sanitizeHTML(html)).toContain("<td>Cell</td>");
  });

  it("preserves iframes with allowed attrs", () => {
    const html = '<iframe src="https://padlet.com/embed" allow="fullscreen" allowfullscreen></iframe>';
    const result = sanitizeHTML(html);
    expect(result).toContain("<iframe");
    expect(result).toContain('src="https://padlet.com/embed"');
  });
});
