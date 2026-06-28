"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { allSchools as schools } from "./data/allSchools";
import type { SchoolType } from "./data/schools";

const TYPE_LABELS: Record<string, string> = {
  all: "All Types",
  elementary: "🎒 Elementary",
  middle: "📚 Middle",
  high: "🎓 High School",
  k8: "🏫 K-8",
  k12: "🏛️ K-12",
};

const US_STATES = [
  "All States","Alabama","Alaska","Arizona","Arkansas","California","Colorado",
  "Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois",
  "Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland",
  "Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana",
  "Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York",
  "North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania",
  "Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah",
  "Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming",
];

export default function Home() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<SchoolType | "all">("all");
  const [stateFilter, setStateFilter] = useState("All States");
  const [publicFilter, setPublicFilter] = useState<"all" | "public" | "private">("all");
  const [sortBy, setSortBy] = useState<"name" | "rating" | "enrollment">("name");
  const [page, setPage] = useState(1);
  const PER_PAGE = 30;

  const filtered = useMemo(() => {
    let results = schools.filter((s) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const words = q.split(" ").filter(Boolean);
        const name = s.name.toLowerCase();
        const city = s.city.toLowerCase();
        const district = ((s as any).district || "").toLowerCase();
        const matchesSearch = name.includes(q) || city.includes(q) ||
          words.every(w => name.includes(w) || city.includes(w) || district.includes(w));
        if (!matchesSearch) return false;
      }
      // Type
      if (typeFilter !== "all" && s.type !== typeFilter) return false;
      // State
      if (stateFilter !== "All States" && s.state.toLowerCase() !== stateFilter.toLowerCase()) return false;
      // Public/Private
      if (publicFilter === "public" && !s.public) return false;
      if (publicFilter === "private" && s.public) return false;
      return true;
    });

    // Sort
    results.sort((a, b) => {
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "enrollment") return (b.enrollment || 0) - (a.enrollment || 0);
      return a.name.localeCompare(b.name);
    });

    return results;
  }, [search, typeFilter, stateFilter, publicFilter, sortBy]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleSearch = (val: string) => { setSearch(val); setPage(1); };
  const handleFilter = (fn: () => void) => { fn(); setPage(1); };

  return (
    <main style={{ minHeight: "100vh", background: "#f0f4f8" }}>

      {/* NAVBAR */}
      <nav style={{
        background: "#1a56db", padding: "16px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
      }}>
        <span style={{ color: "white", fontSize: 22, fontWeight: 700 }}>🏫 SchoolBridge</span>
        <Link href="/map" style={{
          background: "white", color: "#1a56db", padding: "8px 18px",
          borderRadius: 8, fontWeight: 600, textDecoration: "none", fontSize: 14
        }}>🗺️ View Map</Link>
      </nav>

      {/* HERO */}
      <div style={{
        background: "linear-gradient(135deg, #1a56db 0%, #1e429f 100%)",
        padding: "60px 32px", textAlign: "center", color: "white"
      }}>
        <h1 style={{ fontSize: 42, fontWeight: 800, marginBottom: 12 }}>Find Your Next School</h1>
        <p style={{ fontSize: 18, opacity: 0.85, marginBottom: 32 }}>
          Connect with schools and students across all 50 states
        </p>
        <div style={{ maxWidth: 480, margin: "0 auto", position: "relative" }}>
          <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 18 }}>🔍</span>
          <input
            placeholder="Search by school name or city..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            style={{
              width: "100%", padding: "14px 16px 14px 46px",
              borderRadius: 12, border: "none", fontSize: 16,
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)", outline: "none"
            }}
          />
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "32px auto", padding: "0 24px" }}>

        {/* FILTERS ROW 1 — Type */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {Object.entries(TYPE_LABELS).map(([key, label]) => (
            <button key={key} onClick={() => handleFilter(() => setTypeFilter(key as SchoolType | "all"))} style={{
              padding: "7px 14px", borderRadius: 20, border: "none",
              cursor: "pointer", fontWeight: 600, fontSize: 13,
              background: typeFilter === key ? "#1a56db" : "white",
              color: typeFilter === key ? "white" : "#4a5568",
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            }}>{label}</button>
          ))}
        </div>

        {/* FILTERS ROW 2 — State, Public/Private, Sort */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24, alignItems: "center" }}>
          {/* State dropdown */}
          <select
            value={stateFilter}
            onChange={(e) => handleFilter(() => setStateFilter(e.target.value))}
            style={{
              padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0",
              fontSize: 13, fontWeight: 600, background: "white",
              color: "#4a5568", cursor: "pointer"
            }}
          >
            {US_STATES.map(s => <option key={s}>{s}</option>)}
          </select>

          {/* Public/Private */}
          {(["all", "public", "private"] as const).map((v) => (
            <button key={v} onClick={() => handleFilter(() => setPublicFilter(v))} style={{
              padding: "7px 14px", borderRadius: 20, border: "none",
              cursor: "pointer", fontWeight: 600, fontSize: 13,
              background: publicFilter === v ? "#1a56db" : "white",
              color: publicFilter === v ? "white" : "#4a5568",
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              textTransform: "capitalize"
            }}>{v === "all" ? "🏫 All" : v === "public" ? "🏛️ Public" : "🔒 Private"}</button>
          ))}

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => handleFilter(() => setSortBy(e.target.value as any))}
            style={{
              padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0",
              fontSize: 13, fontWeight: 600, background: "white",
              color: "#4a5568", cursor: "pointer", marginLeft: "auto"
            }}
          >
            <option value="name">Sort: A-Z</option>
            <option value="rating">Sort: Best Rating</option>
            <option value="enrollment">Sort: Largest School</option>
          </select>
        </div>

        {/* RESULTS COUNT */}
        <div style={{ fontSize: 14, color: "#718096", marginBottom: 16 }}>
          Showing {paginated.length} of <strong>{filtered.length.toLocaleString()}</strong> schools
          {stateFilter !== "All States" && ` in ${stateFilter}`}
        </div>

        {/* SCHOOL CARDS */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {paginated.map((school) => (
            <Link key={school.id} href={`/schools/${school.id}`} style={{ textDecoration: "none" }}>
              <div style={{
                background: "white", borderRadius: 14, padding: "16px 20px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0",
                cursor: "pointer"
              }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1a202c", marginBottom: 4 }}>
                    {school.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#718096", display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span>📍 {school.city}, {school.state}</span>
                    <span style={{
                      background: "#ebf8ff", color: "#2b6cb0",
                      padding: "1px 8px", borderRadius: 10, fontWeight: 600
                    }}>{TYPE_LABELS[school.type]}</span>
                    <span style={{ color: school.public ? "#276749" : "#744210" }}>
                      {school.public ? "Public" : "Private"}
                    </span>
                    {school.enrollment && (
                      <span>👥 {school.enrollment.toLocaleString()} students</span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <span style={{
                    background: "#f0fff4", color: "#276749",
                    padding: "3px 10px", borderRadius: 20, fontSize: 13, fontWeight: 700
                  }}>⭐ {school.rating}</span>
                  <span style={{ color: "#a0aec0", fontSize: 20 }}>›</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 32, flexWrap: "wrap" }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0",
                background: "white", cursor: page === 1 ? "not-allowed" : "pointer",
                color: page === 1 ? "#a0aec0" : "#1a56db", fontWeight: 600
              }}
            >← Prev</button>
            <span style={{ padding: "8px 16px", color: "#4a5568", fontSize: 14 }}>
              Page {page} of {totalPages.toLocaleString()}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0",
                background: "white", cursor: page === totalPages ? "not-allowed" : "pointer",
                color: page === totalPages ? "#a0aec0" : "#1a56db", fontWeight: 600
              }}
            >Next →</button>
          </div>
        )}
      </div>
    </main>
  );
}