"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { allSchools } from "../data/allSchools";
import Link from "next/link";

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado",
  "Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois",
  "Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland",
  "Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana",
  "Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York",
  "North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania",
  "Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah",
  "Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming",
].sort();

const STATE_CENTERS: Record<string, [number, number]> = {
  Minnesota: [46.0, -94.5], Alabama: [32.8, -86.8], Alaska: [64.2, -153.4],
  Arizona: [34.3, -111.1], Arkansas: [34.8, -92.2], California: [36.8, -119.4],
  Colorado: [39.0, -105.5], Connecticut: [41.6, -72.7], Delaware: [39.0, -75.5],
  Florida: [27.8, -81.7], Georgia: [32.2, -83.4], Hawaii: [20.3, -156.4],
  Idaho: [44.4, -114.5], Illinois: [40.0, -89.2], Indiana: [39.9, -86.3],
  Iowa: [42.1, -93.5], Kansas: [38.5, -98.4], Kentucky: [37.5, -85.3],
  Louisiana: [31.1, -91.9], Maine: [45.3, -69.4], Maryland: [39.0, -76.8],
  Massachusetts: [42.3, -71.8], Michigan: [44.3, -85.6], Mississippi: [32.7, -89.7],
  Missouri: [38.5, -92.5], Montana: [47.0, -110.4], Nebraska: [41.5, -99.9],
  Nevada: [38.5, -117.2], "New Hampshire": [43.7, -71.6], "New Jersey": [40.1, -74.5],
  "New Mexico": [34.5, -106.0], "New York": [42.9, -75.5], "North Carolina": [35.5, -79.4],
  "North Dakota": [47.5, -100.5], Ohio: [40.4, -82.8], Oklahoma: [35.6, -97.5],
  Oregon: [44.0, -120.5], Pennsylvania: [40.9, -77.8], "Rhode Island": [41.7, -71.5],
  "South Carolina": [33.8, -80.9], "South Dakota": [44.4, -100.2], Tennessee: [35.9, -86.4],
  Texas: [31.5, -99.3], Utah: [39.5, -111.5], Vermont: [44.0, -72.7],
  Virginia: [37.8, -79.5], Washington: [47.4, -120.7], "West Virginia": [38.9, -80.5],
  Wisconsin: [44.3, -89.8], Wyoming: [43.0, -107.6],
};

const TYPE_LABELS: Record<string, string> = {
  elementary: "🎒 Elementary", middle: "📚 Middle",
  high: "🎓 High School", k8: "🏫 K-8", k12: "🏛️ K-12",
};

export default function SchoolMap() {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const [selectedState, setSelectedState] = useState("Minnesota");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  const stateSchools = useMemo(() => {
    return (allSchools as any[]).filter(s =>
      s.state?.toLowerCase() === selectedState.toLowerCase()
    );
  }, [selectedState]);

  const withCoords = useMemo(() => stateSchools.filter(s => s.lat && s.lng), [stateSchools]);

  const filtered = useMemo(() => {
    return stateSchools.filter(s => {
      const q = search.toLowerCase();
      const matchSearch = !q || s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q);
      const matchType = typeFilter === "all" || s.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [stateSchools, search, typeFilter]);

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current).setView([46.0, -94.5], 7);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 100);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    markersRef.current = L.layerGroup().addTo(map);
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Update markers when state changes
  useEffect(() => {
    if (!mapRef.current || !markersRef.current) return;
    markersRef.current.clearLayers();
    const center = STATE_CENTERS[selectedState] || [39.5, -98.4];
    mapRef.current.setView(center, 7);
    setTimeout(() => mapRef.current?.invalidateSize(), 100);

    if (withCoords.length === 0) return;

    const icon = L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [20, 33], iconAnchor: [10, 33], popupAnchor: [1, -28],
    });

    withCoords.forEach((school) => {
      L.marker([school.lat, school.lng], { icon })
        .addTo(markersRef.current!)
        .bindPopup(`
          <div style="min-width:160px;font-family:system-ui">
            <strong style="font-size:13px">${school.name}</strong><br/>
            <span style="color:#666;font-size:12px">📍 ${school.city}</span><br/>
            ${school.enrollment ? `<span style="font-size:12px">👥 ${school.enrollment.toLocaleString()} students</span><br/>` : ""}
            <a href="/schools/${school.id}" style="color:#1a56db;font-size:12px;font-weight:600;text-decoration:none">View School →</a>
          </div>
        `);
    });
  }, [selectedState, withCoords]);

  return (
    <div>
      {/* State selector */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <label style={{ fontWeight: 700, color: "#1a202c" }}>📍 State:</label>
        <select
          value={selectedState}
          onChange={(e) => { setSelectedState(e.target.value); setPage(1); setSearch(""); }}
          style={{
            padding: "8px 14px", borderRadius: 8, border: "1px solid #e2e8f0",
            fontSize: 14, fontWeight: 600, color: "#1a202c", background: "white", cursor: "pointer"
          }}
        >
          {US_STATES.map(s => <option key={s}>{s}</option>)}
        </select>
        <span style={{ fontSize: 13, color: "#718096" }}>
          {stateSchools.length.toLocaleString()} schools in {selectedState}
          {withCoords.length > 0 && ` · ${withCoords.length} on map`}
        </span>
      </div>

      {/* Map */}
      <div ref={containerRef} style={{ height: "450px", width: "100%", borderRadius: 12, zIndex: 0, marginBottom: 32 }} />

      {withCoords.length === 0 && (
        <div style={{
          background: "#fff3cd", border: "1px solid #ffc107", borderRadius: 10,
          padding: "12px 16px", marginBottom: 24, fontSize: 14, color: "#856404"
        }}>
          ℹ️ Map pins aren't available for {selectedState} yet — browse schools in the list below!
        </div>
      )}

      {/* School list */}
      <div style={{ marginTop: 8 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: "#1a202c" }}>
          Schools in {selectedState}
        </h3>

        {/* Search + filter */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <input
            placeholder="Search schools or city..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{
              flex: 1, minWidth: 200, padding: "8px 14px", borderRadius: 8,
              border: "1px solid #e2e8f0", fontSize: 14, outline: "none"
            }}
          />
          <select
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            style={{
              padding: "8px 14px", borderRadius: 8, border: "1px solid #e2e8f0",
              fontSize: 14, color: "#1a202c", background: "white", cursor: "pointer"
            }}
          >
            <option value="all">All Types</option>
            <option value="elementary">🎒 Elementary</option>
            <option value="middle">📚 Middle</option>
            <option value="high">🎓 High School</option>
            <option value="k8">🏫 K-8</option>
            <option value="k12">🏛️ K-12</option>
          </select>
        </div>

        <div style={{ fontSize: 13, color: "#718096", marginBottom: 12 }}>
          Showing {paginated.length} of {filtered.length.toLocaleString()} schools
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {paginated.map(school => (
            <Link key={school.id} href={`/schools/${school.id}`} style={{ textDecoration: "none" }}>
              <div style={{
                background: "white", borderRadius: 12, padding: "14px 18px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                cursor: "pointer"
              }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1a202c", marginBottom: 3 }}>
                    {school.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#718096", display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span>📍 {school.city}</span>
                    <span style={{ background: "#ebf8ff", color: "#2b6cb0", padding: "1px 8px", borderRadius: 10, fontWeight: 600 }}>
                      {TYPE_LABELS[school.type] || school.type}
                    </span>
                    {school.enrollment && <span>👥 {school.enrollment.toLocaleString()} students</span>}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ background: "#f0fff4", color: "#276749", padding: "3px 10px", borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                    ⭐ {school.rating}
                  </span>
                  <span style={{ color: "#a0aec0", fontSize: 20 }}>›</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
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
              Page {page} of {totalPages}
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
    </div>
  );
}