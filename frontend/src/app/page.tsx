"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <main
      style={{
        height: "100vh",
        width: "100vw",
        margin: 0,
        padding: 0,
        overflow: "hidden",
        position: "relative",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Background */}
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
      {/* Overlay gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom right, rgba(0,0,0,0.4), rgba(0,0,0,0.6))",
          zIndex: 1,
        }}
      />

      {/* Content */}
      <section
        style={{
          position: "relative",
          zIndex: 2,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          color: "white",
          padding: "1rem",
        }}
      >
        <h1
          style={{
            fontSize: "2.8rem",
            fontWeight: 700,
            marginBottom: "1rem",
            letterSpacing: "0.5px",
            textShadow: "0 3px 15px rgba(0,0,0,0.4)",
          }}
        >
          Selamat Datang di <span style={{ color: "#ffdb4d" }}>JMS</span>
        </h1>

        <button
          onClick={() => router.push("/order")}
          style={{
            background: "linear-gradient(90deg,#ffcc00,#ffaa00)",
            color: "#000",
            fontWeight: 700,
            padding: "0.9rem 2.4rem",
            borderRadius: "999px",
            border: "none",
            cursor: "pointer",
            fontSize: "1.1rem",
            boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
            transition: "all 0.25s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.05)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 6px 20px rgba(255,200,0,0.5)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 4px 15px rgba(0,0,0,0.3)";
          }}
        >
          ORDER SEKARANG
        </button>
      </section>
    </main>
  );
}
