import { API_BASE } from '../config/constants.js';

export function createApiClient(deps = {}) {
  const { state, apiBase = API_BASE, onUnauthorized } = deps;

  if (!state || typeof state !== 'object') {
    throw new Error('Missing application state for API client.');
  }

  async function request(path, { method = 'GET', body, requireAuth = true } = {}) {
    const headers = {
      Accept: 'application/json',
    };

    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

    if (body && !isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    if (requireAuth) {
      if (!state.token) {
        throw new Error('Debes iniciar sesión para realizar esta acción.');
      }
      headers.Authorization = `Bearer ${state.token}`;
    }

    let response;
    try {
      response = await fetch(`${apiBase}${path}`, {
        method,
        headers,
        body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
      });
    } catch (error) {
      throw new Error('No fue posible conectar con el servidor.');
    }

    const contentType = response.headers.get('content-type') || '';
    let data = null;
    if (contentType.includes('application/json')) {
      data = await response.json();
    }

    if (!response.ok) {
      const message = data?.message || data?.errors?.[0]?.msg || response.statusText;
      if (response.status === 401 && typeof onUnauthorized === 'function') {
        onUnauthorized();
      }
      throw new Error(message);
    }

    return data;
  }

  return { request };
}
