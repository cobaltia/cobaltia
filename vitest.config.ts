import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: [
			{ find: '#lib', replacement: `${resolve('src/lib')}` },
			{ find: '#root', replacement: `${resolve('src')}` },
		],
	},
	esbuild: { format: 'esm' },
	test: {
		globals: true,
		coverage: {
			reporter: ['text', 'lcov', 'cobertura'],
			include: ['src/lib/**/*.ts'],
			exclude: [],
		},
	},
});
