/**
 * Language Model
 * Supported language configuration and types for i18n
 */

/**
 * Supported language codes (union type for type safety)
 */
export type SupportedLanguageCode = 'tr' | 'en';

/**
 * Language entity representing a supported language
 */
export interface Language {
  /** Language code (ISO 639-1) */
  code: SupportedLanguageCode;
  /** Display name in the language itself */
  name: string;
  /** Whether this is the default language */
  isDefault: boolean;
  /** Full locale identifier (for Angular locale pipes) */
  locale: string;
}

/**
 * Supported languages constant
 * Readonly array to prevent modification
 */
export const SUPPORTED_LANGUAGES: readonly Language[] = [
  {
    code: 'tr',
    name: 'Türkçe',
    isDefault: true,
    locale: 'tr-TR'
  },
  {
    code: 'en',
    name: 'English',
    isDefault: false,
    locale: 'en-US'
  }
] as const;

/**
 * Translation key prefixes enum for better organization
 */
export enum TranslationKeyPrefix {
  COMMON = 'common',
  AUTH = 'auth',
  HOME = 'home',
  TASKS = 'tasks',
  SETTINGS = 'settings',
  STATISTICS = 'statistics',
  HISTORY = 'history',
  ERRORS = 'errors',
  SUCCESS = 'success'
}

/**
 * Translation file interface
 * Represents the structure of translation JSON files
 */
export interface TranslationFile {
  [key: string]: string;
}
