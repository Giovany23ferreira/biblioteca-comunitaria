// Endereço do backend (C# Minimal API)
export const API_URL = "http://localhost:5000/api";

async function request(path, options = {}) {
  const resp = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (resp.status === 204) return null;

  const data = await resp.json().catch(() => null);
  if (!resp.ok) {
    throw new Error(data?.erro || data?.title || `Erro ${resp.status}`);
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path, body) =>
    request(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  del: (path) => request(path, { method: "DELETE" }),
};

export const formatarData = (iso) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "—");

export const formatarMoeda = (v) =>
  Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
