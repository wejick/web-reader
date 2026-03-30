import { describe, it, expect } from 'vitest';
import { parseArticle } from '../src/reader.js';

describe('parseArticle', () => {
  const makeArticleHtml = (title, body) => `
    <html>
      <head><title>${title}</title></head>
      <body>
        <article>
          <h1>${title}</h1>
          ${body}
        </article>
      </body>
    </html>
  `;

  it('extracts article title and content', () => {
    // Readability needs enough content to consider it an article
    const paragraphs = Array.from({ length: 5 }, (_, i) =>
      `<p>This is paragraph ${i + 1} of the article. It contains enough text to be considered meaningful content by the Readability parser, which requires a reasonable amount of text.</p>`
    ).join('\n');

    const html = makeArticleHtml('Test Article', paragraphs);
    const result = parseArticle(html, 'https://example.com/article');

    expect(result.title).toBe('Test Article');
    expect(result.content).toBeTruthy();
    expect(result.textContent).toBeTruthy();
    expect(typeof result.textContent).toBe('string');
  });

  it('throws for non-article pages', () => {
    // Completely empty body — Readability returns null
    const html = '<html><head></head><body></body></html>';
    expect(() => parseArticle(html, 'https://example.com')).toThrow('could not be parsed');
  });

  it('returns all expected fields', () => {
    const paragraphs = Array.from({ length: 5 }, (_, i) =>
      `<p>Content paragraph ${i + 1} with sufficient length to satisfy the readability algorithm requirements for article detection and extraction.</p>`
    ).join('\n');

    const html = makeArticleHtml('Fields Test', paragraphs);
    const result = parseArticle(html, 'https://example.com');

    expect(result).toHaveProperty('title');
    expect(result).toHaveProperty('content');
    expect(result).toHaveProperty('textContent');
    expect(result).toHaveProperty('excerpt');
    expect(result).toHaveProperty('byline');
    expect(result).toHaveProperty('siteName');
  });
});
