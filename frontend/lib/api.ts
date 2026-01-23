export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface LoginResponse {
  id: number;
  username: string;
  role: string;
  access_token: string;
  token_type: string;
  message: string;
}

export function storeToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("lh_access_token", token);
  }
}

export function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("lh_access_token");
  }
  return null;
}

export function removeToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("lh_access_token");
  }
}

export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail?.detail || "Échec de l'authentification");
  }

  return response.json();
}
