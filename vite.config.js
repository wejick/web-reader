import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
  },
  test: {
    environment: 'jsdom',
  },
  server: {
    proxy: {
      // Dev proxy: /dev-proxy?url=<encoded-url> → fetches the target URL
      // bypassing CORS. Used automatically in dev mode; production uses the
      // configurable public CORS proxy set in Settings.
      '/dev-proxy': {
        target: 'http://placeholder', // overridden by router below
        changeOrigin: true,
        configure(proxy) {
          proxy.on('proxyReq', (proxyReq, req) => {
            // Extract the target URL from the query string
            const parsedUrl = new URL(req.url, 'http://localhost');
            const targetUrl = parsedUrl.searchParams.get('url');
            if (targetUrl) {
              const target = new URL(targetUrl);
              proxyReq.host = target.host;
              proxyReq.path = target.pathname + target.search;
            }
          });
        },
        router(req) {
          const parsedUrl = new URL(req.url, 'http://localhost');
          const targetUrl = parsedUrl.searchParams.get('url');
          if (targetUrl) {
            const target = new URL(targetUrl);
            return `${target.protocol}//${target.host}`;
          }
          return 'http://localhost';
        },
      },
    },
  },
});
