import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';

const frontendDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(frontendDir, '..');

/** Each app invokes Vite from its own cwd; shared code pulls `socket.io-client` via this alias. */
const socketIoClient = path.join(process.cwd(), 'node_modules', 'socket.io-client');

/**
 * `shared-ui/` and `shared/` live outside each app, so bare imports inside them
 * (e.g. `clsx`, `lucide-react`) would normally be resolved from *their* folder.
 * On Vercel only the app being built has `node_modules`, so `dedupe` forces these
 * packages to always resolve from the app's own install.
 */
const SHARED_DEPS = [
  'react',
  'react-dom',
  'clsx',
  'tailwind-merge',
  'lucide-react',
  '@tanstack/react-router',
  '@tanstack/react-query',
];

export function createDrrmoViteConfig(port: number): UserConfig {
  return defineConfig({
    plugins: [react()],
    resolve: {
      alias: {
        '@shared': path.join(repoRoot, 'shared'),
        '@drrmo/ui': path.join(frontendDir, 'shared-ui'),
        '@drrmo/ui/themes': path.join(frontendDir, 'shared-ui/themes.ts'),
        'socket.io-client': socketIoClient,
      },
      dedupe: SHARED_DEPS,
    },
    optimizeDeps: {
      include: ['clsx', 'tailwind-merge', 'lucide-react'],
    },
    build: {
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks: {
            tanstack: ['@tanstack/react-router', '@tanstack/react-query'],
          },
        },
      },
    },
    server: {
      port,
      strictPort: true,
      fs: {
        allow: [repoRoot],
      },
    },
    preview: {
      port,
    },
  });
}
