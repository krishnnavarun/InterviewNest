import axios from 'axios';

export const API_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? 'http://localhost:5000/api' : 'https://interview-nest-server.vercel.app/api');

const TOKEN_KEY = 'interviewnest.token';

// "Remember me" keeps the session in localStorage; otherwise it lives in
// sessionStorage and ends when the browser tab is closed.
export const tokenStore = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token, remember = true) {
    try {
      this.clear();
      (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable (private mode) - session will not persist */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

export const api = axios.create({ baseURL: API_URL, timeout: 120000 });

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthCall = error.config?.url?.startsWith('/auth/');
    if (error.response?.status === 401 && !isAuthCall) {
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(error);
  }
);

/** Unwraps `{ success, data }` responses. */
export const unwrap = (promise) => promise.then((response) => response.data.data);

/** A user-friendly message for any API error. */
export function errorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.code === 'ERR_NETWORK') return "Can't reach the server. Check your connection and try again.";
  if (error?.code === 'ECONNABORTED') return 'The request took too long. Please try again.';
  return error?.message && !error.response ? error.message : fallback;
}
