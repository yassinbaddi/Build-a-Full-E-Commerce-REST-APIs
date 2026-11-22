
import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // Files and directories ESLint should ignore
  {
    ignores: [
      "node_modules/",
      "dist/",
      "coverage/",
      ".env",
    ],
  },

  // Recommended JavaScript rules
  {
    files: ["**/*.{js,cjs,mjs}"],
    ...js.configs.recommended,
  },

  // Node.js backend files using CommonJS
  {
    files: ["**/*.js", "**/*.cjs"],
    languageOptions: {
      sourceType: "commonjs",
      globals: globals.node,
    },
  },

  // Node.js files using ES modules
  {
    files: ["**/*.mjs"],
    languageOptions: {
      sourceType: "module",
      globals: globals.node,
    },
  },

  // Browser JavaScript, if your project has a frontend
  {
    files: ["public/**/*.js"],
    languageOptions: {
      globals: globals.browser,
    },
  },

  // Additional code-quality rules
  {
    rules: {
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "no-undef": "error",
      "no-console": "off",
    },
  },
]);
