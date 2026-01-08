import { fixupPluginRules } from '@eslint/compat'
import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import pluginImport from 'eslint-plugin-import'
import pluginNode from 'eslint-plugin-node'
import globals from 'globals'


export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            parserOptions: {
                ecmaFeatures: {
                    modules: true
                },
                ecmaVersion: 'latest',
            },
            sourceType: 'module',
            globals: {
                ...globals.node
            }
        }
    },
    {
        files: ['**/*.{js,ts}'],
        plugins: {
            'node': fixupPluginRules(pluginNode),
            'import': pluginImport,
            '@stylistic': stylistic
        },
        rules: {
            ...pluginNode.configs.recommended.rules,
            'node/no-unsupported-features/es-syntax': 'off', // Allow modern ES syntax in node
            'node/no-unpublished-import': 'off',
            'camelcase': 'error',
            'prefer-const': 'error',
            'require-await': 'error',
            'no-return-await': 'error',
            'no-var': 'error',
            'no-duplicate-imports': 'error',
            'curly': ['error', 'all'],
            'eqeqeq': ['error', 'always'],
            'no-floating-decimal': 'error',
            'import/order': ['error', {
                'groups': [
                    'builtin', // Node.js built-in modules
                    'external', // npm packages
                    'internal', // paths marked as internal
                    ['parent', 'sibling'], // parent and sibling directories
                    'index', // index files
                    'object', // object imports
                    'type' // type imports
                ],
                'newlines-between': 'always',
                'alphabetize': {
                    'order': 'asc',
                    'caseInsensitive': true
                }
            }],
            'import/no-commonjs': 'error',
            '@stylistic/indent': ['error', 4],
            '@stylistic/quotes': ['error', 'single', { 'avoidEscape': true, 'allowTemplateLiterals': true }],
            '@stylistic/jsx-quotes': ['error', 'prefer-single'],
            '@stylistic/arrow-spacing': 'error',
            '@stylistic/comma-spacing': ['error', { 'before': false, 'after': true }],
            '@stylistic/block-spacing': 'error',
            '@stylistic/brace-style': ['error', '1tbs', { 'allowSingleLine': true }],
            '@stylistic/keyword-spacing': ['error', { 'before': true, 'after': true }],
            '@stylistic/lines-between-class-members': ['error', 'always'],
            '@stylistic/no-multi-spaces': 'error',
            '@stylistic/no-multiple-empty-lines': ['error', { 'max': 2, 'maxEOF': 0 }],
            '@stylistic/no-trailing-spaces': 'error',
            '@stylistic/semi': ['error', 'never'],
            '@stylistic/space-before-blocks': 'error',
            '@stylistic/space-before-function-paren': ['error', 'never'],
            '@stylistic/space-in-parens': ['error', 'never'],
            '@stylistic/space-infix-ops': 'error',
            '@stylistic/space-unary-ops': 'error',
            '@stylistic/spaced-comment': ['error', 'always']
        }
    }
]
