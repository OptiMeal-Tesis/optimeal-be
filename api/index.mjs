// Serverless entry for Vercel. We instantiate a lightweight Express app
// and mount the compiled router at root so requests to /api/* work.
import express from "express";
import cors from "cors";
import { healthRouter } from "../dist/domains/health/health.controller.js";

const app = express();

const corsOptions = {
    origin: [
        'https://d3dkymsuwpt2re.cloudfront.net',
        'https://d3ejrhibfrfytu.cloudfront.net',
        'http://localhost:3000',
        'http://localhost:3001',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

app.use('/health', healthRouter);

export default app;


