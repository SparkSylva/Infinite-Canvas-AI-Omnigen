import { Config } from 'next-i18n-router/dist/types';

const i18nConfig: Config = {
  // locales: ['en','zh','tw','ja','fr','de','es','ar','ko'],
  locales: ['en', 'zh-CN', 'zh-TW', 'ja', 'fr', 'de', 'es', 'ko'],
  defaultLocale: 'en',
  localeDetector: false,

};
export const languageNames = {
  'en': 'English',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  'ja': '日本語',
  'fr': 'Français',
  'de': 'Deutsch',
  'ko': '한국어',
  'es': 'Español',


  // 'ar': 'العربية',

  // 'es': 'Español',
  // 'ru': 'Русский (язык)',

  // 'pl': 'Polski',
  // add more 
}
export const languageAltertive = {
  'en-US': '/',
  'zh-CN': '/zh-cn',
  'zh-TW': '/zh-tw',
  'ja-JP': '/ja',
  'fr-FR': '/fr',
  'es-ES': '/es',
  'de-DE': '/de',
  'ko-KR': '/ko',

  // 'ar-SA': '/ar',
  // 'ru-RU': '/ru',
  // 'pl-PL': '/pl',
  // add more 

}

export default i18nConfig;
// const i18nConfig = {
//   locales: ['en', 'de', 'ja'],
//   defaultLocale: 'en'
// };

// module.exports = i18nConfig;