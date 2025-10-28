export function createLeagueCategoriesModule(deps = {}) {
  const {
    state,
    request,
    loadAllData,
    ensureCategoryFilters,
    formatLeagueOptionLabel,
    hasActiveLeagues,
    isAdmin,
    normalizeId,
    renderNotifications,
    categoriesList,
    categoryLeagueFilter,
    categoryCreateButton,
    getCategoryColor,
    applyCategoryColorStyles,
    createCategoryColorIndicator,
    translateGender,
    formatDate,
    formatCurrencyValue,
    resolveLeague,
    LEAGUE_STATUS_LABELS = {},
    CATEGORY_STATUS_LABELS = {},
    DEFAULT_CATEGORY_COLOR = '#7c5dfa',
    DEFAULT_CATEGORY_MATCH_FORMAT = '',
    CATEGORY_SKILL_LEVEL_OPTIONS = [],
    CATEGORY_MATCH_FORMAT_OPTIONS = [],
    renderCategoryColorField,
    openModal,
    closeModal,
    adminCategoryList,
    adminCategoryForm,
    adminCategoryCancel,
    formatDateInput,
    setStatusMessage,
    resolveCategoryColor,
  } = deps;

  if (!state || typeof state !== 'object') {
    throw new Error('Missing application state for league categories module.');
  }
  if (typeof ensureCategoryFilters !== 'function') {
    throw new Error('Missing ensureCategoryFilters dependency for league categories module.');
  }
  if (typeof formatLeagueOptionLabel !== 'function') {
    throw new Error('Missing formatLeagueOptionLabel dependency for league categories module.');
  }
  if (typeof hasActiveLeagues !== 'function') {
    throw new Error('Missing hasActiveLeagues dependency for league categories module.');
  }
  if (typeof isAdmin !== 'function') {
    throw new Error('Missing isAdmin dependency for league categories module.');
  }
  if (typeof normalizeId !== 'function') {
    throw new Error('Missing normalizeId dependency for league categories module.');
  }
  if (typeof request !== 'function') {
    throw new Error('Missing request dependency for league categories module.');
  }
  if (typeof loadAllData !== 'function') {
    throw new Error('Missing loadAllData dependency for league categories module.');
  }
  if (typeof renderCategoryColorField !== 'function') {
    throw new Error('Missing renderCategoryColorField dependency for league categories module.');
  }
  if (typeof openModal !== 'function' || typeof closeModal !== 'function') {
    throw new Error('Missing modal utilities for league categories module.');
  }
  if (typeof setStatusMessage !== 'function') {
    throw new Error('Missing setStatusMessage dependency for league categories module.');
  }
  if (typeof resolveCategoryColor !== 'function') {
    throw new Error('Missing resolveCategoryColor dependency for league categories module.');
  }

  function updateCategoryControlsAvailability() {
    if (!categoryCreateButton) return;
    const enabled = hasActiveLeagues();
    categoryCreateButton.disabled = !enabled;
    categoryCreateButton.title = enabled
      ? ''
      : 'Crea una liga activa para registrar nuevas categorías.';
  }

  function updateCategoryFilterControls({ renderOnChange = true } = {}) {
    if (!categoryLeagueFilter) return;

    const filters = ensureCategoryFilters();
    const previousValue = filters.league || '';

    categoryLeagueFilter.innerHTML = '';

    const leagues = Array.isArray(state.leagues) ? state.leagues.slice() : [];

    const toChronoTimestamp = (value) => {
      if (!value) {
        return Number.POSITIVE_INFINITY;
      }
      const date = value instanceof Date ? value : new Date(value);
      const time = date.getTime();
      return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY;
    };

    const getLeagueChronoValue = (league) => {
      if (!league || typeof league !== 'object') {
        return Number.POSITIVE_INFINITY;
      }

      const startTimestamp = toChronoTimestamp(league.startDate);
      if (Number.isFinite(startTimestamp)) {
        return startTimestamp;
      }

      const numericYear = Number(league.year);
      if (Number.isFinite(numericYear)) {
        const normalizedYear = Math.trunc(numericYear);
        const yearDate = new Date(normalizedYear, 0, 1);
        const yearTimestamp = yearDate.getTime();
        if (Number.isFinite(yearTimestamp)) {
          return yearTimestamp;
        }
      }

      const createdTimestamp = toChronoTimestamp(league.createdAt);
      if (Number.isFinite(createdTimestamp)) {
        return createdTimestamp;
      }

      return Number.POSITIVE_INFINITY;
    };

    leagues.sort((a, b) => {
      const chronoDiff = getLeagueChronoValue(a) - getLeagueChronoValue(b);
      if (chronoDiff !== 0) {
        return chronoDiff;
      }
      return formatLeagueOptionLabel(a).localeCompare(formatLeagueOptionLabel(b), 'es', {
        sensitivity: 'base',
      });
    });

    const availableIds = new Set();
    let defaultLeagueId = '';
    leagues.forEach((league) => {
      const leagueId = normalizeId(league);
      if (!leagueId || availableIds.has(leagueId)) {
        return;
      }
      availableIds.add(leagueId);
      if (!defaultLeagueId) {
        defaultLeagueId = leagueId;
      }
      const option = document.createElement('option');
      option.value = leagueId;
      option.textContent = formatLeagueOptionLabel(league);
      categoryLeagueFilter.appendChild(option);
    });

    const nextValue =
      previousValue && availableIds.has(previousValue) ? previousValue : defaultLeagueId;
    const selectionChanged = nextValue !== previousValue;

    filters.league = nextValue;
    categoryLeagueFilter.value = nextValue;
    categoryLeagueFilter.disabled = !availableIds.size;

    if (selectionChanged && renderOnChange) {
      renderCategories(state.categories);
    }
  }

  function renderCategories(categories = []) {
    if (!categoriesList) return;
    updateCategoryControlsAvailability();

    const filters = ensureCategoryFilters();
    const leagueFilter = filters.league || '';
    const sourceCategories = Array.isArray(categories)
      ? categories
      : Array.isArray(state.categories)
      ? state.categories
      : [];

    const admin = isAdmin();
    const currentGender = state.user?.gender || '';
    const totalPendingRequests = admin
      ? sourceCategories.reduce((sum, category) => {
          const pendingCount = Number(category?.pendingRequestCount || 0);
          if (Number.isFinite(pendingCount) && pendingCount > 0) {
            return sum + pendingCount;
          }
          return sum;
        }, 0)
      : 0;

    const filteredCategories = leagueFilter
      ? sourceCategories.filter((category) => normalizeId(category?.league) === leagueFilter)
      : sourceCategories;

    categoriesList.innerHTML = '';

    if (!filteredCategories.length) {
      if (!sourceCategories.length) {
        categoriesList.innerHTML = state.leagues.length
          ? '<li class="empty-state">No hay categorías registradas.</li>'
          : admin
          ? '<li class="empty-state">Crea una liga para comenzar a registrar categorías.</li>'
          : '<li class="empty-state">Aún no hay ligas disponibles.</li>';
      } else if (leagueFilter) {
        categoriesList.innerHTML =
          '<li class="empty-state">No hay categorías registradas para la liga seleccionada.</li>';
      } else {
        categoriesList.innerHTML = '<li class="empty-state">No hay categorías registradas.</li>';
      }

      if (admin) {
        state.pendingEnrollmentRequestCount = totalPendingRequests;
        if (state.notificationBase !== null && typeof renderNotifications === 'function') {
          renderNotifications(state.notificationBase);
        }
      } else {
        state.pendingEnrollmentRequestCount = 0;
      }

      return;
    }

    const resolveCategorySortValue = (category) => {
      if (!category) {
        return Number.POSITIVE_INFINITY;
      }
      const start = category.startDate ? new Date(category.startDate).getTime() : NaN;
      if (Number.isFinite(start)) {
        return start;
      }
      const created = category.createdAt ? new Date(category.createdAt).getTime() : NaN;
      if (Number.isFinite(created)) {
        return created;
      }
      return Number.POSITIVE_INFINITY;
    };

    const sortedCategories = filteredCategories
      .slice()
      .sort((a, b) => {
        const valueA = resolveCategorySortValue(a);
        const valueB = resolveCategorySortValue(b);
        if (valueA !== valueB) {
          return valueA - valueB;
        }
        return (a?.name || '').localeCompare(b?.name || '', 'es');
      });

    sortedCategories.forEach((category) => {
      const item = document.createElement('li');
      const content = document.createElement('div');
      content.className = 'list-item__content';
      item.appendChild(content);

      const categoryId = normalizeId(category);
      if (categoryId) {
        item.dataset.categoryId = categoryId;
      }
      const categoryColor = typeof getCategoryColor === 'function' ? getCategoryColor(category) : '';
      if (categoryColor && typeof applyCategoryColorStyles === 'function') {
        applyCategoryColorStyles(item, categoryColor, { backgroundAlpha: 0.14, borderAlpha: 0.3 });
      }

      const title = document.createElement('strong');
      title.textContent = category.name;
      if (categoryColor && typeof createCategoryColorIndicator === 'function') {
        const indicator = createCategoryColorIndicator(categoryColor, category.name);
        if (indicator) {
          title.classList.add('with-category-color');
          title.prepend(indicator);
        }
      }
      content.appendChild(title);

      const statusValue = category.status || 'inscripcion';
      const meta = document.createElement('div');
      meta.className = 'meta meta-category';
      meta.appendChild(document.createElement('span')).textContent = translateGender
        ? translateGender(category.gender)
        : category.gender || '';

      const statusBadge = document.createElement('span');
      statusBadge.className = `tag category-status category-status--${statusValue}`;
      statusBadge.textContent = CATEGORY_STATUS_LABELS[statusValue] || 'Estado por definir';
      meta.appendChild(statusBadge);

      if (category.skillLevel) {
        const level = document.createElement('span');
        level.className = 'tag category-level';
        level.textContent = category.skillLevel;
        meta.appendChild(level);
      }
      content.appendChild(meta);

      const minimumAgeValue = Number(category.minimumAge);
      if (Number.isFinite(minimumAgeValue) && minimumAgeValue > 0) {
        const minimumAgeMeta = document.createElement('div');
        minimumAgeMeta.className = 'meta meta-minimum-age';
        const parts = [`Edad mínima: ${minimumAgeValue} años`];
        if (category.minimumAgeReferenceYear) {
          parts.push(`Año de referencia: ${category.minimumAgeReferenceYear}`);
        }
        minimumAgeMeta.textContent = parts.join(' · ');
        content.appendChild(minimumAgeMeta);
      }

      if (category.startDate || category.endDate) {
        const dates = document.createElement('div');
        dates.className = 'meta';
        const formatted = [category.startDate, category.endDate]
          .map((value) => (value && typeof formatDate === 'function' ? formatDate(value) : null))
          .filter(Boolean)
          .join(' · ');
        dates.textContent = formatted || 'Fechas por confirmar';
        content.appendChild(dates);
      }

      if (category.description) {
        const description = document.createElement('p');
        description.textContent = category.description;
        content.appendChild(description);
      }

      const linkedLeague = resolveLeague ? resolveLeague(category.league) : null;
      if (linkedLeague) {
        const leagueMeta = document.createElement('div');
        leagueMeta.className = 'meta meta-league-link';
        leagueMeta.appendChild(document.createElement('span')).textContent = 'Liga';

        const leagueTag = document.createElement('span');
        leagueTag.className = 'tag league-tag';
        const leagueNameParts = [linkedLeague.name || 'Liga'];
        if (linkedLeague.year) {
          leagueNameParts.push(linkedLeague.year);
        }
        leagueTag.textContent = leagueNameParts.join(' · ');
        if (linkedLeague.status === 'cerrada') {
          leagueTag.classList.add('league-tag--closed');
        }
        leagueMeta.appendChild(leagueTag);

        const statusLabel = linkedLeague.status ? LEAGUE_STATUS_LABELS[linkedLeague.status] : null;
        if (statusLabel) {
          const statusBadge = document.createElement('span');
          statusBadge.className = `tag league-status league-status--${linkedLeague.status}`;
          statusBadge.textContent = statusLabel;
          leagueMeta.appendChild(statusBadge);
        }

        content.appendChild(leagueMeta);
      } else if (admin) {
        const leagueNote = document.createElement('div');
        leagueNote.className = 'meta note';
        leagueNote.textContent = 'Liga pendiente de asignar.';
        content.appendChild(leagueNote);
      }

      const registrationMetaParts = [];
      if (category.registrationWindowOpen === true) {
        registrationMetaParts.push('Inscripciones abiertas');
      } else if (category.registrationWindowOpen === false) {
        registrationMetaParts.push('Inscripciones cerradas');
      }
      if (category.leagueRegistrationCloseDate && typeof formatDate === 'function') {
        registrationMetaParts.push(
          `Cierre de inscripción: ${formatDate(category.leagueRegistrationCloseDate)}`
        );
      }
      if (typeof category.leagueEnrollmentFee === 'number' && typeof formatCurrencyValue === 'function') {
        registrationMetaParts.push(`Cuota: ${formatCurrencyValue(category.leagueEnrollmentFee)}`);
      }
      if (registrationMetaParts.length) {
        const registrationMeta = document.createElement('div');
        registrationMeta.className = 'meta meta-registration';
        registrationMeta.textContent = registrationMetaParts.join(' · ');
        content.appendChild(registrationMeta);
      }

      const storedEnrollments = state.enrollments.get(categoryId);
      const enrollmentCount = Array.isArray(storedEnrollments)
        ? storedEnrollments.length
        : Number(category.enrollmentCount || 0);
      const pendingRequestCount = Number(category.pendingRequestCount || 0);

      const enrollmentSummary = document.createElement('div');
      enrollmentSummary.className = 'meta meta-enrollment';
      enrollmentSummary.textContent = `Jugadores inscritos: ${enrollmentCount}`;
      content.appendChild(enrollmentSummary);

      if (admin && pendingRequestCount > 0) {
        const requestSummary = document.createElement('div');
        requestSummary.className = 'meta meta-enrollment';
        requestSummary.textContent = `Solicitudes pendientes: ${pendingRequestCount}`;
        content.appendChild(requestSummary);
      }

      if (Array.isArray(storedEnrollments) && storedEnrollments.length) {
        const roster = document.createElement('ul');
        roster.className = 'inline-list';
        storedEnrollments.forEach((enrollment) => {
          const player = enrollment.user || {};
          const listItem = document.createElement('li');
          listItem.textContent = player.fullName || player.email || 'Jugador';
          roster.appendChild(listItem);
        });
        content.appendChild(roster);
      }

      const actions = document.createElement('div');
      actions.className = 'actions category-actions';
      let hasActions = false;

      if (admin) {
        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.className = 'secondary';
        editButton.textContent = 'Editar';
        if (categoryId) {
          editButton.dataset.categoryId = categoryId;
          editButton.dataset.action = 'edit';
        }
        actions.appendChild(editButton);

        if (pendingRequestCount > 0) {
          const reviewButton = document.createElement('button');
          reviewButton.type = 'button';
          reviewButton.className = 'primary';
          reviewButton.textContent =
            pendingRequestCount === 1
              ? 'Revisar solicitud'
              : `Revisar ${pendingRequestCount} solicitudes`;
          if (categoryId) {
            reviewButton.dataset.categoryId = categoryId;
            reviewButton.dataset.action = 'review-requests';
          }
          actions.appendChild(reviewButton);
        }

        const manageButton = document.createElement('button');
        manageButton.type = 'button';
        manageButton.className = 'ghost';
        manageButton.textContent = 'Gestionar inscripciones';
        if (categoryId) {
          manageButton.dataset.categoryId = categoryId;
          manageButton.dataset.action = 'enrollments';
        }
        actions.appendChild(manageButton);
        hasActions = true;
      }

      const hasPendingRequest = Boolean(category.pendingRequestId);
      const canRequestEnrollment = Boolean(
        !admin && categoryId && category.canRequestEnrollment && !category.isEnrolled && !hasPendingRequest
      );

      if (category.isEnrolled) {
        const enrolledBadge = document.createElement('span');
        enrolledBadge.className = 'tag tag--success';
        enrolledBadge.textContent = 'Inscrito';
        actions.appendChild(enrolledBadge);
        hasActions = true;
      } else if (hasPendingRequest) {
        const pendingBadge = document.createElement('span');
        pendingBadge.className = 'tag';
        pendingBadge.textContent = 'Solicitud enviada';
        actions.appendChild(pendingBadge);
        hasActions = true;
      } else if (canRequestEnrollment) {
        const requestButton = document.createElement('button');
        requestButton.type = 'button';
        requestButton.className = 'primary';
        requestButton.dataset.categoryId = categoryId;
        requestButton.dataset.action = 'request-enrollment';
        requestButton.textContent = 'Solicitar inscripción';
        actions.appendChild(requestButton);
        hasActions = true;
      } else if (!admin && statusValue === 'en_curso') {
        const note = document.createElement('span');
        note.className = 'note';
        note.textContent = 'Inscripciones cerradas';
        actions.appendChild(note);
        hasActions = true;
      } else if (!admin && currentGender && category.gender !== currentGender) {
        const note = document.createElement('span');
        note.className = 'note';
        note.textContent = 'No disponible para tu perfil';
        actions.appendChild(note);
        hasActions = true;
      }

      if (hasActions) {
        content.appendChild(actions);
      }

      const rawCategoryPoster = typeof category.poster === 'string' ? category.poster.trim() : '';
      const rawLeaguePoster =
        typeof linkedLeague?.poster === 'string' ? linkedLeague.poster.trim() : '';
      const posterUrl = rawCategoryPoster || rawLeaguePoster;
      if (posterUrl) {
        item.classList.add('list-item--with-poster');
        const posterWrapper = document.createElement('div');
        posterWrapper.className = 'list-item__poster';
        const poster = document.createElement('img');
        poster.className = 'list-item__poster-image';
        poster.src = posterUrl;
        if (rawCategoryPoster && category.name) {
          poster.alt = `Cartel de la categoría ${category.name}`;
        } else if (linkedLeague?.name) {
          poster.alt = `Cartel de la liga ${linkedLeague.name}`;
        } else {
          poster.alt = 'Cartel de la liga';
        }
        poster.loading = 'lazy';
        posterWrapper.appendChild(poster);
        item.appendChild(posterWrapper);
      }

      categoriesList.appendChild(item);
    });

    if (admin) {
      state.pendingEnrollmentRequestCount = totalPendingRequests;
      if (state.notificationBase !== null && typeof renderNotifications === 'function') {
        renderNotifications(state.notificationBase);
      }
    } else {
      state.pendingEnrollmentRequestCount = 0;
    }
  }

  function buildCategoryPayload(formData, isEditing = false) {
    const payload = {
      name: (formData.get('name') || '').trim(),
      description: (formData.get('description') || '').trim(),
      gender: formData.get('gender') || 'masculino',
      skillLevel: formData.get('skillLevel') || '',
    };

    const status = formData.get('status');
    if (status) {
      payload.status = status;
    }

    const matchFormat = (formData.get('matchFormat') || '').trim();
    if (matchFormat) {
      payload.matchFormat = matchFormat;
    }

    const leagueId = (formData.get('leagueId') || '').trim();
    if (leagueId) {
      payload.leagueId = leagueId;
    }

    if (formData.has('minimumAge')) {
      const rawMinimumAge = formData.get('minimumAge');
      if (rawMinimumAge !== null && rawMinimumAge !== undefined && rawMinimumAge !== '') {
        const parsedMinimumAge = Number.parseInt(rawMinimumAge, 10);
        if (Number.isFinite(parsedMinimumAge) && parsedMinimumAge >= 0) {
          payload.minimumAge = parsedMinimumAge;
        }
      } else if (isEditing) {
        payload.minimumAge = null;
      }
    }

    if (formData.has('color')) {
      const colorValue = resolveCategoryColor(formData.get('color'));
      if (colorValue) {
        payload.color = colorValue;
      }
    }

    return payload;
  }

  async function submitCategoryFormData({ form, categoryId, statusElement }) {
    if (!form) return false;
    const formData = new FormData(form);
    const isEditing = Boolean(categoryId);
    const payload = buildCategoryPayload(formData, isEditing);

    if (!payload.name) {
      setStatusMessage(statusElement, 'error', 'El nombre de la categoría es obligatorio.');
      return false;
    }

    if (!payload.leagueId) {
      setStatusMessage(statusElement, 'error', 'Selecciona una liga para la categoría.');
      return false;
    }

    if (
      !payload.skillLevel ||
      !CATEGORY_SKILL_LEVEL_OPTIONS.some((option) => option.value === payload.skillLevel)
    ) {
      setStatusMessage(statusElement, 'error', 'Selecciona un nivel para la categoría.');
      return false;
    }

    if (
      !payload.matchFormat ||
      !CATEGORY_MATCH_FORMAT_OPTIONS.some((option) => option.value === payload.matchFormat)
    ) {
      setStatusMessage(statusElement, 'error', 'Selecciona un formato de partido para la categoría.');
      return false;
    }

    setStatusMessage(
      statusElement,
      'info',
      isEditing ? 'Actualizando categoría...' : 'Creando categoría...'
    );

    try {
      const url = isEditing ? `/categories/${categoryId}` : '/categories';
      const method = isEditing ? 'PATCH' : 'POST';
      await request(url, { method, body: payload });
      setStatusMessage(
        statusElement,
        'success',
        isEditing ? 'Categoría actualizada.' : 'Categoría creada.'
      );
      await loadAllData();
      return true;
    } catch (error) {
      setStatusMessage(statusElement, 'error', error.message);
      return false;
    }
  }

  function renderAdminCategoryList() {
    if (!adminCategoryList) return;
    adminCategoryList.innerHTML = '';

    if (!state.categories.length) {
      adminCategoryList.innerHTML = '<li class="empty-state">Aún no hay categorías.</li>';
      return;
    }

    state.categories
      .slice()
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'))
      .forEach((category) => {
        const item = document.createElement('li');
        const categoryColor = typeof getCategoryColor === 'function' ? getCategoryColor(category) : '';
        if (categoryColor && typeof applyCategoryColorStyles === 'function') {
          applyCategoryColorStyles(item, categoryColor, { backgroundAlpha: 0.14, borderAlpha: 0.3 });
        }
        const title = document.createElement('strong');
        title.textContent = category.name;
        if (categoryColor && typeof createCategoryColorIndicator === 'function') {
          const indicator = createCategoryColorIndicator(categoryColor, category.name);
          if (indicator) {
            title.classList.add('with-category-color');
            title.prepend(indicator);
          }
        }
        item.appendChild(title);

        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.appendChild(document.createElement('span')).textContent = translateGender
          ? translateGender(category.gender)
          : category.gender || '';
        if (category.skillLevel) {
          meta.appendChild(document.createElement('span')).textContent = category.skillLevel;
        }
        item.appendChild(meta);

        const minimumAgeValue = Number(category.minimumAge);
        if (Number.isFinite(minimumAgeValue) && minimumAgeValue > 0) {
          const ageMeta = document.createElement('div');
          ageMeta.className = 'meta';
          const parts = [`Edad mínima: ${minimumAgeValue} años`];
          if (category.minimumAgeReferenceYear) {
            parts.push(`Referencia: ${category.minimumAgeReferenceYear}`);
          }
          ageMeta.textContent = parts.join(' · ');
          item.appendChild(ageMeta);
        }

        const categoryLeague = resolveLeague ? resolveLeague(category.league) : null;
        if (categoryLeague) {
          const leagueMeta = document.createElement('div');
          leagueMeta.className = 'meta meta-league-link';
          leagueMeta.appendChild(document.createElement('span')).textContent = 'Liga';
          const leagueTag = document.createElement('span');
          leagueTag.className = 'tag league-tag';
          leagueTag.textContent = categoryLeague.year
            ? `${categoryLeague.name} · ${categoryLeague.year}`
            : categoryLeague.name || 'Liga';
          if (categoryLeague.status === 'cerrada') {
            leagueTag.classList.add('league-tag--closed');
          }
          leagueMeta.appendChild(leagueTag);
          item.appendChild(leagueMeta);
        }

        const dates = [];
        if (category.startDate && typeof formatDateInput === 'function') {
          dates.push(`Inicio: ${formatDateInput(category.startDate)}`);
        }
        if (category.endDate && typeof formatDateInput === 'function') {
          dates.push(`Fin: ${formatDateInput(category.endDate)}`);
        }
        if (dates.length) {
          const dateMeta = document.createElement('div');
          dateMeta.className = 'meta';
          dateMeta.textContent = dates.join(' · ');
          item.appendChild(dateMeta);
        }

        const actions = document.createElement('div');
        actions.className = 'actions';
        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.className = 'secondary';
        editButton.textContent = 'Editar';
        editButton.dataset.categoryId = category._id || category.id;
        editButton.dataset.action = 'edit';
        actions.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'danger';
        deleteButton.textContent = 'Eliminar';
        deleteButton.dataset.categoryId = category._id || category.id;
        deleteButton.dataset.action = 'delete';
        actions.appendChild(deleteButton);
        item.appendChild(actions);

        adminCategoryList.appendChild(item);
      });
  }

  function resetAdminCategoryForm() {
    if (!adminCategoryForm) return;
    adminCategoryForm.reset();
    state.adminCategoryEditingId = null;
    const submit = adminCategoryForm.querySelector('.primary');
    if (submit) {
      submit.textContent = 'Guardar categoría';
    }
    if (adminCategoryCancel) {
      adminCategoryCancel.hidden = true;
    }
    if (adminCategoryForm.elements?.leagueId) {
      adminCategoryForm.elements.leagueId.value = '';
    }
    if (adminCategoryForm.elements?.color) {
      adminCategoryForm.elements.color.value = DEFAULT_CATEGORY_COLOR;
    }
  }

  function setAdminCategoryEditing(categoryId) {
    if (!adminCategoryForm) return;
    const category = state.categories.find((item) => (item._id || item.id) === categoryId);
    if (!category) return;

    state.adminCategoryEditingId = categoryId;
    adminCategoryForm.elements.name.value = category.name || '';
    adminCategoryForm.elements.description.value = category.description || '';
    adminCategoryForm.elements.gender.value = category.gender || 'masculino';
    adminCategoryForm.elements.skillLevel.value = category.skillLevel || '';
    if (adminCategoryForm.elements.startDate && typeof formatDateInput === 'function') {
      adminCategoryForm.elements.startDate.value = formatDateInput(category.startDate);
    }
    if (adminCategoryForm.elements.endDate && typeof formatDateInput === 'function') {
      adminCategoryForm.elements.endDate.value = formatDateInput(category.endDate);
    }
    if (adminCategoryForm.elements.leagueId) {
      adminCategoryForm.elements.leagueId.value = normalizeId(category.league) || '';
    }
    if (adminCategoryForm.elements.color && typeof getCategoryColor === 'function') {
      adminCategoryForm.elements.color.value = getCategoryColor(category);
    }

    const submit = adminCategoryForm.querySelector('.primary');
    if (submit) {
      submit.textContent = 'Actualizar categoría';
    }
    if (adminCategoryCancel) {
      adminCategoryCancel.hidden = false;
    }
    adminCategoryForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function openCategoryModal(categoryId = '') {
    if (!isAdmin()) return;
    const normalizedId = categoryId || '';
    const category = normalizedId
      ? state.categories.find((item) => normalizeId(item) === normalizedId)
      : null;

    const form = document.createElement('form');
    form.className = 'form';
    const skillLevelOptions = CATEGORY_SKILL_LEVEL_OPTIONS.map(
      (option) => `<option value="${option.value}">${option.label}</option>`
    ).join('');
    form.innerHTML = `
    <label>
      Nombre
      <input type="text" name="name" required />
    </label>
    <label>
      Descripción
      <textarea name="description" rows="2" maxlength="280" placeholder="Detalles opcionales"></textarea>
    </label>
    <label data-field="league">
      Liga
      <select name="leagueId" required>
        <option value="">Selecciona una liga</option>
      </select>
      <span class="form-hint">Selecciona la liga a la que pertenecerá la categoría.</span>
    </label>
    <div class="form-grid">
      <label>
        Género
        <select name="gender" required>
          <option value="masculino">Masculino</option>
          <option value="femenino">Femenino</option>
          <option value="mixto">Mixto</option>
        </select>
      </label>
      <label>
        Nivel
        <select name="skillLevel" required>
          <option value="">Selecciona un nivel</option>
          ${skillLevelOptions}
        </select>
      </label>
    </div>
    <label>
      Estado
      <select name="status" required>
        <option value="inscripcion">Inscripción abierta</option>
        <option value="en_curso">En curso</option>
      </select>
      <span class="form-hint">Cuando está en curso no se aceptan nuevas inscripciones.</span>
    </label>
    <label>
      Formato de partido
      <select name="matchFormat" required>
        ${CATEGORY_MATCH_FORMAT_OPTIONS.map(
          (option) => `<option value="${option.value}">${option.label}</option>`
        ).join('')}
      </select>
      <span class="form-hint">Define cómo se registrarán los resultados de la categoría.</span>
    </label>
    ${renderCategoryColorField({
      name: 'color',
      selected: category && typeof getCategoryColor === 'function'
        ? getCategoryColor(category)
        : DEFAULT_CATEGORY_COLOR,
      hint: 'Se utilizará para identificar la categoría en listas y calendarios.',
    })}
    <label>
      Edad mínima (años)
      <input type="number" name="minimumAge" min="0" step="1" placeholder="Opcional" />
      <span class="form-hint">Los jugadores deben cumplir esta edad durante el año natural de la liga.</span>
    </label>
    <div class="form-actions">
      <button type="submit" class="primary">${category ? 'Actualizar' : 'Crear'} categoría</button>
      <button type="button" class="ghost" data-action="cancel">Cancelar</button>
    </div>
  `;

    form.elements.name.value = category?.name || '';
    form.elements.description.value = category?.description || '';
    form.elements.gender.value = category?.gender || 'masculino';
    form.elements.skillLevel.value = category?.skillLevel || '';
    if (form.elements.minimumAge) {
      form.elements.minimumAge.value =
        category?.minimumAge === undefined || category?.minimumAge === null
          ? ''
          : Number(category.minimumAge);
    }
    if (form.elements.status) {
      form.elements.status.value = category?.status || 'inscripcion';
    }
    if (form.elements.matchFormat) {
      form.elements.matchFormat.value = category?.matchFormat || DEFAULT_CATEGORY_MATCH_FORMAT;
    }
    if (form.elements.color && typeof getCategoryColor === 'function') {
      const colorValue = category ? getCategoryColor(category) : DEFAULT_CATEGORY_COLOR;
      form.elements.color.value = colorValue || DEFAULT_CATEGORY_COLOR;
    }

    const leagueSelect = form.elements.leagueId;
    const leagueField = form.querySelector('[data-field="league"]');
    const leagueHint = leagueField?.querySelector('.form-hint');
    const currentLeagueId = normalizeId(category?.league);
    if (leagueSelect) {
      const availableLeagues = Array.isArray(state.leagues) ? [...state.leagues] : [];
      if (!availableLeagues.length && category?.league && typeof category.league === 'object') {
        availableLeagues.push(category.league);
      }

      availableLeagues
        .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'))
        .forEach((league) => {
          const leagueId = normalizeId(league);
          if (!leagueId) return;
          const labelParts = [league.name || 'Liga'];
          if (league.year) {
            labelParts.push(league.year);
          }
          const option = document.createElement('option');
          option.value = leagueId;
          option.textContent = labelParts.join(' · ');
          const isClosed = league.status === 'cerrada';
          if (isClosed && leagueId !== currentLeagueId) {
            option.disabled = true;
            option.textContent += ' (cerrada)';
          }
          leagueSelect.appendChild(option);
        });

      let hasEnabledOption = Array.from(leagueSelect.options).some((option) => !option.disabled && option.value);

      if (currentLeagueId) {
        leagueSelect.value = currentLeagueId;
        hasEnabledOption = true;
      } else if (hasEnabledOption) {
        const preferred = availableLeagues.find((league) => league.status !== 'cerrada');
        if (preferred) {
          leagueSelect.value = normalizeId(preferred);
        } else if (leagueSelect.options.length > 1) {
          leagueSelect.selectedIndex = 1;
        }
      }

      leagueSelect.disabled = !hasEnabledOption;

      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton && !category) {
        submitButton.disabled = leagueSelect.disabled;
      }

      if (leagueHint) {
        leagueHint.textContent = leagueSelect.disabled && !category
          ? 'Crea una liga activa antes de registrar categorías.'
          : 'Selecciona la liga a la que pertenecerá la categoría.';
      }
    }

    const status = document.createElement('p');
    status.className = 'status-message';
    status.style.display = 'none';

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const succeeded = await submitCategoryFormData({
        form,
        categoryId: normalizedId,
        statusElement: status,
      });
      if (succeeded) {
        closeModal();
      }
    });

    const cancelButton = form.querySelector('[data-action="cancel"]');
    cancelButton?.addEventListener('click', () => {
      setStatusMessage(status, '', '');
      closeModal();
    });

    openModal({
      title: category ? 'Editar categoría' : 'Nueva categoría',
      content: (body) => {
        body.appendChild(form);
        body.appendChild(status);
      },
      onClose: () => setStatusMessage(status, '', ''),
    });
  }

  return {
    updateCategoryControlsAvailability,
    updateCategoryFilterControls,
    renderCategories,
    submitCategoryFormData,
    renderAdminCategoryList,
    resetAdminCategoryForm,
    setAdminCategoryEditing,
    openCategoryModal,
  };
}
