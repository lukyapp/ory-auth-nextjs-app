import sortDestructureKeys from "eslint-plugin-sort-destructure-keys";

const plugin = {
    plugins: {
        "sort-destructure-keys": sortDestructureKeys,
    },
    rules: {
        /* =========================
         * Destructuring key order
         * ========================= */
        "sort-destructure-keys/sort-destructure-keys": [
            "error",
            {
                caseSensitive: false,
            },
        ],
    },
}

export default plugin