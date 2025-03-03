import globals from "globals";
import parser from "vue-eslint-parser";
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

export default [
    ...compat.extends("../shared/.eslintrc.js", "plugin:vue/vue3-recommended"),
    {
        languageOptions: {
            globals: {
                ...Object.fromEntries(Object.entries(globals.node).map(([key]) => [key, "off"])),
                module: "false",
                require: "false",
                __dirname: "false",
                $$: "false",
                $ref: "false",
                $shallowRef: "false",
                $computed: "false",
                _DEV_: "false",
                _LANGS_: "false",
                _VERSION_: "false",
                _ENV_: "false",
                _PERF_PREFIX_: "false",
                _DATA_TRANSFER_DRIVE_FILE_: "false",
                _DATA_TRANSFER_DRIVE_FOLDER_: "false",
                _DATA_TRANSFER_DECK_COLUMN_: "false",
            },

            parser: parser,
            ecmaVersion: 5,
            sourceType: "script",

            parserOptions: {
                parser: "@typescript-eslint/parser",
                tsconfigRootDir: import.meta.dirname,
                project: ["./tsconfig.json"],
                extraFileExtensions: [".vue"],
            },
        },

        rules: {
            "@typescript-eslint/no-empty-interface": ["error", {
                allowSingleExtends: true,
            }],

            "@typescript-eslint/prefer-nullish-coalescing": ["error"],
            "id-denylist": ["error", "window", "e"],
            "no-shadow": ["warn"],

            "vue/attributes-order": ["error", {
                alphabetical: false,
            }],

            "vue/no-use-v-if-with-v-for": ["error", {
                allowUsingIterationVar: false,
            }],

            "vue/no-ref-as-operand": "error",

            "vue/no-multi-spaces": ["error", {
                ignoreProperties: false,
            }],

            "vue/no-v-html": "warn",
            "vue/order-in-components": "error",

            "vue/html-indent": ["warn", "tab", {
                attribute: 1,
                baseIndent: 0,
                closeBracket: 0,
                alignAttributesVertically: true,
                ignores: [],
            }],

            "vue/html-closing-bracket-spacing": ["warn", {
                startTag: "never",
                endTag: "never",
                selfClosingTag: "never",
            }],

            "vue/multi-word-component-names": "warn",
            "vue/require-v-for-key": "warn",
            "vue/no-unused-components": "warn",
            "vue/valid-v-for": "warn",
            "vue/return-in-computed-property": "warn",
            "vue/no-setup-props-destructure": "warn",
            "vue/max-attributes-per-line": "off",
            "vue/html-self-closing": "off",
            "vue/singleline-html-element-content-newline": "off",

            "vue/v-on-event-hyphenation": ["warn", "always", {
                autofix: true,
            }],
        },
    },
];
