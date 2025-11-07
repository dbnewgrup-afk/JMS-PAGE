import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import lessonOrdersRouter from "./routes/lessonOrders.routes.js"; // ← .js

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3001);

/** JSON body */
app.use(express.json());

/** CORS dari ALLOWED_ORIGINS (comma-separated) */
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
  })
);

app.get("/healthz", (_req, res) => res.json({ ok: true }));

app.use("/api", lessonOrdersRouter);

app.get("/", (_req, res) =>
  res.type("text/plain").send("🎵 JMS Backend API ready — use /healthz or /api/*")
);

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`✅ Allowed origins: ${allowedOrigins.join(", ") || "(none)"}`);
});
