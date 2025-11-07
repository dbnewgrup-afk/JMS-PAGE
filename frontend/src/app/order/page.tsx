"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LESSON_CLASSES } from "@/data/lessonClasses";
import { apiUrl } from "@/lib/api";
import { formatIDR } from "@/lib/format";

type CardState = {
  name: string;
  phone: string;
  loading: boolean;
};

export default function OrderPage() {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, CardState>>(
    Object.fromEntries(
      LESSON_CLASSES.map((c) => [c.name, { name: "", phone: "", loading: false }])
    )
  );

  const update = (subject: string, patch: Partial<CardState>) =>
    setForm((s) => ({ ...s, [subject]: { ...s[subject], ...patch } }));

  async function create(subject: string) {
    const s = form[subject];
    try {
      update(subject, { loading: true });

      const res = await fetch(apiUrl("/lesson-orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: s.name || "Tamu",
          studentPhone: s.phone || "08123456789",
          subject,
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `Gagal membuat order (${res.status})`);
      }

      const j = await res.json();
      router.push(`/pay/${encodeURIComponent(j.code)}`);
    } catch (e: any) {
      alert(e?.message || "Gagal membuat order");
    } finally {
      update(subject, { loading: false });
    }
  }

  return (
    <main
      style={{
        position: "relative",
        minHeight: "100vh",
        padding: "60px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        color: "#fff",
        overflowX: "hidden",
      }}
    >
      {/* Background image */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url('/bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          zIndex: 0,
        }}
      />

      {/* Overlay untuk bikin teks tetap kebaca */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 1,
        }}
      />

      {/* Konten */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          maxWidth: 860,
        }}
      >
        <h1
          style={{
            fontSize: 32,
            fontWeight: 700,
            marginBottom: 24,
            textAlign: "center",
            textShadow: "0 2px 10px rgba(0,0,0,0.4)",
          }}
        >
          Pilihan Kelas Musik
        </h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 20,
          }}
        >
          {LESSON_CLASSES.map((c) => {
            const st = form[c.name];
            return (
              <div
                key={c.name}
                style={{
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 12,
                  padding: 16,
                  background: "rgba(255,255,255,0.1)",
                  backdropFilter: "blur(6px)",
                  color: "#fff",
                }}
              >
                <h3 style={{ margin: 0, fontSize: 18 }}>{c.name}</h3>
                <p style={{ margin: "8px 0", color: "#d1d5db" }}>{c.desc}</p>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>
                  {formatIDR(c.price)}/sesi
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  <input
                    placeholder="Nama"
                    value={st?.name || ""}
                    onChange={(e) => update(c.name, { name: e.target.value })}
                    style={{
                      padding: 8,
                      border: "1px solid #ccc",
                      borderRadius: 8,
                      outline: "none",
                      fontSize: 14,
                      color: "#000",
                    }}
                  />
                  <input
                    placeholder="Telepon/WA"
                    value={st?.phone || ""}
                    onChange={(e) => update(c.name, { phone: e.target.value })}
                    style={{
                      padding: 8,
                      border: "1px solid #ccc",
                      borderRadius: 8,
                      outline: "none",
                      fontSize: 14,
                      color: "#000",
                    }}
                  />
                  <button
                    onClick={() => create(c.name)}
                    disabled={!!st?.loading}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: st?.loading
                        ? "#9ca3af"
                        : "linear-gradient(90deg,#22c55e,#16a34a)",
                      color: "white",
                      border: 0,
                      cursor: st?.loading ? "not-allowed" : "pointer",
                      fontWeight: 600,
                      transition: "all 0.25s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!st?.loading)
                        (e.currentTarget as HTMLButtonElement).style.filter =
                          "brightness(1.1)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.filter =
                        "brightness(1)";
                    }}
                  >
                    {st?.loading ? "Membuat Order..." : "Pesan & Bayar"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
