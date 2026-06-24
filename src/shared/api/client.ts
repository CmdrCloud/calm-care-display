const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3011";

// Default family ID (Hayes Family seeded ID)
export const DEFAULT_FAMILY_ID = "11111111-1111-1111-1111-111111111111";

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

class ApiClient {
  private getTokens() {
    const accessToken = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    const refreshToken =
      typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;
    const familyId =
      typeof window !== "undefined"
        ? localStorage.getItem("familyId") || DEFAULT_FAMILY_ID
        : DEFAULT_FAMILY_ID;
    return { accessToken, refreshToken, familyId };
  }

  setTokens(accessToken: string, refreshToken: string, familyId?: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      if (familyId) {
        localStorage.setItem("familyId", familyId);
      }
    }
  }

  clearTokens() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
  }

  isAuthenticated(): boolean {
    const { accessToken } = this.getTokens();
    return !!accessToken;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { accessToken, familyId } = this.getTokens();

    const headers = new Headers(options.headers || {});
    if (options.method !== "GET" && options.method !== "DELETE" && options.body !== undefined && options.body !== null) {
      headers.set("Content-Type", "application/json");
    }
    headers.set("x-family-id", familyId);

    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }

    let url = `${BASE_URL}${path}`;
    if (options.params) {
      const searchParams = new URLSearchParams(options.params);
      url += `?${searchParams.toString()}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    let response = await fetch(url, config);

    // Handle token refresh on 401
    if (response.status === 401 && path !== "/auth/login" && path !== "/auth/refresh") {
      const refreshed = await this.refreshSession();
      if (refreshed) {
        // Retry request with new token
        const newTokens = this.getTokens();
        if (newTokens.accessToken) {
          headers.set("Authorization", `Bearer ${newTokens.accessToken}`);
        }
        response = await fetch(url, config);
      } else {
        // Logout user on refresh failure
        this.clearTokens();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        throw new Error("Session expired. Please log in again.");
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "An error occurred";
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return response.json() as Promise<T>;
  }

  private async refreshSession(): Promise<boolean> {
    const { refreshToken } = this.getTokens();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const data = (await response.json()) as { accessToken: string; refreshToken: string };
      this.setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  async get<T>(path: string, options?: Omit<RequestOptions, "method">): Promise<T> {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  async post<T>(
    path: string,
    body?: any,
    options?: Omit<RequestOptions, "method" | "body">,
  ): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(
    path: string,
    body?: any,
    options?: Omit<RequestOptions, "method" | "body">,
  ): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(path: string, options?: Omit<RequestOptions, "method">): Promise<T> {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }
}

export const api = new ApiClient();
