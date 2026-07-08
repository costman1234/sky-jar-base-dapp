import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";

const root = resolve(new URL("..", import.meta.url).pathname);
const outDir = join(root, "base-submission");
const W = 1284;
const H = 2778;

const c = {
  bg: "#e7f6ff",
  paper: "#eefaff",
  card: "#fbfeff",
  ink: "#153348",
  line: "#266078",
  blue: "#40798c",
  sun: "#ffd166",
  cloud: "#a8dadc",
};

function esc(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function wrap(text, maxChars) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function frame(content) {
  return `
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="${c.bg}"/>
    <circle cx="1080" cy="210" r="230" fill="${c.sun}" opacity="0.55"/>
    <circle cx="150" cy="2520" r="250" fill="${c.cloud}" opacity="0.55"/>
    <path d="M0 520H1284M0 1040H1284M0 1560H1284M0 2080H1284" stroke="rgba(21,51,72,0.08)" stroke-width="3"/>
    ${content}
  </svg>`;
}

function titleBlock(title, subtitle) {
  return `
    <text x="72" y="126" font-family="Courier New, monospace" font-size="32" font-weight="900" fill="${c.blue}">SKY JAR</text>
    <text x="72" y="238" font-family="Arial, sans-serif" font-size="82" font-weight="900" fill="${c.ink}">${esc(title)}</text>
    <text x="78" y="300" font-family="Arial, sans-serif" font-size="32" font-weight="800" fill="${c.blue}">${esc(subtitle)}</text>
  `;
}

function cloud(x, y) {
  return `
    <circle cx="${x}" cy="${y + 40}" r="58" fill="${c.card}" stroke="${c.line}" stroke-width="6"/>
    <circle cx="${x + 70}" cy="${y}" r="72" fill="${c.card}" stroke="${c.line}" stroke-width="6"/>
    <circle cx="${x + 145}" cy="${y + 44}" r="54" fill="${c.card}" stroke="${c.line}" stroke-width="6"/>
    <rect x="${x - 10}" y="${y + 38}" width="210" height="70" rx="35" fill="${c.card}"/>
  `;
}

function skyCard(x, y, sky, feel, mood, note) {
  const noteLines = wrap(note, 34).slice(0, 5);
  return `
    <rect x="${x}" y="${y}" width="1060" height="1080" rx="32" fill="${c.paper}" stroke="${c.line}" stroke-width="5"/>
    <circle cx="${x + 890}" cy="${y + 140}" r="90" fill="${c.sun}" stroke="${c.line}" stroke-width="5"/>
    ${cloud(x + 735, y + 205)}
    <text x="${x + 54}" y="${y + 88}" font-family="Courier New, monospace" font-size="26" font-weight="900" fill="${c.blue}">WEATHER CARD</text>
    <text x="${x + 54}" y="${y + 215}" font-family="Arial, sans-serif" font-size="84" font-weight="900" fill="${c.ink}">${esc(sky)}</text>
    <rect x="${x + 54}" y="${y + 310}" width="420" height="150" rx="22" fill="${c.ink}"/>
    <text x="${x + 88}" y="${y + 368}" font-family="Courier New, monospace" font-size="24" font-weight="900" fill="${c.sun}">FEEL</text>
    <text x="${x + 88}" y="${y + 430}" font-family="Arial, sans-serif" font-size="50" font-weight="900" fill="${c.paper}">${esc(feel)}</text>
    <rect x="${x + 520}" y="${y + 310}" width="360" height="150" rx="22" fill="${c.sun}" stroke="${c.line}" stroke-width="4"/>
    <text x="${x + 554}" y="${y + 368}" font-family="Courier New, monospace" font-size="24" font-weight="900" fill="#8a5b00">MOOD</text>
    <text x="${x + 554}" y="${y + 430}" font-family="Arial, sans-serif" font-size="50" font-weight="900" fill="${c.ink}">${esc(mood)}</text>
    <rect x="${x + 54}" y="${y + 560}" width="952" height="300" rx="22" fill="${c.card}" stroke="${c.line}" stroke-width="4"/>
    <text x="${x + 88}" y="${y + 622}" font-family="Courier New, monospace" font-size="24" font-weight="900" fill="${c.blue}">SKY NOTE</text>
    ${noteLines.map((line, i) => `<text x="${x + 88}" y="${y + 682 + i * 44}" font-family="Arial, sans-serif" font-size="32" font-weight="800" fill="${c.ink}">${esc(line)}</text>`).join("")}
    <rect x="${x + 54}" y="${y + 930}" width="952" height="82" rx="22" fill="${c.ink}"/>
    <text x="${x + 88}" y="${y + 982}" font-family="Courier New, monospace" font-size="24" font-weight="900" fill="${c.sun}">OBSERVER + TIMESTAMP SAVED ON BASE</text>
  `;
}

function feature(x, y, title, body, accent) {
  return `
    <rect x="${x}" y="${y}" width="540" height="220" rx="24" fill="${c.paper}" stroke="${c.line}" stroke-width="5"/>
    <rect x="${x}" y="${y}" width="540" height="14" rx="7" fill="${accent}"/>
    <text x="${x + 34}" y="${y + 80}" font-family="Arial, sans-serif" font-size="38" font-weight="900" fill="${c.ink}">${esc(title)}</text>
    ${wrap(body, 30).slice(0, 3).map((line, i) => `<text x="${x + 34}" y="${y + 132 + i * 34}" font-family="Arial, sans-serif" font-size="27" font-weight="800" fill="${c.blue}">${esc(line)}</text>`).join("")}
  `;
}

function screenshot1() {
  return frame(`
    ${titleBlock("Save sky notes.", "Save weather, feel, mood, wallet, and timestamp on Base.")}
    ${skyCard(112, 430, "Blue break", "Cool wind", "Open", "Clouds split for ten minutes. The whole block looked rinsed clean and quiet.")}
    ${feature(72, 1630, "Weather feel", "A tiny record of how outside felt.", c.sun)}
    ${feature(672, 1630, "On Base", "Observer wallet and timestamp stay readable.", c.cloud)}
  `);
}

function screenshot2() {
  return frame(`
    ${titleBlock("Catch the weather.", "Make compact notes for sky changes, storms, and light.")}
    ${feature(72, 385, "Sky state", "Blue, clouds, rain, or gold hour.", c.cloud)}
    ${feature(672, 385, "Mood", "How the weather landed.", c.sun)}
    ${skyCard(112, 730, "Rain light", "Warm pavement", "Calm", "Rain stopped just before sunset. The street kept glowing like it remembered the storm.")}
  `);
}

function screenshot3() {
  return frame(`
    ${titleBlock("Reload any note.", "Use Note ID to reopen the card and verify the Base transaction.")}
    ${feature(72, 385, "Note ID", "Read saved sky notes by number.", c.sun)}
    ${feature(672, 385, "BaseScan", "Open the transaction after saving.", c.cloud)}
    ${skyCard(112, 730, "Gold hour", "Soft heat", "Bright", "Every window turned orange for a minute. It felt like the day was closing carefully.")}
  `);
}

function iconSvg() {
  return `
  <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <rect width="1024" height="1024" fill="${c.bg}"/>
    <rect x="132" y="132" width="760" height="760" rx="86" fill="${c.paper}" stroke="${c.line}" stroke-width="28"/>
    <circle cx="650" cy="330" r="120" fill="${c.sun}" stroke="${c.line}" stroke-width="24"/>
    ${cloud(285, 430)}
    <path d="M318 720H706" stroke="${c.blue}" stroke-width="38" stroke-linecap="round"/>
  </svg>`;
}

function thumbnailSvg() {
  return `
  <svg width="1910" height="1000" viewBox="0 0 1910 1000" xmlns="http://www.w3.org/2000/svg">
    <rect width="1910" height="1000" fill="${c.bg}"/>
    <circle cx="1720" cy="130" r="220" fill="${c.sun}" opacity="0.58"/>
    <text x="96" y="170" font-family="Arial, sans-serif" font-size="126" font-weight="900" fill="${c.ink}">Sky Jar</text>
    <text x="104" y="250" font-family="Arial, sans-serif" font-size="44" font-weight="800" fill="${c.blue}">Save sky notes on Base.</text>
    ${feature(106, 370, "Weather card", "Sky, feel, mood, note.", c.sun)}
    ${feature(106, 635, "Onchain record", "Wallet and timestamp saved.", c.cloud)}
    ${skyCard(760, 74, "Blue break", "Cool wind", "Open", "Clouds split for ten minutes. The whole block looked rinsed clean and quiet.")}
  </svg>`;
}

async function writePng(name, svg, width = W, height = H) {
  const file = join(outDir, name);
  await sharp(Buffer.from(svg)).resize(width, height).png({ compressionLevel: 9 }).toFile(file);
  return file;
}

async function writeJpg(name, svg, width, height) {
  const file = join(outDir, name);
  await sharp(Buffer.from(svg)).resize(width, height).jpeg({ quality: 88, mozjpeg: true }).toFile(file);
  return file;
}

await mkdir(outDir, { recursive: true });

const files = [
  await writeJpg("app-icon.jpg", iconSvg(), 1024, 1024),
  await writeJpg("app-thumbnail.jpg", thumbnailSvg(), 1910, 1000),
  await writePng("screenshot-1.png", screenshot1()),
  await writePng("screenshot-2.png", screenshot2()),
  await writePng("screenshot-3.png", screenshot3()),
];

await writeFile(join(outDir, "asset-manifest.json"), JSON.stringify({ generatedAt: new Date().toISOString(), files }, null, 2), "utf8");
await writeFile(
  join(outDir, "submission-copy.md"),
  [
    "# Sky Jar",
    "",
    "App Name: Sky Jar",
    "Tagline: Save sky notes",
    "Description: Save a sky note with weather, feel, mood, wallet, and timestamp on Base.",
    "",
    "Domain: https://sky-jar.vercel.app",
    "",
    "Assets:",
    "- app-icon.jpg",
    "- app-thumbnail.jpg",
    "- screenshot-1.png",
    "- screenshot-2.png",
    "- screenshot-3.png",
  ].join("\n"),
  "utf8",
);

for (const file of files) console.log(file);
