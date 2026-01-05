import {projectStructureParser, projectStructurePlugin,} from "eslint-plugin-project-structure";

const plugin = {
    plugins: {
        "project-structure": projectStructurePlugin,
    },
    files: ["**"], // Check all file extensions.
    ignores: ["projectStructure.cache.json"],
    languageOptions: {parser: projectStructureParser},
    settings: {
        // If you want to change the location of generating the projectStructure.cache.json file.
        // "project-structure/cache-location": "./src/cats",
    },
    rules: {
        "project-structure/folder-structure": [
            "error",
            {
                projectRoot: ".",
                structureRoot: "src",

                // ignore things that are not part of your source structure
                ignorePatterns: [
                    ".next/**",
                    "out/**",
                    "build/**",
                    "next-env.d.ts",
                    "**/*.md",
                ],

                // IMPORTANT: array of Rule objects (name/children), not an object map
                structure: [
                    {
                        name: "app",
                        children: []
                    },
                    {
                        name: "app-utils",
                        children: []
                    },
                    {
                        name: "components",
                        children: [
                            {name: "{kebab-case}.(tsx)"},
                            {
                                name: "ui",
                                children: [
                                    {name: "{kebab-case}.(tsx)"}
                                ],
                            },
                        ],
                    },
                    {
                        name: "features",
                        children: [
                            {
                                name: "*",
                                children: [
                                    {
                                        name: "actions",
                                        children: [
                                            {name: "{kebab-case}.action.(ts)"}
                                        ],
                                    },
                                    {
                                        name: "components",
                                        children: [
                                            {name: "{kebab-case}.(tsx)"},
                                            {
                                                name: "ui",
                                                children: [
                                                    {name: "{kebab-case}.(tsx)"}
                                                ],
                                            },
                                        ],
                                    },
                                    {
                                        name: "hooks",
                                        children: [
                                            {name: "use{PascalCase}.(ts)"},
                                        ],
                                    },
                                    {
                                        name: "types",
                                        children: []
                                    },
                                    {
                                        name: "utils",
                                        children: []
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        name: "generated",
                        children: [],
                    },
                    {
                        name: "helpers",
                        children: [
                            {name: "{kebab-case}.helper.(ts)"}
                        ],
                    },
                    {
                        name: "hooks",
                        children: [
                            {name: "use{PascalCase}.(ts)"},
                        ],
                    },
                    {
                        name: "i18n",
                        children: []
                    },
                    {
                        name: "lib",
                        children: []
                    },
                    {
                        name: "prisma",
                        children: []
                    },
                    {
                        name: "types",
                        children: []
                    },
                    {name: "env.ts"},
                    {name: "proxy.ts"},
                ],
            },
        ],
    },
}

export default plugin