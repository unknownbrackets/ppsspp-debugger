module.exports = {
	extends: 'react-app',
	env: {
		browser: true,
		commonjs: true,
		node: true,
		es6: true,
	},
	parserOptions: {
		ecmaVersion: 6,
		sourceType: 'module',
	},
	rules: {
		'curly': 'warn',
		'comma-dangle': ['error', 'only-multiline'],
		'indent': ['error', 'tab'],
		'no-extra-semi': 'error',
		'semi': ['error', 'always'],
		'no-unexpected-multiline': 'warn',
		'no-extra-boolean-cast': 'warn',
		'no-unsafe-finally': 'warn',
		'no-irregular-whitespace': 'error',
		'block-scoped-var': 'error',
		'consistent-return': 'warn',
		'yoda': 'error',
	},
};
