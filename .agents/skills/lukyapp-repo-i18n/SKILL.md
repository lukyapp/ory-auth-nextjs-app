---
name: lukyapp-repo-i18n
description: Use when changing UI copy, translations, locale JSON files, next-intl usage, or repository-specific i18n architecture. Enforces repo-configured i18n patterns, source-locale-first edits, and translating only keys changed in the git diff.
---

# Repo i18n

Use the target repository's i18n system instead of inventing local copy objects,
inline dictionaries, or ad hoc translation helpers.

## Workflow

1. Find the repository i18n config before editing copy:
   - `.agent-i18n.json`
   - `.codex/i18n.json`
   - `agent-i18n.config.json`
2. If no config exists, inspect the repo and propose adding one. Do not create a
   new i18n architecture unless the user asks for it.
3. Treat the configured source locale, normally `en.json`, as the source of
   truth. Add or change copy there first.
4. Use the configured i18n library and local patterns, such as `next-intl`
   `useTranslations` or `getTranslations`, instead of passing a `copy` object
   through component trees.
5. Keep translation keys stable and descriptive. Do not rename existing keys
   unless the feature requires it.
6. Translate or sync only keys changed in the current git diff. Do not churn all
   locale files.
7. Preserve ICU placeholders, HTML tags, variable names, and interpolation
   syntax exactly across translations.

## Diff Keys

Run the helper to identify which source-locale keys changed:

```bash
node skills/repo-i18n/scripts/i18n-diff-keys.mjs --config .agent-i18n.json
```

Use `--json` when machine-readable output is useful:

```bash
node skills/repo-i18n/scripts/i18n-diff-keys.mjs --config .agent-i18n.json --json
```

If the skill is installed inside `.agents/skills`, adjust the path to the
installed script.

## Config

Read [references/config.md](references/config.md) when creating or updating a
repository i18n config.

For a Next.js repo using `next-intl`, prefer the existing project import paths,
routing conventions, and message loading setup. Never introduce a parallel copy
system for a feature that should use `next-intl`.
