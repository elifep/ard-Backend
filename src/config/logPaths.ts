import path from 'path';

import { LOG_PATH, LOG_ARCHIVE_PATH } from '../config/environment';

// Log ve arşiv dizinlerini ayarlayın
export const logDirectory = LOG_PATH || path.resolve(__dirname, '../../logs');
export const archiveDirectory = LOG_ARCHIVE_PATH || path.resolve(__dirname, '../../log-archives');