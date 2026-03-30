/**
 * reader.js — Extract the readable article content from HTML using
 * Mozilla's Readability library (the same engine that powers Firefox
 * Reader View). Runs entirely in the browser using the native DOMParser.
 */

import { Readability } from '@mozilla/readability';

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
    content:     article.content     ?? '',  // sanitised HTML fragment
    textContent: article.textContent ?? '',  // plain text for TTS
    excerpt:     article.excerpt     ?? '',
    byline:      article.byline      ?? '',
    siteName:    article.siteName    ?? '',
  };
}
