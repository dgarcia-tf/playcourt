export function createPushModule(deps = {}) {
  const {
    state,
    request,
    showGlobalMessage,
    accountPushStatus,
    pushSettingsCard,
    pushStatusText,
    pushEnableButton,
    pushDisableButton,
    pushPermissionWarning,
    pushUnsupportedWarning,
  } = deps;

  if (!state || typeof state !== 'object') {
    throw new Error('Missing application state for push module.');
  }
  if (typeof request !== 'function') {
    throw new Error('Missing request helper for push module.');
  }
  if (typeof showGlobalMessage !== 'function') {
    throw new Error('Missing showGlobalMessage helper for push module.');
  }

  let pushServiceWorkerRegistration = null;
  let pushServiceWorkerRegistrationPromise = null;

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    let decoder = null;
    if (typeof window !== 'undefined' && typeof window.atob === 'function') {
      decoder = window.atob.bind(window);
    } else if (typeof globalThis !== 'undefined' && typeof globalThis.atob === 'function') {
      decoder = globalThis.atob.bind(globalThis);
    } else {
      throw new Error('Base64 decoding is not supported in this environment.');
    }
    const rawData = decoder(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i += 1) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  function getPushStatusLabel() {
    if (!state.user) {
      return 'Disponible tras iniciar sesión';
    }

    if (!state.push.supported) {
      return 'No compatible';
    }

    if (!state.push.serverEnabled) {
      return 'No disponible';
    }

    if (state.push.permission === 'denied') {
      return 'Bloqueadas en el navegador';
    }

    return state.push.enabled ? 'Activadas' : 'Pendiente de activar';
  }

  function updatePushSettingsUI() {
    if (accountPushStatus) {
      accountPushStatus.textContent = getPushStatusLabel();
    }

    if (!pushSettingsCard) {
      return;
    }

    const supported = state.push.supported;
    const loggedIn = Boolean(state.token);
    const permission = supported && typeof Notification !== 'undefined' ? Notification.permission : 'default';
    state.push.permission = permission;
    const serverEnabled = state.push.serverEnabled && Boolean(state.push.publicKey);
    const loading = state.push.loading;

    let statusMessage = '';
    if (!supported) {
      statusMessage = 'Tu navegador no es compatible con las notificaciones push.';
    } else if (!loggedIn) {
      statusMessage = 'Inicia sesión para configurar las notificaciones push en este dispositivo.';
    } else if (!state.push.configLoaded) {
      statusMessage = 'Verificando la disponibilidad de las notificaciones push...';
    } else if (!serverEnabled) {
      statusMessage = 'Las notificaciones push todavía no están habilitadas en el servidor.';
    } else if (permission === 'denied') {
      statusMessage = 'Has bloqueado las notificaciones push desde el navegador.';
    } else if (state.push.enabled) {
      statusMessage = 'Recibirás avisos inmediatos del club en este dispositivo.';
    } else {
      statusMessage = 'Activa las notificaciones push para recibir avisos en tiempo real del club.';
    }

    if (pushStatusText) {
      pushStatusText.textContent = statusMessage;
    }

    const canEnable =
      supported &&
      loggedIn &&
      serverEnabled &&
      permission !== 'denied' &&
      Boolean(state.push.publicKey);

    if (pushEnableButton) {
      pushEnableButton.hidden = !canEnable || state.push.enabled;
      pushEnableButton.disabled = loading || !canEnable;
    }

    if (pushDisableButton) {
      pushDisableButton.hidden = !state.push.enabled;
      pushDisableButton.disabled = loading;
    }

    if (pushPermissionWarning) {
      pushPermissionWarning.hidden = permission !== 'denied';
    }

    if (pushUnsupportedWarning) {
      pushUnsupportedWarning.hidden = supported;
    }
  }

  function ensurePushServiceWorker() {
    if (!state.push.supported || typeof navigator === 'undefined' || !navigator.serviceWorker) {
      return Promise.resolve(null);
    }

    if (!pushServiceWorkerRegistrationPromise) {
      pushServiceWorkerRegistrationPromise = navigator.serviceWorker
        .register('/app/service-worker.js')
        .then(() => navigator.serviceWorker.ready)
        .then((registration) => {
          pushServiceWorkerRegistration = registration;
          return registration;
        })
        .catch((error) => {
          console.warn('No se pudo registrar el service worker de notificaciones push', error);
          pushServiceWorkerRegistrationPromise = null;
          pushServiceWorkerRegistration = null;
          return null;
        });
    }

    return pushServiceWorkerRegistrationPromise;
  }

  async function getPushRegistration() {
    if (!state.push.supported) {
      return null;
    }

    if (pushServiceWorkerRegistration) {
      return pushServiceWorkerRegistration;
    }

    const registration = await ensurePushServiceWorker();
    pushServiceWorkerRegistration = registration;
    return registration;
  }

  async function fetchPushConfig() {
    if (!state.token || !state.push.supported) {
      state.push.configLoaded = true;
      state.push.serverEnabled = false;
      state.push.publicKey = null;
      updatePushSettingsUI();
      return null;
    }

    try {
      const config = await request('/push/config');
      state.push.publicKey = config?.publicKey || null;
      state.push.serverEnabled = Boolean(config?.enabled && config?.publicKey);
      state.push.configLoaded = true;
      return config;
    } catch (error) {
      state.push.publicKey = null;
      state.push.serverEnabled = false;
      state.push.configLoaded = true;
      throw error;
    } finally {
      updatePushSettingsUI();
    }
  }

  function serializePushSubscription(subscription) {
    if (!subscription) {
      return null;
    }

    const json = subscription.toJSON();
    return {
      endpoint: subscription.endpoint,
      expirationTime: subscription.expirationTime,
      keys: json?.keys || {},
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };
  }

  async function syncPushSubscriptionState() {
    if (!state.token || !state.push.supported) {
      state.push.enabled = false;
      state.push.subscriptionEndpoint = null;
      updatePushSettingsUI();
      return;
    }

    state.push.loading = true;
    updatePushSettingsUI();

    try {
      if (!state.push.configLoaded) {
        try {
          await fetchPushConfig();
        } catch (error) {
          console.warn('No se pudo obtener la configuración de notificaciones push', error);
        }
      }

      if (!state.push.serverEnabled || !state.push.publicKey) {
        state.push.enabled = false;
        return;
      }

      const registration = await getPushRegistration();
      if (!registration) {
        state.push.enabled = false;
        return;
      }

      const existing = await registration.pushManager.getSubscription();
      state.push.subscriptionEndpoint = existing?.endpoint || null;
      state.push.permission = typeof Notification !== 'undefined' ? Notification.permission : 'default';

      if (existing && state.push.permission === 'granted') {
        const payload = serializePushSubscription(existing);
        if (payload) {
          try {
            await request('/push/subscriptions', { method: 'POST', body: payload });
            state.push.enabled = true;
          } catch (error) {
            console.warn('No se pudo sincronizar la suscripción push', error);
          }
        }
      } else {
        state.push.enabled = false;
      }
    } catch (error) {
      console.warn('Error al sincronizar las notificaciones push', error);
    } finally {
      state.push.loading = false;
      updatePushSettingsUI();
    }
  }

  async function enablePushNotifications() {
    if (!state.push.supported || !state.token) {
      showGlobalMessage('Las notificaciones push no están disponibles en este dispositivo.', 'error');
      return;
    }

    state.push.loading = true;
    updatePushSettingsUI();

    try {
      if (!state.push.configLoaded || !state.push.publicKey) {
        await fetchPushConfig();
      }

      if (!state.push.serverEnabled || !state.push.publicKey) {
        showGlobalMessage('Las notificaciones push aún no están habilitadas en el servidor.', 'error');
        return;
      }

      const permission = await Notification.requestPermission();
      state.push.permission = permission;
      if (permission !== 'granted') {
        showGlobalMessage('Debes permitir las notificaciones para activarlas.', 'error');
        return;
      }

      const registration = await getPushRegistration();
      if (!registration) {
        showGlobalMessage('No se pudo preparar el servicio de notificaciones.', 'error');
        return;
      }

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        const applicationServerKey = urlBase64ToUint8Array(state.push.publicKey);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
      }

      const payload = serializePushSubscription(subscription);
      if (!payload) {
        showGlobalMessage('No se pudo registrar la suscripción push.', 'error');
        return;
      }

      await request('/push/subscriptions', { method: 'POST', body: payload });
      state.push.enabled = true;
      state.push.subscriptionEndpoint = subscription.endpoint;
      showGlobalMessage('Notificaciones push activadas correctamente.');
    } catch (error) {
      console.warn('No se pudo activar las notificaciones push', error);
      const message = error?.message || 'No se pudo activar las notificaciones push.';
      showGlobalMessage(message, 'error');
    } finally {
      state.push.loading = false;
      state.push.permission = state.push.supported && typeof Notification !== 'undefined' ? Notification.permission : 'default';
      updatePushSettingsUI();
    }
  }

  async function disablePushNotifications() {
    if (!state.push.supported) {
      return;
    }

    state.push.loading = true;
    updatePushSettingsUI();

    try {
      const registration = await getPushRegistration();
      if (!registration) {
        state.push.enabled = false;
        return;
      }

      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        try {
          await request('/push/subscriptions', {
            method: 'DELETE',
            body: { endpoint: subscription.endpoint },
          });
        } catch (error) {
          console.warn('No se pudo eliminar la suscripción push del servidor', error);
        }
        await subscription.unsubscribe().catch(() => null);
      }

      state.push.enabled = false;
      state.push.subscriptionEndpoint = null;
      showGlobalMessage('Notificaciones push desactivadas en este dispositivo.');
    } catch (error) {
      console.warn('No se pudo desactivar las notificaciones push', error);
      showGlobalMessage('No se pudo desactivar las notificaciones push.', 'error');
    } finally {
      state.push.loading = false;
      updatePushSettingsUI();
    }
  }

  return {
    getPushStatusLabel,
    updatePushSettingsUI,
    ensurePushServiceWorker,
    syncPushSubscriptionState,
    enablePushNotifications,
    disablePushNotifications,
  };
}
