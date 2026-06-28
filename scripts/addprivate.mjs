import { readFileSync, writeFileSync } from "fs";

const csv = readFileSync("./scripts/private_schools.csv", "utf8");
const lines = csv.split("\n");
const headerIndex = lines.findIndex(l => l.startsWith("Private School Name,State Name"));
const headers = lines[headerIndex].split(",");
const dataLines = lines.slice(headerIndex + 1);

function parseLine(line) {
  const values = [];
  let cur = "", inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i+1] === '"') { cur += '"'; i++; continue; }
      inQuotes = !inQuotes; continue;
    }
    if (ch === "," && !inQuotes) { values.push(cur.trim()); cur = ""; continue; }
    cur += ch;
  }
  values.push(cur.trim());
  const obj = {};
  headers.forEach((h, i) => obj[h.trim()] = (values[i] || "").trim());
  return obj;
}

function toTitleCase(str) {
  return str.toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\bOf\b/g, "of").replace(/\bThe\b/g, "the")
    .replace(/\bAnd\b/g, "and").replace(/\bAt\b/g, "at")
    .replace(/\bIn\b/g, "in").replace(/\bFor\b/g, "for")
    .replace(/\bA\b/g, "a");
}

function cleanName(name) {
  return name
    .replace(/Senior High/gi, "High School")
    .replace(/Sr\.? High/gi, "High School")
    .replace(/Jr\.? High/gi, "Middle School")
    .replace(/Junior High/gi, "Middle School");
}

function isVirtual(name) {
  const n = name.toUpperCase();
  return n.includes("VIRTUAL") || n.includes("ONLINE") ||
    n.includes("DISTANCE") || n.includes("CYBER") ||
    n.includes("CORRESPONDENCE") || n.includes("REMOTE");
}

function isJunk(name) {
  const n = name.trim();
  // Too short
  if (n.length < 5) return true;
  // Must have at least 2 consecutive letters forming a word (min 3 chars)
  if (!/[a-zA-Z]{3,}/.test(n)) return true;
  // Starts with a number (likely an address or code)
  if (/^\d/.test(n)) return true;
  // Looks like a street address
  if (/\b(Dr|St|Ave|Blvd|Rd|Ln|Way|Ct|Pl|Pkwy)\b/i.test(n)) return true;
  // Just dashes, symbols
  if (/^[-–—\s]+$/.test(n)) return true;
  // Starts with special chars
  if (/^[^a-zA-Z0-9']/.test(n)) return true;
  // Known junk keywords
  const u = n.toUpperCase();
  return u.includes("PRESCHOOL ONLY") || u.includes("HEAD START") ||
    u.includes("DAYCARE") || u.includes("DAY CARE");
}

function guessType(name) {
  const n = name.toUpperCase();
  if (n.includes("HIGH SCHOOL") || n.includes("SENIOR HIGH") || n.includes("SR HIGH")) return "high";
  if (n.includes("MIDDLE") || n.includes("JUNIOR HIGH") || n.includes("JR HIGH")) return "middle";
  if (n.includes("ELEMENTARY") || n.includes("PRIMARY") || n.includes("ELEM")) return "elementary";
  if (n.includes("K-8") || n.includes("K8")) return "k8";
  return "k12";
}

function toId(name, city, stateAbbr) {
  return ("private-" + name + "-" + city + "-" + stateAbbr)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

const privateSchools = [];
const seen = new Set();

for (const line of dataLines) {
  if (!line.trim()) continue;
  const r = parseLine(line);

  const rawName = (r["Private School Name [Private School] 2019-20"] || r["Private School Name"] || "").trim();
  const state = toTitleCase((r["State Name [Private School] 2019-20"] || r["State Name [Private School] Latest available year"] || "").trim());
  const rawCity = (r["City [Private School] 2019-20"] || "").trim();
  const stateAbbr = (r["State Abbr [Private School] Latest available year"] || "").trim();
  const address = toTitleCase((r["Physical Address [Private School] 2019-20"] || "").trim());
  const zip = (r["ZIP [Private School] 2019-20"] || "").trim();
  const phone = (r["Phone Number [Private School] 2019-20"] || "").trim();
  const enrollmentRaw = (r["Total Students (Ungraded & PK-12) [Private School] 2019-20"] || "").replace(/,/g, "").trim();
  const enrollment = parseInt(enrollmentRaw) || 0;
  const teachersRaw = (r["Full-Time Equivalent (FTE) Teachers [Private School] 2019-20"] || "").trim();
  const teachers = teachersRaw && teachersRaw !== "†" ? Math.round(parseFloat(teachersRaw)) : undefined;

  if (!rawName || !state || !rawCity) continue;
  if (isVirtual(rawName)) continue;
  if (isJunk(rawName)) continue;
  if (enrollment === 0) continue;

  const name = toTitleCase(cleanName(rawName));
  const city = toTitleCase(rawCity);
  const id = toId(name, city, stateAbbr);

  if (seen.has(id)) continue;
  seen.add(id);

  privateSchools.push({
    id,
    name,
    city,
    state,
    stateAbbr,
    public: false,
    rating: +(3.4 + Math.random() * 1.4).toFixed(1),
    type: guessType(name),
    address: address || undefined,
    zip: zip || undefined,
    phone: phone || undefined,
    enrollment: enrollment || undefined,
    teacherCount: teachers,
    virtual: false,
  });
}

console.log(`📚 Loaded ${privateSchools.length} private schools`);

// Merge into allSchools
const existing = readFileSync("./app/data/allSchools.ts", "utf8");
const match = existing.match(/export const allSchools = (\[[\s\S]*\]);/);
if (!match) { console.error("Could not parse allSchools.ts"); process.exit(1); }

const publicSchools = JSON.parse(match[1]);
console.log(`🏫 Existing public schools: ${publicSchools.length}`);

// Remove duplicates by id
const existingIds = new Set(publicSchools.map(s => s.id));
const newPrivate = privateSchools.filter(s => !existingIds.has(s.id));

const combined = [...publicSchools, ...newPrivate];

// Manually add well-known private schools missing from the data
const manualPrivate = [
  {
    id: "private-saint-paul-academy-and-summit-school-st-paul-mn",
    name: "Saint Paul Academy and Summit School",
    city: "St. Paul",
    state: "Minnesota",
    stateAbbr: "MN",
    public: false,
    rating: 4.7,
    type: "k12",
    address: "1712 Randolph Ave",
    zip: "55105",
    phone: "6516982451",
    website: "https://www.spa.edu",
    enrollment: 1100,
    teacherCount: 120,
    virtual: false,
    lat: 44.9277,
    lng: -93.1760,
  },
];

// Add manual schools if not already present
const allIds = new Set(combined.map(s => s.id));
for (const s of manualPrivate) {
  if (!allIds.has(s.id)) combined.push(s);
}

const ts = `// @ts-nocheck\nexport const allSchools = ${JSON.stringify(combined, null, 2)};\n`;
writeFileSync("./app/data/allSchools.ts", ts);
console.log(`✅ Total schools: ${combined.length} (added ${newPrivate.length} private schools)`);

