import perfectionist from 'eslint-plugin-perfectionist';

const plugin = {
  plugins: {
    perfectionist,
  },
  rules: {
    /**
     * Imports
     * (If you already use eslint-plugin-import's import/order,
     * pick ONE — these overlap.)
     */
    'perfectionist/sort-imports': [
      'error',
      {
        type: 'alphabetical',
        order: 'asc',
        ignoreCase: true,
        newlinesBetween: 1,
        groups: [
          'type',
          ['builtin', 'external'],
          'internal',
          ['parent', 'sibling', 'index'],
          'side-effect',
          'style',
          'unknown',
        ],
      },
    ],
    'perfectionist/sort-named-imports': [
      'error',
      { type: 'alphabetical', order: 'asc', ignoreCase: true },
    ],
    'perfectionist/sort-named-exports': [
      'error',
      { type: 'alphabetical', order: 'asc', ignoreCase: true },
    ],
    'perfectionist/sort-exports': [
      'error',
      { type: 'alphabetical', order: 'asc', ignoreCase: true },
    ],

    /**
     * JSX / React
     */
    'perfectionist/sort-jsx-props': [
      'warn',
      {
        type: 'alphabetical',
        order: 'asc',
        ignoreCase: true,
      },
    ],

    /**
     * TypeScript types (very useful, low annoyance)
     */
    'perfectionist/sort-union-types': [
      'error',
      { type: 'alphabetical', order: 'asc', ignoreCase: true },
    ],
    'perfectionist/sort-intersection-types': [
      'error',
      { type: 'alphabetical', order: 'asc', ignoreCase: true },
    ],
    'perfectionist/sort-object-types': [
      'warn',
      {
        type: 'alphabetical',
        order: 'asc',
        ignoreCase: true,
        partitionByNewLine: true,
      },
    ],
  },
};

export default plugin;
