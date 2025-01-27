import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import caseDetailsRoutes from './routes/case.routes';
import authRoutes from './routes/auth.routes';
import requestRoutes from './routes/request.routes';
import userRoutes from './routes/user.routes';
import incidentRoutes from './routes/incident.routes';
import lawyerRoutes from './routes/lawyer.routes';
import uploadRoutes from './routes/s3.routes';

import { PORT, MONGO_URL, FRONTEND_URL, USER_URL } from './config/environment';
import { authenticateAndAuthorize } from './middleware/auth.middleware';
import rateLimiter from './middleware/rateLimiter';
import logger from './utils/logger';
import errorHandler from './middleware/errorHandler';
import requestLogger from './middleware/requestLogger';

const app = express();

// Loglama Middleware
app.use(requestLogger);

// Middleware
app.use(express.json());
app.use(cors({
    origin: [FRONTEND_URL, USER_URL],
    credentials: true
}));
app.use(cookieParser());
app.use(helmet());
app.use(rateLimiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/cases", authenticateAndAuthorize(["admin", "lawyer"]), caseDetailsRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/users", userRoutes);
app.use("/api/incidents", authenticateAndAuthorize(["admin"]), incidentRoutes);
app.use("/api/lawyers", authenticateAndAuthorize(["admin", "lawyer"]), lawyerRoutes);
app.use("/api/uploads", authenticateAndAuthorize(["admin"]), uploadRoutes);

// 404 Handling
app.use((_req: Request, res: Response) => {
    res.status(404).json({ message: 'Resource not found' });
});

// Error Handling
app.use(errorHandler);

// Mongoose connection with retry
const connectWithRetry = () => {
    mongoose.connect(MONGO_URL)
        .then(() => {
            logger.info('Connected to MongoDB');
            app.listen(PORT, () => {
                logger.info(`Server is running on port ${PORT}`);
            });
        })
        .catch((error: Error) => {
            logger.error('MongoDB connection error:', error.message);
            setTimeout(connectWithRetry, 5000);
        });
};
connectWithRetry();