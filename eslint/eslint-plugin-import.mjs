import importPlugin from "eslint-plugin-import";

const plugin = {
    plugins: {
        import: importPlugin,
    },
    rules: {
        /* =========================
         * Import rules (recommended)
         * ========================= */
        "import/no-unresolved": "error",
        "import/named": "error",
        "import/default": "error",
        "import/namespace": "error",

        /* =========================
         * Order & consistency
         * ========================= */
        "import/order": [
            "error",
            {
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
                "newlines-between": "always",
                alphabetize: {
                    order: "asc",
                    caseInsensitive: true,
                },
            },
        ],

        "import/newline-after-import": "error",
        "import/no-duplicates": "error",

        /* =========================
         * TypeScript-friendly rules
         * ========================= */
        "import/no-named-as-default": "off",
        "import/no-named-as-default-member": "off",
    },
}

export default plugin