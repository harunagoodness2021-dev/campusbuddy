const BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'campusbuddy_token';

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable - the session just won't persist */
  }
};

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Is the API running?', 0);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) window.dispatchEvent(new Event('campusbuddy:unauthorized'));
    throw new ApiError(data.error || 'Something went wrong', res.status);
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body = {}) => request(path, { method: 'POST', body }),
  patch: (path, body = {}) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
};
