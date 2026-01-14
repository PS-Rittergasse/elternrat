import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  const base = process.env.VITE_BASE ?? '/';

  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
        manifest: {
          name: 'Elternrat Tool',
          short_name: 'Elternrat',
          description: 'Elternrat Tool – Primarstufe Rittergasse (Basel)',
          lang: 'de-CH',
          start_url: '.',
          display: 'standalone',
          background_color: '#111827',
          theme_color: '#111827',
          icons: [
            {
              src: 'icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    server: {
      port: 5173
    }
  };
});
