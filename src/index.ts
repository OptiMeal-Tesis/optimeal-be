import "dotenv/config";
import express from "express";
import cors, { CorsOptions, CorsOptionsDelegate } from "cors";
import { router } from "./router/index.js"
import { setupSwagger } from "./swagger/index.js";

const app = express();

// Dynamic CORS delegate: echoes Origin for allowed domains and lets cors handle OPTIONS
const allowedOrigins = [
    'https://d3dkymsuwpt2re.cloudfront.net',
    'https://d3ejrhibfrfytu.cloudfront.net',
    'http://localhost:5173',
    'http://localhost:5174',
];

const corsDelegate: CorsOptionsDelegate = (req, callback) => {
    const origin = (req.headers?.origin as string | undefined) ?? undefined;
    const isAllowed = origin ? allowedOrigins.includes(origin) : false;
    const options: CorsOptions = {
        origin: isAllowed ? origin : false,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        // When allowedHeaders is undefined, the cors package reflects request headers
        optionsSuccessStatus: 204,
    };
    callback(null, options);
};

app.use(cors(corsDelegate));
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
