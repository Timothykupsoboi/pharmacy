import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    define: {
      'window.SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'window.SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY)
    },
    plugins: [
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true
        },
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', 'img/**/*', 'css/**/*', 'js/**/*'],
        manifest: {
          name: 'Edoc Pharmacy Enterprise',
          short_name: 'Edoc Pharmacy',
          description: 'Advanced Pharmacy Management System',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          display: 'standalone',
          icons: [
            {
              src: 'img/icon-192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'img/icon-512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'img/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          adminLogin: resolve(__dirname, 'admin-login.html'),
          sellerLogin: resolve(__dirname, 'seller-login.html'),
          admin: resolve(__dirname, 'admin.html'),
          seller: resolve(__dirname, 'seller.html')
        },
        output: {
          entryFileNames: 'assets/[name].js',
          chunkFileNames: 'assets/[name].js',
          assetFileNames: 'assets/[name].[ext]'
        }
      }
    }
  };
});
