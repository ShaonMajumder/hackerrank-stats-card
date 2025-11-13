import express from "express";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0 Safari/537.36";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
};

const app = express();

app.use((_, res, next) => {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  next();
});

app.options("*", (_, res) => {
  res.status(204).end();
});

app.get("/api/hackerrank-card", async (req, res) => {
  const username = typeof req.query.username === "string" ? req.query.username.trim() : "";
  const solvedParam = typeof req.query.solved === "string" ? req.query.solved.trim() : "";

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  let solved = null;
  if (solvedParam) {
    const parsed = Number.parseInt(solvedParam, 10);
    if (Number.isNaN(parsed) || parsed < 0) {
      return res.status(400).json({ error: "Solved must be a positive integer" });
    }
    solved = parsed;
  }

  try {
    console.log(`Fetching HackerRank stats for ${username}`);
    const profile = await fetchProfile(username);
    const [badges, certificates] = await Promise.all([
      fetchBadges(username),
      fetchCertificates(username),
    ]);
    const svg = generateSVG(profile, badges, certificates, solved);

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.status(200).send(svg);
  } catch (error) {
    console.error("hackerrank-card error:", error);
    const status = typeof error.status === "number" ? error.status : 500;
    const message = status === 404 ? "Profile not found" : "Internal server error";
    return res.status(status).json({ error: message });
  }
});

app.get("/", (_, res) => {
  res.json({
    ok: true,
    message: "HackerRank stats card API is running",
    endpoint: "/api/hackerrank-card?username=<handle>&solved=<optional number>",
  });
});

// ---------- helpers ----------

async function fetchProfile(username) {
  const response = await fetch(
    `https://www.hackerrank.com/rest/contests/master/hackers/${encodeURIComponent(
      username,
    )}/profile`,
    { headers: { "User-Agent": USER_AGENT } },
  );

  if (!response.ok) {
    const error = new Error(`Failed to fetch profile (${response.status})`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

async function fetchBadges(username) {
  try {
    const response = await fetch(
      `https://www.hackerrank.com/rest/hackers/${encodeURIComponent(username)}/badges`,
      { headers: { "User-Agent": USER_AGENT } },
    );
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return Array.isArray(data.models) ? data.models : [];
  } catch (error) {
    console.warn("Badge fetch failed:", error);
    return [];
  }
}

async function fetchCertificates(username) {
  try {
    const response = await fetch(
      `https://www.hackerrank.com/community/v1/test_results/hacker_certificate?username=${encodeURIComponent(
        username,
      )}`,
      { headers: { "User-Agent": USER_AGENT } },
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const all = Array.isArray(data.data) ? data.data : [];

    // Only keep test_passed
    return all.filter((entry) => entry.attributes?.status === "test_passed");
  } catch (error) {
    console.warn("Certificate fetch failed:", error);
    return [];
  }
}

// Map stars → tier (gold / silver / bronze)
function getBadgeTier(stars) {
  const s = typeof stars === "number" ? stars : 0;
  if (s >= 5) return "gold";
  if (s >= 3) return "silver";
  if (s >= 1) return "bronze";
  return null;
}

function generateSVG(profileData, badges, certificates, solved) {
  const model = profileData?.model ?? { username: "Unknown", country: "Unknown", level: 0 };
  const username = model.username ?? "Unknown";
  const country = model.country ?? "Unknown";
  const level = Number.isFinite(model.level) ? model.level : 0;

  const normalizedBadges = Array.isArray(badges) ? badges : [];
  const normalizedCerts = Array.isArray(certificates) ? certificates : [];

  const goldBadges = normalizedBadges.filter((b) => getBadgeTier(b.stars) === "gold");
  const silverBadges = normalizedBadges.filter((b) => getBadgeTier(b.stars) === "silver");
  const bronzeBadges = normalizedBadges.filter((b) => getBadgeTier(b.stars) === "bronze");

  const totalBadges = normalizedBadges.length;
  const totalCertificates = normalizedCerts.length;

  // Sort badges by stars desc and show top 5
  const topBadges = [...normalizedBadges]
    .sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0))
    .slice(0, 5);

  const topCerts = normalizedCerts; // all passed certs

  const baseHeight = 280;
  const badgeListHeight =
    topBadges.length > 0 ? Math.ceil(topBadges.length / 2) * 20 + 10 : 0;
  const certListHeight =
    topCerts.length > 0 ? Math.ceil(topCerts.length / 2) * 20 + 10 : 0;
  const totalHeight = baseHeight + Math.max(badgeListHeight, certListHeight);

  return `
    <svg width="550" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0d1117;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1a1f2e;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="green-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#00EA64;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#00FF70;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="card-bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#161b22;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#0d1117;stop-opacity:1" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <rect width="550" height="${totalHeight}" rx="12" fill="url(#grad)" />
      <rect x="2" y="2" width="546" height="${totalHeight - 4}" rx="10" fill="url(#card-bg)" stroke="#30363d" stroke-width="1"/>
      <rect width="550" height="5" fill="url(#green-grad)" filter="url(#glow)" />
      
      <g transform="translate(25, 35)">
        <text x="0" y="0" font-family="'SF Mono', 'Monaco', 'Courier New', monospace" font-size="28" font-weight="700" fill="#FFFFFF">
          ${escapeXml(username)}
        </text>
        <text x="0" y="25" font-family="'Segoe UI', -apple-system, sans-serif" font-size="13" fill="#8b949e">
          ${escapeXml(country || "Unknown")} | Level ${level}
        </text>
      </g>
      
      <g transform="translate(25, 90)">
        ${
          solved !== null
            ? `
        <g>
          <rect x="0" y="0" width="120" height="85" rx="8" fill="#161b22" stroke="#30363d" stroke-width="1"/>
          <text x="60" y="25" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="600" fill="#8b949e" text-anchor="middle">
            SOLVED
          </text>
          <text x="60" y="55" font-family="'SF Mono', monospace" font-size="26" font-weight="700" fill="#00EA64" text-anchor="middle">
            ${solved}
          </text>
          <text x="60" y="73" font-family="'Segoe UI', sans-serif" font-size="10" fill="#8b949e" text-anchor="middle">
            Problems
          </text>
        </g>
        `
            : ""
        }
        
        <g transform="translate(${solved !== null ? 135 : 0}, 0)">
          <rect x="0" y="0" width="120" height="85" rx="8" fill="#161b22" stroke="#30363d" stroke-width="1"/>
          <text x="60" y="25" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="600" fill="#8b949e" text-anchor="middle">
            BADGES
          </text>
          <text x="60" y="55" font-family="'SF Mono', monospace" font-size="26" font-weight="700" fill="#00EA64" text-anchor="middle">
            ${totalBadges}
          </text>
          <g transform="translate(20, 62)">
            ${goldBadges.length > 0 ? `<circle cx="20" cy="0" r="5" fill="#FFD700"/><text x="30" y="4" font-size="9" fill="#8b949e">${goldBadges.length}</text>` : ""}
            ${silverBadges.length > 0 ? `<circle cx="45" cy="0" r="5" fill="#C0C0C0"/><text x="55" y="4" font-size="9" fill="#8b949e">${silverBadges.length}</text>` : ""}
            ${bronzeBadges.length > 0 ? `<circle cx="70" cy="0" r="5" fill="#CD7F32"/><text x="80" y="4" font-size="9" fill="#8b949e">${bronzeBadges.length}</text>` : ""}
          </g>
        </g>
        
        <g transform="translate(${solved !== null ? 270 : 135}, 0)">
          <rect x="0" y="0" width="120" height="85" rx="8" fill="#161b22" stroke="#30363d" stroke-width="1"/>
          <text x="60" y="25" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="600" fill="#8b949e" text-anchor="middle">
            CERTIFICATES
          </text>
          <text x="60" y="55" font-family="'SF Mono', monospace" font-size="26" font-weight="700" fill="#00EA64" text-anchor="middle">
            ${totalCertificates}
          </text>
          <text x="60" y="73" font-family="'Segoe UI', sans-serif" font-size="10" fill="#8b949e" text-anchor="middle">
            Verified
          </text>
        </g>
      </g>
      
      ${
        topBadges.length > 0
          ? `
      <g transform="translate(25, 195)">
        <text x="0" y="0" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="600" fill="#8b949e">
          TOP BADGES
        </text>
        ${topBadges
          .map((badge, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);

            const rawBadgeName =
              (typeof badge?.badge_name === "string" && badge.badge_name.trim().length > 0
                ? badge.badge_name
                : typeof badge?.badge_type === "string" && badge.badge_type.trim().length > 0
                ? badge.badge_type
                : "Badge");

            const starsSuffix =
              typeof badge?.stars === "number" && badge.stars > 0
                ? ` (${badge.stars}★)`
                : "";

            const fullName = `${rawBadgeName}${starsSuffix}`;
            const badgeName =
              fullName.length > 28 ? fullName.substring(0, 28) + "..." : fullName;

            const tier = getBadgeTier(badge.stars);
            const color =
              tier === "gold"
                ? "#FFD700"
                : tier === "silver"
                ? "#C0C0C0"
                : tier === "bronze"
                ? "#CD7F32"
                : "#8b949e";

            return `
          <g transform="translate(${col * 250}, ${row * 20 + 15})">
            <circle cx="5" cy="-3" r="4" fill="${color}"/>
            <text x="15" y="0" font-family="'Segoe UI', sans-serif" font-size="10" fill="#c9d1d9">
              ${escapeXml(badgeName)}
            </text>
          </g>
          `;
          })
          .join("")}
      </g>
      `
          : ""
      }
      
      ${
        topCerts.length > 0
          ? `
      <g transform="translate(25, ${215 + badgeListHeight})">
        <text x="0" y="0" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="600" fill="#8b949e">
          CERTIFICATES
        </text>
        ${topCerts
          .map((cert, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);

            const attr = cert.attributes || {};
            const meta = attr.certificate || {};

            const rawName =
              (Array.isArray(attr.certificates) && attr.certificates[0]) ||
              (meta.label && meta.level ? `${meta.label} (${meta.level})` : "") ||
              meta.label ||
              "Certificate";

            const certName =
              rawName.length > 28 ? rawName.substring(0, 28) + "..." : rawName;

            // clickable link = certificate_image
            const imageUrl =
              typeof attr.certificate_image === "string" && attr.certificate_image.trim().length > 0
                ? attr.certificate_image.trim()
                : null;

            const detailUrl = imageUrl; // per your requirement: only certificate_image
            const safeCertName = escapeXml(certName);
            const safeDetailUrl = detailUrl ? escapeXml(detailUrl) : "";

            return `
            <g transform="translate(${col * 250}, ${row * 20 + 15})">
              ${
                safeDetailUrl
                  ? `
              <a xlink:href="${safeDetailUrl}" target="_blank">
                <text x="0" y="0" font-family="'Segoe UI', sans-serif" font-size="10" fill="#58a6ff">
                  ${safeCertName} ↗
                </text>
              </a>
              `
                  : `
              <text x="0" y="0" font-family="'Segoe UI', sans-serif" font-size="10" fill="#c9d1d9">
                ${safeCertName}
              </text>
              `
              }
            </g>
          `;
          })
          .join("")}
      </g>
      `
          : ""
      }
      
      <g transform="translate(0, ${totalHeight - 20})">
        <text x="525" y="0" font-family="'Segoe UI', sans-serif" font-size="10" fill="#00EA64" text-anchor="end" opacity="0.7">
          HackerRank Stats Card
        </text>
      </g>
    </svg>
  `;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export default app;
