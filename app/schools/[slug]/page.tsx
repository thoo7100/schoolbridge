import { allSchools } from "../../data/allSchools";
import QuestionBox from "./QuestionBox";
import SchoolInfo from "./SchoolInfo";
import Link from "next/link";

export default async function SchoolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const school = (allSchools as any[]).find((s) => s.id === slug);

  if (!school) {
    return (
      <main style={{ minHeight: "100vh", background: "#f0f4f8" }}>
        <nav style={{ background: "#1a56db", padding: "16px 32px" }}>
          <Link href="/" style={{ color: "white", fontWeight: 700, textDecoration: "none" }}>🏫 SchoolBridge</Link>
        </nav>
        <div style={{ textAlign: "center", padding: "80px 32px" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏫</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>School not found</h1>
          <p style={{ color: "#718096", marginBottom: 24 }}>This school may have moved or been renamed.</p>
          <Link href="/" style={{ background: "#1a56db", color: "white", padding: "10px 24px", borderRadius: 8, textDecoration: "none", fontWeight: 600 }}>
            ← Back to Schools
          </Link>
        </div>
      </main>
    );
  }

  const typeLabel: Record<string, string> = {
    high: "High School", middle: "Middle School",
    elementary: "Elementary School", k8: "K-8 School", k12: "K-12 School",
  };

  const formatPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10) return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
    return phone;
  };

  const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(
    (school.address || "") + " " + school.city + " " + (school.stateAbbr || "")
  )}`;

  const websiteUrl = school.website && school.website !== "†"
    ? (school.website.startsWith("http") ? school.website : `https://${school.website}`)
    : null;

  return (
    <main style={{ minHeight: "100vh", background: "#f0f4f8" }}>

      {/* NAVBAR */}
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

      {/* HERO */}
      <div style={{
        background: "linear-gradient(135deg, #1a56db 0%, #1e429f 100%)",
        padding: "48px 32px", color: "white", textAlign: "center"
      }}>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
          {typeLabel[school.type] || "School"}
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8 }}>{school.name}</h1>
        <p style={{ fontSize: 16, opacity: 0.85 }}>📍 {school.city}, {school.state}</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
          <span style={{ background: "rgba(255,255,255,0.2)", padding: "6px 16px", borderRadius: 20, fontSize: 14, fontWeight: 600 }}>
            ⭐ {school.rating} Rating
          </span>
          <span style={{ background: "rgba(255,255,255,0.2)", padding: "6px 16px", borderRadius: 20, fontSize: 14, fontWeight: 600 }}>
            {school.public ? "🏛️ Public" : "🔒 Private"}
          </span>
          {school.enrollment && (
            <span style={{ background: "rgba(255,255,255,0.2)", padding: "6px 16px", borderRadius: 20, fontSize: 14, fontWeight: 600 }}>
              👥 {school.enrollment.toLocaleString()} Students
            </span>
          )}
          {school.teacherCount && (
            <span style={{ background: "rgba(255,255,255,0.2)", padding: "6px 16px", borderRadius: 20, fontSize: 14, fontWeight: 600 }}>
              👨‍🏫 {school.teacherCount} Teachers
            </span>
          )}
        </div>
      </div>

      {/* INFO CARDS */}
      <div style={{ maxWidth: 760, margin: "32px auto", padding: "0 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>

          {/* Address */}
          {school.address && (
            <div style={{ background: "white", borderRadius: 14, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#718096", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>📍 Address</div>
              <div style={{ fontSize: 14, color: "#1a202c", fontWeight: 500, lineHeight: 1.7 }}>
                {school.address}<br />{school.city}, {school.stateAbbr || school.state} {school.zip}
              </div>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 12, color: "#1a56db", fontWeight: 600, textDecoration: "none", marginTop: 8, display: "inline-block" }}>
                📍 Open in Google Maps →
              </a>
            </div>
          )}

          {/* Contact */}
          <div style={{ background: "white", borderRadius: 14, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#718096", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>📞 Contact</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {school.phone && (
                <a href={`tel:${school.phone}`} style={{ fontSize: 14, color: "#1a202c", textDecoration: "none", fontWeight: 500 }}>
                  📞 {formatPhone(school.phone)}
                </a>
              )}
              {websiteUrl && (
                <a href={websiteUrl} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 14, color: "#1a56db", fontWeight: 600, textDecoration: "none", wordBreak: "break-all" }}>
                  🌐 {websiteUrl.replace(/https?:\/\//, "").replace(/\/$/, "").slice(0, 35)}
                </a>
              )}
              {!school.phone && !websiteUrl && (
                <span style={{ fontSize: 14, color: "#a0aec0" }}>No contact info available</span>
              )}
            </div>
          </div>

          {/* District */}
          {school.district && (
            <div style={{ background: "white", borderRadius: 14, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#718096", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>🏢 District</div>
              <div style={{ fontSize: 14, color: "#1a202c", fontWeight: 500 }}>{school.district}</div>
            </div>
          )}

          {/* Stats */}
          {(school.enrollment || school.teacherCount) && (
            <div style={{ background: "white", borderRadius: 14, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#718096", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>📊 Quick Stats</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {school.enrollment && (
                  <div style={{ fontSize: 14, color: "#1a202c" }}>
                    👥 <strong>{school.enrollment.toLocaleString()}</strong> students enrolled
                  </div>
                )}
                {school.teacherCount && (
                  <div style={{ fontSize: 14, color: "#1a202c" }}>
                    👨‍🏫 <strong>{school.teacherCount}</strong> full-time teachers
                  </div>
                )}
                {school.enrollment && school.teacherCount && (
                  <div style={{ fontSize: 14, color: "#1a202c" }}>
                    📐 <strong>{Math.round(school.enrollment / school.teacherCount)}:1</strong> student-teacher ratio
                  </div>
                )}
                <div style={{ fontSize: 14, color: "#1a202c" }}>
                  {school.public ? "🏛️ Public school" : "🔒 Private school"}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AI DESCRIPTION + COMMON QUESTIONS */}
        <SchoolInfo school={school} />

        {/* QUESTION BOX */}
        <QuestionBox slug={slug} schoolName={school.name} />
      </div>
    </main>
  );
}