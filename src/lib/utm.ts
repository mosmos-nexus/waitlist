// First-touch attribution. Captured when the page first loads (the locale switch drops the query
// string, so the signup POST can't rely on the URL it is sent from) and kept for the tab's life.
// sessionStorage can throw or be absent, so every access is guarded — attribution is
// best-effort and must never get in the way of the page or the signup.

export interface Attribution {
  source?: string;
  medium?: string;
  campaign?: string;
  referrer?: string;
}

const KEY = 'mosmos:utm';

/** The previous page when it is another site, minus its query string. */
function externalReferrer(): string | undefined {
  try {
    const ref = new URL(document.referrer);
    return ref.origin === location.origin ? undefined : ref.origin + ref.pathname;
  } catch {
    return undefined; // empty or malformed referrer
  }
}

export function getUtm(): Attribution | undefined {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Attribution) : undefined;
  } catch {
    return undefined;
  }
}

/** Stores utm_source/medium/campaign and the referrer once; later calls keep the first touch. */
export function captureUtm(): void {
  if (getUtm()) return;
  const params = new URLSearchParams(location.search);
  const found: Attribution = {
    source: params.get('utm_source') || undefined,
    medium: params.get('utm_medium') || undefined,
    campaign: params.get('utm_campaign') || undefined,
    referrer: externalReferrer(),
  };
  // Nothing to record yet: leave the slot empty so a later tagged visit can still claim it.
  if (!Object.values(found).some(Boolean)) return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(found));
  } catch {
    // Storage blocked — the signup simply goes without attribution.
  }
}
