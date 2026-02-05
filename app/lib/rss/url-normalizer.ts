const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "ref",
]);

export function normalizeUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);

    const keysToDelete: string[] = [];
    for (const key of url.searchParams.keys()) {
      if (TRACKING_PARAMS.has(key) || key.startsWith("utm_")) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      url.searchParams.delete(key);
    }

    url.searchParams.sort();

    // Remove trailing slash (but not for root path "/")
    if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
      url.pathname = url.pathname.slice(0, -1);
    }

    return url.toString();
  } catch {
    return rawUrl;
  }
}
