let accessToken: string | null = null;

/**
 * In-memory token storage for REST adapters. A backend may replace this with an HttpOnly
 * cookie session without changing features or repository interfaces.
 */
export const sessionTokenStore = {
  get() {
    return accessToken;
  },
  set(token: string) {
    accessToken = token;
  },
  clear() {
    accessToken = null;
  },
};
