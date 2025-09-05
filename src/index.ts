import "dotenv/config";
import express from "express";
import cors from "cors";
import { router } from "@router"

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", router);

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
});
