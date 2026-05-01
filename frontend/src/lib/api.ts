const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
export const AUTH_UNAUTHORIZED_EVENT = "auth:unauthorized";
let isRedirectingToLogin = false;

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length !== 2) return null;
  return decodeURIComponent(parts.pop()!.split(";").shift()!);
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const method = (init.method || "GET").toUpperCase();
  const headers = new Headers(init.headers || {});

  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const csrfToken = getCookie("csrf_access_token");
    if (csrfToken) {
      headers.set("X-CSRF-TOKEN", csrfToken);
    }
  }

  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
    if (window.location.pathname !== "/login" && !isRedirectingToLogin) {
      isRedirectingToLogin = true;
      window.location.assign("/login");
    }
  }

  return response;
}
