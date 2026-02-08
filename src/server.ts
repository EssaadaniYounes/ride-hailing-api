import { config } from "./config/env";
import express from "express";
import { createServer } from "./factories/server.factory";
import appRouter from './domain/index.routes';
import { errorHandler } from "./errors/errors.handler";
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

import { DriverOfferService } from './domain/ride/matching/driver-offer.service';

const app = createServer();

DriverOfferService.initialize();

app.use(cors({
    origin: config.server.corsOrigin,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many authentication attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/v1/auth', authLimiter);

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.use('/api/v1', appRouter);
app.use(errorHandler);

app.listen(config.server.port, () => {
    console.log(`Server is running on port ${config.server.port}`);
});