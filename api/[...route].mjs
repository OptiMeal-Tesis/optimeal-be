// Catch-all serverless function for all /api/* routes on Vercel.
// We instantiate a lightweight Express app and mount the compiled router at root.
import express from "express";
import cors from "cors";
import { router } from "../dist/router/index.js";

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
    optionsSuccessStatus: 204,
    preflightContinue: false
};

app.use(cors(corsOptions));
app.use(express.json());

// Generic OPTIONS handler to satisfy CORS preflight without wildcard route pattern
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

// Vercel strips the leading /api segment before routing here, so /api/* -> /*.
app.use('/', router);

export default app;


