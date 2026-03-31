/**
 * tts.js — TTS chunker, audio fetcher, and playback queue.
 *
 * Design goals:
 *  - Split article text into sentence-boundary chunks (~1000 chars max)
 *  - Pre-fetch the next N chunks while the current one is playing to
 *    eliminate audible gaps between chunks (prefetch depth = 2)
 *  - Support OpenAI TTS and ElevenLabs as providers
 *  - Revoke object URLs immediately after use to avoid memory leaks
 *  - Expose a simple play/pause/resume/stop API
 */

// ---------------------------------------------------------------------------
// Text chunker
// ---------------------------------------------------------------------------

// Matches sentence-internal clause boundaries used as cut points.
const CLAUSE_BOUNDARY_RE = /[.?!;]|,\s+(?:and|but|or|nor|for|yet|so)\b/g;

/**
 * Return the end position of the last clause boundary within `text[0..maxPos]`,
 * or -1 if none exists in that range.
 */
function findLastClauseBoundary(text, maxPos) {
  const re = new RegExp(CLAUSE_BOUNDARY_RE.source, 'g');
  let lastEnd = -1;
  let match;
  while ((match = re.exec(text)) !== null) {
    const end = match.index + match[0].length;
    if (end <= maxPos) lastEnd = end;
    else break;
  }
  return lastEnd;
}

/**
 * Split plain text into sentence-aware chunks of at most `maxLen` characters.
 *
 * Algorithm (base unit = sentence):
 *  1. Split on sentence-ending punctuation (.!?) followed by whitespace.
 *  2. Greedily accumulate whole sentences into a chunk.
 *  3. When the next sentence doesn't fit:
 *     - If the chunk has content, try to append a clause portion of the
 *       sentence (cut at the last CLAUSE_BOUNDARY that fits), flush the
 *       chunk, and re-queue the remainder.  If no clause portion fits,
 *       flush the chunk and retry the full sentence with an empty chunk.
 *     - If the chunk is empty (sentence must stand alone), cut at the last
 *       CLAUSE_BOUNDARY within maxLen and re-queue the remainder.  If no
 *       boundary exists, force-include the full sentence.
 *
 * @param {string} text
 * @param {number} [maxLen=900]
 * @returns {string[]}
 */
export function chunkText(text, maxLen = 300) {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];

  // Split into sentences (lookbehind for sentence-ending punctuation)
  let rawSentences;
  try {
    rawSentences = cleaned.split(/(?<=[.!?])\s+/);
  } catch {
    // Fallback for browsers without lookbehind support
    rawSentences = cleaned.split(/[.!?]\s+/);
  }

  const queue = rawSentences.map(s => s.trim()).filter(Boolean);
  const chunks = [];
  let current = '';

  while (queue.length > 0) {
    const sentence = queue.shift();
    const combined = current ? `${current} ${sentence}` : sentence;

    if (combined.length <= maxLen) {
      current = combined;
      continue;
    }

    if (!current) {
      // Nothing accumulated yet — must include something from this sentence.
      if (sentence.length <= maxLen) {
        current = sentence;
        continue;
      }
      // Sentence alone exceeds maxLen — cut at a clause boundary.
      const cut = findLastClauseBoundary(sentence, maxLen);
      if (cut !== -1) {
        chunks.push(sentence.slice(0, cut).trimEnd());
        const rest = sentence.slice(cut).trimStart();
        if (rest) queue.unshift(rest);
      } else {
        // No clause boundary at all — force-include the full sentence.
        chunks.push(sentence);
      }
    } else {
      // Try to fit a clause portion of this sentence onto the current chunk.
      const available = maxLen - current.length - 1;
      const cut = available > 0 ? findLastClauseBoundary(sentence, available) : -1;

      if (cut !== -1) {
        current = `${current} ${sentence.slice(0, cut).trimEnd()}`;
        chunks.push(current);
        current = '';
        const rest = sentence.slice(cut).trimStart();
        if (rest) queue.unshift(rest);
      } else {
        // No clause portion fits — flush and retry this sentence.
        chunks.push(current);
        current = '';
        queue.unshift(sentence);
      }
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

// ---------------------------------------------------------------------------
// Audio fetcher
// ---------------------------------------------------------------------------

/**
 * Fetch a single audio chunk from the configured TTS provider.
 * Returns a blob: URL that should be revoked by the caller when done.
 *
 * @param {string} text
 * @param {object} settings  - { provider, model, voice, openaiKey, elevenlabsKey }
 * @param {AbortSignal} [signal]
 * @returns {Promise<string>}  blob: URL
 */
export async function fetchAudio(text, settings, signal) {
  if (settings.provider === 'openai') {
    return fetchOpenAI(text, settings, signal);
  } else if (settings.provider === 'elevenlabs') {
    return fetchElevenLabs(text, settings, signal);
  }
  throw new Error(`Unknown TTS provider: ${settings.provider}`);
}

async function fetchOpenAI(text, settings, signal) {
  const key = settings.openaiKey?.trim();
  if (!key) throw new Error('OpenAI API key is not set. Open Settings to add it.');

  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    signal,
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: settings.model || 'tts-1',
      voice: settings.voice || 'alloy',
      input: text,
      response_format: 'mp3',
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `OpenAI TTS error: HTTP ${res.status}`);
  }

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

async function fetchElevenLabs(text, settings, signal) {
  const key = settings.elevenlabsKey?.trim();
  if (!key) throw new Error('ElevenLabs API key is not set. Open Settings to add it.');

  const voiceId = settings.voice || '21m00Tcm4TlvDq8ikWAM'; // Rachel
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
    {
      method: 'POST',
      signal,
      headers: {
        'xi-api-key': key,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: settings.model || 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message ?? err?.detail ?? `ElevenLabs TTS error: HTTP ${res.status}`);
  }

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

// ---------------------------------------------------------------------------
// TTS Queue
// ---------------------------------------------------------------------------

/**
 * Manages sequential TTS playback with prefetch-ahead.
 *
 * Usage:
 *   const q = new TTSQueue(audioEl, chunks, settings, { onChunkStart, onProgress, onEnd });
 *   await q.play();
 *   q.pause();
 *   q.resume();
 *   q.stop();
 */
export class TTSQueue {
  /**
   * @param {HTMLAudioElement} audioEl
   * @param {string[]} chunks
   * @param {object} settings
   * @param {{
   *   onChunkStart?: (index: number, total: number) => void,
   *   onProgress?:   (index: number, total: number) => void,
   *   onEnd?:        () => void,
   *   onError?:      (msg: string) => void,
   * }} callbacks
   */
  constructor(audioEl, chunks, settings, callbacks = {}) {
    this._audio    = audioEl;
    this._chunks   = chunks;
    this._settings = settings;
    this._cbs      = callbacks;

    this._index    = 0;
    this._paused   = false;
    this._stopped  = false;
    this._gen      = 0;   // incremented on seek to invalidate in-flight chains

    // Map<chunkIndex, Promise<string>>  (string = blob: URL)
    this._fetches  = new Map();
    // Map<chunkIndex, string>           resolved blob: URLs
    this._urls     = new Map();

    // AbortController for all in-flight fetches
    this._abortCtrl = new AbortController();

    // Prefetch depth: number of chunks ahead of the current one to fetch
    this._prefetchDepth = 2;
  }

  // ---- Public API ----------------------------------------------------------

  /** Start playback from the beginning. */
  async play() {
    if (this._chunks.length === 0) {
      this._cbs.onError?.('No text chunks to play.');
      return;
    }

    this._stopped = false;
    this._paused  = false;
    this._index   = 0;

    // Kick off prefetch for the first few chunks
    for (let i = 0; i <= this._prefetchDepth && i < this._chunks.length; i++) {
      this._prefetch(i);
    }

    await this._playChunk(0);
  }

  /** Pause playback (can be resumed). */
  pause() {
    this._paused = true;
    this._audio.pause();
  }

  /** Resume a paused playback. */
  resume() {
    if (!this._paused) return;
    this._paused = false;
    this._audio.play().catch(() => {});
  }

  /** Stop playback and reset state. */
  stop() {
    this._stopped = true;
    this._paused  = false;

    this._audio.pause();
    this._audio.src = '';

    // Abort all in-flight fetches
    this._abortCtrl.abort();

    // Revoke all cached blob URLs
    for (const url of this._urls.values()) {
      URL.revokeObjectURL(url);
    }
    this._urls.clear();
    this._fetches.clear();

    this._cbs.onProgress?.(0, this._chunks.length);
  }

  get isPaused()  { return this._paused; }
  get isStopped() { return this._stopped; }
  get currentIndex() { return this._index; }
  get totalChunks()  { return this._chunks.length; }

  /**
   * Jump to a specific chunk index and continue playing (or stay paused).
   * Safe to call while playing, paused, or between chunks.
   */
  seekTo(index) {
    if (index < 0 || index >= this._chunks.length) return;

    const wasPaused = this._paused;

    // Invalidate any in-flight _playChunk → _advance chain
    this._gen++;
    this._paused  = false;
    this._stopped = false;

    // Stop current audio without triggering the stale onEnded/onError chain
    this._audio.pause();
    this._audio.src = '';

    // Kick off prefetch from the new position
    for (let i = index; i <= index + this._prefetchDepth && i < this._chunks.length; i++) {
      this._prefetch(i);
    }

    if (wasPaused) this._paused = true;
    this._playChunk(index);
  }

  // ---- Internal ------------------------------------------------------------

  /** Start a background fetch for chunk at `index` if not already fetching. */
  _prefetch(index) {
    if (index >= this._chunks.length) return;
    if (this._fetches.has(index)) return;

    const promise = fetchAudio(
      this._chunks[index],
      this._settings,
      this._abortCtrl.signal,
    ).then(url => {
      this._urls.set(index, url);
      return url;
    });

    this._fetches.set(index, promise);
  }

  /** Play the chunk at `index`, waiting for its fetch to complete first. */
  async _playChunk(index) {
    const gen = this._gen;
    if (this._stopped) return;
    if (index >= this._chunks.length) {
      // All chunks done
      this._cbs.onProgress?.(this._chunks.length, this._chunks.length);
      this._cbs.onEnd?.();
      return;
    }

    // Update progress immediately so the bar moves without waiting for the fetch.
    // _index and onChunkStart (highlight) are deferred until the audio is ready,
    // so that currentIndex stays on the previous chunk during the fetch window.
    // This prevents seekChunk(+1) from reading a stale +1 index and skipping ahead.
    this._cbs.onProgress?.(index, this._chunks.length);

    // Ensure chunk is being prefetched
    this._prefetch(index);

    let url;
    try {
      url = await this._fetches.get(index);
    } catch (err) {
      if (this._stopped || this._gen !== gen) return;
      if (err.name === 'AbortError') return;
      this._cbs.onError?.(`Chunk ${index + 1} failed: ${err.message}`);
      // Skip to next chunk
      await this._advance(index);
      return;
    }

    // Bail if stopped or a seek happened while we were fetching
    if (this._stopped || this._gen !== gen) return;

    // Audio is ready — now commit to this chunk
    this._index = index;
    this._cbs.onChunkStart?.(index, this._chunks.length);

    // Set up audio element for this chunk
    this._audio.src = url;

    // Wire the ended handler exactly once per chunk
    const onEnded = async () => {
      this._audio.removeEventListener('ended', onEnded);
      this._audio.removeEventListener('error', onError);
      URL.revokeObjectURL(url);
      this._urls.delete(index);
      this._fetches.delete(index); // allow re-fetch if user seeks back
      if (this._gen !== gen) return; // seekTo() was called — abandon this chain
      await this._advance(index);
    };

    const onError = async () => {
      this._audio.removeEventListener('ended', onEnded);
      this._audio.removeEventListener('error', onError);
      URL.revokeObjectURL(url);
      this._urls.delete(index);
      this._fetches.delete(index); // allow re-fetch if user seeks back
      if (this._gen !== gen) return; // seekTo() was called — abandon this chain
      this._cbs.onError?.(`Audio playback error on chunk ${index + 1}, skipping.`);
      await this._advance(index);
    };

    this._audio.addEventListener('ended', onEnded);
    this._audio.addEventListener('error', onError);

    if (this._paused) {
      // Seeked while paused — audio is loaded and handlers are set; resume() will call play()
      return;
    }

    try {
      await this._audio.play();
    } catch (err) {
      if (err.name === 'AbortError' || err.name === 'NotAllowedError') {
        // Autoplay blocked or aborted — do nothing, user will resume
        this._audio.removeEventListener('ended', onEnded);
        this._audio.removeEventListener('error', onError);
        return;
      }
      // Other playback error — skip
      this._audio.removeEventListener('ended', onEnded);
      this._audio.removeEventListener('error', onError);
      await this._advance(index);
    }
  }

  /** Advance to the next chunk, prefetching ahead. */
  async _advance(index) {
    if (this._stopped || this._paused) return;

    const next = index + 1;
    // Prefetch chunk at prefetchDepth ahead of next
    this._prefetch(next + this._prefetchDepth);
    await this._playChunk(next);
  }
}
