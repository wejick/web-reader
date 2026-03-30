import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchPage } from '../src/loader.js';

describe('fetchPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects invalid URLs', async () => {
    await expect(fetchPage('not-a-url', '')).rejects.toThrow('Invalid URL');
  });

  it('rejects non-http protocols', async () => {
    await expect(fetchPage('ftp://example.com', '')).rejects.toThrow('Only http:// and https://');
  });

  it('uses CORS proxy when provided', async () => {
    const html = '<html><head><title>Test</title></head><body>Hello</body></html>';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(html),
    });

    const result = await fetchPage('https://example.com/article', 'https://proxy.io/?url=');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://proxy.io/?url='),
      expect.any(Object),
    );
    expect(result.url).toBe('https://example.com/article');
    expect(result.title).toBe('Test');
    expect(result.html).toContain('<base');
  });

  it('uses dev proxy when corsProxy is empty', async () => {
    const html = '<html><head><title>Dev</title></head><body></body></html>';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(html),
    });

    await fetchPage('https://example.com', '');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/dev-proxy?url='),
      expect.any(Object),
    );
  });

  it('throws on non-OK response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(fetchPage('https://example.com', 'https://proxy.io/?url=')).rejects.toThrow('HTTP 404');
  });

  it('throws on network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(fetchPage('https://example.com', 'https://proxy.io/?url=')).rejects.toThrow('Network error');
  });

  it('rewrites relative URLs to absolute', async () => {
    const html = '<html><head></head><body><img src="/img/photo.jpg"><a href="/page">link</a></body></html>';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(html),
    });

    const result = await fetchPage('https://example.com/article', 'https://proxy.io/?url=');
    expect(result.html).toContain('https://example.com/img/photo.jpg');
    expect(result.html).toContain('https://example.com/page');
  });

  it('extracts page title', async () => {
    const html = '<html><head><title>My Article Title</title></head><body></body></html>';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(html),
    });

    const result = await fetchPage('https://example.com', 'https://proxy.io/?url=');
    expect(result.title).toBe('My Article Title');
  });
});
