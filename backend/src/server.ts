// src/server.ts
import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import lessonOrdersRouter from "./routes/lessonOrders.routes"; // tanpa .js saat di TS

const app = express();

// ====== ENV & PORT ======
const PORT = Number(process.env.PORT || 3001);
const NODE_ENV = process.env.NODE_ENV || "development";

// ====== JSON Body Parser ======
app.use(express.json());

// ====== CORS CONFIG ======
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      console.warn("❌ Blocked by CORS:", origin);
      cb(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// OPTIONS preflight handler
app.options("*", cors());

// ====== ROUTES ======
app.get("/healthz", (_req, res) =>
  res.json({ ok: true, env: NODE_ENV, cwd: process.cwd() })
);

app.use("/api", lessonOrdersRouter);

// fallback root
app.get("/", (_req, res) =>
  res
    .type("text/plain")
    .send("🎵 JMS Backend API ready — use /healthz or /api/*")
);

// ====== ERROR HANDLER ======
app.use((err: any, _req: express.Request, res: express.Response, _next: any) => {
  console.error("🔥 Unhandled error:", err);
  res.status(500).json({ ok: false, error: err.message || "Internal Server Error" });
});

// ====== SERVER LISTEN ======
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✅ Allowed origins: ${allowedOrigins.join(", ") || "(none)"}`);
});
