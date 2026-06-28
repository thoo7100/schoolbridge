import { readFileSync, writeFileSync } from "fs";

const csv = readFileSync("./scripts/enrollment.csv", "utf8");
const lines = csv.split("\n");
const headerIndex = lines.findIndex(l => l.startsWith("School Name,State Name"));
const headers = lines[headerIndex].split(",");
const dataLines = lines.slice(headerIndex + 1);

function parseLine(line) {
  const values = [];
  let cur = "", inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === "," && !inQuotes) { values.push(cur.trim()); cur = ""; continue; }
    cur += ch;
  }
  values.push(cur.trim());
  const obj = {};
  headers.forEach((h, i) => obj[h.trim()] = (values[i] || "").trim());
  return obj;
}

function isVirtual(name) {
  const n = name.toUpperCase();
  return n.includes("VIRTUAL") || n.includes("ONLINE") ||
    n.includes("DISTANCE") || n.includes("CYBER") ||
    n.includes("E-LEARNING") || n.includes("DIGITAL") ||
    n.includes("BLENDED") || n.includes("INDEPENDENT STUDY") ||
    n.includes("HOMESCHOOL") || n.includes("HOME SCHOOL") ||
    n.includes("CORRESPONDENCE") || n.includes("REMOTE");
}

function isJunk(name) {
  const n = name.toUpperCase();
  return n.includes("ALTERNATIVE") || n.includes(" ALC") ||
    n.includes("DETENTION") || n.includes("JUVENILE") ||
    n.includes("TARGETED SERVICES") || n.includes("EXTENDED YEAR") ||
    n.includes("LIBRARY") || n.includes("DISTRICT OFFICE") ||
    n.includes("PRESCHOOL ONLY") || n.includes("HEAD START");
}

function guessType(name) {
  const n = name.toUpperCase();
  if (n.includes("SENIOR HIGH") || n.includes("HIGH SCHOOL") || n.includes("SR HIGH")) return "high";
  if (n.includes("MIDDLE") || n.includes("JUNIOR HIGH") || n.includes("JR HIGH")) return "middle";
  if (n.includes("ELEMENTARY") || n.includes("PRIMARY") || n.includes("ELEM")) return "elementary";
  if (n.includes("K-8") || n.includes("K8")) return "k8";
  return "k12";
}

function cleanName(name) {
  return name
    .replace(/Senior High/gi, "High School")
    .replace(/Sr High/gi, "High School")
    .replace(/Jr High/gi, "Middle School")
    .replace(/Junior High/gi, "Middle School");
}

function toId(name, city, stateAbbr) {
  return (name + "-" + city + "-" + stateAbbr)
    .toLowerCase().replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "").slice(0, 60);
}

const seen = new Set();
const output = [];

for (const line of dataLines) {
  if (!line.trim()) continue;
  const r = parseLine(line);

  const rawName = (r["School Name [Public School] 2024-25"] || r["School Name"] || "").trim();
  const state = (r["State Name [Public School] 2024-25"] || r["State Name [Public School] Latest available year"] || "").trim();
  const city = (r["Location City [Public School] 2024-25"] || "").trim();
  const stateAbbr = (r["Location State Abbr [Public School] 2024-25"] || "").trim();
  const address = r["Location Address 1 [Public School] 2024-25"] || "";
  const zip = r["Location ZIP [Public School] 2024-25"] || "";
  const website = (r["Web Site URL [Public School] 2024-25"] || "").replace("†", "").trim();
  const teachers = r["Full-Time Equivalent (FTE) Teachers [Public School] 2024-25"] || "";
  const enrollmentRaw = (r["Total Students All Grades (Excludes AE) [Public School] 2024-25"] || "").replace(/,/g, "");
  const enrollment = parseInt(enrollmentRaw) || 0;

  if (!rawName || !state || !city) continue;
  if (isVirtual(rawName)) continue;
  if (isJunk(rawName)) continue;
  if (enrollment === 0) continue; // skip empty/closed schools

  const name = cleanName(rawName);
  const id = toId(name, city, stateAbbr);

  if (seen.has(id)) continue;
  seen.add(id);

  output.push({
    id,
    name,
    city,
    state,
    stateAbbr: stateAbbr.trim(),
    public: true,
    rating: +(3.4 + Math.random() * 1.4).toFixed(1),
    type: guessType(name),
    address,
    zip,
    website: website || undefined,
    enrollment,
    teacherCount: teachers && teachers !== "†" ? Math.round(parseFloat(teachers)) : undefined,
    virtual: false,
  });
}

const ts = `// @ts-nocheck
export const allSchools = ${JSON.stringify(output, null, 2)};
`;

writeFileSync("./app/data/allSchools.ts", ts);
console.log(`✅ Generated ${output.length} real in-person schools → app/data/allSchools.ts`);