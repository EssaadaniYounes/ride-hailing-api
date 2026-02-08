import express from "express";
let app: express.Application;
export function createServer() {
    if (app) return app;
    app = express();
    return app;
}