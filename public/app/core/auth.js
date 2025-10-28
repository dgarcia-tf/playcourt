import {
  STORAGE_KEY,
  REMEMBER_CREDENTIALS_KEY,
} from '../config/constants.js';

export function createAuthModule(deps = {}) {
  const { state } = deps;

  if (!state || typeof state !== 'object') {
    throw new Error('Missing application state for auth module.');
  }

  function entityHasRole(entity, role) {
    if (!entity || !role) return false;
    const roles = Array.isArray(entity.roles)
      ? entity.roles
      : typeof entity.role === 'string'
      ? [entity.role]
      : [];
    return roles.includes(role);
  }

  function isAdmin() {
    return entityHasRole(state.user, 'admin');
  }

  function isCourtManager() {
    return entityHasRole(state.user, 'court_manager');
  }

  function hasCourtManagementAccess() {
    return isAdmin() || isCourtManager();
  }

  function persistSession() {
    if (state.token && state.user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: state.token, user: state.user }));
    }
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function restoreSession() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const stored = JSON.parse(raw);
      if (stored?.token && stored?.user) {
        state.token = stored.token;
        state.user = stored.user;
      }
    } catch (error) {
      console.warn('No fue posible restaurar la sesión previa', error);
    }
  }

  function clearRememberedCredentials() {
    localStorage.removeItem(REMEMBER_CREDENTIALS_KEY);
  }

  function persistRememberedCredentials(email, password, remember) {
    if (!remember) {
      clearRememberedCredentials();
      return;
    }

    const payload = {
      email: typeof email === 'string' ? email : '',
      password: typeof password === 'string' ? password : '',
    };

    localStorage.setItem(REMEMBER_CREDENTIALS_KEY, JSON.stringify(payload));
  }

  function getRememberedCredentials() {
    const storedRaw = localStorage.getItem(REMEMBER_CREDENTIALS_KEY);
    if (!storedRaw) {
      return null;
    }

    try {
      const stored = JSON.parse(storedRaw);
      const email = typeof stored?.email === 'string' ? stored.email : '';
      const password = typeof stored?.password === 'string' ? stored.password : '';
      if (!email && !password) {
        return null;
      }
      return { email, password };
    } catch (error) {
      clearRememberedCredentials();
      return null;
    }
  }

  return {
    entityHasRole,
    isAdmin,
    isCourtManager,
    hasCourtManagementAccess,
    persistSession,
    clearSession,
    restoreSession,
    persistRememberedCredentials,
    clearRememberedCredentials,
    getRememberedCredentials,
  };
}
