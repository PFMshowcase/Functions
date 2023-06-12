module.exports = {
	root: true,
	env: {
		es6: true,
		node: true,
	},
	extends: [
		"eslint:recommended",
		"plugin:import/errors",
		"plugin:import/warnings",
		"plugin:import/typescript",
		"google",
		"plugin:@typescript-eslint/recommended",
	],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		project: "tsconfig.json",
		tsconfigRootDir: __dirname,
		sourceType: "module",
	},
	ignorePatterns: [
		"/lib/**/*", // Ignore built files.
		".eslintrc.cjs", // Ignore this file
	],
	plugins: ["@typescript-eslint", "import"],
	rules: {
		quotes: ["error", "double"],
		"quote-props": ["error", "as-needed"],
		"import/no-unresolved": 0,
		indent: ["error", "tab"],
		"max-len": ["error", { code: 200 }],
		"linebreak-style": 0,
		"no-tabs": 0,
		"object-curly-spacing": ["error", "always"],
		"require-jsdoc": 0,
		"valid-jsdoc": 0,
		"prefer-promise-reject-errors": 0,
		"@typescript-eslint/no-unused-vars": [
			"warn",
			{
				argsIgnorePattern: "^_",
				varsIgnorePattern: "^_",
				caughtErrorsIgnorePattern: "^_",
			},
		],
	},
};
