import common from 'eslint-config-neon/common';
import node from 'eslint-config-neon/node';
import prettier from 'eslint-config-neon/prettier';
import typescript from 'eslint-config-neon/typescript';

const tsFiles = ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'];

/**
 * @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.ConfigArray}
 */
const config = [
	{
		ignores: ['**/dist/*', 'eslint.config.js'],
	},
	...common,
	...node,
	...typescript.map(tsConfig => (tsConfig.files ? tsConfig : { ...tsConfig, files: tsFiles })),
	...prettier,
	{
		files: tsFiles,
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
