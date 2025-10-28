import { MOVEMENT_ICON_PATHS, MOVEMENT_STYLES, SCHEDULE_LABELS as DEFAULT_SCHEDULE_LABELS } from '../config/constants.js';

export function createUiComponents({ SCHEDULE_LABELS = DEFAULT_SCHEDULE_LABELS } = {}) {
  function stripDiacritics(value) {
    if (typeof value !== 'string') {
      return '';
    }

    if (typeof value.normalize === 'function') {
      return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    return value;
  }

  function normalizeCourtKey(value) {
    if (typeof value !== 'string') {
      return '';
    }

    const stripped = stripDiacritics(value)
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    return stripped;
  }

  function capitalizeWord(word) {
    if (!word) {
      return '';
    }
    if (/^\d+$/u.test(word)) {
      return word;
    }
    return `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
  }

  function formatCourtDisplay(value) {
    if (typeof value !== 'string') {
      return '';
    }

    const cleaned = value.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleaned) {
      return '';
    }

    const normalized = stripDiacritics(cleaned).toLowerCase();
    const capitalized = cleaned
      .split(' ')
      .filter(Boolean)
      .map(capitalizeWord)
      .join(' ');

    if (/^(pista|cancha|court|campo)\b/u.test(normalized)) {
      return capitalized;
    }

    if (/^\d+$/u.test(normalized)) {
      return `Pista ${capitalized}`;
    }

    return `Pista ${capitalized}`;
  }

  function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function resolvePlayerDisplayName(player, visited = new Set()) {
    if (!player || visited.has(player)) {
      return '';
    }

    if (typeof player === 'string') {
      const trimmed = player.trim();
      return trimmed;
    }

    if (typeof player !== 'object') {
      return '';
    }

    visited.add(player);

    if (Array.isArray(player.players) && player.players.length) {
      const names = player.players
        .map((member) => resolvePlayerDisplayName(member, visited))
        .filter((name) => Boolean(name && name.trim()));
      if (names.length) {
        return names.join(' / ');
      }
    }

    const directFields = ['fullName', 'name', 'label', 'displayName'];
    for (const field of directFields) {
      const fieldValue = player[field];
      if (typeof fieldValue === 'string' && fieldValue.trim()) {
        return fieldValue.trim();
      }
    }

    if (typeof player.email === 'string' && player.email.trim()) {
      return player.email.trim();
    }

    const nestedFields = ['player', 'user', 'member', 'participant'];
    for (const field of nestedFields) {
      if (player[field]) {
        const nestedName = resolvePlayerDisplayName(player[field], visited);
        if (nestedName && nestedName.trim()) {
          return nestedName;
        }
      }
    }

    visited.delete(player);
    return '';
  }

  function getPlayerDisplayName(player) {
    const name = resolvePlayerDisplayName(player);
    return name && name.trim() ? name.trim() : 'Jugador';
  }

  function getPlayerInitial(player) {
    const name = getPlayerDisplayName(player).trim();
    return name ? name.charAt(0).toUpperCase() : 'J';
  }

  function createMovementIcon(type) {
    const pathData = MOVEMENT_ICON_PATHS[type];
    if (!pathData) return null;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.classList.add('movement-icon');

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '12');
    circle.setAttribute('cy', '12');
    circle.setAttribute('r', '11');
    circle.setAttribute('fill', 'var(--movement-badge-bg)');
    svg.appendChild(circle);

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('fill', 'currentColor');
    svg.appendChild(path);

    return svg;
  }

  function resolveMovement(entry) {
    if (!entry) return null;

    const toFiniteNumber = (value) => {
      if (value === null || value === undefined || value === '') {
        return null;
      }
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : null;
    };

    const previousPosition = toFiniteNumber(entry.previousPosition);
    const delta = toFiniteNumber(entry.movementDelta);
    const lastPoints = toFiniteNumber(entry.lastMatchPoints);
    const previousPoints = toFiniteNumber(entry.previousMatchPoints);
    const lastResult =
      entry.lastMatchResult === 'win' || entry.lastMatchResult === 'loss'
        ? entry.lastMatchResult
        : null;

    let type = 'same';
    let positionDelta = null;

    if (entry.movement === 'nuevo' || previousPosition === null) {
      type = 'new';
    } else if (delta !== null) {
      positionDelta = delta;
      if (delta > 0) {
        type = 'up';
      } else if (delta < 0) {
        type = 'down';
      } else {
        type = 'same';
      }
    }

    const metrics = [];
    const ariaParts = [];

    if (lastPoints !== null) {
      const hasPrevious = previousPoints !== null;
      const comparisonValue = hasPrevious ? lastPoints - previousPoints : lastPoints;
      const metricType = comparisonValue > 0 ? 'positive' : comparisonValue < 0 ? 'negative' : 'neutral';
      const resultLabel = lastResult === 'win' ? 'V' : lastResult === 'loss' ? 'D' : '';
      const baseValue = hasPrevious ? comparisonValue : lastPoints;
      const signPrefix = hasPrevious && baseValue > 0 ? '+' : '';
      const formattedNumber = `${signPrefix}${baseValue}`;
      const valueText = `${resultLabel ? `${resultLabel} ` : ''}${formattedNumber} pts`;

      const matchDescriptor =
        lastResult === 'win'
          ? 'Victoria en el último partido'
          : lastResult === 'loss'
          ? 'Derrota en el último partido'
          : 'Último partido';
      let description;
      if (hasPrevious) {
        const previousComparison = ` (${lastPoints} vs ${previousPoints})`;
        if (comparisonValue > 0) {
          description = `${matchDescriptor}: ganó ${comparisonValue} puntos más que en el anterior${previousComparison}.`;
        } else if (comparisonValue < 0) {
        description = `${matchDescriptor}: consiguió ${Math.abs(
          comparisonValue
        )} puntos menos que en el anterior${previousComparison}.`;
        } else {
          description = `${matchDescriptor}: obtuvo los mismos puntos que en el anterior${previousComparison}.`;
        }
      } else {
        description = `${matchDescriptor}: sumó ${lastPoints} puntos.`;
      }

      metrics.push({
        key: 'performance',
        label: 'Último partido',
        value: valueText,
        type: metricType,
        description,
        delta: hasPrevious ? comparisonValue : null,
        result: lastResult,
      });
      ariaParts.push(description);
    }

    let positionDescription = '';
    if (type === 'new') {
      metrics.push({
        key: 'position',
        label: 'Posición',
        value: 'Nuevo',
        type: 'neutral',
        description: 'Nuevo ingreso al ranking.',
        delta: null,
      });
      ariaParts.push('Nuevo ingreso al ranking.');
    } else if (positionDelta !== null) {
      const absolute = Math.abs(positionDelta);
      let value;
      let metricType = 'neutral';
      if (positionDelta > 0) {
        value = `↑ ${absolute}`;
        metricType = 'positive';
        positionDescription = `Posición: sube ${absolute} ${absolute === 1 ? 'posición' : 'posiciones'}.`;
      } else if (positionDelta < 0) {
        value = `↓ ${absolute}`;
        metricType = 'negative';
        positionDescription = `Posición: baja ${absolute} ${absolute === 1 ? 'posición' : 'posiciones'}.`;
      } else {
        value = '= 0';
        positionDescription = 'Posición: se mantiene sin cambios.';
      }
      metrics.push({
        key: 'position',
        label: 'Posición',
        value,
        type: metricType,
        description: positionDescription,
        delta: positionDelta,
      });
      ariaParts.push(positionDescription);
    } else if (typeof entry.movement === 'string' && entry.movement.trim()) {
      const normalizedMovement = entry.movement.trim();
      const capitalized = `${normalizedMovement.charAt(0).toUpperCase()}${normalizedMovement.slice(1)}`;
      const descriptionText = `Posición: ${normalizedMovement}.`;
      metrics.push({
        key: 'position',
        label: 'Posición',
        value: capitalized,
        type: 'neutral',
        description: descriptionText,
        delta: null,
      });
      ariaParts.push(descriptionText);
    }

    if (!metrics.length) {
      return null;
    }

    return {
      type,
      metrics,
      ariaLabel: ariaParts.filter(Boolean).join(' '),
    };
  }

  function createMovementBadge(entry) {
    const movement = resolveMovement(entry);
    if (!movement) return null;

    const badge = document.createElement('span');
    badge.className = `movement-badge movement-badge--${movement.type}`;
    const style = MOVEMENT_STYLES[movement.type];
    if (style) {
      badge.style.setProperty('--movement-badge-bg', style.background);
      badge.style.color = style.color;
    }

    const icon = createMovementIcon(movement.type);
    if (icon) {
      badge.appendChild(icon);
    }

    const metrics = Array.isArray(movement.metrics) ? movement.metrics : [];
    if (metrics.length) {
      const metricsContainer = document.createElement('span');
      metricsContainer.className = 'movement-badge__metrics';
      metrics.forEach((metric) => {
        if (!metric || !metric.label) return;
        const metricElement = document.createElement('span');
        metricElement.className = `movement-badge__metric movement-badge__metric--${metric.type || 'neutral'}`;
        if (metric.description) {
          metricElement.title = metric.description;
        }

        const metricLabel = document.createElement('span');
        metricLabel.className = 'movement-badge__metric-label';
        metricLabel.textContent = metric.label;
        metricElement.appendChild(metricLabel);

        const metricValue = document.createElement('span');
        metricValue.className = 'movement-badge__metric-value';
        metricValue.textContent = metric.value ?? '—';
        metricElement.appendChild(metricValue);

        metricsContainer.appendChild(metricElement);
      });

      if (metricsContainer.childElementCount > 0) {
        badge.appendChild(metricsContainer);
      }
    }

    badge.setAttribute('aria-label', movement.ariaLabel || '');
    return badge;
  }

  function getMovementIconMarkup(type) {
    const path = MOVEMENT_ICON_PATHS[type];
    if (!path) return '';
    return `
    <svg class="movement-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="var(--movement-badge-bg)"></circle>
      <path d="${path}" fill="currentColor"></path>
    </svg>
  `;
  }

  function buildMovementBadgeMarkup(entry) {
    const movement = resolveMovement(entry);
    if (!movement) {
      return '<span class="movement-badge movement-badge--none">—</span>';
    }

    const style = MOVEMENT_STYLES[movement.type] || MOVEMENT_STYLES.same;
    const iconMarkup = getMovementIconMarkup(movement.type);
    const metrics = Array.isArray(movement.metrics) ? movement.metrics : [];
    const metricsMarkup = metrics
      .filter((metric) => metric && metric.label)
      .map((metric) => {
        const titleAttr = metric.description ? ` title="${escapeHtml(metric.description)}"` : '';
        return `
        <span class="movement-badge__metric movement-badge__metric--${metric.type || 'neutral'}"${titleAttr}>
          <span class="movement-badge__metric-label">${escapeHtml(metric.label)}</span>
          <span class="movement-badge__metric-value">${escapeHtml(metric.value ?? '—')}</span>
        </span>
      `;
      })
      .join('');
    const ariaAttr = movement.ariaLabel ? ` aria-label="${escapeHtml(movement.ariaLabel)}"` : '';
    return `
    <span class="movement-badge movement-badge--${movement.type}" style="--movement-badge-bg:${style.background};color:${style.color};"${ariaAttr}>
      ${iconMarkup}
      <span class="movement-badge__metrics">${metricsMarkup}</span>
    </span>
  `.trim();
  }

  function createAvatarElement(player, { size = 'md' } = {}) {
    const wrapper = document.createElement('div');
    wrapper.className = `player-avatar player-avatar--${size}`;

    const photo = typeof player?.photo === 'string' ? player.photo : '';

    if (photo) {
      const image = document.createElement('img');
      image.src = photo;
      image.alt = `Avatar de ${getPlayerDisplayName(player)}`;
      wrapper.appendChild(image);
    } else {
      wrapper.classList.add('player-avatar--placeholder');
      wrapper.textContent = getPlayerInitial(player);
    }

    return wrapper;
  }

  function buildPlayerCell(player, { includeSchedule = false, size = 'md' } = {}) {
    const container = document.createElement('div');
    container.className = 'player-cell';

    container.appendChild(createAvatarElement(player, { size }));

    const info = document.createElement('div');
    info.className = 'player-cell__info';

    const name = document.createElement('span');
    name.className = 'player-cell__name';
    name.textContent = getPlayerDisplayName(player);
    info.appendChild(name);

    if (includeSchedule && player?.preferredSchedule) {
      const schedule = document.createElement('span');
      schedule.className = 'player-cell__meta';
      schedule.textContent = SCHEDULE_LABELS[player.preferredSchedule] || player.preferredSchedule;
      info.appendChild(schedule);
    }

    container.appendChild(info);
    return container;
  }

  function buildPlayerCellMarkup(player, { includeSchedule = false } = {}) {
    const displayName = getPlayerDisplayName(player);
    const safeName = escapeHtml(displayName);
    const scheduleLabel =
      includeSchedule && player?.preferredSchedule
        ? escapeHtml(SCHEDULE_LABELS[player.preferredSchedule] || player.preferredSchedule)
        : '';
    const photo = typeof player?.photo === 'string' ? player.photo : '';
    const hasPhoto = Boolean(photo);
    const avatarClasses = ['player-avatar', 'player-avatar--md'];
    let avatarContent = '';

    if (hasPhoto) {
      avatarContent = `<img src="${photo}" alt="Avatar de ${safeName}" />`;
    } else {
      avatarClasses.push('player-avatar--placeholder');
      avatarContent = escapeHtml(getPlayerInitial(player));
    }

    return `
    <div class="player-cell">
      <div class="${avatarClasses.join(' ')}">${avatarContent}</div>
      <div class="player-cell__info">
        <span class="player-cell__name">${safeName}</span>
        ${scheduleLabel ? `<span class="player-cell__meta">${scheduleLabel}</span>` : ''}
      </div>
    </div>
  `.trim();
  }

  return {
    escapeHtml,
    normalizeCourtKey,
    formatCourtDisplay,
    getPlayerDisplayName,
    getPlayerInitial,
    createAvatarElement,
    buildPlayerCell,
    buildPlayerCellMarkup,
    createMovementBadge,
    buildMovementBadgeMarkup,
  };
}
