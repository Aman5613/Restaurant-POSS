import { useAuthStore } from '../stores/auth-store';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function request(endpoint, options = {}) {
  const authState = useAuthStore.getState();
  const token = authState.accessToken;
  const user = authState.user;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'x-outlet-id': user?.outletId || 'default-outlet',
    ...(options.headers || {}),
  };

  let url = `${API_BASE}${endpoint}`;
  if (options.params && Object.keys(options.params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, val);
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      url += (url.includes('?') ? '&' : '?') + qs;
    }
  }

  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || `HTTP error! status: ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return { data, status: response.status, headers: response.headers };
}

export const apiClient = {
  get: (url, config = {}) => request(url, { ...config, method: 'GET' }),
  post: (url, body, config = {}) => request(url, { ...config, method: 'POST', body }),
  put: (url, body, config = {}) => request(url, { ...config, method: 'PUT', body }),
  patch: (url, body, config = {}) => request(url, { ...config, method: 'PATCH', body }),
  delete: (url, config = {}) => request(url, { ...config, method: 'DELETE' }),
};

export default apiClient;
