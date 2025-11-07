// backend/src/controllers/lessonOrders.controller.ts
import type { Request, Response } from "express";
import { z } from "zod";
import dayjs from "dayjs";
import localeId from "dayjs/locale/id.js";
import utcPlugin from "dayjs/plugin/utc.js";
import timezonePlugin from "dayjs/plugin/timezone.js";
import { randomUUID } from "crypto";

// Pakai single Prisma instance (hindari banyak koneksi)
import { prisma } from "../lib/prisma.js";

// Midtrans helpers (ESM: pakai .js)
import {
  createSnapTransaction,
  inquiryTransaction,
  mapMidtransToStatuses,
  verifyMidtransSignature,
} from "../lib/midtrans.js";

// Setup Dayjs + timezone + locale Indonesia
dayjs.extend(utcPlugin);
dayjs.extend(timezonePlugin);
dayjs.locale(localeId);

const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:3001";
const SLA_HOURS = Number(process.env.SLA_HOURS || 24);

/* ======================================================
 *  Create Order
 * ====================================================== */
const CreateOrderSchema = z.object({
  studentName: z.string().trim().min(1).max(80),
  studentPhone: z.string().trim().min(8).regex(/^[0-9+\s]+$/),
  subject: z.string().trim().min(1),
  syllabusId: z.string().optional(),
  preferredAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export async function createOrder(req: Request, res: Response) {
  try {
    const input = CreateOrderSchema.parse(req.body);
    // @ts-ignore: tz() provided by plugin at runtime
    const now = dayjs().tz("Asia/Jakarta");
    const expireAt = now.add(SLA_HOURS, "hour").toDate();

    // ======================================================
    // TEMPORARY: fallback harga manual biar Snap bisa muncul
    // ======================================================
    const priceMap: Record<string, number> = {
      Gitar: 250000,
      Piano: 250000,
      Vokal: 250000,
      Drum: 250000,
      Biola: 250000,
      Bass: 250000,
      Keyboard: 250000,
      Saxophone: 250000,
      Flute: 250000,
    };
    const amount = priceMap[input.subject] || 250000;

    // Kode LES-yyyyMMdd-XXXXX
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    const code = `LES-${now.format("YYYYMMDD")}-${rand}`;
    const id = randomUUID();

    await prisma.lessonOrder.create({
      data: {
        id,
        code,
        studentName: input.studentName,
        studentPhone: input.studentPhone.replace(/\s+/g, ""),
        subject: input.subject,
        syllabusId: input.syllabusId || null,
        preferredAt: input.preferredAt ? new Date(input.preferredAt) : null,
        amount,
        currency: "IDR",
        status: "PENDING",
        paymentStatus: "UNPAID",
        paymentProvider: "MIDTRANS",
        expireAt,
        notes: input.notes || null,
      },
    });

    res.json({ code });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || "invalid_payload" });
  }
}

/* ======================================================
 *  Pay Order (idempotent token reuse)
 * ====================================================== */
export async function payOrder(req: Request, res: Response) {
  const { code } = req.params;
  try {
    const order = await prisma.lessonOrder.findUnique({ where: { code } });
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (order.status === "PAID" || order.status === "EXPIRED") {
      return res.status(409).json({ error: "Order already finalized" });
    }

    // Reuse token lama jika masih pending
    if (order.snapToken && order.paymentStatus === "PENDING") {
      return res.json({
        token: order.snapToken,
        redirectUrl: order.snapRedirectUrl,
        code: order.code,
      });
    }

    const { token, redirect_url } = await createSnapTransaction({
      orderId: order.code,
      grossAmount: order.amount,
      customer: { name: order.studentName, phone: order.studentPhone },
      redirectBaseUrl: APP_BASE_URL,
    });

    await prisma.lessonOrder.update({
      where: { code },
      data: {
        snapToken: token,
        snapRedirectUrl: redirect_url,
        status: "WAITING_PAYMENT",
        paymentStatus: "PENDING",
      },
    });

    res.json({ token, redirectUrl: redirect_url, code });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "pay_failed" });
  }
}

/* ======================================================
 *  Verify Order (polling)
 * ====================================================== */
export async function verifyOrder(req: Request, res: Response) {
  const { code } = req.params;
  try {
    const order = await prisma.lessonOrder.findUnique({ where: { code } });
    if (!order) return res.status(404).json({ error: "Order not found" });

    // @ts-ignore
    const now = dayjs().tz("Asia/Jakarta");
    if (order.expireAt && now.isAfter(order.expireAt) && order.status !== "PAID") {
      await prisma.lessonOrder.update({
        where: { code },
        data: { status: "EXPIRED", paymentStatus: "EXPIRED" },
      });
    }

    const mid = await inquiryTransaction(code);
    const { orderStatus, paymentStatus } = mapMidtransToStatuses(
      mid.transaction_status,
      mid.fraud_status
    );

    const updateData: Record<string, any> = { status: orderStatus, paymentStatus };
    if (paymentStatus === "PAID" && !order.paidAt) {
      updateData.paidAt = new Date(mid.settlement_time || Date.now());
    }

    const updated = await prisma.lessonOrder.update({
      where: { code },
      data: updateData,
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "verify_failed" });
  }
}

/* ======================================================
 *  Midtrans Webhook
 * ====================================================== */
export async function midtransWebhook(req: Request, res: Response) {
  try {
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      settlement_time,
    } = req.body;

    const valid = verifyMidtransSignature({
      orderId: order_id,
      statusCode: status_code,
      grossAmount: gross_amount,
      signature: signature_key,
    });
    if (!valid) return res.status(403).json({ error: "Invalid signature" });

    const existing = await prisma.lessonOrder.findUnique({ where: { code: order_id } });
    if (!existing) return res.status(404).json({ error: "Order not found" });

    const { orderStatus, paymentStatus } = mapMidtransToStatuses(
      transaction_status,
      fraud_status
    );

    const updateData: Record<string, any> = { status: orderStatus, paymentStatus };
    if (paymentStatus === "PAID" && !existing.paidAt) {
      updateData.paidAt = new Date(settlement_time || Date.now());
    }

    await prisma.lessonOrder.update({ where: { code: order_id }, data: updateData });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "webhook_failed" });
  }
}

/* ======================================================
 *  Mark Cash (manual)
 * ====================================================== */
export async function markCash(req: Request, res: Response) {
  const { code } = req.params;
  try {
    const order = await prisma.lessonOrder.findUnique({ where: { code } });
    if (!order) return res.status(404).json({ error: "Order not found" });

    const updated = await prisma.lessonOrder.update({
      where: { code },
      data: {
        paymentProvider: "CASH",
        status: "PAID",
        paymentStatus: "PAID",
        paidAt: new Date(),
      },
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "mark_cash_failed" });
  }
}
