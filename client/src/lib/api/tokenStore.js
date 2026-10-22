// Access token lives only in memory (never localStorage). After a reload the
// session is restored through the HttpOnly refresh cookie.
let accessToken = null;
const listeners = new Set();

export const tokenStore = {
  get: () => accessToken,
  set(token) {
    accessToken = token || null;
  },
  clear() {
    accessToken = null;
  },
};

/** Subscribers are told when the session is irrecoverably lost (refresh failed). */
export function onSessionExpired(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifySessionExpired() {
  listeners.forEach((l) => l());
}
