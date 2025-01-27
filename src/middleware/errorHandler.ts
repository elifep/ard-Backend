import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(`[${new Date().toISOString()}] ${req.method} ${req.path} - Error: ${err.message}`);
    if (err.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation Error', error: err.message });
    }
    if (err.name === 'MongoError') {
        return res.status(500).json({ message: 'Database Error', error: err.message });
    }
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
};

export default errorHandler;