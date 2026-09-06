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

  it('force-includes a sentence with no clause boundaries even if it exceeds maxLen', () => {
    // No sentence-ending punctuation and no clause boundaries — the whole
    // thing is one sentence that must be force-included.
    const longWord = 'a'.repeat(50);
    const text = `${longWord} ${longWord} ${longWord} ${longWord}`;
    const maxLen = 80;
    const result = chunkText(text, maxLen);
    // Single forced chunk containing all content
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(text.replace(/\s+/g, ' ').trim());
  });

  it('cuts a long sentence at a clause boundary when it exceeds maxLen', () => {
    // Three semicolon-separated clauses each under maxLen
    const text = 'First part; second part; third bit.';
    const maxLen = 20;
    const result = chunkText(text, maxLen);
    expect(result.length).toBeGreaterThan(1);
    for (const chunk of result) {
      expect(chunk.length).toBeLessThanOrEqual(maxLen);
    }
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

  it('uses default maxLen of 300', () => {
    const sentence = 'Word '.repeat(40) + '.'; // ~200 chars
    const text = sentence + ' ' + sentence + ' ' + sentence; // ~600 chars
    const result = chunkText(text);
    expect(result.length).toBeGreaterThanOrEqual(2);
    for (const chunk of result) {
      expect(chunk.length).toBeLessThanOrEqual(300);
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

  it('throws when OpenRouter key is missing', async () => {
    await expect(fetchAudio('hello', { provider: 'openrouter', openrouterKey: '' })).rejects.toThrow('OpenRouter API key is not set');
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

  it('calls OpenRouter API and returns blob URL', async () => {
    const mockBlob = new Blob(['audio'], { type: 'audio/mpeg' });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');

    const url = await fetchAudio('hello', {
      provider: 'openrouter',
      openrouterKey: 'sk-or-test',
      model: 'deepgram/flux-tts:free',
      voice: 'flux-alexis-en',
    });

    expect(url).toBe('blob:mock');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/audio/speech',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('requests pcm (not mp3) for OpenRouter Gemini models and wraps the result in a WAV blob', async () => {
    const pcmBytes = new Uint8Array([1, 2, 3, 4]);
    let capturedBlob;
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(pcmBytes.buffer),
      headers: { get: () => 'audio/pcm;rate=24000;channels=1' },
    });
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      capturedBlob = blob;
      return 'blob:mock';
    });

    const url = await fetchAudio('hello', {
      provider: 'openrouter',
      openrouterKey: 'sk-or-test',
      model: 'google/gemini-3.1-flash-tts-preview',
      voice: 'Zephyr',
    });

    expect(url).toBe('blob:mock');
    const [, options] = globalThis.fetch.mock.calls[0];
    expect(JSON.parse(options.body).response_format).toBe('pcm');
    expect(capturedBlob.type).toBe('audio/wav');
    expect(capturedBlob.size).toBe(44 + pcmBytes.byteLength); // WAV header + PCM data
  });

  it('throws on non-OK OpenRouter response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: { message: 'Invalid key' } }),
    });

    await expect(fetchAudio('hello', {
      provider: 'openrouter',
      openrouterKey: 'sk-or-bad',
    })).rejects.toThrow('Invalid key');
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

  it('throws a helpful message for an unadded ElevenLabs Voice Library voice', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({
        detail: { status: 'voice_not_found', message: "Voice with id 'abc123' not found." },
      }),
    });

    await expect(fetchAudio('hello', {
      provider: 'elevenlabs',
      elevenlabsKey: 'el-test',
      voice: 'abc123',
    })).rejects.toThrow('Voice Library voices must be added to your ElevenLabs account first');
  });

  it('throws on non-OK ElevenLabs response with a generic detail', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ detail: 'Internal error' }),
    });

    await expect(fetchAudio('hello', {
      provider: 'elevenlabs',
      elevenlabsKey: 'el-test',
    })).rejects.toThrow('Internal error');
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

  function mockAudioFetch() {
    const mockBlob = new Blob(['audio'], { type: 'audio/mpeg' });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
  }

  it('play(fromIndex) starts playback at the given chunk', async () => {
    mockAudioFetch();
    const chunks = ['one.', 'two.', 'three.'];
    const onChunkStart = vi.fn();
    const queue = new TTSQueue(audioEl, chunks, { provider: 'openai', openaiKey: 'sk-test' }, { onChunkStart });

    await queue.play(2);

    expect(onChunkStart).toHaveBeenCalledWith(2, 3);
    expect(queue.currentIndex).toBe(2);
    expect(audioEl.play).toHaveBeenCalled();
    // Chunk 0 must not be fetched — only the requested chunk (no chunks left to prefetch)
    const requestedTexts = globalThis.fetch.mock.calls.map(([, opts]) => JSON.parse(opts.body).input);
    expect(requestedTexts).toEqual(['three.']);
  });

  it('play(fromIndex) clamps out-of-range indices', async () => {
    mockAudioFetch();
    const onChunkStart = vi.fn();
    const queue = new TTSQueue(audioEl, ['a.', 'b.'], { provider: 'openai', openaiKey: 'sk-test' }, { onChunkStart });

    await queue.play(99);

    expect(onChunkStart).toHaveBeenCalledWith(1, 2);
  });

  it('play(fromIndex, { paused: true }) loads the chunk but waits for resume()', async () => {
    mockAudioFetch();
    const queue = new TTSQueue(audioEl, ['a.', 'b.', 'c.'], { provider: 'openai', openaiKey: 'sk-test' });

    await queue.play(1, { paused: true });

    expect(audioEl.src).toBe('blob:mock');
    expect(queue.isPaused).toBe(true);
    expect(queue.currentIndex).toBe(1);
    expect(audioEl.play).not.toHaveBeenCalled();

    queue.resume();

    expect(queue.isPaused).toBe(false);
    expect(audioEl.play).toHaveBeenCalled();
  });

  // ---- Prefetch error handling --------------------------------------------

  function makeDispatchAudio() {
    const listeners = new Map();
    return {
      src: '',
      play: vi.fn(async () => {}),
      pause: vi.fn(),
      addEventListener(type, fn) {
        if (!listeners.has(type)) listeners.set(type, new Set());
        listeners.get(type).add(fn);
      },
      removeEventListener(type, fn) {
        listeners.get(type)?.delete(fn);
      },
      dispatch(type) {
        for (const fn of [...(listeners.get(type) ?? [])]) fn();
      },
    };
  }

  const flush = () => new Promise(r => setTimeout(r, 0));

  it('retries a failed chunk on the next encounter instead of failing forever from the prefetch cache', async () => {
    const mockBlob = new Blob(['audio'], { type: 'audio/mpeg' });
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, opts) => {
      if (JSON.parse(opts.body).input === 'two.') {
        return { ok: false, status: 429, json: async () => ({ error: { message: 'rate limited' } }) };
      }
      return { ok: true, blob: async () => mockBlob };
    });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');

    const audio = makeDispatchAudio();
    const errors = [];
    const queue = new TTSQueue(audio, ['one.', 'two.', 'three.'], { provider: 'openai', openaiKey: 'sk-test' }, { onError: e => errors.push(e) });

    await queue.play(); // chunk 0 plays; prefetched chunk 1 fails
    audio.dispatch('ended'); // advance -> chunk 1 retried, fails, skip to 2
    await flush();
    await flush();

    expect(errors.filter(e => e.includes('Chunk 2 failed')).length).toBe(1);
    expect(queue.currentIndex).toBe(2);

    // Seeking back must hit the network again, not the cached rejection
    queue.seekTo(1);
    await flush();
    await flush();

    const fetchCount = globalThis.fetch.mock.calls.filter(
      c => JSON.parse(c[1].body).input === 'two.',
    ).length;
    expect(fetchCount).toBe(3); // initial prefetch + advance retry + seek-back retry
    expect(errors.filter(e => e.includes('Chunk 2 failed')).length).toBe(2);
  });

  it('stop() with an in-flight prefetch does not leave an unhandled rejection', async () => {
    const rejectors = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () => new Promise((resolve, reject) => { rejectors.push(reject); }),
    );
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');

    const unhandled = [];
    const onUnhandled = reason => unhandled.push(reason);
    process.on('unhandledRejection', onUnhandled);

    const audio = makeDispatchAudio();
    const queue = new TTSQueue(audio, ['one.', 'two.'], { provider: 'openai', openaiKey: 'sk-test' });
    const played = queue.play(); // both fetches in flight; chunk 1 is prefetch-only
    await flush();

    queue.stop(); // aborts both; simulate the signal rejecting them
    for (const reject of rejectors) reject(new DOMException('Aborted', 'AbortError'));
    await flush();
    await flush();
    await played;

    process.off('unhandledRejection', onUnhandled);
    expect(unhandled).toEqual([]);
  });
});
