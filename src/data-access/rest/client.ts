import { apiBaseUrl } from "../../app/config/environment";
import { sessionTokenStore } from "./token-store";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly body?: unknown,
    readonly code?: string,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface RestClientOptions {
  baseUrl?: string;
  getAccessToken?: () => string | null;
}

/** Shared transport for all live adapters. It has no UI dependencies. */
export class RestClient {
  private readonly baseUrl: string;
  private readonly getAccessToken?: () => string | null;

  constructor(options: RestClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? apiBaseUrl).replace(/\/$/, "");
    this.getAccessToken = options.getAccessToken ?? sessionTokenStore.get;
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    if (!this.baseUrl) throw new ApiError("VITE_API_BASE_URL is not configured for the live API data source.");
    const token = this.getAccessToken?.();
    const headers = new Headers(init.headers);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, { ...init, headers });
    } catch {
      throw new ApiError("The live API could not be reached. Check VITE_API_BASE_URL and the backend service.");
    }
    const contentType = response.headers.get("content-type") ?? "";
    const body = response.status === 204
      ? undefined
      : contentType.includes("application/json")
        ? await response.json().catch(() => undefined)
        : await response.text().catch(() => undefined);
    if (!response.ok) {
      const message = typeof body === "object" && body && "message" in body && typeof body.message === "string"
        ? body.message
        : `API request failed (${response.status}).`;
      const code = typeof body === "object" && body && "code" in body && typeof body.code === "string" ? body.code : undefined;
      const requestId = response.headers.get("x-request-id") ?? undefined;
      throw new ApiError(message, response.status, body, code, requestId);
    }
    return body as T;
  }
}
