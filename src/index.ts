import "dotenv/config";
import express from "express";
import cors from "cors";
import { router } from "./router/index.js"
import { setupSwagger } from "./swagger/index.js";

const app = express();
app.use(cors());
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
