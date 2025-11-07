"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiUrl } from "@/lib/api";
import { formatIDR } from "@/lib/format";

type LessonOrder = {
  code: string;
  studentName: string;
  studentPhone: string;
  subject: string;
  amount: number;
  status: string;
  paymentStatus: string;
  paidAt?: string;
  expireAt?: string;
};

export default function InvoicePage() {
  const { code } = useParams() as { code: string };
  const router = useRouter();

  const [order, setOrder] = useState<LessonOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const fetchData = async () => {
      try {
        const res = await fetch(apiUrl(`/lesson-orders/${code}/verify`), { cache: "no-store" });
        const data = await res.json();
        setOrder(data);

        if (!["PAID", "EXPIRED"].includes(data.paymentStatus)) {
          timer = setTimeout(fetchData, 2500);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    return () => clearTimeout(timer);
  }, [code]);

  if (loading) return <div className="p-8 text-center">Memuat invoice...</div>;
  if (!order) return <div className="p-8 text-center text-red-500">Order tidak ditemukan.</div>;

  const maskedPhone =
    order.studentPhone?.length > 4
      ? order.studentPhone.replace(/.(?=.{4})/g, "*")
      : order.studentPhone;

  const statusColor =
    order.paymentStatus === "PAID"
      ? "text-green-600"
      : order.paymentStatus === "PENDING"
      ? "text-yellow-600"
      : "text-red-600";

  return (
    <div className="max-w-md mx-auto p-6 text-center border rounded-lg shadow-sm mt-10">
      <h1 className="text-2xl font-bold mb-4">Invoice Les Musik</h1>
      <div className="text-left space-y-2">
        <p><strong>Kode:</strong> {order.code}</p>
        <p><strong>Nama:</strong> {order.studentName}</p>
        <p><strong>Telepon:</strong> {maskedPhone}</p>
        <p><strong>Bidang:</strong> {order.subject}</p>
        <p><strong>Jumlah:</strong> {formatIDR(order.amount)}</p>
        <p><strong>Status Pembayaran:</strong> <span className={statusColor}>{order.paymentStatus}</span></p>
        {order.paidAt && <p><strong>Dibayar pada:</strong> {new Date(order.paidAt).toLocaleString("id-ID")}</p>}
      </div>

      <div className="mt-6">
        {order.paymentStatus === "PAID" && (
          <p className="text-green-600 font-medium">
            Pembayaran sukses. Admin akan menghubungi untuk penjadwalan dalam 24 jam.
          </p>
        )}
        {order.paymentStatus === "PENDING" && (
          <p className="text-yellow-600 font-medium">Menunggu pembayaran...</p>
        )}
        {order.paymentStatus === "EXPIRED" && (
          <p className="text-red-600 font-medium">
            Transaksi kedaluwarsa — silakan buat order baru.
          </p>
        )}
      </div>

      <button
        onClick={() => window.print()}
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Cetak Invoice
      </button>

      <button
        onClick={() => router.push("/")}
        className="mt-3 px-3 py-2 text-sm text-gray-600 underline"
      >
        Kembali ke Beranda
      </button>
    </div>
  );
}
