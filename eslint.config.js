import common from 'eslint-config-neon/common';
import node from 'eslint-config-neon/node';
import prettier from 'eslint-config-neon/prettier';
import typescript from 'eslint-config-neon/typescript';

/**
 * @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.ConfigArray}
 */
const config = [
	{
		ignores: ['**/dist/*', 'eslint.config.js'],
	},
	...common,
	...node,
	...typescript,
	...prettier,
	{
		files: ['**/*.ts', '**/*.tsx'],
		languageOptions: {
			parserOptions: {
				project: ['./tsconfig.eslint.json'],
			},
		},
		rules: {
			// doesn't work with aliases imports
			'import/extensions': 'off',
			'@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
		},
	},
];

export default config;
