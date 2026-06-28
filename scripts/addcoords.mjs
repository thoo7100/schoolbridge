import { readFileSync, writeFileSync } from "fs";

const csv = readFileSync("./scripts/coords.csv", "utf8");
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

function toTitleCase(str) {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

// Build coords lookup by name + stateAbbr
const coordsMap = new Map();
for (const line of dataLines) {
  if (!line.trim()) continue;
  const r = parseLine(line);
  const name = toTitleCase((r["School Name [Public School] 2024-25"] || r["School Name"] || "").trim());
  const stateAbbr = (r["State Abbr [Public School] Latest available year"] || "").trim();
  const lat = parseFloat(r["Latitude [Public School] 2024-25"]);
  const lng = parseFloat(r["Longitude [Public School] 2024-25"]);
  const virtual = (r["Virtual School Status (SY 2016-17 onward) [Public School] 2024-25"] || "").trim();
  if (!name || isNaN(lat) || isNaN(lng)) continue;
  if (virtual === "ISVIRTUAL") continue;
  coordsMap.set(`${name}|${stateAbbr}`, { lat, lng });
}

console.log(`📍 Loaded ${coordsMap.size} coordinate entries`);

// Read allSchools
const existing = readFileSync("./app/data/allSchools.ts", "utf8");
const match = existing.match(/export const allSchools = (\[[\s\S]*\]);/);
if (!match) { console.error("Could not parse allSchools.ts"); process.exit(1); }

const schools = JSON.parse(match[1]);

let matched = 0;
for (const school of schools) {
  if (school.lat && school.lng) { matched++; continue; }
  const key = `${school.name}|${school.stateAbbr}`;
  const coords = coordsMap.get(key);
  if (coords) {
    school.lat = coords.lat;
    school.lng = coords.lng;
    matched++;
  }
}

console.log(`✅ ${matched}/${schools.length} schools now have coordinates`);

const ts = `// @ts-nocheck\nexport const allSchools = ${JSON.stringify(schools, null, 2)};\n`;
writeFileSync("./app/data/allSchools.ts", ts);
console.log("🎉 Done → app/data/allSchools.ts");