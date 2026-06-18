import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    define: {
      'window.SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'window.SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY)
    },
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
