import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    plugins: {
      import: importPlugin,
      '@typescript-eslint': tseslint.plugin,
      'simple-import-sort': simpleImportSort
    },
    rules: {
      // --- TYPESCRIPT BEST PRACTICES ---
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/sort-type-constituents': 'error',

      // --- IMPORT STRATEGY ---
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^@(/.*|$)'], // Internal aliases (como @/hooks)
            ['^\\.\\.(?!/?$)', '^\\.\\./?$'], // Parent imports (../)
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'], // Sibling imports (./)
            ['^.+\\.s?css$'] // Archivos de estilo al final
          ]
        }
      ],
      'simple-import-sort/exports': 'error',
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',

      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' }
      ],

      // --- CLEAN CODE & ESTRUCTURA ---
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      curly: ['error', 'all'],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-else-return': 'error',

      // --- COMPLEXITY & LIMITS ---
      complexity: ['error', 10],
      'max-depth': ['error', 3],
      'max-nested-callbacks': ['error', 3],
      'max-params': ['error', 5],
      'max-lines-per-function': ['error', 200],

      // --- NAMING CONVENTIONS ---
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variable',
          filter: { regex: '^(React)$', match: true },
          format: ['PascalCase']
        },
        {
          selector: 'default',
          format: ['camelCase'],
          leadingUnderscore: 'allow'
        },
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
          leadingUnderscore: 'allow'
        },
        {
          selector: 'function',
          format: ['camelCase', 'PascalCase']
        },
        {
          selector: 'import',
          format: ['camelCase', 'PascalCase']
        },
        {
          selector: 'typeLike',
          format: ['PascalCase']
        }
      ]
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname
      },
    }
  },
  prettierConfig,
  {
    ignores: [
      '**/dist/',
      '**/.next/',
      '**/.open-next/',
      '**/.vercel/',
      '**/*.config.js',
      '**/*.config.mjs',
      '**/tsconfig.json',
    ]
  }
);
