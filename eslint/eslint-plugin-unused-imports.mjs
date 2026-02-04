import unusedImports from 'eslint-plugin-unused-imports';

const plugin = {
  plugins: {
    'unused-imports': unusedImports,
  },
  rules: {
    /* =========================
     * Remove unused imports
     * ========================= */
    'unused-imports/no-unused-imports': 'error',

    /* =========================
     * Handle unused variables
     * ========================= */
    'unused-imports/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
      },
    ],

    /* Disable overlapping rules */
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
  },
};

export default plugin;
