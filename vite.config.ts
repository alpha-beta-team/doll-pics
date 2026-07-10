import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/** Inline the CSS bundle into HTML to eliminate render-blocking stylesheet requests. */
function inlineCss(): Plugin {
  return {
    name: 'inline-css',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle) return html;

        const cssAssets = Object.values(ctx.bundle).filter(
          (item) => item.type === 'asset' && item.fileName.endsWith('.css'),
        );

        let next = html.replace(
          /<link rel="stylesheet"[^>]*href="([^"]+\.css)"[^>]*>/g,
          (_match, href: string) => {
            const fileName = href.replace(/^\//, '');
            const asset = cssAssets.find(
              (item) => item.type === 'asset' && item.fileName === fileName,
            );
            if (!asset || asset.type !== 'asset') return _match;
            const source =
              typeof asset.source === 'string'
                ? asset.source
                : Buffer.from(asset.source).toString('utf-8');
            return `<style>${source}</style>`;
          },
        );

        // Drop orphaned CSS files from the build output once inlined
        for (const asset of cssAssets) {
          if (asset.type === 'asset') {
            delete ctx.bundle[asset.fileName];
          }
        }

        return next;
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), inlineCss()],
  build: {
    cssCodeSplit: false,
  },
});
