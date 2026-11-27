const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export function getSessionId() {
  let id = localStorage.getItem('smog_saathi_session_id');
  if (!id) {
    id = `sess_${Math.random().toString(36).slice(2, 12)}_${Date.now().toString(36)}`;
    localStorage.setItem('smog_saathi_session_id', id);
  }
  return id;
}

export function getAuthToken() {
  return localStorage.getItem('smog_saathi_token') || '';
}

export async function apiFetch(path, { method = 'GET', body, signal } = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'x-session-id': getSessionId(),
  };
  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = payload?.error?.message || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.details = payload?.error?.details;
    throw err;
  }
  return payload;
}
