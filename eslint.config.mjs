import tseslint from 'typescript-eslint';
import vitest from 'eslint-plugin-vitest';
import globals from 'globals';

export default tseslint.config(
    {
        extends: [
            ...tseslint.configs.strictTypeChecked,
            ...tseslint.configs.stylisticTypeChecked,
        ],
        ignores: ['dist/**'],
        files: ['**/*.ts'],
        languageOptions: {
            globals: globals.browser,
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        }
    },
    {
        files: ['**/*.test.ts'],
        plugins: {
            vitest,
        },
        rules: {
            ...vitest.configs.recommended.rules,
        }
    }
);
