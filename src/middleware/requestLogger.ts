import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    logger.info(`HTTP ${req.method} - ${req.url}`, {
        ip: req.ip,
        body: req.body,
        query: req.query,
    });
    next();
};

export default requestLogger;