// @ts-check
import tseslint from 'typescript-eslint';

/**
 * The boundary rule is the reason this file exists (ADR-0001).
 *
 * `packages/model` imports nothing: no package, no Node built-in, only its own
 * files by relative path. `make boundary` plants a `node:fs` import there and
 * asserts this configuration fails on it, every run.
 */
export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**'] },
  ...tseslint.configs.recommendedTypeChecked,
  {
    // The config file is not source and belongs to no tsconfig; scripts/ has its own.
    files: ['eslint.config.js'],
    ...tseslint.configs.disableTypeChecked,
    rules: { ...tseslint.configs.disableTypeChecked.rules },
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: { allowDefaultProject: ['eslint.config.js'] },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['packages/model/src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              // Anything that is not a relative path: a package, a Node built-in, a scoped name.
              regex: '^[^.]',
              message: 'The model imports nothing (ADR-0001). Pass data in; return data out.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      // `node:test`'s `test()` returns a promise the runner owns.
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
);
