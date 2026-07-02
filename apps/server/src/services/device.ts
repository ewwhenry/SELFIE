export function getDeviceInfoFromHeaders(
  getHeader: (name: string) => string | undefined,
) {
  const ua = getHeader("User-Agent") ?? "Unknown";
  const ip =
    getHeader("X-Forwarded-For")?.split(",")[0]?.trim() ||
    getHeader("CF-Connecting-IP") ||
    getHeader("X-Real-IP") ||
    "unknown";

  return {
    deviceName: parseDeviceName(ua),
    deviceType: parseDeviceType(ua),
    ipAddress: ip,
  };
}

function parseDeviceName(ua: string): string {
  const browserMatch = ua.match(
    /(Chrome|Firefox|Safari|Edge|Opera|Brave)\/?\s*(\d+)/i,
  );
  const osMatch = ua.match(/\(([^)]+)\)/);

  const browser = browserMatch
    ? `${browserMatch[1]} ${browserMatch[2]}`
    : "Unknown browser";
  const os = osMatch
    ? osMatch[1].split(";")[0]?.trim() || "Unknown OS"
    : "Unknown OS";

  return `${browser} on ${os}`;
}

function parseDeviceType(ua: string): string {
  const lower = ua.toLowerCase();
  if (/tablet|ipad/i.test(lower)) return "tablet";
  if (/mobile|iphone|android.*mobile/i.test(lower)) return "mobile";
  if (/bot|crawler|spider/i.test(lower)) return "bot";
  return "desktop";
}
