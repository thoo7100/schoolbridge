"use client";
import dynamic from "next/dynamic";
import Link from "next/link";

const MapClient = dynamic(() => import("../components/MapClient"), {
  ssr: false,
  loading: () => <p style={{ padding: 40 }}>Loading map...</p>,
});

export default function MapPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#f0f4f8" }}>
      <nav style={{
        background: "#1a56db", padding: "16px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
      }}>
        <Link href="/" style={{ color: "white", fontSize: 22, fontWeight: 700, textDecoration: "none" }}>
          🏫 SchoolBridge
        </Link>
        <Link href="/" style={{
          background: "white", color: "#1a56db", padding: "8px 18px",
          borderRadius: 8, fontWeight: 600, textDecoration: "none", fontSize: 14
        }}>← Back to Schools</Link>
      </nav>
      <div style={{ maxWidth: 1100, margin: "40px auto", padding: "0 24px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>🗺️ School Map</h1>
        <p style={{ color: "#718096", marginBottom: 24 }}>Browse schools by state — click a pin to visit the school page</p>
        <div style={{ borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", background: "white", padding: 20 }}>
          <MapClient />
        </div>
      </div>
    </main>
  );
}