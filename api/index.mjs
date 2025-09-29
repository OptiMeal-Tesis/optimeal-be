// Single serverless function exporting the compiled Express app.
// The app already mounts `app.use('/api', router)` internally.
import app from "../dist/index.js";
export default app;


