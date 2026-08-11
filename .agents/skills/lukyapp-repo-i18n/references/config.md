# Repository i18n Config

Place a JSON config at `.agent-i18n.json`, `.codex/i18n.json`, or
`agent-i18n.config.json` in the target repository.

## Fields

```json
{
  "library": "next-intl",
  "sourceLocale": "en",
  "localesDir": "src/lib/ory/elements-react/src/locales",
  "sourceFile": "en.json",
  "translationCommand": "cd src/lib/ory/elements-react/src/locales/script && node translate.js --update",
  "usage": {
    "prefer": ["useTranslations", "getTranslations"],
    "avoid": ["component-level copy objects", "inline translation dictionaries"]
  },
  "keyPolicy": {
    "sourceOfTruth": "Edit en.json first.",
    "translateScope": "Only translate keys changed in the git diff."
  }
}
```

## Notes

- `sourceFile` is optional. If omitted, it defaults to `{sourceLocale}.json`.
- `translationCommand` should be the repo's own translation or sync command.
- If the repo has several locale domains, create one config per package or add
  a `domains` array and follow the matching domain for the files being edited.
- If a local translation script already detects missing keys, still use
  `i18n-diff-keys.mjs` first to understand the intended translation scope.

## Example for `ory-auth-nextjs-app`

```json
{
  "library": "next-intl",
  "sourceLocale": "en",
  "localesDir": "src/lib/ory/elements-react/src/locales",
  "translationCommand": "cd src/lib/ory/elements-react/src/locales/script && node translate.js --update",
  "usage": {
    "prefer": ["useTranslations", "getTranslations"],
    "avoid": ["copy objects passed through props"]
  },
  "keyPolicy": {
    "sourceOfTruth": "src/lib/ory/elements-react/src/locales/en.json",
    "translateScope": "Translate only keys reported by i18n-diff-keys.mjs."
  }
}
```
