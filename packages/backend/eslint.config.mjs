import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: ["**/node_modules", "built", ".eslintrc.js", "@types/**/*"],
}, ...compat.extends("../shared/.eslintrc.js"), {
    languageOptions: {
        ecmaVersion: 5,
        sourceType: "script",

        parserOptions: {
            tsconfigRootDir: import.meta.dirname,
            project: ["./tsconfig.json"],
        },
    },

    rules: {
        "import/order": ["warn", {
            groups: [
                "builtin",
                "external",
                "internal",
                "parent",
                "sibling",
                "index",
                "object",
                "type",
            ],

            pathGroups: [{
                pattern: "@/**",
                group: "external",
                position: "after",
            }],
        }],

        "no-restricted-globals": ["error", {
            name: "__dirname",
            message: "Not in ESModule. Use `import.meta.url` instead.",
        }, {
            name: "__filename",
            message: "Not in ESModule. Use `import.meta.url` instead.",
        }],
    },
}];
