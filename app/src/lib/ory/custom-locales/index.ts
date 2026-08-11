import en from './en.json';
import fr from './fr.json';

export type LocaleMap = Record<string, Record<string, string>>;

export const customOryLocales: LocaleMap = Object.freeze({
  en,
  fr,
});
