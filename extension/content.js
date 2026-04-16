/**
 * content.js — Web Reader browser extension content script.
 *
 * Injected into every http/https page. Listens for a { action: 'read' }
 * message from the popup, then:
 *   1. Extracts the article from the current page via Mozilla Readability.
 *   2. Mounts a fixed sidebar panel using Shadow DOM (style isolation).
 *   3. Drives TTS playback with the same TTSQueue used by the web app.
 *
 * Storage: chrome.storage.local (replaces localStorage from the web app).
 * CORS proxy: not needed — extensions can fetch cross-origin directly.
 */

import { parseArticle } from '../src/reader.js';
import { chunkText, TTSQueue } from '../src/tts.js';
import { STORAGE_KEY, DEFAULTS, getProviderOptions } from '../src/settings.js';
import panelCss from './panel.css?raw';

function loadSettings() {
  return new Promise(resolve => {
    chrome.storage.local.get(STORAGE_KEY, result => {
      resolve({ ...DEFAULTS, ...(result[STORAGE_KEY] ?? {}) });
    });
  });
}

function saveSettings(s) {
  return new Promise(resolve => {
    chrome.storage.local.set({ [STORAGE_KEY]: s }, resolve);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel state
// ─────────────────────────────────────────────────────────────────────────────

let hostEl      = null;  // <div> appended to document.body
let shadow      = null;  // ShadowRoot attached to hostEl
let ttsQueue    = null;
let ttsChunks   = [];
let currentIdx  = 0;
let settings    = null;

// ─────────────────────────────────────────────────────────────────────────────
// Message listener (from popup.js)
// ─────────────────────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action === 'read') {
    readCurrentPage().then(() => sendResponse({ ok: true }));
    return true; // keep message channel open for async response
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Panel HTML template
// ─────────────────────────────────────────────────────────────────────────────

const PANEL_HTML = `
<div id="panel-header">
  <span id="panel-title">Web Reader</span>
  <div id="panel-actions">
    <button id="btn-settings" title="Settings">&#9881;</button>
    <button id="btn-close"    title="Close panel">&#10005;</button>
  </div>
</div>

<div id="panel-content">
  <div id="loading" class="hidden">
    <div class="spinner"></div>
    <span>Extracting article&hellip;</span>
  </div>
  <div id="error" class="hidden"></div>
  <div id="article-view" class="hidden">
    <h1 id="article-title"></h1>
    <div id="article-byline"></div>
    <div id="article-body"></div>
  </div>

  <!-- Settings overlay (absolute, covers content area) -->
  <div id="settings-panel" class="hidden">
    <div id="settings-header">
      <h3>Settings</h3>
      <button id="btn-settings-close">&#10005;</button>
    </div>
    <div class="setting-group">
      <label>TTS Provider</label>
      <select id="s-provider">
        <option value="openai">OpenAI</option>
        <option value="elevenlabs">ElevenLabs</option>
      </select>
    </div>
    <div class="setting-group">
      <label>Model</label>
      <select id="s-model"></select>
    </div>
    <div class="setting-group">
      <label>Voice</label>
      <select id="s-voice"></select>
    </div>
    <div class="setting-group">
      <label>OpenAI API Key</label>
      <input id="s-openai-key" type="password" placeholder="sk-&hellip;" autocomplete="off">
    </div>
    <div class="setting-group" id="s-el-group">
      <label>ElevenLabs API Key</label>
      <input id="s-el-key" type="password" placeholder="&hellip;" autocomplete="off">
    </div>
    <button class="btn-save" id="btn-save-settings">Save</button>
  </div>
</div>

<div id="player-bar" class="hidden">
  <div id="progress-row">
    <div id="progress-track"><div id="progress-fill"></div></div>
    <span id="progress-label">0 / 0</span>
  </div>
  <div id="controls">
    <button id="btn-prev"  title="Previous chunk">&#9198;</button>
    <button id="btn-play"  title="Play / Pause">&#9654;</button>
    <button id="btn-stop"  title="Stop">&#9632;</button>
    <button id="btn-next"  title="Next chunk">&#9197;</button>
  </div>
</div>

<audio id="tts-audio" preload="auto"></audio>
`;

// ─────────────────────────────────────────────────────────────────────────────
// Panel lifecycle
// ─────────────────────────────────────────────────────────────────────────────

function ensurePanel() {
  if (hostEl) return;

  hostEl = document.createElement('div');
  hostEl.id = 'web-reader-ext-host';

  shadow = hostEl.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = panelCss;
  shadow.appendChild(style);

  const panel = document.createElement('div');
  panel.id = 'panel';
  panel.innerHTML = PANEL_HTML;
  shadow.appendChild(panel);

  document.documentElement.appendChild(hostEl);
  wireEvents();
}

function closePanel() {
  stopTTS();
  hostEl?.remove();
  hostEl   = null;
  shadow   = null;
  ttsQueue = null;
}

/** Shorthand querySelector inside the shadow root. */
function q(sel) {
  return shadow.querySelector(sel);
}

// ─────────────────────────────────────────────────────────────────────────────
// Event wiring
// ─────────────────────────────────────────────────────────────────────────────

function wireEvents() {
  q('#btn-close').addEventListener('click', closePanel);
  q('#btn-settings').addEventListener('click', openSettings);
  q('#btn-settings-close').addEventListener('click', closeSettings);
  q('#btn-save-settings').addEventListener('click', handleSaveSettings);

  q('#btn-play').addEventListener('click', handlePlayPause);
  q('#btn-stop').addEventListener('click', handleStop);
  q('#btn-prev').addEventListener('click', () => seekChunk(currentIdx - 1));
  q('#btn-next').addEventListener('click', () => seekChunk(currentIdx + 1));

  q('#s-provider').addEventListener('change', () => refreshProviderSelectors());
}

// ─────────────────────────────────────────────────────────────────────────────
// Core: extract and display article
// ─────────────────────────────────────────────────────────────────────────────

async function readCurrentPage() {
  ensurePanel();

  // Reset to loading state
  q('#loading').classList.remove('hidden');
  q('#error').classList.add('hidden');
  q('#article-view').classList.add('hidden');
  q('#player-bar').classList.add('hidden');
  q('#settings-panel').classList.add('hidden');
  stopTTS();

  settings = await loadSettings();

  let article;
  try {
    article = parseArticle(document.documentElement.outerHTML, location.href);
  } catch (e) {
    q('#loading').classList.add('hidden');
    q('#error').textContent = e.message;
    q('#error').classList.remove('hidden');
    return;
  }

  q('#loading').classList.add('hidden');
  q('#article-title').textContent  = article.title   ?? '';
  q('#article-byline').textContent = article.byline  ?? '';
  q('#article-body').innerHTML     = article.content ?? '';
  q('#article-view').classList.remove('hidden');
  q('#player-bar').classList.remove('hidden');

  ttsChunks  = chunkText(article.textContent ?? '', settings.chunkMaxLen);
  currentIdx = 0;
  setProgress(-1, ttsChunks.length);
}

// ─────────────────────────────────────────────────────────────────────────────
// TTS controls
// ─────────────────────────────────────────────────────────────────────────────

function handlePlayPause() {
  if (!ttsChunks.length) return;

  if (!ttsQueue || ttsQueue.isStopped) {
    startTTS(currentIdx);
    return;
  }
  if (ttsQueue.isPaused) {
    ttsQueue.resume();
    q('#btn-play').innerHTML = '&#9646;&#9646;'; // pause icon
  } else {
    ttsQueue.pause();
    q('#btn-play').innerHTML = '&#9654;'; // play icon
  }
}

function handleStop() {
  stopTTS();
  currentIdx = 0;
  setProgress(-1, ttsChunks.length);
  q('#btn-play').innerHTML = '&#9654;';
  clearHighlight();
}

function stopTTS() {
  if (ttsQueue) {
    ttsQueue.stop();
    ttsQueue = null;
  }
}

function seekChunk(index) {
  if (index < 0 || index >= ttsChunks.length) return;
  currentIdx = index;
  if (ttsQueue && !ttsQueue.isStopped) {
    ttsQueue.seekTo(index);
  } else {
    setProgress(index, ttsChunks.length);
  }
}

function startTTS(fromIndex = 0) {
  stopTTS();
  const audioEl = q('#tts-audio');
  ttsQueue = new TTSQueue(audioEl, ttsChunks, settings, {
    onChunkStart: (i) => {
      currentIdx = i;
      setProgress(i, ttsChunks.length);
      highlightChunk(i);
      q('#btn-play').innerHTML = '&#9646;&#9646;';
    },
    onProgress: (i, total) => setProgress(i, total),
    onEnd: () => {
      currentIdx = 0;
      setProgress(-1, ttsChunks.length);
      q('#btn-play').innerHTML = '&#9654;';
      clearHighlight();
    },
    onError: (msg) => showToast(msg),
  });

  if (fromIndex === 0) {
    ttsQueue.play();
  } else {
    // seekTo() works on a fresh queue and avoids wastefully fetching chunk 0
    ttsQueue.seekTo(fromIndex);
  }
}

function setProgress(index, total) {
  if (total <= 0) {
    q('#progress-fill').style.width  = '0%';
    q('#progress-label').textContent = '0 / 0';
  } else if (index < 0) {
    // Reset / idle state — no chunk active yet
    q('#progress-fill').style.width  = '0%';
    q('#progress-label').textContent = `0 / ${total}`;
  } else if (index >= total) {
    // TTSQueue fires onProgress(total, total) at end-of-stream
    q('#progress-fill').style.width  = '100%';
    q('#progress-label').textContent = `${total} / ${total}`;
  } else {
    q('#progress-fill').style.width  = `${((index + 1) / total) * 100}%`;
    q('#progress-label').textContent = `${index + 1} / ${total}`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Chunk highlighting
// ─────────────────────────────────────────────────────────────────────────────

function highlightChunk(index) {
  clearHighlight();
  const bodyEl = q('#article-body');
  const chunk  = ttsChunks[index]?.trim();
  if (!chunk || !bodyEl) return;

  // Search for the first ~25 chars of the chunk in the article text nodes.
  const needle = chunk.slice(0, 25);
  const walker = document.createTreeWalker(bodyEl, NodeFilter.SHOW_TEXT);
  let node;

  while ((node = walker.nextNode())) {
    const pos = node.textContent.indexOf(needle);
    if (pos === -1) continue;

    // Only wrap with <mark> if the full chunk fits in this single text node
    // (avoids surroundContents throwing for cross-element ranges).
    if (pos + chunk.length <= node.textContent.length) {
      const range = document.createRange();
      range.setStart(node, pos);
      range.setEnd(node, pos + chunk.length);
      const mark = document.createElement('mark');
      mark.className = 'wr-highlight';
      try {
        range.surroundContents(mark);
        mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      } catch {
        // surroundContents failed — fall through to scroll-only
      }
    }
    // Fallback: just scroll the parent element into view
    node.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
}

function clearHighlight() {
  shadow.querySelectorAll('mark.wr-highlight').forEach(mark => {
    const parent = mark.parentNode;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
    parent.normalize();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings panel
// ─────────────────────────────────────────────────────────────────────────────

async function openSettings() {
  settings = await loadSettings();

  q('#s-provider').value   = settings.provider;
  q('#s-openai-key').value = settings.openaiKey     ?? '';
  q('#s-el-key').value     = settings.elevenlabsKey ?? '';

  refreshProviderSelectors();

  // Restore saved model/voice after populating options
  q('#s-model').value = settings.model;
  q('#s-voice').value = settings.voice;

  q('#settings-panel').classList.remove('hidden');
}

function closeSettings() {
  q('#settings-panel').classList.add('hidden');
}

function refreshProviderSelectors() {
  const provider = q('#s-provider').value;
  const opts     = getProviderOptions(provider);

  q('#s-model').innerHTML = opts.models
    .map(m => `<option value="${m.value}">${m.label}</option>`)
    .join('');

  q('#s-voice').innerHTML = opts.voices
    .map(v => `<option value="${v.value}">${v.label}</option>`)
    .join('');

  q('#s-el-group').style.display = provider === 'elevenlabs' ? '' : 'none';
}

async function handleSaveSettings() {
  const updated = {
    ...settings,
    provider:      q('#s-provider').value,
    model:         q('#s-model').value,
    voice:         q('#s-voice').value,
    openaiKey:     q('#s-openai-key').value.trim(),
    elevenlabsKey: q('#s-el-key').value.trim(),
  };
  await saveSettings(updated);
  settings = updated;
  closeSettings();
  showToast('Settings saved');
}

// ─────────────────────────────────────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────────────────────────────────────

function showToast(msg) {
  shadow.querySelectorAll('.wr-toast').forEach(t => t.remove());
  const toast = document.createElement('div');
  toast.className    = 'wr-toast';
  toast.textContent  = msg;
  q('#panel').appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
