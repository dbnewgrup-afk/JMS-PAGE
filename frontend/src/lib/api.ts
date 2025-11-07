// frontend/src/lib/api.ts
// =============================================================
// Helper API untuk frontend JMS Page
// - Otomatis menambahkan prefix "/api"
// - Menggunakan BASE_URL dari .env.local
// - Aman untuk Next.js (client & server)
// =============================================================

// Base URL backend (tanpa trailing slash)
const RAW_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
  "http://localhost:3001";

/**
 * Membangun URL absolut untuk request API backend.
 * 
 * - Jika `path` sudah dimulai dengan `/api`, dipakai langsung.
 * - Jika belum, otomatis ditambahkan prefix `/api`.
 * 
 * Contoh:
 *   apiUrl("/lesson-orders")  -> http://localhost:3001/api/lesson-orders
 *   apiUrl("lesson-orders")   -> http://localhost:3001/api/lesson-orders
 *   apiUrl("/api/healthz")    -> http://localhost:3001/api/healthz
 */
export function apiUrl(path: string): string {
  const p = path.startsWith("/api/")
    ? path
    : `/api${path.startsWith("/") ? path : `/${path}`}`;
  return `${RAW_BASE}${p}`;
}

/**
 * Helper sederhana untuk POST JSON
 * 
 * Contoh:
 *   await postJSON("/lesson-orders", { studentName: "Muba", ... });
 */
export async function postJSON<T>(
  path: string,
  body: Record<string, any>,
  signal?: AbortSignal
): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j?.error || `Request gagal (${res.status})`);
  }

  return res.json() as Promise<T>;
}

/**
 * Helper GET JSON sederhana
 */
export async function getJSON<T>(
  path: string,
  signal?: AbortSignal
): Promise<T> {
  const res = await fetch(apiUrl(path), { method: "GET", signal });
  if (!res.ok) throw new Error(`Gagal GET (${res.status})`);
  return res.json() as Promise<T>;
}
