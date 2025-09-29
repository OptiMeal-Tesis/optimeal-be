import "dotenv/config";
import express from "express";
import cors from "cors";
import { router } from "./router/index.js"
import { setupSwagger } from "./swagger/index.js";

const app = express();

// Configure CORS to allow specific origins
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
// Robust preflight handler: reflect requested method/headers for Express 5
app.use((req, res, next) => {
    const origin = req.headers.origin as string | undefined;
    const requestedMethod = (req.headers['access-control-request-method'] as string | undefined) ?? undefined;
    const requestedHeaders = (req.headers['access-control-request-headers'] as string | undefined) ?? undefined;
    const allowedOrigins = corsOptions.origin as string[];
    const isAllowed = origin ? allowedOrigins.includes(origin) : false;

    if (origin && isAllowed) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Vary', 'Origin');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Methods', requestedMethod ?? (corsOptions.methods as string[]).join(', '));
        res.header('Access-Control-Allow-Headers', requestedHeaders ?? (corsOptions.allowedHeaders as string[]).join(', '));
    }

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});
app.use(express.json());

// Swagger Documentation
setupSwagger(app);

// Routes
app.use("/api", router);

// Export the app for Vercel
export default app;

// Only start the server if not in Vercel environment
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
    const port = Number(process.env.PORT) || 3000;
    app.listen(port, () => {
        console.log(`API listening on http://localhost:${port}`);
        console.log(`API Documentation available at http://localhost:${port}/api-docs`);
    });
}
