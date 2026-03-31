/**
 * main.js — App entry point. Wires together settings, loader, reader, and TTS.
 */

import { loadSettings, saveSettings, populateModelVoiceSelectors, fetchElevenLabsVoices, fetchElevenLabsModels } from './settings.js';
import { addToHistory, getHistory, searchHistory, clearHistory } from './history.js';
import { fetchPage } from './loader.js';
import { parseArticle } from './reader.js';
import { chunkText, TTSQueue } from './tts.js';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const state = {
  currentUrl:   null,    // URL of the currently loaded page
  rawHtml:      null,    // full proxied HTML
  article:      null,    // parsed { title, content, textContent, byline }
  isReaderMode: false,
  ttsQueue:     null,    // active TTSQueue instance
  ttsChunks:    [],      // text chunks derived from article.textContent
  settings:     loadSettings(),
  navStack:     [],      // visited URLs for back/forward
  navIndex:     -1,      // current position in navStack
};

// ---------------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------------
const $ = id => document.getElementById(id);

const urlInput       = $('url-input');
const urlSuggestions = $('url-suggestions');
const loadBtn        = $('load-btn');
const backBtn        = $('back-btn');
const forwardBtn     = $('forward-btn');
const readerToggle  = $('reader-toggle');
const playBtn       = $('play-btn');
const stopBtn       = $('stop-btn');
const settingsBtn   = $('settings-btn');
const settingsPanel = $('settings-panel');
const settingsClose = $('settings-close');
const settingsSave  = $('settings-save');
const webFrame      = $('web-frame');
const readerView    = $('reader-view');
const readerTitle   = $('reader-title');
const readerByline  = $('reader-byline');
const readerContent = $('reader-content');
const emptyState    = $('empty-state');
const audioEl       = $('tts-audio');
const progressFill  = $('tts-progress-fill');
const toastContainer = $('toast-container');

// Settings form elements
const providerSel   = $('tts-provider');
const modelSel      = $('tts-model');
const voiceSel      = $('tts-voice');
const openaiKeyIn   = $('openai-key');
const elevenlabsKeyIn = $('elevenlabs-key');
const corsProxyIn   = $('cors-proxy');

// ---------------------------------------------------------------------------
// Back / Forward navigation
// ---------------------------------------------------------------------------

function updateNavButtons() {
  backBtn.disabled    = state.navIndex <= 0;
  forwardBtn.disabled = state.navIndex >= state.navStack.length - 1;
}

/** Push a URL onto the nav stack (truncates forward history). */
function pushNav(url) {
  // Truncate anything ahead of current position
  state.navStack.splice(state.navIndex + 1);
  state.navStack.push(url);
  state.navIndex = state.navStack.length - 1;
  updateNavButtons();
}

async function navigateBack() {
  if (state.navIndex <= 0) return;
  state.navIndex--;
  const url = state.navStack[state.navIndex];
  urlInput.value = url;
  await handleLoad({ skipPush: true });
}

async function navigateForward() {
  if (state.navIndex >= state.navStack.length - 1) return;
  state.navIndex++;
  const url = state.navStack[state.navIndex];
  urlInput.value = url;
  await handleLoad({ skipPush: true });
}

// ---------------------------------------------------------------------------
// URL autocomplete
// ---------------------------------------------------------------------------

let acIndex = -1;
let acItems = [];

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderSuggestions(items) {
  acItems = items;
  acIndex = -1;
  urlSuggestions.innerHTML = '';

  if (!items.length) {
    urlSuggestions.hidden = true;
    return;
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const div = document.createElement('div');
    div.className = 'suggestion-item';
    div.innerHTML =
      `<span class="suggestion-title">${escapeHtml(item.title)}</span>` +
      `<span class="suggestion-url">${escapeHtml(item.url)}</span>`;
    div.addEventListener('mousedown', e => {
      e.preventDefault(); // keep focus on input
      selectSuggestion(i);
    });
    urlSuggestions.appendChild(div);
  }

  urlSuggestions.hidden = false;
}

function hideSuggestions() {
  urlSuggestions.hidden = true;
  acItems = [];
  acIndex = -1;
}

function setAcActive(index) {
  urlSuggestions.querySelectorAll('.suggestion-item').forEach((el, i) => {
    el.classList.toggle('ac-active', i === index);
  });
  const active = urlSuggestions.querySelector('.ac-active');
  if (active) active.scrollIntoView({ block: 'nearest' });
}

function selectSuggestion(index) {
  const item = acItems[index];
  if (!item) return;
  urlInput.value = item.url;
  hideSuggestions();
  handleLoad();
}

function updateSuggestions() {
  const q = urlInput.value.trim();
  if (!q) {
    const recent = getHistory().slice(0, 8);
    renderSuggestions(recent);
  } else {
    renderSuggestions(searchHistory(q).slice(0, 8));
  }
}

// ---------------------------------------------------------------------------
// Toast notifications
// ---------------------------------------------------------------------------

function showToast(message, type = 'error', duration = 4500) {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  toastContainer.appendChild(el);

  const remove = () => {
    el.classList.add('fade-out');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  };

  const timer = setTimeout(remove, duration);
  el.addEventListener('click', () => { clearTimeout(timer); remove(); });
}

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------

function updateProgress(current, total) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  progressFill.style.width = `${pct}%`;
}

function resetProgress() {
  progressFill.style.width = '0%';
}

// ---------------------------------------------------------------------------
// Chunk highlight
// ---------------------------------------------------------------------------

function buildHighlightedDOM(chunks) {
  readerContent.innerHTML = state.article.content;

  // Remove empty block elements that add visual noise
  readerContent.querySelectorAll('p, div').forEach(el => {
    if (!el.textContent.trim() && !el.querySelector('img, figure, video, iframe')) {
      el.remove();
    }
  });

  if (!chunks.length) return;

  // Collect block-level elements that have text content
  const blocks = Array.from(
    readerContent.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote, td, th')
  ).filter(el => el.textContent.trim());

  if (!blocks.length) return;

  // Build flat text from blocks and record each block's start offset
  const blockOffsets = [];
  let flatText = '';
  for (const block of blocks) {
    blockOffsets.push(flatText.length);
    flatText += block.textContent;
  }

  // For each chunk, find its start in the flat text and assign data-chunk
  // to the block element that contains that position.
  let searchFrom = 0;
  for (let i = 0; i < chunks.length; i++) {
    const needle = chunks[i].slice(0, 50).trim();
    const found = flatText.indexOf(needle, searchFrom);
    if (found === -1) continue;

    // Find the block that contains this position
    let blockIdx = 0;
    for (let j = blockOffsets.length - 1; j >= 0; j--) {
      if (blockOffsets[j] <= found) { blockIdx = j; break; }
    }

    // Only assign if not already tagged (first chunk in a block wins)
    if (!blocks[blockIdx].dataset.chunk) {
      blocks[blockIdx].dataset.chunk = i;
    }

    searchFrom = found + chunks[i].length;
  }
}

function highlightChunk(index) {
  // Remove previous highlight
  const prev = readerContent.querySelector('[data-chunk].speaking');
  if (prev) prev.classList.remove('speaking');

  const el = readerContent.querySelector(`[data-chunk="${index}"]`);
  if (!el) return;

  el.classList.add('speaking');
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function clearHighlight() {
  readerContent.querySelectorAll('[data-chunk].speaking')
    .forEach(el => el.classList.remove('speaking'));
}

// ---------------------------------------------------------------------------
// Link interception helpers
// ---------------------------------------------------------------------------

/**
 * Inject a script into the srcdoc HTML so that link clicks inside the iframe
 * are posted to the parent instead of navigating the frame.
 */
function injectLinkIntercept(html) {
  const script = `<script>document.addEventListener('click',function(e){var a=e.target.closest('a[href]');if(!a)return;var h=a.getAttribute('href');if(!h||/^(#|javascript:|mailto:|tel:)/.test(h))return;e.preventDefault();window.parent.postMessage({type:'navigate',url:a.href},'*');});<\/script>`;
  const idx = html.lastIndexOf('</body>');
  if (idx !== -1) return html.slice(0, idx) + script + html.slice(idx);
  return html + script;
}

// ---------------------------------------------------------------------------
// Page loader
// ---------------------------------------------------------------------------

async function handleLoad({ skipPush = false } = {}) {
  const url = urlInput.value.trim();
  if (!url) {
    showToast('Please enter a URL.', 'error');
    return;
  }

  // Stop any playing TTS
  stopTTS();
  resetProgress();

  // UI: loading state
  loadBtn.classList.add('loading');
  loadBtn.disabled = true;
  readerToggle.disabled = true;
  playBtn.disabled = true;
  stopBtn.disabled = true;
  emptyState.classList.add('hidden');
  webFrame.srcdoc = '';
  readerView.hidden = true;

  // Reset state
  state.article = null;
  state.isReaderMode = false;
  readerToggle.classList.remove('active');

  try {
    const { html, title } = await fetchPage(url, state.settings.corsProxy);
    state.rawHtml    = html;
    state.currentUrl = url;

    // Show in iframe (with link-intercept script so clicks load via the app)
    webFrame.srcdoc = injectLinkIntercept(html);
    webFrame.hidden = false;
    readerView.hidden = true;

    // Update document title and save to history
    if (title) document.title = `${title} — Web Reader`;
    addToHistory(url, title || url);
    if (!skipPush) pushNav(url);

    // Enable controls
    readerToggle.disabled = false;
    playBtn.disabled = false;

  } catch (err) {
    showToast(err.message, 'error');
    emptyState.classList.remove('hidden');
  } finally {
    loadBtn.classList.remove('loading');
    loadBtn.disabled = false;
  }
}

// ---------------------------------------------------------------------------
// Reader mode
// ---------------------------------------------------------------------------

async function toggleReaderMode() {
  if (!state.rawHtml) return;

  if (!state.isReaderMode) {
    // Switch to reader mode
    if (!state.article) {
      readerToggle.classList.add('loading');
      readerToggle.disabled = true;
      try {
        state.article = parseArticle(state.rawHtml, state.currentUrl);
      } catch (err) {
        showToast(err.message, 'error');
        readerToggle.classList.remove('loading');
        readerToggle.disabled = false;
        return;
      } finally {
        readerToggle.classList.remove('loading');
        readerToggle.disabled = false;
      }
    }

    // Populate reader view
    readerTitle.textContent  = state.article.title;
    readerByline.textContent = state.article.byline || state.article.siteName || '';

    // Chunk and build highlighted DOM
    state.ttsChunks = chunkText(state.article.textContent);
    buildHighlightedDOM(state.ttsChunks);

    webFrame.hidden   = true;
    readerView.hidden = false;
    state.isReaderMode = true;
    readerToggle.classList.add('active');
    readerToggle.title = 'Exit reader mode';

    // Enable play if we have text
    playBtn.disabled = (state.ttsChunks.length === 0);

  } else {
    // Switch back to web view
    stopTTS();
    webFrame.hidden   = false;
    readerView.hidden = true;
    state.isReaderMode = false;
    readerToggle.classList.remove('active');
    readerToggle.title = 'Toggle reader mode';
  }
}

// ---------------------------------------------------------------------------
// TTS playback
// ---------------------------------------------------------------------------

function stopTTS() {
  if (state.ttsQueue) {
    state.ttsQueue.stop();
    state.ttsQueue = null;
  }
  clearHighlight();
  resetProgress();
  setPlayState(false);
  stopBtn.disabled = true;
}

function setPlayState(playing) {
  const icon  = $('play-icon');
  const label = $('play-label');
  if (playing) {
    icon.textContent  = '⏸';
    label.textContent = 'Pause';
    playBtn.classList.add('btn-accent');
  } else {
    icon.textContent  = '▶';
    label.textContent = 'Play';
  }
}

async function handlePlayPause() {
  // No article text — try to parse first
  if (!state.article && state.rawHtml) {
    if (!state.isReaderMode) {
      await toggleReaderMode();
    }
  }

  if (!state.ttsChunks.length) {
    showToast('No readable text found. Try enabling Reader Mode first.', 'info');
    return;
  }

  // Resume if paused
  if (state.ttsQueue && state.ttsQueue.isPaused) {
    state.ttsQueue.resume();
    setPlayState(true);
    return;
  }

  // Pause if playing
  if (state.ttsQueue && !state.ttsQueue.isStopped && !state.ttsQueue.isPaused) {
    state.ttsQueue.pause();
    setPlayState(false);
    return;
  }

  // Start fresh
  stopTTS();

  state.ttsQueue = new TTSQueue(
    audioEl,
    state.ttsChunks,
    state.settings,
    {
      onChunkStart(index) {
        highlightChunk(index);
      },
      onProgress(index, total) {
        updateProgress(index, total);
      },
      onEnd() {
        setPlayState(false);
        stopBtn.disabled = true;
        updateProgress(state.ttsChunks.length, state.ttsChunks.length);
        clearHighlight();
        showToast('Finished reading.', 'success', 3000);
      },
      onError(msg) {
        showToast(msg, 'error');
      },
    }
  );

  setPlayState(true);
  stopBtn.disabled = false;
  await state.ttsQueue.play();
}

// ---------------------------------------------------------------------------
// Settings panel
// ---------------------------------------------------------------------------

function openSettings() {
  // Populate form with current settings
  providerSel.value     = state.settings.provider;
  openaiKeyIn.value     = state.settings.openaiKey;
  elevenlabsKeyIn.value = state.settings.elevenlabsKey;
  corsProxyIn.value     = state.settings.corsProxy;

  populateModelVoiceSelectors(
    state.settings.provider,
    modelSel,
    voiceSel,
    state.settings.model,
    state.settings.voice,
  );

  settingsPanel.hidden = false;
  // Trigger CSS transition on next frame
  requestAnimationFrame(() => settingsPanel.classList.add('open'));

  // Auto-fetch ElevenLabs voices and models if key is available
  if (state.settings.provider === 'elevenlabs' && state.settings.elevenlabsKey) {
    loadElevenLabsOptions(state.settings.elevenlabsKey);
  }
}

async function loadElevenLabsOptions(apiKey) {
  try {
    const [voices, models] = await Promise.all([
      fetchElevenLabsVoices(apiKey),
      fetchElevenLabsModels(apiKey),
    ]);

    if (models.length) {
      modelSel.innerHTML = '';
      for (const m of models) {
        const opt = document.createElement('option');
        opt.value = m.value;
        opt.textContent = m.label;
        if (m.value === state.settings.model) opt.selected = true;
        modelSel.appendChild(opt);
      }
      if (!modelSel.value) modelSel.selectedIndex = 0;
    }

    if (voices.length) {
      voiceSel.innerHTML = '';
      for (const v of voices) {
        const opt = document.createElement('option');
        opt.value = v.value;
        opt.textContent = v.label;
        if (v.value === state.settings.voice) opt.selected = true;
        voiceSel.appendChild(opt);
      }
      if (!voiceSel.value) voiceSel.selectedIndex = 0;
    }

    // Persist the resolved model/voice back to settings
    state.settings.model = modelSel.value;
    state.settings.voice = voiceSel.value;
    saveSettings(state.settings);
  } catch (err) {
    showToast(`Could not load ElevenLabs options: ${err.message}`, 'error');
  }
}

function closeSettings() {
  settingsPanel.classList.remove('open');
  settingsPanel.addEventListener('transitionend', () => {
    settingsPanel.hidden = true;
  }, { once: true });
}

function handleSettingsSave() {
  state.settings = {
    ...state.settings,
    provider:      providerSel.value,
    model:         modelSel.value,
    voice:         voiceSel.value,
    openaiKey:     openaiKeyIn.value.trim(),
    elevenlabsKey: elevenlabsKeyIn.value.trim(),
    corsProxy:     corsProxyIn.value.trim(),
  };

  saveSettings(state.settings);
  closeSettings();
  showToast('Settings saved.', 'success', 2500);

  // If TTS was playing, stop it so it picks up new settings on next play
  if (state.ttsQueue && !state.ttsQueue.isStopped) {
    stopTTS();
    showToast('TTS stopped — settings updated. Press Play to restart.', 'info');
  }
}

// ---------------------------------------------------------------------------
// Event wiring
// ---------------------------------------------------------------------------

// Load button + URL input interactions
loadBtn.addEventListener('click', handleLoad);
backBtn.addEventListener('click', navigateBack);
forwardBtn.addEventListener('click', navigateForward);

urlInput.addEventListener('focus', updateSuggestions);
urlInput.addEventListener('input', updateSuggestions);
urlInput.addEventListener('blur', () => setTimeout(hideSuggestions, 150));

urlInput.addEventListener('keydown', e => {
  if (!urlSuggestions.hidden) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      acIndex = Math.min(acIndex + 1, acItems.length - 1);
      setAcActive(acIndex);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      acIndex = Math.max(acIndex - 1, -1);
      setAcActive(acIndex);
      return;
    }
    if (e.key === 'Enter' && acIndex >= 0) {
      e.preventDefault();
      selectSuggestion(acIndex);
      return;
    }
    if (e.key === 'Escape') {
      hideSuggestions();
      return;
    }
  }
  if (e.key === 'Enter') handleLoad();
});

// Reader toggle
readerToggle.addEventListener('click', toggleReaderMode);

// Playback controls
playBtn.addEventListener('click', handlePlayPause);
stopBtn.addEventListener('click', stopTTS);

// Settings
settingsBtn.addEventListener('click', openSettings);
settingsClose.addEventListener('click', closeSettings);
settingsSave.addEventListener('click', handleSettingsSave);
$('clear-history-btn').addEventListener('click', () => {
  clearHistory();
  showToast('Browsing history cleared.', 'success', 2500);
});

// Provider change → update model/voice dropdowns; auto-fetch ElevenLabs options
providerSel.addEventListener('change', () => {
  populateModelVoiceSelectors(
    providerSel.value,
    modelSel,
    voiceSel,
    state.settings.model,
    state.settings.voice,
  );
  if (providerSel.value === 'elevenlabs' && elevenlabsKeyIn.value.trim()) {
    loadElevenLabsOptions(elevenlabsKeyIn.value.trim());
  }
});

// Close settings panel when clicking outside of it
document.addEventListener('click', e => {
  if (
    !settingsPanel.hidden &&
    !settingsPanel.contains(e.target) &&
    e.target !== settingsBtn
  ) {
    closeSettings();
  }
});

// Keyboard shortcut: Escape closes settings
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !settingsPanel.hidden) closeSettings();
});

// Handle link clicks from the iframe (postMessage from injectLinkIntercept)
window.addEventListener('message', e => {
  if (e.data && e.data.type === 'navigate' && e.data.url) {
    urlInput.value = e.data.url;
    handleLoad();
  }
});

// Handle link clicks in reader mode via event delegation
readerContent.addEventListener('click', e => {
  const a = e.target.closest('a[href]');
  if (!a) return;
  const href = a.getAttribute('href');
  if (!href || /^(#|javascript:|mailto:|tel:)/.test(href)) return;
  e.preventDefault();
  urlInput.value = a.href;
  handleLoad();
});

// Offline indicator
window.addEventListener('offline', () => showToast('You appear to be offline.', 'error', 8000));

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

(function init() {
  // Populate model/voice dropdowns with saved settings
  populateModelVoiceSelectors(
    state.settings.provider,
    modelSel,
    voiceSel,
    state.settings.model,
    state.settings.voice,
  );

  // Pre-fill settings form values
  providerSel.value     = state.settings.provider;
  openaiKeyIn.value     = state.settings.openaiKey;
  elevenlabsKeyIn.value = state.settings.elevenlabsKey;
  corsProxyIn.value     = state.settings.corsProxy;

  // Focus URL input
  urlInput.focus();
})();
