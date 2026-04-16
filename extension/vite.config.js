/**
 * extension/vite.config.js
 *
 * Builds the browser extension into extension/dist/.
 * Run from the repo root: npm run build:extension
 *
 * content.js is bundled as a single self-contained IIFE so it can be
 * declared as a plain content script in manifest.json without requiring
 * ES module support from the browser.
 *
 * The shared modules (reader.js, tts.js) are imported from ../src/ and
 * bundled in — the web app build is completely unaffected.
 */

import { defineConfig } from 'vite';
import { resolve }      from 'path';
import fs               from 'fs';

function copyExtensionAssets() {
  return {
    name: 'copy-extension-assets',
    closeBundle() {
      const outDir = resolve(__dirname, 'dist');
      fs.mkdirSync(outDir, { recursive: true });
      for (const file of ['manifest.json', 'popup.html', 'popup.js', 'popup.css']) {
        const src = resolve(__dirname, file);
        if (fs.existsSync(src)) fs.copyFileSync(src, resolve(outDir, file));
      }
    },
  };
}

export default defineConfig({
  root: __dirname,
  build: {
    outDir:      resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'content.js'),
      output: {
        format:               'iife',
        entryFileNames:       'content.js',
        name:                 'WebReaderContent',
        inlineDynamicImports: true,
      },
    },
  },
  plugins: [copyExtensionAssets()],
});
