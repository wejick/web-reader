/**
 * settings.js — localStorage-backed settings manager
 *
 * All user preferences and API keys are stored in the browser only.
 * Nothing is sent to any server except the TTS/content provider APIs
 * the user explicitly configures.
 */

const STORAGE_KEY = 'web-reader-settings';

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
      { value: 'eleven_monolingual_v1',  label: 'Monolingual v1' },
      { value: 'eleven_multilingual_v2', label: 'Multilingual v2' },
      { value: 'eleven_turbo_v2',        label: 'Turbo v2 (fast)' },
      { value: 'eleven_turbo_v2_5',      label: 'Turbo v2.5 (fast)' },
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

const DEFAULTS = {
  provider: 'openai',
  model: 'tts-1',
  voice: 'alloy',
  openaiKey: '',
  elevenlabsKey: '',
  corsProxy: 'https://corsproxy.io/?url=',
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
