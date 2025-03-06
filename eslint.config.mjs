import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import vitest from "@vitest/eslint-plugin";
import globals from "globals";

// @ts-check

export default tseslint.config(
  { ignores: ["dist"] },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ["test/**/*.{ts,js}", "vitest.setup.js", "vitest.globalsetup.js"],
    ...vitest.configs.recommended,
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2025,
        ...vitest.environments.env.globals,
      },
    },
  },
  {
    files: ["source/**/*.{ts,js}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...globals.es2025 },
    },
  },
  {
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          caughtErrors: "none",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
);
