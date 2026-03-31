/**
 * history.js — localStorage-backed browsing history for the URL bar autocomplete.
 */

const HISTORY_KEY = 'web-reader-history';
const MAX_ENTRIES = 100;

/** @returns {Array<{url: string, title: string, timestamp: number}>} */
export function getHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function stripProtocol(url) {
  return url.replace(/^https?:\/\//, '');
}

/** Add or update a history entry (most-recent first, deduped by URL). */
export function addToHistory(url, title) {
  const stripped = stripProtocol(url);
  const list = getHistory().filter(e => e.url !== stripped);
  list.unshift({ url: stripped, title: title || stripped, timestamp: Date.now() });
  if (list.length > MAX_ENTRIES) list.length = MAX_ENTRIES;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
}

/** Return history entries whose URL or title contains the query string. */
export function searchHistory(query) {
  const q = query.toLowerCase();
  return getHistory().filter(
    e => e.url.toLowerCase().includes(q) || e.title.toLowerCase().includes(q)
  );
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}
