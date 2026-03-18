module.exports = {
  root: true,
  ignorePatterns: ['.eslintrc.cjs', 'tsconfig.json'],
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'simple-import-sort', 'import', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  rules: {
    // Enforce Prettier formatting as an ESLint rule
    'prettier/prettier': 'error',

    // Rule for auto-sorting imports
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',

    // Rule for consistent import behavior
    'import/first': 'error',
    'import/newline-after-import': 'error',
    'import/no-duplicates': 'error',

    // Naming convention enforcement
    '@typescript-eslint/naming-convention': [
      'error',
      // Default format for everything is camelCase
      {
        selector: 'default',
        format: ['camelCase'],
        leadingUnderscore: 'allow',
      },
      // Variables can be camelCase or UPPER_CASE (for constants)
      {
        selector: 'variable',
        format: ['camelCase', 'UPPER_CASE'],
        leadingUnderscore: 'allow',
      },
      // Class, interface, type, enum, etc. must be PascalCase
      {
        selector: 'typeLike',
        format: ['PascalCase'],
      },
      // Enum members must be PascalCase
      {
        selector: 'enumMember',
        format: ['PascalCase'],
      },
      // Allow snake_case and UPPER_CASE for properties (e.g., for third-party APIs or env vars)
      {
        selector: 'property',
        format: ['camelCase', 'snake_case', 'UPPER_CASE'],
        leadingUnderscore: 'allow',
      },
    ],

    // Configure the no-unused-vars rule to ignore args starting with an underscore
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

    // Function and method ordering within classes
    '@typescript-eslint/member-ordering': [
      'error',
      {
        default: [
          // Fields
          'public-static-field',
          'protected-static-field',
          'private-static-field',
          'public-instance-field',
          'protected-instance-field',
          'private-instance-field',

          // Constructors
          'constructor',

          // Methods
          'public-static-method',
          'protected-static-method',
          'private-static-method',
          'public-instance-method',
          'protected-instance-method',
          'private-instance-method',
        ],
      },
    ],
  },
  overrides: [
    {
      files: ['*.js', '*.cjs'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
};
