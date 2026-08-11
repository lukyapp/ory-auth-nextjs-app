import tsParser from '@typescript-eslint/parser';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import { defineConfig, globalIgnores } from 'eslint/config';
import eslintPluginI18next from './eslint/eslint-plugin-i18next.mjs';
import eslintPluginImport from './eslint/eslint-plugin-import.mjs';
// import eslintPluginPerfectionist from "./eslint/eslint-plugin-perfectionist.mjs";
import eslintPluginProjectStructure from './eslint/eslint-plugin-project-structure.mjs';
import eslintPluginSortDestructureKeys from './eslint/eslint-plugin-sort-destructure-keys.mjs';
import eslintPluginSortKeysFix from './eslint/eslint-plugin-sort-keys-fix.mjs';
import eslintPluginUnusedImports from './eslint/eslint-plugin-unused-imports.mjs';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  eslintPluginImport,
  eslintPluginSortDestructureKeys,
  eslintPluginSortKeysFix,
  eslintPluginUnusedImports,
  eslintPluginProjectStructure,
  // eslintPluginPerfectionist,
  ...eslintPluginI18next,

  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'eslint/**',
    'eslint.config.mjs',
    './src/generated/**',
  ]),
]);

export default eslintConfig;
