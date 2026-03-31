import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
  },
  test: {
    environment: 'jsdom',
  },
  plugins: [
    {
      name: 'dev-cors-proxy',
      configureServer(server) {
        // Dev proxy: /dev-proxy?url=<encoded-url> → fetches the target URL
        // bypassing CORS. Used automatically in dev mode; production uses the
        // configurable public CORS proxy set in Settings.
        server.middlewares.use('/dev-proxy', async (req, res) => {
          const parsedUrl = new URL(req.url, 'http://localhost');
          const targetUrl = parsedUrl.searchParams.get('url');
          if (!targetUrl) {
            res.statusCode = 400;
            res.end('Missing url parameter');
            return;
          }
          try {
            const response = await fetch(targetUrl);
            res.statusCode = response.status;
            const contentType = response.headers.get('content-type');
            if (contentType) res.setHeader('content-type', contentType);
            const body = await response.arrayBuffer();
            res.end(Buffer.from(body));
          } catch (err) {
            res.statusCode = 502;
            res.end(`Proxy error: ${err.message}`);
          }
        });
      },
    },
  ],
});
