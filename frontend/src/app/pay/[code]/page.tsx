"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiUrl } from "@/lib/api";

type LessonOrder = {
  code: string;
  status: string;
  paymentStatus: string;
  snapRedirectUrl?: string;
  snapToken?: string;
};

export default function PayPage() {
  const { code } = useParams() as { code: string };
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        // 1. Verify status
        const verifyRes = await fetch(apiUrl(`/lesson-orders/${code}/verify`), { cache: "no-store" });
        const verify = await verifyRes.json();

        if (verify.status === "PAID") {
          router.push(`/invoice/${code}`);
          return;
        }

        // 2. Request payment token
        const payRes = await fetch(apiUrl(`/lesson-orders/${code}/pay`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const pay = await payRes.json();

        if (!pay.token) throw new Error(pay.error || "Gagal membuat transaksi");
        setRedirectUrl(pay.redirectUrl);

        // 3. Load Snap script
        const script = document.createElement("script");
        script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
        script.setAttribute("data-client-key", process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "");
        document.body.appendChild(script);

        script.onload = () => {
          // @ts-ignore
          window.snap.pay(pay.token, {
            onSuccess: () => router.push(`/invoice/${code}`),
            onPending: () => router.push(`/invoice/${code}`),
            onClose: () => setMessage("Transaksi dibatalkan."),
            onError: () => setMessage("Terjadi kesalahan."),
          });
        };
      } catch (err: any) {
        setMessage(err.message);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [code, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold mb-4">Pembayaran Les Musik</h1>
      {loading && <p>Menyiapkan transaksi...</p>}
      {!loading && message && <p className="text-red-500">{message}</p>}
      {!loading && !message && (
        <button
          onClick={async () => {
            const res = await fetch(apiUrl(`/lesson-orders/${code}/verify`));
            const j = await res.json();
            if (j.status === "PAID") router.push(`/invoice/${code}`);
            else alert("Belum dibayar.");
          }}
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Cek Status
        </button>
      )}
      {redirectUrl && (
        <a
          href={redirectUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 text-blue-600 underline text-sm"
        >
          Buka Halaman Pembayaran
        </a>
      )}
    </div>
  );
}
