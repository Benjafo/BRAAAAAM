import js from "@eslint/js";
import typescript from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";

export default [
    js.configs.recommended,
    {
        files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: "module",
            },
        },
        plugins: {
            "@typescript-eslint": typescript,
        },
        rules: {
            ...typescript.configs.recommended.rules,
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/explicit-function-return-type": "warn",
            "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
            "no-console": ["warn", { allow: ["warn", "error"] }],
        },
    },
];
