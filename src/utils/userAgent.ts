/**
 * Tiny, dependency-free user-agent parser.
 *
 * Enough to bucket a visitor into browser + OS + device type for the analytics
 * dashboard. Deliberately conservative: unknown agents fall back to "Unknown"
 * rather than a wrong guess, and obvious crawlers are flagged so they can be
 * excluded from the counts.
 */
export interface ParsedAgent {
  browser: string;
  browserVersion: string;
  os: string;
  device: "desktop" | "mobile" | "tablet";
  isBot: boolean;
}

const BOT_PATTERN =
  /bot|crawler|spider|slurp|facebookexternalhit|whatsapp|telegram|twitterbot|linkedinbot|embed|preview|http|curl|wget|python|scrapy|headless|lighthouse|pingdom|uptime/i;

function firstMatch(ua: string, pairs: Array<[RegExp, string]>): string {
  for (const [pattern, name] of pairs) {
    const match = ua.match(pattern);
    if (match) return name;
  }
  return "Unknown";
}

/** Grabs the version number that follows a given browser token. */
function versionAfter(ua: string, token: string): string {
  const match = ua.match(new RegExp(`${token}\\s*/\\s*(\\d+(?:\\.\\d+){0,2})`, "i"));
  return match?.[1] ?? "";
}

export function parseUserAgent(raw: string): ParsedAgent {
  const ua = raw ?? "";
  const isBot = !ua || BOT_PATTERN.test(ua);

  // Order matters: Edge and many Chromium shells also contain "Chrome"/"Safari".
  let browser = "Unknown";
  let browserVersion = "";
  if (/Edg(?:e|A|iOS)?\//i.test(ua)) {
    browser = "Edge";
    browserVersion = versionAfter(ua, "Edg(?:e|A|iOS)?");
  } else if (/OPR\/|Opera/i.test(ua)) {
    browser = "Opera";
    browserVersion = versionAfter(ua, "OPR");
  } else if (/SamsungBrowser\//i.test(ua)) {
    browser = "Samsung Internet";
    browserVersion = versionAfter(ua, "SamsungBrowser");
  } else if (/Firefox\//i.test(ua)) {
    browser = "Firefox";
    browserVersion = versionAfter(ua, "Firefox");
  } else if (/Chrome\//i.test(ua)) {
    browser = "Chrome";
    browserVersion = versionAfter(ua, "Chrome");
  } else if (/Safari\//i.test(ua)) {
    browser = "Safari";
    browserVersion = versionAfter(ua, "Version");
  }

  const os = firstMatch(ua, [
    [/Windows NT 10/i, "Windows"],
    [/Windows/i, "Windows"],
    [/iPhone|iPad|iPod/i, "iOS"],
    [/Mac OS X/i, "macOS"],
    [/Android/i, "Android"],
    [/Linux/i, "Linux"],
    [/Chrome OS|CrOS/i, "ChromeOS"],
  ]);

  let device: ParsedAgent["device"] = "desktop";
  if (/iPad|Tablet|PlayBook|Silk|(; wv)/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) {
    device = "tablet";
  } else if (/Mobi|Android|iPhone|iPod|Windows Phone|BlackBerry/i.test(ua)) {
    device = "mobile";
  }

  return { browser, browserVersion, os, device, isBot };
}
