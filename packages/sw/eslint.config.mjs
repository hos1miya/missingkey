import globals from "globals";
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

export default [...compat.extends("../shared/.eslintrc.js"), {
    languageOptions: {
        globals: {
            ...Object.fromEntries(Object.entries(globals.node).map(([key]) => [key, "off"])),
            require: false,
            _DEV_: false,
            _LANGS_: false,
            _VERSION_: false,
            _ENV_: false,
            _PERF_PREFIX_: false,
        },

        ecmaVersion: 5,
        sourceType: "script",

        parserOptions: {
            parser: "@typescript-eslint/parser",
            tsconfigRootDir: import.meta.dirname,
            project: ["./tsconfig.json"],
        },
    },
}];
