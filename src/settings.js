/**
 * settings.js — localStorage-backed settings manager
 *
 * All user preferences and API keys are stored in the browser only.
 * Nothing is sent to any server except the TTS/content provider APIs
 * the user explicitly configures.
 */

export const STORAGE_KEY = 'web-reader-settings';

const PROVIDER_OPTIONS = {
  openai: {
    models: [
      { value: 'tts-1',    label: 'TTS-1 (faster)' },
      { value: 'tts-1-hd', label: 'TTS-1 HD (higher quality)' },
    ],
    voices: [
      { value: 'alloy',   label: 'Alloy' },
      { value: 'echo',    label: 'Echo' },
      { value: 'fable',   label: 'Fable' },
      { value: 'onyx',    label: 'Onyx' },
      { value: 'nova',    label: 'Nova' },
      { value: 'shimmer', label: 'Shimmer' },
    ],
  },
  elevenlabs: {
    models: [
      { value: 'eleven_multilingual_v2', label: 'Multilingual v2' },
      { value: 'eleven_flash_v2_5',      label: 'Flash v2.5 (fast, free tier)' },
    ],
    // Common ElevenLabs pre-made voices (ID → display name)
    voices: [
      { value: '21m00Tcm4TlvDq8ikWAM', label: 'Rachel' },
      { value: 'AZnzlk1XvdvUeBnXmlld', label: 'Domi' },
      { value: 'EXAVITQu4vr4xnSDxMaL', label: 'Bella' },
      { value: 'ErXwobaYiN019PkySvjV', label: 'Antoni' },
      { value: 'MF3mGyEYCl7XYWbV9V6O', label: 'Elli' },
      { value: 'TxGEqnHWrfWFTfGW9XjX', label: 'Josh' },
      { value: 'VR6AewLTigWG4xSOukaG', label: 'Arnold' },
      { value: 'pNInz6obpgDQGcFmaJgB', label: 'Adam' },
      { value: 'yoZ06aMxZJJ28mfd3POQ', label: 'Sam' },
    ],
  },
};

export const DEFAULTS = {
  provider: 'openai',
  model: 'tts-1',
  voice: 'alloy',
  openaiKey: '',
  elevenlabsKey: '',
  corsProxy: 'https://corsbeater.wejick.workers.dev',
  chunkMaxLen: 300,
};

/** Load settings from localStorage, merging with defaults. */
export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULTS, ...JSON.parse(raw) };
    }
  } catch {
    // ignore parse errors
  }
  return { ...DEFAULTS };
}

/** Save settings object to localStorage. */
export function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

/** Return model and voice options for a given provider. */
export function getProviderOptions(provider) {
  return PROVIDER_OPTIONS[provider] ?? PROVIDER_OPTIONS.openai;
}

/**
 * Fetch available voices from the ElevenLabs API for this account.
 * Returns an array of { value, label } options.
 * @param {string} apiKey
 * @returns {Promise<Array<{value: string, label: string}>>}
 */
export async function fetchElevenLabsVoices(apiKey) {
  const res = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: { 'xi-api-key': apiKey },
  });
  if (!res.ok) throw new Error(`ElevenLabs API error: HTTP ${res.status}`);
  const data = await res.json();
  return data.voices
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(v => ({ value: v.voice_id, label: v.name }));
}

/**
 * Fetch available TTS models from the ElevenLabs API.
 * Returns an array of { value, label } options.
 * @param {string} apiKey
 * @returns {Promise<Array<{value: string, label: string}>>}
 */
export async function fetchElevenLabsModels(apiKey) {
  const res = await fetch('https://api.elevenlabs.io/v1/models', {
    headers: { 'xi-api-key': apiKey },
  });
  if (!res.ok) throw new Error(`ElevenLabs API error: HTTP ${res.status}`);
  const data = await res.json();
  return data
    .filter(m => m.can_do_text_to_speech)
    .map(m => ({ value: m.model_id, label: m.name }));
}

/** Populate the model and voice <select> elements for a given provider. */
export function populateModelVoiceSelectors(provider, modelEl, voiceEl, currentModel, currentVoice) {
  const opts = getProviderOptions(provider);

  // Models
  modelEl.innerHTML = '';
  for (const m of opts.models) {
    const option = document.createElement('option');
    option.value = m.value;
    option.textContent = m.label;
    if (m.value === currentModel) option.selected = true;
    modelEl.appendChild(option);
  }

  // Voices
  voiceEl.innerHTML = '';
  for (const v of opts.voices) {
    const option = document.createElement('option');
    option.value = v.value;
    option.textContent = v.label;
    if (v.value === currentVoice) option.selected = true;
    voiceEl.appendChild(option);
  }

  // If saved value doesn't match any option, fall back to first
  if (!modelEl.value) modelEl.selectedIndex = 0;
  if (!voiceEl.value) voiceEl.selectedIndex = 0;
}
