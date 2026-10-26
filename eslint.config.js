// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");
const prettier = require("eslint-config-prettier");

module.exports = tseslint.config(
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
      prettier,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        { type: "attribute", prefix: "app", style: "camelCase" },
      ],
      "@angular-eslint/component-selector": [
        "error",
        { type: "element", prefix: "app", style: "kebab-case" },
      ],
      // Reto §6: Angular moderno
      "@angular-eslint/prefer-on-push-component-change-detection": "error",
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  // Reto §3: reglas de dependencia entre capas
  {
    files: ["src/app/features/*/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@angular/*"],
              message: "domain es TypeScript puro: sin Angular.",
            },
            {
              group: [
                "**/application/**",
                "**/infrastructure/**",
                "**/presentation/**",
              ],
              message: "domain no depende de otras capas.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/app/features/*/application/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/infrastructure/**", "**/presentation/**"],
              message: "application solo depende de domain.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/app/features/*/presentation/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/infrastructure/**"],
              message: "presentation no consume infrastructure directamente.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {
      "@angular-eslint/template/prefer-control-flow": "error",
    },
  },
);
