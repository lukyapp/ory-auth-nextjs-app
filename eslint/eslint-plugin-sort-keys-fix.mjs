import sortKeysFix from "eslint-plugin-sort-keys-fix";

const plugin = {
    plugins: {
        "sort-keys-fix": sortKeysFix,
    },
    rules: {
        /**
         * Sort object keys (auto-fix)
         * Note: affects object literals, not destructuring.
         */
        "sort-keys-fix/sort-keys-fix": [
            "error",
            "asc",
            {
                caseSensitive: false,
                natural: true,
            },
        ],
    },
}

export default plugin