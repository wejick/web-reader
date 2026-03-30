import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadSettings, saveSettings, getProviderOptions, populateModelVoiceSelectors } from '../src/settings.js';

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
      expect(s.corsProxy).toBe('https://corsproxy.io/?url=');
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

  describe('getProviderOptions', () => {
    it('returns openai options', () => {
      const opts = getProviderOptions('openai');
      expect(opts.models.length).toBeGreaterThan(0);
      expect(opts.voices.length).toBeGreaterThan(0);
      expect(opts.models[0].value).toBe('tts-1');
    });

    it('returns elevenlabs options', () => {
      const opts = getProviderOptions('elevenlabs');
      expect(opts.models.length).toBeGreaterThan(0);
      expect(opts.voices.length).toBeGreaterThan(0);
    });

    it('falls back to openai for unknown provider', () => {
      const opts = getProviderOptions('unknown');
      expect(opts.models[0].value).toBe('tts-1');
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
  });
});
