import i18next from "eslint-plugin-i18next";

const plugin = [
    i18next.configs["flat/recommended"],
    {
        rules: {
            "i18next/no-literal-string": ["error", {markupOnly: false}],
        },
    },
]

export default plugin