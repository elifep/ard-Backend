import winston from 'winston';
import { logDirectory } from '../config/logPaths';
import fs from 'fs';
import DailyRotateFile from 'winston-daily-rotate-file';

// Log dizinini kontrol et ve yoksa oluştur
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true });
}

// Günlük dönen loglar için DailyRotateFile transport'u
const dailyRotateTransport = new DailyRotateFile({
    filename: `${logDirectory}/application-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    maxFiles: '30d', // 30 gün boyunca log dosyalarını saklar
    zippedArchive: true, // Eski logları sıkıştırır
});

// Winston Logger Konfigürasyonu
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
                }`;
        })
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
        }),
        dailyRotateTransport,
    ],
});

export default logger;