export function createNotificationsModule(deps = {}) {
  const {
    state,
    notificationsList,
    notificationsMenuBadge,
    metricNotifications,
    formatDate,
    normalizeId,
    isAdmin,
  } = deps;

  if (!state || typeof state !== 'object') {
    throw new Error('Missing application state for notifications module.');
  }
  if (typeof formatDate !== 'function') {
    throw new Error('Missing formatDate helper for notifications module.');
  }
  if (typeof normalizeId !== 'function') {
    throw new Error('Missing normalizeId helper for notifications module.');
  }
  if (typeof isAdmin !== 'function') {
    throw new Error('Missing isAdmin helper for notifications module.');
  }

  const listElement = notificationsList || null;
  const menuBadgeElement = notificationsMenuBadge || null;
  const metricElement = metricNotifications || null;

  function updateNotificationsMenuBadge(count = 0) {
    if (!menuBadgeElement) return;
    menuBadgeElement.textContent = String(count);
    menuBadgeElement.hidden = count <= 0;
  }

  function updateNotificationCounts(value = 0) {
    let count = 0;
    if (Array.isArray(value)) {
      count = value.reduce((acc, entry) => {
        const weight = Number(entry?.countValue);
        if (Number.isFinite(weight) && weight > 0) {
          return acc + Math.trunc(weight);
        }
        return acc + 1;
      }, 0);
    } else {
      const parsed = Number(value);
      count = Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0;
    }

    if (metricElement) {
      metricElement.textContent = String(count);
      metricElement.hidden = count <= 0;
    }
    updateNotificationsMenuBadge(count);
    return count;
  }

  function collectEnrollmentRequestAlerts() {
    if (!isAdmin()) {
      state.pendingEnrollmentRequestCount = 0;
      return { alerts: [], total: 0 };
    }

    const categories = Array.isArray(state.categories) ? state.categories : [];
    let total = 0;
    const alerts = [];

    categories.forEach((category) => {
      const pendingCount = Number(category?.pendingRequestCount || 0);
      if (!Number.isFinite(pendingCount) || pendingCount <= 0) {
        return;
      }

      total += pendingCount;
      const categoryId = normalizeId(category);
      const categoryName = category?.name || 'Categoría';
      let scheduledFor = new Date();

      if (Array.isArray(category?.pendingRequests)) {
        const nextPending = category.pendingRequests.find((entry) => entry?.scheduledFor);
        if (nextPending?.scheduledFor) {
          const candidate = new Date(nextPending.scheduledFor);
          if (!Number.isNaN(candidate.valueOf())) {
            scheduledFor = candidate;
          }
        }
      }

      alerts.push({
        type: 'enrollment-request',
        categoryId,
        categoryName,
        pendingCount,
        countValue: pendingCount,
        scheduledFor: scheduledFor.toISOString(),
        channel: 'solicitudes',
        title: `Solicitudes de inscripción · ${categoryName}`,
        message:
          pendingCount === 1
            ? `Hay 1 solicitud pendiente para ${categoryName}.`
            : `Hay ${pendingCount} solicitudes pendientes para ${categoryName}.`,
      });
    });

    alerts.sort((a, b) => new Date(b.scheduledFor) - new Date(a.scheduledFor));

    const tournaments = Array.isArray(state.tournaments) ? state.tournaments : [];
    tournaments.forEach((tournament) => {
      const tournamentId = normalizeId(tournament);
      const tournamentName = tournament?.name || 'Torneo';
      const tournamentCategories = Array.isArray(tournament.categories) ? tournament.categories : [];

      tournamentCategories.forEach((category) => {
        const pendingCount = Number(
          category?.pendingEnrollmentCount || category?.enrollmentStats?.pending || 0
        );
        if (!Number.isFinite(pendingCount) || pendingCount <= 0) {
          return;
        }

        total += pendingCount;
        const categoryId = normalizeId(category);
        const categoryName = category?.name || 'Categoría';

        alerts.push({
          type: 'tournament-enrollment-request',
          tournamentId,
          categoryId,
          tournamentName,
          categoryName,
          pendingCount,
          countValue: pendingCount,
          scheduledFor: new Date().toISOString(),
          channel: 'torneos',
          title: `${tournamentName} · ${categoryName}`,
          message:
            pendingCount === 1
              ? `Hay 1 solicitud pendiente en ${categoryName} del torneo ${tournamentName}.`
              : `Hay ${pendingCount} solicitudes pendientes en ${categoryName} del torneo ${tournamentName}.`,
        });
      });
    });

    alerts.sort((a, b) => new Date(b.scheduledFor) - new Date(a.scheduledFor));
    state.pendingEnrollmentRequestCount = total;

    return { alerts, total };
  }

  function combineNotificationsWithEnrollmentRequests(notifications = []) {
    const base = Array.isArray(notifications) ? [...notifications] : [];
    const { alerts } = collectEnrollmentRequestAlerts();
    return base.concat(alerts);
  }

  function renderNotifications(notifications = []) {
    const baseList = Array.isArray(notifications) ? [...notifications] : [];
    state.notificationBase = baseList;
    const combined = combineNotificationsWithEnrollmentRequests(baseList);
    state.notifications = combined;

    updateNotificationCounts(combined);

    if (!listElement) {
      return combined;
    }

    listElement.innerHTML = '';
    if (!combined.length) {
      listElement.innerHTML = '<li class="empty-state">No tienes notificaciones pendientes.</li>';
      return combined;
    }

    combined.forEach((notification) => {
      const item = document.createElement('li');
      const title = document.createElement('strong');
      const isLeagueEnrollment = notification.type === 'enrollment-request';
      const isTournamentEnrollment = notification.type === 'tournament-enrollment-request';
      const isEnrollmentAlert = isLeagueEnrollment || isTournamentEnrollment;

      title.textContent = isEnrollmentAlert
        ? notification.title || `Solicitudes de inscripción · ${notification.categoryName || 'Categoría'}`
        : notification.title;
      item.appendChild(title);

      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.appendChild(document.createElement('span')).textContent = formatDate(notification.scheduledFor);
      const channelLabel = (() => {
        if (isTournamentEnrollment) return 'TORNEOS';
        if (isLeagueEnrollment) return 'SOLICITUDES';
        return (notification.channel || 'app').toUpperCase();
      })();
      meta.appendChild(document.createElement('span')).textContent = channelLabel;
      if (isEnrollmentAlert && Number(notification.pendingCount) > 0) {
        meta.appendChild(document.createElement('span')).textContent = `Pendientes: ${notification.pendingCount}`;
      }
      item.appendChild(meta);

      const messageText = notification.message;
      if (messageText) {
        const message = document.createElement('p');
        message.textContent = messageText;
        item.appendChild(message);
      }

      if (!isEnrollmentAlert && notification.match?.scheduledAt) {
        const info = document.createElement('div');
        info.className = 'meta';
        info.textContent = `Partido: ${formatDate(notification.match.scheduledAt)} · Pista ${
          notification.match.court || 'por confirmar'
        }`;
        item.appendChild(info);
      }

      if (isEnrollmentAlert) {
        const actions = document.createElement('div');
        actions.className = 'actions';
        const reviewButton = document.createElement('button');
        reviewButton.type = 'button';
        reviewButton.className = 'primary';
        let hasTarget = false;
        if (isTournamentEnrollment && notification.tournamentId) {
          reviewButton.dataset.reviewTournament = notification.tournamentId;
          if (notification.categoryId) {
            reviewButton.dataset.reviewTournamentCategory = notification.categoryId;
          }
          hasTarget = true;
        } else if (notification.categoryId) {
          reviewButton.dataset.reviewCategory = notification.categoryId;
          hasTarget = true;
        }

        if (hasTarget) {
          reviewButton.textContent =
            Number(notification.pendingCount) === 1 ? 'Revisar solicitud' : 'Revisar solicitudes';
          actions.appendChild(reviewButton);
          item.appendChild(actions);
        }
        if (listElement) {
          listElement.appendChild(item);
        }
        return;
      }

      const notificationId = normalizeId(notification);
      if (notificationId) {
        const actions = document.createElement('div');
        actions.className = 'actions';
        const dismiss = document.createElement('button');
        dismiss.type = 'button';
        dismiss.className = 'secondary';
        dismiss.dataset.notificationId = notificationId;
        dismiss.textContent = 'Marcar como leída';
        actions.appendChild(dismiss);
        item.appendChild(actions);
      }

      listElement.appendChild(item);
    });

    return combined;
  }

  return {
    renderNotifications,
    updateNotificationCounts,
  };
}
