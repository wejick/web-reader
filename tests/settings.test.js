import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadSettings, saveSettings, getModelsForProvider, getVoicesForModel, populateModelVoiceSelectors, populateVoiceSelector, fetchElevenLabsVoices } from '../src/settings.js';

describe('settings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('loadSettings', () => {
    it('returns defaults when nothing is stored', () => {
      const s = loadSettings();
      expect(s.provider).toBe('openai');
      expect(s.model).toBe('tts-1');
      expect(s.voice).toBe('alloy');
      expect(s.openaiKey).toBe('');
      expect(s.elevenlabsKey).toBe('');
      expect(s.openrouterKey).toBe('');
      expect(s.corsProxy).toBe('https://corsbeater.wejick.workers.dev');
    });

    it('merges saved settings with defaults', () => {
      localStorage.setItem('web-reader-settings', JSON.stringify({ provider: 'elevenlabs', voice: 'custom' }));
      const s = loadSettings();
      expect(s.provider).toBe('elevenlabs');
      expect(s.voice).toBe('custom');
      // defaults still present
      expect(s.model).toBe('tts-1');
    });

    it('returns defaults on corrupt JSON', () => {
      localStorage.setItem('web-reader-settings', '{bad json');
      const s = loadSettings();
      expect(s.provider).toBe('openai');
    });
  });

  describe('saveSettings', () => {
    it('persists settings to localStorage', () => {
      saveSettings({ provider: 'elevenlabs', model: 'eleven_turbo_v2' });
      const raw = JSON.parse(localStorage.getItem('web-reader-settings'));
      expect(raw.provider).toBe('elevenlabs');
      expect(raw.model).toBe('eleven_turbo_v2');
    });
  });

  describe('getModelsForProvider / getVoicesForModel', () => {
    it('returns openai models and per-model voices', () => {
      const models = getModelsForProvider('openai');
      expect(models.length).toBeGreaterThan(0);
      expect(models[0].value).toBe('tts-1');

      const voices = getVoicesForModel('openai', 'tts-1');
      expect(voices.length).toBeGreaterThan(0);
    });

    it('returns elevenlabs models and per-model voices', () => {
      const models = getModelsForProvider('elevenlabs');
      expect(models.length).toBeGreaterThan(0);

      const voices = getVoicesForModel('elevenlabs', models[0].value);
      expect(voices.length).toBeGreaterThan(0);
    });

    it('returns openrouter models with distinct voice sets per model', () => {
      const models = getModelsForProvider('openrouter');
      expect(models.length).toBeGreaterThan(1);

      const fluxModelVoices = getVoicesForModel('openrouter', 'deepgram/flux-tts:free');
      const geminiModelVoices = getVoicesForModel('openrouter', 'google/gemini-3.1-flash-tts-preview');
      expect(fluxModelVoices).not.toEqual(geminiModelVoices);
    });

    it('falls back to the openai provider for an unknown provider', () => {
      const models = getModelsForProvider('unknown');
      expect(models[0].value).toBe('tts-1');
    });

    it('falls back to the provider\'s first model when the model is unknown', () => {
      const voices = getVoicesForModel('openai', 'nonexistent-model');
      expect(voices).toEqual(getVoicesForModel('openai', 'tts-1'));
    });
  });

  describe('populateModelVoiceSelectors', () => {
    it('populates select elements with options', () => {
      const modelEl = document.createElement('select');
      const voiceEl = document.createElement('select');

      populateModelVoiceSelectors('openai', modelEl, voiceEl, 'tts-1', 'nova');

      expect(modelEl.options.length).toBe(2); // tts-1, tts-1-hd
      expect(voiceEl.options.length).toBe(6); // 6 openai voices
      expect(modelEl.value).toBe('tts-1');
      expect(voiceEl.value).toBe('nova');
    });

    it('falls back to first option when saved value does not match', () => {
      const modelEl = document.createElement('select');
      const voiceEl = document.createElement('select');

      populateModelVoiceSelectors('openai', modelEl, voiceEl, 'nonexistent', 'nonexistent');

      expect(modelEl.selectedIndex).toBe(0);
      expect(voiceEl.selectedIndex).toBe(0);
    });

    it('populates voices for the selected model, not the whole provider', () => {
      const modelEl = document.createElement('select');
      const voiceEl = document.createElement('select');

      populateModelVoiceSelectors('openrouter', modelEl, voiceEl, 'google/gemini-3.1-flash-tts-preview', 'Puck');

      expect(modelEl.value).toBe('google/gemini-3.1-flash-tts-preview');
      expect(voiceEl.value).toBe('Puck');
      // "alloy" is an OpenAI-model voice, not a Gemini-model voice
      expect([...voiceEl.options].some(o => o.value === 'alloy')).toBe(false);
    });
  });

  describe('populateVoiceSelector', () => {
    it('repopulates just the voice select for a given provider + model', () => {
      const voiceEl = document.createElement('select');

      populateVoiceSelector('openrouter', 'hexgrad/kokoro-82m', voiceEl, 'am_adam');

      expect(voiceEl.value).toBe('am_adam');
      expect([...voiceEl.options].some(o => o.value === 'alloy')).toBe(false);
    });
  });

  describe('fetchElevenLabsVoices', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('requests show_legacy=true so accounts that still have access see premade voices', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ voices: [] }),
      });

      await fetchElevenLabsVoices('el-test');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://api.elevenlabs.io/v2/voices?show_legacy=true&page_size=100',
        expect.objectContaining({ headers: { 'xi-api-key': 'el-test' } }),
      );
    });

    it('follows next_page_token until has_more is false', async () => {
      vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            voices: [{ voice_id: 'a', name: 'Amber' }],
            has_more: true,
            next_page_token: 'token-2',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            voices: [{ voice_id: 'b', name: 'Zara' }],
            has_more: false,
          }),
        });

      const voices = await fetchElevenLabsVoices('el-test');

      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
      expect(globalThis.fetch).toHaveBeenNthCalledWith(
        2,
        'https://api.elevenlabs.io/v2/voices?show_legacy=true&page_size=100&next_page_token=token-2',
        expect.objectContaining({ headers: { 'xi-api-key': 'el-test' } }),
      );
      expect(voices).toEqual([
        { value: 'a', label: 'Amber' },
        { value: 'b', label: 'Zara' },
      ]);
    });

    it('returns an empty array for a free-tier account with no added voices', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ voices: [] }),
      });

      const voices = await fetchElevenLabsVoices('el-test');
      expect(voices).toEqual([]);
    });

    it('maps and sorts voices by name', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          voices: [
            { voice_id: 'b', name: 'Zara' },
            { voice_id: 'a', name: 'Amber' },
          ],
        }),
      });

      const voices = await fetchElevenLabsVoices('el-test');
      expect(voices).toEqual([
        { value: 'a', label: 'Amber' },
        { value: 'b', label: 'Zara' },
      ]);
    });
  });
});
