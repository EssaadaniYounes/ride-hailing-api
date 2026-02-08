import { config } from "./config/env";
import express from "express";
import { createServer } from "./factories/server.factory";
import appRouter from './domain/index.routes';
import { errorHandler } from "./errors/errors.handler";
const app = createServer();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1', appRouter);
app.use(errorHandler);
app.listen(config.server.port, () => {
    console.log(`Server is running on port ${config.server.port}`);
});