/**
 * settings.js — localStorage-backed settings manager
 *
 * All user preferences and API keys are stored in the browser only.
 * Nothing is sent to any server except the TTS/content provider APIs
 * the user explicitly configures.
 */

export const STORAGE_KEY = 'web-reader-settings';

// Shared voice sets, reused across models/providers that expose the same voices.

const OPENAI_VOICES = [
  { value: 'alloy',   label: 'Alloy' },
  { value: 'echo',    label: 'Echo' },
  { value: 'fable',   label: 'Fable' },
  { value: 'onyx',    label: 'Onyx' },
  { value: 'nova',    label: 'Nova' },
  { value: 'shimmer', label: 'Shimmer' },
];

// Common ElevenLabs pre-made voices (ID → display name). ElevenLabs voice
// IDs work across all of the account's models, so every ElevenLabs model
// shares this list.
const ELEVENLABS_VOICES = [
  { value: '21m00Tcm4TlvDq8ikWAM', label: 'Rachel' },
  { value: 'AZnzlk1XvdvUeBnXmlld', label: 'Domi' },
  { value: 'EXAVITQu4vr4xnSDxMaL', label: 'Bella' },
  { value: 'ErXwobaYiN019PkySvjV', label: 'Antoni' },
  { value: 'MF3mGyEYCl7XYWbV9V6O', label: 'Elli' },
  { value: 'TxGEqnHWrfWFTfGW9XjX', label: 'Josh' },
  { value: 'VR6AewLTigWG4xSOukaG', label: 'Arnold' },
  { value: 'pNInz6obpgDQGcFmaJgB', label: 'Adam' },
  { value: 'yoZ06aMxZJJ28mfd3POQ', label: 'Sam' },
];

const GEMINI_TTS_VOICES = [
  { value: 'Zephyr',   label: 'Zephyr (bright)' },
  { value: 'Puck',     label: 'Puck (upbeat)' },
  { value: 'Charon',   label: 'Charon (informative)' },
  { value: 'Kore',     label: 'Kore (firm)' },
  { value: 'Fenrir',   label: 'Fenrir (excitable)' },
  { value: 'Leda',     label: 'Leda (youthful)' },
  { value: 'Orus',     label: 'Orus (firm)' },
  { value: 'Aoede',    label: 'Aoede (breezy)' },
  { value: 'Autonoe',  label: 'Autonoe (bright)' },
  { value: 'Sulafat',  label: 'Sulafat (warm)' },
];

const FLUX_TTS_VOICES = [
  { value: 'flux-alexis-en',   label: 'Alexis' },
  { value: 'flux-bree-en',     label: 'Bree' },
  { value: 'flux-brittany-en', label: 'Brittany' },
  { value: 'flux-brooke-en',   label: 'Brooke' },
  { value: 'flux-bruce-en',    label: 'Bruce' },
  { value: 'flux-cliff-en',    label: 'Cliff' },
  { value: 'flux-cole-en',     label: 'Cole' },
  { value: 'flux-colin-en',    label: 'Colin' },
  { value: 'flux-conor-en',    label: 'Conor' },
  { value: 'flux-donovan-en',  label: 'Donovan' },
  { value: 'flux-drew-en',     label: 'Drew' },
  { value: 'flux-elise-en',    label: 'Elise' },
  { value: 'flux-gemma-en',    label: 'Gemma' },
  { value: 'flux-haley-en',    label: 'Haley' },
  { value: 'flux-hannah-en',   label: 'Hannah' },
  { value: 'flux-heather-en',  label: 'Heather' },
  { value: 'flux-jack-en',     label: 'Jack' },
  { value: 'flux-kai-en',      label: 'Kai' },
  { value: 'flux-kelsey-en',   label: 'Kelsey' },
  { value: 'flux-kit-en',      label: 'Kit' },
  { value: 'flux-maeve-en',    label: 'Maeve' },
  { value: 'flux-marcelo-en',  label: 'Marcelo' },
  { value: 'flux-marcus-en',   label: 'Marcus' },
  { value: 'flux-meena-en',    label: 'Meena' },
  { value: 'flux-meghan-en',   label: 'Meghan' },
  { value: 'flux-miles-en',    label: 'Miles' },
  { value: 'flux-naveen-en',   label: 'Naveen' },
  { value: 'flux-paige-en',    label: 'Paige' },
  { value: 'flux-priya-en',    label: 'Priya' },
  { value: 'flux-rufus-en',    label: 'Rufus' },
  { value: 'flux-sean-en',     label: 'Sean' },
  { value: 'flux-sharon-en',   label: 'Sharon' },
  { value: 'flux-sienna-en',   label: 'Sienna' },
  { value: 'flux-tanner-en',   label: 'Tanner' },
  { value: 'flux-wade-en',     label: 'Wade' },
  { value: 'flux-wes-en',      label: 'Wes' },
];

// Fish Audio identifies voices by opaque IDs from its voice library rather
// than a fixed enum; this is the only one OpenRouter's docs give an example
// for, so it's the sole option until more are confirmed.
const FISH_AUDIO_VOICES = [
  { value: 'b347db033a6549378b48d00acb0d06cd', label: 'Default (documented example voice)' },
];

const KOKORO_VOICES = [
  { value: 'af_heart',  label: 'Heart (US female, default)' },
  { value: 'af_bella',  label: 'Bella (US female)' },
  { value: 'af_nicole', label: 'Nicole (US female)' },
  { value: 'af_nova',   label: 'Nova (US female)' },
  { value: 'af_sarah',  label: 'Sarah (US female)' },
  { value: 'af_sky',    label: 'Sky (US female)' },
  { value: 'am_adam',   label: 'Adam (US male)' },
  { value: 'am_michael', label: 'Michael (US male)' },
  { value: 'am_onyx',   label: 'Onyx (US male)' },
  { value: 'am_puck',   label: 'Puck (US male)' },
];

// Each provider is a list of models, and each model carries its own voice
// list — voices are not interchangeable across models (e.g. an OpenRouter
// Gemini voice name means nothing to the OpenRouter Kokoro model), so the
// model→voice pairing has to be looked up together, not provider→voice.
const PROVIDER_MODELS = {
  openai: [
    { value: 'tts-1',    label: 'TTS-1 (faster)',              voices: OPENAI_VOICES },
    { value: 'tts-1-hd', label: 'TTS-1 HD (higher quality)',   voices: OPENAI_VOICES },
  ],
  elevenlabs: [
    { value: 'eleven_multilingual_v2', label: 'Multilingual v2',              voices: ELEVENLABS_VOICES },
    { value: 'eleven_flash_v2_5',      label: 'Flash v2.5 (fast, free tier)', voices: ELEVENLABS_VOICES },
  ],
  openrouter: [
    { value: 'deepgram/flux-tts:free',              label: 'Flux TTS (Deepgram, free)',       voices: FLUX_TTS_VOICES },
    { value: 'google/gemini-3.1-flash-tts-preview', label: 'Gemini 3.1 Flash TTS (Google)',   voices: GEMINI_TTS_VOICES },
    { value: 'hexgrad/kokoro-82m',                  label: 'Kokoro 82M (free, open-weight)',  voices: KOKORO_VOICES },
    { value: 'fish-audio/s2.1-pro-free:free',       label: 'S2.1 Pro (Fish Audio, free)',     voices: FISH_AUDIO_VOICES },
  ],
};

export const DEFAULTS = {
  provider: 'openai',
  model: 'tts-1',
  voice: 'alloy',
  openaiKey: '',
  elevenlabsKey: '',
  openrouterKey: '',
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

function modelsFor(provider) {
  return PROVIDER_MODELS[provider] ?? PROVIDER_MODELS.openai;
}

/** Return the { value, label } model options for a given provider. */
export function getModelsForProvider(provider) {
  return modelsFor(provider).map(({ value, label }) => ({ value, label }));
}

/**
 * Return the { value, label } voice options for a given provider + model.
 * Falls back to the provider's first model's voices if `model` doesn't
 * match any known model (e.g. a stale saved setting).
 */
export function getVoicesForModel(provider, model) {
  const models = modelsFor(provider);
  const found = models.find(m => m.value === model);
  return (found ?? models[0]).voices;
}

/**
 * Fetch available voices from the ElevenLabs API for this account.
 * Returns an array of { value, label } options.
 * @param {string} apiKey
 * @returns {Promise<Array<{value: string, label: string}>>}
 */
export async function fetchElevenLabsVoices(apiKey) {
  const res = await fetch('https://api.elevenlabs.io/v1/voices?show_legacy=true', {
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

/** Populate a <select> element with { value, label } options, selecting `current` if present. */
function populateSelect(selectEl, options, current) {
  selectEl.innerHTML = '';
  for (const opt of options) {
    const option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.label;
    if (opt.value === current) option.selected = true;
    selectEl.appendChild(option);
  }
  if (!selectEl.value) selectEl.selectedIndex = 0;
}

/** Populate the voice <select> for a given provider + model, selecting `currentVoice` if present. */
export function populateVoiceSelector(provider, model, voiceEl, currentVoice) {
  populateSelect(voiceEl, getVoicesForModel(provider, model), currentVoice);
}

/** Populate the model and voice <select> elements for a given provider. */
export function populateModelVoiceSelectors(provider, modelEl, voiceEl, currentModel, currentVoice) {
  populateSelect(modelEl, getModelsForProvider(provider), currentModel);
  populateVoiceSelector(provider, modelEl.value, voiceEl, currentVoice);
}
