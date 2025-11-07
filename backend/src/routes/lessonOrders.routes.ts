import { Router } from "express";
import {
  createOrder,
  payOrder,
  verifyOrder,
  midtransWebhook,
  markCash,
} from "../controllers/lessonOrders.controller.js"; // ← .js

const r = Router();

r.post("/lesson-orders", createOrder);
r.post("/lesson-orders/:code/pay", payOrder);
r.get("/lesson-orders/:code/verify", verifyOrder);
r.post("/payments/midtrans/webhook", midtransWebhook);
r.post("/lesson-orders/:code/mark-cash", markCash);

export default r;
