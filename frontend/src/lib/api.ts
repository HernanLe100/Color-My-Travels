const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function getCookie(name: string): string | null {
  console.log(document.cookie);
  const cookies :string[]= document.cookie.split(";");

  const cookies_dict: Record<string, string> = Object.fromEntries(
    cookies.map(item => {
      const [key, value] = item.split("=");
      return [key.trim(), value];
    })
  );

  console.log(cookies_dict);

  if (name in cookies_dict){
    console.log(cookies_dict[name]);
  }

  return cookies_dict[name];
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const method = (init.method || "GET").toUpperCase();
  const headers = new Headers(init.headers || {});

  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const csrfToken = getCookie("csrf_access_token");
    console.log(csrfToken);
    if (csrfToken) {
      headers.set("X-CSRF-TOKEN", csrfToken);
    }
  }

  console.log(`${BACKEND_URL}${path}`);

  return fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
}
