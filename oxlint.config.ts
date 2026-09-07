import common from 'eslint-config-neon/oxlint/common';
import node from 'eslint-config-neon/oxlint/node';
import prettier from 'eslint-config-neon/oxlint/prettier';
import typescript from 'eslint-config-neon/oxlint/typescript';
import { defineConfig } from 'oxlint';

export default defineConfig({
	extends: [common, node, typescript, prettier],
	ignorePatterns: ['**/dist/', 'oxlint.config.ts', '.git/', '**/node_modules/', '**/coverage/', '**/build/'],
	rules: {
		'import/extensions': 'off',
		'typescript/consistent-type-definitions': ['error', 'interface'],
		'typescript/no-redeclare': 'off',
	},
});
