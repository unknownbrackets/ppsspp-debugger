module.exports = {
	extends: ['react-app', 'plugin:jsdoc/recommended'],
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
	plugins: [
		'jsdoc',
	],
	rules: {
		'block-scoped-var': 'error',
		'consistent-return': 'warn',
		'comma-dangle': ['error', 'always-multiline'],
		'curly': 'warn',
		'indent': ['error', 'tab'],
		'jsdoc/require-jsdoc': 0,
		'jsx-quotes': ['error', 'prefer-double'],
		'keyword-spacing': 'error',
		'no-extra-semi': 'error',
		'no-sequences': 'error',
		'quotes': ['error', 'single'],
		'react/button-has-type': 'error',
		'react/function-component-definition': 'error',
		'react/jsx-curly-newline': 'error',
		'react/jsx-indent': ['error', 'tab'],
		'react/jsx-no-duplicate-props': 'error',
		'react/jsx-no-useless-fragment': 'error',
		'react/jsx-props-no-multi-spaces': 'error',
		'react/jsx-tag-spacing': ['error', { beforeClosing: 'never' }],
		'react/no-children-prop': 'error',
		'react/no-deprecated': 'warn',
		'react/no-direct-mutation-state': 'error',
		'react/no-unescaped-entities': 'warn',
		'react/style-prop-object': 'error',
		'no-unexpected-multiline': 'warn',
		'no-extra-boolean-cast': 'warn',
		'no-unsafe-finally': 'warn',
		'no-irregular-whitespace': 'error',
		'object-curly-spacing': ['error', 'always'],
		'semi': ['error', 'always'],
		'yoda': 'error',
	},
};
