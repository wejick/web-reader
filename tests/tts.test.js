import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chunkText, fetchAudio, TTSQueue } from '../src/tts.js';

// ---------------------------------------------------------------------------
// chunkText
// ---------------------------------------------------------------------------

describe('chunkText', () => {
  it('returns empty array for empty/whitespace input', () => {
    expect(chunkText('')).toEqual([]);
    expect(chunkText('   ')).toEqual([]);
    expect(chunkText('\n\t')).toEqual([]);
  });

  it('returns a single chunk for short text', () => {
    const result = chunkText('Hello world.');
    expect(result).toEqual(['Hello world.']);
  });

  it('splits text on sentence boundaries', () => {
    const text = 'First sentence. Second sentence. Third sentence.';
    const result = chunkText(text, 30);
    // Each sentence is ~16 chars, so two fit in 30 chars
    expect(result.length).toBeGreaterThan(1);
    // All text is preserved (joined)
    expect(result.join(' ')).toBe(text);
  });

  it('keeps chunks under maxLen', () => {
    const sentences = Array.from({ length: 20 }, (_, i) => `Sentence number ${i + 1} is here.`);
    const text = sentences.join(' ');
    const maxLen = 100;
    const result = chunkText(text, maxLen);
    for (const chunk of result) {
      expect(chunk.length).toBeLessThanOrEqual(maxLen);
    }
  });

  it('hard-splits a very long sentence that exceeds maxLen', () => {
    const longWord = 'a'.repeat(50);
    const text = `${longWord} ${longWord} ${longWord} ${longWord}`;
    const maxLen = 80;
    const result = chunkText(text, maxLen);
    for (const chunk of result) {
      expect(chunk.length).toBeLessThanOrEqual(maxLen);
    }
    // All content preserved
    expect(result.join(' ')).toBe(text.replace(/\s+/g, ' ').trim());
  });

  it('normalises whitespace', () => {
    const text = '  Hello   world.   Goodbye   world.  ';
    const result = chunkText(text);
    expect(result).toEqual(['Hello world. Goodbye world.']);
  });

  it('handles text with exclamation and question marks', () => {
    const text = 'Really? Yes! Absolutely. Done.';
    const result = chunkText(text, 15);
    expect(result.length).toBeGreaterThan(1);
  });

  it('uses default maxLen of 900', () => {
    const sentence = 'Word '.repeat(100) + '.'; // ~500 chars
    const text = sentence + ' ' + sentence; // ~1000 chars
    const result = chunkText(text);
    expect(result.length).toBeGreaterThanOrEqual(2);
    for (const chunk of result) {
      expect(chunk.length).toBeLessThanOrEqual(900);
    }
  });
});

// ---------------------------------------------------------------------------
// fetchAudio
// ---------------------------------------------------------------------------

describe('fetchAudio', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('throws for unknown provider', async () => {
    await expect(fetchAudio('hello', { provider: 'unknown' })).rejects.toThrow('Unknown TTS provider');
  });

  it('throws when OpenAI key is missing', async () => {
    await expect(fetchAudio('hello', { provider: 'openai', openaiKey: '' })).rejects.toThrow('OpenAI API key is not set');
  });

  it('throws when ElevenLabs key is missing', async () => {
    await expect(fetchAudio('hello', { provider: 'elevenlabs', elevenlabsKey: '' })).rejects.toThrow('ElevenLabs API key is not set');
  });

  it('calls OpenAI API and returns blob URL', async () => {
    const mockBlob = new Blob(['audio'], { type: 'audio/mpeg' });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');

    const url = await fetchAudio('hello', {
      provider: 'openai',
      openaiKey: 'sk-test',
      model: 'tts-1',
      voice: 'alloy',
    });

    expect(url).toBe('blob:mock');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/audio/speech',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('calls ElevenLabs API and returns blob URL', async () => {
    const mockBlob = new Blob(['audio'], { type: 'audio/mpeg' });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');

    const url = await fetchAudio('hello', {
      provider: 'elevenlabs',
      elevenlabsKey: 'el-test',
      model: 'eleven_monolingual_v1',
      voice: 'voice-id',
    });

    expect(url).toBe('blob:mock');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('elevenlabs.io'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('throws on non-OK OpenAI response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: { message: 'Invalid key' } }),
    });

    await expect(fetchAudio('hello', {
      provider: 'openai',
      openaiKey: 'sk-bad',
    })).rejects.toThrow('Invalid key');
  });
});

// ---------------------------------------------------------------------------
// TTSQueue
// ---------------------------------------------------------------------------

describe('TTSQueue', () => {
  let audioEl;

  beforeEach(() => {
    vi.restoreAllMocks();
    audioEl = {
      src: '',
      pause: vi.fn(),
      play: vi.fn().mockResolvedValue(undefined),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
  });

  it('calls onError when chunks are empty', async () => {
    const onError = vi.fn();
    const queue = new TTSQueue(audioEl, [], {}, { onError });
    await queue.play();
    expect(onError).toHaveBeenCalledWith('No text chunks to play.');
  });

  it('stop aborts fetches and cleans up', () => {
    const queue = new TTSQueue(audioEl, ['chunk1'], {
      provider: 'openai',
      openaiKey: 'sk-test',
    });
    // Spy on abort
    const abortSpy = vi.spyOn(queue._abortCtrl, 'abort');
    queue.stop();
    expect(abortSpy).toHaveBeenCalled();
    expect(audioEl.pause).toHaveBeenCalled();
    expect(audioEl.src).toBe('');
    expect(queue.isStopped).toBe(true);
  });

  it('pause and resume toggle state', () => {
    const queue = new TTSQueue(audioEl, ['chunk1'], {});
    queue.pause();
    expect(queue.isPaused).toBe(true);
    expect(audioEl.pause).toHaveBeenCalled();
    queue.resume();
    expect(queue.isPaused).toBe(false);
  });

  it('exposes currentIndex and totalChunks', () => {
    const queue = new TTSQueue(audioEl, ['a', 'b', 'c'], {});
    expect(queue.totalChunks).toBe(3);
    expect(queue.currentIndex).toBe(0);
  });
});
