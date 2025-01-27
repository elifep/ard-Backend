import fs from 'fs';
import { logDirectory, archiveDirectory } from '../config/logPaths';
import path from 'path';
import archiver from 'archiver';
import schedule from 'node-schedule';

// Arşivleme işlemini gerçekleştiren fonksiyon
export const archiveLogs = () => {
    if (!fs.existsSync(logDirectory)) {
        console.warn('Log directory does not exist:', logDirectory);
        return;
    }

    if (!fs.existsSync(archiveDirectory)) {
        fs.mkdirSync(archiveDirectory, { recursive: true });
    }

    const archiveFileName = `logs-${new Date().toISOString().split('T')[0]}.zip`;
    const archiveFilePath = path.join(archiveDirectory, archiveFileName);
    const output = fs.createWriteStream(archiveFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
        console.log(`Logs archived: ${archive.pointer()} total bytes`);
    });

    archive.on('error', (err) => {
        console.error('Error during log archiving:', err);
    });

    archive.pipe(output);
    archive.directory(logDirectory, false);
    archive.finalize();

    console.log('Archiving complete.');
};

// Günlük olarak saat 00:00'da arşivleme işlemini zamanla
schedule.scheduleJob('0 0 * * *', () => {
    console.log('Starting log archiving...');
    archiveLogs();
});