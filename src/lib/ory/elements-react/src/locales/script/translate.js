#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline/promises');

const LOCALES_DIR = path.resolve(__dirname, '..');
const SOURCE_LOCALE = 'en';
const SOURCE_FILE = path.join(LOCALES_DIR, `${SOURCE_LOCALE}.json`);
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'qwen3:32b';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434/api/generate';

const LANGUAGE_NAMES = {
  af: 'Afrikaans',
  ak: 'Akan',
  am: 'Amharic',
  ar: 'Arabic',
  as: 'Assamese',
  az: 'Azerbaijani',
  be: 'Belarusian',
  bg: 'Bulgarian',
  bm: 'Bambara',
  bn: 'Bengali',
  ca: 'Catalan',
  cs: 'Czech',
  da: 'Danish',
  de: 'German',
  el: 'Greek',
  en: 'English',
  es: 'Spanish',
  et: 'Estonian',
  fa: 'Persian',
  fi: 'Finnish',
  fr: 'French',
  gu: 'Gujarati',
  ha: 'Hausa',
  he: 'Hebrew',
  hi: 'Hindi',
  hr: 'Croatian',
  hu: 'Hungarian',
  hy: 'Armenian',
  id: 'Indonesian',
  ig: 'Igbo',
  it: 'Italian',
  ja: 'Japanese',
  ka: 'Georgian',
  kk: 'Kazakh',
  km: 'Khmer',
  kn: 'Kannada',
  ko: 'Korean',
  ku: 'Kurdish',
  ky: 'Kyrgyz',
  lt: 'Lithuanian',
  lv: 'Latvian',
  mk: 'Macedonian',
  ml: 'Malayalam',
  mn: 'Mongolian',
  mr: 'Marathi',
  ms: 'Malay',
  my: 'Burmese',
  ne: 'Nepali',
  nl: 'Dutch',
  no: 'Norwegian',
  or: 'Odia',
  pa: 'Punjabi',
  pl: 'Polish',
  ps: 'Pashto',
  pt: 'Portuguese',
  ro: 'Romanian',
  ru: 'Russian',
  sd: 'Sindhi',
  si: 'Sinhala',
  sk: 'Slovak',
  sl: 'Slovenian',
  so: 'Somali',
  sq: 'Albanian',
  sr: 'Serbian',
  su: 'Sundanese',
  sv: 'Swedish',
  sw: 'Swahili',
  ta: 'Tamil',
  te: 'Telugu',
  tg: 'Tajik',
  th: 'Thai',
  tk: 'Turkmen',
  tl: 'Tagalog',
  tr: 'Turkish',
  ug: 'Uyghur',
  uk: 'Ukrainian',
  ur: 'Urdu',
  uz: 'Uzbek',
  vi: 'Vietnamese',
  xh: 'Xhosa',
  yo: 'Yoruba',
  zh: 'Chinese',
  zu: 'Zulu',
};

async function main() {
  const [command, language] = process.argv.slice(2);

  if (!command) {
    printUsage();
    return;
  }

  if (command === '--update') {
    if (language) {
      await updateLanguage(language);
      return;
    }

    await updateExistingLanguages();
    return;
  }

  if (command === '--new') {
    if (!language) {
      throw new Error('Missing language code. Example: node translate.js --new pt');
    }

    await createLanguage(language);
    return;
  }

  if (command === '--all') {
    await updateExistingLanguages();
    await promptForNewLanguages();
    return;
  }

  printUsage();
}

function printUsage() {
  console.log(`Usage:
  node translate.js --update       Update all existing locale files
  node translate.js --update fr    Update one existing locale file
  node translate.js --new pt       Create a new locale file
  node translate.js --all          Update existing locales and optionally add new ones

Environment:
  OLLAMA_MODEL=${DEFAULT_MODEL}
  OLLAMA_URL=${OLLAMA_URL}`);
}

async function updateExistingLanguages() {
  const languages = listLocaleCodes().filter((code) => code !== SOURCE_LOCALE);

  for (const language of languages) {
    await updateLanguage(language);
    await delay(1000);
  }
}

async function updateLanguage(language) {
  assertKnownLanguage(language);

  const file = localeFile(language);
  if (!fs.existsSync(file)) {
    throw new Error(`${file} does not exist. Use --new ${language} to create it.`);
  }

  const source = readJson(SOURCE_FILE);
  const target = readJson(file);
  const missing = pickMissing(source, target);

  if (Object.keys(missing).length === 0) {
    const ordered = orderLikeSource(source, target);
    writeJson(file, ordered);
    console.log(`${language}: up to date`);
    return;
  }

  console.log(`${language}: translating ${Object.keys(missing).length} missing keys`);

  const translations = await translateEntries(missing, language);
  const merged = orderLikeSource(source, {
    ...target,
    ...translations,
  });

  writeJson(file, merged);
  console.log(`${language}: updated`);
}

async function createLanguage(language) {
  assertKnownLanguage(language);

  const file = localeFile(language);
  if (fs.existsSync(file)) {
    throw new Error(`${file} already exists. Use --update ${language} instead.`);
  }

  const source = readJson(SOURCE_FILE);
  console.log(`${language}: translating ${Object.keys(source).length} keys`);

  const translations = await translateEntries(source, language);
  writeJson(file, orderLikeSource(source, translations));
  console.log(`${language}: created`);
}

async function promptForNewLanguages() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const answer = await rl.question(
      'Add new languages? Enter comma-separated codes or press Enter to skip: ',
    );
    const languages = answer
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    for (const language of languages) {
      await createLanguage(language);
      await delay(1000);
    }
  } finally {
    rl.close();
  }
}

async function translateEntries(entries, language) {
  const languageName = LANGUAGE_NAMES[language] || language;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const translated = await requestTranslation(entries, language, languageName);
      validateTranslation(entries, translated);
      return translated;
    } catch (error) {
      console.warn(`${language}: translation attempt ${attempt} failed: ${error.message}`);
      if (attempt < 3) {
        await delay(1000);
      }
    }
  }

  console.warn(`${language}: using English fallbacks for ${Object.keys(entries).length} keys`);
  return { ...entries };
}

async function requestTranslation(entries, language, languageName) {
  const { masked, restore } = maskProtectedTokens(entries);
  const prompt = `Translate this JSON object from English to ${languageName} (${language}).

Rules:
- Return only a valid JSON object.
- Preserve every key exactly.
- Preserve protected tokens exactly, such as __ORY_TOKEN_0__.
- Translate only the string values.

JSON:
${JSON.stringify(masked, null, 2)}`;

  const response = await fetch(OLLAMA_URL, {
    body: JSON.stringify({
      format: 'json',
      model: DEFAULT_MODEL,
      prompt,
      stream: false,
    }),
    headers: {
      'content-type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Ollama returned ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  return restore(parseJsonObject(payload.response));
}

function maskProtectedTokens(entries) {
  const tokensByKey = {};
  const masked = {};

  for (const [key, value] of Object.entries(entries)) {
    const tokens = [];

    masked[key] = value.replace(/(\{[^{}]+\}|<\/?[a-zA-Z][^>]*>)/g, (token) => {
      const marker = `__ORY_TOKEN_${tokens.length}__`;
      tokens.push(token);
      return marker;
    });

    tokensByKey[key] = tokens;
  }

  return {
    masked,
    restore(translated) {
      const restored = {};

      for (const [key, value] of Object.entries(translated)) {
        let next = value;
        const tokens = tokensByKey[key] || [];

        tokens.forEach((token, index) => {
          next = next.replaceAll(`__ORY_TOKEN_${index}__`, token);
        });

        restored[key] = next;
      }

      return restored;
    },
  };
}

function validateTranslation(source, translated) {
  const sourceKeys = Object.keys(source);
  const translatedKeys = Object.keys(translated);

  if (sourceKeys.length !== translatedKeys.length) {
    throw new Error('translated key count does not match source key count');
  }

  for (const key of sourceKeys) {
    if (!(key in translated)) {
      throw new Error(`missing translated key: ${key}`);
    }

    if (typeof translated[key] !== 'string') {
      throw new Error(`translated value is not a string: ${key}`);
    }

    assertSameTokens(key, source[key], translated[key], extractPlaceholders);
    assertSameTokens(key, source[key], translated[key], extractHtmlTags);
  }
}

function assertSameTokens(key, source, translated, extractor) {
  const sourceTokens = extractor(source);
  const translatedTokens = extractor(translated);

  if (sourceTokens.join('\n') !== translatedTokens.join('\n')) {
    throw new Error(`tokens changed for key: ${key}`);
  }
}

function extractPlaceholders(value) {
  return value.match(/\{[^{}]+\}/g) || [];
}

function extractHtmlTags(value) {
  return value.match(/<\/?[a-zA-Z][^>]*>/g) || [];
}

function parseJsonObject(value) {
  if (typeof value !== 'string') {
    throw new Error('Ollama response did not include a string response');
  }

  const trimmed = value.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(withoutFence);
  } catch {
    const start = withoutFence.indexOf('{');
    const end = withoutFence.lastIndexOf('}');

    if (start === -1 || end === -1 || end <= start) {
      throw new Error('could not find JSON object in Ollama response');
    }

    return JSON.parse(withoutFence.slice(start, end + 1));
  }
}

function orderLikeSource(source, target) {
  const ordered = {};

  for (const key of Object.keys(source)) {
    if (key in target) {
      ordered[key] = target[key];
    }
  }

  return ordered;
}

function pickMissing(source, target) {
  const missing = {};

  for (const [key, value] of Object.entries(source)) {
    if (!(key in target)) {
      missing[key] = value;
    }
  }

  return missing;
}

function listLocaleCodes() {
  return fs
    .readdirSync(LOCALES_DIR)
    .filter((file) => file.endsWith('.json'))
    .map((file) => path.basename(file, '.json'))
    .sort();
}

function assertKnownLanguage(language) {
  if (!/^[a-z]{2}$/.test(language)) {
    throw new Error(`Invalid language code: ${language}`);
  }
}

function localeFile(language) {
  return path.join(LOCALES_DIR, `${language}.json`);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
