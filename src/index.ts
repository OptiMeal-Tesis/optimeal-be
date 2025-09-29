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
app.options('*', cors(corsOptions));
app.use(express.json());

// Swagger Documentation
setupSwagger(app);

// Routes
app.use("/api", router);

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
    console.log(`API Documentation available at http://localhost:${port}/api-docs`);
});
