/**
 * vite.extension.config.js
 *
 * Builds the browser extension into dist-extension/.
 *
 * What this does:
 *  - Bundles extension/content.js (+ all src/ imports) into a single IIFE
 *    so the content script has no external module dependencies at runtime.
 *  - Copies manifest.json, popup.html, popup.js, popup.css into the output
 *    directory so the whole dist-extension/ folder can be loaded directly
 *    into Chrome / Firefox as an unpacked extension.
 *
 * Usage:
 *   npm run build:extension
 */

import { defineConfig } from 'vite';
import { resolve }      from 'path';
import fs               from 'fs';

function copyExtensionAssets() {
  return {
    name: 'copy-extension-assets',
    closeBundle() {
      const out = 'dist-extension';
      fs.mkdirSync(out, { recursive: true });
      for (const file of ['manifest.json', 'popup.html', 'popup.js', 'popup.css']) {
        const src = `extension/${file}`;
        if (fs.existsSync(src)) fs.copyFileSync(src, `${out}/${file}`);
      }
    },
  };
}

export default defineConfig({
  build: {
    outDir:     'dist-extension',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'extension/content.js'),
      output: {
        format:                'iife',
        entryFileNames:        'content.js',
        name:                  'WebReaderContent',
        inlineDynamicImports:  true,
      },
    },
  },
  plugins: [copyExtensionAssets()],
});
