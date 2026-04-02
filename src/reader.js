/**
 * reader.js — Extract the readable article content from HTML using
 * Mozilla's Readability library (the same engine that powers Firefox
 * Reader View). Runs entirely in the browser using the native DOMParser.
 */

import { Readability } from '@mozilla/readability';

// Selectors for elements that add noise and shouldn't be part of the article.
const NOISE_SELECTORS = [
  '[aria-hidden="true"]',
  '[role="complementary"]',
  '[role="banner"]',
  '[role="navigation"]',
  '.share', '.social', '.sharing',
  '.newsletter', '.subscribe',
  '.cookie', '.consent',
  '.related-posts', '.related-articles',
  '.sidebar', '.widget',
  '.ad', '.advertisement', '.adsbygoogle',
  '.comments', '#comments',
].join(',');

/**
 * Pre-clean the parsed document before Readability runs.
 * Fixes lazy-loaded images and strips noisy elements.
 */
function prepareDocument(doc) {
  // 1. Fix lazy-loaded images: promote data-src / data-lazy-src to src
  doc.querySelectorAll('img').forEach(img => {
    if (!img.getAttribute('src') || img.src.includes('data:image')) {
      const lazySrc = img.dataset.src || img.dataset.lazySrc || img.dataset.original;
      if (lazySrc) img.setAttribute('src', lazySrc);
    }
    // If there's a srcset but no src, use the first srcset entry
    if (!img.getAttribute('src') && img.getAttribute('srcset')) {
      const first = img.getAttribute('srcset').split(',')[0].trim().split(/\s+/)[0];
      if (first) img.setAttribute('src', first);
    }
  });

  // 2. Remove hidden elements that would pollute textContent
  doc.querySelectorAll('[style]').forEach(el => {
    const s = el.style;
    if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') {
      el.remove();
    }
  });
  doc.querySelectorAll('[hidden]').forEach(el => el.remove());

  // 3. Strip noisy sections that Readability sometimes keeps
  doc.querySelectorAll(NOISE_SELECTORS).forEach(el => {
    // Don't remove if it's the main article body
    if (el.closest('article, [role="main"], main')) {
      // Only remove small noise inside the article (< 200 chars)
      if (el.textContent.trim().length < 200) el.remove();
    } else {
      el.remove();
    }
  });
}

/**
 * Light post-processing on the extracted HTML content.
 */
function cleanContent(html) {
  // Create a temporary container to manipulate the fragment
  const div = document.createElement('div');
  div.innerHTML = html;

  // Remove empty paragraphs and divs (visual noise in reader view)
  div.querySelectorAll('p, div, span').forEach(el => {
    if (!el.textContent.trim() && !el.querySelector('img, figure, video, iframe, svg')) {
      el.remove();
    }
  });

  // Remove stray "Advertisement" text nodes that some sites inject
  const walker = document.createTreeWalker(div, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (/^\s*(Advertisement|Sponsored|ADVERTISEMENT)\s*$/.test(node.textContent)) {
      node.parentElement?.remove();
    }
  }

  return div.innerHTML;
}

/**
 * Parse the article from a fetched HTML string.
 *
 * @param {string} html  - Full HTML of the fetched page.
 * @param {string} url   - The original URL (used for resolving relative URLs).
 * @returns {{ title: string, content: string, textContent: string, excerpt: string, byline: string, siteName: string }}
 * @throws if the page cannot be parsed as an article.
 */
export function parseArticle(html, url) {
  // Parse into a document — DOMParser is available in all modern browsers.
  const doc = new DOMParser().parseFromString(html, 'text/html');

  // Remove any existing <base> element and insert ours so that Readability
  // resolves relative image/link URLs correctly inside the extracted content.
  doc.querySelectorAll('base').forEach(el => el.remove());
  const base = doc.createElement('base');
  base.href = url;
  doc.head?.prepend(base);

  // Pre-clean the DOM before Readability processes it
  prepareDocument(doc);

  // Run Readability
  const reader = new Readability(doc, {
    // Keep classes so we can style the content
    keepClasses: false,
    // Disable debug output
    debug: false,
  });

  const article = reader.parse();

  if (!article) {
    throw new Error('This page could not be parsed as a readable article. Try loading a news article or blog post.');
  }

  return {
    title:       article.title       ?? '',
    content:     cleanContent(article.content ?? ''),  // sanitised HTML fragment
    textContent: article.textContent ?? '',  // plain text for TTS
    excerpt:     article.excerpt     ?? '',
    byline:      article.byline      ?? '',
    siteName:    article.siteName    ?? '',
  };
}
