// Catch-all serverless function for all /api/* routes on Vercel
// It exports the compiled Express app so every API path is handled here.
import app from "../dist/index.js";

export default app;


