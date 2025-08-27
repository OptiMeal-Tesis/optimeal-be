import "dotenv/config";
import express from "express";
import cors from "cors";
import { health } from "./routes/health";

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use(health);

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
});
