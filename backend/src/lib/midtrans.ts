// backend/src/lib/midtrans.ts
import crypto from "node:crypto";

/**
 * Midtrans base URLs
 */
const CORE_BASE = (process.env.MIDTRANS_BASE_URL || "https://api.sandbox.midtrans.com").replace(
  /\/+$/,
  ""
);

const SNAP_BASE = CORE_BASE.includes("sandbox")
  ? "https://app.sandbox.midtrans.com"
  : "https://app.midtrans.com";

const SERVER_KEY = (process.env.MIDTRANS_SERVER_KEY || "").trim();
if (!SERVER_KEY) {
  // Fail fast agar tidak diam-diam 401/403 ke Midtrans
  throw new Error("ENV MIDTRANS_SERVER_KEY is required");
}

/**
 * Basic Auth header "SERVER_KEY:"
 */
function authHeader() {
  const b64 = Buffer.from(`${SERVER_KEY}:`).toString("base64");
  return { Authorization: `Basic ${b64}` };
}

type CreateSnapInput = {
  orderId: string;
  grossAmount: number;
  customer?: { name?: string; phone?: string; email?: string };
  redirectBaseUrl: string; // e.g. https://your-frontend.com
};

type SnapCreateResponse = {
  token: string;
  redirect_url: string;
  // Midtrans dapat menambah field lain, biarkan fleksibel
  [k: string]: unknown;
};

export async function createSnapTransaction(input: CreateSnapInput): Promise<SnapCreateResponse> {
  const payload = {
    transaction_details: {
      order_id: input.orderId,
      gross_amount: input.grossAmount,
    },
    credit_card: { secure: true },
    customer_details: {
      first_name: input.customer?.name ?? "Tamu",
      phone: input.customer?.phone,
      email: input.customer?.email,
    },
    callbacks: {
      finish: `${input.redirectBaseUrl.replace(/\/+$/, "")}/payment/finish?order=${encodeURIComponent(
        input.orderId
      )}`,
    },
    item_details: [
      { id: "LES-1", price: input.grossAmount, quantity: 1, name: "Pembayaran Les Musik" },
    ],
  };

  const res = await fetch(`${SNAP_BASE}/snap/v1/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(payload),
  });

  const json = (await res.json().catch(() => ({}))) as Partial<SnapCreateResponse> & {
    status_message?: string;
    error_messages?: string[];
  };

  if (!res.ok) {
    const msg =
      (Array.isArray(json?.error_messages) && json.error_messages.join(", ")) ||
      json?.status_message ||
      `Midtrans Snap error (${res.status})`;
    throw new Error(msg);
  }

  if (!json?.token || !json?.redirect_url) {
    throw new Error("Invalid Snap response (missing token/redirect_url)");
  }

  return json as SnapCreateResponse;
}

type InquiryResponse = {
  transaction_status: string;
  fraud_status?: string;
  settlement_time?: string;
  gross_amount?: string;
  status_code?: string;
  payment_type?: string;
  [k: string]: unknown;
};

export async function inquiryTransaction(orderId: string): Promise<InquiryResponse> {
  const res = await fetch(`${CORE_BASE}/v2/${encodeURIComponent(orderId)}/status`, {
    headers: { Accept: "application/json", ...authHeader() },
  });
  const json = (await res.json().catch(() => ({}))) as Partial<InquiryResponse> & {
    status_message?: string;
  };
  if (!res.ok) {
    throw new Error(json?.status_message || `Midtrans inquiry error (${res.status})`);
  }
  if (!json?.transaction_status) {
    throw new Error("Invalid inquiry response (missing transaction_status)");
  }
  return json as InquiryResponse;
}

/**
 * Verifikasi signature (webhook/HTTP notification).
 * raw = order_id + status_code + gross_amount + server_key
 */
export function verifyMidtransSignature(args: {
  orderId: string;
  statusCode: string;
  grossAmount: string; // harus string persis seperti yang dikirim Midtrans (mis. "120000.00")
  signature: string;
}) {
  const raw = `${args.orderId}${args.statusCode}${args.grossAmount}${SERVER_KEY}`;
  const digest = crypto.createHash("sha512").update(raw).digest("hex");
  return digest === args.signature;
}

/**
 * Pemetaan status Midtrans → status internal
 */
export function mapMidtransToStatuses(
  txStatus: string,
  fraud?: string
): {
  orderStatus: "PENDING" | "WAITING_PAYMENT" | "PAID" | "EXPIRED" | "CANCELLED";
  paymentStatus: "UNPAID" | "PENDING" | "PAID" | "EXPIRED";
} {
  const s = txStatus?.toLowerCase();
  const f = fraud?.toLowerCase();

  if (s === "settlement") return { orderStatus: "PAID", paymentStatus: "PAID" };
  if (s === "capture" && f === "accept") return { orderStatus: "PAID", paymentStatus: "PAID" };
  if (s === "expire") return { orderStatus: "EXPIRED", paymentStatus: "EXPIRED" };
  if (s === "deny" || s === "cancel") return { orderStatus: "CANCELLED", paymentStatus: "UNPAID" };

  // challenge, pending, authorize, etc.
  return { orderStatus: "WAITING_PAYMENT", paymentStatus: "PENDING" };
}
