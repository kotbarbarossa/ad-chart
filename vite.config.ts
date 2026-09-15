import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const root = import.meta.dirname;

/**
 * Two build targets share this config:
 *  - `serve` / `--mode demo` -> the demo app (dev server, GitHub Pages build)
 *  - default `build`          -> the library (ESM + type declarations)
 */
export default defineConfig(({ command, mode }) => {
  const isDemo = command === 'serve' || mode === 'demo';

  if (isDemo) {
    return {
      root: resolve(root, 'demo'),
      // GitHub Pages serves from /<repo>/; override with BASE_PATH in CI.
      base: process.env.BASE_PATH ?? '/',
      build: {
        outDir: resolve(root, 'demo-dist'),
        emptyOutDir: true,
      },
    };
  }

  return {
    build: {
      lib: {
        entry: {
          index: resolve(root, 'src/index.ts'),
          react: resolve(root, 'src/react.tsx'),
        },
        formats: ['es'],
      },
      rollupOptions: {
        external: [
          'highcharts',
          /^highcharts\/.*/,
          'react',
          'react-dom',
          'react/jsx-runtime',
          'highcharts-react-official',
        ],
      },
      sourcemap: true,
    },
    plugins: [
      dts({
        include: ['src'],
      }),
    ],
  };
});
