import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/worker.ts'],
  format: ['esm'],
  target: 'node20',
  platform: 'node',
  sourcemap: true,
  clean: true,
  // Workspace packages ship TypeScript source, so bundle them into the output.
  noExternal: [/^@taskflow\//],
});
