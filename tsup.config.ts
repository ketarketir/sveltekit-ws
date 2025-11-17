import { defineConfig } from 'tsup';

export default defineConfig({
    entry: {
        index: 'src/index.ts',
        vite: 'src/vite.ts',
        server: 'src/server.ts'
    },
    format: ['esm'],
    dts: true,
    clean: true,
    sourcemap: true,
    external: ['@sveltejs/kit', 'vite', 'ws']
});