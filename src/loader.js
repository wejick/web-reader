/**
 * loader.js — Fetch a web page via a CORS proxy and rewrite relative URLs.
 *
 * Since browsers cannot fetch arbitrary URLs due to CORS restrictions, all
 * requests are routed through a configurable CORS proxy. In development the
 * Vite dev server provides /dev-proxy; in production the user configures a
 * public or self-hosted proxy (e.g. https://corsbeater.wejick.workers.dev).
 */

/**
 * Fetch a page and return its HTML with all relative URLs resolved to absolute.
 *
 * @param {string} url        - The original page URL.
 * @param {string} corsProxy  - The CORS proxy base URL (e.g. "https://corsbeater.wejick.workers.dev").
 *                              Pass empty string / null to use the Vite dev proxy.
 * @returns {Promise<{html: string, url: string, title: string}>}
 */
export async function fetchPage(url, corsProxy) {
  // Auto-prepend https:// if no protocol is present
  if (url && !url.match(/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//)) {
    url = 'https://' + url;
  }

  // Validate the URL before hitting the network
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Invalid URL. Please enter a complete URL starting with https://');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only http:// and https:// URLs are supported.');
  }

  // Build the proxied URL
  const proxyUrl = buildProxyUrl(url, corsProxy);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  let response;
  try {
    response = await fetch(proxyUrl, {
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Request timed out after 20 seconds.');
    throw new Error(`Network error: ${err.message}`);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch page: HTTP ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const rewritten = rewriteUrls(html, url);
  const title = extractTitle(rewritten);

  return { html: rewritten, url, title };
}

/**
 * Build the proxied request URL.
 * In dev mode (no corsProxy set) we use the Vite /dev-proxy route.
 */
function buildProxyUrl(url, corsProxy) {
  if (corsProxy) {
    return `${corsProxy}?url=${encodeURIComponent(url)}`;
  }
  // Vite dev proxy — defined in vite.config.js
  return `/dev-proxy?url=${encodeURIComponent(url)}`;
}

/**
 * Rewrite all relative URLs in the HTML to absolute URLs based on the
 * original page's origin. This is necessary because the HTML will be
 * injected into an iframe via srcdoc, which has a null origin, so
 * relative URLs would otherwise break.
 */
function rewriteUrls(html, base) {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  // Ensure any existing <base> tag doesn't interfere
  doc.querySelectorAll('base').forEach(el => el.remove());

  // Inject a <base> tag so the browser resolves remaining relative URLs
  const baseEl = doc.createElement('base');
  baseEl.href = base;
  if (doc.head) {
    doc.head.prepend(baseEl);
  }

  // Explicitly rewrite common attributes to be safe across all browsers
  const srcAttrs = ['src', 'srcset', 'data-src'];
  const hrefAttrs = ['href', 'action'];

  for (const attr of srcAttrs) {
    doc.querySelectorAll(`[${attr}]`).forEach(el => {
      const val = el.getAttribute(attr);
      if (!val || val.startsWith('data:') || val.startsWith('javascript:') || val.startsWith('#')) return;
      if (attr === 'srcset') {
        // srcset is comma-separated list of "url [descriptor]"
        const resolved = val.split(',').map(part => {
          const [u, ...rest] = part.trim().split(/\s+/);
          try {
            return [new URL(u, base).href, ...rest].join(' ');
          } catch { return part; }
        }).join(', ');
        el.setAttribute('srcset', resolved);
      } else {
        try { el.setAttribute(attr, new URL(val, base).href); } catch {}
      }
    });
  }

  for (const attr of hrefAttrs) {
    doc.querySelectorAll(`[${attr}]`).forEach(el => {
      const val = el.getAttribute(attr);
      if (!val || val.startsWith('data:') || val.startsWith('javascript:') || val.startsWith('#') || val.startsWith('mailto:') || val.startsWith('tel:')) return;
      try { el.setAttribute(attr, new URL(val, base).href); } catch {}
    });
  }

  return doc.documentElement.outerHTML;
}

/** Extract the page title from the HTML (fast, no full parse needed). */
function extractTitle(html) {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match ? match[1].trim() : '';
}
