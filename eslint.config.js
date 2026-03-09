import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Node.js globals
        console: 'readonly',
        process: 'readonly',
        global: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        URL: 'readonly',
        fetch: 'readonly',
      },
    },
    rules: {
      // Erros que queremos pegar
      'no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      'no-undef': 'error',
      'no-console': 'off', // Permitir console.log (útil em servidor)

      // Boas práticas
      eqeqeq: ['error', 'always'], // Sempre usar === ao invés de ==
      'no-var': 'error', // Usar let/const ao invés de var
      'prefer-const': 'warn', // Preferir const quando não reatribui
      'no-throw-literal': 'error', // Sempre throw new Error()
    },
  },
  {
    // Ignorar arquivos que não devemos verificar
    ignores: [
      'node_modules/**',
      'frontend/script.js', // Frontend legado grande, limpar depois
    ],
  },
];
