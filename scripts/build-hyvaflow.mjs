import { build, context } from 'esbuild';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const moduleRoot = fileURLToPath(new URL('../', import.meta.url));
const distDir = resolve(moduleRoot, 'view/frontend/web/dist');
const watchMode = process.argv.includes('--watch');

const buildTargets = [
  {
    entry: resolve(moduleRoot, 'view/frontend/web/src/core-entry.ts'),
    outfile: resolve(distDir, 'hyvaflow-core.js'),
    minify: false,
    sourcemap: true,
  },
  {
    entry: resolve(moduleRoot, 'view/frontend/web/src/core-entry.ts'),
    outfile: resolve(distDir, 'hyvaflow-core.min.js'),
    minify: true,
    sourcemap: false,
  },
  {
    entry: resolve(moduleRoot, 'view/frontend/web/src/index.ts'),
    outfile: resolve(distDir, 'hyvaflow-dom.js'),
    minify: false,
    sourcemap: true,
  },
  {
    entry: resolve(moduleRoot, 'view/frontend/web/src/index.ts'),
    outfile: resolve(distDir, 'hyvaflow-dom.min.js'),
    minify: true,
    sourcemap: false,
  },
];

const baseConfig = {
  bundle: true,
  format: 'iife',
  target: ['es2017'],
  legalComments: 'none',
};

async function run() {
  if (watchMode) {
    const contexts = await Promise.all(
      buildTargets.map((target) =>
        context({
          ...baseConfig,
          entryPoints: [target.entry],
          outfile: target.outfile,
          minify: target.minify,
          sourcemap: target.sourcemap,
        }),
      ),
    );
    await Promise.all(contexts.map((ctx) => ctx.watch()));
    console.log('[hyvaflow] watching for changes...');
    return contexts;
  }

  await Promise.all(
    buildTargets.map((target) =>
      build({
        ...baseConfig,
        entryPoints: [target.entry],
        outfile: target.outfile,
        minify: target.minify,
        sourcemap: target.sourcemap,
      }),
    ),
  );
  buildTargets.forEach((target) => {
    console.log(`[hyvaflow] bundle written to ${target.outfile}`);
  });
}

run().catch((error) => {
  console.error('[hyvaflow] build failed');
  console.error(error);
  process.exit(1);
});
