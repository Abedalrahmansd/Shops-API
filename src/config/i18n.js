// src/config/i18n.js
import i18n from 'i18n';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

i18n.configure({
  locales: ['en', 'ar'],
  directory: path.join(__dirname, '../locales'),
  defaultLocale: 'ar', // Arabic default
  queryParameter: 'lang', // ?lang=ar
  autoReload: false,
  updateFiles: false,
  syncFiles: false,
});

export default i18n;