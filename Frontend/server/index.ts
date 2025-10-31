import express from "express";
import cors from "cors";

export function createServer() {
  const app = express();

  // Enable CORS and JSON parsing
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check or ping endpoint (optional)
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Frontend server is alive 🚀" });
  });

  // Everything else under /api will be handled by Django through proxy (Vite config)
  app.all("/api/*", (_req, res) => {
    res.status(502).json({
      message: "API route should be handled by Django backend",
    });
  });

  // Serve frontend build files in production
  if (process.env.NODE_ENV === "production") {
    app.use(express.static("dist/spa"));
  }

  return app;
}
